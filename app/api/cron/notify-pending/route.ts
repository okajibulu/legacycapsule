/* =========================================================
   app/api/cron/notify-pending/route.ts
   Batched tribute notification cron — runs every 20 minutes
   
   Per-capsule frequency: 20min | 1hr | 6hr | 24hr | off
   Auto-terminates: event_date + 30 days (or created_at + 120 days)
   
   RULE: All crons must have end date logic — no perpetual jobs.
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

// Frequency in minutes
const FREQUENCY_MINUTES: Record<string, number> = {
  '20min': 20,
  '1hr':   60,
  '6hr':   360,
  '24hr':  1440,
}

function isWithinNotificationWindow(capsule: any): boolean {
  // Check if capsule is still within its notification period
  const now = new Date()

  // End date = event_date + 30 days, fallback = created_at + 120 days
  let endDate: Date
  if (capsule.event_date) {
    endDate = new Date(new Date(capsule.event_date).getTime() + 30 * 86400000)
  } else {
    endDate = new Date(new Date(capsule.created_at).getTime() + 120 * 86400000)
  }

  return now < endDate
}

function isDueForNotification(capsule: any): boolean {
  const freq = capsule.notification_frequency
  if (!freq || !FREQUENCY_MINUTES[freq]) return false

  const intervalMs = FREQUENCY_MINUTES[freq] * 60 * 1000
  const lastNotified = capsule.organiser_last_notified_at
    ? new Date(capsule.organiser_last_notified_at)
    : null

  // Never notified → due immediately
  if (!lastNotified) return true

  return (Date.now() - lastNotified.getTime()) >= intervalMs
}

export async function GET(request: NextRequest) {
  // Verify Vercel Cron auth
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    // Fetch all active capsules with notifications enabled
    const { data: capsules } = await supabase
      .from('capsules')
      .select('id, slug, honouree_name, organiser_email, page_state, event_date, created_at, notification_frequency, organiser_last_notified_at')
      .not('notification_frequency', 'is', null)
      .not('page_state', 'in', '("suspended","deleted")')
      .is('deleted_at', null)

    if (!capsules || capsules.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No capsules with notifications enabled' })
    }

    let emailsSent = 0

    for (const capsule of capsules) {
      // Skip if past notification end date
      if (!isWithinNotificationWindow(capsule)) continue

      // Skip if not yet due for notification based on their chosen frequency
      if (!isDueForNotification(capsule)) continue

      // Fetch un-notified pending tributes for this capsule
      const { data: pending } = await supabase
        .from('contributions')
        .select('id, contributor_name, created_at')
        .eq('capsule_id', capsule.id)
        .in('status', ['pending', 'pending_review'])
        .is('organiser_notified_at', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (!pending || pending.length === 0) continue

      const count = pending.length
      const names = pending.slice(0, 3).map((t: any) => t.contributor_name).join(', ')
      const moreText = count > 3 ? ` and ${count - 3} more` : ''
      const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/manage/${capsule.slug}`

      const freqLabel: Record<string, string> = {
        '20min': 'every 20 minutes',
        '1hr': 'every hour',
        '6hr': 'every 6 hours',
        '24hr': 'once a day',
      }

      await resend.emails.send({
        from: 'LegacyCapsule <hello@itslegacycapsule.com>',
        to: capsule.organiser_email,
        subject: `${count} new tribute${count > 1 ? 's' : ''} awaiting approval — ${capsule.honouree_name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

      <tr><td align="center" style="padding-bottom:28px;">
        <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
      </td></tr>

      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 28px 24px;">

          <tr><td align="center" style="padding-bottom:16px;">
            <div style="display:inline-block;padding:10px 20px;border-radius:30px;background:rgba(226,195,107,0.1);border:1px solid rgba(226,195,107,0.25);">
              <span style="font-size:22px;font-weight:800;color:#E2C36B;font-family:Georgia,serif;">${count}</span>
              <span style="font-size:13px;color:rgba(226,195,107,0.7);margin-left:6px;">new tribute${count > 1 ? 's' : ''}</span>
            </div>
          </td></tr>

          <tr><td align="center" style="padding-bottom:8px;">
            <h1 style="font-family:Georgia,serif;font-size:19px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;">Awaiting your approval</h1>
          </td></tr>

          <tr><td align="center" style="padding-bottom:20px;">
            <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin:0;">
              <strong style="color:rgba(255,255,255,0.8);">${names}${moreText}</strong><br/>
              left tribute${count > 1 ? 's' : ''} for <strong style="color:rgba(255,255,255,0.8);">${capsule.honouree_name}</strong>
            </p>
          </td></tr>

          <tr><td align="center" style="padding-bottom:20px;">
            <a href="${manageUrl}" style="display:inline-block;padding:13px 32px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.7));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
              Review & Publish →
            </a>
          </td></tr>

          <tr><td align="center">
            <p style="font-size:11px;color:rgba(255,255,255,0.22);line-height:1.6;margin:0;">
              You receive one notification ${freqLabel[capsule.notification_frequency] ?? 'periodically'}.<br/>
              Manage notification settings in your capsule dashboard.
            </p>
          </td></tr>

        </table>
      </td></tr>

      <tr><td align="center" style="padding-top:24px;">
        <p style="font-size:11px;color:rgba(255,255,255,0.18);margin:0;">
          LegacyCapsule · <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.3);text-decoration:none;">itslegacycapsule.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
      }).catch(err => console.error(`Email failed for ${capsule.organiser_email}:`, err))

      // Mark tributes as notified
      const ids = pending.map((t: any) => t.id)
      await supabase
        .from('contributions')
        .update({ organiser_notified_at: new Date().toISOString() })
        .in('id', ids)

      // Update capsule last notified timestamp
      await supabase
        .from('capsules')
        .update({ organiser_last_notified_at: new Date().toISOString() })
        .eq('id', capsule.id)

      emailsSent++
    }

    return NextResponse.json({ sent: emailsSent })

  } catch (err) {
    console.error('Notify cron error:', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
