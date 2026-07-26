// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/circles/portal/route.ts
// PURPOSE: Generate a Circle Leader portal link and send the welcome email.
//          Reuses the existing honouree_portal_tokens infrastructure with
//          role='circle_leader' and circle_id FK. The Circle Leader portal
//          page reads this token to authenticate and scope the view.
//          Also supports GET to check if a portal has been sent for a circle.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — Circle Leader Layer
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'
import { randomBytes }               from 'crypto'

// ═══ SECTION 1 — Clients ═══

const db     = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — GET: Check portal status for a circle ═══

export async function GET(req: NextRequest) {
  const circle_id = req.nextUrl.searchParams.get('circle_id')
  if (!circle_id) {
    return NextResponse.json({ error: 'circle_id required.' }, { status: 400 })
  }

  try {
    const { data } = await db
      .from('honouree_portal_tokens')
      .select('id, created_at, expires_at, display_name')
      .eq('circle_id', circle_id)
      .eq('role', 'circle_leader')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      portal_sent: !!data,
      sent_at:     data?.created_at ?? null,
      expires_at:  data?.expires_at ?? null,
    })
  } catch (e: any) {
    console.error('[circles/portal GET]', e)
    return NextResponse.json({ error: 'Failed to check portal status.' }, { status: 500 })
  }
}

// ═══ SECTION 3 — POST: Generate and send circle leader portal ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      circle_id,
      capsule_id,
      capsule_slug,
      honouree_name,
      event_tag,
      organiser_email,
    } = body

    if (!circle_id || !capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'circle_id, capsule_id, and capsule_slug are required.' },
        { status: 400 }
      )
    }

    // ── Fetch circle details ────────────────────────────────────────────────

    const { data: circle, error: circleErr } = await db
      .from('event_circles')
      .select('id, name, leader_name, leader_email, portal_token')
      .eq('id', circle_id)
      .single()

    if (circleErr || !circle) {
      return NextResponse.json({ error: 'Circle not found.' }, { status: 404 })
    }

    if (!circle.leader_email) {
      return NextResponse.json(
        { error: 'This circle has no leader email address. Add one before sending the portal link.' },
        { status: 422 }
      )
    }

    // ── Create portal token in honouree_portal_tokens ──────────────────────
    // Token expires in 90 days — long enough for event planning lifecycle

    const token      = randomBytes(32).toString('hex')
    const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenErr } = await db
      .from('honouree_portal_tokens')
      .insert({
        capsule_id,
        token,
        role:         'circle_leader',
        circle_id,
        display_name: circle.leader_name ?? circle.name,
        honouree_email: circle.leader_email,   // reuse existing column for leader email
        expires_at,
      })

    if (tokenErr) {
      console.error('[circles/portal] Token insert error:', tokenErr)
      return NextResponse.json({ error: 'Failed to generate portal token.' }, { status: 500 })
    }

    // ── Update circle with portal_sent_at ──────────────────────────────────

    await db
      .from('event_circles')
      .update({ portal_sent_at: new Date().toISOString() })
      .eq('id', circle_id)

    // ── Send welcome email to circle leader ────────────────────────────────

    const portalUrl  = `${APP_URL}/portal/circle/${token}`
    const eventLabel = event_tag ?? honouree_name ?? 'the event'

    await resend.emails.send({
      from:    'LegacyCapsule <events@itslegacycapsule.com>',
      to:      circle.leader_email,
      subject: `Your coordinator access — ${eventLabel}`,
      html:    circleLeaderWelcomeHtml({
        leaderName:   circle.leader_name ?? 'Circle Coordinator',
        circleName:   circle.name,
        eventLabel,
        honoureeName: honouree_name ?? '',
        portalUrl,
      }),
    })

    // ── Write audit log ─────────────────────────────────────────────────────

    try {
      await db.from('event_action_log').insert({
        capsule_id,
        actor_type:  'organiser',
        actor_name:  organiser_email ?? 'Organiser',
        actor_ref:   organiser_email ?? '',
        action:      'circle_portal_sent',
        target_type: 'circle',
        target_id:   circle_id,
        target_name: circle.name,
        metadata:    { leader_email: circle.leader_email, leader_name: circle.leader_name },
      })
    } catch {}

    return NextResponse.json({
      ok:         true,
      portal_url: portalUrl,
      sent_to:    circle.leader_email,
    })

  } catch (e: any) {
    console.error('[circles/portal POST]', e)
    return NextResponse.json({ error: 'Failed to send portal link.' }, { status: 500 })
  }
}

// ═══ SECTION 4 — Circle leader welcome email template ═══

function circleLeaderWelcomeHtml(d: {
  leaderName:   string
  circleName:   string
  eventLabel:   string
  honoureeName: string
  portalUrl:    string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your coordinator access — ${d.eventLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">COORDINATOR ACCESS</p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">${d.eventLabel}</h1>
              ${d.honoureeName ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(226,195,107,0.7);">${d.honoureeName}</p>` : ''}
            </td>
          </tr>

          <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

          <tr>
            <td style="padding:28px 44px 20px;">
              <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:17px;color:#FFFFFF;">
                Dear <strong>${d.leaderName}</strong>,
              </p>
              <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.75;">
                You have been designated as the coordinator for <strong style="color:#FFFFFF;">${d.circleName}</strong> at this event. Your role is to help track attendance and keep your group organised in the lead-up to the celebration.
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.75;">
                Through your personal portal, you can see who in your group has confirmed, follow up with those who haven't responded, and update attendance on their behalf.
              </p>
            </td>
          </tr>

          <!-- What you can do -->
          <tr>
            <td style="padding:0 44px 24px;">
              <div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:12px;padding:16px 20px;">
                <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.6);">Your coordinator portal lets you</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">✓ &nbsp;See your group's RSVP status at a glance</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">✓ &nbsp;Confirm or update attendance on behalf of your group</p>
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">✓ &nbsp;See recent event updates and activity</p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">✓ &nbsp;Send reminders to your group members</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 44px 32px;text-align:center;">
              <a href="${d.portalUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.04em;">
                Open My Coordinator Portal →
              </a>
              <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);">
                This link is personal to you. Please do not share it.
              </p>
            </td>
          </tr>

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <tr>
            <td style="padding:14px 44px 18px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.15);letter-spacing:2px;text-transform:uppercase;">
                LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
