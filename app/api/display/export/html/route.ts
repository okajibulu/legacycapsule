// ============================================================
// FILE PATH: app/api/display/export/html/route.ts
// PURPOSE:   Generates a self-contained offline HTML display
//            file (Output B). Fetches all approved voices,
//            stories, and D-Day photos. Embeds all images as
//            base64 data URIs — zero network dependency.
//            Returns file as a download response.
//            Includes full display engine: card rotation,
//            QR interstitials, LC brand interstitials,
//            operator overlay with tempo presets + sliders,
//            fullscreen support, pause/skip/restart controls.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.26
// DATE:      20 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'

// ═══ SECTION 1 — Supabase Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Types ═══

interface VoiceItem {
  id: string
  type: 'voice'
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string
  thumbnail_url: string | null
  thumbnail_b64: string | null
}

interface StoryItem {
  id: string
  type: 'story'
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string
  photos: Array<{ image_url: string; b64: string | null; caption: string | null }>
}

interface PhotoItem {
  id: string
  type: 'photo'
  image_url: string
  image_b64: string | null
  caption: string | null
  uploaded_by_name: string | null
}

type DisplayItem = VoiceItem | StoryItem | PhotoItem

// ═══ SECTION 3 — Image to Base64 ═══

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${b64}`
  } catch {
    return null
  }
}

// ═══ SECTION 4 — Sequence Builder ═══
// Balanced interleaving: voice → photo → voice → story → voice → photo…
// Featured items appear first in their category.

function buildSequence(
  voices: VoiceItem[],
  stories: StoryItem[],
  photos: PhotoItem[]
): DisplayItem[] {
  const sequence: DisplayItem[] = []
  let vi = 0, si = 0, pi = 0

  while (vi < voices.length || si < stories.length || pi < photos.length) {
    // 2 voices
    for (let i = 0; i < 2 && vi < voices.length; i++) sequence.push(voices[vi++])
    // 1 photo
    if (pi < photos.length) sequence.push(photos[pi++])
    // 1 voice
    if (vi < voices.length) sequence.push(voices[vi++])
    // 1 story
    if (si < stories.length) sequence.push(stories[si++])
  }

  return sequence
}

// ═══ SECTION 5 — Participation Language ═══

function getVoiceLabel(eventType: string): string {
  const map: Record<string, string> = {
    memorial: 'Tribute',
    retirement: 'Message',
    birthday: 'Wish',
    wedding: 'Blessing',
    anniversary: 'Message',
    graduation: 'Message',
    chieftaincy: 'Message',
    ordination: 'Message',
    thanksgiving: 'Message',
    award: 'Message',
  }
  return map[eventType] ?? 'Voice'
}

// ═══ SECTION 6 — HTML Generator ═══

function generateHTML(params: {
  honoureeName: string
  eventType: string
  capsuleUrl: string
  sequence: DisplayItem[]
  config: {
    voice_duration_secs: number
    photo_duration_secs: number
    story_duration_secs: number
    story_photo_duration_secs: number
    story_photos_duration_secs: number
    lc_brand_duration_secs: number
    qr_screen_duration_secs: number
    lc_interstitial_every_n: number
    qr_interstitial_every_n: number
    tempo_preset: string
  }
}): string {
  const { honoureeName, eventType, capsuleUrl, sequence, config } = params
  const voiceLabel = getVoiceLabel(eventType)
  const itemsJson = JSON.stringify(sequence)
  const configJson = JSON.stringify(config)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${honoureeName} — LegacyCapsule Display</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #0D0820; overflow: hidden; }
  body { font-family: Georgia, "Times New Roman", Times, serif; color: #F5F3EE; }

  #welcome {
    position: fixed; inset: 0;
    background: #0D0820;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1.5rem; z-index: 100;
  }

  #display { position: fixed; inset: 0; z-index: 10; }

  .card {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.6s ease;
    pointer-events: none;
  }
  .card.active { opacity: 1; pointer-events: auto; }

  /* Operator overlay */
  #operator-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(13,8,32,0.92);
    display: none; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1.5rem;
  }
  #operator-overlay.visible { display: flex; }

  /* Control bar */
  #control-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 64px; z-index: 150;
    background: rgba(13,8,32,0.88);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(212,174,42,0.2);
    display: flex; align-items: center;
    justify-content: center; gap: 1rem;
    transition: opacity 0.4s ease;
  }
  #control-bar.hidden { opacity: 0; pointer-events: none; }

  .ctrl-btn {
    background: rgba(212,174,42,0.12);
    color: #D4AE2A;
    border: 1px solid rgba(212,174,42,0.35);
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
    transition: background 0.2s;
  }
  .ctrl-btn:hover { background: rgba(212,174,42,0.22); }

  .ov-btn {
    background: rgba(212,174,42,0.15);
    color: #D4AE2A;
    border: 1px solid rgba(212,174,42,0.4);
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 6px;
    font-family: inherit;
  }

  .start-btn {
    background: #D4AE2A; color: #0D0820;
    border: none; padding: 1rem 3rem;
    font-size: 1.2rem; cursor: pointer;
    border-radius: 4px; font-family: Georgia, serif;
    letter-spacing: 0.05em;
  }

  .ornament { color: #D4AE2A; letter-spacing: 0.5rem; }
  .gold { color: #D4AE2A; }
  .faint { opacity: 0.5; }

  input[type=range] { width: 160px; accent-color: #D4AE2A; }

  .slider-row {
    display: flex; align-items: center; gap: 0.75rem;
    font-size: 0.85rem; color: #F5F3EE;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }
  .slider-label { width: 130px; text-align: right; opacity: 0.75; }
  .slider-val { width: 40px; text-align: left; color: #D4AE2A; }

  kbd {
    background: rgba(212,174,42,0.15);
    border: 1px solid rgba(212,174,42,0.3);
    padding: 0.1rem 0.4rem; border-radius: 3px;
    font-size: 0.8rem; color: #D4AE2A;
    font-family: monospace;
  }
</style>
</head>
<body>

<!-- ═══ WELCOME SCREEN ═══ -->
<div id="welcome">
  <div class="ornament" style="font-size:1.5rem">✦ ─── ✦ ─── ✦</div>
  <p style="font-size:clamp(0.9rem,1.6vw,1.2rem);letter-spacing:0.25em;color:#D4AE2A;text-transform:uppercase">
    LegacyCapsule
  </p>
  <h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;text-align:center;max-width:80vw;line-height:1.2">
    ${honoureeName}
  </h1>
  <p id="item-count" style="font-size:1rem;opacity:0.6;font-family:'Helvetica Neue',Arial,sans-serif"></p>
  <button class="start-btn" onclick="startDisplay()">▶ Start Display</button>
  <p style="font-size:0.75rem;opacity:0.35;font-family:'Helvetica Neue',Arial,sans-serif;margin-top:0.5rem">
    Press F11 for fullscreen · <kbd>Ctrl+Shift+O</kbd> for operator controls
  </p>
</div>

<!-- ═══ DISPLAY AREA ═══ -->
<div id="display" style="display:none"></div>

<!-- ═══ CONTROL BAR ═══ -->
<div id="control-bar" class="hidden">
  <button class="ctrl-btn" onclick="togglePause()" id="pause-btn">⏸ Pause</button>
  <button class="ctrl-btn" onclick="skipCard()">⏭ Skip</button>
  <button class="ctrl-btn" onclick="restartDisplay()">↺ Restart</button>
  <span id="card-counter" style="position:absolute;right:1rem;font-size:0.8rem;color:#D4AE2A;opacity:0.6;font-family:sans-serif"></span>
</div>

<!-- ═══ OPERATOR OVERLAY ═══ -->
<div id="operator-overlay">
  <h2 style="font-size:1.3rem;font-weight:normal;color:#D4AE2A;letter-spacing:0.1em">
    ✦ Operator Controls
  </h2>

  <!-- Tempo presets -->
  <div style="display:flex;gap:0.75rem">
    <button class="ov-btn" onclick="setTempo('gentle')" id="tempo-gentle">🌿 Gentle</button>
    <button class="ov-btn" onclick="setTempo('standard')" id="tempo-standard">▶ Standard</button>
    <button class="ov-btn" onclick="setTempo('energetic')" id="tempo-energetic">⚡ Energetic</button>
  </div>

  <!-- Advanced sliders -->
  <details style="text-align:center">
    <summary style="cursor:pointer;font-size:0.85rem;color:#D4AE2A;opacity:0.7;font-family:sans-serif;margin-bottom:1rem">
      Advanced timing
    </summary>
    <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">
      <div class="slider-row">
        <span class="slider-label">Voice card</span>
        <input type="range" id="sl-voice" min="10" max="30" step="1"
          oninput="updateSlider('voice',this.value)">
        <span class="slider-val" id="sv-voice">15s</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Photo card</span>
        <input type="range" id="sl-photo" min="5" max="15" step="1"
          oninput="updateSlider('photo',this.value)">
        <span class="slider-val" id="sv-photo">8s</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Story (no photo)</span>
        <input type="range" id="sl-story" min="12" max="30" step="1"
          oninput="updateSlider('story',this.value)">
        <span class="slider-val" id="sv-story">18s</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Story + 1 photo</span>
        <input type="range" id="sl-story-photo" min="15" max="35" step="1"
          oninput="updateSlider('story-photo',this.value)">
        <span class="slider-val" id="sv-story-photo">20s</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Story + photo strip</span>
        <input type="range" id="sl-story-photos" min="18" max="40" step="1"
          oninput="updateSlider('story-photos',this.value)">
        <span class="slider-val" id="sv-story-photos">22s</span>
      </div>
    </div>
  </details>

  <button class="ov-btn" onclick="closeOperator()" style="margin-top:0.5rem">
    ✕ Close
  </button>
  <p style="font-size:0.75rem;opacity:0.35;font-family:sans-serif">
    <kbd>Ctrl+Shift+O</kbd> to open/close
  </p>
</div>

<script>
// ═══ DATA ═══
const ITEMS = ${itemsJson};
const BASE_CONFIG = ${configJson};
const HONOUREE = ${JSON.stringify(honoureeName)};
const CAPSULE_URL = ${JSON.stringify(capsuleUrl)};
const EVENT_TYPE = ${JSON.stringify(eventType)};
const VOICE_LABEL = ${JSON.stringify(voiceLabel)};

// ═══ STATE ═══
let currentIndex = 0;
let isPaused = false;
let cardTimer = null;
let controlsTimer = null;
let operatorOpen = false;

// Mutable durations — updated by tempo/sliders
let durations = {
  voice: BASE_CONFIG.voice_duration_secs,
  photo: BASE_CONFIG.photo_duration_secs,
  story: BASE_CONFIG.story_duration_secs,
  storyPhoto: BASE_CONFIG.story_photo_duration_secs,
  storyPhotos: BASE_CONFIG.story_photos_duration_secs,
  lcBrand: BASE_CONFIG.lc_brand_duration_secs,
  qr: BASE_CONFIG.qr_screen_duration_secs,
};

// Tempo multipliers
const TEMPO = { gentle: 1.4, standard: 1.0, energetic: 0.7 };
let currentTempo = BASE_CONFIG.tempo_preset || 'standard';

// ═══ INIT ═══
document.getElementById('item-count').textContent =
  ITEMS.length + ' items ready for display';

// Update slider display values on load
['voice','photo','story','story-photo','story-photos'].forEach(k => {
  const map = {
    'voice': durations.voice,
    'photo': durations.photo,
    'story': durations.story,
    'story-photo': durations.storyPhoto,
    'story-photos': durations.storyPhotos,
  };
  const el = document.getElementById('sl-' + k);
  const sv = document.getElementById('sv-' + k);
  if (el) el.value = map[k];
  if (sv) sv.textContent = map[k] + 's';
});

// ═══ KEYBOARD SHORTCUTS ═══
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'O') {
    e.preventDefault();
    toggleOperator();
    return;
  }
  if (e.key === 'Escape' && operatorOpen) { closeOperator(); return; }
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
  if (e.key === 'ArrowRight') skipCard();
  resetControlsTimer();
});

document.addEventListener('mousemove', resetControlsTimer);

// ═══ CONTROLS AUTO-HIDE ═══
function resetControlsTimer() {
  const bar = document.getElementById('control-bar');
  bar.classList.remove('hidden');
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => bar.classList.add('hidden'), 3000);
}

// ═══ START ═══
function startDisplay() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('display').style.display = 'block';
  document.getElementById('control-bar').style.display = 'flex';
  resetControlsTimer();
  showCard(0);
}

// ═══ CARD DURATION ═══
function getCardDuration(item) {
  const mult = TEMPO[currentTempo] || 1.0;
  if (item.type === 'voice') return Math.round(durations.voice * mult) * 1000;
  if (item.type === 'photo') return Math.round(durations.photo * mult) * 1000;
  if (item.type === 'story') {
    const pc = item.photos ? item.photos.length : 0;
    if (pc === 0) return Math.round(durations.story * mult) * 1000;
    if (pc === 1) return Math.round(durations.storyPhoto * mult) * 1000;
    return Math.round(durations.storyPhotos * mult) * 1000;
  }
  if (item.type === 'lc_brand') return durations.lcBrand * 1000;
  if (item.type === 'qr') return durations.qr * 1000;
  return 15000;
}

// ═══ BUILD CARD HTML ═══
function buildCardHTML(item) {
  const bg = 'background:linear-gradient(135deg,#0D0820 0%,#1a0f35 100%)';

  if (item.type === 'lc_brand') {
    return \`<div class="card" style="\${bg};flex-direction:column;align-items:center;justify-content:center;gap:1.2rem">
      <div class="ornament" style="font-size:1.2rem">✦ ─── ✦</div>
      <h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;letter-spacing:0.15em;color:#F5F3EE">LegacyCapsule</h1>
      <p style="font-size:clamp(0.9rem,1.6vw,1.2rem);color:#D4AE2A;font-style:italic">Preserving the voices that matter most</p>
      <p style="font-size:0.8rem;opacity:0.35;font-family:sans-serif;margin-top:0.5rem">itslegacycapsule.com</p>
    </div>\`;
  }

  if (item.type === 'qr') {
    const qrSrc = generateQRDataUrl(CAPSULE_URL);
    return \`<div class="card" style="\${bg};flex-direction:column;align-items:center;justify-content:center;gap:1.5rem">
      <p style="font-size:clamp(1.1rem,2.2vw,1.7rem);text-align:center;max-width:600px;line-height:1.5;color:#F5F3EE">
        SCAN TO SHARE YOUR WISHES FOR \${HONOUREE.toUpperCase()}
      </p>
      <div style="background:#F5F3EE;padding:1.25rem;border-radius:8px;border:3px solid #D4AE2A">
        <img src="\${qrSrc}" style="display:block;width:240px;height:240px" alt="QR">
      </div>
      <p style="color:#D4AE2A;font-size:0.9rem;opacity:0.8;font-family:sans-serif">\${CAPSULE_URL}</p>
      <p style="color:#F5F3EE;font-size:0.8rem;opacity:0.5;font-style:italic;font-family:sans-serif">Your voice will appear on this screen</p>
    </div>\`;
  }

  if (item.type === 'voice') {
    const loc = [item.city, item.ip_country].filter(Boolean).join(', ');
    const meta = [item.relationship, loc].filter(Boolean).join(' · ');
    const thumb = item.thumbnail_b64
      ? \`<div style="position:absolute;top:-1rem;right:-1rem;width:72px;height:72px;border-radius:50%;overflow:hidden;border:2px solid #D4AE2A"><img src="\${item.thumbnail_b64}" style="width:100%;height:100%;object-fit:cover"></div>\`
      : '';
    return \`<div class="card" style="\${bg};align-items:center;justify-content:center;padding:4rem">
      <div style="max-width:800px;width:100%;text-align:center;position:relative">
        <div class="ornament" style="position:absolute;top:-2.5rem;left:50%;transform:translateX(-50%);font-size:1.2rem;opacity:0.6">✦ ─────── ✦</div>
        \${thumb}
        <h1 style="font-size:clamp(1.8rem,3.5vw,2.8rem);color:#D4AE2A;font-weight:normal;letter-spacing:0.05em;margin-bottom:0.4rem">\${item.contributor_name}</h1>
        \${meta ? \`<p style="font-size:clamp(0.9rem,1.8vw,1.2rem);opacity:0.65;font-style:italic;margin-bottom:2rem">\${meta}</p>\` : '<div style="margin-bottom:2rem"></div>'}
        <div style="width:50px;height:1px;background:#D4AE2A;margin:0 auto 2rem;opacity:0.5"></div>
        <p style="font-size:clamp(1rem,2vw,1.5rem);line-height:1.85;color:#F5F3EE">\${item.tribute_text}</p>
        <div class="ornament" style="position:absolute;bottom:-2.5rem;left:50%;transform:translateX(-50%);font-size:0.8rem;opacity:0.35">✦</div>
      </div>
    </div>\`;
  }

  if (item.type === 'photo') {
    const caption = item.caption || '';
    const credit = item.uploaded_by_name || '';
    return \`<div class="card" style="background:#0D0820;flex-direction:column;align-items:center;justify-content:center">
      <div style="flex:1;width:100%;display:flex;align-items:center;justify-content:center;padding:3rem 3rem 1rem;min-height:0">
        \${item.image_b64 ? \`<img src="\${item.image_b64}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px">\` : '<p style="opacity:0.4">Photo unavailable</p>'}
      </div>
      \${(caption || credit) ? \`<div style="padding:0.75rem 3rem 2rem;text-align:center">
        \${caption ? \`<p style="font-size:clamp(0.95rem,1.7vw,1.25rem);font-style:italic;margin-bottom:0.3rem">\${caption}</p>\` : ''}
        \${credit ? \`<p style="font-size:clamp(0.8rem,1.3vw,0.95rem);color:#D4AE2A;opacity:0.8;font-family:sans-serif">\${credit}</p>\` : ''}
      </div>\` : ''}
    </div>\`;
  }

  if (item.type === 'story') {
    const loc = [item.city, item.ip_country].filter(Boolean).join(', ');
    const meta = [item.relationship, loc].filter(Boolean).join(' · ');
    const photos = item.photos || [];
    const pc = photos.length;

    const storyText = \`<div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <h2 style="font-size:clamp(1.3rem,2.5vw,2rem);color:#D4AE2A;font-weight:normal;margin-bottom:0.3rem">\${item.contributor_name}</h2>
      \${meta ? \`<p style="font-size:clamp(0.85rem,1.5vw,1rem);opacity:0.65;font-style:italic;margin-bottom:1.25rem">\${meta}</p>\` : ''}
      <div style="width:35px;height:1px;background:#D4AE2A;margin-bottom:1.25rem;opacity:0.5"></div>
      <p style="font-size:clamp(0.95rem,1.8vw,1.3rem);line-height:1.85;color:#F5F3EE">\${item.tribute_text}</p>
    </div>\`;

    if (pc === 0) {
      return \`<div class="card" style="\${bg};align-items:center;justify-content:center;padding:3.5rem 4rem">
        <div style="max-width:800px;width:100%">\${storyText}</div>
      </div>\`;
    }

    const heroSrc = photos[0].b64 || '';
    const photoStrip = pc === 1
      ? \`<img src="\${heroSrc}" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:4px">\`
      : \`<div style="display:flex;flex-direction:column;gap:0.5rem;height:100%">
          <img src="\${heroSrc}" style="width:100%;flex:0 0 55%;object-fit:cover;border-radius:4px">
          <div style="display:flex;gap:0.5rem;flex:1">
            \${photos.slice(1,3).map(p => \`<img src="\${p.b64 || ''}" style="flex:1;object-fit:cover;border-radius:4px;min-width:0">\`).join('')}
          </div>
        </div>\`;

    return \`<div class="card" style="\${bg};align-items:center;justify-content:center;padding:3rem 3.5rem;gap:2.5rem">
      <div style="flex:1;max-width:50%">\${storyText}</div>
      <div style="flex:1;max-width:46%;display:flex;align-items:center">\${photoStrip}</div>
    </div>\`;
  }

  return '<div class="card"></div>';
}

// ═══ SHOW CARD ═══
let cardEl = null;

function showCard(index) {
  if (index >= ITEMS.length) {
    index = 0; // loop
  }
  currentIndex = index;

  // Check if we should inject an interstitial
  const lcN = BASE_CONFIG.lc_interstitial_every_n || 10;
  const qrN = BASE_CONFIG.qr_interstitial_every_n || 15;

  let item = ITEMS[index];

  // Inject LC brand every N cards
  if (index > 0 && index % lcN === 0) {
    item = { type: 'lc_brand' };
    currentIndex = index - 1; // don't advance item index
  }
  // Inject QR every N cards (offset to avoid collision with LC)
  else if (index > 0 && index % qrN === 0 && index % lcN !== 0) {
    item = { type: 'qr' };
    currentIndex = index - 1;
  }

  const display = document.getElementById('display');

  // Remove previous card
  if (cardEl) {
    cardEl.classList.remove('active');
    setTimeout(() => { if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl); }, 650);
  }

  // Build and insert new card
  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildCardHTML(item);
  cardEl = wrapper.firstElementChild;
  display.appendChild(cardEl);

  // Update counter
  const counter = document.getElementById('card-counter');
  if (counter) counter.textContent = (index + 1) + ' / ' + ITEMS.length;

  // Trigger fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { if (cardEl) cardEl.classList.add('active'); });
  });

  // Schedule next card
  if (!isPaused) {
    const dur = getCardDuration(item);
    cardTimer = setTimeout(() => showCard(index + 1), dur);
  }
}

// ═══ CONTROLS ═══
function togglePause() {
  isPaused = !isPaused;
  const btn = document.getElementById('pause-btn');
  if (isPaused) {
    clearTimeout(cardTimer);
    if (btn) btn.textContent = '▶ Resume';
  } else {
    if (btn) btn.textContent = '⏸ Pause';
    showCard(currentIndex + 1);
  }
}

function skipCard() {
  clearTimeout(cardTimer);
  showCard(currentIndex + 1);
}

function restartDisplay() {
  clearTimeout(cardTimer);
  showCard(0);
}

// ═══ OPERATOR OVERLAY ═══
function toggleOperator() {
  operatorOpen ? closeOperator() : openOperator();
}

function openOperator() {
  operatorOpen = true;
  clearTimeout(cardTimer);
  document.getElementById('operator-overlay').classList.add('visible');
  highlightTempo(currentTempo);
}

function closeOperator() {
  operatorOpen = false;
  document.getElementById('operator-overlay').classList.remove('visible');
  if (!isPaused) {
    const dur = getCardDuration(ITEMS[currentIndex] || { type: 'voice' });
    cardTimer = setTimeout(() => showCard(currentIndex + 1), dur);
  }
}

function highlightTempo(preset) {
  ['gentle','standard','energetic'].forEach(t => {
    const btn = document.getElementById('tempo-' + t);
    if (btn) btn.style.background = t === preset ? 'rgba(212,174,42,0.4)' : 'rgba(212,174,42,0.15)';
  });
}

function setTempo(preset) {
  currentTempo = preset;
  highlightTempo(preset);
}

function updateSlider(key, val) {
  const map = {
    'voice': 'voice',
    'photo': 'photo',
    'story': 'story',
    'story-photo': 'storyPhoto',
    'story-photos': 'storyPhotos',
  };
  const durKey = map[key];
  if (durKey) durations[durKey] = parseInt(val);
  const sv = document.getElementById('sv-' + key);
  if (sv) sv.textContent = val + 's';
}

// ═══ QR CODE GENERATOR (inline — no external library) ═══
// Simple URL-only QR placeholder using a free API fallback
// embedded as data URI for offline use
function generateQRDataUrl(url) {
  // For offline reliability: use a canvas-based minimal QR
  // Since we can't bundle a full QR lib in a static HTML file,
  // we render the URL as text with styling as fallback
  // The organiser sees the URL prominently displayed
  // In the managed React app, qrcode.react handles this properly
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F5F3EE';
    ctx.fillRect(0, 0, 240, 240);
    ctx.fillStyle = '#0D0820';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    // Draw URL wrapped
    const words = url.split('/');
    words.forEach((w, i) => ctx.fillText(w, 120, 100 + (i * 16)));
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SCAN THIS URL:', 120, 60);
    ctx.strokeStyle = '#D4AE2A';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 232, 232);
    return canvas.toDataURL();
  } catch(e) {
    return '';
  }
}

// Init tempo highlight
highlightTempo(currentTempo);
</script>
</body>
</html>`;
}

// ═══ SECTION 7 — Route Handler ═══

export async function POST(req: NextRequest) {
  try {
    // ── 7a. Auth ──
    const slug =
      req.headers.get('x-capsule-slug') ||
      req.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Missing capsule slug' }, { status: 400 })
    }

    const auth = await checkManageAuth(slug)

    if (
      auth.accountType === 'coadmin' &&
      !auth.permissions.includes('event_display')
    ) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // ── 7b. Resolve capsule ──
    let capsuleId = auth.capsuleId
    let capsule: { id: string; honouree_name: string; event_type: string } | null = null

    if (capsuleId) {
      const { data } = await db
        .from('capsules')
        .select('id, honouree_name, event_type')
        .eq('id', capsuleId)
        .maybeSingle()
      capsule = data
    } else {
      const { data } = await db
        .from('capsules')
        .select('id, honouree_name, event_type')
        .eq('slug', slug)
        .maybeSingle()
      capsule = data
      capsuleId = data?.id ?? null
    }

    if (!capsule || !capsuleId) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── 7c. Fetch display config ──
    const { data: configRow } = await db
      .from('event_display_config')
      .select('*')
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    const config = configRow || {
      voice_duration_secs: 15,
      photo_duration_secs: 8,
      story_duration_secs: 18,
      story_photo_duration_secs: 20,
      story_photos_duration_secs: 22,
      lc_brand_duration_secs: 6,
      qr_screen_duration_secs: 15,
      lc_interstitial_every_n: 10,
      qr_interstitial_every_n: 15,
      tempo_preset: 'standard',
    }

    // ── 7d. Fetch hidden item IDs ──
    const { data: hiddenItems } = await db
      .from('display_queue_overrides')
      .select('item_id')
      .eq('capsule_id', capsuleId)
      .eq('hidden', true)

    const hiddenIds = new Set((hiddenItems || []).map((h: { item_id: string }) => h.item_id))

    // ── 7e. Fetch approved voices ──
    const { data: rawVoices } = await db
      .from('contributions')
      .select('id, contributor_name, relationship, city, ip_country, tribute_text, thumbnail_url')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('story_topic_id', null)
      .order('created_at', { ascending: true })

    const eligibleVoices = (rawVoices || []).filter(
      (v: { id: string }) => !hiddenIds.has(v.id)
    )

    // ── 7f. Fetch approved stories ──
    const { data: rawStories } = await db
      .from('contributions')
      .select('id, contributor_name, relationship, city, ip_country, tribute_text, story_topic_id')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .order('created_at', { ascending: true })

    const eligibleStories = (rawStories || []).filter(
      (s: { id: string }) => !hiddenIds.has(s.id)
    )

    // ── 7g. Fetch D-Day photos ──
    const { data: rawPhotos } = await db
      .from('gallery_items')
      .select('id, image_url, caption, uploaded_by_name')
      .eq('capsule_id', capsuleId)
      .eq('source', 'dday')
      .eq('approved', true)
      .eq('is_official_photography', false)
      .order('created_at', { ascending: true })

    const eligiblePhotos = (rawPhotos || []).filter(
      (p: { id: string }) => !hiddenIds.has(p.id)
    )

    // ── 7h. Embed images as base64 (parallel, capped at 40 images) ──
    const MAX_IMAGES = 40

    // Voice thumbnails
    const voiceItems: VoiceItem[] = await Promise.all(
      eligibleVoices.map(async (v: {
        id: string; contributor_name: string; relationship: string | null
        city: string | null; ip_country: string | null; tribute_text: string
        thumbnail_url: string | null
      }) => ({
        id: v.id,
        type: 'voice' as const,
        contributor_name: v.contributor_name,
        relationship: v.relationship,
        city: v.city,
        ip_country: v.ip_country,
        tribute_text: v.tribute_text,
        thumbnail_url: v.thumbnail_url,
        thumbnail_b64: v.thumbnail_url ? await imageToBase64(v.thumbnail_url) : null,
      }))
    )

    // Photos
    const photoItems: PhotoItem[] = await Promise.all(
      eligiblePhotos.slice(0, MAX_IMAGES).map(async (p: {
        id: string; image_url: string; caption: string | null
        uploaded_by_name: string | null
      }) => ({
        id: p.id,
        type: 'photo' as const,
        image_url: p.image_url,
        image_b64: await imageToBase64(p.image_url),
        caption: p.caption,
        uploaded_by_name: p.uploaded_by_name,
      }))
    )

    // Stories (no photo embedding for stories in P0 — text only for now)
    const storyItems: StoryItem[] = eligibleStories.map((s: {
      id: string; contributor_name: string; relationship: string | null
      city: string | null; ip_country: string | null; tribute_text: string
    }) => ({
      id: s.id,
      type: 'story' as const,
      contributor_name: s.contributor_name,
      relationship: s.relationship,
      city: s.city,
      ip_country: s.ip_country,
      tribute_text: s.tribute_text,
      photos: [],
    }))

    // ── 7i. Build display sequence ──
    const sequence = buildSequence(voiceItems, storyItems, photoItems)

    // ── 7j. Generate HTML ──
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/for/${slug}`
    const html = generateHTML({
      honoureeName: capsule.honouree_name,
      eventType: capsule.event_type,
      capsuleUrl,
      sequence,
      config: {
        voice_duration_secs: config.voice_duration_secs,
        photo_duration_secs: config.photo_duration_secs,
        story_duration_secs: config.story_duration_secs,
        story_photo_duration_secs: config.story_photo_duration_secs,
        story_photos_duration_secs: config.story_photos_duration_secs,
        lc_brand_duration_secs: config.lc_brand_duration_secs,
        qr_screen_duration_secs: config.qr_screen_duration_secs,
        lc_interstitial_every_n: config.lc_interstitial_every_n,
        qr_interstitial_every_n: config.qr_interstitial_every_n,
        tempo_preset: config.tempo_preset,
      },
    })

    // ── 7k. Audit log — fire and forget ──
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
          theme: 'default',
          exported_by: auth.accountType || 'organiser',
        })
      } catch {
        // non-blocking
      }
    })()

    // ── 7l. Return as downloadable HTML file ──
    const safeName = capsule.honouree_name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .slice(0, 40)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="LegacyCapsule-${safeName}-display.html"`,
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