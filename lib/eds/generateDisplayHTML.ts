// ============================================================
// FILE PATH: lib/eds/generateDisplayHTML.ts
// PURPOSE:   Generates self-contained offline HTML display file.
//            CONTINUOUS SCROLL ARCHITECTURE:
//            All tributes/stories flow as one long vertical
//            document scrolling upward. Gold line + name header
//            separates each tribute. Photo breaks pause the
//            scroll for 5s then resume. QR and LC brand slides
//            appear as timed interrupts. LC intro card opens.
//            All images and audio embedded as base64 URIs.
//            Zero network dependency at display time.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.32
// DATE:      21 August 2026
// ============================================================

// ═══ SECTION 1 — Types ═══

export interface VoiceItem {
  id: string
  type: 'voice'
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string
  thumbnail_b64: string | null
}

export interface StoryItem {
  id: string
  type: 'story'
  contributor_name: string
  relationship: string | null
  city: string | null
  ip_country: string | null
  tribute_text: string
  photos: Array<{ b64: string | null; caption: string | null }>
}

export interface PhotoItem {
  id: string
  type: 'photo'
  image_b64: string | null
  caption: string | null
  uploaded_by_name: string | null
}

export type DisplayItem = VoiceItem | StoryItem | PhotoItem

export interface AudioTrack {
  b64: string
  mime_type: string
  filename: string
  duration_seconds: number | null
}

export interface DisplayConfig {
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
  theme: string
}

export interface GenerateHTMLParams {
  honoureeName: string
  eventType: string
  capsuleUrl: string
  capsuleUrlQrB64: string | null
  honoureePhotoBg: string | null
  audioTracks: AudioTrack[]
  sequence: DisplayItem[]
  config: DisplayConfig
}

// ═══ SECTION 2 — Theme Presets ═══

export const THEMES: Record<string, {
  bg: string; accent: string; cardOverlay: string; name: string
}> = {
  midnight: { bg: '#0D0820', accent: '#D4AE2A', cardOverlay: 'rgba(13,8,32,0.70)', name: 'Midnight' },
  obsidian: { bg: '#080808', accent: '#D4AE2A', cardOverlay: 'rgba(8,8,8,0.75)',   name: 'Obsidian' },
  forest:   { bg: '#071A0E', accent: '#C8B560', cardOverlay: 'rgba(7,26,14,0.72)', name: 'Forest' },
  navy:     { bg: '#070F1A', accent: '#D4AE2A', cardOverlay: 'rgba(7,15,26,0.72)', name: 'Navy' },
  burgundy: { bg: '#180810', accent: '#C4956A', cardOverlay: 'rgba(24,8,16,0.72)', name: 'Burgundy' },
  slate:    { bg: '#141428', accent: '#B0B8C8', cardOverlay: 'rgba(20,20,40,0.72)', name: 'Slate' },
}

// ═══ SECTION 3 — Copy Helpers ═══

function getVoiceLabel(eventType: string): string {
  const map: Record<string, string> = {
    memorial: 'Tribute', retirement: 'Message', birthday: 'Wish',
    wedding: 'Blessing', anniversary: 'Message', graduation: 'Message',
    chieftaincy: 'Message', ordination: 'Message', thanksgiving: 'Message',
    award: 'Message',
  }
  return map[eventType] ?? 'Voice'
}

function getIntroText(eventType: string, honoureeName: string): string {
  const first = honoureeName.split(' ')[0]
  const map: Record<string, string> = {
    memorial:    'What follows are the voices of those who loved ' + first + ' \u2014 gathered from across the world to honour a life beautifully lived. Each tribute is a gift of remembrance.',
    retirement:  'What follows are messages from colleagues, friends, and loved ones \u2014 gathered to celebrate ' + first + '\u2019s remarkable career and the lives they touched along the way.',
    birthday:    'What follows are birthday wishes from people near and far \u2014 each one a celebration of ' + first + ' and everything that makes this milestone so special.',
    wedding:     'What follows are blessings and messages of love \u2014 gathered from family and friends to celebrate ' + first + '\u2019s new chapter.',
    anniversary: 'What follows are messages of love and celebration \u2014 gathered to honour the beautiful journey ' + first + ' has shared with those who matter most.',
    graduation:  'What follows are messages of pride and encouragement \u2014 gathered from those who have watched ' + first + ' grow and cannot wait to see what comes next.',
    chieftaincy: 'What follows are words of honour and recognition \u2014 gathered from those who celebrate ' + first + '\u2019s distinction and the legacy they continue to build.',
    ordination:  'What follows are messages of faith and blessing \u2014 gathered from a community united in celebrating ' + first + '\u2019s answered calling.',
    thanksgiving:'What follows are voices of gratitude and joy \u2014 gathered to celebrate what God has done through ' + first + '\u2019s life.',
    award:       'What follows are messages of recognition and pride \u2014 gathered from those who have witnessed ' + first + '\u2019s excellence firsthand.',
  }
  return map[eventType] || 'What follows are voices gathered with love \u2014 each one a tribute to ' + first + ' and the lives they have touched.'
}

// ═══ SECTION 4 — Sequence Builder ═══

export function buildSequence(
  voices: VoiceItem[],
  stories: StoryItem[],
  photos: PhotoItem[]
): DisplayItem[] {
  const sequence: DisplayItem[] = []
  let vi = 0, si = 0, pi = 0
  while (vi < voices.length || si < stories.length || pi < photos.length) {
    for (let i = 0; i < 2 && vi < voices.length; i++) sequence.push(voices[vi++])
    if (pi < photos.length) sequence.push(photos[pi++])
    if (vi < voices.length) sequence.push(voices[vi++])
    if (si < stories.length) sequence.push(stories[si++])
  }
  return sequence
}

// ═══ SECTION 5 — Image to Base64 ═══

export async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')
    return 'data:' + contentType + ';base64,' + b64
  } catch { return null }
}

// ═══ SECTION 6 — QR Pre-render ═══

export async function generateQRBase64(url: string): Promise<string | null> {
  try {
    const QRCode = await import('qrcode')
    return await QRCode.toDataURL(url, {
      width: 280, margin: 2,
      color: { dark: '#0D0820', light: '#F5F3EE' },
    })
  } catch { return null }
}

// ═══ SECTION 7 — Tribute Block HTML Builder ═══
// Builds each tribute as a vertical block for the continuous scroll.

function buildTributeBlock(
  item: VoiceItem | StoryItem,
  accent: string,
  isFirst: boolean
): string {
  const loc = [item.city, item.ip_country].filter(Boolean).join(', ')
  const meta = [item.relationship, loc].filter(Boolean).join(' \u00b7 ')
  const isStory = item.type === 'story'

  const divider = isFirst ? '' : [
    '<div style="width:100%;height:4px;background:' + accent + ';',
    'margin:3rem 0 2.5rem;border-radius:2px;opacity:0.8"></div>',
  ].join('')

  const storyBadge = isStory
    ? '<span style="display:inline-block;font-size:0.7rem;font-weight:700;'
      + 'letter-spacing:0.12em;color:#000;background:' + accent + ';'
      + 'padding:0.2rem 0.6rem;border-radius:3px;text-transform:uppercase;'
      + 'font-family:sans-serif;margin-bottom:0.75rem">Story</span><br>'
    : ''

  const thumbnail = (item as VoiceItem).thumbnail_b64
    ? '<img src="' + (item as VoiceItem).thumbnail_b64 + '" style="'
      + 'width:64px;height:64px;border-radius:50%;object-fit:cover;'
      + 'border:2px solid ' + accent + ';float:right;margin:0 0 1rem 1.5rem">'
    : ''

  const header = [
    thumbnail,
    storyBadge,
    '<h2 style="font-size:clamp(1.4rem,2.5vw,2rem);color:' + accent + ';',
    'font-weight:normal;margin:0 0 0.3rem;font-family:Georgia,serif;',
    'letter-spacing:0.03em">' + escHtml(item.contributor_name) + '</h2>',
    meta ? '<p style="font-size:clamp(0.85rem,1.4vw,1rem);color:#F5F3EE;'
      + 'opacity:0.6;font-style:italic;margin:0 0 1.5rem;'
      + 'font-family:sans-serif">' + escHtml(meta) + '</p>'
      : '<div style="margin-bottom:1.5rem"></div>',
  ].join('')

  const body = '<p style="font-size:clamp(1.1rem,1.9vw,1.5rem);color:#F5F3EE;'
    + 'line-height:1.95;margin:0;clear:both">'
    + escHtml(item.tribute_text) + '</p>'

  // Story photos — inline after text
  let photoSection = ''
  if (isStory && (item as StoryItem).photos.length > 0) {
    const photos = (item as StoryItem).photos.slice(0, 3)
    photoSection = '<div style="display:flex;gap:0.75rem;margin-top:1.5rem">'
      + photos.map(p => p.b64
        ? '<img src="' + p.b64 + '" style="flex:1;min-width:0;max-height:220px;'
          + 'object-fit:cover;border-radius:6px">'
        : ''
      ).join('')
      + '</div>'
  }

  return divider + header + body + photoSection
}

function escHtml(s: string | null): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ═══ SECTION 8 — Photo Break Markers ═══
// Photos are extracted from the sequence and scheduled as timed
// interrupts that pause the scroll. Returns:
//   - tributeBlocks: ordered non-photo content
//   - photoBreaks: { afterTributeIndex, photo } array

function extractPhotoBreaks(
  sequence: DisplayItem[],
  accent: string
): {
  tributeBlocks: Array<VoiceItem | StoryItem>
  photoBreaks: Array<{ afterIndex: number; photo: PhotoItem }>
} {
  const tributeBlocks: Array<VoiceItem | StoryItem> = []
  const rawPhotos: PhotoItem[] = []

  for (const item of sequence) {
    if (item.type === 'photo') {
      rawPhotos.push(item)
    } else {
      tributeBlocks.push(item as VoiceItem | StoryItem)
    }
  }

  if (rawPhotos.length === 0) {
    return { tributeBlocks, photoBreaks: [] }
  }

  const gap = Math.max(5, Math.min(20, Math.floor(tributeBlocks.length / rawPhotos.length)))
  const photoBreaks: Array<{ afterIndex: number; photo: PhotoItem }> = []

  rawPhotos.forEach((photo, i) => {
    const afterIndex = Math.min((i + 1) * gap - 1, tributeBlocks.length - 1)
    photoBreaks.push({ afterIndex, photo })
  })

  return { tributeBlocks, photoBreaks }
}

// ═══ SECTION 9 — Slider Helper ═══

function sliderRow(
  key: string, label: string, min: number, max: number, val: number, accent: string
): string {
  return '<div style="display:flex;align-items:center;gap:0.75rem;'
    + 'font-size:0.85rem;color:#F5F3EE;font-family:Helvetica,Arial,sans-serif">'
    + '<span style="width:130px;text-align:right;opacity:0.75">' + label + '</span>'
    + '<input type="range" id="sl-' + key + '" min="' + min + '" max="' + max
    + '" step="1" value="' + val + '" oninput="updateSlider(\'' + key + '\',this.value)"'
    + ' style="width:160px;accent-color:' + accent + '">'
    + '<span style="width:40px;text-align:left;color:' + accent
    + '" id="sv-' + key + '">' + val + 's</span>'
    + '</div>'
}

// ═══ SECTION 10 — CSS ═══

function getCSS(bg: string, accent: string): string {
  return [
    '*{margin:0;padding:0;box-sizing:border-box}',
    'html,body{width:100%;height:100%;overflow:hidden;background:' + bg + '}',
    'body{font-family:Georgia,"Times New Roman",Times,serif;color:#F5F3EE}',

    // Welcome screen
    '#welcome{position:fixed;inset:0;display:flex;flex-direction:column;',
    'align-items:center;justify-content:center;gap:1.5rem;z-index:100;',
    'background:' + bg + '}',

    // Scroll viewport
    '#scroll-viewport{position:fixed;inset:0;overflow:hidden;z-index:10;',
    'padding:0 8vw 100px}',

    // Scroll document — the entire tribute thread
    '#scroll-doc{width:100%;padding-top:60px}',

    // Scroll animation
    '@keyframes scrollUp{from{transform:translateY(0)}to{transform:translateY(var(--scroll-dist))}}',
    '#scroll-doc.scrolling{animation:scrollUp var(--scroll-dur) linear forwards;',
    'animation-play-state:var(--scroll-play,running)}',

    // Intro card
    '#intro-card{text-align:center;padding:4rem 2rem 5rem;',
    'border-bottom:4px solid ' + accent + ';margin-bottom:3rem}',

    // Closing card
    '#closing-card{text-align:center;padding:5rem 2rem;margin-top:3rem}',

    // Photo break overlay
    '#photo-overlay{position:fixed;inset:0;z-index:80;',
    'background:' + bg + ';display:none;flex-direction:column;',
    'align-items:center;justify-content:center}',
    '#photo-overlay.visible{display:flex}',

    // QR overlay
    '#qr-overlay{position:fixed;inset:0;z-index:80;',
    'background:' + bg + ';display:none;flex-direction:column;',
    'align-items:center;justify-content:center;gap:1.5rem}',
    '#qr-overlay.visible{display:flex}',

    // LC brand overlay
    '#brand-overlay{position:fixed;inset:0;z-index:80;',
    'background:' + bg + ';display:none;flex-direction:column;',
    'align-items:center;justify-content:center;gap:1.2rem}',
    '#brand-overlay.visible{display:flex}',

    // Operator overlay
    '#operator-overlay{position:fixed;inset:0;z-index:200;',
    'background:rgba(0,0,0,0.94);display:none;flex-direction:column;',
    'align-items:center;justify-content:center;gap:1.25rem}',
    '#operator-overlay.visible{display:flex}',

    // LC footer
    '#lc-footer{position:fixed;bottom:0;left:0;right:0;height:42px;z-index:140;',
    'background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);',
    'border-top:1px solid ' + accent + '22;',
    'display:none;align-items:center;justify-content:space-between;padding:0 1.5rem}',

    // Control bar
    '#control-bar{position:fixed;bottom:42px;left:0;right:0;height:56px;z-index:150;',
    'background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);',
    'border-top:1px solid ' + accent + '22;',
    'display:none;align-items:center;justify-content:center;gap:1rem;',
    'transition:opacity 0.4s ease}',
    '#control-bar.hidden{opacity:0;pointer-events:none}',

    // Buttons
    '.ctrl-btn{background:' + accent + '1a;color:' + accent + ';',
    'border:1px solid ' + accent + '55;padding:0.4rem 1rem;',
    'font-size:0.85rem;cursor:pointer;border-radius:4px;font-family:inherit}',
    '.ov-btn{background:' + accent + '25;color:' + accent + ';',
    'border:1px solid ' + accent + '66;padding:0.6rem 1.5rem;',
    'font-size:1rem;cursor:pointer;border-radius:6px;font-family:inherit}',
    '.start-btn{background:' + accent + ';color:' + bg + ';border:none;',
    'padding:1rem 3rem;font-size:1.2rem;cursor:pointer;border-radius:4px;',
    'font-family:Georgia,serif;letter-spacing:0.05em;font-weight:bold}',
    'input[type=range]{width:160px;accent-color:' + accent + '}',

    // Persistent mini QR
    '#persistent-qr{position:fixed;bottom:110px;right:1.25rem;z-index:55;',
    'background:rgba(0,0,0,0.88);border:2px solid ' + accent + '80;',
    'border-radius:8px;padding:0.5rem;display:none}',
  ].join('')
}

// ═══ SECTION 11 — JavaScript Engine ═══

function getJS(
  hasAudio: boolean,
  photoBreaks: Array<{ afterIndex: number; photo: PhotoItem }>,
  totalTributes: number,
  lcEveryN: number,
  qrEveryN: number,
  qrImg: string,
  honoureeName: string,
  accent: string,
  config: DisplayConfig
): string {

  const photoBreaksJson = JSON.stringify(photoBreaks.map(pb => ({
    afterIndex: pb.afterIndex,
    hasImage: !!pb.photo.image_b64,
    caption: pb.photo.caption || '',
    imageSrc: pb.photo.image_b64 || '',
  })))

  const audioJS = hasAudio ? [
    'var audioEls=[];',
    'for(var ai=0;ai<AUDIO_COUNT;ai++){',
    '  var ael=document.getElementById("audio-"+ai);',
    '  if(ael){ael.volume=0.2;audioEls.push(ael);}',
    '}',
    'var currentAudioIdx=0,isMuted=false;',
    'function playAudio(){',
    '  if(isMuted||!audioEls.length)return;',
    '  audioEls.forEach(function(a){a.pause();a.currentTime=0;});',
    '  if(!audioEls[currentAudioIdx])return;',
    '  audioEls[currentAudioIdx].play().catch(function(){});',
    '  audioEls[currentAudioIdx].onended=function(){',
    '    currentAudioIdx=(currentAudioIdx+1)%audioEls.length;',
    '    playAudio();',
    '  };',
    '}',
    'function toggleMute(){',
    '  isMuted=!isMuted;',
    '  var btn=document.getElementById("mute-btn");',
    '  if(isMuted){audioEls.forEach(function(a){a.pause();});if(btn)btn.innerHTML="&#9834; Muted";}',
    '  else{if(btn)btn.innerHTML="&#9834; Music";playAudio();}',
    '}',
    'function setVolume(val){',
    '  var v=parseInt(val)/100;',
    '  audioEls.forEach(function(a){a.volume=v;});',
    '  var sv=document.getElementById("vol-val");if(sv)sv.textContent=val+"%";',
    '}',
  ].join('\n') : [
    'function playAudio(){}',
    'function toggleMute(){}',
    'function setVolume(){}',
  ].join('\n')

  return [
    audioJS,
    '',
    'var PHOTO_BREAKS=' + photoBreaksJson + ';',
    'var TOTAL_TRIBUTES=' + totalTributes + ';',
    'var LC_EVERY_N=' + lcEveryN + ';',
    'var QR_EVERY_N=' + qrEveryN + ';',
    'var HONOUREE=' + JSON.stringify(honoureeName) + ';',
    'var ACCENT=' + JSON.stringify(accent) + ';',
    'var QR_IMG=' + JSON.stringify(qrImg) + ';',
    'var BASE_CONFIG=' + JSON.stringify(config) + ';',
    '',
    'var TEMPO={gentle:0.6,standard:1.0,energetic:1.6};',
    'var currentTempo=BASE_CONFIG.tempo_preset||"standard";',
    'var scrollPaused=false,controlsTimer=null,displayStarted=false;',
    'var interruptQueue=[];',
    '',
    // ── Keyboard shortcuts ──
    'document.addEventListener("keydown",function(e){',
    '  if(e.ctrlKey&&e.shiftKey&&e.key==="O"){e.preventDefault();toggleOperator();return;}',
    '  if(e.key==="Escape"){closeAllOverlays();return;}',
    '  if(e.key===" "){e.preventDefault();togglePause();}',
    '  resetControlsTimer();',
    '});',
    'document.addEventListener("mousemove",resetControlsTimer);',
    '',
    'function resetControlsTimer(){',
    '  var bar=document.getElementById("control-bar");',
    '  if(bar)bar.classList.remove("hidden");',
    '  clearTimeout(controlsTimer);',
    '  controlsTimer=setTimeout(function(){',
    '    var b=document.getElementById("control-bar");if(b)b.classList.add("hidden");',
    '  },3000);',
    '}',
    '',
    // ── Start display ──
    'function startDisplay(){',
    '  document.getElementById("welcome").style.display="none";',
    '  document.getElementById("scroll-viewport").style.display="block";',
    '  var cb=document.getElementById("control-bar");if(cb)cb.style.display="flex";',
    '  var lf=document.getElementById("lc-footer");if(lf)lf.style.display="flex";',
    '  var pq=document.getElementById("persistent-qr");if(pq)pq.style.display="block";',
    '  playAudio();',
    '  displayStarted=true;',
    '  buildScrollAndStart();',
    '  resetControlsTimer();',
    '}',
    '',
    // ── Build scroll document and calculate duration ──
    'function buildScrollAndStart(){',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(!doc)return;',
    '  var viewH=window.innerHeight-100;',
    '  var docH=doc.scrollHeight;',
    '  var totalDist=docH+viewH;',
    '  var mult=TEMPO[currentTempo]||1.0;',
    '  // Base speed: 60px/sec standard — adjusted by tempo',
    '  var pxPerSec=30*mult;',
    '  var durSecs=totalDist/pxPerSec;',
    '  doc.style.setProperty("--scroll-dist","-"+totalDist+"px");',
    '  doc.style.setProperty("--scroll-dur",durSecs+"s");',
    '  doc.style.setProperty("--scroll-play","running");',
    '  doc.classList.add("scrolling");',
    '  scheduleInterrupts(durSecs,totalDist);',
    '}',
    '',
    // ── Schedule photo/QR/brand interrupts ──
    'function scheduleInterrupts(totalDurSecs,totalDist){',
    '  interruptQueue=[];',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(!doc)return;',
    '',
    '  // Photo breaks — scheduled by position in document',
    '  PHOTO_BREAKS.forEach(function(pb){',
    '    var tributeEls=doc.querySelectorAll(".tribute-block");',
    '    if(pb.afterIndex<tributeEls.length){',
    '      var el=tributeEls[pb.afterIndex];',
    '      var elBottom=el.offsetTop+el.offsetHeight;',
    '      var viewH=window.innerHeight-100;',
    '      var travelDist=elBottom+viewH;',
    '      var t=(travelDist/totalDist)*totalDurSecs*1000;',
    '      interruptQueue.push({time:t,type:"photo",data:pb});',
    '    }',
    '  });',
    '',
    '  // QR interstitials — evenly spaced',
    '  var qrCount=Math.floor(TOTAL_TRIBUTES/QR_EVERY_N);',
    '  for(var qi=1;qi<=qrCount;qi++){',
    '    var t2=(qi/qrCount)*totalDurSecs*0.8*1000;',
    '    interruptQueue.push({time:t2,type:"qr"});',
    '  }',
    '',
    '  // LC brand slides — evenly spaced, offset from QR',
    '  var lcCount=Math.floor(TOTAL_TRIBUTES/LC_EVERY_N);',
    '  for(var li=1;li<=lcCount;li++){',
    '    var t3=((li-0.5)/lcCount)*totalDurSecs*0.8*1000;',
    '    interruptQueue.push({time:t3,type:"brand"});',
    '  }',
    '',
    '  // Sort by time',
    '  interruptQueue.sort(function(a,b){return a.time-b.time;});',
    '',
    '  // Schedule each interrupt',
    '  interruptQueue.forEach(function(interrupt){',
    '    setTimeout(function(){',
    '      if(!displayStarted||scrollPaused)return;',
    '      showInterrupt(interrupt);',
    '    },interrupt.time);',
    '  });',
    '}',
    '',
    // ── Show interrupt (photo/QR/brand) ──
    'function showInterrupt(interrupt){',
    '  pauseScroll();',
    '  var dur=5000;',
    '  if(interrupt.type==="photo"){',
    '    var ov=document.getElementById("photo-overlay");',
    '    var img=document.getElementById("photo-overlay-img");',
    '    var cap=document.getElementById("photo-overlay-caption");',
    '    if(interrupt.data.hasImage&&img)img.src=interrupt.data.imageSrc;',
    '    if(cap)cap.textContent=interrupt.data.caption||"";',
    '    if(ov)ov.classList.add("visible");',
    '    dur=BASE_CONFIG.qr_screen_duration_secs*1000||5000;',
    '  } else if(interrupt.type==="qr"){',
    '    var qov=document.getElementById("qr-overlay");',
    '    if(qov)qov.classList.add("visible");',
    '    dur=BASE_CONFIG.qr_screen_duration_secs*1000||15000;',
    '  } else if(interrupt.type==="brand"){',
    '    var bov=document.getElementById("brand-overlay");',
    '    if(bov)bov.classList.add("visible");',
    '    dur=BASE_CONFIG.lc_brand_duration_secs*1000||6000;',
    '  }',
    '  setTimeout(function(){closeAllOverlays();resumeScroll();},dur);',
    '}',
    '',
    // ── Pause / resume ──
    'function pauseScroll(){',
    '  scrollPaused=true;',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(doc)doc.style.setProperty("--scroll-play","paused");',
    '  var btn=document.getElementById("pause-btn");',
    '  if(btn)btn.innerHTML="&#9654; Resume";',
    '}',
    '',
    'function resumeScroll(){',
    '  scrollPaused=false;',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(doc)doc.style.setProperty("--scroll-play","running");',
    '  var btn=document.getElementById("pause-btn");',
    '  if(btn)btn.innerHTML="&#9646;&#9646; Pause";',
    '}',
    '',
    'function togglePause(){',
    '  scrollPaused?resumeScroll():pauseScroll();',
    '}',
    '',
    'function restartDisplay(){',
    '  closeAllOverlays();',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(doc){',
    '    doc.classList.remove("scrolling");',
    '    doc.style.removeProperty("--scroll-play");',
    '    void doc.offsetWidth;',
    '    scrollPaused=false;',
    '    buildScrollAndStart();',
    '  }',
    '  if(!isMuted)playAudio();',
    '}',
    '',
    'function closeAllOverlays(){',
    '  ["photo-overlay","qr-overlay","brand-overlay"].forEach(function(id){',
    '    var el=document.getElementById(id);if(el)el.classList.remove("visible");',
    '  });',
    '}',
    '',
    // ── Operator overlay ──
    'function toggleOperator(){',
    '  var ov=document.getElementById("operator-overlay");',
    '  if(!ov)return;',
    '  if(ov.classList.contains("visible")){',
    '    ov.classList.remove("visible");',
    '    if(!scrollPaused)resumeScroll();',
    '  } else {',
    '    pauseScroll();',
    '    ov.classList.add("visible");',
    '    highlightTempo(currentTempo);',
    '  }',
    '}',
    '',
    'function highlightTempo(p){',
    '  ["gentle","standard","energetic"].forEach(function(t){',
    '    var b=document.getElementById("tempo-"+t);',
    '    if(b)b.style.background=t===p?"rgba(212,174,42,0.4)":"rgba(212,174,42,0.15)";',
    '  });',
    '}',
    '',
    'function setTempo(p){',
    '  currentTempo=p;highlightTempo(p);',
    '  // Rebuild scroll at new speed if already started',
    '  if(displayStarted){',
    '    closeAllOverlays();',
    '    var doc=document.getElementById("scroll-doc");',
    '    if(doc){',
    '      // Get current progress',
    '      var style=window.getComputedStyle(doc);',
    '      var matrix=style.transform;',
    '      var currentY=0;',
    '      if(matrix&&matrix!=="none"){',
    '        var vals=matrix.match(/matrix.*\\((.+)\\)/);',
    '        if(vals){var parts=vals[1].split(",");currentY=parseFloat(parts[5])||0;}',
    '      }',
    '      doc.classList.remove("scrolling");',
    '      void doc.offsetWidth;',
    '      scrollPaused=false;',
    '      buildScrollAndStart();',
    '    }',
    '  }',
    '}',
    '',

    'function setScrollSpeed(val){',
    '  val=parseInt(val);',
    '  var sv=document.getElementById("speed-val");if(sv)sv.textContent=val+"px/s";',
    '  if(!displayStarted)return;',
    '  var doc=document.getElementById("scroll-doc");',
    '  if(!doc)return;',
    '  var style=window.getComputedStyle(doc);',
    '  var matrix=new DOMMatrix(style.transform);',
    '  var currentY=matrix.m42;',
    '  var dist=parseFloat(doc.style.getPropertyValue("--scroll-dist"))||0;',
    '  var remaining=Math.abs(dist)-Math.abs(currentY);',
    '  if(remaining<=0)return;',
    '  var newDur=remaining/val;',
    '  doc.classList.remove("scrolling");',
    '  void doc.offsetWidth;',
    '  doc.style.transform="translateY("+currentY+"px)";',
    '  doc.style.setProperty("--scroll-dist","-"+(Math.abs(dist))+"px");',
    '  doc.style.setProperty("--scroll-dur",newDur+"s");',
    '  doc.style.setProperty("--scroll-play","running");',
    '  doc.classList.add("scrolling");',
    '  scrollPaused=false;',
    '}',
    '',


    'function updateSlider(key,val){',
    '  var map={"photo":"photo_duration_secs","qr":"qr_screen_duration_secs","brand":"lc_brand_duration_secs"};',
    '  var dk=map[key];if(dk)BASE_CONFIG[dk]=parseInt(val);',
    '  var sv=document.getElementById("sv-"+key);if(sv)sv.textContent=val+"s";',
    '}',
  ].join('\n')
}

// ═══ SECTION 12 — Main HTML Generator ═══

export function generateDisplayHTML(params: GenerateHTMLParams): string {
  const {
    honoureeName, eventType, capsuleUrl, capsuleUrlQrB64,
    honoureePhotoBg, audioTracks, sequence, config,
  } = params

  const theme = THEMES[config.theme] || THEMES.midnight
  const { bg, accent } = theme

  function sj(v: unknown): string {
    return JSON.stringify(v).replace(/<\/script>/gi, '<\\/script>')
  }

  const qrImg = capsuleUrlQrB64
    ? '<img src="' + capsuleUrlQrB64 + '" style="display:block;width:260px;height:260px" alt="QR">'
    : '<p style="color:#F5F3EE;font-family:sans-serif;font-size:0.9rem;word-break:break-all;'
      + 'max-width:280px;text-align:center">' + capsuleUrl + '</p>'

  // ── Extract photo breaks and tribute blocks ──
  const { tributeBlocks, photoBreaks } = extractPhotoBreaks(sequence, accent)

  const parts: string[] = []

  // ── Head ──
  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en">')
  parts.push('<head>')
  parts.push('<meta charset="UTF-8">')
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  parts.push('<title>' + honoureeName + ' \u2014 LegacyCapsule Display</title>')
  parts.push('<style>' + getCSS(bg, accent) + '</style>')
  parts.push('</head>')
  parts.push('<body style="background:' + bg + '">')

  // ── Watermark background ──
  if (honoureePhotoBg) {
    parts.push(
      '<div style="position:fixed;inset:0;z-index:1;'
      + 'background-image:url(\'' + honoureePhotoBg + '\');'
      + 'background-size:cover;background-position:center top;'
      + 'background-repeat:no-repeat;opacity:0.07;pointer-events:none"></div>'
    )
  }

  // ── Audio elements ──
  if (audioTracks.length > 0) {
    audioTracks.forEach((track, i) => {
      parts.push(
        '<audio id="audio-' + i + '" preload="auto" style="display:none">'
        + '<source src="' + track.b64 + '" type="' + track.mime_type + '">'
        + '</audio>'
      )
    })
  }

  // ── Welcome screen ──
  parts.push('<div id="welcome">')
  parts.push('<div style="color:' + accent + ';letter-spacing:0.5rem;font-size:1.5rem">&#10022; &#8213;&#8213;&#8213; &#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);letter-spacing:0.25em;color:' + accent + ';text-transform:uppercase">LegacyCapsule</p>')
  parts.push('<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;text-align:center;max-width:80vw;line-height:1.2;color:#F5F3EE">' + honoureeName + '</h1>')
  parts.push('<p style="font-size:1rem;opacity:0.55;font-family:Helvetica,Arial,sans-serif;color:#F5F3EE">' + tributeBlocks.length + ' tributes &amp; stories</p>')
  parts.push('<button class="start-btn" onclick="startDisplay()">&#9654; Start Display</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:Helvetica,Arial,sans-serif;margin-top:0.5rem;color:#F5F3EE">Press F11 for fullscreen &middot; Ctrl+Shift+O for operator controls</p>')
  parts.push('</div>')

  // ── Scroll viewport ──
  parts.push('<div id="scroll-viewport" style="display:none">')

  // ── Scroll document ──
  parts.push('<div id="scroll-doc">')

  // ── Intro card ──
  const introText = getIntroText(eventType, honoureeName)
  parts.push('<div id="intro-card">')
  parts.push('<div style="color:' + accent + ';font-size:1.5rem;letter-spacing:0.5rem;margin-bottom:1.5rem">&#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:normal;color:#F5F3EE;margin-bottom:1.5rem">' + honoureeName + '</h1>')
  parts.push('<p style="font-size:clamp(1rem,1.9vw,1.4rem);color:#F5F3EE;line-height:1.85;font-style:italic;max-width:700px;margin:0 auto;opacity:0.85">' + introText + '</p>')
  parts.push('</div>')

  // ── Tribute blocks ──
  tributeBlocks.forEach((item, index) => {
    const html = buildTributeBlock(item, accent, index === 0)
    parts.push('<div class="tribute-block" style="padding:2rem 0">' + html + '</div>')
  })

  // ── Closing card ──
  parts.push('<div id="closing-card">')
  parts.push('<div style="color:' + accent + ';font-size:1.2rem;letter-spacing:0.5rem;margin-bottom:1.5rem;opacity:0.6">&#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<p style="font-size:clamp(1rem,1.8vw,1.4rem);color:#F5F3EE;font-style:italic;opacity:0.7;margin-bottom:1rem">These voices were gathered with love.</p>')
  parts.push('<p style="font-size:0.9rem;color:' + accent + ';letter-spacing:0.1em;font-family:Georgia,serif">LegacyCapsule &middot; itslegacycapsule.com</p>')
  parts.push('<p style="font-size:0.7rem;color:#F5F3EE;opacity:0.3;margin-top:0.5rem;font-family:sans-serif">VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech</p>')
  parts.push('</div>')

  parts.push('</div>') // end scroll-doc
  parts.push('</div>') // end scroll-viewport

  // ── LC footer ──
  parts.push(
    '<div id="lc-footer">'
    + '<span style="font-size:0.7rem;color:' + accent + ';letter-spacing:0.18em;opacity:0.7;font-family:Georgia,serif">LegacyCapsule &middot; itslegacycapsule.com</span>'
    + '<span style="font-size:0.7rem;color:' + accent + ';opacity:0.6;font-family:sans-serif">' + honoureeName + '</span>'
    + '</div>'
  )

  // ── Control bar ──
  parts.push('<div id="control-bar">')
  parts.push('<button class="ctrl-btn" onclick="togglePause()" id="pause-btn">&#9646;&#9646; Pause</button>')
  parts.push('<button class="ctrl-btn" onclick="restartDisplay()">&#8635; Restart</button>')
  if (audioTracks.length > 0) {
    parts.push('<button class="ctrl-btn" onclick="toggleMute()" id="mute-btn">&#9834; Music</button>')
  }
  parts.push('</div>')

  // ── Operator overlay ──
  parts.push('<div id="operator-overlay">')
  parts.push('<h2 style="font-size:1.3rem;font-weight:normal;color:' + accent + ';letter-spacing:0.1em">&#10022; Operator Controls</h2>')
  parts.push('<div style="display:flex;gap:0.75rem;margin-bottom:0.5rem">')
  parts.push('<button class="ov-btn" onclick="setTempo(\'gentle\')" id="tempo-gentle">&#127807; Gentle</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'standard\')" id="tempo-standard">&#9654; Standard</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'energetic\')" id="tempo-energetic">&#9889; Energetic</button>')
  parts.push('</div>')
  parts.push('<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:#F5F3EE;font-family:sans-serif">')
  parts.push('<span style="width:130px;text-align:right;opacity:0.75">Scroll speed</span>')
  parts.push('<input type="range" id="speed-slider" min="10" max="80" step="5" value="30" oninput="setScrollSpeed(this.value)" style="width:160px;accent-color:' + accent + '">')
  parts.push('<span id="speed-val" style="width:50px;text-align:left;color:' + accent + '">30px/s</span>')
  parts.push('</div>')
  parts.push('<details style="text-align:center"><summary style="cursor:pointer;font-size:0.85rem;color:' + accent + ';opacity:0.7;font-family:sans-serif;margin-bottom:1rem">Interrupt durations</summary>')
  parts.push('<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">')
  parts.push(sliderRow('photo', 'Photo break', 3, 15, config.photo_duration_secs, accent))
  parts.push(sliderRow('qr', 'QR slide', 5, 30, config.qr_screen_duration_secs, accent))
  parts.push(sliderRow('brand', 'LC brand slide', 3, 10, config.lc_brand_duration_secs, accent))
  parts.push('</div></details>')
  if (audioTracks.length > 0) {
    parts.push('<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:#F5F3EE;font-family:sans-serif;margin-top:0.5rem">')
    parts.push('<span style="width:130px;text-align:right;opacity:0.75">Music volume</span>')
    parts.push('<input type="range" id="vol-slider" min="0" max="100" step="5" value="20" oninput="setVolume(this.value)" style="width:160px;accent-color:' + accent + '">')
    parts.push('<span id="vol-val" style="width:40px;text-align:left;color:' + accent + '">20%</span>')
    parts.push('</div>')
  }
  parts.push('<button class="ov-btn" onclick="toggleOperator()" style="margin-top:0.5rem">&#10005; Close</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:sans-serif;color:#F5F3EE">Ctrl+Shift+O to open/close &middot; Space to pause</p>')
  parts.push('</div>')

  // ── Photo break overlay ──
  parts.push('<div id="photo-overlay">')
  parts.push('<div style="position:absolute;top:0;left:0;right:0;height:42px;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;border-bottom:1px solid ' + accent + '33">')
  parts.push('<span style="color:' + accent + ';font-size:0.75rem;letter-spacing:0.2em;font-family:Georgia,serif;opacity:0.8">&#10022; &nbsp; Photo &nbsp; &#10022;</span>')
  parts.push('</div>')
  parts.push('<img id="photo-overlay-img" src="" alt="" style="max-width:90%;max-height:75vh;object-fit:contain;border-radius:4px;margin-top:3rem">')
  parts.push('<p id="photo-overlay-caption" style="font-size:clamp(0.9rem,1.5vw,1.2rem);color:#F5F3EE;font-style:italic;text-align:center;margin-top:1rem;max-width:600px;opacity:0.85"></p>')
  parts.push('</div>')

  // ── QR overlay ──
  parts.push('<div id="qr-overlay">')
  parts.push('<p style="font-size:clamp(1.1rem,2.2vw,1.7rem);text-align:center;max-width:600px;line-height:1.5;color:#F5F3EE">SCAN TO SHARE YOUR WISHES FOR ' + honoureeName.toUpperCase() + '</p>')
  parts.push('<div style="background:#F5F3EE;padding:1.25rem;border-radius:8px;border:3px solid ' + accent + '">' + qrImg + '</div>')
  parts.push('<p style="color:' + accent + ';font-size:0.9rem;opacity:0.8;font-family:sans-serif">' + capsuleUrl + '</p>')
  parts.push('<p style="color:#F5F3EE;font-size:0.8rem;opacity:0.5;font-style:italic;font-family:sans-serif">Your voice will appear on this screen</p>')
  parts.push('</div>')

  // ── LC brand overlay ──
  parts.push('<div id="brand-overlay">')
  parts.push('<div style="color:' + accent + ';font-size:1.2rem;letter-spacing:0.5rem">&#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;letter-spacing:0.15em;color:#F5F3EE">LegacyCapsule</h1>')
  parts.push('<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);color:' + accent + ';font-style:italic">Preserving the voices that matter most</p>')
  parts.push('<p style="font-size:0.8rem;opacity:0.35;font-family:sans-serif;color:#F5F3EE">itslegacycapsule.com</p>')
  parts.push('</div>')

  // ── Persistent mini QR ──
  if (capsuleUrlQrB64) {
    parts.push('<div id="persistent-qr">')
    parts.push('<img src="' + capsuleUrlQrB64 + '" style="display:block;width:140px;height:140px" alt="Scan to participate">')
    parts.push('<p style="color:' + accent + ';font-family:sans-serif;font-size:0.6rem;text-align:center;margin:0.3rem 0 0;opacity:0.8;font-weight:600;letter-spacing:0.08em">SCAN TO JOIN</p>')
    parts.push('</div>')
  }

  // ── JavaScript ──
  parts.push('<script>')
  parts.push('var AUDIO_COUNT=' + sj(audioTracks.length) + ';')
  parts.push(getJS(
    audioTracks.length > 0,
    photoBreaks,
    tributeBlocks.length,
    config.lc_interstitial_every_n,
    config.qr_interstitial_every_n,
    qrImg,
    honoureeName,
    accent,
    config
  ))
  parts.push('highlightTempo(currentTempo);')
  parts.push('<\/script>')

  parts.push('</body>')
  parts.push('</html>')

  return parts.join('\n')
}