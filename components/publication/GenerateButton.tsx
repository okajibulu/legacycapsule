'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — GenerateButton.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * The PDF generation trigger component for the Publication Editor.
 *
 * Sits in the right panel of the editor (below the section navigator).
 * Manages the full generation lifecycle and reflects it clearly
 * to the organiser at every stage.
 *
 * State machine:
 *   idle      → organiser has not generated yet (or previous gen failed)
 *   polling   → POST sent to /api/publication/generate, waiting for response
 *               (Puppeteer runs server-side; this is a long-running request)
 *   complete  → PDF ready, download link shown
 *   failed    → generation error, message shown, retry available
 *
 * Important: /api/publication/generate is a long-running route (up to 60–300s
 * on Vercel depending on plan). The fetch call is kept open for the duration.
 * A timeout guard client-side prevents the UI hanging indefinitely if the
 * server times out silently.
 *
 * Props:
 *   capsuleId        — UUID of the capsule to generate for
 *   hasUnsavedChanges — if true, warn organiser before generating
 *   existingPdfUrl   — signed URL of last successful generation (if any)
 *   existingVersion  — version number of last successful generation (if any)
 *   onGenerateStart  — optional callback when generation begins
 *   onGenerateComplete — optional callback with { pdfUrl, pageMap }
 *
 * Parent (PublicationEditor.tsx) should:
 *   1. Pass hasUnsavedChanges so organiser is warned before losing editor state
 *   2. Use onGenerateComplete to update the local layout_config.page_map
 *      so tribute page numbers appear in the editor immediately after generation
 */

import { useState, useRef, useCallback } from 'react';
import type { GenerationStatus } from '@/lib/publication/types';


// ============================================================
// SECTION 1 — Types and constants
// ============================================================

interface GenerateButtonProps {
  capsuleId: string;
  hasUnsavedChanges?: boolean;
  existingPdfUrl?: string | null;
  existingVersion?: number | null;
  onGenerateStart?: () => void;
  onGenerateComplete?: (result: { pdfUrl: string; pageMap: Record<string, number> }) => void;
}

/**
 * Client-side generation timeout in milliseconds.
 * Set slightly above Vercel's maxDuration to catch silent server timeouts
 * before the fetch promise resolves. Matches Vercel Pro limit (300s) with buffer.
 * On Hobby plan, reduce this to 65_000.
 */
const CLIENT_TIMEOUT_MS = 310_000;

/** Copy for each UI state. Keeps render logic clean. */
const STATE_COPY = {
  idle: {
    buttonLabel:   'Generate Publication PDF',
    buttonSubline: 'Creates a print-ready A4 PDF from your current layout',
  },
  polling: {
    buttonLabel:   'Generating PDF…',
    buttonSubline: 'This takes 30–90 seconds. Do not close this tab.',
  },
  complete: {
    buttonLabel:   'Regenerate PDF',
    buttonSubline: 'Overwrites the previous version',
  },
  failed: {
    buttonLabel:   'Retry Generation',
    buttonSubline: 'Previous attempt failed — see error below',
  },
} as const;


// ============================================================
// SECTION 2 — Component
// ============================================================

export default function GenerateButton({
  capsuleId,
  hasUnsavedChanges   = false,
  existingPdfUrl      = null,
  existingVersion     = null,
  onGenerateStart,
  onGenerateComplete,
}: GenerateButtonProps) {

  // ── 2.1  State ─────────────────────────────────────────────

  /**
   * Tracks what UI to show. Separate from server-side generation_status —
   * this is purely client-side UI state for this browser session.
   * On page load, derived from existingPdfUrl prop:
   *   - existingPdfUrl present → show 'complete' (previous PDF available)
   *   - no existingPdfUrl      → show 'idle' (never generated)
   */
  const [uiStatus, setUiStatus] = useState<GenerationStatus>(
    existingPdfUrl ? 'complete' : 'idle'
  );

  const [pdfUrl,   setPdfUrl]   = useState<string | null>(existingPdfUrl);
  const [version,  setVersion]  = useState<number | null>(existingVersion);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Elapsed time counter — shown during polling so the organiser
   * knows generation is still running and the page hasn't frozen.
   */
  const [elapsedSecs, setElapsedSecs] = useState(0);

  /**
   * Confirmation guard for regeneration:
   * When a PDF already exists, a first click on "Regenerate" sets
   * this to true and shows a confirmation prompt. The second click
   * actually runs generation. Resets if organiser clicks away.
   */
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Interval ref for the elapsed time counter — cleared on completion
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null);


  // ── 2.2  Timer helpers ─────────────────────────────────────

  const startTimer = useCallback(() => {
    setElapsedSecs(0);
    timerRef.current = setInterval(() => {
      setElapsedSecs(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current)   { clearInterval(timerRef.current);  timerRef.current   = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);


  // ── 2.3  Core generation function ─────────────────────────

  const runGeneration = useCallback(async () => {
    // Save unsaved changes warning — parent handles autosave, but prompt regardless
    if (hasUnsavedChanges) {
      const proceed = window.confirm(
        'You have unsaved layout changes. The PDF will be generated from your last saved version.\n\nProceed?'
      );
      if (!proceed) return;
    }

    setUiStatus('rendering');
    setErrorMsg(null);
    setConfirmRegen(false);
    onGenerateStart?.();
    startTimer();

    // Client-side timeout guard — if the fetch hangs beyond CLIENT_TIMEOUT_MS,
    // treat it as a failure. Prevents the UI from appearing frozen.
    const abortController = new AbortController();
    timeoutRef.current = setTimeout(() => {
      abortController.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch('/api/publication/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId }),
        signal:  abortController.signal,
      });

      stopTimer();

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg  = data.error ?? `Server responded with ${res.status}`;

        // 409 Conflict — another session is already generating
        if (res.status === 409) {
          setErrorMsg('PDF generation is already in progress in another session. Refresh this page to check the result.');
        } else {
          setErrorMsg(msg);
        }

        setUiStatus('failed');
        return;
      }

      const data = await res.json();

      if (data.pdf_url) {
        setPdfUrl(data.pdf_url);
        setVersion(prev => (prev ?? 0) + 1);
        setUiStatus('complete');
        onGenerateComplete?.({ pdfUrl: data.pdf_url, pageMap: data.page_map ?? {} });
      } else {
        setErrorMsg('Generation completed but no PDF URL was returned. Contact support if this persists.');
        setUiStatus('failed');
      }

    } catch (err) {
      stopTimer();

      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMsg(
          'Generation timed out on the client side. ' +
          'The PDF may still be generating — refresh this page in a few minutes to check.'
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Unexpected error during generation.';
        setErrorMsg(msg);
      }

      setUiStatus('failed');
    }
  }, [capsuleId, hasUnsavedChanges, onGenerateStart, onGenerateComplete, startTimer, stopTimer]);


  // ── 2.4  Button click handler ──────────────────────────────

  const handleButtonClick = useCallback(() => {
    // If a PDF already exists and confirmation not yet given, show confirm prompt
    if (uiStatus === 'complete' && !confirmRegen) {
      setConfirmRegen(true);
      return;
    }
    // Reset confirm flag and proceed
    setConfirmRegen(false);
    runGeneration();
  }, [uiStatus, confirmRegen, runGeneration]);

  const handleCancelRegen = useCallback(() => {
    setConfirmRegen(false);
  }, []);

  const isPolling = uiStatus === 'rendering' || uiStatus === 'queued';


  // ── 2.5  Elapsed time formatting ──────────────────────────

  function formatElapsed(secs: number): string {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }


  // ── 2.6  Render ────────────────────────────────────────────

  const copy = STATE_COPY[
    isPolling     ? 'polling'  :
    uiStatus === 'complete' ? 'complete' :
    uiStatus === 'failed'   ? 'failed'   :
    'idle'
  ];

  return (
    <div className="flex flex-col gap-3">

      {/* ── Regeneration confirmation prompt ────────────────── */}
      {confirmRegen && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3"
        >
          <p className="text-xs text-yellow-200 mb-2 leading-relaxed">
            This will overwrite the existing PDF (v{version ?? 1}).
            The previous download link will stop working.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleButtonClick}
              className="
                flex-1 py-1.5 rounded-lg text-xs font-bold
                bg-yellow-400 text-purple-950
                hover:bg-yellow-300 transition-colors
              "
            >
              Yes, regenerate
            </button>
            <button
              onClick={handleCancelRegen}
              className="
                flex-1 py-1.5 rounded-lg text-xs
                border border-white/10 text-white/50
                hover:text-white/80 hover:border-white/20 transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Main generate / regenerate button ───────────────── */}
      {!confirmRegen && (
        <button
          onClick={handleButtonClick}
          disabled={isPolling}
          aria-busy={isPolling}
          aria-label={isPolling ? 'Generating PDF, please wait' : copy.buttonLabel}
          className={`
            relative w-full py-3.5 px-4 rounded-xl
            font-bold text-sm
            transition-all duration-200
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400
            ${isPolling
              ? 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-300/60 cursor-not-allowed'
              : 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-purple-950 border border-yellow-300/60 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:from-yellow-300 hover:to-yellow-400 hover:shadow-[0_0_28px_rgba(234,179,8,0.5)] active:scale-[0.98]'
            }
          `}
        >
          {/* ── Polling animation ───────────────────────────── */}
          {isPolling && (
            <span
              aria-hidden="true"
              className="
                absolute left-3 top-1/2 -translate-y-1/2
                w-4 h-4 rounded-full border-2 border-yellow-300/30
                border-t-yellow-300 animate-spin
              "
            />
          )}

          <span className={isPolling ? 'pl-6' : ''}>
            {copy.buttonLabel}
          </span>
        </button>
      )}

      {/* ── Subline copy ────────────────────────────────────── */}
      {!confirmRegen && (
        <p className="text-[10px] text-white/30 text-center leading-relaxed px-1">
          {copy.buttonSubline}
        </p>
      )}

      {/* ── Elapsed time counter (polling only) ─────────────── */}
      {isPolling && (
        <div
          role="status"
          aria-live="polite"
          aria-label={`Generation in progress, ${formatElapsed(elapsedSecs)} elapsed`}
          className="flex items-center justify-center gap-2"
        >
          <div className="flex gap-0.5" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-yellow-400/50 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-[10px] text-yellow-400/50 tabular-nums">
            {formatElapsed(elapsedSecs)}
          </span>
        </div>
      )}

      {/* ── Download link (complete state) ──────────────────── */}
      {uiStatus === 'complete' && pdfUrl && !confirmRegen && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Download Publication PDF version ${version ?? 1}`}
          className="
            flex items-center justify-between gap-2
            w-full py-2.5 px-4 rounded-xl
            bg-green-500/10 border border-green-400/20
            text-green-300 text-xs font-medium
            hover:bg-green-500/20 hover:border-green-400/30
            transition-all duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-400
          "
        >
          <span className="flex items-center gap-2">
            {/* Checkmark icon */}
            <svg
              aria-hidden="true"
              width="14" height="14" viewBox="0 0 14 14"
              fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download Publication PDF
          </span>
          <span className="text-green-400/50 text-[10px]">
            v{version ?? 1}
          </span>
        </a>
      )}

      {/* ── Error message (failed state) ────────────────────── */}
      {uiStatus === 'failed' && errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-500/5 p-3"
        >
          <p className="text-[11px] text-red-300/80 leading-relaxed">
            {errorMsg}
          </p>
          {errorMsg.includes('timed out') && (
            <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">
              Refresh this page in 2–3 minutes — the PDF may still be processing.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
