/**
 * ============================================================
 * LEGACYCAPSULE — /api/publication/generate
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * POST — Orchestrate the full PDF generation pipeline.
 *
 * This is the heaviest route in the system. It:
 *   1.  Validates the request and confirms a publication record exists
 *   2.  Writes a one-time render_token to the publications row
 *   3.  Marks generation_status as 'rendering'
 *   4.  Launches Puppeteer (serverless Chromium via @sparticuz/chromium)
 *   5.  Navigates to /publication-render/[token] and waits for networkidle0
 *   6.  Waits for all <img> elements to fully load
 *   7.  Prints the page to a PDF buffer (A4, print backgrounds enabled)
 *   8.  Extracts the page_map (contribution_id → page number) from the DOM
 *   9.  Uploads the PDF buffer to Supabase Storage (capsule-publications bucket)
 *   10. Generates a 10-year signed URL for the organiser download link
 *   11. Updates the publications row with pdf_url, page_map, status: 'complete'
 *   12. Nulls the render_token immediately (one-time use — cannot be replayed)
 *   13. Returns { pdf_url, page_map } to the caller
 *
 * On any error: marks generation_status as 'failed', writes generation_error,
 * nulls the render_token, closes the browser, and returns a 500.
 *
 * Authentication:
 *   Uses SUPABASE_SERVICE_ROLE_KEY. Server-side only.
 *   In Phase 1: open route, consistent with permissive RLS policy.
 *   In Phase 2: validate organiser session before generation.
 *
 * Vercel timeout:
 *   Set maxDuration = 60 (Hobby plan) or 300 (Pro plan).
 *   Large publications (500+ tributes, 100 photos/phase) need Pro.
 *
 * Required npm packages (run in project root before deploying):
 *   npm install puppeteer-core @sparticuz/chromium
 *
 * Required next.config.js entry:
 *   experimental: { serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'] }
 *
 * Request body:  { capsule_id: string }
 * Success (200): { pdf_url: string, page_map: Record<string, number> }
 * Error (400):   { error: string }
 * Error (404):   { error: string }
 * Error (500):   { error: string }
 */

import { NextRequest, NextResponse }  from 'next/server';
import { createClient }               from '@supabase/supabase-js';
import chromium                       from '@sparticuz/chromium';
import puppeteer                      from 'puppeteer-core';
import crypto                         from 'crypto';
import type { PublicationGenerateRequest } from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Vercel function timeout
// Set to maximum available on your Vercel plan.
// Hobby: 60s. Pro: 300s.
// Large events (200+ photos + 300+ tributes) may need Pro plan.
// ============================================================

export const maxDuration = 60; // seconds — upgrade to 300 on Vercel Pro


// ============================================================
// SECTION 2 — Supabase admin client and constants
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Base URL of the Next.js app — used to build the Puppeteer render URL. */
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Storage bucket name — must match the bucket created in SQL migration. */
const PDF_BUCKET = 'capsule-publications';

/** Signed URL validity for the PDF download link — 10 years in seconds. */
const PDF_SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

/**
 * A4 page height in pixels at 96 DPI (Puppeteer default).
 * Used to estimate page number from element Y position.
 * 210mm × 297mm at 96 DPI ≈ 794px × 1122px.
 * Adjust if PDF DPI differs: await page.evaluate(() => window.devicePixelRatio)
 */
const A4_PAGE_HEIGHT_PX = 1122;


// ============================================================
// SECTION 3 — Route handler
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── 3.1  Parse and validate request body ──────────────────

  let body: PublicationGenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }

  const { capsule_id } = body;

  if (!capsule_id || typeof capsule_id !== 'string' || capsule_id.trim() === '') {
    return NextResponse.json(
      { error: 'capsule_id is required and must be a non-empty string.' },
      { status: 400 }
    );
  }


  // ── 3.2  Fetch publication record ─────────────────────────
  //
  // Confirms the publication has been initialised (/api/publication/init)
  // before attempting generation. Also retrieves current version number
  // for the PDF filename (v1, v2, etc. on regeneration).

  const { data: pub, error: pubErr } = await adminClient
    .from('publications')
    .select('id, layout_config, version, generation_status')
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (pubErr) {
    console.error('[publication/generate] fetch pub:', pubErr.message);
    return NextResponse.json(
      { error: `Database error: ${pubErr.message}` },
      { status: 500 }
    );
  }

  if (!pub) {
    return NextResponse.json(
      {
        error: 'Publication not initialised. Call /api/publication/init first.',
        code: 'PUBLICATION_NOT_INITIALISED',
      },
      { status: 404 }
    );
  }

  // Guard against concurrent generation requests for the same capsule
  if (pub.generation_status === 'rendering') {
    return NextResponse.json(
      { error: 'PDF generation already in progress for this capsule. Try again after it completes.' },
      { status: 409 }
    );
  }


  // ── 3.3  Write render token and mark as rendering ──────────
  //
  // render_token is a 32-byte hex string (64 chars).
  // It authenticates Puppeteer against the hidden render route.
  // It is nulled in the finally block regardless of success or failure.
  // Any subsequent attempt to visit the render route with a nulled token
  // returns 404 immediately.

  const renderToken = crypto.randomBytes(32).toString('hex');
  const generationStartedAt = new Date().toISOString();

  const { error: tokenErr } = await adminClient
    .from('publications')
    .update({
      render_token:          renderToken,
      generation_status:     'rendering',
      generation_started_at: generationStartedAt,
      generation_error:      null,
    })
    .eq('id', pub.id);

  if (tokenErr) {
    console.error('[publication/generate] set render_token:', tokenErr.message);
    return NextResponse.json(
      { error: `Failed to initialise generation: ${tokenErr.message}` },
      { status: 500 }
    );
  }


  // ── 3.4  PDF generation (Puppeteer pipeline) ──────────────
  //
  // All Puppeteer work is inside this try/catch.
  // The finally block always closes the browser and nulls the token.

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {

    // ── 3.4a  Launch serverless Chromium ───────────────────
    //
    // @sparticuz/chromium is required on Vercel — the full Puppeteer
    // bundle exceeds Vercel's function size limit.
    // executablePath() resolves to the bundled Chromium binary.

    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath:  await chromium.executablePath(),
      headless:        true,
    });

    const page = await browser.newPage();


    // ── 3.4b  Navigate to hidden render route ─────────────
    //
    // networkidle0: wait until no network requests for 500ms.
    // This ensures all signed image URLs have been fetched.
    // 120s timeout accommodates large publications with many images.

    const renderUrl = `${APP_URL}/publication-render/${renderToken}`;

    await page.goto(renderUrl, {
      waitUntil: 'networkidle0',
      timeout:   120_000,
    });


    // ── 3.4c  Wait for all images to fully load ────────────
    //
    // networkidle0 catches network requests but not image decode.
    // This additional wait ensures no broken/blank images in the PDF.

    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.onload  = () => resolve();
                img.onerror = () => resolve(); // Don't block on broken images
              })
        )
      );
    });


    // ── 3.4d  Print page to PDF ───────────────────────────
    //
    // printBackground: true — required for background colours and images.
    // preferCSSPageSize: false — use the @page { size: A4 } from our CSS.
    // No top-level margins — the publication page manages its own padding.

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      preferCSSPageSize: false,
    });


    // ── 3.4e  Extract page_map from DOM ───────────────────
    //
    // Each tribute card has data-contribution-id on its container element.
    // We read the element's bounding rect Y position and divide by the
    // A4 page height in pixels to approximate the page number.
    //
    // Important: page numbers are 1-indexed.
    // Calibration note: if page numbers are consistently off, check
    //   await page.evaluate(() => window.devicePixelRatio)
    // and adjust A4_PAGE_HEIGHT_PX accordingly.

    const pageMap: Record<string, number> = await page.evaluate((a4Height: number) => {
      const map: Record<string, number> = {};
      const cards = document.querySelectorAll('[data-contribution-id]');
      cards.forEach(card => {
        const id   = card.getAttribute('data-contribution-id');
        const rect = card.getBoundingClientRect();
        if (id) {
          // rect.top + scrollY gives position relative to the document top
          const pageNum = Math.ceil((rect.top + window.scrollY + 1) / a4Height);
          map[id] = Math.max(1, pageNum); // minimum page 1
        }
      });
      return map;
    }, A4_PAGE_HEIGHT_PX);


    // ── 3.4f  Upload PDF to Supabase Storage ──────────────
    //
    // Filename format: {capsule_id}/v{version}_{timestamp}.pdf
    // Version increments on each successful generation.
    // Previous PDF is overwritten (upsert: true) to avoid storage bloat.

    const nextVersion = (pub.version ?? 1) + 1;
    const fileName    = `${capsule_id}/v${nextVersion}_${Date.now()}.pdf`;

    const { error: uploadErr } = await adminClient.storage
      .from(PDF_BUCKET)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert:      true,
      });

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }


    // ── 3.4g  Generate signed download URL ────────────────
    //
    // 10-year TTL — the PDF is a permanent keepsake.
    // The organiser shares or downloads this URL from the editor.
    // URL is re-generated on each successful generation.

    const { data: signedData, error: signErr } = await adminClient.storage
      .from(PDF_BUCKET)
      .createSignedUrl(fileName, PDF_SIGNED_URL_TTL);

    if (signErr || !signedData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signErr?.message ?? 'unknown error'}`);
    }

    const pdfUrl = signedData.signedUrl;


    // ── 3.4h  Update publications record ──────────────────
    //
    // Two updates in sequence:
    //   i.  Core generation result — pdf_url, page_map, status, version
    //   ii. layout_config page_map sync — keeps layout_config.page_map
    //       in sync so the editor and distribution email can read it
    //       directly from layout_config without a separate page_map join.

    await adminClient
      .from('publications')
      .update({
        pdf_url:                  pdfUrl,
        pdf_size_bytes:           pdfBuffer.length,
        page_map:                 pageMap,
        generation_status:        'complete',
        generation_completed_at:  new Date().toISOString(),
        generation_error:         null,
        render_token:             null,   // Invalidate immediately
        version:                  nextVersion,
        updated_at:               new Date().toISOString(),
      })
      .eq('id', pub.id);

    // Sync page_map into layout_config.page_map
    const updatedLayoutConfig = {
      ...(pub.layout_config as object),
      page_map: pageMap,
    };

    await adminClient
      .from('publications')
      .update({ layout_config: updatedLayoutConfig })
      .eq('id', pub.id);


    // ── 3.4i  Return success ───────────────────────────────

    return NextResponse.json({ pdf_url: pdfUrl, page_map: pageMap }, { status: 200 });

  } catch (err: unknown) {

    // ── 3.5  Error handling ────────────────────────────────
    //
    // Any error during Puppeteer, upload, or URL signing lands here.
    // Mark the publication as failed. The organiser sees an error state
    // in the editor UI and can retry.

    const errorMessage = err instanceof Error ? err.message : 'Unknown error during PDF generation';
    console.error('[publication/generate] pipeline error:', errorMessage);

    await adminClient
      .from('publications')
      .update({
        generation_status: 'failed',
        generation_error:  errorMessage,
        render_token:      null,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', pub.id);

    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 }
    );

  } finally {

    // ── 3.6  Always close the browser ─────────────────────
    //
    // Runs whether generation succeeded or failed.
    // A leaked browser process will exhaust Vercel memory allocation.

    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('[publication/generate] browser.close() failed:', closeErr);
      }
    }
  }
}


// ============================================================
// SECTION 4 — Block non-POST methods
// ============================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
