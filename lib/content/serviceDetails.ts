// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/content/serviceDetails.ts
// PURPOSE: Single source of truth for all service content across LegacyCapsule.
//          Consumed by: ServicesTab, booking flow Step 3, help page, feature pages.
//
//          VOICE STANDARD:
//          - Written from the organiser's world, never from the platform's architecture
//          - Speaks to three personas: private individual, professional planner,
//            first-time coordinator
//          - Every description must answer: what does this do for MY event?
//          - No technical language, no system jargon, no feature-speak
//          - The platform's sophistication is communicated through simplicity
//          - If a description sounds like a software feature list, rewrite it
//            as an event planning benefit
// ARCHITECTURE: LC04 Payment Engine (product definitions) · RW02 (platform services)
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// REPLACES: Previous version by Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types ═══

export interface ServiceDetail {
  id:                    string
  title:                 string
  tagline:               string
  summary:               string            // 2-3 sentences — expanded panel / inline
  whatYouGet:            string[]          // organiser-facing benefits
  contributorExperience: string[]          // what contributors/guests see or do
  bestFor:               string[]          // event types this suits
  exampleUseCase:        string            // one concrete scenario
  faqs:                  { q: string; a: string }[]
  icon:                  string
  refundNote:            string            // honest non-refundability statement
}

// ═══ SECTION 2 — Tribute Experience ═══

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {

  // ── Voice Tributes ──────────────────────────────────────────────────────────
  audio_tributes: {
    id:      'audio_tributes',
    title:   'Voice Tributes',
    icon:    '🎙',
    tagline: 'Hearing a voice is irreplaceable. Preserve them.',
    summary: 'Let your guests record a personal message in their own voice. Each tribute can include one voice recording — up to 60 seconds — so their words are preserved exactly as spoken. For memorials, retirements, and milestone events, the sound of a familiar voice carries meaning that text alone cannot.',
    whatYouGet: [
      'A voice recording option appears in the tribute form for all your guests',
      'Each recording is up to 60 seconds — enough for a heartfelt personal message',
      'Audio plays directly in the tribute card on the wall — no download needed',
      'You review and approve voice tributes in the same moderation queue as written tributes',
      'Audio is stored securely and included in the permanent capsule record',
      'Guests can re-record before submitting if they want to try again',
    ],
    contributorExperience: [
      'Guests see a microphone option in the tribute form — tap to record, tap to stop',
      'They can play back their recording before submitting to make sure they are happy with it',
      'Their voice plays alongside their name and photo in their tribute card',
      'No app to download, no account to create — works in any modern browser on any device',
    ],
    bestFor: ['Memorial & Funeral', 'Retirement', 'Milestone Birthday', 'Graduation', 'Ordination'],
    exampleUseCase: 'A memorial capsule for a beloved community figure receives 23 voice tributes from friends across three continents. A childhood friend records from Lagos. A former colleague records from Toronto. A family member who cannot travel records from her hospital bed. When the family plays these back in the weeks after the service, they hear voices they may never otherwise have captured — a permanent record of how this person was felt by those who knew him.',
    faqs: [
      { q: 'What devices support voice recording?', a: 'Voice recording works on all modern smartphones, tablets and computers with a microphone. Chrome, Safari, Firefox and Edge are all supported. No app or plugin required.' },
      { q: 'Can a guest submit both a written tribute and a voice recording?', a: 'Yes — they can include both in the same submission. The voice recording supplements the written tribute and both appear together in the tribute card.' },
      { q: 'Are voice tributes moderated before appearing on the wall?', a: 'Yes — all voice tributes go through the same approval queue as written tributes. You listen to them before they appear publicly.' },
      { q: 'What is the maximum recording length?', a: 'Sixty seconds per recording. This is enough for a meaningful personal message while keeping the tribute wall accessible for all visitors.' },
    ],
    refundNote: 'Voice Tributes is activated immediately on payment and is non-refundable. Guests can submit voice recordings at any point during your capsule\'s active period.',
  },

  // ── Video Tributes ──────────────────────────────────────────────────────────
  video_tributes: {
    id:      'video_tributes',
    title:   'Video Tributes',
    icon:    '🎬',
    tagline: 'A face, a voice, an expression. The most personal tribute of all.',
    summary: 'Give your guests the option to record a short video message. Each tribute can include one video — up to 60 seconds — making their presence felt even if they couldn\'t be there in person. Seeing someone\'s face as they speak adds a dimension that no written or audio tribute can replicate.',
    whatYouGet: [
      'A video upload option in the tribute form — guests record on their phone and upload directly',
      'Videos up to 60 seconds — concise, personal, powerful',
      'Video plays inline in the tribute card — no external links, no redirects',
      'Same moderation queue as all other tributes — you review before anything goes live',
      'Videos are included in the permanent capsule record and accessible to the family at any time',
      'Mobile-optimised playback — plays smoothly on any device visiting the tribute wall',
    ],
    contributorExperience: [
      'Guests record their video on their phone camera, then upload it in the tribute form',
      'The video plays in their tribute card alongside their name, location, and relationship',
      'No technical knowledge required — if they can send a WhatsApp video, they can submit a video tribute',
      'They receive the same Keepsake Card confirmation as all other contributors',
    ],
    bestFor: ['Retirement', 'Milestone Birthday', 'Wedding', 'Graduation', 'Memorial & Funeral'],
    exampleUseCase: 'A daughter organises a 70th birthday capsule for her mother and activates Video Tributes. Grandchildren in Australia record short videos at the kitchen table. A lifelong friend records herself holding up an old photograph as she speaks. A former student records from his office in London. When the family gathers at the birthday dinner, the tribute wall becomes a living room of faces — people who could not be there in person, present in the next best way.',
    faqs: [
      { q: 'How do guests record their video?', a: 'They record using their phone\'s camera as normal, then upload the file in the tribute form. No special equipment or app is required.' },
      { q: 'What is the maximum video length?', a: 'Sixty seconds. This encourages guests to be concise and personal — the most memorable video tributes are usually under a minute.' },
      { q: 'What video formats are supported?', a: 'MP4 (the standard format from all smartphone cameras) is fully supported. Most common video formats are accepted.' },
      { q: 'Can a guest submit both a video and a written tribute?', a: 'Yes — they can include a written message, a photo, and a video in the same submission. All three appear in their tribute card.' },
    ],
    refundNote: 'Video Tributes is activated immediately on payment and is non-refundable. Guests can submit video tributes at any point during your capsule\'s active period.',
  },

  // ═══ SECTION 3 — Event Services ═══

  // ── Guest Management & Seating ──────────────────────────────────────────────
  guest_management: {
    id:      'guest_management',
    title:   'Guest Management & Seating',
    icon:    '◉',
    tagline: 'Everyone who will be at your event — organised in one place.',
    summary: 'Keep your full guest list in one place — invited guests, family, VIPs, vendors, media and everyone else involved in your event. Collect RSVPs, manage seating, and know exactly who is expected and where they\'ll be. Your RSVP form is built for your type of event, so a wedding organiser sees Bride\'s Guests and Groom\'s Guests from the start.',
    whatYouGet: [
      'A complete event registry for everyone at your event — guests, family, VIPs, vendors, caterers, decorators, photographers, media teams, and volunteers',
      'RSVP invitations and tracking — see who has confirmed, declined, or not yet responded',
      'Event-type-aware guest segments — weddings default to Bride\'s Guests and Groom\'s Guests, memorials to Immediate Family and Extended Family, and so on',
      'A configurable RSVP form — choose which questions to ask your guests, add your own, and switch off anything you don\'t need',
      'Table and seating assignment — place guests at tables and sections with a clear layout',
      'VIP and VVIP protocol — dedicated tracking for guests who require special attention, with space for PA contacts, entourage details, arrival protocols, and private notes',
      'Guest grouping by family, church, alumni, colleagues, or any grouping that makes sense for your occasion',
      'Your guest list and your seating plan stay connected — a guest who confirms their RSVP can be assigned to a table without entering their details twice',
    ],
    contributorExperience: [
      'Invited guests receive a personalised RSVP invitation — formal for VVIPs, warm for everyone else',
      'They respond with their attendance, the number of people joining them, and any details the organiser has asked for',
      'A PA or representative can respond on behalf of a VIP guest',
      'Guests who confirm receive their table assignment and any event-day information before the event',
    ],
    bestFor: ['Wedding', 'Chieftaincy', 'Award Ceremony', 'Conference', 'Ordination', 'Thanksgiving Service', 'Memorial & Funeral'],
    exampleUseCase: 'A couple organising a wedding with 280 guests uses Guest Management to build their full event registry — 180 on the bride\'s side, 100 on the groom\'s. They send RSVP invitations and track confirmations over three weeks. The groom\'s aunt, a VVIP, is flagged with her PA\'s contact details and a note that her entourage of four needs reserved seating. By the morning of the wedding, 214 have confirmed. The organiser opens Guest Management and sees at a glance: who is coming, who hasn\'t responded, where VVIPs will sit, and which tables still have space.',
    faqs: [
      { q: 'What types of people can I add to my guest list?', a: 'Anyone involved in your event: invited guests, family members, VIPs and VVIPs, media teams, vendors, caterers, decorators, photographers, volunteers, and event helpers. The system calls it the Event Participant Registry internally, but you see it as your Guest List.' },
      { q: 'Does this include RSVP?', a: 'Yes. RSVP is built into Guest Management. You send invitations, guests confirm or decline, and their response updates your guest list automatically. No separate RSVP tool needed.' },
      { q: 'Can I customise the RSVP form?', a: 'Yes. Certain fields are always included (name, attendance, email). Others are on by default but you can switch them off. You can also add your own custom questions — for example, dietary needs, which phase they\'re attending, or whether they need accommodation.' },
      { q: 'How does VIP and VVIP management work?', a: 'When you mark a guest as VIP or VVIP, additional fields appear: PA or representative contact, expected entourage size, arrival protocol notes, and private organiser notes. VVIPs are tracked separately on your dashboard so you always know their status.' },
      { q: 'Does it include Access Codes?', a: 'Guest Management and Access Codes are separate services. Guest Management covers your guest list, RSVPs, and seating. Access Codes covers event-day entry verification and check-in. Many organisers use both together — your guest list feeds directly into code generation so you never re-enter names.' },
      { q: 'How many guests can I manage?', a: 'There is no fixed limit. The system is designed for events with hundreds of guests. For events over 500, contact us.' },
    ],
    refundNote: 'Guest Management & Seating is activated immediately on payment and is non-refundable. Your guest data and seating assignments remain accessible throughout your capsule\'s validity period.',
  },

  // ── Access Code System ──────────────────────────────────────────────────────
  access_codes: {
    id:      'access_codes',
    title:   'Access Code System',
    icon:    '🔐',
    tagline: 'Dignified, organised arrivals — no paperwork, no queues.',
    summary: 'Give every guest a personal entry code for your event. Codes can be emailed automatically and printed on access cards. Your team checks guests in on the day with a simple scan or code lookup — no paperwork, no queues. When a VIP arrives, you know immediately.',
    whatYouGet: [
      'A unique personal code for every guest — a QR code and a numeric backup',
      'Automatic email delivery — each guest receives their code directly, no manual sending required',
      'Printed access cards — beautifully formatted cards you can produce for guests who prefer something physical',
      'A dedicated check-in interface for your ushers, accessible on any phone — PIN-secured, no app required',
      'Walk-in registration for guests who arrive without a code',
      'Live arrivals dashboard — see who has arrived, who is outstanding, and who needs attention',
      'VIP and VVIP priority arrival alerts — your team is notified the moment a key guest checks in',
      'Choose who receives codes: everyone on your list, only guests who confirmed, or specific people you select',
    ],
    contributorExperience: [
      'Each guest receives a personal email with their QR code and a numeric code as backup',
      'At the venue, their code is scanned or quoted — one tap confirms entry',
      'The experience is warm and dignified — no searching through paper lists, no queues at the door',
      'Walk-in guests can be registered and admitted on the spot without disrupting the flow',
    ],
    bestFor: ['Wedding', 'Chieftaincy', 'Award Ceremony', 'Conference', 'Ordination', 'Thanksgiving Service'],
    exampleUseCase: 'A family organising a chieftaincy ceremony for 350 guests generates access codes from their guest list. They choose to send codes only to guests who confirmed via RSVP — 287 emails go out in one click. Each email contains a QR code and a six-digit number. On the day, three ushers use the check-in page on their phones. A designated usher is assigned to the VIP entrance. When Chief Adeyemi arrives, the system fires a priority alert to the organiser\'s dashboard — "Chief Adeyemi Okafor has arrived — Gate A — 2:47 PM." The organiser sees the live count: 198 of 287 arrived, 3 of 4 VVIPs present.',
    faqs: [
      { q: 'How do guests receive their codes?', a: 'Codes are emailed individually to each guest from your dashboard. Each email contains a QR code image and a numeric code as backup. Guests who cannot have their QR scanned can give the number verbally to the usher.' },
      { q: 'Can I choose who gets a code?', a: 'Yes. When generating codes, you choose: everyone on your guest list, only guests who confirmed they\'re coming, or specific people you select individually.' },
      { q: 'How does the usher check-in interface work?', a: 'You generate a temporary PIN for each usher. They open the check-in page on their phone and enter the PIN. They can scan QR codes or type numeric codes. Each check-in shows the guest\'s name and tier, and logs the arrival permanently.' },
      { q: 'What if a guest arrives without their code?', a: 'Ushers can search by name and check in manually. Walk-in guests without a code can be registered and admitted on the spot. All arrivals are logged.' },
      { q: 'Do I need Guest Management to use Access Codes?', a: 'Access Codes work best with Guest Management, because your guest list feeds directly into code generation — no re-entering names. You can use Access Codes alone, but you would need to add guests manually before generating codes.' },
      { q: 'Are access cards included?', a: 'Yes. You can generate printable access cards for guests who prefer a physical card. Cards include the guest\'s name, their QR code, and event details.' },
    ],
    refundNote: 'Access Code System is activated immediately on payment and is non-refundable. Your codes and check-in records remain accessible throughout your capsule\'s validity period.',
  },

  // ── Fabric & Attire Coordination ────────────────────────────────────────────
  attire: {
    id:      'attire',
    title:   'Fabric & Attire Coordination',
    icon:    '◐',
    tagline: 'Coordinated event attire — from selection to collection — without the chaos.',
    summary: 'Coordinate event attire from one place. Share fabric details, vendor information and collection instructions with your guests — and track who has collected their fabric without chasing anyone individually. Designed for events where coordinated dressing is a proud tradition.',
    whatYouGet: [
      'Share fabric details, colour themes, and vendor information with guests in one place',
      'Collection instructions and vendor contact details — clear and accessible',
      'Track each guest\'s attire status: interested, reserved, paid, collected, or declined',
      'See your coordination progress at a glance — how many ordered, how many collected, who is outstanding',
      'Multiple fabric options with photos, descriptions, and pricing',
      'A dedicated attire section within your capsule that guests can access directly',
    ],
    contributorExperience: [
      'Guests see clear, organised information about the event attire — what is available, how to order, where to collect',
      'They indicate their interest, place their order, and receive collection instructions',
      'No confusion about which fabric, which vendor, or where to collect — everything in one place',
      'Guests outside the event country can designate a local representative to collect on their behalf',
    ],
    bestFor: ['Wedding', 'Chieftaincy', 'Thanksgiving Service', 'Milestone Birthday', 'Ordination'],
    exampleUseCase: 'A family coordinating a thanksgiving service for 300 guests uses Fabric & Attire to showcase three options — a burgundy lace, a gold gele fabric, and a mixed print — each with photos and pricing. Over three weeks, 187 guests place orders. The organiser tracks every order, marks payments received, and coordinates collection from the dashboard. On the day before the event, a quick check shows 143 collected, 37 outstanding, 4 declined — and the 3 outstanding VIP collections are surfaced separately.',
    faqs: [
      { q: 'Can I offer multiple fabric options?', a: 'Yes — add as many options as your event requires. Each can have its own photo, description, price, and availability status.' },
      { q: 'Does LegacyCapsule handle payment for fabric orders?', a: 'No. Payment collection happens through your own channels (bank transfer, etc.). LegacyCapsule tracks order and payment status but does not process the actual payment.' },
      { q: 'Can I set a cut-off date for orders?', a: 'Yes — you set a deadline after which new orders are no longer accepted. Existing orders placed before the deadline are preserved.' },
      { q: 'Is this only for Nigerian events?', a: 'No. While designed with Aso-Ebi traditions in mind, the system works for any event requiring coordinated attire — uniforms, themed dress codes, or cultural garments of any kind.' },
    ],
    refundNote: 'Fabric & Attire Coordination is activated immediately on payment and is non-refundable. The full attire management system is available from your dashboard immediately after activation.',
  },

  // ── Gift of Honour ─────────────────────────────────────────────────────────
  ways_to_honour: {
    id:      'ways_to_honour',
    title:   'Gift of Honour',
    icon:    '✦',
    tagline: 'A dignified, organised way for guests to show their love financially.',
    summary: 'Give guests who want to express their support financially a dignified, organised way to do so. You set up the details — guests contribute directly — and it all lives within the capsule experience. Designed for the African cultural context where financial support during significant events is an important expression of love and respect.',
    whatYouGet: [
      'A dedicated section on the tribute wall showing your bank details or payment channels',
      'Full control over which payment methods to display — bank transfer, mobile money, or any channel you choose',
      'A private acknowledgement flow — guests note their support and you receive a daily digest',
      'A running total so the family always knows the cumulative position',
      'Full privacy — amounts and details are never shown publicly on the tribute wall',
      'Multiple payment channels for different banks or currencies',
    ],
    contributorExperience: [
      'Guests see a tasteful section on the capsule inviting them to express their support',
      'They see clear account details, make their transfer directly, and acknowledge it on the platform',
      'They receive an immediate confirmation that their gesture has been received and noted with gratitude',
      'No amounts are displayed publicly — only the family sees the details',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Thanksgiving Service', 'Ordination', 'Milestone Birthday', 'Wedding'],
    exampleUseCase: 'A family hosting a traditional chieftaincy installation adds Gift of Honour to their capsule. Guests from the UK, Nigeria and the US see the family\'s Zenith Bank account and UK bank details presented tastefully alongside the tribute wall. Over the three days of the ceremony, 47 guests acknowledge their support. The family representative receives a midnight digest each day summarising who contributed and the running total — without needing to monitor the capsule manually.',
    faqs: [
      { q: 'Are amounts shown publicly?', a: 'Never. Amounts are completely private. Only the family representative and organiser can see the acknowledgement records. The tribute wall shows only that a Gift of Honour section exists.' },
      { q: 'Can I add multiple payment channels?', a: 'Yes — add as many payment methods as needed: bank transfer, mobile money, PayPal, or any other channel you choose.' },
      { q: 'How does the family know when someone has contributed?', a: 'A daily digest email is sent at midnight to the family representative, listing every new acknowledgement received that day and the cumulative total. One clear summary per day.' },
      { q: 'Does LegacyCapsule handle the money?', a: 'No. LegacyCapsule displays your payment details and records acknowledgements. The actual transfer happens directly between the guest and your bank account. We take no transaction fee and handle no funds.' },
    ],
    refundNote: 'Gift of Honour is activated immediately on payment and is non-refundable. The service can be deactivated from your dashboard if needed, but the activation fee is not returned.',
  },

  // ═══ SECTION 4 — Memories ═══

  // ── Digital Publication ────────────────────────────────────────────────────
  publication: {
    id:      'publication',
    title:   'Digital Publication',
    icon:    '📖',
    tagline: 'Every voice, every memory — assembled into a permanent record.',
    summary: 'Turn every tribute, memory, photo and story into a beautifully assembled publication — the permanent, shareable record of your occasion that your family will return to for years. This is the destination the platform is built toward: not just a collection of messages, but a complete, professionally assembled record.',
    whatYouGet: [
      'A full Publication Editor where you arrange tributes, photos and sections in any order',
      'Five professional design themes — choose the one that matches your occasion',
      'Preview before you generate — see exactly how the final record will look',
      'One-click distribution — send the completed publication to every contributor who left their email',
      'Permanent download link — recipients can access their copy at any time',
      'Honouree profile, tributes, Community Stories chapters, D-Day gallery, and a who-attended section — all included',
      'Print-ready — families have used it to print physical copies for guests who are not online',
    ],
    contributorExperience: [
      'Each contributor receives a personal email when the publication is ready',
      'Their tribute appears in the published record, attributed to them by name',
      'They can download and share the publication with anyone',
      'Their participation is permanently acknowledged in a document designed to be kept',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Ordination', 'Award Ceremony', 'Milestone Birthday', 'Wedding'],
    exampleUseCase: 'A family organising a retirement celebration for their father gathers 84 tributes from colleagues, family and former students across 12 countries. After approving all tributes, they use the Publication Editor to arrange them by relationship group, add family photos between sections, and select the Midnight theme. They generate the publication and distribute it in one click. Every contributor receives a 47-page record in their inbox — a permanent account of a life well lived, assembled by the people who lived it alongside him.',
    faqs: [
      { q: 'Can I arrange the order of tributes?', a: 'Yes — the Publication Editor gives you full drag-and-drop control. Group tributes, insert photos between sections, exclude specific entries, and rearrange everything before generating.' },
      { q: 'When should I generate the publication?', a: 'After your event, once you have approved all the tributes you want to include. There is no deadline — take as much time as you need to arrange it before generating.' },
      { q: 'Can I add more tributes after generating?', a: 'Yes. You can regenerate the publication at any time with new tributes included. The distribution link updates to the latest version.' },
      { q: 'How many people receive it?', a: 'All contributors who provided an email address receive it. There is no limit on recipients.' },
      { q: 'Is it suitable for printing?', a: 'Yes — the publication is designed for both screen and print. Families have printed physical copies for guests who are not online.' },
    ],
    refundNote: 'Digital Publication is activated immediately on payment and is non-refundable once activated.',
  },

  // ── Additional Event Phase ──────────────────────────────────────────────────
  additional_phase: {
    id:      'additional_phase',
    title:   'Additional Event Phase',
    icon:    '📅',
    tagline: 'Another chapter in your event story.',
    summary: 'Add another chapter to your event story. Each additional phase opens a separate tribute collection window — perfect for occasions that unfold across multiple days or settings. A memorial might span a wake keep, a funeral service, and a thanksgiving. A wedding might include a traditional ceremony, a church service, and a reception.',
    whatYouGet: [
      'One additional event phase with its own name, date, and location',
      'A separate tribute collection window for that phase',
      'Its own QR code — directing guests to the right experience at the right time',
      'Included as a distinct chapter in the Digital Publication if you generate one',
      'The QR code is context-aware: before the event it opens the tribute wall; on the day it opens the D-Day capture portal',
    ],
    contributorExperience: [
      'Guests see each phase as a chapter in the event story',
      'Scanning the phase QR code takes them to the right experience for that moment',
      'Their contributions are attributed to the correct phase automatically',
    ],
    bestFor: ['Wedding', 'Memorial & Funeral', 'Chieftaincy', 'Retirement', 'Conference'],
    exampleUseCase: 'A family organising a three-day memorial weekend uses their two included phases for the Wake Keep and Funeral Service, then adds one Additional Event Phase for the Thanksgiving Service on the third day. Each phase has its own QR code printed on the order of service for that day. Guests scan and contribute to the right chapter. The final publication tells the story of all three days — each with its own tributes, photos, and guest captures.',
    faqs: [
      { q: 'How many phases are included in my capsule?', a: 'Free capsules include one event phase. Pre-booked capsules include two. You can add more from your dashboard at any time, one at a time.' },
      { q: 'Can I add more than one additional phase?', a: 'Yes. Each purchase adds one phase. Add as many as your occasion needs.' },
      { q: 'What does each phase include?', a: 'A name, an event date, a location, its own QR code, and a 24-hour D-Day capture window on the event date. The QR code directs guests to the tribute wall before the event and to the D-Day upload portal on the day itself.' },
    ],
    refundNote: 'Additional Event Phase is activated immediately on payment and is non-refundable.',
  },

  // ═══ SECTION 5 — ServicesTab Only (not shown at booking) ═══

  // ── Extended Validity ──────────────────────────────────────────────────────
  extended_validity: {
    id:      'extended_validity',
    title:   'Extended Validity',
    icon:    '⏳',
    tagline: 'Keep the record reachable for longer.',
    summary: 'Keep your capsule online and accessible for longer. Extend your capsule\'s availability so family and friends can continue returning to the record long after the event. Free capsules stay online for 3 months; pre-booked capsules for 6 months. Extended Validity adds more time whenever you need it.',
    whatYouGet: [
      'Extended online availability beyond your included period',
      'Your capsule remains fully accessible — all tributes, stories, photos, and the publication link stay live',
      'Purchase at any time before your current period ends',
      'Multiple extensions can be purchased if you want to keep the capsule available indefinitely',
    ],
    contributorExperience: [
      'No change for contributors — they continue accessing the capsule as normal',
      'Late contributors can still visit and read the record',
      'The capsule link continues to work for anyone who has it',
    ],
    bestFor: ['Memorial & Funeral', 'Retirement', 'Anniversary', 'Milestone Birthday'],
    exampleUseCase: 'A memorial capsule reaches its 6-month mark with 112 tributes and a published record. A cousin discovers the capsule link eight months after the funeral and wants to visit. The organiser purchases Extended Validity from the dashboard — the capsule stays live and the cousin reads every tribute, hears every voice note, and sees the published record. The story remains accessible for as long as the family wants it to be.',
    faqs: [
      { q: 'How long does my capsule stay online without Extended Validity?', a: 'Free capsules are online for 3 months from when the first tribute arrives. Pre-booked capsules are online for 6 months. After that, the capsule becomes read-only — existing content is preserved but no new tributes can be submitted.' },
      { q: 'Does the capsule lose content when it expires?', a: 'No. Content is never deleted. The capsule becomes read-only. Extended Validity makes it active again so new contributions can be accepted.' },
      { q: 'Can I purchase Extended Validity after my capsule has already expired?', a: 'Yes. You can reactivate your capsule from your dashboard even after the standard period has ended.' },
    ],
    refundNote: 'Extended Validity is activated immediately on payment and is non-refundable.',
  },

  // ═══ SECTION 6 — Free Services (for reference/help page only) ═══

  // ── Community Memories & Stories ────────────────────────────────────────────
  community_stories: {
    id:      'community_stories',
    title:   'Community Memories & Stories',
    icon:    '◇',
    tagline: 'The stories behind the story — what brought everyone here.',
    summary: 'A dedicated space where guests share fuller stories, personal memories and reflections — organised by theme so the complete picture of the occasion comes through. Some memories don\'t fit in a short tribute. Community Memories & Stories gives your guests a richer space to share what this person or event truly means to them.',
    whatYouGet: [
      'A dedicated Stories room on your capsule — alongside Tributes, Profile and Legacy Highlights',
      'Story topics that organise submissions into chapters — some suggested automatically for your event type, others you create yourself',
      'Guests can propose their own topics if their story doesn\'t fit an existing chapter',
      'Stories are moderated separately from tributes — you control what appears',
      'Stories are included as chapters in the Digital Publication if you generate one',
      'The Stories room is accessible from the capsule navigation — visible to all visitors',
    ],
    contributorExperience: [
      'Guests see a "Share a Story" option — separate from leaving a tribute',
      'They choose or suggest a topic, then write their story with an optional photo',
      'They receive the same Keepsake Card confirmation as tribute contributors',
      'Their story appears in its topic chapter, attributed to them by name',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Graduation', 'Anniversary'],
    exampleUseCase: 'A retirement capsule for a 43-year university career activates Community Stories. Default topics are pre-loaded: "A Lesson I Learned", "A Moment I\'ll Never Forget", "Career Stories". Former students add stories across 8 topics — 34 stories in total. A colleague adds the only entry to a topic they proposed: "The Argument That Changed My Mind". When the family reads the Stories room, they discover a version of his career they had never fully known — told in the words of the people who lived it alongside him.',
    faqs: [
      { q: 'What is the difference between a tribute and a Community Story?', a: 'A tribute is a direct message to or about the honouree — up to 500 characters. A Community Story is a longer narrative about a shared experience, memory, or lesson. Both appear on the capsule but in separate rooms.' },
      { q: 'Can I set the topics in advance?', a: 'Yes — add custom topics from your dashboard before sharing the capsule. Default topics are suggested automatically based on your event type.' },
      { q: 'Do Community Stories appear in the Digital Publication?', a: 'Yes — stories appear as topic chapters in the publication, separate from the tributes section.' },
      { q: 'Is Community Memories & Stories free?', a: 'Yes. It is included in every capsule at no cost — free and pre-booked alike. There is nothing to activate or purchase.' },
    ],
    refundNote: 'Community Memories & Stories is included free in every capsule. There is no charge and no activation required.',
  },

}

// ═══ SECTION 7 — Helpers ═══

export function getServiceDetail(id: string): ServiceDetail | null {
  return SERVICE_DETAILS[id] ?? null
}

export const ALL_SERVICE_IDS = Object.keys(SERVICE_DETAILS)

// ═══ SECTION 8 — Booking Flow Service Order ═══
// Used by booking flow Step 3 to render services in the correct
// category grouping. No visible headers — grouped by proximity.
// Extended Validity is NOT included — it appears only in ServicesTab.

export const BOOKING_SERVICE_ORDER = [
  // Tribute Experience
  'audio_tributes',
  'video_tributes',
  // Event Services
  'guest_management',
  'access_codes',
  'attire',
  'ways_to_honour',
  // Memories
  'publication',
  'additional_phase',
]

// ═══ SECTION 9 — Category Boundaries ═══
// Used by ServicesTab and booking flow to insert visual dividers
// between groups. Dividers appear BEFORE the first item in each group.

export const CATEGORY_BREAKS: Record<string, number> = {
  'audio_tributes': 0,    // first group — no divider above
  'guest_management': 1,  // divider before Event Services
  'publication': 2,       // divider before Memories
}

// ServicesTab additionally shows:
export const SERVICESTAB_ONLY_SERVICES = ['extended_validity']
