/**
 * ============================================================
 * LEGACYCAPSULE — /publication-render/[token]/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Publication render page — used by browser print (Hobby plan)
 * and Puppeteer PDF generation (Pro plan).
 *
 * UPDATED: Claude Sonnet 4.6 · July 2026
 *   — Added renderHonoureeProfile (was empty placeholder)
 *   — Added renderCommunityStories (Community Memories & Stories)
 *   — Added D-Day gallery handling (source = 'dday')
 *   — Fetches capsule_profile_sections and community_story_topics
 *   — Tribute cards improved typography
 *
 * Security model: unchanged — render_token validated before render.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type {
  LayoutConfig,
  Section,
  CoverSection,
  TributesSection,
  PhasePhotosSection,
  WhoAttendedSection,
  ClosingMessageSection,
  PhotoSlot,
  PublicationTheme,
} from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Supabase admin client
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIGNED_URL_EXPIRY_SECONDS = 300;


// ============================================================
// SECTION 2 — Data types
// ============================================================

interface CapsuleData {
  id: string;
  honouree_name: string;
  honouree_title: string | null;
  event_type: string;
  event_date: string | null;
  event_tag: string | null;
  hero_image_url: string | null;
  theme: string;
  cover_style: string;
}

interface ContributionData {
  id: string;
  contributor_name: string;
  city: string | null;
  country: string | null;
  relationship: string | null;
  tribute_text: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  story_topic_id: string | null;
  is_dday: boolean | null;
  created_at: string;
}

interface GalleryItemData {
  id: string;
  image_url: string;
  caption: string | null;
  phase_id: string | null;
  source: string | null;
}

interface PhaseData {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
}

interface GuestData {
  id: string;
  name: string;
  tier: string;
}

interface ProfileSectionData {
  id: string;
  section_type: string;
  custom_title: string | null;
  content: string | null;
  sort_order: number;
  is_active: boolean;
}

interface StoryTopicData {
  id: string;
  topic_name: string;
  display_order: number;
}


// ============================================================
// SECTION 3 — Signed URL helper
// ============================================================

async function toSignedUrl(rawUrl: string | null): Promise<string> {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split('/storage/v1/object/');
    if (parts.length < 2) return rawUrl;
    const [, rest] = parts;
    const pathParts = rest.replace(/^(public|sign)\//, '').split('/');
    const bucket   = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    const { data } = await adminClient.storage.from(bucket).createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);
    return data?.signedUrl ?? rawUrl;
  } catch {
    return rawUrl;
  }
}


// ============================================================
// SECTION 4 — Theme style definitions (unchanged)
// ============================================================

interface ThemeStyles {
  pageBg: string; pageText: string; secondaryText: string; accentColor: string;
  headingFont: string; bodyFont: string; coverBg: string; coverTextColor: string;
  sectionHeaderBorderColor: string; sectionHeaderTextColor: string;
  sectionHeaderStyle: 'rule-gold' | 'centred-italic' | 'ornamental' | 'band' | 'cross';
  tributeCardBg: string; tributeCardBorder: string; pageMarginMm: number;
}

const THEME_STYLES: Record<PublicationTheme, ThemeStyles> = {
  classic: {
    pageBg: '#F5F3EE', pageText: '#1C1C1E', secondaryText: '#5F5E5A',
    accentColor: '#B8960C', headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Playfair Display', Georgia, serif",
    coverBg: '#2D1B69', coverTextColor: '#F5F3EE',
    sectionHeaderBorderColor: '#B8960C', sectionHeaderTextColor: '#2D1B69',
    sectionHeaderStyle: 'rule-gold', tributeCardBg: '#FFFFFF',
    tributeCardBorder: '#E8E4DC', pageMarginMm: 20,
  },
  soft: {
    pageBg: '#FAFAF8', pageText: '#3D2B2B', secondaryText: '#8B6E6E',
    accentColor: '#C4918A', headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Cormorant Garamond', Georgia, serif",
    coverBg: '#F2E8E4', coverTextColor: '#3D2B2B',
    sectionHeaderBorderColor: '#C4918A', sectionHeaderTextColor: '#C4918A',
    sectionHeaderStyle: 'centred-italic', tributeCardBg: '#FFFFFF',
    tributeCardBorder: '#EDE0DC', pageMarginMm: 22,
  },
  romantic: {
    pageBg: '#FAF7F2', pageText: '#1A1A1A', secondaryText: '#6B6560',
    accentColor: '#C9A96E', headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Cormorant Garamond', Georgia, serif",
    coverBg: '#FAF7F2', coverTextColor: '#1A1A1A',
    sectionHeaderBorderColor: '#C9A96E', sectionHeaderTextColor: '#1A1A1A',
    sectionHeaderStyle: 'ornamental', tributeCardBg: '#FFFFFF',
    tributeCardBorder: '#EDE8DC', pageMarginMm: 22,
  },
  vibrant: {
    pageBg: '#FFFFFF', pageText: '#111111', secondaryText: '#555555',
    accentColor: '#D4830A', headingFont: "'DM Sans', system-ui, sans-serif",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    coverBg: '#1A1A2E', coverTextColor: '#FFFFFF',
    sectionHeaderBorderColor: '#D4830A', sectionHeaderTextColor: '#1A1A2E',
    sectionHeaderStyle: 'band', tributeCardBg: '#F8F8F8',
    tributeCardBorder: '#E0E0E0', pageMarginMm: 18,
  },
  spiritual: {
    pageBg: '#FAF9F6', pageText: '#2C2416', secondaryText: '#7A6E58',
    accentColor: '#9B7B2F', headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Playfair Display', Georgia, serif",
    coverBg: '#1C1408', coverTextColor: '#FAF9F6',
    sectionHeaderBorderColor: '#9B7B2F', sectionHeaderTextColor: '#2C2416',
    sectionHeaderStyle: 'cross', tributeCardBg: '#FFFFFF',
    tributeCardBorder: '#EAE4D8', pageMarginMm: 20,
  },
};


// ============================================================
// SECTION 5 — Section header renderer
// ============================================================

function renderSectionHeader(title: string, styles: ThemeStyles): string {
  switch (styles.sectionHeaderStyle) {
    case 'rule-gold':
      return `<div style="margin:40px 0 28px; border-bottom:2px solid ${styles.sectionHeaderBorderColor}; padding-bottom:10px;">
        <h2 style="font-family:${styles.headingFont}; font-size:22px; color:${styles.sectionHeaderTextColor}; font-weight:700; letter-spacing:0.04em;">${escapeHtml(title)}</h2>
      </div>`;
    case 'centred-italic':
      return `<div style="margin:40px 0 28px; text-align:center;">
        <h2 style="font-family:${styles.headingFont}; font-size:22px; color:${styles.sectionHeaderTextColor}; font-style:italic; font-weight:400;">${escapeHtml(title)}</h2>
        <div style="width:60px; height:1px; background:${styles.sectionHeaderBorderColor}; margin:10px auto 0;"></div>
      </div>`;
    case 'ornamental':
      return `<div style="margin:40px 0 28px; text-align:center;">
        <div style="font-size:16px; color:${styles.accentColor}; margin-bottom:8px;">✦ &nbsp; ✦ &nbsp; ✦</div>
        <h2 style="font-family:${styles.headingFont}; font-size:22px; color:${styles.sectionHeaderTextColor}; font-weight:600;">${escapeHtml(title)}</h2>
      </div>`;
    case 'band':
      return `<div style="margin:40px 0 28px; background:${styles.sectionHeaderBorderColor}; padding:10px 16px; border-radius:6px;">
        <h2 style="font-family:${styles.headingFont}; font-size:18px; color:#FFFFFF; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">${escapeHtml(title)}</h2>
      </div>`;
    case 'cross':
      return `<div style="margin:40px 0 28px; display:flex; align-items:center; gap:12px;">
        <span style="font-size:16px; color:${styles.accentColor};">✝</span>
        <h2 style="font-family:${styles.headingFont}; font-size:22px; color:${styles.sectionHeaderTextColor}; font-weight:700;">${escapeHtml(title)}</h2>
        <div style="flex:1; height:1px; background:${styles.sectionHeaderBorderColor};"></div>
      </div>`;
    default:
      return `<h2 style="font-family:${styles.headingFont}; font-size:22px; color:${styles.sectionHeaderTextColor}; font-weight:700; margin:40px 0 28px;">${escapeHtml(title)}</h2>`;
  }
}


// ============================================================
// SECTION 6 — Cover renderer
// ============================================================

function renderCover(capsule: CapsuleData, heroUrl: string, styles: ThemeStyles): string {
  const displayName = capsule.honouree_title
    ? `${capsule.honouree_title} ${capsule.honouree_name}`
    : capsule.honouree_name;
  const dateStr = formatEventDate(capsule.event_date);

  return `<div style="min-height:100vh; background:${styles.coverBg}; color:${styles.coverTextColor}; display:flex; flex-direction:column; justify-content:flex-end; page-break-after:always; position:relative; overflow:hidden;">
    ${heroUrl ? `<div style="position:absolute; top:0; left:0; right:0; height:60%; overflow:hidden;">
      <img src="${heroUrl}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:center top;"/>
      <div style="position:absolute; bottom:0; left:0; right:0; height:50%; background:linear-gradient(to bottom, transparent, ${styles.coverBg});"></div>
    </div>` : ''}
    <div style="position:relative; padding:60px 48px 56px; z-index:1;">
      <div style="width:48px; height:3px; background:${styles.accentColor}; margin-bottom:24px;"></div>
      <p style="font-family:${styles.bodyFont}; font-size:11px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; opacity:0.6; margin-bottom:16px;">LEGACYCAPSULE</p>
      <h1 style="font-family:${styles.headingFont}; font-size:52px; font-weight:700; line-height:1.1; margin-bottom:16px;">${escapeHtml(displayName)}</h1>
      ${capsule.event_tag ? `<p style="font-family:${styles.bodyFont}; font-size:18px; opacity:0.7; font-style:italic; margin-bottom:8px;">${escapeHtml(capsule.event_tag)}</p>` : ''}
      ${dateStr ? `<p style="font-family:${styles.bodyFont}; font-size:14px; opacity:0.55; margin-bottom:0;">${escapeHtml(dateStr)}</p>` : ''}
      <div style="width:48px; height:2px; background:${styles.accentColor}; margin:32px 0 0;"></div>
    </div>
  </div>`;
}


// ============================================================
// SECTION 7 — Honouree profile renderer (was empty placeholder)
// ============================================================

function renderHonoureeProfile(
  capsule: CapsuleData,
  profileSections: ProfileSectionData[],
  styles: ThemeStyles
): string {
  if (!profileSections || profileSections.length === 0) return '';

  const activeSections = profileSections.filter(s => s.is_active && s.content?.trim());
  if (activeSections.length === 0) return '';

  const SECTION_LABELS: Record<string, string> = {
    intro: 'Introduction', biography: 'Biography', timeline: 'Timeline',
    achievements: 'Achievements', family: 'Family', legacy: 'Legacy', custom: '',
  };

  const sectionsHtml = activeSections.map(s => {
    const title = s.custom_title ?? SECTION_LABELS[s.section_type] ?? s.section_type
    return `<div style="margin-bottom:28px; page-break-inside:avoid;">
      ${title ? `<h3 style="font-family:${styles.headingFont}; font-size:16px; color:${styles.sectionHeaderTextColor}; font-weight:600; margin-bottom:10px; border-left:3px solid ${styles.accentColor}; padding-left:12px;">${escapeHtml(title)}</h3>` : ''}
      <p style="font-family:${styles.bodyFont}; font-size:13px; line-height:1.85; color:${styles.pageText}; white-space:pre-wrap;">${escapeHtml(s.content ?? '')}</p>
    </div>`
  }).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader(`${capsule.honouree_title ? capsule.honouree_title + ' ' : ''}${capsule.honouree_name}`, styles)}
    ${sectionsHtml}
  </div>`;
}


// ============================================================
// SECTION 8 — Tributes renderer (improved typography)
// ============================================================

function renderTributes(
  section: TributesSection,
  contribs: ContributionData[],
  styles: ThemeStyles
): string {
  // Filter to tributes only (not community stories, not D-Day)
  let tributeList = contribs.filter(c => !c.story_topic_id && !c.is_dday);

  const sec = section as any;
  if (sec.order_mode === 'custom' && sec.ordered_ids?.length) {
    const idIndex: Record<string, number> = Object.fromEntries(sec.ordered_ids.map((id: string, i: number) => [id, i]));
    tributeList = [...tributeList].sort((a, b) => (idIndex[a.id] ?? 999) - (idIndex[b.id] ?? 999));
  }

  const cards = tributeList.map(c => {
    const name     = c.is_anonymous ? 'A community member' : escapeHtml(c.contributor_name)
    const location = [c.city, c.country].filter(Boolean).map(escapeHtml).join(', ')
    const rel      = c.relationship ? escapeHtml(c.relationship) : ''

    return `<div data-contribution-id="${c.id}" style="background:${styles.tributeCardBg}; border:1px solid ${styles.tributeCardBorder}; border-radius:10px; padding:20px 22px; margin-bottom:14px; page-break-inside:avoid;">
      <p style="font-family:${styles.headingFont}; font-size:15px; font-weight:700; color:${styles.pageText}; margin-bottom:4px;">${name}</p>
      ${(location || rel) ? `<p style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; margin-bottom:12px;">${[rel, location].filter(Boolean).join(' · ')}</p>` : '<div style="margin-bottom:12px;"></div>'}
      <p style="font-family:${styles.bodyFont}; font-size:13px; line-height:1.80; color:${styles.pageText};">${escapeHtml(c.tribute_text ?? '')}</p>
    </div>`
  }).join('')

  return `<div>
    ${renderSectionHeader('Tributes', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:12px; color:${styles.secondaryText}; margin-bottom:20px; font-style:italic;">${tributeList.length} voice${tributeList.length !== 1 ? 's' : ''} gathered</p>
    ${cards}
  </div>`;
}


// ============================================================
// SECTION 9 — Community Memories & Stories renderer (NEW)
// ============================================================

function renderCommunityStories(
  contribs: ContributionData[],
  topics: StoryTopicData[],
  styles: ThemeStyles
): string {
  const storyContribs = contribs.filter(c => !!c.story_topic_id)
  if (storyContribs.length === 0 || topics.length === 0) return ''

  const topicsHtml = topics.map(topic => {
    const topicStories = storyContribs.filter(s => s.story_topic_id === topic.id)
    if (topicStories.length === 0) return ''

    const storiesHtml = topicStories.map(s => {
      const name     = escapeHtml(s.contributor_name)
      const location = [s.city, s.country].filter(Boolean).map(escapeHtml).join(', ')
      const rel      = s.relationship ? escapeHtml(s.relationship) : ''

      return `<div style="background:${styles.tributeCardBg}; border:1px solid ${styles.tributeCardBorder}; border-radius:10px; padding:18px 20px; margin-bottom:12px; page-break-inside:avoid;">
        <p style="font-family:${styles.headingFont}; font-size:14px; font-weight:700; color:${styles.pageText}; margin-bottom:3px;">${name}</p>
        ${(location || rel) ? `<p style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; margin-bottom:10px;">${[rel, location].filter(Boolean).join(' · ')}</p>` : '<div style="margin-bottom:10px;"></div>'}
        <p style="font-family:${styles.bodyFont}; font-size:13px; line-height:1.80; color:${styles.pageText};">${escapeHtml(s.tribute_text ?? '')}</p>
      </div>`
    }).join('')

    return `<div style="margin-bottom:32px;">
      <h3 style="font-family:${styles.headingFont}; font-size:16px; font-weight:600; color:${styles.sectionHeaderTextColor}; border-left:3px solid ${styles.accentColor}; padding-left:12px; margin-bottom:14px;">${escapeHtml(topic.topic_name)}</h3>
      ${storiesHtml}
    </div>`
  }).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Community Memories & Stories', styles)}
    ${topicsHtml}
  </div>`;
}


// ============================================================
// SECTION 10 — Phase photos renderer
// ============================================================

function renderPhasePhotos(
  section: PhasePhotosSection,
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  const enabledSlots = ((section as any).slots ?? []).filter((s: any) => s.enabled && photoUrlMap[s.gallery_item_id]);
  if (enabledSlots.length === 0) return '';

  const COLS = 2;
  const rows: any[][] = [];
  for (let i = 0; i < enabledSlots.length; i += COLS) rows.push(enabledSlots.slice(i, i + COLS));

  const gridHtml = rows.map(row =>
    `<div style="display:flex; gap:12px; margin-bottom:12px; page-break-inside:avoid;">
      ${row.map((slot: any) => {
        const url     = photoUrlMap[slot.gallery_item_id] ?? ''
        const caption = slot.custom_caption ?? ''
        const isFeature = slot.is_feature
        return `<div style="flex:${isFeature ? '2' : '1'}; min-width:0;">
          <img src="${url}" alt="${escapeHtml(caption)}" style="width:100%; height:${isFeature ? '280px' : '180px'}; object-fit:cover; border-radius:8px; display:block;"/>
          ${caption ? `<p style="font-size:10px; color:${styles.secondaryText}; margin-top:6px; font-style:italic; text-align:center;">${escapeHtml(caption)}</p>` : ''}
        </div>`
      }).join('')}
    </div>`
  ).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader(section.phase_name ?? 'Event Photographs', styles)}
    ${gridHtml}
  </div>`;
}


// ============================================================
// SECTION 11 — D-Day guest captures renderer (NEW)
// ============================================================

function renderDdayCaptures(
  contribs: ContributionData[],
  galleryItems: GalleryItemData[],
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  const ddayPhotos   = galleryItems.filter(g => g.source === 'dday' && photoUrlMap[g.id])
  const ddayTributes = contribs.filter(c => c.is_dday && !c.story_topic_id)

  if (ddayPhotos.length === 0 && ddayTributes.length === 0) return ''

  const photosHtml = ddayPhotos.length > 0 ? `
    <h3 style="font-family:${styles.headingFont}; font-size:15px; font-weight:600; color:${styles.sectionHeaderTextColor}; margin-bottom:14px;">Guest Photographs</h3>
    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:24px;">
      ${ddayPhotos.map(p => `<div style="width:calc(33.33% - 8px);">
        <img src="${photoUrlMap[p.id]}" alt="${escapeHtml(p.caption ?? '')}" style="width:100%; height:140px; object-fit:cover; border-radius:8px;"/>
        ${p.caption ? `<p style="font-size:9px; color:${styles.secondaryText}; margin-top:4px; text-align:center; font-style:italic;">${escapeHtml(p.caption)}</p>` : ''}
      </div>`).join('')}
    </div>` : ''

  const tributesHtml = ddayTributes.length > 0 ? `
    <h3 style="font-family:${styles.headingFont}; font-size:15px; font-weight:600; color:${styles.sectionHeaderTextColor}; margin-bottom:14px;">On-the-Day Tributes</h3>
    ${ddayTributes.map(c => `<div style="background:${styles.tributeCardBg}; border:1px solid ${styles.tributeCardBorder}; border-radius:10px; padding:16px 18px; margin-bottom:10px; page-break-inside:avoid;">
      <p style="font-family:${styles.headingFont}; font-size:14px; font-weight:700; color:${styles.pageText}; margin-bottom:4px;">${escapeHtml(c.contributor_name)}</p>
      <p style="font-family:${styles.bodyFont}; font-size:13px; line-height:1.80; color:${styles.pageText};">${escapeHtml(c.tribute_text ?? '')}</p>
    </div>`).join('')}` : ''

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('On The Day', styles)}
    ${photosHtml}
    ${tributesHtml}
  </div>`;
}


// ============================================================
// SECTION 12 — Who Attended renderer
// ============================================================

function renderWhoAttended(guests: GuestData[], styles: ThemeStyles): string {
  if (!guests || guests.length === 0) return '';

  const tiers  = ['VVIP', 'VIP', 'General', 'Reception Only', 'Staff', 'Media', 'Vendor']
  const byTier = tiers.reduce((acc, tier) => {
    const g = guests.filter(guest => guest.tier === tier)
    if (g.length > 0) acc[tier] = g
    return acc
  }, {} as Record<string, GuestData[]>)

  const tiersHtml = Object.entries(byTier).map(([tier, list]) =>
    `<div style="margin-bottom:20px;">
      <p style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${styles.accentColor}; margin-bottom:8px;">${escapeHtml(tier)}</p>
      <div style="columns:3; column-gap:16px;">
        ${list.map(g => `<p style="font-size:12px; color:${styles.pageText}; margin-bottom:4px; break-inside:avoid;">${escapeHtml(g.name)}</p>`).join('')}
      </div>
    </div>`
  ).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Who Attended', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:12px; color:${styles.secondaryText}; margin-bottom:20px; font-style:italic;">${guests.length} guest${guests.length !== 1 ? 's' : ''} verified at this event</p>
    ${tiersHtml}
  </div>`;
}


// ============================================================
// SECTION 13 — Closing message renderer
// ============================================================

function renderClosingMessage(capsule: CapsuleData, styles: ThemeStyles): string {
  return `<div style="page-break-before:always; text-align:center; padding:80px 40px; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh;">
    <div style="width:40px; height:2px; background:${styles.accentColor}; margin-bottom:32px;"></div>
    <p style="font-family:${styles.headingFont}; font-size:22px; color:${styles.pageText}; font-style:italic; margin-bottom:16px; line-height:1.5; max-width:400px;">
      "Events end. Legacies don't."
    </p>
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; line-height:1.7; max-width:360px; margin-bottom:40px;">
      This publication was assembled from the voices of those who love and remember ${escapeHtml(capsule.honouree_name)}.
      It is a permanent record — kept for all who contributed, and for those who come after.
    </p>
    <p style="font-family:${styles.bodyFont}; font-size:10px; color:${styles.secondaryText}; opacity:0.5; letter-spacing:0.14em; text-transform:uppercase;">
      LegacyCapsule · VALNEX, UNIPESSOAL LDA · RevoWorldTech
    </p>
    <div style="width:40px; height:2px; background:${styles.accentColor}; margin-top:32px;"></div>
  </div>`;
}


// ============================================================
// SECTION 14 — Utilities
// ============================================================

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}


// ============================================================
// SECTION 15 — Page component
// ============================================================

export default async function PublicationRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ autoPrint?: string }>;
}) {
  const { token }   = await params;
  const { autoPrint } = await searchParams;
  const shouldAutoPrint = autoPrint === '1';

  if (!token || token.length < 32) return notFound();

  // ── Validate render token ─────────────────────────────────
  const { data: pub } = await adminClient
    .from('publications')
    .select('id, capsule_id, layout_config, version')
    .eq('render_token', token)
    .maybeSingle();

  if (!pub) return notFound();

  const layoutConfig = pub.layout_config as LayoutConfig;
  const capsuleId    = pub.capsule_id;

  // ── Fetch all content in parallel ─────────────────────────
  const [capsuleRes, contribsRes, galleryRes, phasesRes, guestsRes, profileRes, topicsRes] =
    await Promise.all([
      adminClient.from('capsules')
        .select('id, honouree_name, honouree_title, event_type, event_date, event_tag, hero_image_url, theme, cover_style')
        .eq('id', capsuleId).single(),

      adminClient.from('contributions')
        .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, is_anonymous, story_topic_id, is_dday, created_at')
        .eq('capsule_id', capsuleId).eq('status', 'approved').is('deleted_at', null).order('created_at'),

      adminClient.from('gallery_items')
        .select('id, image_url, caption, phase_id, source')
        .eq('capsule_id', capsuleId).eq('approved', true).is('deleted_at', null),

      adminClient.from('capsule_phases')
        .select('id, name, event_date, location')
        .eq('capsule_id', capsuleId).is('deleted_at', null).order('sort_order'),

      adminClient.from('guests')
        .select('id, name, tier')
        .eq('capsule_id', capsuleId).not('checked_in_at', 'is', null),

      // NEW: profile sections for honouree profile
      adminClient.from('capsule_profile_sections')
        .select('id, section_type, custom_title, content, sort_order, is_active')
        .eq('capsule_id', capsuleId).eq('is_active', true).order('sort_order'),

      // NEW: community story topics
      adminClient.from('community_story_topics')
        .select('id, topic_name, display_order')
        .eq('capsule_id', capsuleId).eq('status', 'active').order('display_order'),
    ]);

  const capsule       = capsuleRes.data  as CapsuleData;
  const contribs      = (contribsRes.data ?? []) as ContributionData[];
  const gallery       = (galleryRes.data  ?? []) as GalleryItemData[];
  const guests        = (guestsRes.data   ?? []) as GuestData[];
  const profileSections = (profileRes.data ?? []) as ProfileSectionData[];
  const storyTopics   = (topicsRes.data   ?? []) as StoryTopicData[];

  if (!capsule) return notFound();

  const theme  = layoutConfig.theme ?? 'classic';
  const styles = THEME_STYLES[theme as PublicationTheme] ?? THEME_STYLES.classic;

  // ── Resolve signed URLs ───────────────────────────────────
  const heroUrl = await toSignedUrl(capsule.hero_image_url);
  const photoUrlMap: Record<string, string> = {};
  await Promise.all(gallery.map(async item => {
    photoUrlMap[item.id] = await toSignedUrl(item.image_url);
  }));

  // ── Build enabled sections ────────────────────────────────
  const enabledSections = layoutConfig.sections.filter((s: Section) => s.enabled);
  const hasDday = contribs.some(c => c.is_dday) || gallery.some(g => g.source === 'dday');

  const sectionHtml = [
    ...enabledSections.map((section: Section) => {
      switch (section.type) {
        case 'cover':
          return renderCover(capsule, heroUrl, styles);
        case 'honouree_profile':
          return renderHonoureeProfile(capsule, profileSections, styles);
        case 'tributes':
          return renderTributes(section as TributesSection, contribs, styles);
        case 'phase_photos':
          return renderPhasePhotos(section as PhasePhotosSection, photoUrlMap, styles);
        case 'who_attended':
          return renderWhoAttended(guests, styles);
        case 'closing_message':
          return renderClosingMessage(capsule, styles);
        default:
          return '';
      }
    }),
    // Always include these if content exists — no layout toggle needed
    renderCommunityStories(contribs, storyTopics, styles),
    hasDday ? renderDdayCaptures(contribs, gallery, photoUrlMap, styles) : '',
  ].join('\n');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <title>{`${capsule.honouree_name} — LegacyCapsule Publication`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: ${styles.pageBg}; color: ${styles.pageText}; font-family: ${styles.bodyFont}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: ${styles.pageMarginMm}mm; }
          img { max-width: 100%; display: block; }
          @media print { body { background: ${styles.pageBg}; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `}} />
      </head>
      <body dangerouslySetInnerHTML={{ __html: sectionHtml + (shouldAutoPrint ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},1200);});</script>` : '') }} />
    </html>
  );
}
