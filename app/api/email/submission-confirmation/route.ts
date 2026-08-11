// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/submission-confirmation/route.ts
// PURPOSE:   Submission confirmation email — sent immediately when a contributor
//            leaves a voice/appreciation/tribute and provides their email address.
//            Confirms receipt, previews their words, invites return visits,
//            and introduces LegacyCapsule to first-time visitors.
// ARCHITECTURE: Path A, Step 1 — contributor-facing. No organiser auth required.
//               Generates a 7-day edit token for pre-approval amendments.
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.90
// DATE:      11 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ═══ SECTION 1 — CLIENTS ═══

const resend = new Resend(process.env.RESEND_API_KEY!)

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — EDIT TOKEN GENERATOR ═══
// Creates a unique 7-day token in email_verifications for the contributor edit link.
// Edit link format: /for/[slug]/edit/[token]

async function createEditToken(contributionId: string): Promise<string> {
  const token =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)

  await adminClient.from('email_verifications').insert({
    token,
    type: 'contributor_edit',
    record_id: contributionId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return token
}

// ═══ SECTION 3 — EVENT-AWARE COPY BUILDER ═══
// Produces all variable copy fragments from event type and participation language.
// All copy audited against LC_EMOTIONAL_COMMUNICATION_STANDARD.md.
// ECS pillars targeted: Permanence, Belonging, Privilege, Weight, Craftsmanship.

function buildEventCopy(
  eventType: string,
  subjectName: string,
  contributorName: string,
  langSingular: string
): {
  subjectLine: string
  openingLine: string
  bodyIntro: string
  permanenceStatement: string
  returnCta: string
  reactionNudge: string
  discoveryNote: string
} {
  const isMemorial   = eventType === 'memorial'
  const isWedding    = eventType === 'wedding'
  const isBirthday   = eventType === 'milestone_birthday' || eventType === 'birthday'
  const isChieftaincy = eventType === 'chieftaincy'
  const firstName    = contributorName.split(' ')[0] ?? contributorName

  // ── Subject line: communicate the moment, not the action ──────────────────
  const subjectLine = isMemorial
    ? `Your tribute for ${subjectName} has been received`
    : `Your voice is now part of ${subjectName}'s record`

  // ── Opening line: address the person, not the system ─────────────────────
  const openingLine = `Dear ${contributorName},`

  // ── Body intro: warm, permanent, never administrative ────────────────────
  let bodyIntro: string
  if (isMemorial) {
    bodyIntro = `Your words are a meaningful gift — to those who loved ${subjectName}, and to the record that will carry this memory forward. Your tribute has been received and will be carefully reviewed before it is added to ${subjectName}'s permanent record.`
  } else if (isWedding) {
    bodyIntro = `What a beautiful thing, to take time to speak into someone's story on a day like this. Your blessing for ${subjectName} has been received and will be reviewed before it joins the voices gathered for this occasion.`
  } else if (isBirthday) {
    bodyIntro = `Your words have arrived — and they matter. Your ${langSingular.toLowerCase()} for ${subjectName} has been received and will be reviewed before it is woven into the permanent record of this milestone.`
  } else if (isChieftaincy) {
    bodyIntro = `It is a privilege to be counted among those who have spoken on this occasion. Your ${langSingular.toLowerCase()} for ${subjectName} has been received and will be reviewed before it takes its place in the permanent record.`
  } else {
    // Default — retirement and all others
    bodyIntro = `Something important has been preserved. Your ${langSingular.toLowerCase()} for ${subjectName} has been received and will be reviewed before it joins the voices assembled for this occasion. Every voice gathered here becomes part of a permanent record — not just a celebration, but a chapter in a life well lived.`
  }

  // ── Permanence statement: close with weight, never with a support offer ───
  const permanenceStatement = isMemorial
    ? `Your words are now held in trust — to be read, returned to, and passed on.`
    : `Your voice is now part of something permanent. Keep it. Return to it. Let someone else read it.`

  // ── Return visit CTA: drives repeat visits per founder direction ──────────
  const returnCta = isMemorial
    ? `Return to the record to see the voices gathered in ${subjectName}'s memory.`
    : `Return to ${subjectName}'s record as more voices are added — each one a new chapter.`

  // ── Reaction nudge: encourages engagement with others' voices ─────────────
  const reactionNudge = isMemorial
    ? `When you visit, you will find the voices of others who loved ${subjectName}. You are invited to add your reaction to theirs.`
    : `When you visit, you will see the voices of everyone else who chose to be part of this story. You can respond to theirs, and they may respond to yours.`

  // ── Discovery note: introduces LC to first-time visitors (2 lines max) ───
  const discoveryNote = `LegacyCapsule gathers every voice, photograph, and memory for life's most significant occasions — and assembles them into a keepsake publication worthy of the moment. What you have contributed today will appear in ${subjectName}'s final publication.`

  return {
    subjectLine,
    openingLine,
    bodyIntro,
    permanenceStatement,
    returnCta,
    reactionNudge,
    discoveryNote,
  }
}

// ═══ SECTION 4 — EMAIL TEMPLATE ═══
// Premium HTML email. Inline styles throughout for email client compatibility.
// Dark outer (#0D0820) + cream card (#F5F3EE) + gold accent (#D4AE2A).
// FROM: noreply@itslegacycapsule.com — confirmed sending domain.
// ECS compliance: all five pillars applied. All forbidden phrases removed.
// Bugs fixed vs previous version:
//   - Template literal interpolation in memorial bodyIntro (was single-quoted, never resolved)
//   - Duplicate Stories invitation block removed
//   - contributorName now used in greeting (was ignored)
//   - Closing now permanence statement, not naked link

function buildSubmissionEmail({
  contributorName,
  subjectName,
  eventType,
  tributeText,
  editLink,
  capsuleUrl,
}: {
  contributorName: string
  subjectName: string
  eventType: string
  tributeText: string
  editLink: string
  capsuleUrl: string
}): { html: string; subject: string } {
  const lang = getParticipationLanguage(eventType)
  const isMemorial = eventType === 'memorial'

  const copy = buildEventCopy(eventType, subjectName, contributorName, lang.singular)

  // Trim tribute preview to 300 chars
  const tributePreview = tributeText.length > 300
    ? tributeText.slice(0, 300) + '…'
    : tributeText

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${copy.subjectLine}</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- ── Brand mark ─────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:11px;color:rgba(212,174,42,0.6);letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">
                LegacyCapsule
              </p>
              <p style="margin:5px 0 0;font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:0.12em;">
                itslegacycapsule.com
              </p>
            </td>
          </tr>

          <!-- ── Main card ──────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:44px 40px;">

              <!-- Ornament -->
              <p style="margin:0 0 24px;text-align:center;font-size:28px;color:#D4AE2A;">✦</p>

              <!-- Personal greeting -->
              <p style="margin:0 0 6px;font-size:13px;color:#6b6b80;text-align:center;letter-spacing:0.03em;">
                ${copy.openingLine}
              </p>

              <!-- Heading -->
              <h1 style="margin:0 0 20px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.35;">
                Your voice is now part of this story.
              </h1>

              <!-- Body intro -->
              <p style="margin:0 0 28px;font-size:14px;color:#4a4a5e;text-align:center;line-height:1.8;">
                ${copy.bodyIntro}
              </p>

              <!-- Gold divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 28px;"></div>

              <!-- Their words preview -->
              <div style="background-color:#FFFFFF;border-radius:10px;border-left:3px solid #D4AE2A;padding:18px 22px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;color:#9090a0;text-transform:uppercase;letter-spacing:0.12em;">
                  Your ${lang.singular}
                </p>
                <p style="margin:0;font-size:14px;color:#2a2a3e;line-height:1.8;font-style:italic;">
                  &ldquo;${tributePreview}&rdquo;
                </p>
              </div>

              <!-- What happens now -->
              <div style="background-color:rgba(212,174,42,0.07);border-radius:10px;padding:18px 22px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;color:#B8960C;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">
                  What happens now
                </p>
                <p style="margin:0;font-size:13px;color:#4a4a5e;line-height:1.7;">
                  The organiser will review your ${lang.singular.toLowerCase()}. Once approved, it will join the voices being assembled into ${subjectName}'s permanent record — a keepsake publication that will be shared with everyone who is part of this occasion.
                </p>
              </div>

              <!-- LC discovery note — introduces platform to first-time visitors -->
              <div style="border-radius:10px;border:1px solid rgba(212,174,42,0.2);padding:18px 22px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;color:#B8960C;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">
                  About LegacyCapsule
                </p>
                <p style="margin:0;font-size:13px;color:#4a4a5e;line-height:1.7;">
                  ${copy.discoveryNote}
                </p>
              </div>

              <!-- Soft gold divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 26px;"></div>

              <!-- Return visit CTA — drives repeat engagement -->
              <div style="text-align:center;margin-bottom:22px;">
                <p style="margin:0 0 14px;font-size:13px;color:#5a5a70;line-height:1.75;">
                  ${copy.returnCta}
                </p>
                <a href="${capsuleUrl}"
                  style="display:inline-block;padding:11px 32px;border-radius:8px;background-color:#1a1a2e;color:#D4AE2A;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.06em;">
                  Return to ${subjectName}&rsquo;s Record &rarr;
                </a>
              </div>

              <!-- Reaction nudge -->
              <div style="text-align:center;margin-bottom:26px;">
                <p style="margin:0;font-size:13px;color:#8080a0;line-height:1.7;font-style:italic;">
                  ${copy.reactionNudge}
                </p>
              </div>

              <!-- Soft gold divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.2),transparent);margin:0 0 24px;"></div>

              <!-- Edit link — secondary action -->
              <div style="text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 10px;font-size:12px;color:#8080a0;line-height:1.65;">
                  Need to adjust something before it is approved?
                </p>
                <a href="${editLink}"
                  style="display:inline-block;padding:9px 26px;border-radius:8px;border:1px solid #D4AE2A;color:#B8960C;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.05em;">
                  Edit My ${lang.singular}
                </a>
                <p style="margin:8px 0 0;font-size:11px;color:#b0b0c0;">
                  This link is valid for 7 days and is personal to you.
                </p>
              </div>

              <!-- Stories invitation — one block only, no duplicate -->
              ${!isMemorial ? `
              <div style="text-align:center;margin-bottom:16px;">
                <p style="margin:0 0 10px;font-size:13px;color:#6b6b80;line-height:1.7;">
                  Have a longer story about ${subjectName}?<br/>
                  The Stories room is where every chapter finds its place.
                </p>
                <a href="${capsuleUrl}/stories"
                  style="display:inline-block;padding:9px 24px;border-radius:8px;border:1px solid rgba(212,174,42,0.3);color:rgba(180,140,20,0.9);font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.04em;">
                  Share a Story &rarr;
                </a>
              </div>
              ` : ''}

              <!-- Soft gold divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.15),transparent);margin:0 0 22px;"></div>

              <!-- Permanence closing — ECS: close with permanence, never support -->
              <p style="margin:0;font-size:13px;color:#5a5a70;text-align:center;line-height:1.8;font-style:italic;">
                ${copy.permanenceStatement}
              </p>

            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.12em;text-transform:uppercase;">
                VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
              </p>
              <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.25);">
                itslegacycapsule.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()

  return { html, subject: copy.subjectLine }
}

// ═══ SECTION 5 — ROUTE HANDLER ═══

export async function POST(req: NextRequest) {
  try {
    const {
      contributionId,
      capsuleSlug,
      contributorName,
      contributorEmail,
      subjectName,
      eventType,
      tributeText,
    } = await req.json()

    // ── Validate required fields ───────────────────────────────────────────
    if (!contributionId || !capsuleSlug || !contributorName || !contributorEmail) {
      return NextResponse.json(
        { error: 'contributionId, capsuleSlug, contributorName and contributorEmail are required' },
        { status: 400 }
      )
    }

    // ── Generate edit token ────────────────────────────────────────────────
    const token = await createEditToken(contributionId)
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
    const editLink  = `${appUrl}/for/${capsuleSlug}/edit/${token}`
    const capsuleUrl = `${appUrl}/for/${capsuleSlug}`

    // ── Build email (html + subject returned together) ────────────────────
    const { html, subject } = buildSubmissionEmail({
      contributorName,
      subjectName:  subjectName  ?? 'the honouree',
      eventType:    eventType    ?? '',
      tributeText:  tributeText  ?? '',
      editLink,
      capsuleUrl,
    })

    // ── Send via Resend ────────────────────────────────────────────────────
    const { error: sendError } = await resend.emails.send({
      from: 'LegacyCapsule <noreply@itslegacycapsule.com>',
      to:   contributorEmail,
      subject,
      html,
    })

    if (sendError) {
      console.error('[submission-confirmation] Resend error:', sendError)
      return NextResponse.json({ error: 'We could not send your confirmation just now. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[submission-confirmation] Route error:', err)
    return NextResponse.json({ error: 'Something went wrong on our end. Please try again.' }, { status: 500 })
  }
}