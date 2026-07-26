// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/rsvp/invite/route.ts
// PURPOSE: Send personalised RSVP invitation emails to guests.
//          Generates a unique rsvp_token per guest if not already set.
//          Supports full send (all guests with email), circle-scoped send
//          (all guests in a specific circle), and individual resend.
//          Marks rsvp_sent_at on each guest after successful send.
//          Writes to event_action_log per guest sent.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — RSVP Layer
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

// ═══ SECTION 2 — Audit log helper ═══

async function logAction(params: {
  capsule_id:  string
  actor_name:  string
  actor_ref:   string
  action:      string
  target_id:   string
  target_name: string
}) {
  try {
    await db.from('event_action_log').insert({
      capsule_id:  params.capsule_id,
      actor_type:  'organiser',
      actor_name:  params.actor_name,
      actor_ref:   params.actor_ref,
      action:      params.action,
      target_type: 'guest',
      target_id:   params.target_id,
      target_name: params.target_name,
    })
  } catch (e) {
    console.warn('[rsvp/invite] Audit log write failed:', e)
  }
}

// ═══ SECTION 3 — POST handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      capsule_id,
      capsule_slug,
      honouree_name,
      event_tag,
      organiser_email,
      circle_id,        // optional — scope to one circle
      guest_ids,        // optional — scope to specific guests
      is_reminder,      // boolean — changes email subject/tone
    } = body

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug are required.' },
        { status: 400 }
      )
    }

    // ── Fetch RSVP config for event details ────────────────────────────────

    const { data: rsvpConfig } = await db
      .from('event_rsvp_config')
      .select('event_venue, event_datetime, event_dress_code, rsvp_tone, show_event_details, deadline_at')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    // ── Build guest query based on scope ───────────────────────────────────

    let guestQuery = db
      .from('guests')
      .select('id, name, email, tier, rsvp_token, rsvp_status, circle_id')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .not('email', 'is', null)   // only guests with email addresses

    if (guest_ids?.length > 0) {
      guestQuery = guestQuery.in('id', guest_ids)
    } else if (circle_id) {
      guestQuery = guestQuery.eq('circle_id', circle_id)
    }
    // Default (no scope): all guests with email

    const { data: guests, error: guestErr } = await guestQuery

    if (guestErr) throw guestErr

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        { error: 'No guests with email addresses found for this scope.' },
        { status: 404 }
      )
    }

    // ── Send emails ────────────────────────────────────────────────────────

    let sent    = 0
    let skipped = 0

    const eventLabel = event_tag ?? honouree_name ?? 'Your Event'

    for (const guest of guests) {
      try {
        // Generate rsvp_token if not already set
        let token = guest.rsvp_token
        if (!token) {
          token = randomBytes(32).toString('hex')
          await db
            .from('guests')
            .update({ rsvp_token: token })
            .eq('id', guest.id)
        }

        const rsvpUrl = `${APP_URL}/for/${capsule_slug}/rsvp?t=${token}`

        // Build and send email
        await resend.emails.send({
          from:    'LegacyCapsule <events@itslegacycapsule.com>',
          to:      guest.email!,
          subject: is_reminder
            ? `A gentle reminder — ${eventLabel}`
            : buildSubject(eventLabel, rsvpConfig?.rsvp_tone),
          html: rsvpInviteHtml({
            guestName:    guest.name,
            eventLabel,
            honoureeName: honouree_name ?? '',
            rsvpUrl,
            isReminder:   !!is_reminder,
            venue:        rsvpConfig?.show_event_details ? rsvpConfig?.event_venue ?? null : null,
            eventDatetime: rsvpConfig?.show_event_details ? rsvpConfig?.event_datetime ?? null : null,
            dressCode:    rsvpConfig?.show_event_details ? rsvpConfig?.event_dress_code ?? null : null,
            deadline:     rsvpConfig?.deadline_at ?? null,
          }),
        })

        // Update sent timestamp
        await db
          .from('guests')
          .update({ rsvp_sent_at: new Date().toISOString() })
          .eq('id', guest.id)

        await logAction({
          capsule_id,
          actor_name:  organiser_email ?? 'Organiser',
          actor_ref:   organiser_email ?? '',
          action:      is_reminder ? 'rsvp_reminder_sent' : 'rsvp_invite_sent',
          target_id:   guest.id,
          target_name: guest.name,
        })

        sent++
      } catch (emailErr) {
        console.error(`[rsvp/invite] Failed for ${guest.email}:`, emailErr)
        skipped++
      }
    }

    return NextResponse.json({ ok: true, sent, skipped })

  } catch (e: any) {
    console.error('[rsvp/invite]', e)
    return NextResponse.json({ error: 'Failed to send RSVP invitations.' }, { status: 500 })
  }
}

// ═══ SECTION 4 — Subject line builder ═══

function buildSubject(eventLabel: string, tone?: string | null): string {
  if (tone === 'formal') {
    return `Invitation — ${eventLabel}`
  }
  // Default: warm
  return `You are personally invited — ${eventLabel}`
}

// ═══ SECTION 5 — Email template ═══
//
// Premium branded RSVP invitation email.
// Warm, personal, event-aware. Two clear CTAs: Attending / Unable to attend.
// No forms in email — clicking goes to the RSVP page.
// Event details (venue, datetime, dress code) shown only if organiser has set them
// and show_event_details is true in RSVP config.

function rsvpInviteHtml(d: {
  guestName:     string
  eventLabel:    string
  honoureeName:  string
  rsvpUrl:       string
  isReminder:    boolean
  venue:         string | null
  eventDatetime: string | null
  dressCode:     string | null
  deadline:      string | null
}) {
  const declineUrl = `${d.rsvpUrl}&response=declined`

  const eventDetailsBlock = (d.venue || d.eventDatetime) ? `
    <tr>
      <td style="padding:0 44px 24px;">
        <div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.18);border-radius:12px;padding:16px 20px;">
          ${d.eventDatetime ? `
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Date &amp; Time</p>
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#FFFFFF;">${d.eventDatetime}</p>
          ` : ''}
          ${d.venue ? `
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Venue</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.5;">${d.venue}</p>
          ` : ''}
          ${d.dressCode ? `
          <p style="margin:12px 0 4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Dress Code</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.8);">${d.dressCode}</p>
          ` : ''}
        </div>
      </td>
    </tr>` : ''

  const deadlineNote = d.deadline
    ? `<p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);">
        Please respond by ${new Date(d.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
       </p>`
    : ''

  const reminderNote = d.isReminder
    ? `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.75;text-align:center;">
        We noticed you haven't had a chance to respond yet — no worries at all.
        When you have a moment, we would love to know if you can join us.
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>You are invited — ${d.eventLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <!-- Gold top rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">
                ${d.isReminder ? 'GENTLE REMINDER' : 'PERSONAL INVITATION'}
              </p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">${d.eventLabel}</h1>
              ${d.honoureeName ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(226,195,107,0.7);">${d.honoureeName}</p>` : ''}
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 44px 20px;text-align:center;">
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:17px;color:#FFFFFF;">
                Dear <strong>${d.guestName}</strong>,
              </p>
              ${reminderNote}
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.75;">
                ${d.isReminder
                  ? `Your presence at this celebration would mean the world.`
                  : `You have been personally invited to this celebration. We would be truly honoured to have you join us.`
                }
              </p>
            </td>
          </tr>

          <!-- Event details (if set and visible) -->
          ${eventDetailsBlock}

          <!-- Primary CTA — Attending -->
          <tr>
            <td style="padding:0 44px 12px;text-align:center;">
              <a href="${d.rsvpUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.04em;">
                ✓ &nbsp;I Will Be Attending
              </a>
              ${deadlineNote}
            </td>
          </tr>

          <!-- Secondary CTA — Unable to attend -->
          <tr>
            <td style="padding:0 44px 32px;text-align:center;">
              <a href="${declineUrl}" style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.3);text-decoration:underline;">
                I am unable to attend
              </a>
            </td>
          </tr>

          <!-- Capsule note -->
          <tr>
            <td style="padding:0 44px 28px;">
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.7;">
                  This event is being preserved as a LegacyCapsule — a permanent record of messages, stories and memories from everyone who attends.
                </p>
              </div>
            </td>
          </tr>

          <!-- Gold bottom rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Footer -->
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
