/**
 * ============================================================
 * LEGACYCAPSULE — app/for/[slug]/profile/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Public subject profile page.
 * Route: /for/[slug]/profile
 *
 * Any visitor can reach this page from the tribute wall hero link.
 * Sections only render when they have content — no empty shells.
 *
 * Security: account numbers are masked server-side before render.
 * The full account number NEVER reaches the client HTML.
 *
 * Server component — no 'use client'.
 */

import { notFound }  from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  getWaysToHonourLabel,
  getGiftAcknowledgeLabel,
  getEventTypeLabel,
  getEventTypeEmoji,
  getProfileSectionLabel,
} from '@/lib/eventLabels';
import WaysToHonourCard    from '@/components/honouree/WaysToHonourCard';


// ============================================================
// SECTION 1 — Admin client (server-side — account masking)
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Mask account number to last 4 digits — server-side only */
function maskAccountNumber(full: string | null): string {
  if (!full || full.length < 4) return '••••';
  return `••••${full.slice(-4)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}


// ============================================================
// SECTION 2 — Page component
// ============================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // ── 2.1  Fetch capsule ────────────────────────────────────
  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select(`
      id, slug, honouree_name, event_type, event_tag, event_date,
      page_state, tier, hero_image_url
    `)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !capsule) return notFound();

  // Only show profile page if capsule is beyond draft state
  if (capsule.page_state === 'draft') return notFound();


  // ── 2.2  Fetch all profile content in parallel ────────────

  const [profileRes, featuredRes, galleryRes, supportRes] = await Promise.all([
    adminClient
      .from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .not('content', 'is', null)
      .order('sort_order'),

    adminClient
      .from('capsule_featured_photos')
      .select('id, image_url, caption, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order'),

    adminClient
      .from('capsule_gallery')
      .select('id, image_url, caption, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order'),

    adminClient
      .from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, sort_order')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order'),
  ]);

  const profileSections = profileRes.data ?? [];
  const featuredPhotos  = featuredRes.data ?? [];
  const galleryPhotos   = galleryRes.data  ?? [];

  // ── Server-side account number masking (SECURITY — never skip) ──
  const supportAccounts = (supportRes.data ?? []).map(acc => ({
    ...acc,
    account_number: maskAccountNumber(acc.account_number),
  }));

  const hasWaysToHonour = supportAccounts.length > 0;
  const waysLabel       = getWaysToHonourLabel(capsule.event_type, capsule.honouree_name);
  const eventLabel      = getEventTypeLabel(capsule.event_type);
  const eventEmoji      = getEventTypeEmoji(capsule.event_type);


  // ── 2.3  Render ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F5F3EE]">

      {/* ── Back navigation ───────────────────────────────── */}
      <div className="bg-[#2D1B69] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a
            href={`/for/${slug}`}
            className="
              flex items-center gap-2 text-sm text-yellow-400/70
              hover:text-yellow-400 transition-colors
            "
          >
            <span aria-hidden="true">←</span>
            Back to tribute wall
          </a>
          <div className="flex items-center gap-3">
            <a
              href={`/for/${slug}/submit`}
              className="
                text-xs px-3 py-1.5 rounded-full
                bg-yellow-400 text-purple-950 font-bold
                hover:bg-yellow-300 transition-colors
              "
            >
              Submit tribute
            </a>
          </div>
        </div>
      </div>


      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="bg-[#2D1B69] pb-12 pt-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-2xl mb-3" aria-hidden="true">{eventEmoji}</p>
          <p className="
            text-[10px] text-yellow-400/60 uppercase tracking-[0.25em] mb-3
          ">
            {eventLabel}
          </p>
          <h1 className="
            text-4xl md:text-5xl font-bold text-white
            leading-tight mb-3
          "
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {capsule.honouree_name}
          </h1>
          {capsule.event_tag && (
            <p className="text-yellow-400 text-base mb-2">
              {capsule.event_tag}
            </p>
          )}
          {capsule.event_date && (
            <p className="text-white/40 text-sm">
              {formatDate(capsule.event_date)}
            </p>
          )}
        </div>
      </div>

      {/* Gold rule */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#B8960C] to-transparent" />


      {/* ── Main content ─────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-12">

        {/* ── Profile sections (About, Career Legacy, etc.) ─ */}
        {profileSections.map(section => (
          <section
            key={section.id}
            aria-label={getProfileSectionLabel(section.section_type, section.custom_title)}
          >
            <h2 className="
              text-xs font-bold uppercase tracking-[0.2em]
              text-[#B8960C] mb-4
            ">
              {getProfileSectionLabel(section.section_type, section.custom_title)}
            </h2>
            <div className="
              w-8 h-[1.5px] bg-[#B8960C]/40 mb-5
            " aria-hidden="true" />
            <p className="
              text-[#1C1C1E] text-base leading-relaxed whitespace-pre-wrap
            "
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {section.content}
            </p>
          </section>
        ))}


        {/* ── Featured Photos ────────────────────────────── */}
        {featuredPhotos.length > 0 && (
          <section aria-label="Featured photos">
            <h2 className="
              text-xs font-bold uppercase tracking-[0.2em] text-[#B8960C] mb-4
            ">
              Featured Photos
            </h2>
            <div className="w-8 h-[1.5px] bg-[#B8960C]/40 mb-5" aria-hidden="true" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredPhotos.map(photo => (
                <div key={photo.id} className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? `Photo of ${capsule.honouree_name}`}
                    className="w-full object-cover aspect-[4/3]"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <p className="text-xs text-[#5F5E5A] p-3 bg-white">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ── Gallery ───────────────────────────────────── */}
        {galleryPhotos.length > 0 && (
          <section aria-label="Gallery">
            <h2 className="
              text-xs font-bold uppercase tracking-[0.2em] text-[#B8960C] mb-4
            ">
              Gallery
            </h2>
            <div className="w-8 h-[1.5px] bg-[#B8960C]/40 mb-5" aria-hidden="true" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryPhotos.map(photo => (
                <div key={photo.id} className="rounded-lg overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? ''}
                    className="w-full object-cover aspect-square"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ── Ways to Honour ────────────────────────────── */}
        {hasWaysToHonour && (
          <section aria-label={waysLabel}>
            <h2 className="
              text-xs font-bold uppercase tracking-[0.2em] text-[#B8960C] mb-4
            ">
              {waysLabel}
            </h2>
            <div className="w-8 h-[1.5px] bg-[#B8960C]/40 mb-5" aria-hidden="true" />
            <div className="space-y-4">
              {supportAccounts.map(account => (
                <WaysToHonourCard
                  key={account.id}
                  account={account}
                  capsuleId={capsule.id}
                  acknowledgeLabel={getGiftAcknowledgeLabel(capsule.event_type)}
                />
              ))}
            </div>
          </section>
        )}


        {/* ── Navigation to tribute wall ────────────────── */}
        <div className="pt-4 border-t border-[#B8960C]/20 flex flex-wrap gap-3">
          <a
            href={`/for/${slug}`}
            className="
              text-sm px-5 py-2.5 rounded-full
              border border-[#2D1B69] text-[#2D1B69]
              hover:bg-[#2D1B69] hover:text-white
              transition-colors font-medium
            "
          >
            View tribute wall
          </a>
          <a
            href={`/for/${slug}/submit`}
            className="
              text-sm px-5 py-2.5 rounded-full
              bg-[#2D1B69] text-white font-medium
              hover:bg-[#3d2580] transition-colors
            "
          >
            Submit a tribute
          </a>
        </div>

      </main>


      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-[#2D1B69] py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-yellow-400/50 text-[10px] uppercase tracking-[0.2em] mb-2">
            LegacyCapsule
          </p>
          <p className="text-white/30 text-xs">
            Every event. Preserved.
          </p>
          <p className="mt-3 text-xs">
            <a
              href="/book"
              className="text-white/20 hover:text-white/40 transition-colors"
            >
              Planning your own event? Start here →
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}


// ============================================================
// SECTION 3 — Metadata
// ============================================================

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await adminClient
    .from('capsules')
    .select('honouree_name, event_tag, event_type')
   .eq('slug', slug)
    .maybeSingle();

  if (!data) return { title: 'Profile | LegacyCapsule' };

  return {
    title:       `${data.honouree_name} — ${data.event_tag ?? getEventTypeLabel(data.event_type)} | LegacyCapsule`,
    description: `${data.event_tag ?? getEventTypeLabel(data.event_type)} — a LegacyCapsule tribute collection.`,
  };
}
