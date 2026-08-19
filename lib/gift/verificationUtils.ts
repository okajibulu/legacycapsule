// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  lib/gift/verificationUtils.ts
// PURPOSE:    Single source of truth for all GCS verification logic
//             verifyCredential() — any-2-of-3 verification
//             normalisePhone()   — strips formatting, last 10 digits
//             namesMatch()       — token-based, order-independent name comparison
// SPEC:       GCS-SPEC-001-AMD-001 v1.3 — Parts Two, Six
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// RULES (non-negotiable):
//   • This file is the ONLY place verification logic lives. Never inline in API routes.
//   • normalisePhone() must be called on BOTH stored and entered phone before comparison.
//   • normaliseGuestName() must be called on BOTH stored and entered name before comparison.
//   • verifyCredential() never throws — all errors produce a VerifyResult with valid: false.
// ═══════════════════════════════════════════════════════════════════════════════


// ═══ SECTION 1 — Platform excluded words ═══════════════════════════════════════
//
// Titles, honorifics, and connectors stripped from both stored and entered names
// before any comparison. Order-independent — case-insensitive.
// Organiser can add capsule-level words via gift_excluded_words table.

const PLATFORM_EXCLUDED_WORDS = new Set([
  // Standard English titles
  'mr', 'mrs', 'miss', 'ms', 'dr', 'prof',
  // Nigerian / West African professional titles
  'engr', 'arch', 'barr', 'bldr',
  // Civic and traditional titles
  'chief', 'hon', 'sir', 'lady', 'prince', 'princess',
  'otunba', 'erelu',
  // Religious titles
  'rev', 'pastor', 'elder', 'deacon', 'deaconess',
  // Islamic titles
  'alhaji', 'alhaja',
  // Igbo traditional titles
  'high', 'lolo', 'nze', 'igwe', 'obi', 'eze',
  // Conjunctions and connectors
  'and', 'the', 'of',
])


// ═══ SECTION 2 — Name normalisation ════════════════════════════════════════════
//
// Splits a name string into meaningful tokens after stripping excluded words.
// capsuleExcludedWords: fetched from gift_excluded_words for this capsule,
//   passed in by the calling route (never fetched inside this function).

export function normaliseGuestName(
  name: string,
  capsuleExcludedWords: string[] = []
): string[] {
  const customExcluded = new Set(
    capsuleExcludedWords.map(w => w.toLowerCase().trim())
  )

  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')   // strip non-alpha except spaces
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t =>
      t.length >= 2 &&
      !PLATFORM_EXCLUDED_WORDS.has(t) &&
      !customExcluded.has(t)
    )
}

export function namesMatch(
  storedName:           string,
  enteredName:          string,
  capsuleExcludedWords: string[] = []
): boolean {
  const storedTokens  = normaliseGuestName(storedName,  capsuleExcludedWords)
  const enteredTokens = normaliseGuestName(enteredName, capsuleExcludedWords)

  // When stored name has 2+ meaningful tokens, require at least 2 matching tokens.
  // Single-token stored name (e.g. only "Emeka") — 1 match is sufficient.
  const minRequired = storedTokens.length >= 2 ? 2 : 1

  // Order-independent: any token in enteredTokens that appears in storedTokens counts.
  const storedSet  = new Set(storedTokens)
  const matchCount = enteredTokens.filter(t => storedSet.has(t)).length

  return matchCount >= minRequired
}


// ═══ SECTION 3 — Phone normalisation ═══════════════════════════════════════════
//
// Strips all non-numeric characters then returns the last 10 digits.
// Handles: leading zero, country code (+234), spaces, dashes, brackets.
// Always call normalisePhone() on BOTH stored and entered values before comparing.

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-10)
}

export function phonesMatch(storedPhone: string, enteredPhone: string): boolean {
  if (!storedPhone || !enteredPhone) return false
  return normalisePhone(storedPhone) === normalisePhone(enteredPhone)
}


// ═══ SECTION 4 — Any-2-of-3 verification ══════════════════════════════════════
//
// Manual entry path only. QR path is handled separately in the API route
// (QR decodes credential_id + timestamp window — valid = code active + time window open).
//
// Valid combinations:
//   code + name ✓
//   code + phone ✓
//   code + name + phone ✓ (all three accepted — not required)
//
// Code alone or second factor alone is never sufficient.

export interface VerifyParams {
  // Stored values from DB
  storedCode:           string
  storedName:           string
  storedPhone:          string
  capsuleExcludedWords: string[]

  // Entered values from scanner interface
  enteredCode:   string
  enteredName?:  string   // optional — staff enters at least one second factor
  enteredPhone?: string   // optional — staff enters at least one second factor
}

export interface VerifyResult {
  valid:       boolean
  factorsUsed: ('name' | 'phone')[]
  failReason?: 'code_mismatch' | 'no_second_factor' | 'second_factor_mismatch'
}

export function verifyCredential(params: VerifyParams): VerifyResult {
  const {
    storedCode, storedName, storedPhone, capsuleExcludedWords,
    enteredCode, enteredName, enteredPhone,
  } = params

  // ── Code must always match (trimmed, exact) ───────────────────────────────
  if (enteredCode.trim() !== storedCode.trim()) {
    return { valid: false, factorsUsed: [], failReason: 'code_mismatch' }
  }

  // ── No second factor provided at all ─────────────────────────────────────
  const nameProvided  = Boolean(enteredName?.trim())
  const phoneProvided = Boolean(enteredPhone?.trim())

  if (!nameProvided && !phoneProvided) {
    return { valid: false, factorsUsed: [], failReason: 'no_second_factor' }
  }

  // ── Check each provided second factor ────────────────────────────────────
  const factorsUsed: ('name' | 'phone')[] = []
  let secondFactorValid = false

  if (nameProvided) {
    const nameValid = namesMatch(storedName, enteredName!, capsuleExcludedWords)
    if (nameValid) {
      secondFactorValid = true
      factorsUsed.push('name')
    }
  }

  if (phoneProvided) {
    const phoneValid = phonesMatch(storedPhone, enteredPhone!)
    if (phoneValid) {
      secondFactorValid = true
      factorsUsed.push('phone')
    }
  }

  // ── Second factor(s) provided but none matched ────────────────────────────
  if (!secondFactorValid) {
    return { valid: false, factorsUsed, failReason: 'second_factor_mismatch' }
  }

  return { valid: true, factorsUsed }
}


// ═══ SECTION 5 — QR payload helpers ════════════════════════════════════════════
//
// QR payloads are HMAC-signed with GCS_QR_SECRET.
// These helpers are used by the credential page (render QR) and the scan API
// (validate QR). Both call the same signing/verification logic.
//
// QR format: `{credential_id}:{timestamp_window}`
// timestamp_window = Math.floor(Date.now() / (windowMinutes * 60 * 1000))
// This produces the same integer for the entire window duration.
// QR is valid for the current window and the immediately prior window
// (±1 grace) to handle clock skew and page-load timing.

import { createHmac } from 'crypto'

const QR_SECRET = process.env.GCS_QR_SECRET ?? ''

// Default window: 5 minutes. Organiser-configurable via gcs_config (Phase 2).
const DEFAULT_WINDOW_MINUTES = 5

function getWindowIndex(windowMinutes: number = DEFAULT_WINDOW_MINUTES): number {
  return Math.floor(Date.now() / (windowMinutes * 60 * 1000))
}

function signQrPayload(
  credentialId: string,
  windowIndex:  number
): string {
  const message = `${credentialId}:${windowIndex}`
  return createHmac('sha256', QR_SECRET)
    .update(message)
    .digest('hex')
}

/**
 * buildQrPayload — called when rendering the credential page QR.
 * Returns the signed string that encodes into the QR image.
 */
export function buildQrPayload(
  credentialId:  string,
  windowMinutes: number = DEFAULT_WINDOW_MINUTES
): string {
  const windowIndex = getWindowIndex(windowMinutes)
  const sig         = signQrPayload(credentialId, windowIndex)
  return `${credentialId}:${windowIndex}:${sig}`
}

/**
 * verifyQrPayload — called by the scan API route.
 * Accepts current window and ±1 grace window to handle timing edge cases.
 * Returns the credentialId if valid, null if invalid or expired.
 */
export function verifyQrPayload(
  payload:       string,
  windowMinutes: number = DEFAULT_WINDOW_MINUTES
): string | null {
  const parts = payload.split(':')
  if (parts.length !== 3) return null

  const [credentialId, windowIndexStr, receivedSig] = parts
  const receivedWindowIndex = parseInt(windowIndexStr, 10)
  if (isNaN(receivedWindowIndex)) return null

  const currentWindowIndex = getWindowIndex(windowMinutes)

  // Accept current window and ±1 grace for clock skew / page load timing
  const validWindows = [
    currentWindowIndex - 1,
    currentWindowIndex,
    currentWindowIndex + 1,
  ]

  for (const w of validWindows) {
    if (w === receivedWindowIndex) {
      const expectedSig = signQrPayload(credentialId, w)
      if (expectedSig === receivedSig) {
        return credentialId
      }
    }
  }

  return null
}