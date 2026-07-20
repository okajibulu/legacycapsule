/* =========================================================
   FILE PATH: app/help/page.tsx — Knowledgebase v3
   
   UPDATED: AI12 · Claude Opus 4.6 · 20 July 2026
   v3 changes:
   - Voice Tributes corrected to 60 seconds (was 30s)
   - Video Tributes corrected to 60 seconds (was 30s)
   - Guest Management fully rewritten: RSVP bundled, all participant
     types listed, event-type-aware segments, VVIP protocol,
     configurable RSVP form, table & seating
   - Access Codes updated: card generation, auto-email, three-scope
     code generation, VVIP priority alerts, usher PIN
   - Extended Validity: 3 months free / 6 months pre-booked (was 90 days)
   - Additional Phase: free=1, paid=2 (was missing this distinction)
   - Getting Started updated for free/pre-booked distinction
   - Tribute Wall updated for free/pre-booked validity distinction
   - Community Stories refundNote removed (it's free)
   - All copy from organiser's mental model, not system perspective
========================================================= */
'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ─────────────────────────────────────────────────────────
// SECTION 1 — Design tokens
// ─────────────────────────────────────────────────────────

const gold       = '#E2C36B'
const goldFaint  = 'rgba(226,195,107,0.10)'
const goldMuted  = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textBody   = 'rgba(255,255,255,0.70)'
const textFaint  = 'rgba(255,255,255,0.30)'
const cardBg     = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(255,255,255,0.07)'

// ─────────────────────────────────────────────────────────
// SECTION 2 — Knowledge base sections
// All free services + all premium add-ons documented here.
// IDs match service keys used in ServicesTab and booking flow.
// ─────────────────────────────────────────────────────────

const SECTIONS = [

  // ═══ Always free ═══

  {
    id: 'getting-started',
    icon: '◈',
    title: 'Getting Started',
    subtitle: 'Set up your event in under three minutes — no technical skills needed',
    badge: null,
    articles: [
      { q: 'Who is LegacyCapsule for?', a: 'LegacyCapsule is for anyone organising an event that matters. Private individuals planning a milestone birthday, a memorial, a wedding, or a retirement. Professional event planners who want a premium tool that handles guest management, access control, attire coordination, and event-day operations without the complexity. Family members and aspiring planners stepping up to organise for the first time and needing a platform that guides them through every detail. Every service is designed to be used without technical knowledge — if you can use WhatsApp, you can use LegacyCapsule.' },
      { q: 'How do I create a capsule?', a: 'Go to itslegacycapsule.com/book and follow the steps. Tell us who the event is for, what type of occasion it is, and give your capsule a name. Your tribute wall is ready immediately — no payment required. The whole process takes under three minutes.' },
      { q: 'Do I need to create an account?', a: 'No account is required to create a free capsule. You verify your email address during the process, and that email becomes your access key. To return to your dashboard, go to /signin and enter your email — we send you a 4-character code each time.' },
      { q: 'How do I share my capsule with guests?', a: 'Once your capsule is set up, your dashboard shows a shareable link in the format itslegacycapsule.com/for/[your-name]. Share it via WhatsApp, email, or any channel you use. No app download required for guests.' },
      { q: 'What does a free capsule include?', a: 'A free capsule includes a live tribute wall with a world map showing where every tribute came from, a profile page for the honouree, Community Memories & Stories room, a Family Rep portal, one event phase, and 3 months of online availability from when the first tribute arrives. No credit card required.' },
      { q: 'What does a pre-booked capsule include?', a: 'A pre-booked capsule includes everything a free capsule does, plus two event phases (instead of one), 6 months of online availability (instead of 3), and whichever premium services you choose to add at booking. Your capsule is reserved immediately and goes live when the first tribute arrives.' },
      { q: 'Can contributors leave tributes from outside Nigeria?', a: 'Yes. Anyone anywhere in the world with the link can leave a tribute. No account, no app, no payment. The world map shows where every voice came from.' },
      { q: 'When does my capsule go live?', a: 'Your capsule comes to life when the first tribute arrives. Until then, it is set up and waiting — the link is shareable but no content shows yet. This means you can set everything up at your own pace before sharing with guests.' },
    ]
  },

  {
    id: 'tribute_wall',
    icon: '◎',
    title: 'Tribute Wall & World Map',
    subtitle: 'The live collection of voices for your event',
    badge: 'Always Free',
    articles: [
      { q: 'What is the tribute wall?', a: 'The tribute wall is a live page where guests leave written tributes, photos, voice recordings, and video messages for the person being honoured. It updates in real time as you approve submissions. It can be displayed on a screen during the event itself. As tributes arrive, a world map lights up with pins showing where each voice came from.' },
      { q: 'What is the world map?', a: 'Every tribute is marked with the location it came from. The world map builds a living picture of how far this person\'s story reaches — a pin in Lagos, a message from London, a memory from Toronto. The map is part of every capsule and requires no setup.' },
      { q: 'How does moderation work?', a: 'Every tribute comes to you first. From your dashboard, you read each submission and approve or decline it with one tap. Only approved tributes appear on the public wall. If a tribute needs adjustment, you can request a correction from the contributor before approving.' },
      { q: 'Can I display the wall during my event?', a: 'Yes. Open itslegacycapsule.com/for/[your-name]/display on any screen at your venue. Approved tributes animate onto the screen in real time as your guests submit them. Share the display link with your AV team in advance.' },
      { q: 'Can contributors edit their tribute after submitting?', a: 'Contributors receive an edit link in their submission confirmation email. After editing, the tribute returns to your moderation queue for re-approval before going live again.' },
      { q: 'What is the tribute character limit?', a: 'Tributes are limited to 500 characters — personal, concise, and meaningful. For longer stories, memories, and photos, contributors can use the Community Memories & Stories room within the same capsule.' },
      { q: 'How long does my capsule stay online?', a: 'Free capsules stay online for 3 months from when the first tribute arrives. Pre-booked capsules stay online for 6 months. After that, your capsule becomes read-only — existing content is preserved but no new tributes can be submitted. You can extend this from your dashboard using Extended Validity.' },
    ]
  },

  {
    id: 'community_stories',
    icon: '◇',
    title: 'Community Memories & Stories',
    subtitle: 'A dedicated room for longer stories and memories',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Community Memories & Stories room?', a: 'It is a dedicated space within your capsule where contributors share longer stories, memories, and lessons — not just brief tributes. Stories are organised by topic, making it easy to read what different groups of people remember about the honouree.' },
      { q: 'How is it different from the tribute wall?', a: 'The tribute wall is for concise personal messages — up to 500 characters. The Community Memories & Stories room is for longer, richer content — stories, memories, photos, and reflections that go deeper than a tribute allows.' },
      { q: 'Who can see it?', a: 'Anyone with your capsule link can access the Community Memories & Stories room. Stories go through the same moderation process as tributes — you approve each one before it appears.' },
      { q: 'Is it included in the Digital Publication?', a: 'Yes. When you generate a publication, Community Memories & Stories are automatically organised into chapters by topic and included as a dedicated section of the publication.' },
      { q: 'Is it free?', a: 'Yes. Community Memories & Stories is included in every capsule at no cost — free and pre-booked alike. There is nothing to activate or pay for.' },
    ]
  },

  {
    id: 'profile',
    icon: '◐',
    title: 'Honouree Profile',
    subtitle: 'A full canvas for the person being celebrated',
    badge: 'Always Free',
    articles: [
      { q: 'What is the honouree profile?', a: 'The honouree profile is a dedicated page within your capsule where you share the story of the person being celebrated. Add a biography, milestones, a featured photo, a gallery, and more. Think of it as a beautifully designed portrait page — permanent and shareable.' },
      { q: 'How do I edit the profile?', a: 'From your manage dashboard, go to the Profile tab. Add, edit, and reorder sections — biography, milestones, gallery. Changes go live immediately.' },
      { q: 'Can I add multiple photos?', a: 'Yes. The profile supports a featured hero photo, a full gallery, and photos submitted by contributors. All photos are stored securely.' },
      { q: 'Is the profile public?', a: 'Yes. The honouree profile is publicly accessible to anyone with the capsule link.' },
    ]
  },

  {
    id: 'family_rep_portal',
    icon: '◑',
    title: 'Family Rep Portal',
    subtitle: 'Private access for the family representative',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Family Rep Portal?', a: 'A private, token-gated portal for the family representative of the honouree. They can view all tributes, acknowledgements, and expressions of support — without needing access to the full organiser dashboard.' },
      { q: 'How does the family representative access it?', a: 'The organiser generates a secure link from the dashboard and shares it with the family representative. The link expires after a set period for security.' },
      { q: 'What can the family representative see?', a: 'Approved tributes, Gift of Honour acknowledgements, contributor details, and summary statistics. They cannot approve, decline, or edit content — that remains with the organiser.' },
    ]
  },

  // ═══ Premium add-ons — Tribute Experience ═══

  {
    id: 'audio_tributes',
    icon: '🎙',
    title: 'Voice Tributes',
    subtitle: 'Hear the voices of the people who showed up',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What are Voice Tributes?', a: 'Voice Tributes allow contributors to record a personal voice message directly in the browser — no app download needed. Each tribute can include one recording of up to 60 seconds. The recording appears in their tribute card on the wall. Hearing a familiar voice adds a dimension that text cannot replicate.' },
      { q: 'How does a contributor record?', a: 'On your tribute wall, contributors see a microphone option in the tribute form. They tap to record, tap to stop, preview their recording, and submit. It works on any smartphone or computer with a microphone.' },
      { q: 'What is the maximum recording length?', a: '60 seconds — long enough for a meaningful personal message, short enough to remain focused and personal.' },
      { q: 'Can a contributor submit both a written tribute and a voice recording?', a: 'Yes — they can include both in the same submission. The voice recording supplements the written tribute and both appear together in the tribute card.' },
      { q: 'Are voice tributes moderated?', a: 'Yes — all voice tributes go through the same approval queue as written tributes. You listen to them before they appear publicly on the wall.' },
      { q: 'Do contributors need to pay?', a: 'No. Once Voice Tributes are activated on your capsule, all contributors can use them at no additional cost. You pay once to unlock the feature for your event.' },
    ]
  },

  {
    id: 'video_tributes',
    icon: '🎬',
    title: 'Video Tributes',
    subtitle: 'See the faces of the people who showed up',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What are Video Tributes?', a: 'Video Tributes allow contributors to upload a short video message from their phone or computer. Each tribute can include one video of up to 60 seconds. The video appears in their tribute card with a thumbnail and play button. Seeing someone\'s face as they speak adds a dimension that no written or audio tribute can replicate.' },
      { q: 'How does a contributor submit a video?', a: 'On your tribute wall, contributors see an option to attach a video to their tribute. They record on their phone camera and upload the file. The video appears in their tribute card after your approval.' },
      { q: 'What is the maximum video length?', a: '60 seconds. This encourages contributors to be concise and personal — the most memorable video tributes are usually under a minute.' },
      { q: 'What video formats are supported?', a: 'MP4 (the standard format from all smartphone cameras) is fully supported. Most common video formats are accepted.' },
      { q: 'Can a contributor submit both a video and a written tribute?', a: 'Yes — they can include a written message, a photo, and a video in the same submission. All three appear in their tribute card.' },
      { q: 'Do contributors need to pay?', a: 'No. Once Video Tributes are activated on your capsule, all contributors can use them at no additional cost.' },
    ]
  },

  // ═══ Premium add-ons — Event Services ═══

  {
    id: 'guest_management',
    icon: '◉',
    title: 'Guest Management & Seating',
    subtitle: 'Everyone at your event — organised in one place',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Guest Management & Seating?', a: 'A complete guest coordination system built into your capsule. Manage everyone involved in your event — invited guests, family, VIPs, vendors, caterers, decorators, photographers, media teams, and volunteers. Collect RSVPs, assign tables, and know exactly who is expected and where they\'ll be. Includes RSVP tracking — no separate tool needed.' },
      { q: 'Who can I add to my guest list?', a: 'Anyone involved in your event: invited guests and family members, VIPs and VVIPs, media teams covering the occasion, vendors and suppliers (caterers, decorators, photographers, florists), volunteers and event helpers. The system manages everyone — not just social guests.' },
      { q: 'Does this include RSVP?', a: 'Yes. RSVP is built into Guest Management. You send invitations, guests confirm or decline, and their response updates your guest list automatically. No separate RSVP tool needed.' },
      { q: 'Can I customise the RSVP form?', a: 'Yes. Certain fields are always included — name, attendance, email. Others are on by default but you can switch them off. You can also add your own custom questions — for example, dietary needs, which phase they\'re attending, or whether they need accommodation.' },
      { q: 'Does the RSVP form know what kind of event I\'m running?', a: 'Yes. When you set up your capsule as a wedding, the RSVP form automatically offers guest segments like Bride\'s Guests and Groom\'s Guests. A memorial offers Immediate Family and Extended Family. A chieftaincy offers Chief\'s Family and Community Delegates. You can rename, remove, or add your own segments at any time.' },
      { q: 'How does VIP and VVIP management work?', a: 'When you mark a guest as VIP or VVIP, additional fields appear: PA or representative contact, expected entourage size, arrival protocol notes (such as who should receive them at the door), and private organiser notes. VVIPs are tracked separately on your dashboard — you always know who has confirmed, who is outstanding, and what preparations are needed.' },
      { q: 'Can a PA respond to an RSVP on behalf of a VIP?', a: 'Yes. The RSVP form allows someone to respond on behalf of another person. When a PA responds, their name and contact details are captured alongside the VIP\'s confirmed attendance and entourage details.' },
      { q: 'Does it include table and seating management?', a: 'Yes. You can create tables and sections, assign guests to seats, and see your seating plan at a glance. Your guest list and your seating plan stay connected — a guest who confirms their RSVP can be assigned to a table without entering their details twice.' },
      { q: 'Does it include Access Codes?', a: 'Guest Management and Access Codes are separate services. Guest Management covers your guest list, RSVPs, and seating coordination. Access Codes covers event-day entry verification and check-in. Many organisers use both together — your guest list feeds directly into code generation so you never re-enter names.' },
      { q: 'How many guests can I manage?', a: 'There is no fixed limit. The system is designed for events with hundreds of guests comfortably. For events over 500, contact us.' },
    ]
  },

  {
    id: 'access_codes',
    icon: '🔐',
    title: 'Access Code System',
    subtitle: 'Personal entry codes, usher check-in, and live arrival tracking',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is the Access Code System?', a: 'The Access Code System gives every guest a personal entry code — a QR code and a numeric backup. Your team checks guests in on the day with a simple scan or code lookup on their phone. You see live arrivals on your dashboard throughout the event. When a VIP arrives, you know immediately.' },
      { q: 'How do guests receive their codes?', a: 'Codes are emailed individually to each guest from your dashboard — no manual sending required. Each email contains a QR code image and a numeric code as backup. Guests who cannot have their QR scanned can give the number verbally to the usher.' },
      { q: 'Can I choose who gets a code?', a: 'Yes. When generating codes, you choose: everyone on your guest list, only guests who have confirmed they\'re coming, or specific guests you select individually. If you\'re using Guest Management, your RSVP confirmations feed directly into code generation.' },
      { q: 'Are access cards included?', a: 'Yes. You can generate beautifully formatted printable access cards for guests who prefer something physical. Each card includes the guest\'s name, their QR code, and event details.' },
      { q: 'How does the usher check-in interface work?', a: 'You generate a temporary PIN for each usher. They open the check-in page on their phone and enter the PIN to start checking guests in. They can scan QR codes or type numeric codes. Each check-in shows the guest\'s name and seating assignment, and logs the arrival permanently. No app to install — works in any phone browser.' },
      { q: 'What happens if a guest arrives without their code?', a: 'Ushers can search by name and check in manually. Walk-in guests without a code can be registered and admitted on the spot. All arrivals are logged regardless of method.' },
      { q: 'Can I see arrivals in real time?', a: 'Yes. Your dashboard shows a live arrivals view including total arrived, outstanding VVIPs, recent arrivals feed, and gate activity. When a VIP or VVIP checks in, a priority alert is surfaced so your team can respond appropriately.' },
      { q: 'Do I need Guest Management to use Access Codes?', a: 'Access Codes work best with Guest Management — your guest list feeds directly into code generation, so you never re-enter names. You can use Access Codes alone, but you would need to add guests manually before generating codes.' },
    ]
  },

  {
    id: 'attire',
    icon: '◐',
    title: 'Fabric & Attire Coordination',
    subtitle: 'Coordinated event attire — from selection to collection',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Fabric & Attire Coordination?', a: 'Fabric & Attire Coordination lets you manage coordinated clothing for your event directly through your capsule. Share fabric details, vendor information and collection instructions with your guests — and track who has collected their fabric without chasing anyone individually. Designed for events where coordinated dressing is a proud tradition, such as Aso-Ebi.' },
      { q: 'Can I offer multiple fabric options?', a: 'Yes — add as many fabric or attire options as your event requires. Each can have its own photo, description, price, and availability status.' },
      { q: 'Can guests outside Nigeria order?', a: 'Yes. Guests can designate a local representative who will collect the fabric on their behalf. Multiple guests can share the same representative address and orders are consolidated automatically.' },
      { q: 'How do I track orders and collections?', a: 'Your dashboard shows every order, payment status, and collection status in one place. You can see at a glance how many have ordered, how many have collected, and who is still outstanding — with VIP exceptions surfaced separately.' },
      { q: 'Does LegacyCapsule handle payment for fabric orders?', a: 'No. Payment collection for fabric orders happens through your own channels (bank transfer, etc.). LegacyCapsule tracks order and payment status but does not process the actual payment.' },
      { q: 'Can I set a cut-off date for orders?', a: 'Yes — you set a deadline after which new orders are no longer accepted. Existing orders placed before the deadline are preserved.' },
      { q: 'Is this only for Nigerian events?', a: 'No. While designed with Aso-Ebi traditions in mind, the system works for any event requiring coordinated attire — uniforms, themed dress codes, or cultural garments of any kind.' },
    ]
  },

  {
    id: 'ways_to_honour',
    icon: '✦',
    title: 'Gift of Honour',
    subtitle: 'A dignified, private channel for guests to express financial support',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Gift of Honour?', a: 'Gift of Honour creates a dignified, organised space within the capsule where guests can contribute financially to the occasion — whether towards the cost of the event, a gift for the honouree, or a family fund. It is not a crowdfunding page. It is a graceful, optional channel for guests who want to give more than words — built into the tribute experience naturally.' },
      { q: 'How do I set it up?', a: 'From your manage dashboard, go to Services and activate Gift of Honour. Then add your payment details — account name, bank, and account number. You can add multiple accounts for different banks or currencies.' },
      { q: 'How do guests use it?', a: 'Guests visiting your capsule see the Gift of Honour section with your payment details. They make a bank transfer directly, then acknowledge their gesture on the platform. You receive a daily digest summarising who contributed and the running total.' },
      { q: 'Does LegacyCapsule handle the money?', a: 'No. LegacyCapsule never touches any financial flow between you and your guests. All transfers go directly between your guest and your bank account. We provide only the display mechanism and the acknowledgement record. We take no transaction fee and handle no funds.' },
      { q: 'Are amounts shown publicly?', a: 'Never. Amounts are completely private. Only the family representative and organiser can see acknowledgement records. The tribute wall shows only that a Gift of Honour section exists.' },
      { q: 'Can I add a reference guide?', a: 'Yes. Add a reference guide — for example "Please use your name as reference" — which appears alongside your account details to help you reconcile incoming transfers.' },
    ]
  },

  // ═══ Premium add-ons — Memories ═══

  {
    id: 'publication',
    icon: '📖',
    title: 'Digital Publication',
    subtitle: 'Every voice, every memory — assembled into a permanent record',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is the Digital Publication?', a: 'The Digital Publication brings everything your guests contributed into a single, beautifully assembled record. Every written tribute, voice note, photograph, community memory, honouree profile, and event-day capture — laid out professionally and published as a document that can be shared, downloaded, and returned to for years.' },
      { q: 'What is included in the publication?', a: 'The publication includes your honouree profile, all approved tributes, Community Memories & Stories organised by topic chapter, event phase photographs, D-Day guest captures, and a who-attended section. You choose which sections to include and in what order.' },
      { q: 'Can I arrange the order of tributes?', a: 'Yes — the Publication Editor gives you full drag-and-drop control. Group tributes, insert photos between sections, exclude specific entries, and rearrange everything before generating.' },
      { q: 'How many design themes are available?', a: 'Five professional themes — Classic, Soft, Romantic, Vibrant, and Spiritual — each with its own typography, colour palette, and section styling. Choose the one that matches your occasion.' },
      { q: 'How is it distributed?', a: 'Once you are satisfied with the publication, one click sends it to every contributor who provided their email address. Each recipient gets a personal copy with a permanent access link. No printing, no postage, no design fees.' },
      { q: 'Is it suitable for printing?', a: 'Yes — the publication is designed for both screen and print. Families have printed physical copies for guests who are not online.' },
      { q: 'When should I generate the publication?', a: 'After your event, once you have approved all the tributes you want to include. There is no deadline — take as much time as you need to arrange it before generating.' },
    ]
  },

  {
    id: 'additional_phase',
    icon: '📅',
    title: 'Additional Event Phase',
    subtitle: 'Add more chapters to your event story',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is an Event Phase?', a: 'An Event Phase is a chapter in your event story. Some occasions have one chapter — the service, the ceremony, the celebration. Others unfold across multiple moments: a wake keep followed by a funeral service and a thanksgiving; a traditional wedding followed by a white wedding and a reception. Each phase gets its own tribute collection window, its own QR code, and its own place in the published record.' },
      { q: 'How many phases are included?', a: 'Free capsules include one event phase. Pre-booked capsules include two. You can add more from your dashboard at any time — one phase per purchase, as many as your occasion needs.' },
      { q: 'What does each phase include?', a: 'A name, an event date, a location, its own QR code, and a 24-hour D-Day capture window on the event date. The QR code automatically directs guests to the tribute wall before the event, and to the D-Day upload portal on the day itself.' },
      { q: 'Can I add more than one additional phase?', a: 'Yes. Each purchase adds one phase. A three-day memorial weekend might need three phases. A wedding with a traditional ceremony, church service, and reception might need three. Add as many as your occasion calls for.' },
    ]
  },

  {
    id: 'extended_validity',
    icon: '⏳',
    title: 'Extended Validity',
    subtitle: 'Keep your capsule online and active for longer',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Extended Validity?', a: 'Your capsule stays online and active for a set period from when the first tribute arrives. Free capsules are active for 3 months. Pre-booked capsules are active for 6 months. Extended Validity extends this period so guests can continue visiting and contributing after the standard window closes.' },
      { q: 'When should I purchase it?', a: 'You can purchase Extended Validity at any time — before your capsule goes live, during the active period, or when you receive the expiry notice. Your capsule does not lose existing content when the standard period ends.' },
      { q: 'Does the capsule lose content when it expires?', a: 'No. Content is never deleted. The capsule becomes read-only — existing tributes, stories, and photos are preserved and visible. Extended Validity makes it active again so new contributions can be accepted.' },
      { q: 'Can I purchase it after my capsule has already expired?', a: 'Yes. You can reactivate your capsule from your dashboard even after the standard period has ended.' },
    ]
  },

  // ═══ Event day ═══

  {
    id: 'dday',
    icon: '◎',
    title: 'D-Day Guest Captures',
    subtitle: 'Guest photos and tributes on the event day',
    badge: 'Always Free',
    articles: [
      { q: 'What is D-Day capture?', a: 'D-Day capture is a dedicated experience for guests to share photos and messages on the event day itself. The D-Day portal opens automatically on the event date and closes 24 hours later. Guests scan their QR code on the day — it redirects directly to the upload portal.' },
      { q: 'What can guests upload?', a: 'Guests can upload a photo or video they have taken at the event, leave a tribute message, or both. Their name and optional email are collected so their contribution is attributed correctly.' },
      { q: 'Why 24 hours?', a: 'The capture window is fixed at 24 hours starting from 6am on the event date. This is consistent for all capsules and cannot be changed — it ensures D-Day content is genuinely from the event day.' },
      { q: 'Where do D-Day captures appear?', a: 'D-Day photos appear in a dedicated gallery strip on the Live Wall display and in the D-Day section of the Digital Publication. D-Day tributes are marked separately from pre-event tributes.' },
    ]
  },

  {
    id: 'live_wall',
    icon: '◇',
    title: 'Live Wall Display',
    subtitle: 'Full-screen tribute display for your venue screen',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Live Wall Display?', a: 'The Live Wall Display is a full-screen page designed for projection at your venue. It shows approved tributes arriving in real time — each new approval animates onto the screen with a spotlight moment. Your guests can watch voices arrive as they happen.' },
      { q: 'How do I set it up?', a: 'In your Services tab, find the Live Wall section. Copy the display URL or scan the QR code with the venue screen. Share the URL with your AV team before the event so they can have it ready.' },
      { q: 'Does it need any special software?', a: 'No. The Live Wall works in any modern browser on any screen. Open the URL in a browser and it will fill the screen automatically.' },
      { q: 'How are new tributes approved?', a: 'Use your normal moderation queue in the manage dashboard. Approving a tribute from your phone instantly broadcasts it to the Live Wall display at the venue.' },
    ]
  },

  // ═══ Account and help ═══

  {
    id: 'account',
    icon: '◑',
    title: 'Account & Pricing',
    subtitle: 'Billing, upgrades, and capsule management',
    badge: null,
    articles: [
      { q: 'How do I sign back into my dashboard?', a: 'Go to itslegacycapsule.com/signin and enter your email address. We send a 4-character code to your inbox. Enter the code in the browser — you are taken directly to your dashboard. No password to remember.' },
      { q: 'Can I have multiple capsules?', a: 'Yes. One email address can manage multiple capsules. When you sign in with an email that has multiple capsules, you see a listing of all of them.' },
      { q: 'What currencies are accepted?', a: 'We accept Nigerian Naira (₦) via Paystack and major international currencies (€ EUR, £ GBP, $ USD) via Stripe. Your currency is detected automatically based on your location. If the wrong currency shows, contact us.' },
      { q: 'What is a pre-booked capsule?', a: 'A pre-booked capsule lets you choose your services and pay upfront — before sharing the link with guests. You get two event phases and 6 months of online availability instead of one phase and 3 months. Your capsule goes live when the first tribute arrives, not when you pay. Ideal for events planned months ahead.' },
      { q: 'What is "Gift a Capsule"?', a: 'You can purchase a LegacyCapsule as a gift for someone else\'s event. Choose the services you want to include, pay, and the recipient receives a notification explaining what they have received and how to get started.' },
      { q: 'Can I add services after creating a free capsule?', a: 'Yes. From your manage dashboard, go to the Services tab to see everything available. You can add any premium service at any time — your capsule does not need to be pre-booked to unlock premium features.' },
      { q: 'What happens if I need help?', a: 'Contact us through this help page or email hello@itslegacycapsule.com. We respond within 24 hours on business days.' },
    ]
  },

]

// ─────────────────────────────────────────────────────────
// SECTION 3 — Badge styling
// ─────────────────────────────────────────────────────────

function Badge({ text }: { text: string }) {
  const isPremium = text === 'Premium Add-on'
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      padding: '3px 8px', borderRadius: '20px',
      background: isPremium ? 'rgba(226,195,107,0.1)' : 'rgba(74,222,128,0.08)',
      border: isPremium ? '1px solid rgba(226,195,107,0.25)' : '1px solid rgba(74,222,128,0.2)',
      color: isPremium ? 'rgba(226,195,107,0.8)' : 'rgba(134,239,172,0.8)',
      flexShrink: 0,
    }}>
      {text}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// SECTION 4 — Main page
// ─────────────────────────────────────────────────────────

function HelpPageInner() {
  const searchParams  = useSearchParams()
  const refParam      = searchParams.get('ref')       // 'booking' | 'dashboard'
  const sectionParam  = searchParams.get('section')   // service id e.g. 'publication'

  const [query,       setQuery]       = useState('')
  const [openArticle, setOpenArticle] = useState<string | null>(null)

  // Auto-scroll to section if deep-linked
  useEffect(() => {
    if (sectionParam) {
      setTimeout(() => {
        const el = document.getElementById(sectionParam)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [sectionParam])

  const filtered = query.trim().length > 1
    ? SECTIONS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.q.toLowerCase().includes(query.toLowerCase()) ||
          a.a.toLowerCase().includes(query.toLowerCase()) ||
          s.title.toLowerCase().includes(query.toLowerCase())
        )
      })).filter(s => s.articles.length > 0)
    : SECTIONS

  const fromPlatform = refParam === 'booking' || refParam === 'dashboard'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0a1e 0%, #14083a 30%, #0f0a1e 100%)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Context banner — shown when opened from booking or dashboard ── */}
      {fromPlatform && (
        <div style={{ background: 'rgba(226,195,107,0.08)', borderBottom: '1px solid rgba(226,195,107,0.15)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(226,195,107,0.8)', margin: 0, lineHeight: 1.5 }}>
            {refParam === 'booking'
              ? 'You came here from the booking flow. Read as much as you need, then close this tab to continue your order.'
              : 'You came here from your dashboard. Close this tab when you are done to return to your capsule.'}
          </p>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(226,195,107,0.3)', background: 'rgba(226,195,107,0.1)', color: gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
          >
            ✕ Close & Return
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px', maxWidth: '640px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px', fontWeight: 600 }}>
          Help & Services Guide
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: textPrimary, lineHeight: 1.2, marginBottom: '16px' }}>
          Everything you need to run a premium event
        </h1>
        <p style={{ fontSize: '15px', color: textBody, lineHeight: 1.7, marginBottom: '28px' }}>
          LegacyCapsule is built for private organisers, professional planners, and anyone stepping up to coordinate an event that matters. Every service is explained in plain language — no technical knowledge needed. Search for any feature or question below.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search — e.g. 'how do I share my link' or 'voice tributes'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 20px 14px 48px',
              borderRadius: '14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(226,195,107,0.2)',
              color: textPrimary, fontSize: '14px', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
            }}
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: goldMuted }}>◎</span>
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: textFaint, cursor: 'pointer', fontSize: '18px', fontFamily: "'DM Sans', sans-serif" }}
            >
              ×
            </button>
          )}
        </div>

        {/* Quick links to service sections */}
        {!query && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', justifyContent: 'center', marginTop: '20px' }}>
            {SECTIONS.filter(s => s.badge).map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '20px', background: cardBg, border: `1px solid ${cardBorder}`, color: textFaint, textDecoration: 'none', transition: 'color 0.15s' }}
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: textFaint }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>◎</p>
            <p style={{ fontSize: '15px' }}>No results for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Try different words or{' '}
              <Link href="mailto:hello@itslegacycapsule.com" style={{ color: goldMuted }}>email us directly</Link>
            </p>
          </div>
        )}

        {filtered.map(section => (
          <div key={section.id} id={section.id} style={{ marginBottom: '52px', scrollMarginTop: '80px' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(226,195,107,0.1)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: goldFaint, border: '1px solid rgba(226,195,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: gold, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>{section.title}</h2>
                  {section.badge && <Badge text={section.badge} />}
                </div>
                <p style={{ fontSize: '12px', color: textFaint, margin: '3px 0 0' }}>{section.subtitle}</p>
              </div>
            </div>

            {/* Articles */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {section.articles.map((article, i) => {
                const key    = `${section.id}-${i}`
                const isOpen = openArticle === key
                return (
                  <div key={key} style={{ borderRadius: '10px', background: cardBg, border: `1px solid ${isOpen ? 'rgba(226,195,107,0.15)' : cardBorder}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button
                      onClick={() => setOpenArticle(isOpen ? null : key)}
                      style={{ width: '100%', padding: '14px 16px', textAlign: 'left' as const, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: isOpen ? gold : textPrimary, lineHeight: 1.4, transition: 'color 0.2s' }}>
                        {article.q}
                      </span>
                      <span style={{ fontSize: '18px', color: isOpen ? gold : textFaint, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, color 0.2s', marginTop: '-2px' }}>
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ height: '1px', background: 'rgba(226,195,107,0.1)', marginBottom: '14px' }} />
                        <p style={{ fontSize: '14px', color: textBody, lineHeight: 1.8, margin: 0 }}>
                          {article.a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── Contact strip ── */}
        <div style={{ padding: '24px', borderRadius: '16px', background: goldFaint, border: '1px solid rgba(226,195,107,0.18)', textAlign: 'center' as const, marginTop: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>Still have questions?</p>
          <p style={{ fontSize: '13px', color: textBody, marginBottom: '16px' }}>We respond within 24 hours on business days.</p>
          <Link href="mailto:hello@itslegacycapsule.com" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Email Us
          </Link>
        </div>

        {/* ── Close tab strip — shown when from platform ── */}
        {fromPlatform && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' as const }}>
            <p style={{ fontSize: '13px', color: textFaint, marginBottom: '12px' }}>
              {refParam === 'booking'
                ? 'Ready to continue your order? Close this tab to return to the booking flow.'
                : 'Done reading? Close this tab to return to your dashboard.'}
            </p>
            <button
              onClick={() => window.close()}
              style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              ✕ Close & Return
            </button>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', padding: '0 0 32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON&apos;T.
      </p>

    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    }>
      <HelpPageInner />
    </Suspense>
  )
}
