/**
 * LEGACYCAPSULE — /api/publication/save
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 *
 * POST — Save the current layout_config to Supabase.
 *
 * Called by the Publication Editor every time the organiser makes a change.
 * Debounced on the client — fires after 800ms of inactivity to avoid
 * excessive writes on rapid interactions (e.g. fast photo swaps).
 *
 * This route writes layout_config and updated_at only.
 * It does not trigger PDF generation. PDF generation is a separate
 * explicit action via /api/publication/generate.
 *
 * Concurrency: The route uses updated_at for optimistic concurrency.
 * If two sessions save simultaneously, the last write wins.
 * In Phase 2, this can be upgraded to true optimistic locking using
 * a version counter check before updating.
 *
 * Authentication: Uses service role key (admin client).
 * Authenticated via organiser session in Phase 2.
 * Open in Phase 1 consistent with permissive RLS policy.
 *
 * Body: {
 *   capsule_id: string
 *   layout_config: LayoutConfig
 * }
 *
 * Response: { ok: true }
 *
 * Error responses:
 *   400 — missing or invalid body fields
 *   404 — no publication record found for this capsule_id
 *   500 — database write failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  PublicationSaveRequest,
  PublicationSaveResponse,
  LayoutConfig,
} from '@/lib/publication/types';

// Admin client — service role. Server-side only.
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse and validate body ─────────────────────────────
  let body: PublicationSaveRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { capsule_id, layout_config } = body;

  if (!capsule_id || typeof capsule_id !== 'string') {
    return NextResponse.json(
      { error: 'capsule_id is required and must be a string' },
      { status: 400 }
    );
  }

  if (!layout_config || typeof layout_config !== 'object') {
    return NextResponse.json(
      { error: 'layout_config is required and must be an object' },
      { status: 400 }
    );
  }

  // ── 2. Validate layout_config has minimum required structure ─
  const config = layout_config as LayoutConfig;
  if (!config.theme || !config.sections || !Array.isArray(config.sections)) {
    return NextResponse.json(
      { error: 'layout_config is malformed: missing theme or sections array' },
      { status: 400 }
    );
  }

  // ── 3. Verify publication record exists for this capsule ───
  const { data: existing, error: checkError } = await adminClient
    .from('publications')
    .select('id')
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (checkError) {
    console.error('[publication/save] Error checking publication:', checkError);
    return NextResponse.json(
      { error: 'Failed to verify publication record' },
      { status: 500 }
    );
  }

  if (!existing) {
    // Publication not yet initialised — client should call /api/publication/init first
    return NextResponse.json(
      {
        error: 'No publication found for this capsule. Call /api/publication/init first.',
        code: 'PUBLICATION_NOT_INITIALISED',
      },
      { status: 404 }
    );
  }

  // ── 4. Write layout_config to Supabase ─────────────────────
  const { error: updateError } = await adminClient
    .from('publications')
    .update({
      layout_config: config,
      arrangement_source: config.arrangement_source,
      // Keep theme and cover_style columns in sync with layout_config
      // (they are denormalised for easier LCAdmin querying)
      theme: config.theme,
      cover_style: config.cover_style,
      updated_at: new Date().toISOString(),
    })
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null);

  if (updateError) {
    console.error('[publication/save] Update failed:', updateError);
    return NextResponse.json(
      { error: `Failed to save layout: ${updateError.message}` },
      { status: 500 }
    );
  }

  // ── 5. Return success ──────────────────────────────────────
  const response: PublicationSaveResponse = { ok: true };
  return NextResponse.json(response);
}

// Prevent non-POST requests
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
