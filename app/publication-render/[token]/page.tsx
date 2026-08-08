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
 *   — v2.11.58: Collection Intelligence renderer added (metrics page between world map and tributes)
 *   — v2.11.58: renderCollectionIntelligence() — voice metrics, distribution, countries, time intel
 *   — v2.11.54: World map renderer added (SVG dot map, server-side, no JS dependency)
 *   — v2.11.54: world_map section type wired into render pipeline
 *   — v2.11.53: Lightbox added — all images clickable to full-screen overlay (screen only, hidden on print)
 *   — v2.11.53: cursor:zoom-in on all pub-body images on screen
 *   — v2.11.52: Body width set to 210mm so mm units resolve correctly on screen
 *   — v2.11.52: html background #E8E8E8 for paper-on-desk screen appearance
 *   — v2.11.52: object-position:top center on official photography and profile gallery
 *   — v2.11.52: break-inside:avoid added to photo grid rows (prevents phantom repeat)
 *   — v2.11.52: Filler div visibility:hidden (was empty div — confused print engine)
 *   — v2.11.51: Banner removed; floating print button added (screen only)
 *   — v2.11.51: Cover height fixed to 297mm (was min-height:100vh — caused page 2 spillover)
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
  ip_country: string | null;
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
// SECTION 3B — Utilities (must precede all renderers)
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

// ── Section padding — consistent horizontal breathing room ──
// Applied to all section outer wrappers for screen and print consistency.
const SECTION_WRAP = `padding:0 ${24}px;`

// ── Section footer — subtle LC brand presence on every page ──
// Appended to every section renderer. 8px, right-aligned, low opacity.
// Renders as design element, not advertising.
const SECTION_FOOTER = `<div style="
  text-align:right;
  padding:18px 0 0;
  margin-top:32px;
  border-top:1px solid rgba(0,0,0,0.04);
">
  <span style="
    font-family:system-ui, sans-serif;
    font-size:7.5px;
    letter-spacing:0.18em;
    text-transform:uppercase;
    color:#B8960C;
    opacity:0.22;
  ">itslegacycapsule.com</span>
</div>`

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
// SECTION 5B — Family Appreciation block renderer
// Rendered just before the closing page — the final human voice.
// Extracted from honouree profile so it can be repositioned.
// AI19 · 7 Aug 2026
// ============================================================

function renderAppreciationBlock(section: ProfileSectionData, styles: ThemeStyles): string {
  if (!section.content?.trim()) return '';
  const content = escapeHtml(section.content);
  const title   = section.custom_title ?? 'Family Appreciation';

  return `<div style="page-break-before:always; break-before:page; display:block; ${SECTION_WRAP}">
    ${renderSectionHeader(title, styles)}
    <div style="
      border:1px solid ${styles.tributeCardBorder};
      border-left:4px solid ${styles.accentColor};
      border-radius:4px;
      padding:32px 36px;
      max-width:680px;
      margin:0 auto;
      page-break-inside:avoid;
      break-inside:avoid;
      background:#FAFAF8;
    ">
      <p style="
        font-family:${styles.bodyFont};
        font-size:15px;
        line-height:1.95;
        color:${styles.pageText};
        white-space:pre-wrap;
        font-style:italic;
        margin:0;
      ">${content}</p>
    </div>
    ${SECTION_FOOTER}
  </div>`;
}

// ============================================================
// SECTION 5C — Foreword page renderer
// Page 2 — what this publication is, why they received it.
// Includes dynamic Capsule Content (TOC) with section descriptions.
// AI19 · 8 Aug 2026
// ============================================================

function renderForeword(
  capsule: CapsuleData,
  sections: Section[],
  contribs: ContributionData[],
  styles: ThemeStyles
): string {
  const langMap: Record<string, string> = {
    memorial:        'tributes',
    wedding:         'blessings',
    birthday:        'birthday wishes',
    graduation:      'congratulations',
    chieftaincy:     'encomiums',
    ordination:      'blessings',
    award_ceremony:  'honours',
    thanksgiving:    'gratitude messages',
    retirement:      'appreciations',
  }
  const participationWord = langMap[capsule.event_type] ?? 'appreciations'
  const displayName = capsule.honouree_title
    ? `${capsule.honouree_title} ${capsule.honouree_name}`
    : capsule.honouree_name

  // ── Build Capsule Content entries from enabled sections ───
  const SECTION_DESCRIPTIONS: Record<string, string> = {
    cover:                  'The opening page — honouree portrait, name, and event occasion.',
    honouree_profile:       'Background, occasion details, and curated notes about the honouree.',
    world_map:              'A visual record of every country from which voices arrived, with a breakdown by nation.',
    tributes:               `The full collection of ${getTributeHeading(capsule.event_type).toLowerCase()} — every voice gathered, in full.`,
    phase_photos:           'Photographs from this phase of the event, curated by the organiser.',
    official_photography:   'Professional photographs captured on the day of the event.',
    guest_captures:         'Candid photographs uploaded by guests present on the day.',
    memories:               'Personal memories shared by contributors, grouped by era.',
    community_stories:      'Stories and reflections organised by topic from the community.',
    closing_message:        'A closing note from LegacyCapsule.',
  }

  const enabledSections = sections.filter(s => s.enabled && s.type !== 'closing_message')
  const tocRows = enabledSections.map(s => {
    const SECTION_DISPLAY_NAMES: Record<string, string> = {
      cover:                'Cover Page',
      honouree_profile:     'Honouree Profile',
      world_map:            'Contributors Country Spread',
      tributes:             getTributeHeading(capsule.event_type),
      official_photography: 'Official Photography',
      guest_captures:       'In The Room',
      memories:             'Memories',
      community_stories:    'Community Stories',
      closing_message:      'Closing Message',
    }
    const label = s.type === 'phase_photos'
      ? (s as PhasePhotosSection).phase_name ?? 'Event Photographs'
      : SECTION_DISPLAY_NAMES[s.type] ?? s.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const desc = s.type === 'phase_photos'
      ? `Photographs from ${(s as PhasePhotosSection).phase_name ?? 'this event phase'}, curated for this publication.`
      : SECTION_DESCRIPTIONS[s.type] ?? 'Content section.'
    return `<div style="display:flex; align-items:baseline; gap:12px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05);">
      <span style="font-family:${styles.headingFont}; font-size:12px; font-weight:700; color:${styles.sectionHeaderTextColor}; white-space:nowrap; min-width:160px;">${escapeHtml(label)}</span>
      <span style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText}; line-height:1.6;">${escapeHtml(desc)}</span>
    </div>`
  }).join('')

  return `<div style="page-break-before:always; ${SECTION_WRAP}">

    <!-- Foreword text -->
    <div style="max-width:600px; margin:60px 0 48px;">
      <p style="font-family:${styles.bodyFont}; font-size:15px; line-height:2; color:${styles.pageText}; margin-bottom:20px;">
        This publication is a living record.
      </p>
      <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.95; color:${styles.pageText}; margin-bottom:20px;">
        It brings together the voices of everyone who chose to honour
        <span style="font-weight:700;">${escapeHtml(displayName)}</span> —
        through ${escapeHtml(participationWord)}, memories, and photographs gathered from across the world.
        Every word here was written freely, from the heart, by someone whose life was touched by theirs.
      </p>
      <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.95; color:${styles.pageText}; margin-bottom:20px;">
        This digital publication has been shared to every email collected in connection with this occasion —
        a keepsake of the legacy of
        <span style="font-weight:700;">${escapeHtml(displayName)}</span>,
        assembled and preserved by LegacyCapsule so that nothing of this moment is lost.
      </p>
      <p style="font-family:${styles.bodyFont}; font-size:14px; line-height:1.95; color:${styles.pageText}; margin-bottom:28px;">
        You have received it because you were part of this story — or because someone who is
        part of it wanted you to know.
      </p>
      <p style="font-family:${styles.headingFont}; font-size:14px; font-style:italic; color:${styles.secondaryText};">
        Keep it. Return to it. Let someone else read it.
      </p>
    </div>

    <!-- Capsule Content (TOC) -->
    ${renderSectionHeader('Capsule Content', styles)}
    <div style="margin-bottom:32px;">
      ${tocRows}
    </div>

    <p style="
      font-family:${styles.bodyFont};
      font-size:12px;
      line-height:1.85;
      color:${styles.secondaryText};
      font-style:italic;
      max-width:540px;
      padding-top:8px;
      border-top:1px solid rgba(0,0,0,0.06);
      margin-bottom:4px;
    ">
      This publication was created using LegacyCapsule — a platform built to gather voices
      and preserve legacies for the people who deserve to be remembered.
      If you have someone worth celebrating,
    </p>
    <p style="
      font-family:${styles.bodyFont};
      font-size:11px;
      font-weight:700;
      letter-spacing:0.08em;
      color:${styles.accentColor};
      margin-bottom:32px;
    ">itslegacycapsule.com</p>

    ${SECTION_FOOTER}
  </div>`
}

// ============================================================
// SECTION 6 — Cover renderer
// ============================================================

function renderCover(capsule: CapsuleData, heroUrl: string, styles: ThemeStyles): string {
  const displayName = capsule.honouree_title
    ? `${capsule.honouree_title} ${capsule.honouree_name}`
    : capsule.honouree_name;
  const dateStr = formatEventDate(capsule.event_date);

  return `<div style="height:297mm; max-height:297mm; background:${styles.coverBg}; color:${styles.coverTextColor}; display:flex; flex-direction:column; justify-content:flex-end; page-break-after:always; break-after:page; position:relative; overflow:hidden; page:cover-page;">
    ${heroUrl ? `<div style="position:absolute; top:0; left:0; right:0; height:62%; overflow:hidden;">
      <img src="${heroUrl}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:center top;"/>
      <div style="position:absolute; bottom:0; left:0; right:0; height:55%; background:linear-gradient(to bottom, transparent, ${styles.coverBg});"></div>
    </div>` : ''}
    <div style="position:relative; padding:64px 52px 60px; z-index:1;">
      <div style="width:52px; height:4px; background:${styles.accentColor}; margin-bottom:28px; border-radius:2px;"></div>
      <p style="font-family:${styles.bodyFont}; font-size:9px; font-weight:700; letter-spacing:0.28em; text-transform:uppercase; opacity:0.45; margin-bottom:6px;">DIGITAL PUBLICATION</p>
      <p style="font-family:${styles.bodyFont}; font-size:9px; font-weight:400; letter-spacing:0.2em; text-transform:uppercase; opacity:0.35; margin-bottom:22px;">by LegacyCapsule</p>
      <h1 style="font-family:${styles.headingFont}; font-size:54px; font-weight:700; line-height:1.08; margin-bottom:18px;">${escapeHtml(displayName)}</h1>
      ${capsule.event_tag ? `<p style="font-family:${styles.bodyFont}; font-size:19px; opacity:0.7; font-style:italic; margin-bottom:10px; line-height:1.4;">${escapeHtml(capsule.event_tag)}</p>` : ''}
      ${dateStr ? `<p style="font-family:${styles.bodyFont}; font-size:13px; opacity:0.5; margin-bottom:0; letter-spacing:0.06em;">${escapeHtml(dateStr)}</p>` : ''}
      <div style="width:52px; height:3px; background:${styles.accentColor}; margin:36px 0 0; border-radius:2px;"></div>
    </div>
    ${SECTION_FOOTER}
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
  const activeSections = profileSections.filter(
    s => s.is_active && s.content?.trim() && s.section_type !== 'appreciation'
  );
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

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader(displayName, styles)}
    ${sectionsHtml}
    ${SECTION_FOOTER}
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
            <img src="${item.image_url}" alt="${escapeHtml(item.caption ?? '')}" style="width:100%; height:160px; object-fit:cover; object-position:top center; border-radius:8px; display:block; image-orientation:from-image;"/>
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

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader('Photo Gallery', styles)}
    ${sectionsHtml}
    ${SECTION_FOOTER}
  </div>`;
}


// ============================================================
// SECTION 9 — Tributes renderer (with serial numbers)
// ============================================================

// Routes participation heading by event type — mirrors platform
// Participation Language Engine for server-side HTML generation.
function getTributeHeading(eventType: string): string {
  switch (eventType) {
    case 'memorial':    return 'Tributes'
    case 'wedding':     return 'Blessings'
    case 'birthday':    return 'Birthday Wishes'
    case 'graduation':  return 'Congratulations'
    case 'chieftaincy': return 'Royal Felicitations'
    case 'dedication':  return 'Dedications'
    default:            return 'Appreciations'
  }
}

function renderTributes(
  section: TributesSection,
  contribs: ContributionData[],
  styles: ThemeStyles,
  eventType: string,
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

  return `<div style="${SECTION_WRAP}">
    ${renderSectionHeader(getTributeHeading(eventType), styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic; letter-spacing:0.03em;">${tributeList.length} voice${tributeList.length !== 1 ? 's' : ''} gathered</p>
    ${cards}
    ${SECTION_FOOTER}
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

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader('Community Stories', styles)}
    ${topicsHtml}
    ${SECTION_FOOTER}
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

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader('Memories', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${memories.length} memor${memories.length !== 1 ? 'ies' : 'y'} shared</p>
    ${groupsHtml}
    ${SECTION_FOOTER}
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
  const slots = section.slots ?? [];
  if (slots.length === 0) return '';

  // ── Render each slot according to its slot_type ───────────
  // FeatureSlot: photo_id (full width)
  // DoubleSlot:  photos[0].photo_id + photos[1].photo_id (side by side)
  // TripleSlot:  photos[0..2].photo_id (three across)

  const slotsHtml = slots.map((slot: PhotoSlot) => {
    if (slot.slot_type === 'feature') {
      const url     = photoUrlMap[slot.photo_id] ?? '';
      if (!url) return '';
      const caption = slot.caption ?? '';
      return `<div style="margin-bottom:14px; page-break-inside:avoid; break-inside:avoid;">
        <img src="${url}" alt="" style="width:100%; height:280px; object-fit:cover; object-position:top center; border-radius:10px; display:block; image-orientation:from-image;"/>
      </div>`;
    }

    if (slot.slot_type === 'double') {
      const photoHtml = slot.photos.map((p: { photo_id: string; caption: string }) => {
        const url = photoUrlMap[p.photo_id] ?? '';
        if (!url) return `<div style="flex:1; min-width:0;"></div>`;
        return `<div style="flex:1; min-width:0;">
          <img src="${url}" alt="${escapeHtml(p.caption)}" style="width:100%; height:210px; object-fit:cover; object-position:top center; border-radius:10px; display:block; image-orientation:from-image;"/>
           
        </div>`;
      }).join('');
      return `<div style="display:flex; gap:14px; margin-bottom:14px; page-break-inside:avoid; break-inside:avoid;">
        ${photoHtml}
      </div>`;
    }

    if (slot.slot_type === 'triple') {
      const photoHtml = slot.photos.map((p: { photo_id: string; caption: string }) => {
        const url = photoUrlMap[p.photo_id] ?? '';
        if (!url) return `<div style="flex:1; min-width:0;"></div>`;
        return `<div style="flex:1; min-width:0;">
          <img src="${url}" alt="${escapeHtml(p.caption)}" style="width:100%; height:160px; object-fit:cover; object-position:top center; border-radius:8px; display:block; image-orientation:from-image;"/>
           
        </div>`;
      }).join('');
      return `<div style="display:flex; gap:10px; margin-bottom:14px; page-break-inside:avoid; break-inside:avoid;">
        ${photoHtml}
      </div>`;
    }

    return '';
  }).filter(Boolean).join('');

  if (!slotsHtml) return '';

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader(section.phase_name ?? 'Event Photographs', styles)}
    ${(section as any).phase_date || (section as any).phase_venue ? `<p style="font-family:${styles.bodyFont}; font-size:12px; color:${styles.secondaryText}; margin:-20px 0 24px; font-style:italic; letter-spacing:0.03em;">${[(section as any).phase_date ? formatEventDate((section as any).phase_date) : '', (section as any).phase_venue ?? ''].filter(Boolean).join(' · ')}</p>` : ''}
    ${slotsHtml}
    ${SECTION_FOOTER}
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
    `<div style="display:flex; gap:16px; margin-bottom:16px; page-break-inside:avoid; break-inside:avoid;">
      ${row.map(photo => `<div style="flex:1; min-width:0;">
        <img src="${photoUrlMap[photo.id]}" alt="Official Photography" style="width:100%; height:220px; object-fit:cover; object-position:top center; border-radius:10px; display:block; image-orientation:from-image;"/>
      </div>`).join('')}
      ${row.length < COLS ? `<div style="flex:1; min-width:0; visibility:hidden;"></div>` : ''}
    </div>`
  ).join('')

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader('Official Photography', styles)}
     
    ${gridHtml}
    ${SECTION_FOOTER}
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

  return `<div style="page-break-before:always; ${SECTION_WRAP}">
    ${renderSectionHeader('In The Room', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">${guestPhotos.length} guest photograph${guestPhotos.length !== 1 ? 's' : ''} — moments captured by those who were there</p>
    ${gridHtml}
    ${SECTION_FOOTER}
  </div>`;
}


// ============================================================
// SECTION 16 — Closing message renderer (always last)
// Premium LC brand page — emotional mission, version in small print.
// AI18 · 6 Aug 2026
// ============================================================

function renderClosingMessage(
  capsule: CapsuleData,
  styles: ThemeStyles,
  version?: number | null
): string {
  const versionLine = version
    ? `<p style="font-family:${styles.bodyFont}; font-size:9px; color:${styles.secondaryText}; opacity:0.25; letter-spacing:0.14em; margin:0 0 6px;">
        Publication v${version}
      </p>`
    : ''

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return `<div style="
    page-break-before:always;
    break-before:page;
    page-break-after:avoid;
    break-after:avoid;
    page:closing-page;
    height:297mm;
    max-height:297mm;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:80px 72px;
    position:relative;
    background:${styles.coverBg ?? styles.pageBg ?? '#FFFFFF'};
    overflow:hidden;
  ">

    <!-- Subtle background texture — two faint radial glows -->
    <div style="
      position:absolute; top:-10%; left:-10%; width:60%; height:60%;
      border-radius:50%;
      background:radial-gradient(circle, rgba(226,195,107,0.06) 0%, transparent 70%);
      pointer-events:none;
    "></div>
    <div style="
      position:absolute; bottom:-10%; right:-10%; width:60%; height:60%;
      border-radius:50%;
      background:radial-gradient(circle, rgba(226,195,107,0.04) 0%, transparent 70%);
      pointer-events:none;
    "></div>

    <!-- Content wrapper -->
    <div style="position:relative; z-index:1; max-width:460px; width:100%;">

      <!-- Top gold rule -->
      <div style="
        width:40px; height:2px; margin:0 auto 52px;
        background:${styles.accentColor};
        border-radius:1px;
      "></div>

      <!-- LC wordmark -->
      <p style="
        font-family:${styles.bodyFont};
        font-size:9px; font-weight:800;
        letter-spacing:0.36em;
        text-transform:uppercase;
        color:${styles.accentColor};
        margin:0 0 48px;
        opacity:0.7;
      ">LEGACYCAPSULE</p>

      <!-- Primary mission statement -->
      <p style="
        font-family:${styles.headingFont};
        font-size:28px;
        font-style:italic;
        font-weight:400;
        color:${styles.coverTextColor ?? styles.pageText};
        line-height:1.45;
        margin:0 0 28px;
        letter-spacing:-0.01em;
      ">
        "Events end.<br/>Legacies don't."
      </p>

      <!-- Gold separator -->
      <div style="
        width:24px; height:1px; margin:0 auto 28px;
        background:${styles.accentColor}; opacity:0.4;
      "></div>

      <!-- Honouree-specific statement -->
      <p style="
        font-family:${styles.bodyFont};
        font-size:14px;
        color:${styles.coverTextColor ?? styles.pageText};
        line-height:1.9;
        margin:0 0 24px;
        opacity:0.8;
      ">
        This publication was assembled from the voices of those<br/>
        who love and remember
        <span style="font-weight:700;">${escapeHtml(capsule.honouree_name)}</span>.
      </p>

      <!-- The deeper thought -->
      <p style="
        font-family:${styles.bodyFont};
        font-size:13px;
        color:${styles.coverTextColor ?? styles.pageText};
        line-height:1.9;
        margin:0 0 52px;
        opacity:0.55;
        max-width:380px;
        margin-left:auto; margin-right:auto;
      ">
        Every voice in these pages is a permanent record — not just of
        an occasion, but of the lives it touched, the bonds it honoured,
        and the love that travelled across cities, countries and generations
        to arrive here.
      </p>

      <!-- Bottom LC identity -->
      <div style="margin-bottom:52px;">
        <p style="
          font-family:${styles.bodyFont};
          font-size:13px;
          color:${styles.coverTextColor ?? styles.pageText};
          font-style:italic;
          opacity:0.7;
          margin:0 0 10px;
          line-height:1.6;
        ">
          Captures and Preserves Memories for ALL your events
        </p>
        <p style="
          font-family:${styles.bodyFont};
          font-size:12px;
          font-weight:700;
          color:${styles.accentColor};
          letter-spacing:0.1em;
          opacity:0.9;
          margin:0 0 16px;
        ">
          itslegacycapsule.com
        </p>
        <p style="
          font-family:${styles.bodyFont};
          font-size:9px;
          color:${styles.coverTextColor ?? styles.pageText};
          letter-spacing:0.22em;
          text-transform:uppercase;
          opacity:0.25;
          margin:0;
        ">
          VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
        </p>
      </div>

      <!-- Bottom gold rule -->
      <div style="
        width:40px; height:2px; margin:0 auto 28px;
        background:${styles.accentColor};
        border-radius:1px;
      "></div>

      <!-- Version + date — barely visible, tucked at bottom -->
      ${versionLine}
      <p style="
        font-family:${styles.bodyFont};
        font-size:9px;
        color:${styles.coverTextColor ?? styles.pageText};
        opacity:0.18;
        letter-spacing:0.1em;
        margin:0;
      ">
        Generated ${generatedDate}
      </p>

    </div>

</div>
</div>

    </div>
  </div>`
}

// ============================================================
// SECTION 16A — Collection Intelligence renderer
// Premium metrics page inserted between World Map and Tributes.
// Named individuals excluded — collective metrics only.
// ============================================================

function renderCollectionIntelligence(
  contribs: ContributionData[],
  styles: ThemeStyles,
  eventType: string,
  galleryItems?: GalleryItemData[],
  memories?: MemoryData[],
): string {
  if (contribs.length === 0) return ''

  // Compute metrics
  const lengths = contribs
    .map(c => (c.tribute_text ?? '').length)
    .filter(l => l > 0)
    .sort((a, b) => a - b)

  const total = contribs.length
  const totalChars = lengths.reduce((s, l) => s + l, 0)
  const avgLength = Math.round(totalChars / (lengths.length || 1))
  const mid = Math.floor(lengths.length / 2)
  const medianLength = lengths.length % 2 === 0
    ? Math.round((lengths[mid - 1] + lengths[mid]) / 2)
    : lengths[mid]
  const shortestLength = lengths[0] ?? 0
  const longestLength = lengths[lengths.length - 1] ?? 0
  const over500 = lengths.filter(l => l > 500).length
  const over500Pct = Math.round((over500 / total) * 10) / 10
  const over1000 = lengths.filter(l => l > 1000).length
  const over1000Pct = Math.round((over1000 / total) * 10) / 10

  // Distribution
  const buckets = [
    { label: 'Under 100',    min: 0,    max: 99   },
    { label: '100–300',      min: 100,  max: 300  },
    { label: '301–500',      min: 301,  max: 500  },
    { label: '501–750',      min: 501,  max: 750  },
    { label: '751–1,000',    min: 751,  max: 1000 },
    { label: '1,001–1,500',  min: 1001, max: 1500 },
    { label: '1,501–2,000',  min: 1501, max: 2000 },
    { label: 'Over 2,000',   min: 2001, max: Infinity },
  ]
  const distribution = buckets
    .map(b => ({
      label: b.label,
      count: lengths.filter(l => l >= b.min && l <= b.max).length,
    }))
    .filter(d => d.count > 0)
  const maxBucketCount = Math.max(...distribution.map(d => d.count))

  // Countries
  const countryCounts: Record<string, number> = {}
  contribs.forEach(c => {
    // ip_country stores full country name — prefer over contributor-typed country
    const resolvedCountry = c.ip_country?.trim() || c.country?.trim()
    if (!resolvedCountry || resolvedCountry === 'Not Listed') return
    countryCounts[resolvedCountry] = (countryCounts[resolvedCountry] ?? 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])

  // Time
  const sorted = [...contribs].sort(
    (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
  )
  const firstDate = sorted[0]?.created_at
  const lastDate = sorted[sorted.length - 1]?.created_at
  const spanDays = firstDate && lastDate
    ? Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000))
    : 1
  const avgPerDay = (total / spanDays).toFixed(1)
  const dayCounts: Record<string, number> = {}
  contribs.forEach(c => {
    if (c.created_at) {
      const day = new Date(c.created_at).toISOString().slice(0, 10)
      dayCounts[day] = (dayCounts[day] ?? 0) + 1
    }
  })
  const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]
  const mostActiveDayStr = topDay
    ? `${new Date(topDay[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${topDay[1]} voices`
    : null

  // Participation language
  const langMap: Record<string, { singular: string; plural: string }> = {
    chieftaincy:     { singular: 'Encomium',        plural: 'Encomiums' },
    birthday:        { singular: 'Wish',             plural: 'Wishes' },
    wedding:         { singular: 'Blessing',         plural: 'Blessings' },
    graduation:      { singular: 'Congratulation',   plural: 'Congratulations' },
    ordination:      { singular: 'Blessing',         plural: 'Blessings' },
    award_ceremony:  { singular: 'Honour',           plural: 'Honours' },
    memorial:        { singular: 'Tribute',          plural: 'Tributes' },
    thanksgiving:    { singular: 'Gratitude',        plural: 'Gratitude Messages' },
    retirement:      { singular: 'Appreciation',     plural: 'Appreciations' },
  }
  const lang = langMap[eventType] ?? { singular: 'Voice', plural: 'Voices' }

  const metricRow = (label: string, value: string) =>
    `<div style="display:flex; justify-content:space-between; align-items:baseline; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
      <span style="font-family:${styles.bodyFont}; font-size:12px; color:${styles.secondaryText};">${label}</span>
      <span style="font-family:${styles.bodyFont}; font-size:13px; font-weight:700; color:${styles.pageText};">${value}</span>
    </div>`

  const distBar = (label: string, count: number) => {
    const pct = Math.round((count / total) * 100)
    const barPct = maxBucketCount > 0 ? Math.round((count / maxBucketCount) * 100) : 0
    return `<div style="margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="font-family:${styles.bodyFont}; font-size:11px; color:${styles.secondaryText};">${label}</span>
        <span style="font-family:${styles.bodyFont}; font-size:11px; font-weight:700; color:${styles.pageText};">${count} <span style="font-weight:400; color:${styles.secondaryText};">(${pct}%)</span></span>
      </div>
      <div style="height:6px; border-radius:3px; background:rgba(0,0,0,0.07); overflow:hidden;">
        <div style="height:100%; border-radius:3px; width:${barPct}%; background:${styles.accentColor};"></div>
      </div>
    </div>`
  }

  const countryBar = (name: string, count: number, rank: number) => {
    const pct = Math.round((count / total) * 100)
    return `<div style="margin-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="font-size:10px; font-weight:800; color:${styles.accentColor}; width:16px; text-align:center;">${rank}</span>
        <span style="font-family:${styles.bodyFont}; font-size:12px; font-weight:600; color:${styles.pageText}; flex:1;">${name}</span>
        <span style="font-family:${styles.bodyFont}; font-size:12px; font-weight:700; color:${styles.pageText};">${count}</span>
        <span style="font-family:${styles.bodyFont}; font-size:10px; color:${styles.secondaryText}; width:34px; text-align:right;">${pct}%</span>
      </div>
      <div style="margin-left:24px; height:4px; border-radius:2px; background:rgba(0,0,0,0.07);">
        <div style="height:100%; border-radius:2px; width:${pct}%; background:${styles.accentColor};"></div>
      </div>
    </div>`
  }

  return `<div style="page-break-before:always; padding:0 0 40px; ${SECTION_WRAP}">
    ${renderSectionHeader(`Capsule Highlights`, styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:28px; font-style:italic;">
      A study of ${total} ${total === 1 ? lang.singular.toLowerCase() : lang.plural.toLowerCase()} gathered for this occasion.
    </p>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:32px;">

      <!-- Left column: Key metrics -->
      <div>
        <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:0 0 12px;">The ${lang.plural}</p>
        <div style="background:#FFFFFF; border-radius:12px; padding:4px 16px; border:1px solid rgba(0,0,0,0.07);">
          ${metricRow(`Total ${lang.plural.toLowerCase()}`, total.toLocaleString())}
          ${metricRow('Total characters written', totalChars.toLocaleString())}
          ${metricRow(`Average ${lang.singular.toLowerCase()} length`, `${avgLength.toLocaleString()} characters`)}
          ${metricRow(`Median ${lang.singular.toLowerCase()} length`, `≈${medianLength.toLocaleString()} characters`)}
          ${metricRow('Shortest', `${shortestLength.toLocaleString()} characters`)}
          ${metricRow('Longest', `${longestLength.toLocaleString()} characters`)}
          ${over500 > 0 ? metricRow(`Over 500 characters`, `${over500} (${over500Pct}%)`) : ''}
          ${over1000 > 0 ? metricRow(`Over 1,000 characters`, `${over1000} (${over1000Pct}%)`) : ''}
        </div>

        <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:20px 0 12px;">When They Arrived</p>
        <div style="background:#FFFFFF; border-radius:12px; padding:4px 16px; border:1px solid rgba(0,0,0,0.07);">
          ${mostActiveDayStr ? metricRow('Most active day', mostActiveDayStr) : ''}
          ${metricRow('Gathering span', `${spanDays} day${spanDays !== 1 ? 's' : ''}`)}
          ${metricRow(`Average per day`, `${avgPerDay} ${lang.plural.toLowerCase()}`)}
        </div>

        <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:20px 0 12px;">Engagement Breakdown</p>
        <div style="background:#FFFFFF; border-radius:12px; padding:4px 16px; border:1px solid rgba(0,0,0,0.07);">
          ${((): string => {
            const stories      = contribs.filter(c => !!c.story_topic_id);
            const ddayPhotos   = (galleryItems ?? []).filter((g: GalleryItemData) => g.source === 'dday' && !g.is_official_photography);
            const officialPics = (galleryItems ?? []).filter((g: GalleryItemData) => g.is_official_photography);
            const memoryCount  = (memories ?? []).length;
            const withPhoto    = contribs.filter(c => !!(c.thumbnail_url || c.image_url)).length;
            const anonCount    = contribs.filter(c => c.is_anonymous).length;
            const nameCounts: Record<string, number> = {};
            contribs.forEach(c => {
              if (!c.is_anonymous && c.contributor_name)
                nameCounts[c.contributor_name] = (nameCounts[c.contributor_name] ?? 0) + 1;
            });
            const repeatCount   = Object.values(nameCounts).filter(v => v > 1).length;
            const ddayUploaders = new Set(ddayPhotos.map((g: GalleryItemData) => g.uploaded_by_name).filter(Boolean)).size;
            const rows: string[] = [];
            if (withPhoto > 0)         rows.push(metricRow('Voices with a photo', `${withPhoto} (${Math.round(withPhoto / total * 100)}%)`));
            if (anonCount > 0)         rows.push(metricRow('Anonymous submissions', String(anonCount)));
            if (repeatCount > 0)       rows.push(metricRow('Repeat contributors', String(repeatCount)));
            if (stories.length > 0) {
              const su = new Set(stories.map(s => s.contributor_name)).size;
              rows.push(metricRow('Community stories', `${stories.length} · ${su} contributor${su !== 1 ? 's' : ''}`));
            }
            if (memoryCount > 0)       rows.push(metricRow('Memories shared', String(memoryCount)));
            if (ddayPhotos.length > 0) rows.push(metricRow('Guest captures', `${ddayPhotos.length} · ${ddayUploaders} uploader${ddayUploaders !== 1 ? 's' : ''}`));
            if (officialPics.length > 0) rows.push(metricRow('Official photographs', String(officialPics.length)));
            return rows.join('');
          })()}
        </div>
      </div>

      <!-- Right column: Distribution only -->
      <div>
        <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:0 0 12px;">Message Character Lengths Breakdown</p>
        <div style="background:#FFFFFF; border-radius:12px; padding:14px 16px; border:1px solid rgba(0,0,0,0.07); margin-bottom:20px;">
          ${distribution.map(d => distBar(d.label, d.count)).join('')}
        </div>

        ${((): string => {
          const relCounts: Record<string, number> = {};
          contribs.forEach(c => {
            if (c.relationship?.trim())
              relCounts[c.relationship.trim()] = (relCounts[c.relationship.trim()] ?? 0) + 1;
          });
          const topRels = Object.entries(relCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          if (topRels.length === 0) return '';
          return `
            <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:0 0 12px;">Received Voices — Top 10 Relationship Categories</p>
            <div style="background:#FFFFFF; border-radius:12px; padding:4px 16px; border:1px solid rgba(0,0,0,0.07);">
              ${topRels.map(([rel, count]) => metricRow(escapeHtml(rel), String(count))).join('')}
            </div>`;
        })()}
      </div>
    </div>

 </div>`
}

// ============================================================
// SECTION 16B — World Map renderer
// Pure SVG dot map — no JS dependency, prints perfectly.
// Country centroids mapped to approximate x/y on a
// simplified equirectangular projection (560×280 viewBox).
// ============================================================

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  NG: [110, 148], GB: [275, 88],  US: [130, 120], CA: [120, 90],
  GH: [100, 150], ZA: [118, 185], KE: [138, 158], ET: [135, 148],
  DE: [290, 90],  FR: [280, 95],  NL: [285, 88],  BE: [282, 90],
  IE: [268, 88],  IT: [295, 98],  ES: [272, 100], PT: [265, 100],
  SE: [295, 78],  NO: [290, 75],  DK: [290, 82],  FI: [305, 75],
  PL: [300, 88],  UA: [310, 90],  RU: [340, 85],  TR: [320, 100],
  IN: [380, 130], CN: [410, 110], JP: [440, 110], AU: [430, 185],
  NZ: [460, 195], BR: [175, 170], AR: [168, 190], MX: [120, 135],
  SG: [420, 158], MY: [415, 155], AE: [350, 128], SA: [340, 130],
  EG: [315, 122], MA: [270, 115], DZ: [280, 115], TN: [285, 108],
  CM: [112, 155], SN: [90,  148], CI: [95,  152], TZ: [135, 165],
  UG: [132, 158], RW: [130, 162], ZM: [125, 172], ZW: [128, 175],
};

// Full country name → ISO 2-letter code lookup
// Covers all countries that appear in LC contributor data
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'Uganda': 'UG',
  'Tanzania': 'TZ', 'South Africa': 'ZA', 'Ethiopia': 'ET',
  'Rwanda': 'RW', 'Zambia': 'ZM', 'Zimbabwe': 'ZW',
  'Cameroon': 'CM', 'Senegal': 'SN', "Côte d'Ivoire": 'CI',
  'Ivory Coast': 'CI', 'Egypt': 'EG', 'Morocco': 'MA',
  'Algeria': 'DZ', 'Tunisia': 'TN',
  'United Kingdom': 'GB', 'UK': 'GB', 'England': 'GB',
  'Germany': 'DE', 'France': 'FR', 'Netherlands': 'NL',
  'Belgium': 'BE', 'Ireland': 'IE', 'Italy': 'IT',
  'Spain': 'ES', 'Portugal': 'PT', 'Sweden': 'SE',
  'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI',
  'Poland': 'PL', 'Ukraine': 'UA', 'Russia': 'RU',
  'Turkey': 'TR', 'Switzerland': 'CH', 'Austria': 'AT',
  'United States': 'US', 'United States of America': 'US',
  'USA': 'US', 'Canada': 'CA', 'Mexico': 'MX',
  'Brazil': 'BR', 'Argentina': 'AR', 'Colombia': 'CO',
  'Jamaica': 'JM', 'Trinidad and Tobago': 'TT',
  'Australia': 'AU', 'New Zealand': 'NZ',
  'India': 'IN', 'China': 'CN', 'Japan': 'JP',
  'Singapore': 'SG', 'Malaysia': 'MY',
  'Saudi Arabia': 'SA', 'UAE': 'AE',
  'United Arab Emirates': 'AE', 'Qatar': 'QA',
  'Greece': 'GR', 'Romania': 'RO',
  'Hungary': 'HU', 'Czech Republic': 'CZ', 'Slovakia': 'SK',
}

function countryToIso(name: string): string {
  // Try exact match first
  if (COUNTRY_NAME_TO_ISO[name]) return COUNTRY_NAME_TO_ISO[name]
  // Try case-insensitive match
  const lower = name.toLowerCase()
  const found = Object.entries(COUNTRY_NAME_TO_ISO).find(
    ([k]) => k.toLowerCase() === lower
  )
  if (found) return found[1]
  // Already an ISO code — return as-is
  if (/^[A-Z]{2}$/.test(name.trim())) return name.trim()
  return ''
}

 function renderWorldMap(
  contribs: ContributionData[],
  styles: ThemeStyles
): string {
  // Gather unique countries — prefer ip_country (ISO) over free text
  const countryCounts: Record<string, number> = {};
  const countryLabels: Record<string, string> = {};
   contribs.forEach(c => {
    // ip_country stores full country name (resolved from Cloudflare ISO at submission)
    // Prefer ip_country over contributor-typed country; both are full names
    const resolvedCountry = c.ip_country?.trim() || c.country?.trim();
    if (!resolvedCountry || resolvedCountry === 'Not Listed') return;

    const iso = countryToIso(resolvedCountry);
    if (!iso) return;
    countryCounts[iso] = (countryCounts[iso] ?? 0) + 1;
    countryLabels[iso] = countryLabels[iso] ?? resolvedCountry;
  });

  const sorted = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return '';

  const totalContribs = contribs.length;
  const countryCount = sorted.length;
  const maxCount = sorted[0][1];

  // ── Build abstract bubble layout ──────────────────────────
  // Each country gets a circle sized proportionally to its count.
  // Arranged in centered rows — largest entries first, smaller below.
  const VB_W = 560;
  const VB_H = sorted.length <= 4 ? 220 : sorted.length <= 7 ? 280 : 340;

  // Calculate circle radii: min 18, max 52
  const circles = sorted.map(([iso, count]) => {
    const ratio = maxCount > 1 ? count / maxCount : 1;
    const r = Math.round(18 + ratio * 34);
    const label = countryLabels[iso] ?? iso;
    return { iso, count, r, label };
  });

  // Arrange in rows — max 4 per row, centered
  const rows: typeof circles[] = [];
  const perRow = sorted.length <= 3 ? sorted.length : sorted.length <= 6 ? 3 : 4;
  for (let i = 0; i < circles.length; i += perRow) {
    rows.push(circles.slice(i, i + perRow));
  }

  let currentY = 0;
  const positioned: Array<{ cx: number; cy: number; r: number; label: string; count: number }> = [];

  rows.forEach(row => {
    const rowMaxR = Math.max(...row.map(c => c.r));
    const rowCenterY = currentY + rowMaxR + 16;
    const totalRowWidth = row.reduce((sum, c) => sum + c.r * 2, 0) + (row.length - 1) * 32;
    let startX = (VB_W - totalRowWidth) / 2;

    row.forEach(circle => {
      const cx = startX + circle.r;
      positioned.push({
        cx,
        cy: rowCenterY,
        r: circle.r,
        label: circle.label,
        count: circle.count,
      });
      startX += circle.r * 2 + 32;
    });

    currentY = rowCenterY + rowMaxR + 24;
  });

  const adjustedVBH = Math.max(VB_H, currentY + 20);

  const circlesSvg = positioned.map(c => {
    const fontSize = c.r >= 30 ? 14 : c.r >= 22 ? 11 : 9;
    const labelFontSize = c.r >= 30 ? 10 : 8;
    const showLabelInside = c.r >= 26;
    const countColor = styles.coverBg ?? '#2D1B69';

    if (showLabelInside) {
      return `
        <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${styles.accentColor}" opacity="0.12"/>
        <circle cx="${c.cx}" cy="${c.cy}" r="${c.r - 2}" fill="none" stroke="${styles.accentColor}" stroke-width="1.5" opacity="0.4"/>
        <text x="${c.cx}" y="${c.cy - 4}" text-anchor="middle" font-family="${styles.bodyFont}" font-size="${fontSize}" font-weight="700" fill="${countColor}">${c.count}</text>
        <text x="${c.cx}" y="${c.cy + labelFontSize + 2}" text-anchor="middle" font-family="${styles.bodyFont}" font-size="${labelFontSize}" fill="${styles.secondaryText}" opacity="0.7">${c.label}</text>
      `;
    } else {
      return `
        <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${styles.accentColor}" opacity="0.15"/>
        <circle cx="${c.cx}" cy="${c.cy}" r="${c.r - 1.5}" fill="none" stroke="${styles.accentColor}" stroke-width="1" opacity="0.35"/>
        <text x="${c.cx}" y="${c.cy + 3}" text-anchor="middle" font-family="${styles.bodyFont}" font-size="${fontSize}" font-weight="700" fill="${countColor}">${c.count}</text>
        <text x="${c.cx}" y="${c.cy + c.r + labelFontSize + 6}" text-anchor="middle" font-family="${styles.bodyFont}" font-size="${labelFontSize}" fill="${styles.secondaryText}" opacity="0.6">${c.label}</text>
      `;
    }
  }).join('');

  return `<div style="page-break-before:always; padding:0 0 40px; ${SECTION_WRAP}">
    ${renderSectionHeader('Contributors Country Spread', styles)}
    <p style="font-family:${styles.bodyFont}; font-size:13px; color:${styles.secondaryText}; margin-bottom:32px; font-style:italic;">
      ${totalContribs} voice${totalContribs !== 1 ? 's' : ''} gathered from ${countryCount} countr${countryCount !== 1 ? 'ies' : 'y'} across the world
    </p>
    <div style="border-radius:16px; overflow:hidden; border:1px solid ${styles.tributeCardBorder}; background:#FAFAF8; padding:32px 24px; margin-bottom:32px;">
      <svg viewBox="0 0 ${VB_W} ${adjustedVBH}" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
        ${circlesSvg}
      </svg>
    </div>

    <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:${styles.accentColor}; margin:0 0 12px;">Countries Breakdown</p>
    <div style="background:#FFFFFF; border-radius:12px; padding:14px 16px; border:1px solid rgba(0,0,0,0.07);">
      ${sorted.map(([iso, count], i) => {
        const name = countryLabels[iso] ?? iso;
        const pct  = Math.round((count / totalContribs) * 100);
        return `<div style="margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:10px; font-weight:800; color:${styles.accentColor}; width:16px; text-align:center;">${i + 1}</span>
            <span style="font-family:${styles.bodyFont}; font-size:12px; font-weight:600; color:${styles.pageText}; flex:1;">${escapeHtml(name)}</span>
            <span style="font-family:${styles.bodyFont}; font-size:12px; font-weight:700; color:${styles.pageText};">${count}</span>
            <span style="font-family:${styles.bodyFont}; font-size:10px; color:${styles.secondaryText}; width:34px; text-align:right;">${pct}%</span>
          </div>
          <div style="margin-left:24px; height:4px; border-radius:2px; background:rgba(0,0,0,0.07);">
            <div style="height:100%; border-radius:2px; width:${pct}%; background:${styles.accentColor};"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${SECTION_FOOTER}
  </div>`;
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
    capsuleRes, contribsRes, galleryRes,
    profileRes, topicsRes, memoriesRes, profileGalleryRes, phasesRes,
  ] = await Promise.all([
    adminClient.from('capsules')
      .select('id, honouree_name, honouree_title, event_type, event_date, event_tag, hero_image_url, theme, cover_style')
      .eq('id', capsuleId).single(),

adminClient.from('contributions')
      .select('id, contributor_name, city, country, ip_country, relationship, tribute_text, thumbnail_url, is_anonymous, story_topic_id, is_dday, created_at')
      .eq('capsule_id', capsuleId).eq('status', 'approved').is('deleted_at', null).order('created_at'),

    adminClient.from('gallery_items')
      .select('id, image_url, caption, uploaded_by_name, phase_id, source, is_official_photography, display_order')
      .eq('capsule_id', capsuleId).eq('approved', true).is('deleted_at', null),

     

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

    adminClient.from('capsule_phases')
      .select('id, name, event_date, venue')
      .eq('capsule_id', capsuleId)
      .is('deleted_at', null),
  ]);

  const capsule         = capsuleRes.data  as CapsuleData;
  const contribs        = (contribsRes.data       ?? []) as ContributionData[];
  const gallery         = (galleryRes.data         ?? []) as GalleryItemData[];
    
  const profileSections = (profileRes.data         ?? []) as ProfileSectionData[];
  const storyTopics     = (topicsRes.data          ?? []) as StoryTopicData[];
  const memories        = (memoriesRes.data        ?? []) as MemoryData[];
  const profileGallery  = (profileGalleryRes.data  ?? []) as ProfileGalleryItem[];
  const phases          = (phasesRes.data          ?? []) as Array<{ id: string; name: string; event_date: string | null; venue: string | null }>;

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
          return renderCover(capsule, heroUrl, styles)
            + renderForeword(capsule, layoutConfig.sections, contribs, styles);
        case 'honouree_profile':
          return renderHonoureeProfile(capsule, profileSections, styles);
        case 'tributes': {
          const collIntelHtml = renderCollectionIntelligence(contribs, styles, capsule.event_type ?? 'retirement', gallery, memories)
          return collIntelHtml + renderTributes(section as TributesSection, contribs, styles, capsule.event_type)
        }
        case 'phase_photos':
          return renderPhasePhotos(section as PhasePhotosSection, photoUrlMap, styles);
          
        case 'world_map':
          return renderWorldMap(contribs, styles);
        // collection_intelligence renders inside the tributes case — no separate case needed
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
    
    // Family appreciation — always just before closing
    ...profileSections
      .filter(s => s.is_active && s.section_type === 'appreciation' && s.content?.trim())
      .map(s => renderAppreciationBlock(s, styles)),
  
      // Closing message always last
    closingSection ? renderClosingMessage(capsule, styles, pub.version ?? null) : '',
  ].filter(Boolean).join('\n');

  // ── Floating print button (screen only, hidden on print) ───
  const printButtonHtml = `<div class="no-print" style="position:fixed; top:16px; right:16px; z-index:9999;">
    <button onclick="window.print()" style="display:flex; align-items:center; gap:8px; padding:9px 18px; border-radius:24px; background:#1a0845; border:1px solid rgba(226,195,107,0.35); color:#E2C36B; font-size:12px; font-family:system-ui,sans-serif; font-weight:600; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.3); letter-spacing:0.04em;">
      <span>🖨</span><span>Print / Save PDF</span>
    </button>
  </div>`;

  const autoPrintScript = shouldAutoPrint
    ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},1400);});</script>`
    : '';

  const lightboxScript = `<div id="lc-lightbox" class="no-print" style="display:none; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.92); align-items:center; justify-content:center; cursor:zoom-out;" onclick="this.style.display='none'; document.body.style.overflow='';">
    <img id="lc-lightbox-img" src="" alt="" style="max-width:92vw; max-height:92vh; object-fit:contain; border-radius:8px; box-shadow:0 24px 80px rgba(0,0,0,0.8); pointer-events:none;"/>
    <button onclick="event.stopPropagation(); document.getElementById('lc-lightbox').style.display='none'; document.body.style.overflow='';" style="position:fixed; top:20px; right:24px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:22px; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">✕</button>
  </div>
  <script>
    (function(){
      function openLightbox(src){
        var lb=document.getElementById('lc-lightbox');
        var img=document.getElementById('lc-lightbox-img');
        img.src=src;
        lb.style.display='flex';
        document.body.style.overflow='hidden';
      }
      document.addEventListener('click',function(e){
        var t=e.target;
        if(t.tagName==='IMG' && t.closest('#lc-lightbox')===null && !t.dataset.nolightbox){
          openLightbox(t.src);
        }
      });
      document.addEventListener('keydown',function(e){
        if(e.key==='Escape'){
          document.getElementById('lc-lightbox').style.display='none';
          document.body.style.overflow='';
        }
      });
    })();
  </script>`;

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
          html {
            background: #E8E8E8;
          }
          body {
            width: 210mm;
            margin: 0 auto;
            background: #FFFFFF;
            color: ${styles.pageText};
            font-family: ${styles.bodyFont};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: 210mm 297mm; margin: ${styles.pageMarginMm}mm; }
@page cover-page { size: 210mm 297mm; margin: 0mm; }
@page closing-page { size: 210mm 297mm; margin: 0mm; }
          img { max-width: 100%; display: block; }
          @media screen {
            .pub-body img:not([data-nolightbox]) { cursor: zoom-in; }
          }
          .no-print { display: flex; }
          @media print {
            .no-print { display: none !important; }
            html { background: #FFFFFF; }
            body { width: 100%; margin: 0; padding: 0; background: #FFFFFF; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
      </head>
      <body dangerouslySetInnerHTML={{
        __html: printButtonHtml + lightboxScript + `<div class="pub-body">` + sectionHtml + `</div>` + autoPrintScript
      }} />
    </html>
  );
}
