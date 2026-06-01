/* =========================================================
   app/api/rep/request-access/route.ts

   Public endpoint — called from /rep-access page.
   Given an email, finds all active honouree_portal_tokens
   for that email across all capsules, and sends each
   portal link to that email.

   Security: Never reveals whether email exists or not —
   always returns success to prevent enumeration.
   One email send per active capsule token found.

   Body: { email: string }
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()

    // Find all active tokens for this email
    const { data: tokens } = await supabase
      .from('honouree_portal_tokens')
      .select('token, capsule_id, expires_at')
      .eq('honouree_email', normalised)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Always return success — never reveal if email exists
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Deduplicate — keep only most recent token per capsule
    const byCapsule = new Map<string, typeof tokens[0]>()
    for (const token of tokens) {
      if (!byCapsule.has(token.capsule_id)) {
        byCapsule.set(token.capsule_id, token)
      }
    }

    // Fetch capsule names for each
    const capsuleIds = [...byCapsule.keys()]
    const { data: capsules } = await supabase
      .from('capsules')
      .select('id, slug, honouree_name')
      .in('id', capsuleIds)
      .is('deleted_at', null)

    if (!capsules || capsules.length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Send one email per capsule — or one combined email if multiple
    if (capsules.length === 1) {
      const capsule = capsules[0]
      const token = byCapsule.get(capsule.id)!
      const portalUrl = `${APP_URL}/for/${capsule.slug}/honouree?token=${token.token}`

      await resend.emails.send({
        from: 'LegacyCapsule <hello@itslegacycapsule.com>',
        to: normalised,
        subject: `Your portal access — ${capsule.honouree_name}'s LegacyCapsule`,
        html: singleCapsuleEmail(capsule.honouree_name, portalUrl),
      })
    } else {
      // Multiple capsules — one combined email with all links
      const links = capsules.map(c => {
        const token = byCapsule.get(c.id)!
        return { name: c.honouree_name, url: `${APP_URL}/for/${c.slug}/honouree?token=${token.token}` }
      })

      await resend.emails.send({
        from: 'LegacyCapsule <hello@itslegacycapsule.com>',
        to: normalised,
        subject: `Your Family Rep portal access — LegacyCapsule`,
        html: multiCapsuleEmail(links),
      })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Rep request-access error:', err)
    // Still return ok — never reveal internal errors to public endpoint
    return NextResponse.json({ ok: true })
  }
}

/* ── Email templates ── */

function singleCapsuleEmail(honourName: string, portalUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td align="center" style="padding-bottom:28px;">
    <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span>
    <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
  </td></tr>
  <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">
      <tr><td align="center" style="padding-bottom:20px;">
        <span style="font-size:28px;">✦</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom:12px;">
        <h1 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;">Your Portal Access</h1>
      </td></tr>
      <tr><td align="center" style="padding-bottom:24px;">
        <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;">
          Here is your access link for <strong style="color:rgba(255,255,255,0.85);">${honourName}</strong>'s LegacyCapsule.
        </p>
      </td></tr>
      <tr><td align="center" style="padding-bottom:24px;">
        <a href="${portalUrl}" style="display:inline-block;padding:14px 36px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.7));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;">Open My Portal →</a>
      </td></tr>
      <tr><td style="padding-bottom:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.2);border-radius:10px;padding:12px 16px;">
            <p style="font-size:11px;color:#E2C36B;word-break:break-all;margin:0;line-height:1.6;">${portalUrl}</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center">
        <p style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;margin:0;">This link is private — do not share it.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding-top:24px;">
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">
      LegacyCapsule · <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function multiCapsuleEmail(links: { name: string; url: string }[]): string {
  const linkRows = links.map(l => `
    <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <p style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);margin:0 0 6px;">${l.name}</p>
      <a href="${l.url}" style="font-size:12px;color:#E2C36B;text-decoration:none;">Open Portal →</a>
    </td></tr>
  `).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td align="center" style="padding-bottom:28px;">
    <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span>
    <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
  </td></tr>
  <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">
      <tr><td align="center" style="padding-bottom:16px;">
        <h1 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;">Your Portal Access Links</h1>
      </td></tr>
      <tr><td style="padding-bottom:20px;">
        <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin:0;">
          You have Family Representative access on ${links.length} capsules. Your links are below.
        </p>
      </td></tr>
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">${linkRows}</table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding-top:24px;">
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">
      LegacyCapsule · <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}
