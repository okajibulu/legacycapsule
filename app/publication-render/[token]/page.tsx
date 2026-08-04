/**
 * ============================================================
 * LEGACYCAPSULE — /publication-render/[token]/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Publication render page — browser print path (Hobby plan).
 *
 * UPDATED: AI17 · Claude Opus 4.6 · 4 August 2026
 *   — v2.11.49: Profile gallery (capsule_gallery) added
 *   — v2.11.49: Tribute serial numbers added
 *   — v2.11.49: Closing message always rendered last
 *   — v2.11.49: Screen-only A4 instruction banner (hidden on print)
 *   — v2.11.49: no-print class in style block
 *   — v2.11.49: page-break-after:avoid on section headers
 *   — v2.11.49: @page uses explicit 210mm 297mm
 *   — v2.11.48: Standalone layout (no site chrome)
 *   — v2.11.47: body tag properly closed, A4 dimensions
 *   — v2.11.46: Typography overhaul, white backgrounds
 *   — v2.11.46: Official Photography split from Guest Captures
 *   — v2.11.46: Memories renderer, profile section renderer
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
  uploaded_by_name: string | null;
  phase_id: string | null;
  source: string | null;
  is_official_photography: boolean;
  display_order: number | null;
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

interface MemoryData {
  id: string;
  contributor_name: string;
  memory_text: string;
  era_label: string | null;
  relationship: string | null;
  created_at: string;
}

interface ProfileGalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  section_index: number;
  section_title: string | null;
  sort_order: number;
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
    const { data } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);
    return data?.signedUrl ?? rawUrl;
  } catch {
    return rawUrl;
  }
}


// ============================================================
// SECTION 4 — Theme style definitions
// All page backgrounds white for print cohesion.
// ============================================================

interface ThemeStyles {
  pageBg: string;
  pageText: string;
  secondaryText: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  coverBg: string;
  coverTextColor: string;
  sectionHeaderBorderColor: string;
  sectionHeaderTextColor: string;
  sectionHeaderStyle: 'rule-gold' | 'centred-italic' | 'ornamental' | 'band' | 'cross';
  tributeCardBorder: string;
  pageMarginMm: number;
}

const THEME_STYLES: Record<string, ThemeStyles> = {
  classic: {
    pageBg: '#FFFFFF', pageText: '#1C1C1E', secondaryText: '#5F5E5A',
    accentColor: '#B8960C', headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Playfair Display', Georgia, serif", coverBg: '#2D1B69',
    coverTextColor: '#F5F3EE', sectionHeaderBorderColor: '#B8960C',
    sectionHeaderTextColor: '#2D1B69', sectionHeaderStyle: 'rule-gold',
    tributeCardBorder: '#E8E4DC', pageMarginMm: 20,
  },
  soft: {
    pageBg: '#FFFFFF', pageText: '#3D2B2B', secondaryText: '#8B6E6E',
    accentColor: '#C4918A', headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Cormorant Garamond', Georgia, serif", coverBg: '#F2E8E4',
    coverTextColor: '#3D2B2B', sectionHeaderBorderColor: '#C4918A',
    sectionHeaderTextColor: '#C4918A', sectionHeaderStyle: 'centred-italic',
    tributeCardBorder: '#EDE0DC', pageMarginMm: 22,
  },
  romantic: {
    pageBg: '#FFFFFF', pageText: '#1A1A1A', secondaryText: '#6B6560',
    accentColor: '#C9A96E', headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Cormorant Garamond', Georgia, serif", coverBg: '#FAF7F2',
    coverTextColor: '#1A1A1A', sectionHeaderBorderColor: '#C9A96E',
    sectionHeaderTextColor: '#1A1A1A', sectionHeaderStyle: 'ornamental',
    tributeCardBorder: '#EDE8DC', pageMarginMm: 22,
  },
  vibrant: {
    pageBg: '#FFFFFF', pageText: '#111111', secondaryText: '#555555',
    accentColor: '#D4830A', headingFont: "'DM Sans', system-ui, sans-serif",
    bodyFont: "'DM Sans', system-ui, sans-serif", coverBg: '#1A1A2E',
    coverTextColor: '#FFFFFF', sectionHeaderBorderColor: '#D4830A',
    sectionHeaderTextColor: '#1A1A2E', sectionHeaderStyle: 'band',
    tributeCardBorder: '#E0E0E0', pageMarginMm: 18,
  },
  spiritual: {
    pageBg: '#FFFFFF', pageText: '#2C2416', secondaryText: '#7A6E58',
    accentColor: '#9B7B2F', headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Playfair Display', Georgia, serif", coverBg: '#1C1408',
    coverTextColor: '#FAF9F6', sectionHeaderBorderColor: '#9B7B2F',
    sectionHeaderTextColor: '#2C2416', sectionHeaderStyle: 'cross',
    tributeCardBorder: '#EAE4D8', pageMarginMm: 20,
  },
};


// ============================================================
// SECTION 5 — Section header renderer
// page-break-after:avoid keeps heading with first content block.
// ============================================================

function renderSectionHeader(title: string, styles: ThemeStyles): string {
  const base = `page-break-after:avoid;`
  switch (styles.sectionHeaderStyle) {
    case 'rule-gold':
      return `<div style="margin:60px 0 36px; border-bottom:3px solid ${styles.sectionHeaderBorderColor}; padding-bottom:14px; ${base}">
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-weight:700; letter-spacing:0.02em; line-height:1.2;">${escapeHtml(title)}</h2>
      </div>`;
    case 'centred-italic':
      return `<div style="margin:60px 0 36px; text-align:center; ${base}">
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-style:italic; font-weight:400; line-height:1.2;">${escapeHtml(title)}</h2>
        <div style="width:80px; height:3px; background:${styles.sectionHeaderBorderColor}; margin:14px auto 0;"></div>
      </div>`;
    case 'ornamental':
      return `<div style="margin:60px 0 36px; text-align:center; ${base}">
        <div style="font-size:18px; color:${styles.accentColor}; margin-bottom:12px; letter-spacing:0.3em;">✦ &nbsp; ✦ &nbsp; ✦</div>
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-weight:600; line-height:1.2;">${escapeHtml(title)}</h2>
        <div style="width:80px; height:2px; background:${styles.sectionHeaderBorderColor}; margin:14px auto 0;"></div>
      </div>`;
    case 'band':
      return `<div style="margin:60px 0 36px; border-left:6px solid ${styles.sectionHeaderBorderColor}; padding:12px 20px; ${base}">
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-weight:700; letter-spacing:0.04em; line-height:1.2;">${escapeHtml(title)}</h2>
      </div>`;
    case 'cross':
      return `<div style="margin:60px 0 36px; display:flex; align-items:center; gap:16px; ${base}">
        <span style="font-size:20px; color:${styles.accentColor}; flex-shrink:0;">✝</span>
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-weight:700; line-height:1.2;">${escapeHtml(title)}</h2>
        <div style="flex:1; height:3px; background:${styles.sectionHeaderBorderColor};"></div>
      </div>`;
    default:
      return `<div style="margin:60px 0 36px; border-bottom:3px solid ${styles.sectionHeaderBorderColor}; padding-bottom:14px; ${base}">
        <h2 style="font-family:${styles.headingFont}; font-size:28px; color:${styles.sectionHeaderTextColor}; font-weight:700; line-height:1.2;">${escapeHtml(title)}</h2>
      </div>`;
  }
}

function renderSubHeading(title: string, styles: ThemeStyles): string {
  return `<div style="margin:32px 0 16px; display:flex; align-items:center; gap:12px; page-break-after:avoid;">
    <div style="width:4px; height:20px; background:${styles.accentColor}; flex-shrink:0; border-radius:2px;"></div>
    <h3 style="font-family:${styles.headingFont}; font-size:18px; font-weight:600; color:${styles.sectionHeaderTextColor}; line-height:1.3;">${escapeHtml(title)}</h3>
  </div>`;
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
    ${heroUrl ? `<div style="position:absolute; top:0; left:0; right:0; height:62%; overflow:hidden;">
      <img src="${heroUrl}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:center top;"/>
      <div style="position:absolute; bottom:0; left:0; right:0; height:55%; background:linear-gradient(to bottom, transparent, ${styles.coverBg});"></div>
    </div>` : ''}
    <div style="position:relative; padding:64px 52px 60px; z-index:1;">
      <div style="width:52px; height:4px; background:${styles.accentColor}; margin-bottom:28px; border-radius:2px;"></div>
      <p style="font-family:${styles.bodyFont}; font-size:10px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; opacity:0.55; margin-bottom:18px;">LEGACYCAPSULE</p>
      <h1 style="font-family:${styles.headingFont}; font-size:54px; font-weight:700; line-height:1.08; margin-bottom:18px;">${escapeHtml(displayName)}</h1>
      ${capsule.event_tag ? `<p style="font-family:${styles.bodyFont}; font-size:19px; opacity:0.7; font-style:italic; margin-bottom:10px; line-height:1.4;">${escapeHtml(capsule.event_tag)}</p>` : ''}
      ${dateStr ? `<p style="font-family:${styles.bodyFont}; font-size:13px; opacity:0.5; margin-bottom:0; letter-spacing:0.06em;">${escapeHtml(dateStr)}</p>` : ''}
      <div style="width:52px; height:3px; background:${styles.accentColor}; margin:36px 0 0; border-radius:2px;"></div>
    </div>
  </div>`;
}


// ============================================================
// SECTION 7 — Honouree profile renderer (text sections)
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
    biography:    'Biography',
    occasion:     'Event Details',
    story:        'Story',
    appreciation: 'A Message of Appreciation',
    custom:       '',
  };

  const sectionsHtml = activeSections.map(s => {
    const rawTitle  = s.custom_title ?? SECTION_LABELS[s.section_type] ?? s.section_type
    const title     = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)
    const content   = escapeHtml(s.content ?? '')
    const isOccasion     = s.section_type === 'occasion'
    const isAppreciation = s.section_type === 'appreciation'

    if (isOccasion) {
      return `<div style="margin-bottom:36px; padding:24px 28px; border:1px solid ${styles.tributeCardBorder}; border-radius:12px; border-left:4px solid ${styles.accentColor}; page-break-inside:avoid;">
        ${title ? `<p style="font-family:${styles.headingFont}; font-size:13px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:${styles.accentColor}; margin-bottom:12px;">${escapeHtml(title)}</p>` : ''}
        <p style="font-family:${styles.bodyFont}; font-size:15px; line-height:1.85; color:${styles.pageText}; white-space:pre-wrap;">${content}</p>
      </div>`
    }

    if (isAppreciation) {
      return `<div style="margin-bottom:36px; padding:28px 36px; border:1px solid ${styles.tributeCardBorder}; border-radius:12px; page-break-inside:avoid; position:relative;">
        <div style="position:absolute; top:0; left:28px; transform:translateY(-50%); background:#FFFFFF; padding:0 8px;">
          <p style="font-family:${styles.headingFont}; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${styles.accentColor};">${escapeHtml(title)}</p>
        </div>
        <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.95; color:${styles.pageText}; white-space:pre-wrap; font-style:italic;">${content}</p>
      </div>`
    }

    return `<div style="margin-bottom:36px; page-break-inside:avoid;">
      ${title ? `<div style="margin-bottom:14px; display:flex; align-items:center; gap:12px; page-break-after:avoid;">
        <div style="width:4px; height:22px; background:${styles.accentColor}; flex-shrink:0; border-radius:2px;"></div>
        <h3 style="font-family:${styles.headingFont}; font-size:18px; font-weight:600; color:${styles.sectionHeaderTextColor}; line-height:1.3;">${escapeHtml(title)}</h3>
      </div>` : ''}
      <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.95; color:${styles.pageText}; white-space:pre-wrap;">${content}</p>
    </div>`
  }).join('')

  const displayName = capsule.honouree_title
    ? `${capsule.honouree_title} ${capsule.honouree_name}`
    : capsule.honouree_name;

  return `<div style="page-break-before:always;">
    ${renderSectionHeader(displayName, styles)}
    ${sectionsHtml}
  </div>`;
}


// ============================================================
// SECTION 8 — Profile gallery renderer (capsule_gallery table)
// Groups by section_index, shows section_title if present.
// 3-column grid within each gallery section.
// ============================================================

function renderProfileGallery(
  galleryItems: ProfileGalleryItem[],
  styles: ThemeStyles
): string {
  if (!galleryItems || galleryItems.length === 0) return '';

  // Group by section_index
  const sections: Record<number, ProfileGalleryItem[]> = {}
  galleryItems.forEach(item => {
    if (!sections[item.section_index]) sections[item.section_index] = []
    sections[item.section_index].push(item)
  })

  const COLS = 3
  const sectionsHtml = Object.entries(sections)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, items]) => {
      const title = items[0]?.section_title
      const rows: ProfileGalleryItem[][] = []
      for (let i = 0; i < items.length; i += COLS) {
        rows.push(items.slice(i, i + COLS))
      }

      const gridHtml = rows.map(row =>
        `<div style="display:flex; gap:10px; margin-bottom:10px; page-break-inside:avoid;">
          ${row.map(item => `<div style="flex:1; min-width:0;">
            <img src="${item.image_url}" alt="${escapeHtml(item.caption ?? '')}" style="width:100%; height:160px; object-fit:cover; border-radius:8px; display:block; image-orientation:from-image;"/>
            ${item.caption ? `<p style="font-size:9px; color:${styles.secondaryText}; margin-top:5px; text-align:center; font-style:italic;">${escapeHtml(item.caption)}</p>` : ''}
          </div>`).join('')}
          ${row.length < COLS ? Array(COLS - row.length).fill(`<div style="flex:1; min-width:0;"></div>`).join('') : ''}
        </div>`
      ).join('')

      return `<div style="margin-bottom:32px;">
        ${title ? renderSubHeading(title, styles) : ''}
        ${gridHtml}
      </div>`
    }).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Photo Gallery', styles)}
    ${sectionsHtml}
  </div>`;
}


// ============================================================
// SECTION 9 — Tributes renderer (with serial numbers)
// ============================================================

function renderTributes(
  section: TributesSection,
  contribs: ContributionData[],
  styles: ThemeStyles
): string {
  let tributeList = contribs.filter(c => !c.story_topic_id && !c.is_dday);

  const sec = section as any;
  if (sec.order_mode === 'custom' && sec.ordered_ids?.length) {
    const idIndex: Record<string, number> = Object.fromEntries(
      sec.ordered_ids.map((id: string, i: number) => [id, i])
    );
    tributeList = [...tributeList].sort((a, b) => (idIndex[a.id] ?? 999) - (idIndex[b.id] ?? 999));
  }

  if (tributeList.length === 0) return '';

  const cards = tributeList.map((c, index) => {
    const name     = c.is_anonymous ? 'A community member' : escapeHtml(c.contributor_name)
    const location = [c.city, c.country].filter(Boolean).map(escapeHtml).join(', ')
    const rel      = c.relationship ? escapeHtml(c.relationship) : ''
    const serial   = `${index + 1}.`

    return `<div data-contribution-id="${c.id}" style="background:#FFFFFF; border:1px solid ${styles.tributeCardBorder}; border-radius:14px; padding:28px 32px; margin-bottom:18px; page-break-inside:avoid;">
      <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:5px;">
        <span style="font-family:${styles.headingFont}; font-size:13px; font-weight:700; color:${styles.accentColor}; flex-shrink:0; padding-top:2px;">${serial}</span>
        <p style="font-family:${styles.headingFont}; font-size:16px; font-weight:700; color:${styles.pageText};">${name}</p>
      </div>
      ${(location || rel) ? `<p style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; margin-bottom:14px; letter-spacing:0.03em; padding-left:28px;">${[rel, location].filter(Boolean).join(' · ')}</p>` : '<div style="margin-bottom:14px;"></div>'}
      <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.90; color:${styles.pageText}; padding-left:28px;">${escapeHtml(c.tribute_text ?? '')}</p>
    </div>`
  }).join('')

  return `<div>
    ${renderSectionHeader('Tributes', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic; letter-spacing:0.03em;">${tributeList.length} voice${tributeList.length !== 1 ? 's' : ''} gathered</p>
    ${cards}
  </div>`;
}


// ============================================================
// SECTION 10 — Community Stories renderer
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

      return `<div style="background:#FFFFFF; border:1px solid ${styles.tributeCardBorder}; border-radius:14px; padding:24px 28px; margin-bottom:14px; page-break-inside:avoid;">
        <p style="font-family:${styles.headingFont}; font-size:15px; font-weight:700; color:${styles.pageText}; margin-bottom:4px;">${name}</p>
        ${(location || rel) ? `<p style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; margin-bottom:12px; letter-spacing:0.03em;">${[rel, location].filter(Boolean).join(' · ')}</p>` : '<div style="margin-bottom:12px;"></div>'}
        <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.90; color:${styles.pageText};">${escapeHtml(s.tribute_text ?? '')}</p>
      </div>`
    }).join('')

    return `<div style="margin-bottom:40px;">
      ${renderSubHeading(topic.topic_name, styles)}
      ${storiesHtml}
    </div>`
  }).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Community Memories & Stories', styles)}
    ${topicsHtml}
  </div>`;
}


// ============================================================
// SECTION 11 — Memories renderer
// ============================================================

function renderMemories(memories: MemoryData[], styles: ThemeStyles): string {
  if (!memories || memories.length === 0) return ''

  const groups: Record<string, MemoryData[]> = {}
  memories.forEach(m => {
    const key = m.era_label ?? 'Memories'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })

  const groupsHtml = Object.entries(groups).map(([era, items]) => {
    const itemsHtml = items.map(m => {
      const name = escapeHtml(m.contributor_name)
      const rel  = m.relationship ? escapeHtml(m.relationship) : ''
      return `<div style="background:#FFFFFF; border:1px solid ${styles.tributeCardBorder}; border-radius:14px; padding:24px 28px; margin-bottom:14px; page-break-inside:avoid;">
        <p style="font-family:${styles.headingFont}; font-size:15px; font-weight:700; color:${styles.pageText}; margin-bottom:4px;">${name}</p>
        ${rel ? `<p style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; margin-bottom:12px; letter-spacing:0.03em;">${rel}</p>` : '<div style="margin-bottom:12px;"></div>'}
        <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.90; color:${styles.pageText};">${escapeHtml(m.memory_text)}</p>
      </div>`
    }).join('')

    const hasMultipleGroups = Object.keys(groups).length > 1
    return hasMultipleGroups
      ? `<div style="margin-bottom:40px;">${renderSubHeading(era, styles)}${itemsHtml}</div>`
      : `<div style="margin-bottom:18px;">${itemsHtml}</div>`
  }).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Memories', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${memories.length} memor${memories.length !== 1 ? 'ies' : 'y'} shared</p>
    ${groupsHtml}
  </div>`;
}


// ============================================================
// SECTION 12 — Phase photos renderer (organiser-curated slots)
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
    `<div style="display:flex; gap:14px; margin-bottom:14px; page-break-inside:avoid;">
      ${row.map((slot: any) => {
        const url       = photoUrlMap[slot.gallery_item_id] ?? ''
        const caption   = slot.custom_caption ?? ''
        const isFeature = slot.is_feature
        return `<div style="flex:${isFeature ? '2' : '1'}; min-width:0;">
          <img src="${url}" alt="${escapeHtml(caption)}" style="width:100%; height:${isFeature ? '300px' : '200px'}; object-fit:cover; border-radius:10px; display:block;"/>
          ${caption ? `<p style="font-size:10px; color:${styles.secondaryText}; margin-top:7px; font-style:italic; text-align:center; letter-spacing:0.03em;">${escapeHtml(caption)}</p>` : ''}
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
// SECTION 13 — Official Photography renderer
// 2-column premium grid. Ordered by display_order then upload.
// ============================================================

function renderOfficialPhotography(
  galleryItems: GalleryItemData[],
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  const officialPhotos = galleryItems
    .filter(g => g.is_official_photography && photoUrlMap[g.id])
    .sort((a, b) => {
      if (a.display_order !== null && b.display_order !== null) return a.display_order - b.display_order
      if (a.display_order !== null) return -1
      if (b.display_order !== null) return 1
      return 0
    })

  if (officialPhotos.length === 0) return ''

  const COLS = 2
  const rows: GalleryItemData[][] = []
  for (let i = 0; i < officialPhotos.length; i += COLS) {
    rows.push(officialPhotos.slice(i, i + COLS))
  }

  const gridHtml = rows.map(row =>
    `<div style="display:flex; gap:16px; margin-bottom:16px; page-break-inside:avoid;">
      ${row.map(photo => `<div style="flex:1; min-width:0;">
        <img src="${photoUrlMap[photo.id]}" alt="Official Photography" style="width:100%; height:220px; object-fit:cover; border-radius:10px; display:block; image-orientation:from-image;"/>
      </div>`).join('')}
      ${row.length < COLS ? `<div style="flex:1; min-width:0;"></div>` : ''}
    </div>`
  ).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Official Photography', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${officialPhotos.length} photograph${officialPhotos.length !== 1 ? 's' : ''}</p>
    ${gridHtml}
  </div>`;
}


// ============================================================
// SECTION 14 — Guest captures renderer (In The Room)
// 3-column grid. Contributor name as caption where available.
// ============================================================

function renderGuestCaptures(
  galleryItems: GalleryItemData[],
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  const guestPhotos = galleryItems.filter(
    g => g.source === 'dday' && !g.is_official_photography && photoUrlMap[g.id]
  )

  if (guestPhotos.length === 0) return ''

  const COLS = 3
  const rows: GalleryItemData[][] = []
  for (let i = 0; i < guestPhotos.length; i += COLS) {
    rows.push(guestPhotos.slice(i, i + COLS))
  }

  const gridHtml = rows.map(row =>
    `<div style="display:flex; gap:10px; margin-bottom:10px; page-break-inside:avoid;">
      ${row.map(photo => {
        const name = photo.uploaded_by_name ?? photo.caption ?? ''
        return `<div style="flex:1; min-width:0;">
          <img src="${photoUrlMap[photo.id]}" alt="${escapeHtml(name)}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; display:block; image-orientation:from-image;"/>
          ${name ? `<p style="font-size:9px; color:${styles.secondaryText}; margin-top:5px; text-align:center; font-style:italic; letter-spacing:0.02em;">${escapeHtml(name)}</p>` : ''}
        </div>`
      }).join('')}
      ${row.length < COLS ? Array(COLS - row.length).fill(`<div style="flex:1; min-width:0;"></div>`).join('') : ''}
    </div>`
  ).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('In The Room', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${guestPhotos.length} guest photograph${guestPhotos.length !== 1 ? 's' : ''} — moments captured by those who were there</p>
    ${gridHtml}
  </div>`;
}


// ============================================================
// SECTION 15 — Who Attended renderer
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
    `<div style="margin-bottom:24px; page-break-inside:avoid;">
      <p style="font-size:10px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:${styles.accentColor}; margin-bottom:10px;">${escapeHtml(tier)}</p>
      <div style="columns:3; column-gap:20px;">
        ${list.map(g => `<p style="font-size:13px; color:${styles.pageText}; margin-bottom:5px; break-inside:avoid; line-height:1.5;">${escapeHtml(g.name)}</p>`).join('')}
      </div>
    </div>`
  ).join('')

  return `<div style="page-break-before:always;">
    ${renderSectionHeader('Who Attended', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${guests.length} guest${guests.length !== 1 ? 's' : ''} verified at this event</p>
    ${tiersHtml}
  </div>`;
}


// ============================================================
// SECTION 16 — Closing message renderer (always last)
// ============================================================

function renderClosingMessage(capsule: CapsuleData, styles: ThemeStyles): string {
  return `<div style="page-break-before:always; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80vh; text-align:center; padding:80px 60px;">
    <div style="width:48px; height:3px; background:${styles.accentColor}; margin-bottom:40px; border-radius:2px;"></div>
    <p style="font-family:${styles.headingFont}; font-size:26px; color:${styles.pageText}; font-style:italic; margin-bottom:20px; line-height:1.5; max-width:420px;">
      "Events end. Legacies don't."
    </p>
    <p style="font-family:${styles.bodyFont}; font-size:14px; color:${styles.secondaryText}; line-height:1.85; max-width:380px; margin-bottom:48px;">
      This publication was assembled from the voices of those who love and remember ${escapeHtml(capsule.honouree_name)}.
      It is a permanent record — kept for all who contributed, and for those who come after.
    </p>
    <p style="font-family:${styles.bodyFont}; font-size:10px; color:${styles.secondaryText}; opacity:0.45; letter-spacing:0.18em; text-transform:uppercase;">
      LegacyCapsule · VALNEX, UNIPESSOAL LDA · RevoWorldTech
    </p>
    <div style="width:48px; height:3px; background:${styles.accentColor}; margin-top:40px; border-radius:2px;"></div>
  </div>`;
}


// ============================================================
// SECTION 17 — Utilities
// ============================================================

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}


// ============================================================
// SECTION 18 — Page component
// ============================================================

export default async function PublicationRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ autoPrint?: string }>;
}) {
  const { token }     = await params;
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
  const [
    capsuleRes, contribsRes, galleryRes, guestsRes,
    profileRes, topicsRes, memoriesRes, profileGalleryRes,
  ] = await Promise.all([
    adminClient.from('capsules')
      .select('id, honouree_name, honouree_title, event_type, event_date, event_tag, hero_image_url, theme, cover_style')
      .eq('id', capsuleId).single(),

    adminClient.from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, is_anonymous, story_topic_id, is_dday, created_at')
      .eq('capsule_id', capsuleId).eq('status', 'approved').is('deleted_at', null).order('created_at'),

    adminClient.from('gallery_items')
      .select('id, image_url, caption, uploaded_by_name, phase_id, source, is_official_photography, display_order')
      .eq('capsule_id', capsuleId).eq('approved', true).is('deleted_at', null),

    adminClient.from('guests')
      .select('id, name, tier')
      .eq('capsule_id', capsuleId).not('checked_in_at', 'is', null),

    adminClient.from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order, is_active')
      .eq('capsule_id', capsuleId).eq('is_active', true).order('sort_order'),

    adminClient.from('community_story_topics')
      .select('id, topic_name, display_order')
      .eq('capsule_id', capsuleId).eq('status', 'active').order('display_order'),

    adminClient.from('capsule_memories')
      .select('id, contributor_name, memory_text, era_label, relationship, created_at')
      .eq('capsule_id', capsuleId).order('created_at'),

    adminClient.from('capsule_gallery')
      .select('id, image_url, caption, section_index, section_title, sort_order')
      .eq('capsule_id', capsuleId)
      .order('section_index', { ascending: true })
      .order('sort_order', { ascending: true }),
  ]);

  const capsule         = capsuleRes.data  as CapsuleData;
  const contribs        = (contribsRes.data       ?? []) as ContributionData[];
  const gallery         = (galleryRes.data         ?? []) as GalleryItemData[];
  const guests          = (guestsRes.data          ?? []) as GuestData[];
  const profileSections = (profileRes.data         ?? []) as ProfileSectionData[];
  const storyTopics     = (topicsRes.data          ?? []) as StoryTopicData[];
  const memories        = (memoriesRes.data        ?? []) as MemoryData[];
  const profileGallery  = (profileGalleryRes.data  ?? []) as ProfileGalleryItem[];

  if (!capsule) return notFound();

  const theme  = layoutConfig.theme ?? 'classic';
  const styles = THEME_STYLES[theme] ?? THEME_STYLES.classic;

  // ── Resolve signed URLs for gallery_items ─────────────────
  const heroUrl = await toSignedUrl(capsule.hero_image_url);
  const photoUrlMap: Record<string, string> = {};
  await Promise.all(gallery.map(async item => {
    photoUrlMap[item.id] = await toSignedUrl(item.image_url);
  }));

  // ── Build sections — closing message always last ───────────
  const enabledSections  = layoutConfig.sections.filter((s: Section) => s.enabled);
  const closingSection   = enabledSections.find((s: Section) => s.type === 'closing_message');
  const mainSections     = enabledSections.filter((s: Section) => s.type !== 'closing_message');

  const sectionHtml = [
    // Organiser-controlled sections (excluding closing message)
    ...mainSections.map((section: Section) => {
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
        default:
          return '';
      }
    }),
    // Profile gallery — always included when content exists
    renderProfileGallery(profileGallery, styles),
    // Auto-included sections — Official first, then Guest, then Stories, then Memories
    renderOfficialPhotography(gallery, photoUrlMap, styles),
    renderGuestCaptures(gallery, photoUrlMap, styles),
    renderCommunityStories(contribs, storyTopics, styles),
    renderMemories(memories, styles),
    // Closing message always last
    closingSection ? renderClosingMessage(capsule, styles) : '',
  ].filter(Boolean).join('\n');

  // ── A4 instruction banner (screen only, hidden on print) ───
  const bannerHtml = `<div class="no-print" style="position:sticky; top:0; left:0; right:0; z-index:9999; background:#1a0845; color:#E2C36B; padding:10px 20px; font-size:12px; font-family:system-ui,sans-serif; display:flex; align-items:center; gap:16px; justify-content:center;">
    <span>📄</span>
    <span>In the print dialog: set <strong>Paper size → A4</strong> and <strong>Margins → None</strong> for best results</span>
  </div>
  <div class="no-print" style="height:8px;"></div>`;

  const autoPrintScript = shouldAutoPrint
    ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},1400);});</script>`
    : '';

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
          html, body {
            background: #FFFFFF;
            color: ${styles.pageText};
            font-family: ${styles.bodyFont};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: 210mm 297mm; margin: ${styles.pageMarginMm}mm; }
          img { max-width: 100%; display: block; }
          .no-print { display: flex; }
          @media print {
            .no-print { display: none !important; }
            body { background: #FFFFFF; margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
      </head>
      <body dangerouslySetInnerHTML={{
        __html: bannerHtml + sectionHtml + autoPrintScript
      }} />
    </html>
  );
}
