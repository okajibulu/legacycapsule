/**
 * FILE PATH: app/api/og/[slug]/route.tsx
 * GOVERNING SPECIFICATION: docs/specifications/OG02_COVER_SYSTEM.md
 * * AUTHORSHIP HISTORY:
 * - Original Edge Implementation: CG01 (Founder) — 26 June 2026
 * - Production-Grade Consolidated Engine: Worker GM01 — 04 July 2026
 * - Hotfix for Binary Font Streaming Protection: Worker GM01 — 04 July 2026
 * - Native Next.js OG Engine Alignment: Worker GM01 — 04 July 2026
 * - Next.js 16 Async Params Type Constraint Fix: Worker GM01 — 04 July 2026
 * * DESCRIPTION:
 * Authoritative dynamic Open Graph Cover engine executing on Vercel Edge Runtime.
 * Fully aligned with Next.js 16 async route params constraints (`params: Promise<{ slug: string }>`).
 * Streams binary TTF assets directly to guarantee high-gloss layout execution.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Robust Raw Binary Font Streamer
 * Fetches the absolute .ttf binary directly to avoid regex string matching failures.
 */
async function fetchRawFontBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to stream font asset binary directly from target location: ${url}`);
  }
  return await response.arrayBuffer();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Next.js 16 Compliance: Await the async params object
    const resolvedParams = await context.params;
    const slug = resolvedParams.slug;
    
    const { searchParams } = new URL(request.url);
    
    // Core parameters passed via request query hooks
    const defaultTitle = searchParams.get('title') || 'A Living Story';
    const defaultSubtitle = searchParams.get('subtitle') || 'Legacy Capsule';
    const layoutMode = searchParams.get('mode') || 'publication'; // 'publication' | 'hero'

    /**
     * Dynamic Context & Feature Flag Extraction
     * Parses custom layout settings passed via database properties.
     */
    let featuredQuote = '';
    let customAccent = 'rgba(234, 179, 8, 0.3)'; // Luxury Gold accent
    
    const rawAttributes = searchParams.get('cover_attributes');
    if (rawAttributes) {
      try {
        const attributes = JSON.parse(rawAttributes);
        if (attributes.featuredQuote?.text) {
          featuredQuote = attributes.featuredQuote.text;
        }
        if (attributes.customAccentColor) {
          customAccent = attributes.customAccentColor;
        }
      } catch (e) {
        console.error('Failed to parse injected cover_attributes context JSON structure');
      }
    }

    // Direct stream arrays of fixed, immutable font binaries to ensure Satori initialization
    const [playfairData, dmSansData] = await Promise.all([
      fetchRawFontBinary('https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZ24K1ACnZa50SfZc6-U_67_9t_b_Y7DGWY7btjW_b4.ttf'),
      fetchRawFontBinary('https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywgo0fiGC9G6C_mD1V86_c06X43_g.ttf')
    ]);

    const isHeroLayout = layoutMode === 'hero';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isHeroLayout ? 'flex-start' : 'center',
            justifyContent: isHeroLayout ? 'flex-end' : 'center',
            backgroundColor: isHeroLayout ? '#0B0F19' : '#0F172A', 
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Framed Graphic Border Layout (Publication Cover Preset variant) */}
          {!isHeroLayout && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '40px',
                right: '40px',
                bottom: '40px',
                border: `2px solid ${customAccent}`,
                display: 'flex',
              }}
            />
          )}

          {/* Hero Mode Background Asymmetric Left Accent Stripe */}
          {isHeroLayout && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '12px',
                backgroundColor: customAccent,
              }}
            />
          )}

          {/* Main Content Node Matrix */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isHeroLayout ? 'flex-start' : 'center',
              textAlign: isHeroLayout ? 'left' : 'center',
              maxWidth: '900px',
            }}
          >
            <h1
              style={{
                fontFamily: 'Playfair Display',
                fontSize: isHeroLayout ? '76px' : '56px',
                color: '#F8FAFC',
                marginBottom: '20px',
                lineHeight: 1.15,
              }}
            >
              {defaultTitle}
            </h1>
            
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '18px',
                color: isHeroLayout ? '#EA580C' : '#94A3B8', 
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: featuredQuote ? '36px' : '0px',
              }}
            >
              {defaultSubtitle}
            </p>

            {/* Injected Premium Focus Quote Section */}
            {featuredQuote && (
              <p
                style={{
                  fontFamily: 'Playfair Display',
                  fontSize: '26px',
                  fontStyle: 'italic',
                  color: '#E2E8F0',
                  borderTop: isHeroLayout ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderLeft: isHeroLayout ? '4px solid rgba(255, 255, 255, 0.15)' : 'none',
                  paddingTop: isHeroLayout ? '0px' : '20px',
                  paddingLeft: isHeroLayout ? '24px' : '0px',
                  marginTop: isHeroLayout ? '24px' : '0px',
                  maxWidth: '700px',
                }}
              >
                "{featuredQuote}"
              </p>
            )}
          </div>

          {/* Core Brand Narrative Standard Subtitle */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '60px',
              fontFamily: 'DM Sans',
              fontSize: '13px',
              color: 'rgba(148, 163, 184, 0.4)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Events End. Legacies Don’t.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: playfairData,
            style: 'normal',
            weight: 700,
          },
          {
            name: 'DM Sans',
            data: dmSansData,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
  } catch (error: any) {
    console.error(`Edge OG Engine Error: ${error.message}`);
    return new Response(`Failed to generate dynamic canvas image layer: ${error.message}`, { status: 500 });
  }
}