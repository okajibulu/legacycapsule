'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — components/honouree/PortalShell.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Main client shell for the honouree portal.
 *
 * Receives all data from the server page component.
 * Manages which panel is active via local state.
 * Renders each panel component on demand.
 *
 * Sections:
 *   overview · tributes · ways_to_honour · appreciation
 *   correspondence · broadcast · anniversary · template
 *
 * OTP upgrade prompt:
 *   Shown inside the portal when session_type is 'link'.
 *   Family rep can request OTP login to get a persistent session.
 */

import { useState, useCallback } from 'react';
import { getEventTypeLabel, getEventTypeEmoji } from '@/lib/eventLabels';
import {
  TributesPanel,
  WaysToHonourPanel,
  AppreciationPanel,
  CorrespondenceLog,
  BroadcastPanel,
  AnniversaryPanel,
  ThankYouTemplatePanel,
} from './PortalPanels';


// ============================================================
// SECTION 1 — Types
// ============================================================

type PortalSection =
  | 'overview'
  | 'tributes'
  | 'ways_to_honour'
  | 'appreciation'
  | 'correspondence'
  | 'broadcast'
  | 'anniversary'
  | 'template';

interface OverviewData {
  tributeCount:   number;
  countryCount:   number;
  countries:      string[];
  ackCount:       number;
  reachableCount: number;
}

interface PortalShellProps {
  capsuleId:      string;
  slug:           string;
  honoureeName:   string;
  familyRepName:  string | null;
  familyRepEmail: string | null;
  eventType:      string;
  eventTag:       string | null;
  sessionType:    'link' | 'otp';
  overview:       OverviewData;
}

const NAV_ITEMS: { id: PortalSection; label: string; icon: string }[] = [
  { id: 'overview',       label: 'Overview',         icon: '◎' },
  { id: 'tributes',       label: 'Tributes',          icon: '❝' },
  { id: 'ways_to_honour', label: 'Ways to Honour',   icon: '◇' },
  { id: 'appreciation',   label: 'Appreciations',    icon: '✉' },
  { id: 'correspondence', label: 'Correspondence',   icon: '◈' },
  { id: 'broadcast',      label: 'Broadcast',        icon: '◉' },
  { id: 'anniversary',    label: 'Anniversary Note', icon: '✦' },
  { id: 'template',       label: 'Email Template',   icon: '▦' },
];


// ============================================================
// SECTION 2 — OTP upgrade prompt (shown on link sessions)
// ============================================================

function OtpUpgradePrompt({ slug }: { slug: string }) {
  const [requested, setRequested] = useState(false);
  const [otp,       setOtp]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [verified,  setVerified]  = useState(false);

  const handleRequest = async () => {
    setLoading(true); setError(null);
    const res = await fetch('/api/honouree/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_otp', slug }),
    });
    setLoading(false);
    if (res.ok) { setRequested(true); }
    else { const d = await res.json(); setError(d.error ?? 'Failed to send code.'); }
  };

  const handleVerify = async () => {
    setLoading(true); setError(null);
    const res = await fetch('/api/honouree/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_otp', slug, otp }),
    });
    setLoading(false);
    if (res.ok) { setVerified(true); window.location.reload(); }
    else { const d = await res.json(); setError(d.error ?? 'Incorrect code.'); }
  };

  if (verified) return null;

  return (
    <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 mb-6">
      <p className="text-xs text-yellow-300/80 font-medium mb-1">
        Stay signed in without the link
      </p>
      <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
        Set up persistent access — return to this portal any time
        without needing the email link.
      </p>
      {!requested ? (
        <button
          onClick={handleRequest}
          disabled={loading}
          className="
            text-xs px-4 py-2 rounded-lg
            bg-yellow-400/10 border border-yellow-400/20
            text-yellow-300 hover:bg-yellow-400/20 transition-colors
          "
        >
          {loading ? 'Sending…' : 'Send me an access code'}
        </button>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            className="
              w-32 px-3 py-2 rounded-lg text-sm
              bg-white/10 border border-white/20
              text-white placeholder:text-white/30
              focus:outline-none focus:border-yellow-400/50
            "
          />
          <button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="
              text-xs px-4 py-2 rounded-lg
              bg-yellow-400/10 border border-yellow-400/20
              text-yellow-300 hover:bg-yellow-400/20 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {loading ? 'Verifying…' : 'Confirm'}
          </button>
        </div>
      )}
      {error && (
        <p className="text-[11px] text-red-400/70 mt-2">{error}</p>
      )}
    </div>
  );
}


// ============================================================
// SECTION 3 — Overview panel
// ============================================================

function OverviewPanel({
  overview,
  honoureeName,
  reachableCount,
  slug,
  onNavigate,
}: {
  overview:       OverviewData;
  honoureeName:   string;
  reachableCount: number;
  slug:           string;
  onNavigate:     (section: PortalSection) => void;
}) {
  const stats = [
    { label: 'Tributes received',    value: overview.tributeCount,   section: 'tributes'       as PortalSection },
    { label: 'Countries represented', value: overview.countryCount,  section: null },
    { label: 'Gifts acknowledged',   value: overview.ackCount,        section: 'ways_to_honour' as PortalSection },
    { label: 'Can receive email',    value: reachableCount,           section: 'appreciation'   as PortalSection },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Welcome to your portal
        </h2>
        <p className="text-white/40 text-sm">
          Everything collected for {honoureeName}, in one private space.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => (
          <button
            key={stat.label}
            type="button"
            onClick={() => stat.section && onNavigate(stat.section)}
            className={`
              text-left rounded-xl border border-white/10
              bg-white/[0.03] p-4
              ${stat.section ? 'hover:border-yellow-400/20 hover:bg-yellow-400/5 transition-all cursor-pointer' : 'cursor-default'}
            `}
          >
            <p className="text-2xl font-bold text-yellow-400 mb-1">
              {stat.value}
            </p>
            <p className="text-[11px] text-white/40 leading-tight">
              {stat.label}
            </p>
          </button>
        ))}
      </div>

      {/* Countries list */}
      {overview.countries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] text-yellow-400/50 uppercase tracking-wider mb-3">
            Countries represented
          </p>
          <div className="flex flex-wrap gap-2">
            {overview.countries.map(country => (
              <span
                key={country}
                className="
                  text-[11px] px-2.5 py-1 rounded-full
                  bg-white/5 border border-white/10
                  text-white/50
                "
              >
                {country}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wider">Quick actions</p>
        {[
          { label: 'Read all tributes',           section: 'tributes'       as PortalSection },
          { label: 'Send appreciation emails',    section: 'appreciation'   as PortalSection },
          { label: 'Manage gifting details',      section: 'ways_to_honour' as PortalSection },
          { label: 'Write anniversary note',      section: 'anniversary'    as PortalSection },
        ].map(link => (
          <button
            key={link.label}
            type="button"
            onClick={() => onNavigate(link.section)}
            className="
              w-full text-left flex items-center justify-between
              px-4 py-3 rounded-xl
              border border-white/10 bg-white/[0.02]
              text-white/50 text-sm
              hover:text-white/70 hover:border-yellow-400/20
              transition-all
            "
          >
            {link.label}
            <span aria-hidden="true" className="text-white/20">→</span>
          </button>
        ))}
      </div>

      {/* Back to tribute wall */}
      <a
        href={`/for/${slug}`}
        className="text-[11px] text-white/25 hover:text-white/40 transition-colors"
      >
        ← Back to tribute wall
      </a>
    </div>
  );
}


// ============================================================
// SECTION 4 — Main shell component
// ============================================================

export default function PortalShell({
  capsuleId,
  slug,
  honoureeName,
  familyRepName,
  familyRepEmail,
  eventType,
  eventTag,
  sessionType,
  overview,
}: PortalShellProps) {
  const [activeSection, setActiveSection] = useState<PortalSection>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = useCallback((section: PortalSection) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <div className="min-h-screen bg-[#0D0820] flex flex-col">

      {/* ── Top bar ───────────────────────────────────────── */}
      <header className="
        flex-shrink-0 flex items-center justify-between
        px-4 py-3 border-b border-yellow-400/10
        bg-[#0a000e]
      ">
        <div>
          <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em]">
            LegacyCapsule · Personal Portal
          </p>
          <p className="text-sm font-bold text-white leading-tight mt-0.5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {honoureeName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {getEventTypeEmoji(eventType)}
          </span>
          {/* Mobile nav toggle */}
          <button
            type="button"
            className="md:hidden text-white/40 hover:text-white/70 p-1"
            onClick={() => setMobileNavOpen(v => !v)}
            aria-expanded={mobileNavOpen}
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="5" width="16" height="1.5" rx="0.75"/>
              <rect x="2" y="9.25" width="16" height="1.5" rx="0.75"/>
              <rect x="2" y="13.5" width="16" height="1.5" rx="0.75"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Left nav (desktop) ────────────────────────── */}
        <nav
          aria-label="Portal navigation"
          className={`
            w-52 flex-shrink-0
            border-r border-yellow-400/10
            bg-gradient-to-b from-[#100018] to-[#0a000e]
            flex flex-col
            ${mobileNavOpen ? 'flex' : 'hidden'} md:flex
            fixed md:relative inset-0 z-40 md:z-auto
            md:w-52
          `}
        >
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                  text-left text-xs transition-all
                  focus-visible:outline focus-visible:outline-1 focus-visible:outline-yellow-400/50
                  ${activeSection === item.id
                    ? 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-200'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <span aria-hidden="true" className="text-[11px] flex-shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Session type indicator */}
          <div className="px-3 py-3 border-t border-yellow-400/10">
            <p className="text-[9px] text-white/20">
              {sessionType === 'otp' ? '🔒 Persistent login' : '🔗 Link session'}
            </p>
          </div>
        </nav>

        {/* Mobile nav backdrop */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}


        {/* ── Main panel ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-2xl px-4 md:px-6 py-6">

            {/* OTP upgrade prompt — link sessions only */}
            {sessionType === 'link' && (
              <OtpUpgradePrompt slug={slug} />
            )}

            {/* Active section */}
            {activeSection === 'overview' && (
              <OverviewPanel
                overview={overview}
                honoureeName={honoureeName}
                reachableCount={overview.reachableCount}
                slug={slug}
                onNavigate={navigate}
              />
            )}

            {activeSection === 'tributes' && (
              <TributesPanel capsuleId={capsuleId} honoureeName={honoureeName} />
            )}

            {activeSection === 'ways_to_honour' && (
              <WaysToHonourPanel
                capsuleId={capsuleId}
                eventType={eventType}
                honoureeName={honoureeName}
                slug={slug}
              />
            )}

            {activeSection === 'appreciation' && (
              <AppreciationPanel
                capsuleId={capsuleId}
                eventType={eventType}
                honoureeName={honoureeName}
              />
            )}

            {activeSection === 'correspondence' && (
              <CorrespondenceLog capsuleId={capsuleId} />
            )}

            {activeSection === 'broadcast' && (
              <BroadcastPanel
                capsuleId={capsuleId}
                honoureeName={honoureeName}
              />
            )}

            {activeSection === 'anniversary' && (
              <AnniversaryPanel capsuleId={capsuleId} />
            )}

            {activeSection === 'template' && (
              <ThankYouTemplatePanel
                capsuleId={capsuleId}
                honoureeName={honoureeName}
              />
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
