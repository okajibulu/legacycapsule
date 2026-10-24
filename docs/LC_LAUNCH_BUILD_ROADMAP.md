LC_LAUNCH_BUILD_ROADMAP.md
LegacyCapsule — Launch Build Roadmap
Post-CG05 Architecture Freeze
VALNEX, UNIPESSOAL LDA · RevoWorldTech
July 2026

═══════════════════════════════════════════════════════════════
GOVERNING STANDARD
═══════════════════════════════════════════════════════════════

Build Pass Mark:
Every surface must feel premium, like the platform understands
its clients. Self-service. Emotionally intelligent. Zero need
for customer support during launch.

Architecture Authority:
RW00–RW04 (platform) + LC00–LC10 (product)
No architectural changes without review.

Model guidance:
Use Opus for complex builds and premium UI.
Use Sonnet for patches, docs and analysis.

═══════════════════════════════════════════════════════════════
MILESTONE 1 — COMMERCIAL FLOW INTEGRITY
Priority: Critical — blocks revenue
═══════════════════════════════════════════════════════════════

These items directly block paying customers from completing
purchases. Nothing else matters until these pass.

M1.1  Stripe checkout — verified working end to end
      Status: Fixed (bundle route currency patch deployed)
      Verify: Complete a test purchase, confirm feature activates

M1.2  Paystack checkout — working end to end
      Status: Placeholders in place — needs live test
      Owner: Founder action (business account required)

M1.3  Booking flow capsule lifecycle
      Status: Partially fixed (pending state deployed)
      Remaining:
        · Pre-booked capsule email — "reserved" not "live"
        · Gift capsule email — separate wording
        · Free capsule confirmation — "ready when first tribute arrives"
      Build: Email template patches (3 email variants)

M1.4  Feature activation on payment.verified
      Status: Feature Unlocker exists — needs end-to-end test
      Verify: Pay → webhook fires → component added to capsule

M1.5  Community Stories free by default
      Status: lc_pricing unpublished, book page patched
      Remaining: Verify community_stories in default components
      on all new capsule creation paths

M1.6  lc_pricing canonical and published
      Status: 10 add-ons live, 6 Phase 2 as draft
      Verify: ServicesTab shows prices, checkboxes respond
      Currency: Confirm NGN shows for Nigerian IPs

══════════════════════════════════════════════════════════════
MILESTONE 2 — BOOKING FLOW PREMIUM PASS
Priority: Critical — first impression for every new organiser
═══════════════════════════════════════════════════════════════

The booking flow is the first experience a paying organiser has.
It must feel considered, warm and premium at every step.

M2.1  Step 1 — Event type selection
      · "Other Event" custom input field (built — needs test)
      · Event type description copy review — emotionally resonant?
      · Transition to Step 2 smooth and clear

M2.2  Step 2 — Capsule details
      · Honouree name field — placeholder warm, not clinical
      · Event date — clear why it matters
      · Review all field labels and placeholder copy

M2.3  Step 3 — Services selection
      · Free services listed with FREE badge (built)
      · Paid add-ons with prices responding (built — test)
      · Service descriptions expandable inline (not navigating away)
      · Running total visible
      · "Learn more" opens in new tab, not same window

M2.4  Step 4 — Verification
      · Email verification copy — warm, anticipatory
      · Resend option clearly available
      · Error states handled gracefully

M2.5  Confirmation screen
      · Three distinct variants: Free / Pre-booked / Gift
      · Copy reflects what actually just happened
      · Next step is crystal clear for each variant
      · Share link prominent but not pushy

M2.6  Post-booking emails
      · Free capsule: "Your capsule is ready"
      · Pre-booked: "Your capsule is reserved"
      · Gift: "A capsule has been created for [name]"
      · All emails: premium HTML, no plain text fallbacks

══════════════════════════════════════════════════════════════
MILESTONE 3 — MANAGE DASHBOARD PREMIUM PASS
Priority: High — daily tool for every organiser
═══════════════════════════════════════════════════════════════

M3.1  ServicesTab two-column layout
      · Price column aligned correctly (no shifting on scroll)
      · Checkboxes respond, prices show in correct currency
      · Cart checkout works without falling back to enquiry form
      · Active services show management UI, not unlock prompts
      · Full Details links open in new tab

M3.2  Event Phases
      · Phase limit gates correctly (free=1, paid=2, +1 per purchase)
      · "Phase limit reached" message links to Additional Phase in ServicesTab
      · QR codes use context-aware /api/qr/[token] route
      · D-Day capture window information shown clearly

M3.3  Guest Management
      · Access Code System tabs (Guest List / Access Codes / Ushers / Metrics)
      · Usher PIN generation and display (shown once clearly)
      · Check-in page URL surfaced with QR

M3.4  Live Wall (Gift of Honour → access from dashboard)
      · Display URL + QR permanently visible in ServicesTab
      · Copy/preview buttons working

M3.5  Publication Editor
      · Back navigation working
      · Control panel theme aligned with dashboard
      · Section list includes Community Memories & Stories
      · Honouree photo renders in cover
      · Navigation within publication working

M3.6  Overview page (manage/[slug])
      · Services list read-only with correct active/locked states
      · "Manage & Unlock Services" button routes to ServicesTab
      · No unlock buttons with enquiry form links anywhere

══════════════════════════════════════════════════════════════
MILESTONE 4 — CONTRIBUTOR EXPERIENCE PREMIUM PASS
Priority: High — every guest of every event uses this
═══════════════════════════════════════════════════════════════

M4.1  Tribute Wall
      · Character limit 2000 enforced on new submissions
      · Community Stories nudge in placeholder and above textarea
      · Audio/Video tribute recording UI (if purchased)
      · World map rendering correctly
      · Tribute card layout premium on all screen sizes

M4.2  Submit tribute flow (/for/[slug]/submit)
      · Character limit 2000
      · Community Stories nudge
      · Form fields warm and intuitive
      · Submission confirmation emotionally resonant
      · Email confirmation sent on submit

M4.3  Community Memories & Stories room
      · Dark premium theme (rebuilt — verify on device)
      · Empty state shows correctly
      · Truncation working (3 lines + Read More)
      · EOH section visible when activated
      · Admin response shows when present
      · Share strip working

M4.4  D-Day upload portal (/for/[slug]/dday)
      · Three-option flow (photo / tribute / both)
      · Mobile-first — test on actual phone
      · Email incentive for publication copy
      · Success screen with capsule link

M4.5  Honouree portal
      · Family rep access working
      · Tribute viewing clean and premium

M4.6  Event story pages
      · Phase list clear and well-styled
      · D-Day detection working (Today badge)
      · Context-aware QR working (redirects correctly)

══════════════════════════════════════════════════════════════
MILESTONE 5 — PUBLICATION PREMIUM PASS
Priority: High — the most visible output of the platform
═══════════════════════════════════════════════════════════════

M5.1  Cover page
      · Honouree photo featured prominently
      · Event tag and date displaying
      · Theme rendering premium

M5.2  Content sections
      · Honouree profile rendered (not empty placeholder)
      · Tributes section premium card layout
      · Community Memories & Stories section (topic chapters)
      · D-Day gallery section
      · Who Attended section

M5.3  Publication navigation
      · Back link working from editor
      · Navigation within publication working
      · Print-to-PDF browser path tested

M5.4  Distribution
      · Email distribution sends to all contributors
      · Edit link included in Keepsake Card email
      · Render token validated before access

══════════════════════════════════════════════════════════════
MILESTONE 6 — ACCESS CODE SYSTEM COMPLETE
Priority: Medium-High — premium event day feature
═══════════════════════════════════════════════════════════════

M6.1  Hall configuration wizard
      · AccessCodeSetup component working
      · Config saved and retrieved

M6.2  Code generation
      · Generate codes for all guests (one click)
      · Codes unique per capsule
      · QR payload correct format

M6.3  Send codes
      · Email with QR image and numeric code
      · Premium email template
      · Status updates (generated → sent)

M6.4  Usher check-in page
      · PIN entry clean on mobile
      · Scan/type interface working
      · Result display (admitted / already used / invalid)
      · Walk-in registration working

M6.5  Live metrics dashboard
      · Auto-refresh every 15 seconds
      · VVIP outstanding list
      · Recent arrivals feed

M6.6  Access cards
      · Card print layout (browser print)
      · QR codes on cards use context-aware route

══════════════════════════════════════════════════════════════
MILESTONE 7 — ACCOUNT AND DATA INTEGRITY
Priority: Medium — correctness and trust
═══════════════════════════════════════════════════════════════

M7.1  Account deletion scoped to single capsule
      · Delete query uses capsule_id not email
      · Other capsules belonging to same email unaffected

M7.2  Soft delete with 60-day recovery
      · Deleted capsules flagged not destroyed
      · LCAdmin can recover within 60 days

M7.3  Contributor edit flow
      · edit_token generated on submission
      · Edit link in Keepsake Card email
      · Edit page working at /for/[slug]/edit/[token]

M7.4  Correction request flow
      · 4 templates working
      · Max 2 requests before flagging
      · Flagged state shows in LCAdmin moderation

M7.5  OG image
      · Honouree photo renders in WhatsApp/social preview
      · Test after upload and 24hr cache clear

══════════════════════════════════════════════════════════════
MILESTONE 8 — LIVE WALL AND EVENT DAY
Priority: Medium — event day differentiator
═══════════════════════════════════════════════════════════════

M8.1  Display page (/for/[slug]/display)
      · Full-screen layout premium on large screens
      · Realtime subscription working
      · Spotlight animation on new arrivals
      · D-Day photo strip showing

M8.2  Approval triggers broadcast
      · Existing approval route fires Realtime broadcast
      · Display page receives and animates new arrivals

M8.3  Display URL surfaced in ServicesTab
      · QR code of display URL visible
      · Copy and preview buttons working

══════════════════════════════════════════════════════════════
MILESTONE 9 — PLATFORM QUALITY PASS
Priority: Medium — brand standard
═══════════════════════════════════════════════════════════════

M9.1  Copy audit
      · Every email, confirmation, placeholder reviewed
      · No "Expression of Honour" anywhere client-facing
      · No "Coming soon" on active features
      · Tribute character limit messaging everywhere needed
      · Community Stories nudge consistent

M9.2  Theme consistency
      · All manage dashboard components use dark gold theme
      · No white/purple Tailwind components visible in manage flow
      · All inline styles consistent with design tokens

M9.3  Mobile-first verification
      · Tribute wall on phone
      · Submit flow on phone
      · D-Day portal on phone
      · Booking flow on phone
      · Manage dashboard key screens on phone

M9.4  Error state quality
      · All error messages warm and actionable
      · No raw API errors visible to users
      · Loading states present on all async operations

M9.5  Empty states
      · Every list has a warm empty state
      · Empty states guide the next action

══════════════════════════════════════════════════════════════
MILESTONE 10 — LAUNCH READINESS
Priority: Critical — pre-launch checklist
═══════════════════════════════════════════════════════════════

M10.1  Stripe live test — real card, real payment
M10.2  Paystack live test — Nigerian card, real payment
M10.3  Feature activation end-to-end verified
M10.4  Webhook reliability confirmed
M10.5  Publication browser-print tested on a live capsule
M10.6  All 10 add-on prices published in LCAdmin
M10.7  render_token column verified in publications table
M10.8  Resend email domains verified
M10.9  Vercel environment variables all set for production
M10.10 Domain and SSL confirmed on itslegacycapsule.com

═══════════════════════════════════════════════════════════════
BUILD ORDER RECOMMENDATION
═══════════════════════════════════════════════════════════════

Week 1 — Revenue and booking integrity
    M1 complete, M2 complete

Week 2 — Manage dashboard and contributor experience
    M3 complete, M4 complete

Week 3 — Publication and access codes
    M5 complete, M6 complete

Week 4 — Data integrity, live wall, quality pass
    M7, M8, M9 complete

Week 5 — Launch readiness
    M10 complete — commercial launch

═══════════════════════════════════════════════════════════════
WHAT DETERMINES BUILD PASS MARK
═══════════════════════════════════════════════════════════════

Each milestone earns a pass when:

1.  It works correctly on a real device.
2.  The copy feels warm, intelligent and premium.
3.  The user never needs to contact support to complete the task.
4.  Error states are handled gracefully.
5.  The flow feels like it was designed for this exact user
    at this exact moment in their event journey.

Premium is not decoration.
Premium is the experience of being understood.
