// ============================================================
// FILE PATH: components/manage/display/VideoReelZipExport.tsx
// PURPOSE:   Client-side zip export for Video Reel (Output A).
//            Downloads all reel videos directly from Supabase,
//            packages them with a self-contained player HTML
//            into a downloadable zip. No file data touches
//            Vercel — bypasses the 4.5MB payload limit.
//            Flow:
//              1. Fetch signed URLs from /api/display/reel/export-urls
//              2. Download each video directly from Supabase
//              3. Build self-contained player index.html
//              4. Package as zip using JSZip
//              5. Trigger browser download
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.33
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState } from 'react'
import JSZip from 'jszip'

// ═══ SECTION 2 — Types ═══

interface ReelExportItem {
  sort_order: number
  display_title: string | null
  attribution: string | null
  filename: string
  original_filename: string
  mime_type: string
  duration_seconds: number | null
  signed_url: string | null
}

interface VideoReelZipExportProps {
  capsuleSlug: string
  honoureeName: string
  eventType: string
}

// ═══ SECTION 3 — Player HTML Generator ═══
// Generates index.html inside the zip.
// Videos referenced as ./videos/filename.mp4 (relative paths).
// Self-contained — no internet needed to play.

function generatePlayerHTML(params: {
  honoureeName: string
  eventType: string
  items: ReelExportItem[]
}): string {
  const { honoureeName, eventType, items } = params

  const taglines: Record<string, string> = {
    memorial:    'A tribute to a life beautifully lived',
    retirement:  'Celebrating a remarkable career',
    birthday:    'Voices of love and celebration',
    wedding:     'Blessings for the journey ahead',
    anniversary: 'Celebrating a love that endures',
    graduation:  'Voices of pride and encouragement',
    chieftaincy: 'Words of honour and recognition',
    ordination:  'Messages of faith and blessing',
    thanksgiving:'Voices of gratitude and joy',
    award:       'Words of recognition and pride',
  }
  const tagline = taglines[eventType] || 'Voices gathered with love'

  const closingLines: Record<string, string> = {
    memorial:    'Forever remembered. Forever loved.',
    retirement:  'A legacy of excellence, well earned.',
    birthday:    'May this day be the beginning of more beautiful years.',
    wedding:     'Wishing you a lifetime of love and joy.',
    anniversary: 'Here is to the years ahead.',
    graduation:  'The world is ready for what you bring to it.',
    chieftaincy: 'May this honour mark a new chapter of service.',
    ordination:  'May your path be one of purpose and peace.',
    thanksgiving:'Every voice here is a gift of gratitude.',
    award:       'Recognition well deserved.',
  }
  const closingLine = closingLines[eventType] || 'Every voice here was gathered with love.'

  const videoCount = items.length
  const videoListJS = items
    .map(i => JSON.stringify('./videos/' + i.filename))
    .join(',\n    ')

  const attrsJS = items
    .map(i => JSON.stringify({ title: i.display_title, name: i.attribution }))
    .join(',\n    ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${honoureeName} \u2014 LegacyCapsule Video Reel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0D0820;overflow:hidden;
  font-family:Georgia,"Times New Roman",serif;color:#F5F3EE}
.slide{position:fixed;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:1.5rem;
  opacity:0;transition:opacity 0.7s ease;pointer-events:none}
.slide.active{opacity:1;pointer-events:auto}
#video-slide{background:#000}
video{width:100%;height:100%;object-fit:contain}
#lc-footer{position:fixed;bottom:0;left:0;right:0;height:42px;z-index:50;
  background:rgba(13,8,32,0.92);backdrop-filter:blur(8px);
  border-top:1px solid rgba(212,174,42,0.2);
  display:none;align-items:center;justify-content:space-between;padding:0 1.5rem}
#ctrl{position:fixed;bottom:42px;left:0;right:0;height:58px;z-index:60;
  background:rgba(13,8,32,0.88);backdrop-filter:blur(8px);
  border-top:1px solid rgba(212,174,42,0.15);
  display:none;align-items:center;justify-content:center;gap:1.25rem;
  transition:opacity 0.4s ease}
#ctrl.hidden{opacity:0;pointer-events:none}
.btn{background:rgba(212,174,42,0.15);color:#D4AE2A;
  border:1px solid rgba(212,174,42,0.4);padding:0.45rem 1.1rem;
  font-size:0.85rem;font-family:inherit;cursor:pointer;border-radius:4px}
#attribution{position:fixed;bottom:108px;left:2rem;z-index:55;
  opacity:0;transition:opacity 0.8s ease;pointer-events:none}
#attribution.show{opacity:1}
.attr-inner{background:rgba(13,8,32,0.82);border-left:3px solid #D4AE2A;
  padding:0.5rem 0.875rem;backdrop-filter:blur(4px)}
#watermark{position:fixed;bottom:108px;left:1.5rem;z-index:45;
  color:#D4AE2A;font-size:clamp(0.7rem,1.2vw,0.9rem);
  font-style:italic;opacity:0.2;pointer-events:none;display:none}
.gold{color:#D4AE2A}
.ornament{color:#D4AE2A;letter-spacing:0.5rem}
.start-btn{background:#D4AE2A;color:#0D0820;border:none;
  padding:1rem 3rem;font-size:1.1rem;cursor:pointer;border-radius:4px;
  font-family:Georgia,serif;letter-spacing:0.05em;font-weight:bold;margin-top:1rem}
</style>
</head>
<body>

<!-- ── Opening slide ── -->
<div class="slide active" id="opening-slide">
  <div class="ornament" style="font-size:1.5rem">&#10022; &#8213;&#8213;&#8213; &#10022; &#8213;&#8213;&#8213; &#10022;</div>
  <p style="font-size:clamp(0.9rem,1.6vw,1.2rem);letter-spacing:0.25em;color:#D4AE2A;text-transform:uppercase">LegacyCapsule</p>
  <h1 style="font-size:clamp(2.5rem,5vw,4.5rem);font-weight:normal;text-align:center;max-width:80vw;line-height:1.2">${honoureeName}</h1>
  <p style="font-size:clamp(1rem,1.8vw,1.4rem);color:#D4AE2A;font-style:italic">${tagline}</p>
  <p style="font-size:0.85rem;opacity:0.45;font-family:sans-serif">${videoCount} tribute video${videoCount !== 1 ? 's' : ''}</p>
  <button class="start-btn" onclick="startReel()">&#9654; Start Reel</button>
  <p style="font-size:0.7rem;opacity:0.3;font-family:sans-serif;margin-top:0.5rem">Press F11 for fullscreen</p>
  <p style="position:absolute;bottom:1.5rem;font-size:0.65rem;opacity:0.2;font-family:sans-serif">
    itslegacycapsule.com &#183; VALNEX, UNIPESSOAL LDA &#183; RevoWorldTech
  </p>
</div>

<!-- ── Video slide ── -->
<div class="slide" id="video-slide">
  <video id="vid" preload="auto" playsinline></video>
</div>

<!-- ── Skip/error card ── -->
<div class="slide" id="skip-slide">
  <div class="ornament" style="font-size:1rem;opacity:0.4">&#10022;</div>
  <p style="font-size:1.2rem;font-style:italic;opacity:0.6">This tribute could not be loaded</p>
</div>

<!-- ── Closing slide ── -->
<div class="slide" id="closing-slide">
  <p style="font-size:clamp(1.2rem,2.2vw,1.8rem);color:#D4AE2A;font-style:italic;max-width:70vw;text-align:center">${closingLine}</p>
  <div class="ornament" style="font-size:1rem;opacity:0.4">&#10022; &#8213;&#8213;&#8213; &#10022;</div>
  <h2 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:normal">${honoureeName}</h2>
  <p style="font-size:0.9rem;opacity:0.4;font-family:sans-serif;margin-top:0.5rem">
    This record was preserved by LegacyCapsule
  </p>
  <button class="btn" style="margin-top:1.5rem" onclick="restartReel()">&#8635; Replay Reel</button>
  <p style="position:absolute;bottom:1.5rem;font-size:0.65rem;opacity:0.2;font-family:sans-serif">
    LegacyCapsule &#183; itslegacycapsule.com &#183; VALNEX, UNIPESSOAL LDA &#183; RevoWorldTech
  </p>
</div>

<!-- ── Attribution lower-third ── -->
<div id="attribution"><div class="attr-inner" id="attr-inner"></div></div>

<!-- ── Honouree name watermark ── -->
<div id="watermark">${honoureeName}</div>

<!-- ── LC footer ── -->
<div id="lc-footer">
  <span style="font-size:0.65rem;color:#D4AE2A;letter-spacing:0.18em;opacity:0.7;font-family:Georgia,serif">
    LegacyCapsule &#183; itslegacycapsule.com
  </span>
  <span id="counter" style="font-size:0.65rem;color:#D4AE2A;opacity:0.6;font-family:sans-serif"></span>
</div>

<!-- ── Control bar ── -->
<div id="ctrl">
  <button class="btn" onclick="togglePause()" id="pause-btn">&#9646;&#9646; Pause</button>
  <button class="btn" onclick="skipVideo()">&#9197; Skip</button>
  <button class="btn" onclick="restartReel()" style="opacity:0.65">&#8635; Restart</button>
</div>

<script>
var VIDEOS = [
    ${videoListJS}
];
var ATTRS = [
    ${attrsJS}
];

var idx = 0, paused = false, ctrlTimer = null, attrTimer = null;
var vid = document.getElementById('vid');

// ── Controls auto-hide ──
document.addEventListener('mousemove', resetCtrl);
document.addEventListener('keydown', function(e) {
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
  if (e.key === 'ArrowRight') skipVideo();
  resetCtrl();
});

function resetCtrl() {
  var c = document.getElementById('ctrl');
  if (c) c.classList.remove('hidden');
  clearTimeout(ctrlTimer);
  ctrlTimer = setTimeout(function() {
    var b = document.getElementById('ctrl');
    if (b) b.classList.add('hidden');
  }, 3000);
}

// ── Show/hide slides ──
function showSlide(id) {
  ['opening-slide', 'video-slide', 'skip-slide', 'closing-slide'].forEach(function(s) {
    var el = document.getElementById(s);
    if (el) el.classList.remove('active');
  });
  var t = document.getElementById(id);
  if (t) t.classList.add('active');
}

// ── Start reel ──
function startReel() {
  document.getElementById('lc-footer').style.display = 'flex';
  document.getElementById('ctrl').style.display = 'flex';
  document.getElementById('watermark').style.display = 'block';
  resetCtrl();
  playAt(0);
}

// ── Play video at index ──
function playAt(i) {
  if (i >= VIDEOS.length) {
    showSlide('closing-slide');
    return;
  }
  idx = i;
  var ctr = document.getElementById('counter');
  if (ctr) ctr.textContent = (i + 1) + ' of ' + VIDEOS.length;

  vid.src = VIDEOS[i];
  vid.onended = function() { playAt(i + 1); };
  vid.onerror = function() { showSkip(i); };

  showSlide('video-slide');
  vid.play().catch(function() { showSkip(i); });

  // Pre-load next video
  if (i + 1 < VIDEOS.length) {
    var pre = document.createElement('video');
    pre.preload = 'auto';
    pre.src = VIDEOS[i + 1];
  }

  // Attribution lower-third
  showAttribution(ATTRS[i]);
}

// ── Attribution lower-third — fades in 4s then out ──
function showAttribution(attr) {
  clearTimeout(attrTimer);
  var el = document.getElementById('attribution');
  var inner = document.getElementById('attr-inner');
  if (!attr || (!attr.title && !attr.name)) {
    if (el) el.classList.remove('show');
    return;
  }
  var html = '';
  if (attr.title) html += '<p style="color:#F5F3EE;font-family:Georgia,serif;font-size:clamp(0.9rem,1.5vw,1.1rem);margin:0">' + attr.title + '</p>';
  if (attr.name) html += '<p style="color:#D4AE2A;font-family:sans-serif;font-size:clamp(0.75rem,1.2vw,0.9rem);margin:' + (attr.title ? '0.1rem' : '0') + ' 0 0;opacity:0.85">' + attr.name + '</p>';
  if (inner) inner.innerHTML = html;
  if (el) el.classList.add('show');
  attrTimer = setTimeout(function() {
    if (el) el.classList.remove('show');
  }, 4000);
}

// ── Skip/error ──
function showSkip(i) {
  showSlide('skip-slide');
  setTimeout(function() { playAt(i + 1); }, 2000);
}

// ── Operator controls ──
function togglePause() {
  paused = !paused;
  var btn = document.getElementById('pause-btn');
  if (paused) {
    vid.pause();
    if (btn) btn.innerHTML = '&#9654; Resume';
  } else {
    vid.play().catch(function() {});
    if (btn) btn.innerHTML = '&#9646;&#9646; Pause';
  }
}

function skipVideo() {
  vid.pause();
  playAt(idx + 1);
}

function restartReel() {
  vid.pause();
  playAt(0);
}
</script>
</body>
</html>`
}

// ═══ SECTION 4 — Component ═══

export default function VideoReelZipExport({
  capsuleSlug,
  honoureeName,
  eventType,
}: VideoReelZipExportProps) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'downloading' | 'packaging' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<string | null>(null)
  const [downloadedCount, setDownloadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ═══ SECTION 5 — Export Handler ═══

  async function handleExport() {
    setStatus('fetching')
    setProgress('Fetching reel…')
    setErrorMsg(null)
    setDownloadedCount(0)
    setTotalCount(0)

    try {
      // ── Step 1: Get signed URLs from server ──
      const res = await fetch(`/api/display/reel/export-urls?slug=${capsuleSlug}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch reel.')
      }
      const { reel_title, items } = await res.json() as {
        reel_title: string | null
        items: ReelExportItem[]
      }

      if (!items || items.length === 0) {
        throw new Error('No videos in reel. Please add and save videos first.')
      }

      const validItems = items.filter(i => i.signed_url)
      if (validItems.length === 0) {
        throw new Error('No video URLs available. Please try again.')
      }

      setTotalCount(validItems.length)
      setStatus('downloading')

      // ── Step 2: Download all videos directly from Supabase ──
      const zip = new JSZip()
      const videosFolder = zip.folder('videos')!
      const downloadedItems: ReelExportItem[] = []

      // Download in batches of 3 to avoid overwhelming the browser
      const BATCH = 3
      for (let i = 0; i < validItems.length; i += BATCH) {
        const batch = validItems.slice(i, i + BATCH)
        setProgress(
          'Downloading ' + (i + 1) + '–' + Math.min(i + BATCH, validItems.length)
          + ' of ' + validItems.length + '…'
        )

        await Promise.all(batch.map(async (item) => {
          try {
            const videoRes = await fetch(item.signed_url!)
            if (!videoRes.ok) throw new Error('Download failed: HTTP ' + videoRes.status)
            const blob = await videoRes.blob()
            videosFolder.file(item.filename, blob)
            downloadedItems.push(item)
            setDownloadedCount(prev => prev + 1)
          } catch (err) {
            console.warn('[VideoReelZipExport] Failed to download:', item.filename, err)
            // Non-fatal — continue with remaining videos
          }
        }))
      }

      if (downloadedItems.length === 0) {
        throw new Error('No videos could be downloaded. Please check your connection and try again.')
      }

      // ── Step 3: Build player HTML with relative ./videos/ paths ──
      setStatus('packaging')
      setProgress('Building player…')

      const playerHTML = generatePlayerHTML({
        honoureeName,
        eventType,
        items: downloadedItems,
      })

      zip.file('index.html', playerHTML)

      // Add README
      zip.file('README.txt', [
        'LegacyCapsule Video Reel — ' + honoureeName,
        '='.repeat(50),
        '',
        'HOW TO PLAY:',
        '1. Extract this zip file (keep ALL files together)',
        '2. Open index.html in Google Chrome or Microsoft Edge',
        '3. Press F11 for fullscreen',
        '4. Click "Start Reel" when ready',
        '',
        'CONTROLS:',
        '- Space bar: Pause / Resume',
        '- Arrow Right: Skip to next video',
        '- Move mouse: Show control bar',
        '',
        'IMPORTANT:',
        '- Do NOT move or rename the /videos/ folder',
        '- Keep index.html and /videos/ in the same folder',
        '- Use Chrome or Edge for best compatibility',
        '- Videos must stay extracted — do not play from inside the zip',
        '',
        reel_title ? ('Reel title: ' + reel_title) : '',
        'Videos included: ' + downloadedItems.length,
        '',
        'Generated by LegacyCapsule — itslegacycapsule.com',
        'VALNEX, UNIPESSOAL LDA | RevoWorldTech',
      ].filter(Boolean).join('\n'))

      // ── Step 4: Generate zip and trigger download ──
      setProgress('Compressing…')
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 1 }, // Fast — videos already compressed
      })

      const safeName = honoureeName
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()
        .slice(0, 40)

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'LegacyCapsule-' + safeName + '-VideoReel.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('done')
      setProgress(null)

    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Export failed.')
      setProgress(null)
    }
  }

  // ═══ SECTION 6 — Render ═══

  const isWorking = ['fetching', 'downloading', 'packaging'].includes(status)

  return (
    <div style={{ maxWidth: '520px' }}>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Downloads all reel videos and a self-contained branded player as a zip file.
        Extract the zip and open <strong>index.html</strong> in Chrome — no internet needed.
      </p>

      {/* Progress bar */}
      {isWorking && totalCount > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '0.3rem' }}>
            <div style={{
              background: '#D4AE2A',
              height: '100%',
              width: totalCount > 0 ? (downloadedCount / totalCount * 100) + '%' : '5%',
              transition: 'width 0.3s ease',
              borderRadius: '4px',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {downloadedCount} of {totalCount} videos downloaded
          </p>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isWorking}
        style={{
          background: isWorking ? 'rgba(13,8,32,0.5)' : '#0D0820',
          color: '#D4AE2A',
          border: 'none',
          padding: '0.85rem 2rem',
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          cursor: isWorking ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: isWorking ? 0.75 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isWorking
          ? '⟳ ' + (progress || 'Working…')
          : '⬇ Download Video Reel (Zip)'
        }
      </button>

      {/* Error */}
      {status === 'error' && errorMsg && (
        <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0.75rem 0 0' }}>
          {errorMsg}
        </p>
      )}

      {/* Success */}
      {status === 'done' && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginTop: '1rem',
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem' }}>
            ✓ Zip downloaded successfully
          </p>
          <ol style={{ fontSize: '0.825rem', color: '#166534', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Extract the zip — keep all files in the same folder</li>
            <li>Open <strong>index.html</strong> in Chrome or Edge</li>
            <li>Press <kbd style={{ background: '#dcfce7', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>F11</kbd> for fullscreen</li>
            <li>Click <strong>Start Reel</strong> when ready</li>
          </ol>
          <p style={{ fontSize: '0.775rem', color: '#16a34a', margin: '0.75rem 0 0', opacity: 0.8 }}>
            Re-export any time if you add or change videos in the reel.
          </p>
        </div>
      )}
    </div>
  )
}
