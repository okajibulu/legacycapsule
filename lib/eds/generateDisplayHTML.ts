// ============================================================
// FILE PATH: lib/eds/generateDisplayHTML.ts
// PURPOSE:   Generates self-contained offline HTML display file.
//            All images and audio pre-embedded as base64 URIs.
//            Zero network dependency at display time.
//            Features: cinematic scroll, watermark background,
//            theme presets, background music, LC footer,
//            operator overlay with tempo + volume controls,
//            story badge differentiation, QR interstitials.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.28
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
  b64: string        // base64 data URI
  mime_type: string  // audio/mpeg, audio/mp4, etc
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

export const THEMES: Record<string, { bg: string; accent: string; cardOverlay: string; name: string }> = {
  midnight: { bg: '#0D0820', accent: '#D4AE2A', cardOverlay: 'rgba(13,8,32,0.70)', name: 'Midnight' },
  obsidian: { bg: '#080808', accent: '#D4AE2A', cardOverlay: 'rgba(8,8,8,0.75)', name: 'Obsidian' },
  forest:   { bg: '#071A0E', accent: '#C8B560', cardOverlay: 'rgba(7,26,14,0.72)', name: 'Forest' },
  navy:     { bg: '#070F1A', accent: '#D4AE2A', cardOverlay: 'rgba(7,15,26,0.72)', name: 'Navy' },
  burgundy: { bg: '#180810', accent: '#C4956A', cardOverlay: 'rgba(24,8,16,0.72)', name: 'Burgundy' },
  slate:    { bg: '#141428', accent: '#B0B8C8', cardOverlay: 'rgba(20,20,40,0.72)', name: 'Slate' },
}

// ═══ SECTION 3 — Participation Language ═══

function getVoiceLabel(eventType: string): string {
  const map: Record<string, string> = {
    memorial: 'Tribute', retirement: 'Message', birthday: 'Wish',
    wedding: 'Blessing', anniversary: 'Message', graduation: 'Message',
    chieftaincy: 'Message', ordination: 'Message', thanksgiving: 'Message',
    award: 'Message',
  }
  return map[eventType] ?? 'Voice'
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

// ═══ SECTION 7 — Main HTML Generator ═══

export function generateDisplayHTML(params: GenerateHTMLParams): string {
  const {
    honoureeName, eventType, capsuleUrl, capsuleUrlQrB64,
    honoureePhotoBg, audioTracks, sequence, config,
  } = params

  const theme = THEMES[config.theme] || THEMES.midnight
  const voiceLabel = getVoiceLabel(eventType)

  function sj(v: unknown): string {
    return JSON.stringify(v).replace(/<\/script>/gi, '<\\/script>')
  }

  const qrImg = capsuleUrlQrB64
    ? '<img src="' + capsuleUrlQrB64 + '" style="display:block;width:240px;height:240px" alt="QR">'
    : '<p style="color:#0D0820;font-family:sans-serif;font-size:0.75rem;word-break:break-all;width:240px;text-align:center">' + capsuleUrl + '</p>'

  const parts: string[] = []

  // ── Head ──
  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en">')
  parts.push('<head>')
  parts.push('<meta charset="UTF-8">')
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  parts.push('<title>' + honoureeName + ' \u2014 LegacyCapsule Display</title>')
  parts.push('<style>' + getCSS(theme.bg, theme.accent) + '</style>')
  parts.push('</head>')
  parts.push('<body style="background:' + theme.bg + '">')

  // ── Watermark background ──
  if (honoureePhotoBg) {
    parts.push(
      '<div id="honouree-bg" style="position:fixed;inset:0;z-index:1;'
      + 'background-image:url(\'' + honoureePhotoBg + '\');'
      + 'background-size:cover;background-position:center top;'
      + 'background-repeat:no-repeat;opacity:0.08;pointer-events:none"></div>'
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
  parts.push('<div style="color:' + theme.accent + ';letter-spacing:0.5rem;font-size:1.5rem">&#10022; &#8213;&#8213;&#8213; &#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);letter-spacing:0.25em;color:' + theme.accent + ';text-transform:uppercase">LegacyCapsule</p>')
  parts.push('<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;text-align:center;max-width:80vw;line-height:1.2;color:#F5F3EE">' + honoureeName + '</h1>')
  parts.push('<p id="item-count" style="font-size:1rem;opacity:0.6;font-family:Helvetica,Arial,sans-serif;color:#F5F3EE"></p>')
  parts.push('<button class="start-btn" onclick="startDisplay()">&#9654; Start Display</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:Helvetica,Arial,sans-serif;margin-top:0.5rem;color:#F5F3EE">Press F11 for fullscreen &middot; Ctrl+Shift+O for operator controls</p>')
  parts.push('</div>')

  // ── Display area ──
  parts.push('<div id="display" style="display:none"></div>')

  // ── LC frozen footer ──
  parts.push(
    '<div id="lc-footer" style="display:none;position:fixed;bottom:0;left:0;right:0;height:42px;z-index:140;'
    + 'background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);'
    + 'border-top:1px solid ' + theme.accent + '22;'
    + 'align-items:center;justify-content:space-between;padding:0 1.5rem">'
    + '<span style="font-size:0.7rem;color:' + theme.accent + ';letter-spacing:0.18em;opacity:0.7;font-family:Georgia,serif">LegacyCapsule &middot; itslegacycapsule.com</span>'
    + '<span id="lc-footer-counter" style="font-size:0.7rem;color:' + theme.accent + ';opacity:0.7;font-family:sans-serif;letter-spacing:0.05em"></span>'
    + '</div>'
  )

  // ── Control bar ──
  parts.push('<div id="control-bar" class="hidden">')
  parts.push('<button class="ctrl-btn" onclick="togglePause()" id="pause-btn">&#9646;&#9646; Pause</button>')
  parts.push('<button class="ctrl-btn" onclick="skipCard()">&#9197; Skip</button>')
  parts.push('<button class="ctrl-btn" onclick="restartDisplay()">&#8635; Restart</button>')
  if (audioTracks.length > 0) {
    parts.push('<button class="ctrl-btn" onclick="toggleMute()" id="mute-btn">&#9834; Music</button>')
  }
  parts.push('<span id="card-counter" style="position:absolute;right:1rem;font-size:0.8rem;color:' + theme.accent + ';opacity:0.6;font-family:sans-serif"></span>')
  parts.push('</div>')

  // ── Operator overlay ──
  parts.push('<div id="operator-overlay">')
  parts.push('<h2 style="font-size:1.3rem;font-weight:normal;color:' + theme.accent + ';letter-spacing:0.1em">&#10022; Operator Controls</h2>')
  parts.push('<div style="display:flex;gap:0.75rem">')
  parts.push('<button class="ov-btn" onclick="setTempo(\'gentle\')" id="tempo-gentle">Gentle</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'standard\')" id="tempo-standard">Standard</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'energetic\')" id="tempo-energetic">Energetic</button>')
  parts.push('</div>')
  parts.push('<details style="text-align:center"><summary style="cursor:pointer;font-size:0.85rem;color:' + theme.accent + ';opacity:0.7;font-family:sans-serif;margin-bottom:1rem">Advanced timing</summary>')
  parts.push('<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">')
  parts.push(sliderRow('voice', 'Voice card', 10, 30, config.voice_duration_secs, theme.accent))
  parts.push(sliderRow('photo', 'Photo card', 5, 15, config.photo_duration_secs, theme.accent))
  parts.push(sliderRow('story', 'Story (no photo)', 12, 30, config.story_duration_secs, theme.accent))
  parts.push(sliderRow('story-photo', 'Story + 1 photo', 15, 35, config.story_photo_duration_secs, theme.accent))
  parts.push(sliderRow('story-photos', 'Story + strip', 18, 40, config.story_photos_duration_secs, theme.accent))
  parts.push('</div></details>')
  if (audioTracks.length > 0) {
    parts.push('<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:#F5F3EE;font-family:sans-serif;margin-top:0.5rem">')
    parts.push('<span style="width:130px;text-align:right;opacity:0.75">Music volume</span>')
    parts.push('<input type="range" id="vol-slider" min="0" max="100" step="5" value="20" oninput="setVolume(this.value)" style="width:160px;accent-color:' + theme.accent + '">')
    parts.push('<span id="vol-val" style="width:40px;text-align:left;color:' + theme.accent + '">20%</span>')
    parts.push('</div>')
  }
  parts.push('<button class="ov-btn" onclick="closeOperator()" style="margin-top:0.5rem">&#10005; Close</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:sans-serif;color:#F5F3EE">Ctrl+Shift+O to open/close</p>')
  parts.push('</div>')

  // ── JavaScript data ──
  parts.push('<script>')
  parts.push('var ITEMS=' + sj(sequence) + ';')
  parts.push('var BASE_CONFIG=' + sj(config) + ';')
  parts.push('var HONOUREE=' + sj(honoureeName) + ';')
  parts.push('var CAPSULE_URL=' + sj(capsuleUrl) + ';')
  parts.push('var QR_IMG=' + sj(qrImg) + ';')
  parts.push('var VOICE_LABEL=' + sj(voiceLabel) + ';')
  parts.push('var THEME_ACCENT=' + sj(theme.accent) + ';')
  parts.push('var THEME_BG=' + sj(theme.bg) + ';')
  parts.push('var AUDIO_COUNT=' + sj(audioTracks.length) + ';')
  parts.push('var currentIndex=0,isPaused=false,cardTimer=null,controlsTimer=null,operatorOpen=false,cardEl=null,currentContributor="";')
  parts.push('var durations={voice:BASE_CONFIG.voice_duration_secs,photo:BASE_CONFIG.photo_duration_secs,story:BASE_CONFIG.story_duration_secs,storyPhoto:BASE_CONFIG.story_photo_duration_secs,storyPhotos:BASE_CONFIG.story_photos_duration_secs,lcBrand:BASE_CONFIG.lc_brand_duration_secs,qr:BASE_CONFIG.qr_screen_duration_secs};')
  parts.push('var TEMPO={gentle:1.4,standard:1.0,energetic:0.7};')
  parts.push('var currentTempo=BASE_CONFIG.tempo_preset||"standard";')
  parts.push('var isMuted=false,currentAudioIdx=0;')
  parts.push('document.getElementById("item-count").textContent=ITEMS.length+" items ready for display";')
  parts.push(getJS(audioTracks.length > 0, theme.accent))
  parts.push('highlightTempo(currentTempo);')
  parts.push('<\/script>')

  parts.push('</body>')
  parts.push('</html>')

  return parts.join('\n')
}

// ═══ SECTION 8 — Slider Helper ═══

function sliderRow(key: string, label: string, min: number, max: number, val: number, accent: string): string {
  return '<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:#F5F3EE;font-family:Helvetica,Arial,sans-serif">'
    + '<span style="width:130px;text-align:right;opacity:0.75">' + label + '</span>'
    + '<input type="range" id="sl-' + key + '" min="' + min + '" max="' + max + '" step="1" value="' + val + '" oninput="updateSlider(\'' + key + '\',this.value)" style="width:160px;accent-color:' + accent + '">'
    + '<span style="width:40px;text-align:left;color:' + accent + '" id="sv-' + key + '">' + val + 's</span>'
    + '</div>'
}

// ═══ SECTION 9 — CSS ═══

function getCSS(bg: string, accent: string): string {
  return [
    '*{margin:0;padding:0;box-sizing:border-box}',
    'html,body{width:100%;height:100%;overflow:hidden}',
    'body{font-family:Georgia,"Times New Roman",Times,serif;color:#F5F3EE}',
    '#welcome{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;z-index:100}',
    '#display{position:fixed;inset:0;z-index:10}',
    '.card{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.7s ease;pointer-events:none;overflow:hidden;padding-bottom:42px}',
    '.card.active{opacity:1;pointer-events:auto}',
    '#operator-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.94);display:none;flex-direction:column;align-items:center;justify-content:center;gap:1.25rem}',
    '#operator-overlay.visible{display:flex}',
    '#control-bar{position:fixed;bottom:42px;left:0;right:0;height:56px;z-index:150;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);border-top:1px solid ' + accent + '22;display:flex;align-items:center;justify-content:center;gap:1rem;transition:opacity 0.4s ease}',
    '#control-bar.hidden{opacity:0;pointer-events:none}',
    '.ctrl-btn{background:' + accent + '1a;color:' + accent + ';border:1px solid ' + accent + '55;padding:0.4rem 1rem;font-size:0.85rem;cursor:pointer;border-radius:4px;font-family:inherit}',
    '.ov-btn{background:' + accent + '25;color:' + accent + ';border:1px solid ' + accent + '66;padding:0.6rem 1.5rem;font-size:1rem;cursor:pointer;border-radius:6px;font-family:inherit}',
    '.start-btn{background:' + accent + ';color:' + bg + ';border:none;padding:1rem 3rem;font-size:1.2rem;cursor:pointer;border-radius:4px;font-family:Georgia,serif;letter-spacing:0.05em;font-weight:bold}',
    'input[type=range]{width:160px;accent-color:' + accent + '}',
    '@keyframes lcScroll{0%{transform:translateY(60px);opacity:0}5%{opacity:1}88%{opacity:1}100%{transform:translateY(var(--scroll-px));opacity:0}}',
    '.lc-scroll{animation:lcScroll var(--scroll-dur) ease-in-out forwards}',
  ].join('')
}

// ═══ SECTION 10 — JavaScript ═══

function getJS(hasAudio: boolean, accent: string): string {
  const audioJS = hasAudio ? [
    'var audioEls=[];',
    'for(var ai=0;ai<AUDIO_COUNT;ai++){var ael=document.getElementById("audio-"+ai);if(ael){ael.volume=0.2;audioEls.push(ael);}}',
    'function playAudio(){if(isMuted||audioEls.length===0)return;',
    '  audioEls.forEach(function(a){a.pause();a.currentTime=0;});',
    '  if(!audioEls[currentAudioIdx])return;',
    '  audioEls[currentAudioIdx].play().catch(function(){});',
    '  audioEls[currentAudioIdx].onended=function(){',
    '    currentAudioIdx=(currentAudioIdx+1)%audioEls.length;',
    '    playAudio();',
    '  };',
    '}',
    'function toggleMute(){isMuted=!isMuted;var btn=document.getElementById("mute-btn");',
    '  if(isMuted){audioEls.forEach(function(a){a.pause();});if(btn)btn.innerHTML="&#9834; Muted";}',
    '  else{if(btn)btn.innerHTML="&#9834; Music";playAudio();}',
    '}',
    'function setVolume(val){var v=parseInt(val)/100;audioEls.forEach(function(a){a.volume=v;});var sv=document.getElementById("vol-val");if(sv)sv.textContent=val+"%";}',
  ].join('\n') : [
    'function toggleMute(){}',
    'function setVolume(){}',
    'function playAudio(){}',
  ].join('\n')

  return [
    audioJS,
    'document.addEventListener("keydown",function(e){',
    '  if(e.ctrlKey&&e.shiftKey&&e.key==="O"){e.preventDefault();toggleOperator();return;}',
    '  if(e.key==="Escape"&&operatorOpen){closeOperator();return;}',
    '  if(e.key===" "){e.preventDefault();togglePause();}',
    '  if(e.key==="ArrowRight")skipCard();',
    '  resetControlsTimer();',
    '});',
    'document.addEventListener("mousemove",resetControlsTimer);',
    '',
    'function resetControlsTimer(){',
    '  var bar=document.getElementById("control-bar");',
    '  if(bar)bar.classList.remove("hidden");',
    '  clearTimeout(controlsTimer);',
    '  controlsTimer=setTimeout(function(){var b=document.getElementById("control-bar");if(b)b.classList.add("hidden");},3000);',
    '}',
    '',
    'function startDisplay(){',
    '  document.getElementById("welcome").style.display="none";',
    '  document.getElementById("display").style.display="block";',
    '  var cb=document.getElementById("control-bar");if(cb)cb.style.display="flex";',
    '  var lf=document.getElementById("lc-footer");if(lf)lf.style.display="flex";',
    '  playAudio();',
    '  resetControlsTimer();',
    '  showCard(0);',
    '}',
    '',
    // Scroll duration — text length aware
    'function getScrollDuration(text,baseSecs,mult){',
    '  var chars=text?text.length:0;',
    '  var extra=Math.max(0,Math.floor((chars-200)/100))*5;',
    '  var raw=(baseSecs+extra)*mult;',
    '  return Math.min(Math.max(raw,baseSecs*mult),90)*1000;',
    '}',
    '',
    'function getCardDuration(item){',
    '  var mult=TEMPO[currentTempo]||1.0;',
    '  if(item.type==="voice")return getScrollDuration(item.tribute_text,durations.voice,mult);',
    '  if(item.type==="photo")return Math.round(durations.photo*mult)*1000;',
    '  if(item.type==="story"){',
    '    var pc=item.photos?item.photos.length:0;',
    '    var base=pc===0?durations.story:pc===1?durations.storyPhoto:durations.storyPhotos;',
    '    return getScrollDuration(item.tribute_text,base,mult);',
    '  }',
    '  if(item.type==="lc_brand")return durations.lcBrand*1000;',
    '  if(item.type==="qr")return durations.qr*1000;',
    '  return 15000;',
    '}',
    '',
    // Inject scroll CSS for long text
    'function applyScroll(el,text,durationMs){',
    '  var chars=text?text.length:0;',
    '  if(chars<=300)return;',
    '  var px=Math.min(chars*2.2,2200);',
    '  el.style.setProperty("--scroll-px","-"+px+"px");',
    '  el.style.setProperty("--scroll-dur",durationMs+"ms");',
    '  el.classList.add("lc-scroll");',
    '}',
    '',
    'function esc(s){return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}',
    '',
    'function buildCardHTML(item){',
    '  var accent=THEME_ACCENT;',
    '  var dur=getCardDuration(item);',
    '',
    '  if(item.type==="lc_brand"){',
    '    return {html:\'<div class="card" style="flex-direction:column;align-items:center;justify-content:center;gap:1.2rem">\'',
    '      +\'<div style="color:\'+accent+\';font-size:1.2rem;letter-spacing:0.5rem">&#10022; &#8213;&#8213;&#8213; &#10022;</div>\'',
    '      +\'<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;letter-spacing:0.15em;color:#F5F3EE">LegacyCapsule</h1>\'',
    '      +\'<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);color:\'+accent+\';font-style:italic">Preserving the voices that matter most</p>\'',
    '      +\'<p style="font-size:0.8rem;opacity:0.35;font-family:sans-serif;margin-top:0.5rem;color:#F5F3EE">itslegacycapsule.com</p>\'',
    '      +\'</div>\',scroll:null};',
    '  }',
    '',
    '  if(item.type==="qr"){',
    '    return {html:\'<div class="card" style="flex-direction:column;align-items:center;justify-content:center;gap:1.5rem">\'',
    '      +\'<p style="font-size:clamp(1.1rem,2.2vw,1.7rem);text-align:center;max-width:600px;line-height:1.5;color:#F5F3EE">SCAN TO SHARE YOUR WISHES FOR \'+esc(HONOUREE.toUpperCase())+\'</p>\'',
    '      +\'<div style="background:#F5F3EE;padding:1.25rem;border-radius:8px;border:3px solid \'+accent+\'">\'+QR_IMG+\'</div>\'',
    '      +\'<p style="color:\'+accent+\';font-size:0.9rem;opacity:0.8;font-family:sans-serif">\'+esc(CAPSULE_URL)+\'</p>\'',
    '      +\'<p style="color:#F5F3EE;font-size:0.8rem;opacity:0.5;font-style:italic;font-family:sans-serif">Your voice will appear on this screen</p>\'',
    '      +\'</div>\',scroll:null};',
    '  }',
    '',
    '  if(item.type==="voice"){',
    '    var loc=[item.city,item.ip_country].filter(Boolean).join(", ");',
    '    var meta=[item.relationship,loc].filter(Boolean).join(" \u00b7 ");',
    '    var thumb=item.thumbnail_b64',
    '      ?\'<div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:2px solid \'+accent+\';margin:0 auto 1.2rem"><img src="\'+item.thumbnail_b64+\'" style="width:100%;height:100%;object-fit:cover"></div>\'',
    '      :"";',
    '    var bodyHtml=\'<div style="max-width:860px;width:100%;text-align:center" id="scroll-target">\'',
    '      +\'<div style="color:\'+accent+\';font-size:1rem;opacity:0.5;margin-bottom:1.5rem">&#10022;</div>\'',
    '      +thumb',
    '      +\'<h1 style="font-size:clamp(2rem,4vw,3rem);color:\'+accent+\';font-weight:normal;letter-spacing:0.05em;margin-bottom:0.4rem">\'+esc(item.contributor_name)+\'</h1>\'',
    '      +(meta?\'<p style="font-size:clamp(1rem,2vw,1.3rem);opacity:0.65;font-style:italic;margin-bottom:2rem">\'+esc(meta)+\'</p>\':\'<div style="margin-bottom:2rem"></div>\')',
    '      +\'<div style="width:50px;height:1px;background:\'+accent+\';margin:0 auto 2rem;opacity:0.5"></div>\'',
    '      +\'<p style="font-size:clamp(1.2rem,2.3vw,1.8rem);line-height:2;color:#F5F3EE;text-align:center">\'+esc(item.tribute_text)+\'</p>\'',
    '      +\'<div style="color:\'+accent+\';font-size:0.8rem;opacity:0.25;margin-top:2.5rem">&#10022;</div>\'',
    '      +\'</div>\';',
    '    return {html:\'<div class="card" style="align-items:center;justify-content:center;padding:4rem 4rem 5.5rem">\'+bodyHtml+\'</div>\',',
    '      scroll:{text:item.tribute_text,dur:dur}};',
    '  }',
    '',
    '  if(item.type==="photo"){',
    '    var cap=item.caption||"";var cred=item.uploaded_by_name||"";',
    '    var img=item.image_b64?\'<img src="\'+item.image_b64+\'" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px">\':"";',
    '    return {html:\'<div class="card" style="flex-direction:column;align-items:center;justify-content:center">\'',
    '      +\'<div style="flex:1;width:100%;display:flex;align-items:center;justify-content:center;padding:3rem 3rem 1rem;min-height:0">\'+img+\'</div>\'',
    '      +((cap||cred)?\'<div style="padding:0.75rem 3rem 2rem;text-align:center">\'',
    '        +(cap?\'<p style="font-size:clamp(1rem,1.8vw,1.3rem);font-style:italic;margin-bottom:0.3rem">\'+esc(cap)+\'</p>\':"" )',
    '        +(cred?\'<p style="font-size:clamp(0.85rem,1.4vw,1rem);color:\'+accent+\';opacity:0.8;font-family:sans-serif">\'+esc(cred)+\'</p>\':"" )',
    '        +\'</div>\':"" )',
    '      +\'</div>\',scroll:null};',
    '  }',
    '',
    '  if(item.type==="story"){',
    '    var sloc=[item.city,item.ip_country].filter(Boolean).join(", ");',
    '    var smeta=[item.relationship,sloc].filter(Boolean).join(" \u00b7 ");',
    '    var ph=item.photos||[];var pc2=ph.length;',
    '    var badge=\'<span style="display:inline-block;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;color:#000;background:\'+accent+\';padding:0.2rem 0.55rem;border-radius:3px;text-transform:uppercase;font-family:sans-serif;margin-bottom:1.2rem">Story</span>\';',
    '    var stHtml=\'<div style="flex:1;display:flex;flex-direction:column;justify-content:center" id="scroll-target">\'',
    '      +badge',
    '      +\'<h2 style="font-size:clamp(1.5rem,2.8vw,2.3rem);color:\'+accent+\';font-weight:normal;margin-bottom:0.3rem">\'+esc(item.contributor_name)+\'</h2>\'',
    '      +(smeta?\'<p style="font-size:clamp(0.9rem,1.6vw,1.1rem);opacity:0.65;font-style:italic;margin-bottom:1.25rem">\'+esc(smeta)+\'</p>\':"")',
    '      +\'<div style="width:35px;height:1px;background:\'+accent+\';margin-bottom:1.25rem;opacity:0.5"></div>\'',
    '      +\'<p style="font-size:clamp(1.1rem,2vw,1.5rem);line-height:2;color:#F5F3EE">\'+esc(item.tribute_text)+\'</p></div>\';',
    '    if(pc2===0)return {html:\'<div class="card" style="align-items:center;justify-content:center;padding:3.5rem 4rem"><div style="max-width:860px;width:100%">\'+stHtml+\'</div></div>\',scroll:{text:item.tribute_text,dur:dur}};',
    '    var hs=ph[0].b64||"";',
    '    var strip=pc2===1',
    '      ?\'<img src="\'+hs+\'" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:4px">\'',
    '      :\'<div style="display:flex;flex-direction:column;gap:0.5rem;height:100%">\'',
    '        +\'<img src="\'+hs+\'" style="width:100%;flex:0 0 55%;object-fit:cover;border-radius:4px">\'',
    '        +\'<div style="display:flex;gap:0.5rem;flex:1">\'',
    '        +ph.slice(1,3).map(function(p){return\'<img src="\'+(p.b64||"")+\'" style="flex:1;object-fit:cover;border-radius:4px;min-width:0">\';}).join("")',
    '        +\'</div></div>\';',
    '    return {html:\'<div class="card" style="align-items:center;justify-content:center;padding:3rem 3.5rem;gap:2.5rem"><div style="flex:1;max-width:50%">\'+stHtml+\'</div><div style="flex:1;max-width:46%;display:flex;align-items:center">\'+strip+\'</div></div>\',scroll:{text:item.tribute_text,dur:dur}};',
    '  }',
    '',
    '  return {html:\'<div class="card"></div>\',scroll:null};',
    '}',
    '',
    'function showCard(index){',
    '  if(index>=ITEMS.length)index=0;',
    '  currentIndex=index;',
    '  var lcN=BASE_CONFIG.lc_interstitial_every_n||10;',
    '  var qrN=BASE_CONFIG.qr_interstitial_every_n||15;',
    '  var item=ITEMS[index];',
    '  if(index>0&&index%lcN===0){item={type:"lc_brand"};currentIndex=index-1;}',
    '  else if(index>0&&index%qrN===0&&index%lcN!==0){item={type:"qr"};currentIndex=index-1;}',
    '  var display=document.getElementById("display");',
    '  if(cardEl){',
    '    cardEl.classList.remove("active");',
    '    (function(el){setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el);},750);})(cardEl);',
    '  }',
    '  var result=buildCardHTML(item);',
    '  var wrapper=document.createElement("div");',
    '  wrapper.innerHTML=result.html;',
    '  cardEl=wrapper.firstElementChild;',
    '  display.appendChild(cardEl);',
    // Apply scroll after mount
    '  if(result.scroll&&result.scroll.text){',
    '    var st=cardEl.querySelector("#scroll-target");',
    '    if(st)applyScroll(st,result.scroll.text,result.scroll.dur);',
    '  }',
    // Update counters
    '  var ctrText=(index+1)+" of "+ITEMS.length;',
    '  if(item&&item.contributor_name){currentContributor=item.contributor_name;ctrText=item.contributor_name+" \u00b7 "+(index+1)+" of "+ITEMS.length;}',
    '  var ctr=document.getElementById("card-counter");if(ctr)ctr.textContent=ctrText;',
    '  var fctr=document.getElementById("lc-footer-counter");if(fctr)fctr.textContent=ctrText;',
    '  requestAnimationFrame(function(){requestAnimationFrame(function(){if(cardEl)cardEl.classList.add("active");});});',
    '  if(!isPaused){var dur2=getCardDuration(item);cardTimer=setTimeout(function(){showCard(index+1);},dur2);}',
    '}',
    '',
    'function togglePause(){',
    '  isPaused=!isPaused;',
    '  var btn=document.getElementById("pause-btn");',
    '  if(isPaused){',
    '    clearTimeout(cardTimer);',
    '    audioEls&&audioEls.forEach&&audioEls.forEach(function(a){a.pause();});',
    '    if(btn)btn.innerHTML="&#9654; Resume";',
    '  }else{',
    '    if(btn)btn.innerHTML="&#9646;&#9646; Pause";',
    '    if(!isMuted)playAudio();',
    '    showCard(currentIndex+1);',
    '  }',
    '}',
    'function skipCard(){clearTimeout(cardTimer);showCard(currentIndex+1);}',
    'function restartDisplay(){clearTimeout(cardTimer);currentAudioIdx=0;showCard(0);if(!isMuted)playAudio();}',
    'function updateSlider(key,val){var map={"voice":"voice","photo":"photo","story":"story","story-photo":"storyPhoto","story-photos":"storyPhotos"};var dk=map[key];if(dk)durations[dk]=parseInt(val);var sv=document.getElementById("sv-"+key);if(sv)sv.textContent=val+"s";}',
    'function toggleOperator(){operatorOpen?closeOperator():openOperator();}',
    'function openOperator(){operatorOpen=true;clearTimeout(cardTimer);audioEls&&audioEls.forEach&&audioEls.forEach(function(a){a.pause();});document.getElementById("operator-overlay").classList.add("visible");highlightTempo(currentTempo);}',
    'function closeOperator(){operatorOpen=false;document.getElementById("operator-overlay").classList.remove("visible");if(!isMuted)playAudio();if(!isPaused){var dur3=getCardDuration(ITEMS[currentIndex]||{type:"voice"});cardTimer=setTimeout(function(){showCard(currentIndex+1);},dur3);}}',
    'function highlightTempo(p){["gentle","standard","energetic"].forEach(function(t){var b=document.getElementById("tempo-"+t);if(b)b.style.background=t===p?"rgba(212,174,42,0.4)":"rgba(212,174,42,0.15)";});}',
    'function setTempo(p){currentTempo=p;highlightTempo(p);}',
  ].join('\n')
}