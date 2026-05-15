/**
 * ============================================================
 * LEGACYCAPSULE — app/manage/[slug]/publication/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Server component entry point for the Publication Editor.
 *
 * Route: /manage/[slug]/publication
 * Accessed from: the organiser's Capsule manage page
 * → /manage/[slug] (the existing manage page built in Phase 1)
 *
 * Responsibilities:
 *   1. Read the capsule slug from route params
 *   2. Resolve the capsule UUID from Supabase — server-side,
 *      so the client component never needs to do this lookup
 *   3. Gate on deleted_at — suspended/deleted capsules return 404
 *   4. Render PublicationEditor (client component) with
 *      capsuleId and capsuleSlug as props
 *
 * Authentication:
 *   Phase 1 — open, consistent with permissive RLS.
 *   Phase 2 — validate organiser session token (cookie or header)
 *             before rendering. Redirect to /manage/[slug] login
 *             gate if missing or expired.
 *
 * Tier gate (Phase 1.5+):
 *   Publication is a Legacy Premier feature.
 *   The commented-out tier check below activates when payment
 *   tiers are enforced. Redirects to the upgrade prompt on the
 *   manage page if the capsule is on Legacy Honour tier.
 */

import { notFound }      from 'next/navigation';
import { createClient }  from '@supabase/supabase-js';
import PublicationEditor from '@/components/publication/PublicationEditor';


// ============================================================
// SECTION 1 — Supabase admin client (server-side only)
// Used for the slug → id lookup before rendering.
// The service role key never reaches the client component.
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


// ============================================================
// SECTION 2 — Page component
// ============================================================

interface PageProps {
  params: { slug: string };
}

export default async function PublicationPage({ params }: PageProps) {
  const { slug } = params;


  // ── 2.1  Resolve capsule record from slug ─────────────────

  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, page_state, tier')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !capsule) {
    return notFound();
  }


  // ── 2.2  Tier gate — uncomment in Phase 1.5 ──────────────
  //
  // Publication Engine is a Legacy Premier feature.
  // Legacy Honour capsules are redirected to the upgrade prompt.
  //
  // import { redirect } from 'next/navigation';
  // if (capsule.tier !== 'full_platform') {
  //   redirect(`/manage/${slug}?upgrade=publication`);
  // }


  // ── 2.3  Page shell + editor ──────────────────────────────

  return (
    <div
      className="h-screen flex flex-col bg-[#0a0010] overflow-hidden"
      aria-label="Publication Editor"
    >

      {/* ── Slim top bar ──────────────────────────────────── */}
      <header className="
        flex-shrink-0 flex items-center justify-between
        px-6 py-3
        border-b border-yellow-400/10
        bg-[#0a0010]
      ">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-yellow-200 tracking-tight">
            LegacyCapsule
          </span>
          <span aria-hidden="true" className="text-white/20 text-xs">/</span>
          <span className="text-xs text-white/40">Publication Editor</span>
        </div>
        <span className="text-[10px] text-white/25 font-mono truncate max-w-[140px]">
          {slug}
        </span>
      </header>

      {/* ── Editor — fills remaining height ───────────────── */}
      <div className="flex-1 min-h-0">
        <PublicationEditor
          capsuleId={capsule.id}
          capsuleSlug={capsule.slug}
        />
      </div>

    </div>
  );
}


// ============================================================
// SECTION 3 — Metadata
// ============================================================

export async function generateMetadata({ params }: PageProps) {
  return {
    title:   `Publication Editor — ${params.slug} | LegacyCapsule`,
    robots:  { index: false, follow: false },
  };
}
