/**
 * ============================================================
 * LEGACYCAPSULE — app/for/[slug]/honouree/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Private honouree / family rep portal.
 * Route: /for/[slug]/honouree
 *       /for/[slug]/honouree?token=[token]
 *
 * Auth gate (D54):
 *   Priority 1 — valid session cookie (returning visitor)
 *   Priority 2 — valid ?token= param (first-time link click)
 *   Priority 3 — neither → access required page
 *
 * Tier gate:
 *   Legacy Honour + Legacy Premier — full portal
 *   Free tier — sees upgrade prompt (not 404)
 *
 * Server component — auth happens server-side.
 * Portal section panels are client components.
 */

import { notFound }   from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  checkPortalAuth,
  tierGrantsPortalAccess,
}                     from '@/lib/portalAuth';
import { getEventTypeLabel, getEventTypeEmoji } from '@/lib/eventLabels';
import PortalShell    from '@/components/honouree/PortalShell';


// ============================================================
// SECTION 1 — Admin client
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


// ============================================================
// SECTION 2 — Upgrade prompt (free tier)
// ============================================================

function UpgradePrompt({ slug, honoureeName }: { slug: string; honoureeName: string }) {
  return (
    <div className="min-h-screen bg-[#0D0820] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto">
          <span aria-hidden="true" className="text-yellow-400 text-2xl">✦</span>
        </div>
        <div>
          <p className="text-[10px] text-yellow-400/50 uppercase tracking-[0.2em] mb-2">
            LegacyCapsule
          </p>
          <h1 className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            The Personal Portal
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            The personal portal for {honoureeName} is available on
            Legacy Honour and Legacy Premier. Upgrade to access all
            tributes, send appreciations, and manage gifting details.
          </p>
        </div>
        <div className="space-y-3">
          <a
            href={`/manage/${slug}?upgrade=portal`}
            className="
              block w-full py-3.5 rounded-xl font-bold text-sm
              bg-gradient-to-b from-yellow-400 to-yellow-500
              text-purple-950 hover:from-yellow-300 transition-colors
            "
          >
            Upgrade to unlock the portal
          </a>
          <a
            href={`/for/${slug}`}
            className="
              block w-full py-3 rounded-xl text-sm
              border border-white/10 text-white/40
              hover:text-white/60 hover:border-white/20 transition-colors
            "
          >
            Back to tribute wall
          </a>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// SECTION 3 — Access required page (no valid auth)
// ============================================================

function AccessRequired({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-[#0D0820] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <p className="text-[10px] text-yellow-400/50 uppercase tracking-[0.2em]">
          LegacyCapsule
        </p>
        <div>
          <h1 className="text-xl font-bold text-white mb-3">
            Private portal
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            This portal is private. Please use the access link
            from your reveal email to enter.
          </p>
        </div>
        <a
          href={`/for/${slug}`}
          className="
            block w-full py-3 rounded-xl text-sm
            border border-white/10 text-white/40
            hover:text-white/60 transition-colors
          "
        >
          Back to tribute wall
        </a>
      </div>
    </div>
  );
}


// ============================================================
// SECTION 4 — Page component
// ============================================================

interface PageProps {
  params:      { slug: string };
  searchParams: { token?: string };
}

export default async function HonoureePortalPage({
  params,
  searchParams,
}: PageProps) {
  const { slug }  = params;
  const { token } = searchParams;

  // ── 4.1  Fetch capsule ─────────────────────────────────────

  const { data: capsule } = await adminClient
    .from('capsules')
    .select(`
      id, slug, honouree_name, family_rep_name, family_rep_email,
      event_type, event_tag, event_date, tier, page_state
    `)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) return notFound();


  // ── 4.2  Tier gate — free tier sees upgrade prompt ─────────

  if (!tierGrantsPortalAccess(capsule.tier)) {
    return (
      <UpgradePrompt
        slug={slug}
        honoureeName={capsule.honouree_name}
      />
    );
  }


  // ── 4.3  Auth gate ─────────────────────────────────────────

  const auth = await checkPortalAuth(slug, token);

  if (!auth.valid) {
    return <AccessRequired slug={slug} />;
  }

  const capsuleId = auth.capsuleId!;


  // ── 4.4  Fetch overview data ───────────────────────────────

  const [contribRes, countryRes, ackRes] = await Promise.all([
    // Total approved tribute count
    adminClient
      .from('contributions')
      .select('id', { count: 'exact' })
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null),

    // Countries breakdown
    adminClient
      .from('contributions')
      .select('country')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .not('country', 'is', null),

    // Gift acknowledgements count
    adminClient
      .from('support_acknowledgements')
      .select('id', { count: 'exact' })
      .eq('capsule_id', capsuleId),
  ]);

  const tributeCount  = contribRes.count  ?? 0;
  const ackCount      = ackRes.count       ?? 0;
  const countries     = [...new Set((countryRes.data ?? []).map(r => r.country))].filter(Boolean);
  const countryCount  = countries.length;

  // Reachable (have email, non-anonymous) — for appreciation stats
  const { count: reachableCount } = await adminClient
    .from('contributions')
    .select('id', { count: 'exact' })
    .eq('capsule_id', capsuleId)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .not('email', 'is', null)
    .eq('is_anonymous', false);


  // ── 4.5  Render portal shell ───────────────────────────────

  return (
    <PortalShell
      capsuleId={capsuleId}
      slug={slug}
      honoureeName={capsule.honouree_name}
      familyRepName={capsule.family_rep_name}
      familyRepEmail={capsule.family_rep_email}
      eventType={capsule.event_type}
      eventTag={capsule.event_tag}
      sessionType={auth.sessionType ?? 'link'}
      overview={{
        tributeCount,
        countryCount,
        countries,
        ackCount,
        reachableCount: reachableCount ?? 0,
      }}
    />
  );
}


// ============================================================
// SECTION 5 — Metadata
// ============================================================

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title:  `Personal Portal | LegacyCapsule`,
    robots: { index: false, follow: false },
  };
}
