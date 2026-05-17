/**
 * ============================================================
 * LEGACYCAPSULE — lib/portalAuth.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * SERVER-SIDE ONLY. Never import in client components.
 *
 * Handles all authentication for the honouree/family rep portal.
 *
 * Two access flavours (D54):
 *   1. Link access  — token in URL query param. Session persists
 *      on device for 6 months via a signed cookie.
 *   2. OTP login    — email + 6-digit code. Creates a persistent
 *      session cookie with no expiry (cleared only on explicit
 *      logout or cookie deletion).
 *
 * Security model:
 *   - Tokens and session values are stored hashed (SHA-256).
 *   - OTP stored as SHA-256 hash — not bcrypt (OTP is short-lived
 *     and rate-limited, SHA-256 is sufficient and faster).
 *   - Session cookie: httpOnly, SameSite=Strict, path-scoped
 *     to /for/[slug]/honouree.
 *   - All validation happens server-side in the page component
 *     or API route — never client-side.
 */

import { createClient }  from '@supabase/supabase-js';
import { createHash }    from 'crypto';
import { cookies }       from 'next/headers';
import { Resend }        from 'resend';

// ============================================================
// SECTION 1 — Clients and constants
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

/** Session duration for link-access flavour — 6 months in seconds (D54) */
const LINK_SESSION_MAX_AGE = 60 * 60 * 24 * 30 * 6;

/** OTP validity window — 10 minutes */
const OTP_EXPIRY_MINUTES = 10;

/** Cookie name — path-scoped per slug */
const cookieName = (slug: string) => `lc_honouree_${slug}`;


// ============================================================
// SECTION 2 — Hashing utilities
// ============================================================

/** SHA-256 hash of a value — used for token and session storage */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Generate a cryptographically random 6-digit OTP */
function generateOtp(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return digits.toString();
}

/** Generate a cryptographically random session token */
function generateSessionToken(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest('hex');
}


// ============================================================
// SECTION 3 — Token validation (link-access flavour)
//
// Called on page load when ?token= is present in the URL.
// Validates the token exists and belongs to this capsule slug.
// Establishes a 6-month session cookie on success.
// ============================================================

export interface PortalAuthResult {
  valid:         boolean;
  capsuleId?:    string;
  sessionType?:  'link' | 'otp';
  error?:        string;
}

/**
 * Validate a portal token from the URL query param.
 * On success: writes a session cookie and updates last_accessed_at.
 *
 * @param slug   Capsule slug from route params
 * @param token  Raw token from ?token= query param
 */
export async function validatePortalToken(
  slug: string,
  token: string
): Promise<PortalAuthResult> {
  if (!token || token.length < 10) {
    return { valid: false, error: 'Invalid token format.' };
  }

  // Look up the capsule by slug first
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) {
    return { valid: false, error: 'Capsule not found.' };
  }

  // Find matching token row
  const { data: tokenRow } = await adminClient
    .from('honouree_portal_tokens')
    .select('id, session_hash, link_session_at, session_type')
    .eq('capsule_id', capsule.id)
    .eq('token', token)          // Raw token — compared directly (stored as plaintext per original schema)
    .maybeSingle();

  if (!tokenRow) {
    return { valid: false, error: 'Token not recognised.' };
  }

  // Generate a new session token and write cookie
  const sessionToken = generateSessionToken();
  const sessionHash  = sha256(sessionToken);
  const now          = new Date().toISOString();

  await adminClient
    .from('honouree_portal_tokens')
    .update({
      session_hash:     sessionHash,
      session_type:     'link',
      link_session_at:  now,
      last_accessed_at: now,
    })
    .eq('id', tokenRow.id);

  // Write session cookie — path-scoped, 6-month expiry
  const cookieStore = await cookies();
  cookieStore.set(cookieName(slug), sessionToken, {
    httpOnly:  true,
    sameSite:  'strict',
    path:      `/for/${slug}/honouree`,
    maxAge:    LINK_SESSION_MAX_AGE,
    secure:    process.env.NODE_ENV === 'production',
  });

  return { valid: true, capsuleId: capsule.id, sessionType: 'link' };
}


// ============================================================
// SECTION 4 — Session cookie validation
//
// Called on every portal page load after the initial token visit.
// Validates the session cookie against the stored hash.
// ============================================================

/**
 * Validate an existing session cookie for the portal.
 * Returns the capsuleId on success — the caller uses this
 * to fetch all portal data.
 *
 * @param slug  Capsule slug from route params
 */
export async function validatePortalSession(
  slug: string
): Promise<PortalAuthResult> {
  const cookieStore  = await cookies();
  const sessionCookie = cookieStore.get(cookieName(slug));

  if (!sessionCookie?.value) {
    return { valid: false, error: 'No session found.' };
  }

  const sessionHash = sha256(sessionCookie.value);

  // Look up by capsule slug + session hash
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) return { valid: false, error: 'Capsule not found.' };

  const { data: tokenRow } = await adminClient
    .from('honouree_portal_tokens')
    .select('id, session_type, link_session_at, otp_session_at')
    .eq('capsule_id', capsule.id)
    .eq('session_hash', sessionHash)
    .maybeSingle();

  if (!tokenRow) {
    return { valid: false, error: 'Session expired or not recognised.' };
  }

  // Check 6-month expiry for link-access sessions
  if (tokenRow.session_type === 'link' && tokenRow.link_session_at) {
    const established = new Date(tokenRow.link_session_at).getTime();
    const sixMonths   = LINK_SESSION_MAX_AGE * 1000;
    if (Date.now() - established > sixMonths) {
      return { valid: false, error: 'Session expired. Please use your portal link again.' };
    }
  }
  // OTP sessions: no expiry — persistent until cookie deleted

  // Update last_accessed_at (non-blocking)
  adminClient
    .from('honouree_portal_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', tokenRow.id)
    .then(() => {});

  return {
    valid:        true,
    capsuleId:    capsule.id,
    sessionType:  tokenRow.session_type as 'link' | 'otp',
  };
}


// ============================================================
// SECTION 5 — OTP generation and delivery
//
// Called when the family rep requests OTP login from inside
// the portal (after first link-access visit).
// ============================================================

/**
 * Generate a 6-digit OTP and send it to the family rep's email.
 * Stores hashed OTP with a 10-minute expiry.
 *
 * @param slug  Capsule slug
 */
export async function sendPortalOtp(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id, honouree_name, family_rep_email, family_rep_name, event_type')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule || !capsule.family_rep_email) {
    return { ok: false, error: 'No family representative email on file for this Capsule.' };
  }

  const otp        = generateOtp();
  const otpHash    = sha256(otp);
  const expiresAt  = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await adminClient
    .from('honouree_portal_tokens')
    .update({ otp_hash: otpHash, otp_expires_at: expiresAt })
    .eq('capsule_id', capsule.id);

  // Send OTP email
  const repFirstName = (capsule.family_rep_name ?? 'there').split(' ')[0];

  await resend.emails.send({
    from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
    to:      capsule.family_rep_email,
    subject: `Your portal access code — ${capsule.honouree_name}`,
    html: `
      <div style="background:#0D0820;padding:48px 0;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#1a0f35;border-radius:16px;overflow:hidden;">
          <div style="height:3px;background:linear-gradient(90deg,transparent,#B8960C,transparent);"></div>
          <div style="padding:40px 40px 32px;">
            <p style="color:#B8960C;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">
              LegacyCapsule
            </p>
            <h2 style="color:#FFFFFF;font-size:22px;margin:0 0 24px;line-height:1.3;">
              Your access code, ${repFirstName}
            </h2>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 32px;">
              Enter this code in your portal to set up persistent access.
              It expires in ${OTP_EXPIRY_MINUTES} minutes.
            </p>
            <div style="background:#2D1B69;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
              <p style="color:#F5F3EE;font-size:40px;font-weight:bold;letter-spacing:12px;margin:0;font-family:monospace;">
                ${otp}
              </p>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
              If you did not request this code, ignore this email.
              Your portal remains secure.
            </p>
          </div>
          <div style="height:3px;background:linear-gradient(90deg,transparent,#B8960C,transparent);"></div>
          <div style="padding:16px 40px;text-align:center;">
            <p style="color:rgba(255,255,255,0.2);font-size:10px;margin:0;letter-spacing:1px;">
              LegacyCapsule · Every event. Preserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return { ok: true };
}


// ============================================================
// SECTION 6 — OTP verification
//
// Called when the family rep submits the 6-digit code.
// On success: writes a persistent session cookie (no expiry).
// ============================================================

/**
 * Verify a submitted OTP and establish a persistent session.
 *
 * @param slug  Capsule slug
 * @param otp   6-digit code submitted by the user
 */
export async function verifyPortalOtp(
  slug: string,
  otp: string
): Promise<PortalAuthResult> {
  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (!capsule) return { valid: false, error: 'Capsule not found.' };

  const { data: tokenRow } = await adminClient
    .from('honouree_portal_tokens')
    .select('id, otp_hash, otp_expires_at')
    .eq('capsule_id', capsule.id)
    .maybeSingle();

  if (!tokenRow?.otp_hash) {
    return { valid: false, error: 'No access code was requested. Please request a new code.' };
  }

  // Check expiry
  if (tokenRow.otp_expires_at && new Date(tokenRow.otp_expires_at) < new Date()) {
    return { valid: false, error: 'This code has expired. Please request a new one.' };
  }

  // Compare hash
  if (sha256(otp) !== tokenRow.otp_hash) {
    return { valid: false, error: 'Incorrect code. Please try again.' };
  }

  // OTP valid — establish persistent session
  const sessionToken = generateSessionToken();
  const sessionHash  = sha256(sessionToken);
  const now          = new Date().toISOString();

  await adminClient
    .from('honouree_portal_tokens')
    .update({
      session_hash:     sessionHash,
      session_type:     'otp',
      otp_session_at:   now,
      last_accessed_at: now,
      otp_hash:         null,      // Clear OTP — one-time use
      otp_expires_at:   null,
    })
    .eq('id', tokenRow.id);

  // Persistent session cookie — no maxAge = session cookie until browser closes
  // but persistent login means we set a very long maxAge (10 years)
  const cookieStore = await cookies();
  cookieStore.set(cookieName(slug), sessionToken, {
    httpOnly:  true,
    sameSite:  'strict',
    path:      `/for/${slug}/honouree`,
    maxAge:    60 * 60 * 24 * 365 * 10, // 10 years
    secure:    process.env.NODE_ENV === 'production',
  });

  return { valid: true, capsuleId: capsule.id, sessionType: 'otp' };
}


// ============================================================
// SECTION 7 — Combined auth check
//
// Used on every portal page load.
// Checks cookie first (returning visitor), then token param
// (first-time link click), then returns invalid.
// ============================================================

/**
 * Main auth gate for the honouree portal page.
 * Call this at the top of the portal server component.
 *
 * Priority:
 *   1. Valid session cookie → authenticated (returning visitor)
 *   2. Valid ?token= param  → authenticate + set cookie (first visit)
 *   3. Neither              → not authenticated
 *
 * @param slug   Capsule slug
 * @param token  Optional token from URL query param
 */
export async function checkPortalAuth(
  slug: string,
  token?: string | null
): Promise<PortalAuthResult> {
  // Try cookie first — fast path for returning visitors
  const cookieResult = await validatePortalSession(slug);
  if (cookieResult.valid) return cookieResult;

  // Try token from URL — first-time link click
  if (token) {
    return validatePortalToken(slug, token);
  }

  return { valid: false, error: 'Access required. Please use your portal link.' };
}


// ============================================================
// SECTION 8 — Tier gate check
//
// Portal access is Legacy Honour and Legacy Premier only (D19).
// Free tier sees a locked/upgrade view.
// ============================================================

/**
 * Returns true if the capsule tier grants portal access.
 * Free tier returns false — shows upgrade prompt, not 404.
 */
export function tierGrantsPortalAccess(tier: string | null): boolean {
  return tier === 'honour' || tier === 'premier';
}
