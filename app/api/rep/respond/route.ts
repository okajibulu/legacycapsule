/* =========================================================
   app/api/rep/respond/route.ts
   Family Rep submits a response to a tribute
   - Saves to tribute_responses
   - Sends email to contributor
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { contributionId, capsuleId, responseText, respondedBy, token, authMode } = await request.json()

    if (!contributionId || !capsuleId || !responseText?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // ── Auth path 1: Portal token (Family Representative) ──
    // ── Auth path 2: Manage session (FRFA via dashboard) ──
    if (authMode === 'manage') {
      // FRFA auth — verify capsule_accounts record exists and is family_rep_full_access
      const { data: frfaAccount } = await supabase
        .from('capsule_accounts')
        .select('id, account_type')
        .eq('capsule_id', capsuleId)
        .eq('account_type', 'family_rep_full_access')
        .eq('is_active', true)
        .maybeSingle()

      if (!frfaAccount) {
        return NextResponse.json({ error: 'Unauthorised — no active Full Access account found.' }, { status: 401 })
      }
    } else {
      // Portal token auth (original path)
      if (!token) {
        return NextResponse.json({ error: 'Missing authentication.' }, { status: 400 })
      }

      const { data: tokenRow } = await supabase
        .from('honouree_portal_tokens')
        .select('capsule_id, expires_at')
        .eq('token', token)
        .single()

      if (!tokenRow || tokenRow.capsule_id !== capsuleId) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      }
      if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
    }

    // Save response
    const { error: insertError } = await supabase
      .from('tribute_responses')
      .insert({
        contribution_id: contributionId,
        capsule_id: capsuleId,
        response_text: responseText.trim(),
        responded_by: respondedBy?.trim() || 'The Family',
      })

    if (insertError) {
      console.error('Response insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    // Fetch contribution + capsule for email
    const { data: contribution } = await supabase
      .from('contributions')
      .select('contributor_name, email, tribute_text')
      .eq('id', contributionId)
      .single()

    const { data: capsule } = await supabase
      .from('capsules')
      .select('honouree_name, slug')
      .eq('id', capsuleId)
      .single()

    // Send email to contributor if they have one
    if (contribution?.email && capsule) {
      const wallUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}`

      await resend.emails.send({
        from: 'LegacyCapsule <hello@itslegacycapsule.com>',
        to: contribution.email,
        subject: `The family of ${capsule.honouree_name} has responded to your tribute`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>

        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px;">

            <tr><td align="center" style="padding-bottom:20px;">
              <span style="font-size:32px;">✦</span>
            </td></tr>

            <tr><td align="center" style="padding-bottom:8px;">
              <h1 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;">A Family Response</h1>
            </td></tr>

            <tr><td align="center" style="padding-bottom:24px;">
              <p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;">
                The family of <strong style="color:rgba(255,255,255,0.85);">${capsule.honouree_name}</strong> has responded to the tribute you left on their LegacyCapsule.
              </p>
            </td></tr>

            <!-- Original tribute -->
            <tr><td style="padding-bottom:16px;">
              <div style="background:rgba(255,255,255,0.03);border-left:3px solid rgba(226,195,107,0.3);border-radius:0 10px 10px 0;padding:14px 16px;">
                <p style="font-size:10px;color:rgba(226,195,107,0.55);text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">Your tribute</p>
                <p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;font-style:italic;">"${contribution.tribute_text.slice(0, 200)}${contribution.tribute_text.length > 200 ? '…' : ''}"</p>
              </div>
            </td></tr>

            <!-- Family response -->
            <tr><td style="padding-bottom:28px;">
              <div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.2);border-radius:12px;padding:16px 18px;">
                <p style="font-size:10px;color:rgba(226,195,107,0.55);text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;">Family response · ${respondedBy?.trim() || 'The Family'}</p>
                <p style="font-size:14px;color:rgba(255,255,255,0.88);line-height:1.8;margin:0;font-style:italic;">"${responseText.trim()}"</p>
              </div>
            </td></tr>

            <tr><td align="center" style="padding-bottom:24px;">
              <a href="${wallUrl}" style="display:inline-block;padding:12px 32px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.7));color:#1a0845;font-size:13px;font-weight:700;text-decoration:none;">
                View the Tribute Wall →
              </a>
            </td></tr>

            <tr><td align="center">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;margin:0;">
                LegacyCapsule · <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
              </p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch(err => console.error('Email error:', err))
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Rep respond error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
