/**
 * ============================================================
 * LEGACYCAPSULE — /publication-render/[token]/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * The hidden publication render page.
 *
 * This route is NEVER visited by users directly.
 * It is navigated to exclusively by Puppeteer during PDF generation.
 * The [token] parameter is a one-time render_token written to the
 * publications row immediately before Puppeteer launches.
 *
 * Security model:
 *   → Token is a 32-byte hex string (64 chars), cryptographically random.
 *   → Token is stored in publications.render_token (UNIQUE index).
 *   → Token is set to null immediately after PDF upload. Cannot be reused.
 *   → If token is not found in the database, notFound() is called.
 *   → Route is not linked from any page. URL is never exposed to organisers.
 *
 * All images are fetched as signed Supabase Storage URLs before the
 * HTML is rendered. Puppeteer sees absolute authenticated URLs and
 * does not need to perform any additional auth.
 *
 * data-contribution-id attributes on tribute cards enable the
 * page_map extraction step in the PDF generation pipeline.
 * Do not remove them.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type {
  LayoutConfig,
  Section,
  CoverSection,
  HonoureeProfileSection,
  TributesSection,
  PhasePhotosSection,
  WhoAttendedSection,
  ClosingMessageSection,
  PhotoSlot,
  PublicationTheme,
} from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Supabase admin client
// All data fetched server-side with service role key.
// Signed URLs for images generated server-side — never exposed raw.
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes — enough for Puppeteer to load images


// ============================================================
// SECTION 2 — Data types for fetched content
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
  image_url: string | null;
  is_anonymous: boolean;
  created_at: string;
}

interface GalleryItemData {
  id: string;
  image_url: string;
  caption: string | null;
  phase_id: string | null;
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


// ============================================================
// SECTION 3 — Signed URL helper
// All Supabase Storage paths must be converted to signed URLs
// before being placed in the HTML. Puppeteer cannot authenticate.
// ============================================================

async function toSignedUrl(rawUrl: string | null): Promise<string> {
  if (!rawUrl) return '';
  try {
    // Extract bucket and path from the Supabase storage URL
    // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // or:     https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<path>
    const url = new URL(rawUrl);
    const parts = url.pathname.split('/storage/v1/object/');
    if (parts.length < 2) return rawUrl; // Not a Supabase storage URL — return as-is

    const [, rest] = parts;
    const pathParts = rest.replace(/^(public|sign)\//, '').split('/');
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join('/');

    const { data } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    return data?.signedUrl ?? rawUrl;
  } catch {
    return rawUrl; // On any error, return original — Puppeteer may still load it
  }
}


// ============================================================
// SECTION 4 — Theme style definitions
// One style object per theme. Controls all visual decisions:
//   bg, text, heading font, body font, accent colour,
//   section header treatment, cover layout feel.
// Applied via inline styles in the render — no external CSS loaded
// (avoids Puppeteer font/network timing issues).
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
  tributeCardBg: string;
  tributeCardBorder: string;
  pageMarginMm: number;
}

const THEME_STYLES: Record<PublicationTheme, ThemeStyles> = {
  // ── Classic ──────────────────────────────────────────────
  // Retirement, Ordination, Award, Memorial
  // Deep purple + antique gold + cream. Formal. Playfair Display.
  classic: {
    pageBg:                   '#F5F3EE',
    pageText:                 '#1C1C1E',
    secondaryText:            '#5F5E5A',
    accentColor:              '#B8960C',
    headingFont:              "'Playfair Display', Georgia, serif",
    bodyFont:                 "'Playfair Display', Georgia, serif",
    coverBg:                  '#2D1B69',
    coverTextColor:           '#F5F3EE',
    sectionHeaderBorderColor: '#B8960C',
    sectionHeaderTextColor:   '#2D1B69',
    sectionHeaderStyle:       'rule-gold',
    tributeCardBg:            '#FFFFFF',
    tributeCardBorder:        '#E8E4DC',
    pageMarginMm:             20,
  },

  // ── Soft ─────────────────────────────────────────────────
  // Milestone Birthday, Anniversary
  // Blush + dusty rose + warm white. Airy. Cormorant Garamond light italic.
  soft: {
    pageBg:                   '#FAFAF8',
    pageText:                 '#3D2B2B',
    secondaryText:            '#8B6E6E',
    accentColor:              '#C4918A',
    headingFont:              "'Cormorant Garamond', 'Garamond', Georgia, serif",
    bodyFont:                 "'Cormorant Garamond', 'Garamond', Georgia, serif",
    coverBg:                  '#F2E8E4',
    coverTextColor:           '#3D2B2B',
    sectionHeaderBorderColor: '#C4918A',
    sectionHeaderTextColor:   '#C4918A',
    sectionHeaderStyle:       'centred-italic',
    tributeCardBg:            '#FFFFFF',
    tributeCardBorder:        '#EDE0DC',
    pageMarginMm:             22,
  },

  // ── Romantic ─────────────────────────────────────────────
  // Wedding
  // Ivory + champagne gold + soft black. Cormorant Garamond.
  // Ornamental SVG divider between sections.
  romantic: {
    pageBg:                   '#FAF7F2',
    pageText:                 '#1A1A1A',
    secondaryText:            '#6B6560',
    accentColor:              '#C9A96E',
    headingFont:              "'Cormorant Garamond', 'Garamond', Georgia, serif",
    bodyFont:                 "'Cormorant Garamond', 'Garamond', Georgia, serif",
    coverBg:                  '#FAF7F2',
    coverTextColor:           '#1A1A1A',
    sectionHeaderBorderColor: '#C9A96E',
    sectionHeaderTextColor:   '#1A1A1A',
    sectionHeaderStyle:       'ornamental',
    tributeCardBg:            '#FFFFFF',
    tributeCardBorder:        '#EDE8E0',
    pageMarginMm:             24,
  },

  // ── Vibrant ───────────────────────────────────────────────
  // Graduation, Chieftaincy, Conference
  // Rich navy + bright gold + white. DM Sans bold. Full-width band headers.
  vibrant: {
    pageBg:                   '#FFFFFF',
    pageText:                 '#0D1B3E',
    secondaryText:            '#4A5568',
    accentColor:              '#D4AE2A',
    headingFont:              "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    bodyFont:                 "'Playfair Display', Georgia, serif",
    coverBg:                  '#0D1B3E',
    coverTextColor:           '#FFFFFF',
    sectionHeaderBorderColor: '#D4AE2A',
    sectionHeaderTextColor:   '#FFFFFF',
    sectionHeaderStyle:       'band',
    tributeCardBg:            '#F8F9FC',
    tributeCardBorder:        '#E2E8F0',
    pageMarginMm:             18,
  },

  // ── Spiritual ────────────────────────────────────────────
  // Thanksgiving Service, Ordination (alt)
  // Deep forest + warm gold + parchment. Cormorant Garamond. Reverent.
  spiritual: {
    pageBg:                   '#F7F3EC',
    pageText:                 '#1B3A2D',
    secondaryText:            '#5A7262',
    accentColor:              '#C8A96E',
    headingFont:              "'Cormorant Garamond', 'Garamond', Georgia, serif",
    bodyFont:                 "'Cormorant Garamond', 'Garamond', Georgia, serif",
    coverBg:                  '#1B3A2D',
    coverTextColor:           '#F7F3EC',
    sectionHeaderBorderColor: '#C8A96E',
    sectionHeaderTextColor:   '#1B3A2D',
    sectionHeaderStyle:       'cross',
    tributeCardBg:            '#FFFFFF',
    tributeCardBorder:        '#DDD8CC',
    pageMarginMm:             22,
  },
};


// ============================================================
// SECTION 5 — Section header renderers
// Each sectionHeaderStyle maps to a specific HTML/SVG treatment.
// ============================================================

function renderSectionHeader(title: string, styles: ThemeStyles): string {
  const { sectionHeaderStyle, sectionHeaderBorderColor, sectionHeaderTextColor,
          headingFont, accentColor } = styles;

  switch (sectionHeaderStyle) {

    // Classic — gold rule above and below, small caps label in gold
    case 'rule-gold':
      return `
        <div style="margin: 40px 0 28px; text-align: center;">
          <div style="height: 1.5px; background: ${sectionHeaderBorderColor}; margin-bottom: 14px;"></div>
          <h2 style="
            font-family: ${headingFont};
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: ${sectionHeaderTextColor};
            margin: 0;
            padding: 0 16px;
          ">${title}</h2>
          <div style="height: 1.5px; background: ${sectionHeaderBorderColor}; margin-top: 14px;"></div>
        </div>`;

    // Soft — thin rose rule, centred italic header
    case 'centred-italic':
      return `
        <div style="margin: 40px 0 28px; text-align: center;">
          <div style="height: 0.75px; background: ${sectionHeaderBorderColor}; opacity: 0.5; margin-bottom: 16px;"></div>
          <h2 style="
            font-family: ${headingFont};
            font-size: 22px;
            font-weight: 300;
            font-style: italic;
            color: ${sectionHeaderTextColor};
            margin: 0;
            letter-spacing: 0.04em;
          ">${title}</h2>
        </div>`;

    // Romantic — ornamental SVG flourish, centred title
    case 'ornamental':
      return `
        <div style="margin: 48px 0 32px; text-align: center;">
          <svg width="160" height="16" viewBox="0 0 160 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 12px;">
            <line x1="0" y1="8" x2="60" y2="8" stroke="${sectionHeaderBorderColor}" stroke-width="0.75"/>
            <circle cx="80" cy="8" r="4" fill="${sectionHeaderBorderColor}"/>
            <circle cx="70" cy="8" r="2" fill="${sectionHeaderBorderColor}" opacity="0.5"/>
            <circle cx="90" cy="8" r="2" fill="${sectionHeaderBorderColor}" opacity="0.5"/>
            <line x1="100" y1="8" x2="160" y2="8" stroke="${sectionHeaderBorderColor}" stroke-width="0.75"/>
          </svg>
          <h2 style="
            font-family: ${headingFont};
            font-size: 20px;
            font-weight: 400;
            font-style: italic;
            color: ${sectionHeaderTextColor};
            margin: 0;
            letter-spacing: 0.06em;
          ">${title}</h2>
          <svg width="160" height="16" viewBox="0 0 160 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:12px auto 0;">
            <line x1="0" y1="8" x2="60" y2="8" stroke="${sectionHeaderBorderColor}" stroke-width="0.75"/>
            <circle cx="80" cy="8" r="4" fill="${sectionHeaderBorderColor}"/>
            <circle cx="70" cy="8" r="2" fill="${sectionHeaderBorderColor}" opacity="0.5"/>
            <circle cx="90" cy="8" r="2" fill="${sectionHeaderBorderColor}" opacity="0.5"/>
            <line x1="100" y1="8" x2="160" y2="8" stroke="${sectionHeaderBorderColor}" stroke-width="0.75"/>
          </svg>
        </div>`;

    // Vibrant — bold full-width colour band with white text
    case 'band':
      return `
        <div style="
          margin: 40px -${styles.pageMarginMm}mm 28px;
          padding: 14px ${styles.pageMarginMm}mm;
          background: ${styles.coverBg};
        ">
          <h2 style="
            font-family: ${styles.headingFont};
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: ${sectionHeaderTextColor};
            margin: 0;
          ">${title}</h2>
        </div>`;

    // Spiritual — gold mark (cross/leaf), centred heading
    case 'cross':
      return `
        <div style="margin: 44px 0 28px; text-align: center;">
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 12px;">
            <line x1="12" y1="0" x2="12" y2="32" stroke="${accentColor}" stroke-width="1.5"/>
            <line x1="4" y1="10" x2="20" y2="10" stroke="${accentColor}" stroke-width="1.5"/>
          </svg>
          <h2 style="
            font-family: ${headingFont};
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: ${sectionHeaderTextColor};
            margin: 0;
          ">${title}</h2>
          <div style="width: 40px; height: 1px; background: ${accentColor}; margin: 12px auto 0;"></div>
        </div>`;

    default:
      return `<h2 style="font-family: ${headingFont}; font-size: 18px; margin: 32px 0 16px;">${title}</h2>`;
  }
}


// ============================================================
// SECTION 6 — Photo slot renderer
// Converts slot type (feature / double / triple) to HTML table cells.
// Uses table layout for PDF compatibility — flexbox can misfire in Puppeteer.
// ============================================================

function renderPhotoSlots(
  slots: PhotoSlot[],
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  return slots.map(slot => {
    if (slot.slot_type === 'feature') {
      const url = photoUrlMap[slot.photo_id] ?? '';
      return `
        <div style="margin-bottom: 12px; page-break-inside: avoid;">
          ${url ? `<img src="${url}" alt="${escapeHtml(slot.caption)}" style="
            width: 100%; max-height: 380px;
            object-fit: cover; display: block;
            border-radius: 2px;
            print-color-adjust: exact;
          "/>` : ''}
          ${slot.caption ? `<p style="
            font-family: ${styles.bodyFont};
            font-size: 9px; color: ${styles.secondaryText};
            margin: 4px 0 0; text-align: center;
          ">${escapeHtml(slot.caption)}</p>` : ''}
        </div>`;
    }

    if (slot.slot_type === 'double') {
      const [a, b] = slot.photos;
      return `
        <table style="width:100%; border-collapse:collapse; margin-bottom: 12px; page-break-inside: avoid;">
          <tr>
            <td style="width:50%; padding-right:5px; vertical-align:top;">
              ${renderSlotPhoto(a.photo_id, a.caption, photoUrlMap, styles)}
            </td>
            <td style="width:50%; padding-left:5px; vertical-align:top;">
              ${renderSlotPhoto(b.photo_id, b.caption, photoUrlMap, styles)}
            </td>
          </tr>
        </table>`;
    }

    // Triple
    const [a, b, c] = slot.photos;
    return `
      <table style="width:100%; border-collapse:collapse; margin-bottom: 12px; page-break-inside: avoid;">
        <tr>
          <td style="width:33.33%; padding-right:4px; vertical-align:top;">
            ${renderSlotPhoto(a.photo_id, a.caption, photoUrlMap, styles)}
          </td>
          <td style="width:33.33%; padding: 0 2px; vertical-align:top;">
            ${renderSlotPhoto(b.photo_id, b.caption, photoUrlMap, styles)}
          </td>
          <td style="width:33.33%; padding-left:4px; vertical-align:top;">
            ${renderSlotPhoto(c.photo_id, c.caption, photoUrlMap, styles)}
          </td>
        </tr>
      </table>`;
  }).join('');
}

function renderSlotPhoto(
  photoId: string,
  caption: string,
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  const url = photoUrlMap[photoId] ?? '';
  return `
    ${url ? `<img src="${url}" alt="${escapeHtml(caption)}" style="
      width: 100%; height: 180px;
      object-fit: cover; display: block;
      border-radius: 2px;
      print-color-adjust: exact;
    "/>` : `<div style="width:100%;height:180px;background:#eee;border-radius:2px;"></div>`}
    ${caption ? `<p style="
      font-family: ${styles.bodyFont};
      font-size: 8px; color: ${styles.secondaryText};
      margin: 3px 0 0; text-align: center;
    ">${escapeHtml(caption)}</p>` : ''}`;
}


// ============================================================
// SECTION 7 — Individual section renderers
// One function per section type. Each renders to an HTML string.
// All use inline styles — no external CSS dependencies.
// ============================================================

function renderCover(
  capsule: CapsuleData,
  heroUrl: string,
  styles: ThemeStyles
): string {
  const coverStyle = capsule.cover_style ?? 'full_bleed';

  if (coverStyle === 'full_bleed') {
    return `
      <div style="
        width: 100%; height: 100vh; min-height: 297mm;
        background-color: ${styles.coverBg};
        position: relative; page-break-after: always;
        display: flex; flex-direction: column; justify-content: flex-end;
        print-color-adjust: exact;
      ">
        ${heroUrl ? `
          <img src="${heroUrl}" style="
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%; object-fit: cover;
            print-color-adjust: exact;
          "/>
          <div style="
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
          "></div>
        ` : ''}
        <div style="position: relative; padding: 48px; z-index: 1;">
          ${capsule.event_tag ? `<p style="
            font-family: ${styles.headingFont};
            font-size: 10px; letter-spacing: 0.2em;
            text-transform: uppercase;
            color: ${heroUrl ? '#FFFFFF' : styles.coverTextColor};
            opacity: 0.8; margin: 0 0 12px;
          ">${escapeHtml(capsule.event_tag)}</p>` : ''}
          <h1 style="
            font-family: ${styles.headingFont};
            font-size: 48px; font-weight: 700;
            line-height: 1.1;
            color: ${heroUrl ? '#FFFFFF' : styles.coverTextColor};
            margin: 0 0 12px;
          ">${escapeHtml(capsule.honouree_name)}</h1>
          ${capsule.honouree_title ? `<p style="
            font-family: ${styles.bodyFont};
            font-size: 16px; font-style: italic;
            color: ${heroUrl ? 'rgba(255,255,255,0.85)' : styles.coverTextColor};
            margin: 0 0 8px;
          ">${escapeHtml(capsule.honouree_title)}</p>` : ''}
          ${capsule.event_date ? `<p style="
            font-family: ${styles.bodyFont};
            font-size: 12px;
            color: ${heroUrl ? 'rgba(255,255,255,0.7)' : styles.secondaryText};
            margin: 0;
          ">${formatEventDate(capsule.event_date)}</p>` : ''}
        </div>
      </div>`;
  }

  if (coverStyle === 'split') {
    return `
      <div style="
        width: 100%; min-height: 297mm;
        display: flex; page-break-after: always;
        print-color-adjust: exact;
      ">
        <div style="width: 50%; background: ${styles.coverBg};">
          ${heroUrl ? `<img src="${heroUrl}" style="width:100%; height:100%; object-fit:cover; print-color-adjust:exact;"/>` : ''}
        </div>
        <div style="
          width: 50%; background: ${styles.pageBg};
          display: flex; align-items: center; justify-content: center;
          padding: 48px;
        ">
          <div>
            ${capsule.event_tag ? `<p style="
              font-family: ${styles.headingFont};
              font-size: 9px; letter-spacing: 0.2em;
              text-transform: uppercase;
              color: ${styles.accentColor};
              margin: 0 0 16px;
            ">${escapeHtml(capsule.event_tag)}</p>` : ''}
            <h1 style="
              font-family: ${styles.headingFont};
              font-size: 36px; font-weight: 700;
              line-height: 1.15; color: ${styles.pageText};
              margin: 0 0 16px;
            ">${escapeHtml(capsule.honouree_name)}</h1>
            <div style="width:48px; height:2px; background:${styles.accentColor}; margin-bottom:16px;"></div>
            ${capsule.honouree_title ? `<p style="
              font-family: ${styles.bodyFont};
              font-size: 14px; font-style: italic;
              color: ${styles.secondaryText}; margin: 0 0 8px;
            ">${escapeHtml(capsule.honouree_title)}</p>` : ''}
            ${capsule.event_date ? `<p style="
              font-family: ${styles.bodyFont};
              font-size: 11px; color: ${styles.secondaryText}; margin: 0;
            ">${formatEventDate(capsule.event_date)}</p>` : ''}
          </div>
        </div>
      </div>`;
  }

  // Typographic cover — no image
  return `
    <div style="
      width: 100%; min-height: 297mm;
      background: ${styles.coverBg}; page-break-after: always;
      display: flex; align-items: center; justify-content: center;
      print-color-adjust: exact;
    ">
      <div style="text-align: center; padding: 80px 64px;">
        <div style="width:60px; height:3px; background:${styles.accentColor}; margin:0 auto 40px;"></div>
        <h1 style="
          font-family: ${styles.headingFont};
          font-size: 56px; font-weight: 700;
          line-height: 1.1; color: ${styles.coverTextColor};
          margin: 0 0 24px;
        ">${escapeHtml(capsule.honouree_name)}</h1>
        ${capsule.honouree_title ? `<p style="
          font-family: ${styles.bodyFont};
          font-size: 18px; font-style: italic;
          color: ${styles.coverTextColor}; opacity: 0.8;
          margin: 0 0 16px;
        ">${escapeHtml(capsule.honouree_title)}</p>` : ''}
        ${capsule.event_tag ? `<p style="
          font-family: ${styles.headingFont};
          font-size: 10px; letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${styles.coverTextColor}; opacity: 0.6;
          margin: 16px 0 0;
        ">${escapeHtml(capsule.event_tag)}</p>` : ''}
        <div style="width:60px; height:3px; background:${styles.accentColor}; margin:40px auto 0;"></div>
      </div>
    </div>`;
}

function renderTributes(
  section: TributesSection,
  contributions: ContributionData[],
  styles: ThemeStyles
): string {
  const itemMap = new Map(contributions.map(c => [c.id, c]));

  // Build ordered list from section items (respects organiser order_mode)
  const ordered = section.items
    .map(item => itemMap.get(item.contribution_id))
    .filter(Boolean) as ContributionData[];

  const cards = ordered.map(c => {
    const displayName = c.is_anonymous ? 'Anonymous' : escapeHtml(c.contributor_name);
    const locationParts = [c.city, c.country].filter(Boolean);
    const location = locationParts.join(', ');

    return `
      <div
        data-contribution-id="${c.id}"
        style="
          background: ${styles.tributeCardBg};
          border: 1px solid ${styles.tributeCardBorder};
          border-radius: 4px;
          padding: 20px 22px;
          margin-bottom: 14px;
          page-break-inside: avoid;
        "
      >
        <div style="
          display: flex; justify-content: space-between;
          align-items: baseline; margin-bottom: 10px;
        ">
          <strong style="
            font-family: ${styles.headingFont};
            font-size: 13px; color: ${styles.pageText};
          ">${displayName}</strong>
          ${location ? `<span style="
            font-family: ${styles.bodyFont};
            font-size: 10px; color: ${styles.secondaryText};
          ">${escapeHtml(location)}</span>` : ''}
        </div>
        ${c.relationship ? `<p style="
          font-family: ${styles.bodyFont};
          font-size: 10px; font-style: italic;
          color: ${styles.accentColor};
          margin: 0 0 8px;
        ">${escapeHtml(c.relationship)}</p>` : ''}
        ${c.tribute_text ? `<p style="
          font-family: ${styles.bodyFont};
          font-size: 12px; line-height: 1.7;
          color: ${styles.pageText};
          margin: 0;
          white-space: pre-wrap;
        ">${escapeHtml(c.tribute_text)}</p>` : ''}
        ${c.image_url ? `<img src="${c.image_url}" style="
          width:100%; max-height:220px;
          object-fit:cover; margin-top:12px;
          border-radius:2px; display:block;
          print-color-adjust:exact;
        "/>` : ''}
      </div>`;
  }).join('');

  return `
    <div style="page-break-before: always;">
      ${renderSectionHeader('Tributes', styles)}
      ${cards}
    </div>`;
}

function renderPhasePhotos(
  section: PhasePhotosSection,
  photoUrlMap: Record<string, string>,
  styles: ThemeStyles
): string {
  if (section.slots.length === 0) return '';
  return `
    <div style="page-break-before: always;">
      ${renderSectionHeader(section.phase_name, styles)}
      ${renderPhotoSlots(section.slots, photoUrlMap, styles)}
    </div>`;
}

function renderWhoAttended(
  guests: GuestData[],
  styles: ThemeStyles
): string {
  if (guests.length === 0) return '';

  const names = guests
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(g => `<span style="
      font-family: ${styles.bodyFont};
      font-size: 11px; color: ${styles.pageText};
      display: inline-block; margin: 3px 14px 3px 0;
    ">${escapeHtml(g.name)}</span>`)
    .join('');

  return `
    <div style="page-break-before: always;">
      ${renderSectionHeader('Those Who Attended', styles)}
      <div style="line-height: 2;">${names}</div>
    </div>`;
}

function renderClosingMessage(
  capsule: CapsuleData,
  styles: ThemeStyles
): string {
  return `
    <div style="
      page-break-before: always;
      min-height: 60vh;
      display: flex; align-items: center; justify-content: center;
      text-align: center;
    ">
      <div>
        <div style="width:48px; height:2px; background:${styles.accentColor}; margin:0 auto 32px;"></div>
        <p style="
          font-family: ${styles.headingFont};
          font-size: 22px; font-style: italic;
          color: ${styles.pageText}; margin: 0 0 16px;
          line-height: 1.5;
        ">Every event. Preserved.</p>
        <p style="
          font-family: ${styles.bodyFont};
          font-size: 11px; color: ${styles.secondaryText};
          margin: 0;
        ">This publication was created with LegacyCapsule by RevoWorldTech</p>
        <div style="width:48px; height:2px; background:${styles.accentColor}; margin:32px auto 0;"></div>
      </div>
    </div>`;
}


// ============================================================
// SECTION 8 — Utility functions
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
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}


// ============================================================
// SECTION 9 — Page component
// Validates render_token, fetches all data, builds HTML string.
// Returns the complete publication as a styled, self-contained page.
// ============================================================

export default async function PublicationRenderPage({
  params,
}: {
params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 32) return notFound();

  // ── Validate render token ──────────────────────────────────
  const { data: pub } = await adminClient
    .from('publications')
    .select('id, capsule_id, layout_config, version')
    .eq('render_token', token)
    .maybeSingle();

  if (!pub) return notFound();

  const layoutConfig = pub.layout_config as LayoutConfig;
  const capsuleId    = pub.capsule_id;

  // ── Fetch all content in parallel ─────────────────────────
  const [capsuleRes, contribsRes, galleryRes, phasesRes, guestsRes] =
    await Promise.all([
      adminClient.from('capsules')
        .select('id, honouree_name, honouree_title, event_type, event_date, event_tag, hero_image_url, theme, cover_style')
        .eq('id', capsuleId)
        .single(),

      adminClient.from('contributions')
        .select('id, contributor_name, city, country, relationship, tribute_text, image_url, is_anonymous, created_at')
        .eq('capsule_id', capsuleId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at'),

      adminClient.from('gallery_items')
        .select('id, image_url, caption, phase_id')
        .eq('capsule_id', capsuleId)
        .eq('approved', true)
        .is('deleted_at', null),

      adminClient.from('capsule_phases')
        .select('id, name, event_date, location')
        .eq('capsule_id', capsuleId)
        .is('deleted_at', null)
        .order('sort_order'),

      adminClient.from('guests')
        .select('id, name, tier')
        .eq('capsule_id', capsuleId)
        .not('checked_in_at', 'is', null),
    ]);

  const capsule  = capsuleRes.data  as CapsuleData;
  const contribs = contribsRes.data as ContributionData[] ?? [];
  const gallery  = galleryRes.data  as GalleryItemData[]  ?? [];
  const guests   = guestsRes.data   as GuestData[]        ?? [];

  if (!capsule) return notFound();

  // ── Resolve theme styles ───────────────────────────────────
  const theme  = layoutConfig.theme ?? 'classic';
  const styles = THEME_STYLES[theme] ?? THEME_STYLES.classic;

  // ── Convert all Supabase Storage URLs to signed URLs ───────
  // All image references resolved to signed URLs before HTML build.
  // Puppeteer never needs to authenticate against Supabase.
  const heroUrl = await toSignedUrl(capsule.hero_image_url);

  const photoUrlMap: Record<string, string> = {};
  await Promise.all(
    gallery.map(async (item) => {
      photoUrlMap[item.id] = await toSignedUrl(item.image_url);
    })
  );

  // ── Build enabled sections in layout order ─────────────────
  const enabledSections = layoutConfig.sections.filter(s => s.enabled);

  const sectionHtml = enabledSections.map((section: Section) => {
    switch (section.type) {
      case 'cover':
        return renderCover(capsule, heroUrl, styles);

      case 'honouree_profile':
        // Honouree profile content is fetched from capsule_profile_sections
        // in Phase 2. In Phase 1, render a placeholder block that Puppeteer
        // skips gracefully (empty string = no space consumed in PDF).
        return '';

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
  }).join('\n');

  // ── Assemble full HTML page ────────────────────────────────
  // Google Fonts loaded via <link> not @import — Puppeteer handles link tags cleanly.
  // print-color-adjust: exact ensures background colours survive PDF rendering.

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(capsule.honouree_name)} — LegacyCapsule Publication</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: ${styles.pageBg};
      color: ${styles.pageText};
      font-family: ${styles.bodyFont};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4;
      margin: ${styles.pageMarginMm}mm;
    }
    img { max-width: 100%; }
    @media print {
      body { background: ${styles.pageBg}; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${sectionHtml}
</body>
</html>`;

  // Return raw HTML — Puppeteer reads the full document, not a React component tree
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <title>{`${capsule.honouree_name} — LegacyCapsule Publication`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            background: ${styles.pageBg};
            color: ${styles.pageText};
            font-family: ${styles.bodyFont};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: A4; margin: ${styles.pageMarginMm}mm; }
          img { max-width: 100%; }
          @media print {
            body { background: ${styles.pageBg}; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}} />
      </head>
      <body dangerouslySetInnerHTML={{ __html: sectionHtml }} />
    </html>
  );
}
