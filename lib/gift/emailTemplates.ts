// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  lib/gift/emailTemplates.ts
// PURPOSE:    Gift Collection System — email HTML builder for credential delivery
//             buildGiftCredentialEmail() — premium, mobile-first credential email
// SPEC:       GCS-SPEC-001-AMD-001 Part Three Sections 3.1, 3.4 — LC ECS standard
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.21
// DATE:       19 August 2026
//
// RULES (LC ECS):
//   • Premium, warm, deliberate tone — never transactional
//   • Numeric code large and prominent — the primary action element
//   • Donor names shown only if donor_name_visible = true per item
//   • No marketing language
// ═══════════════════════════════════════════════════════════════════════════════


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface EntitlementForEmail {
  quantity_entitled: number
  gift_manifest_items: {
    item_name:          string
    donor_name:         string | null
    donor_name_visible: boolean
  }
}

interface BuildGiftCredentialEmailParams {
  guestName:     string
  numericCode:   string
  credentialUrl: string
  entitlements:  EntitlementForEmail[]
  eventName:     string
  eventDate:     string | null
  eventLocation: string | null
}


// ═══ SECTION 2 — Date formatter ════════════════════════════════════════════════

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}


// ═══ SECTION 3 — Gift list HTML ════════════════════════════════════════════════

function buildGiftListHtml(entitlements: EntitlementForEmail[]): string {
  if (!entitlements.length) return ''

  const rows = entitlements.map(e => {
    const item        = e.gift_manifest_items
    const donorLine   = item.donor_name_visible && item.donor_name
      ? `<div style="color:#9d8f7a;font-size:13px;margin-top:2px;">Donated by ${item.donor_name}</div>`
      : ''

    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a1f4a;">
          <div style="color:#f0e6c8;font-size:15px;">
            <span style="color:#E2C36B;font-weight:600;">×${e.quantity_entitled}</span>
            &nbsp;${item.item_name}
          </div>
          ${donorLine}
        </td>
      </tr>`
  }).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
      <tbody>${rows}</tbody>
    </table>`
}


// ═══ SECTION 4 — Main email builder ════════════════════════════════════════════

export function buildGiftCredentialEmail({
  guestName,
  numericCode,
  credentialUrl,
  entitlements,
  eventName,
  eventDate,
  eventLocation,
}: BuildGiftCredentialEmailParams): string {
  const formattedDate = formatEventDate(eventDate)
  const giftListHtml  = buildGiftListHtml(entitlements)

  const locationLine = eventLocation
    ? `<div style="color:#9d8f7a;font-size:14px;margin-top:4px;">${eventLocation}</div>`
    : ''

  const dateLine = formattedDate
    ? `<div style="color:#9d8f7a;font-size:14px;margin-top:4px;">${formattedDate}</div>`
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Gift Collection Details — ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a061a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a061a;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background-color:#12092e;border-radius:16px;
                      border:1px solid #2a1f4a;overflow:hidden;">

          <!-- Gold top border -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#E2C36B,#c9a84c);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:36px 32px 24px;">
              <div style="color:#E2C36B;font-size:11px;letter-spacing:2px;text-transform:uppercase;
                          margin-bottom:12px;">Gift Collection</div>
              <div style="color:#f0e6c8;font-size:24px;font-weight:700;line-height:1.3;">
                Hello, ${guestName}
              </div>
              <div style="color:#9d8f7a;font-size:15px;margin-top:8px;line-height:1.5;">
                Your gifts are ready to be collected at <strong style="color:#f0e6c8;">${eventName}</strong>.
                Everything you need is on this page.
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#2a1f4a;"></div></td></tr>

          <!-- Collection code — large and prominent -->
          <tr>
            <td style="padding:28px 32px;">
              <div style="color:#9d8f7a;font-size:12px;letter-spacing:1.5px;
                          text-transform:uppercase;margin-bottom:10px;">Your Collection Code</div>
              <div style="background:#1a0c40;border:1px solid #E2C36B;border-radius:12px;
                          padding:20px;text-align:center;">
                <div style="color:#E2C36B;font-size:52px;font-weight:700;
                            letter-spacing:12px;line-height:1;">${numericCode}</div>
                <div style="color:#9d8f7a;font-size:12px;margin-top:8px;">
                  Share this code at the gift collection stand if you do not have your phone.
                </div>
              </div>
            </td>
          </tr>

          <!-- Gift list -->
          ${entitlements.length > 0 ? `
          <tr>
            <td style="padding:0 32px 8px;">
              <div style="color:#9d8f7a;font-size:12px;letter-spacing:1.5px;
                          text-transform:uppercase;margin-bottom:4px;">Your Gifts</div>
              ${giftListHtml}
            </td>
          </tr>` : ''}

          <!-- CTA — credential page -->
          <tr>
            <td style="padding:8px 32px 28px;">
              <div style="color:#9d8f7a;font-size:13px;margin-bottom:14px;line-height:1.5;">
                Open your personal collection page on event day — it includes your QR code for
                the fastest check-in at the stand.
              </div>
              <a href="${credentialUrl}"
                 style="display:block;background:#E2C36B;color:#0a061a;text-align:center;
                        font-weight:700;font-size:15px;padding:14px 24px;border-radius:10px;
                        text-decoration:none;">
                Open My Gift Collection Page →
              </a>
            </td>
          </tr>

          <!-- Event details -->
          ${(formattedDate || eventLocation) ? `
          <tr>
            <td style="padding:0 32px;"><div style="height:1px;background:#2a1f4a;"></div></td>
          </tr>
          <tr>
            <td style="padding:20px 32px;">
              <div style="color:#9d8f7a;font-size:12px;letter-spacing:1.5px;
                          text-transform:uppercase;margin-bottom:8px;">Event Details</div>
              <div style="color:#f0e6c8;font-size:14px;font-weight:600;">${eventName}</div>
              ${dateLine}
              ${locationLine}
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#0a061a;padding:20px 32px;border-top:1px solid #2a1f4a;">
              <div style="color:#5a4f6a;font-size:12px;text-align:center;line-height:1.6;">
                Managed by LegacyCapsule · itslegacycapsule.com<br />
                A RevoWorldTech Platform · VALNEX, UNIPESSOAL LDA
              </div>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}