/**
 * ============================================================
 * FILE: app/publication/[slug]/page.tsx
 * PURPOSE: Permanent public publication URL — slug-based.
 *          Replaces token-based URL for distribution.
 *          URL never expires. Content updates on regenerate.
 *          Safe to print on programmes, share on WhatsApp,
 *          embed in emails — link is permanent.
 * ARCHITECTURE: LC03 Legacy Publication System
 * BUILT BY: AI19 · Claude Sonnet 4.6 · 10 August 2026
 * VERSION: AI19v2.11.95
 * ============================================================
 */

import { notFound }    from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ── Re-use the token render page's render logic by fetching
//    the current render_token for this capsule and redirecting
//    server-side to the render pipeline.
//    This keeps all render logic in one place.

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('honouree_name, event_tag')
    .eq('slug', slug)
    .maybeSingle();

  if (!capsule) return { title: 'Publication — LegacyCapsule' };

  return {
    title: `${capsule.honouree_name} — LegacyCapsule Publication`,
    description: capsule.event_tag
      ? `${capsule.event_tag} · A keepsake publication assembled by LegacyCapsule.`
      : `A keepsake publication for ${capsule.honouree_name}, assembled by LegacyCapsule.`,
    openGraph: {
      title:       `${capsule.honouree_name} — LegacyCapsule`,
      description: `A permanent keepsake — voices, memories, and photographs gathered for this occasion.`,
      siteName:    'LegacyCapsule',
    },
  };
}

// ═══ SECTION 1 — Page component ═══

export default async function PublicationSlugPage({ params }: Props) {
  const { slug } = await params;

  // ── Resolve capsule + publication ─────────────────────────
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id, honouree_name')
    .eq('slug', slug)
    .maybeSingle();

  if (!capsule) return notFound();

  const { data: pub } = await adminClient
    .from('publications')
    .select('render_token, generated_at')
    .eq('capsule_id', capsule.id)
    .maybeSingle();

  // Publication not yet generated — show holding page
  if (!pub?.render_token) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0a000e',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            '20px',
        fontFamily:     'Georgia, serif',
        textAlign:      'center',
        padding:        '40px 24px',
      }}>
        <div style={{ width: '40px', height: '3px', background: '#C9A84C', borderRadius: '2px', margin: '0 auto 8px' }} />
        <p style={{ fontSize: '11px', color: 'rgba(226,195,107,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
          LEGACYCAPSULE
        </p>
        <h1 style={{ fontSize: '28px', color: '#FFFFFF', fontWeight: 700, margin: '8px 0 0', lineHeight: 1.2 }}>
          {capsule.honouree_name}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: '16px 0 0', lineHeight: 1.8, maxWidth: '400px' }}>
          This publication is being prepared.<br />
          You will receive it by email when it is ready.
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(226,195,107,0.3)', margin: '32px 0 0', letterSpacing: '0.1em' }}>
          itslegacycapsule.com
        </p>
      </div>
    );
  }

  // ── Publication exists — fetch capsuleId and render directly ──
  // Pass token to the render page as a server component import
  // so the slug URL stays in the browser bar permanently.
  const TokenPage = (await import('@/app/publication-render/[token]/page')).default;
  return TokenPage({ params: Promise.resolve({ token: pub.render_token }) });
}
