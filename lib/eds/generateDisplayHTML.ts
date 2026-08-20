// ============================================================
// FILE PATH: lib/eds/generateDisplayHTML.ts
// PURPOSE:   Generates the self-contained offline HTML display
//            file for Output B. All images pre-embedded as
//            base64 data URIs. Full display engine included:
//            card rotation, QR interstitials, LC brand slides,
//            operator overlay with tempo presets + sliders.
//            QR code pre-rendered server-side and embedded as
//            base64 PNG — zero network dependency at display time.
// ARCHITECTURE: EDS — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.26
// DATE:      20 August 2026
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
}

export interface GenerateHTMLParams {
  honoureeName: string
  eventType: string
  capsuleUrl: string
  capsuleUrlQrB64: string | null   // pre-rendered QR as base64 PNG
  sequence: DisplayItem[]
  config: DisplayConfig
}

// ═══ SECTION 2 — Participation Language ═══

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

// ═══ SECTION 3 — Sequence Builder ═══

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

// ═══ SECTION 4 — Image to Base64 ═══

export async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')
    return 'data:' + contentType + ';base64,' + b64
  } catch {
    return null
  }
}

// ═══ SECTION 5 — QR Code Pre-render (server-side) ═══
// Uses qrcode npm package which is safe to use server-side.
// Falls back to null — HTML shows URL text if QR unavailable.

export async function generateQRBase64(url: string): Promise<string | null> {
  try {
    const QRCode = await import('qrcode')
    const dataUrl = await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#0D0820', light: '#F5F3EE' },
    })
    return dataUrl
  } catch {
    return null
  }
}

// ═══ SECTION 6 — Main HTML Generator ═══

export function generateDisplayHTML(params: GenerateHTMLParams): string {
  const { honoureeName, eventType, capsuleUrl, capsuleUrlQrB64, sequence, config } = params
  const voiceLabel = getVoiceLabel(eventType)

  // Safe JSON serialisation — escape closing script tags
  function safeJson(v: unknown): string {
    return JSON.stringify(v).replace(/<\/script>/gi, '<\\/script>')
  }

  const parts: string[] = []

  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en">')
  parts.push('<head>')
  parts.push('<meta charset="UTF-8">')
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  parts.push('<title>' + honoureeName + ' \u2014 LegacyCapsule Display</title>')
  parts.push('<style>' + getCSS() + '</style>')
  parts.push('</head>')
  parts.push('<body>')

  // Welcome screen
  parts.push('<div id="welcome">')
  parts.push('<div style="color:#D4AE2A;letter-spacing:0.5rem;font-size:1.5rem">&#10022; &#8213;&#8213;&#8213; &#10022; &#8213;&#8213;&#8213; &#10022;</div>')
  parts.push('<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);letter-spacing:0.25em;color:#D4AE2A;text-transform:uppercase">LegacyCapsule</p>')
  parts.push('<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;text-align:center;max-width:80vw;line-height:1.2">' + honoureeName + '</h1>')
  parts.push('<p id="item-count" style="font-size:1rem;opacity:0.6;font-family:Helvetica,Arial,sans-serif"></p>')
  parts.push('<button class="start-btn" onclick="startDisplay()">&#9654; Start Display</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:Helvetica,Arial,sans-serif;margin-top:0.5rem">Press F11 for fullscreen &middot; Ctrl+Shift+O for operator controls</p>')
  parts.push('</div>')

  // Display area
  parts.push('<div id="display" style="display:none"></div>')

  // Control bar
  parts.push('<div id="control-bar" class="hidden">')
  parts.push('<button class="ctrl-btn" onclick="togglePause()" id="pause-btn">&#9646;&#9646; Pause</button>')
  parts.push('<button class="ctrl-btn" onclick="skipCard()">&#9197; Skip</button>')
  parts.push('<button class="ctrl-btn" onclick="restartDisplay()">&#8635; Restart</button>')
  parts.push('<span id="card-counter" style="position:absolute;right:1rem;font-size:0.8rem;color:#D4AE2A;opacity:0.6;font-family:sans-serif"></span>')
  parts.push('</div>')

  // Operator overlay
  parts.push('<div id="operator-overlay">')
  parts.push('<h2 style="font-size:1.3rem;font-weight:normal;color:#D4AE2A;letter-spacing:0.1em">&#10022; Operator Controls</h2>')
  parts.push('<div style="display:flex;gap:0.75rem">')
  parts.push('<button class="ov-btn" onclick="setTempo(\'gentle\')" id="tempo-gentle">Gentle</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'standard\')" id="tempo-standard">Standard</button>')
  parts.push('<button class="ov-btn" onclick="setTempo(\'energetic\')" id="tempo-energetic">Energetic</button>')
  parts.push('</div>')
  parts.push('<details style="text-align:center"><summary style="cursor:pointer;font-size:0.85rem;color:#D4AE2A;opacity:0.7;font-family:sans-serif;margin-bottom:1rem">Advanced timing</summary>')
  parts.push('<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">')
  parts.push(sliderRow('voice', 'Voice card', 10, 30, config.voice_duration_secs))
  parts.push(sliderRow('photo', 'Photo card', 5, 15, config.photo_duration_secs))
  parts.push(sliderRow('story', 'Story (no photo)', 12, 30, config.story_duration_secs))
  parts.push(sliderRow('story-photo', 'Story + 1 photo', 15, 35, config.story_photo_duration_secs))
  parts.push(sliderRow('story-photos', 'Story + strip', 18, 40, config.story_photos_duration_secs))
  parts.push('</div></details>')
  parts.push('<button class="ov-btn" onclick="closeOperator()" style="margin-top:0.5rem">&#10005; Close</button>')
  parts.push('<p style="font-size:0.75rem;opacity:0.35;font-family:sans-serif">Ctrl+Shift+O to open/close</p>')
  parts.push('</div>')

  // QR data — pre-rendered server-side
  const qrImg = capsuleUrlQrB64
    ? '<img src="' + capsuleUrlQrB64 + '" style="display:block;width:240px;height:240px" alt="QR Code">'
    : '<p style="color:#0D0820;font-family:sans-serif;font-size:0.75rem;word-break:break-all;width:240px;text-align:center">' + capsuleUrl + '</p>'

  // JavaScript
  parts.push('<script>')
  parts.push('var ITEMS=' + safeJson(sequence) + ';')
  parts.push('var BASE_CONFIG=' + safeJson(config) + ';')
  parts.push('var HONOUREE=' + safeJson(honoureeName) + ';')
  parts.push('var CAPSULE_URL=' + safeJson(capsuleUrl) + ';')
  parts.push('var QR_IMG=' + safeJson(qrImg) + ';')
  parts.push('var VOICE_LABEL=' + safeJson(voiceLabel) + ';')
  parts.push('var currentIndex=0,isPaused=false,cardTimer=null,controlsTimer=null,operatorOpen=false,cardEl=null;')
  parts.push('var durations={voice:BASE_CONFIG.voice_duration_secs,photo:BASE_CONFIG.photo_duration_secs,story:BASE_CONFIG.story_duration_secs,storyPhoto:BASE_CONFIG.story_photo_duration_secs,storyPhotos:BASE_CONFIG.story_photos_duration_secs,lcBrand:BASE_CONFIG.lc_brand_duration_secs,qr:BASE_CONFIG.qr_screen_duration_secs};')
  parts.push('var TEMPO={gentle:1.4,standard:1.0,energetic:0.7};')
  parts.push('var currentTempo=BASE_CONFIG.tempo_preset||"standard";')
  parts.push('document.getElementById("item-count").textContent=ITEMS.length+" items ready for display";')
  parts.push(getJS())
  parts.push('highlightTempo(currentTempo);')
  parts.push('<\/script>')

  parts.push('</body>')
  parts.push('</html>')

  return parts.join('\n')
}

// ═══ SECTION 7 — Slider Helper ═══

function sliderRow(key: string, label: string, min: number, max: number, val: number): string {
  return '<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:#F5F3EE;font-family:Helvetica,Arial,sans-serif">'
    + '<span style="width:130px;text-align:right;opacity:0.75">' + label + '</span>'
    + '<input type="range" id="sl-' + key + '" min="' + min + '" max="' + max + '" step="1" value="' + val + '" oninput="updateSlider(\'' + key + '\',this.value)">'
    + '<span style="width:40px;text-align:left;color:#D4AE2A" id="sv-' + key + '">' + val + 's</span>'
    + '</div>'
}

// ═══ SECTION 8 — CSS ═══

function getCSS(): string {
  return [
    '*{margin:0;padding:0;box-sizing:border-box}',
    'html,body{width:100%;height:100%;background:#0D0820;overflow:hidden}',
    'body{font-family:Georgia,"Times New Roman",Times,serif;color:#F5F3EE}',
    '#welcome{position:fixed;inset:0;background:#0D0820;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;z-index:100}',
    '#display{position:fixed;inset:0;z-index:10}',
    '.card{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.6s ease;pointer-events:none}',
    '.card.active{opacity:1;pointer-events:auto}',
    '#operator-overlay{position:fixed;inset:0;z-index:200;background:rgba(13,8,32,0.93);display:none;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem}',
    '#operator-overlay.visible{display:flex}',
    '#control-bar{position:fixed;bottom:0;left:0;right:0;height:64px;z-index:150;background:rgba(13,8,32,0.88);backdrop-filter:blur(8px);border-top:1px solid rgba(212,174,42,0.2);display:flex;align-items:center;justify-content:center;gap:1rem;transition:opacity 0.4s ease}',
    '#control-bar.hidden{opacity:0;pointer-events:none}',
    '.ctrl-btn{background:rgba(212,174,42,0.12);color:#D4AE2A;border:1px solid rgba(212,174,42,0.35);padding:0.4rem 1rem;font-size:0.85rem;cursor:pointer;border-radius:4px;font-family:inherit}',
    '.ov-btn{background:rgba(212,174,42,0.15);color:#D4AE2A;border:1px solid rgba(212,174,42,0.4);padding:0.6rem 1.5rem;font-size:1rem;cursor:pointer;border-radius:6px;font-family:inherit}',
    '.start-btn{background:#D4AE2A;color:#0D0820;border:none;padding:1rem 3rem;font-size:1.2rem;cursor:pointer;border-radius:4px;font-family:Georgia,serif;letter-spacing:0.05em}',
    'input[type=range]{width:160px;accent-color:#D4AE2A}',
  ].join('')
}

// ═══ SECTION 9 — JavaScript ═══

function getJS(): string {
  return [
    'document.addEventListener("keydown",function(e){',
    '  if(e.ctrlKey&&e.shiftKey&&e.key==="O"){e.preventDefault();toggleOperator();return;}',
    '  if(e.key==="Escape"&&operatorOpen){closeOperator();return;}',
    '  if(e.key===" "){e.preventDefault();togglePause();}',
    '  if(e.key==="ArrowRight")skipCard();',
    '  resetControlsTimer();',
    '});',
    'document.addEventListener("mousemove",resetControlsTimer);',
    'function resetControlsTimer(){',
    '  var bar=document.getElementById("control-bar");',
    '  bar.classList.remove("hidden");',
    '  clearTimeout(controlsTimer);',
    '  controlsTimer=setTimeout(function(){bar.classList.add("hidden");},3000);',
    '}',
    'function startDisplay(){',
    '  document.getElementById("welcome").style.display="none";',
    '  document.getElementById("display").style.display="block";',
    '  document.getElementById("control-bar").style.display="flex";',
    '  resetControlsTimer();showCard(0);',
    '}',
    'function getCardDuration(item){',
    '  var mult=TEMPO[currentTempo]||1.0;',
    '  if(item.type==="voice")return Math.round(durations.voice*mult)*1000;',
    '  if(item.type==="photo")return Math.round(durations.photo*mult)*1000;',
    '  if(item.type==="story"){var pc=item.photos?item.photos.length:0;if(pc===0)return Math.round(durations.story*mult)*1000;if(pc===1)return Math.round(durations.storyPhoto*mult)*1000;return Math.round(durations.storyPhotos*mult)*1000;}',
    '  if(item.type==="lc_brand")return durations.lcBrand*1000;',
    '  if(item.type==="qr")return durations.qr*1000;',
    '  return 15000;',
    '}',
    'function buildCardHTML(item){',
    '  var bg="background:linear-gradient(135deg,#0D0820 0%,#1a0f35 100%)";',
    '  if(item.type==="lc_brand"){',
    '    return \'<div class="card" style="\'+bg+\';flex-direction:column;align-items:center;justify-content:center;gap:1.2rem">\'',
    '      +\'<div style="color:#D4AE2A;font-size:1.2rem;letter-spacing:0.5rem">&#10022; &#8213;&#8213;&#8213; &#10022;</div>\'',
    '      +\'<h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal;letter-spacing:0.15em;color:#F5F3EE">LegacyCapsule</h1>\'',
    '      +\'<p style="font-size:clamp(0.9rem,1.6vw,1.2rem);color:#D4AE2A;font-style:italic">Preserving the voices that matter most</p>\'',
    '      +\'<p style="font-size:0.8rem;opacity:0.35;font-family:sans-serif;margin-top:0.5rem">itslegacycapsule.com</p>\'',
    '      +\'</div>\';',
    '  }',
    '  if(item.type==="qr"){',
    '    return \'<div class="card" style="\'+bg+\';flex-direction:column;align-items:center;justify-content:center;gap:1.5rem">\'',
    '      +\'<p style="font-size:clamp(1.1rem,2.2vw,1.7rem);text-align:center;max-width:600px;line-height:1.5;color:#F5F3EE">SCAN TO SHARE YOUR WISHES FOR \'+HONOUREE.toUpperCase()+\'</p>\'',
    '      +\'<div style="background:#F5F3EE;padding:1.25rem;border-radius:8px;border:3px solid #D4AE2A">\'+QR_IMG+\'</div>\'',
    '      +\'<p style="color:#D4AE2A;font-size:0.9rem;opacity:0.8;font-family:sans-serif">\'+CAPSULE_URL+\'</p>\'',
    '      +\'<p style="color:#F5F3EE;font-size:0.8rem;opacity:0.5;font-style:italic;font-family:sans-serif">Your voice will appear on this screen</p>\'',
    '      +\'</div>\';',
    '  }',
    '  if(item.type==="voice"){',
    '    var loc=[item.city,item.ip_country].filter(Boolean).join(", ");',
    '    var meta=[item.relationship,loc].filter(Boolean).join(" \u00b7 ");',
    '    var thumb=item.thumbnail_b64?\'<div style="position:absolute;top:-1rem;right:-1rem;width:72px;height:72px;border-radius:50%;overflow:hidden;border:2px solid #D4AE2A"><img src="\'+item.thumbnail_b64+\'" style="width:100%;height:100%;object-fit:cover"></div>\':""',
    '    return \'<div class="card" style="\'+bg+\';align-items:center;justify-content:center;padding:4rem">\'',
    '      +\'<div style="max-width:800px;width:100%;text-align:center;position:relative">\'',
    '      +\'<div style="position:absolute;top:-2.5rem;left:50%;transform:translateX(-50%);color:#D4AE2A;font-size:1.2rem;opacity:0.6">&#10022; &#8213;&#8213;&#8213;&#8213;&#8213;&#8213; &#10022;</div>\'',
    '      +thumb',
    '      +\'<h1 style="font-size:clamp(1.8rem,3.5vw,2.8rem);color:#D4AE2A;font-weight:normal;letter-spacing:0.05em;margin-bottom:0.4rem">\'+item.contributor_name+\'</h1>\'',
    '      +(meta?\'<p style="font-size:clamp(0.9rem,1.8vw,1.2rem);opacity:0.65;font-style:italic;margin-bottom:2rem">\'+meta+\'</p>\':\'<div style="margin-bottom:2rem"></div>\')',
    '      +\'<div style="width:50px;height:1px;background:#D4AE2A;margin:0 auto 2rem;opacity:0.5"></div>\'',
    '      +\'<p style="font-size:clamp(1rem,2vw,1.5rem);line-height:1.85;color:#F5F3EE">\'+item.tribute_text+\'</p>\'',
    '      +\'<div style="position:absolute;bottom:-2.5rem;left:50%;transform:translateX(-50%);color:#D4AE2A;font-size:0.8rem;opacity:0.35">&#10022;</div>\'',
    '      +\'</div></div>\';',
    '  }',
    '  if(item.type==="photo"){',
    '    var cap=item.caption||"";var cred=item.uploaded_by_name||"";',
    '    var img=item.image_b64?\'<img src="\'+item.image_b64+\'" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px">\':"";',
    '    return \'<div class="card" style="background:#0D0820;flex-direction:column;align-items:center;justify-content:center">\'',
    '      +\'<div style="flex:1;width:100%;display:flex;align-items:center;justify-content:center;padding:3rem 3rem 1rem;min-height:0">\'+img+\'</div>\'',
    '      +((cap||cred)?\'<div style="padding:0.75rem 3rem 2rem;text-align:center">\'+(cap?\'<p style="font-size:clamp(0.95rem,1.7vw,1.25rem);font-style:italic;margin-bottom:0.3rem">\'+cap+\'</p>\':"")+(cred?\'<p style="font-size:clamp(0.8rem,1.3vw,0.95rem);color:#D4AE2A;opacity:0.8;font-family:sans-serif">\'+cred+\'</p>\':"")+\'</div>\':"")+"</div>";',
    '  }',
    '  if(item.type==="story"){',
    '    var sloc=[item.city,item.ip_country].filter(Boolean).join(", ");',
    '    var smeta=[item.relationship,sloc].filter(Boolean).join(" \u00b7 ");',
    '    var ph=item.photos||[];var pc2=ph.length;',
    '    var st=\'<div style="flex:1;display:flex;flex-direction:column;justify-content:center">\'',
    '      +\'<h2 style="font-size:clamp(1.3rem,2.5vw,2rem);color:#D4AE2A;font-weight:normal;margin-bottom:0.3rem">\'+item.contributor_name+\'</h2>\'',
    '      +(smeta?\'<p style="font-size:clamp(0.85rem,1.5vw,1rem);opacity:0.65;font-style:italic;margin-bottom:1.25rem">\'+smeta+\'</p>\':"")    ',
    '      +\'<div style="width:35px;height:1px;background:#D4AE2A;margin-bottom:1.25rem;opacity:0.5"></div>\'',
    '      +\'<p style="font-size:clamp(0.95rem,1.8vw,1.3rem);line-height:1.85;color:#F5F3EE">\'+item.tribute_text+\'</p></div>\';',
    '    if(pc2===0)return \'<div class="card" style="\'+bg+\';align-items:center;justify-content:center;padding:3.5rem 4rem"><div style="max-width:800px;width:100%">\'+st+\'</div></div>\';',
    '    var hs=ph[0].b64||"";',
    '    var strip=pc2===1?\'<img src="\'+hs+\'" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:4px">\'',
    '      :\'<div style="display:flex;flex-direction:column;gap:0.5rem;height:100%"><img src="\'+hs+\'" style="width:100%;flex:0 0 55%;object-fit:cover;border-radius:4px"><div style="display:flex;gap:0.5rem;flex:1">\'+ph.slice(1,3).map(function(p){return\'<img src="\'+( p.b64||"")+\'" style="flex:1;object-fit:cover;border-radius:4px;min-width:0">\';}).join("")+\'</div></div>\';',
    '    return \'<div class="card" style="\'+bg+\';align-items:center;justify-content:center;padding:3rem 3.5rem;gap:2.5rem"><div style="flex:1;max-width:50%">\'+st+\'</div><div style="flex:1;max-width:46%;display:flex;align-items:center">\'+strip+\'</div></div>\';',
    '  }',
    '  return \'<div class="card"></div>\';',
    '}',
    'function showCard(index){',
    '  if(index>=ITEMS.length)index=0;',
    '  currentIndex=index;',
    '  var lcN=BASE_CONFIG.lc_interstitial_every_n||10;',
    '  var qrN=BASE_CONFIG.qr_interstitial_every_n||15;',
    '  var item=ITEMS[index];',
    '  if(index>0&&index%lcN===0){item={type:"lc_brand"};currentIndex=index-1;}',
    '  else if(index>0&&index%qrN===0&&index%lcN!==0){item={type:"qr"};currentIndex=index-1;}',
    '  var display=document.getElementById("display");',
    '  if(cardEl){cardEl.classList.remove("active");(function(el){setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el);},650);})(cardEl);}',
    '  var wrapper=document.createElement("div");',
    '  wrapper.innerHTML=buildCardHTML(item);',
    '  cardEl=wrapper.firstElementChild;',
    '  display.appendChild(cardEl);',
    '  var counter=document.getElementById("card-counter");',
    '  if(counter)counter.textContent=(index+1)+" / "+ITEMS.length;',
    '  requestAnimationFrame(function(){requestAnimationFrame(function(){if(cardEl)cardEl.classList.add("active");});});',
    '  if(!isPaused){var dur=getCardDuration(item);cardTimer=setTimeout(function(){showCard(index+1);},dur);}',
    '}',
    'function togglePause(){isPaused=!isPaused;var btn=document.getElementById("pause-btn");if(isPaused){clearTimeout(cardTimer);if(btn)btn.innerHTML="&#9654; Resume";}else{if(btn)btn.innerHTML="&#9646;&#9646; Pause";showCard(currentIndex+1);}}',
    'function skipCard(){clearTimeout(cardTimer);showCard(currentIndex+1);}',
    'function restartDisplay(){clearTimeout(cardTimer);showCard(0);}',
    'function updateSlider(key,val){var map={"voice":"voice","photo":"photo","story":"story","story-photo":"storyPhoto","story-photos":"storyPhotos"};var dk=map[key];if(dk)durations[dk]=parseInt(val);var sv=document.getElementById("sv-"+key);if(sv)sv.textContent=val+"s";}',
    'function toggleOperator(){operatorOpen?closeOperator():openOperator();}',
    'function openOperator(){operatorOpen=true;clearTimeout(cardTimer);document.getElementById("operator-overlay").classList.add("visible");highlightTempo(currentTempo);}',
    'function closeOperator(){operatorOpen=false;document.getElementById("operator-overlay").classList.remove("visible");if(!isPaused){var dur=getCardDuration(ITEMS[currentIndex]||{type:"voice"});cardTimer=setTimeout(function(){showCard(currentIndex+1);},dur);}}',
    'function highlightTempo(preset){["gentle","standard","energetic"].forEach(function(t){var btn=document.getElementById("tempo-"+t);if(btn)btn.style.background=t===preset?"rgba(212,174,42,0.4)":"rgba(212,174,42,0.15)";});}',
    'function setTempo(preset){currentTempo=preset;highlightTempo(preset);}',
  ].join('\n')
}