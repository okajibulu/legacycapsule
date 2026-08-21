// ============================================================
// FILE PATH: app/api/display/export/html/route.ts
// PURPOSE:   Route handler for Offline HTML export (Output B).
//            Fetches content, audio tracks, honouree photo,
//            embeds all as base64, delegates to generateDisplayHTML.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.28
// DATE:      21 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'
import {
  generateDisplayHTML,
  generateQRBase64,
  buildSequence,
  type VoiceItem,
  type StoryItem,
  type PhotoItem,
  type AudioTrack,
  type DisplayConfig,
} from '@/lib/eds/generateDisplayHTML'

// ═══ SECTION 1 — Supabase Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Image / Audio to Base64 ═══

async function toBase64(url: string, defaultMime = 'image/jpeg'): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || defaultMime
    const buffer = await res.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')
    return 'data:' + contentType + ';base64,' + b64
  } catch { return null }
}

// ═══ SECTION 3 — Route Handler ═══

export async function POST(req: NextRequest) {
  try {
    // ── 3a. Auth ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })
    }

    const auth = await checkManageAuth(slug)
    if (auth.accountType === 'coadmin' && !auth.permissions.includes('event_display')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── 3b. Resolve capsule ──
    let capsuleId = auth.capsuleId
    let capsule: {
      id: string; honouree_name: string; event_type: string
      hero_image_url: string | null
    } | null = null

    if (capsuleId) {
      const { data } = await db
        .from('capsules')
        .select('id, honouree_name, event_type, hero_image_url')
        .eq('id', capsuleId).maybeSingle()
      capsule = data
    } else {
      const { data } = await db
        .from('capsules')
        .select('id, honouree_name, event_type, hero_image_url')
        .eq('slug', slug).maybeSingle()
      capsule = data
      capsuleId = data?.id ?? null
    }

    if (!capsule || !capsuleId) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── 3c. Fetch display config ──
    const { data: configRow } = await db
      .from('event_display_config')
      .select('*')
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    const config: DisplayConfig = {
      voice_duration_secs: configRow?.voice_duration_secs ?? 15,
      photo_duration_secs: configRow?.photo_duration_secs ?? 8,
      story_duration_secs: configRow?.story_duration_secs ?? 18,
      story_photo_duration_secs: configRow?.story_photo_duration_secs ?? 20,
      story_photos_duration_secs: configRow?.story_photos_duration_secs ?? 22,
      lc_brand_duration_secs: configRow?.lc_brand_duration_secs ?? 6,
      qr_screen_duration_secs: configRow?.qr_screen_duration_secs ?? 15,
      lc_interstitial_every_n: configRow?.lc_interstitial_every_n ?? 10,
      qr_interstitial_every_n: configRow?.qr_interstitial_every_n ?? 15,
      tempo_preset: configRow?.tempo_preset ?? 'standard',
      theme: configRow?.theme_override ?? 'midnight',
    }

    // ── 3d. Hidden items ──
    const { data: hiddenItems } = await db
      .from('display_queue_overrides')
      .select('item_id')
      .eq('capsule_id', capsuleId)
      .eq('hidden', true)
    const hiddenIds = new Set((hiddenItems || []).map((h: { item_id: string }) => h.item_id))

    // ── 3e. Fetch voices ──
    const { data: rawVoices } = await db
      .from('contributions')
      .select('id, contributor_name, relationship, city, ip_country, tribute_text, thumbnail_url')
      .eq('capsule_id', capsuleId).eq('status', 'approved')
      .is('story_topic_id', null)
      .order('created_at', { ascending: true })

    const eligibleVoices = (rawVoices || []).filter((v: { id: string }) => !hiddenIds.has(v.id))

    // ── 3f. Fetch stories ──
    const { data: rawStories } = await db
      .from('contributions')
      .select('id, contributor_name, relationship, city, ip_country, tribute_text')
      .eq('capsule_id', capsuleId).eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .order('created_at', { ascending: true })

    const eligibleStories = (rawStories || []).filter((s: { id: string }) => !hiddenIds.has(s.id))

    // ── 3g. Fetch photos ──
    const { data: rawPhotos } = await db
      .from('gallery_items')
      .select('id, image_url, caption, uploaded_by_name')
      .eq('capsule_id', capsuleId).eq('source', 'dday')
      .eq('approved', true).eq('is_official_photography', false)
      .order('created_at', { ascending: true })

    const eligiblePhotos = (rawPhotos || []).filter((p: { id: string }) => !hiddenIds.has(p.id))

    // ── 3h. Fetch audio tracks ──
    let audioTracks: AudioTrack[] = []
    try {
      const { data: audioRows } = await db
        .from('eds_display_audio')
        .select('storage_path, mime_type, original_filename, duration_seconds')
        .eq('capsule_id', capsuleId).eq('status', 'ready')
        .order('sort_order', { ascending: true })
        .limit(3)

      if (audioRows && audioRows.length > 0) {
        const BUCKET_AUDIO = 'eds-audio-assets'
        audioTracks = (await Promise.all(
          audioRows.map(async (row: {
            storage_path: string; mime_type: string
            original_filename: string; duration_seconds: number | null
          }) => {
            const { data: signed } = await db.storage
              .from(BUCKET_AUDIO)
              .createSignedUrl(row.storage_path, 3600)
            if (!signed?.signedUrl) return null
            const b64 = await toBase64(signed.signedUrl, row.mime_type)
            if (!b64) return null
            return {
              b64,
              mime_type: row.mime_type,
              filename: row.original_filename,
              duration_seconds: row.duration_seconds,
            } as AudioTrack
          })
        )).filter(Boolean) as AudioTrack[]
      }
    } catch {
      // Audio is non-blocking — export continues without it
    }

    // ── 3i. Embed images ──
    const MAX_PHOTOS = 40

    const voiceItems: VoiceItem[] = await Promise.all(
      eligibleVoices.map(async (v: {
        id: string; contributor_name: string; relationship: string | null
        city: string | null; ip_country: string | null; tribute_text: string
        thumbnail_url: string | null
      }) => ({
        id: v.id, type: 'voice' as const,
        contributor_name: v.contributor_name, relationship: v.relationship,
        city: v.city, ip_country: v.ip_country, tribute_text: v.tribute_text,
        thumbnail_b64: v.thumbnail_url ? await toBase64(v.thumbnail_url) : null,
      }))
    )

    const photoItems: PhotoItem[] = await Promise.all(
      eligiblePhotos.slice(0, MAX_PHOTOS).map(async (p: {
        id: string; image_url: string; caption: string | null; uploaded_by_name: string | null
      }) => ({
        id: p.id, type: 'photo' as const,
        image_b64: await toBase64(p.image_url),
        caption: p.caption, uploaded_by_name: p.uploaded_by_name,
      }))
    )

    const storyItems: StoryItem[] = eligibleStories.map((s: {
      id: string; contributor_name: string; relationship: string | null
      city: string | null; ip_country: string | null; tribute_text: string
    }) => ({
      id: s.id, type: 'story' as const,
      contributor_name: s.contributor_name, relationship: s.relationship,
      city: s.city, ip_country: s.ip_country, tribute_text: s.tribute_text, photos: [],
    }))

    // ── 3j. Honouree watermark + QR ──
    const honoureePhotoBg = capsule.hero_image_url
      ? await toBase64(capsule.hero_image_url)
      : null

    const capsuleUrl = (process.env.NEXT_PUBLIC_APP_URL || '') + '/for/' + slug
    const capsuleUrlQrB64 = await generateQRBase64(capsuleUrl)

    // ── 3k. Generate HTML ──
    const sequence = buildSequence(voiceItems, storyItems, photoItems)
    const html = generateDisplayHTML({
      honoureeName: capsule.honouree_name,
      eventType: capsule.event_type,
      capsuleUrl,
      capsuleUrlQrB64,
      honoureePhotoBg,
      audioTracks,
      sequence,
      config,
    })

    // ── 3l. Audit log ──
    void (async () => {
      try {
        await db.from('display_exports').insert({
          capsule_id: capsuleId,
          export_type: 'html_offline',
          voice_count: voiceItems.length,
          story_count: storyItems.length,
          photo_count: photoItems.length,
          file_size_bytes: Buffer.byteLength(html, 'utf8'),
          tempo_preset: config.tempo_preset,
          theme: config.theme,
          exported_by: auth.accountType || 'organiser',
        })
      } catch { /* non-blocking */ }
    })()

    // ── 3m. Return downloadable file ──
    const safeName = capsule.honouree_name
      .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 40)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="LegacyCapsule-' + safeName + '-display.html"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[EDS export/html] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred generating the display file.' },
      { status: 500 }
    )
  }
}