// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/content/serviceDetails.ts
// PURPOSE: Single source of truth for all premium service content.
//          Used by ServicesTab (expanded panel) and /features/[service] pages.
//          Copy decisions: explicit, convincing, non-refundable-payment worthy.
// ARCHITECTURE: LC02 Event Services Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceDetail {
  id:                   string
  title:                string
  tagline:              string
  summary:              string          // 2-3 sentences — used in expanded panel
  whatYouGet:           string[]        // organiser-facing benefits
  contributorExperience: string[]       // what contributors see/do
  bestFor:              string[]        // event types this suits
  exampleUseCase:       string          // one concrete scenario
  faqs:                 { q: string; a: string }[]
  icon:                 string
  refundNote:           string          // honest statement about non-refundability
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Service definitions
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {

  // ── Digital Publication ────────────────────────────────────────────────────
  publication: {
    id:      'publication',
    title:   'Digital Publication',
    icon:    '◎',
    tagline: 'Every tribute, compiled into a keepsake that lasts forever.',
    summary: 'The Digital Publication transforms your capsule into a beautifully designed PDF — every tribute, photo and voice laid out like a commemorative magazine. You control the arrangement, the themes, and when it goes out. When it is ready, one click distributes it to everyone who contributed.',
    whatYouGet: [
      'A full Publication Editor where you arrange tributes, photos and sections in any order',
      'Five professional design themes — choose the one that matches your event',
      'Preview before you generate — see exactly how the final PDF will look',
      'One-click distribution — send the completed publication to every contributor simultaneously',
      'Permanent download link — contributors can access their copy at any time',
      'Organised by name, location and relationship — every voice attributed correctly',
    ],
    contributorExperience: [
      'Each contributor receives a personal email when the publication is ready',
      'Their tribute appears in the published record, attributed to them by name',
      'They can download and share the publication with anyone in their network',
      'Their participation is permanently acknowledged in a document designed to be kept',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Ordination', 'Award Ceremony', 'Milestone Birthday'],
    exampleUseCase: 'A family organising a retirement celebration for their father gathers 84 tributes from colleagues, family and former students across 12 countries. After approving all tributes, they use the Publication Editor to arrange them by relationship group, add family photos between sections, and select the Midnight theme. They generate the PDF and distribute it in one click. Every contributor receives a 47-page commemorative publication in their inbox — a record of a life well lived, assembled by the people who lived it alongside him.',
    faqs: [
      { q: 'Can I edit the order of tributes in the publication?', a: 'Yes — the Publication Editor gives you full drag-and-drop control. You can group tributes, insert photos between sections, exclude specific tributes, and rearrange everything before generating.' },
      { q: 'When is the right time to generate the publication?', a: 'After your event, once you have approved all the tributes you want to include. There is no deadline — you can take as much time as you need to arrange the publication before generating.' },
      { q: 'What happens if I want to add more tributes after generating?', a: 'You can regenerate the publication at any time. New tributes can be approved and included in a fresh generation — the distribution link will update to the latest version.' },
      { q: 'How many people can receive the distributed publication?', a: 'All contributors who provided an email address receive it. There is no limit on recipients.' },
      { q: 'Is the PDF suitable for printing?', a: 'Yes — the publication is designed for both screen and print. Families have used it to print physical copies for guests who are not online.' },
    ],
    refundNote: 'Publication is a digital service activated immediately on payment. As with all LegacyCapsule add-ons, it is non-refundable once activated.',
  },

  // ── Gift of Honour ─────────────────────────────────────────────────────────
  ways_to_honour: {
    id:      'ways_to_honour',
    title:   'Gift of Honour',
    icon:    '✦',
    tagline: 'A dignified, private channel for guests to express financial support.',
    summary: 'Gift of Honour adds a tasteful, private section to your tribute wall where guests can see your preferred payment channels and express their support. It is designed specifically for the African cultural context — where supporting a family financially during a significant event is an important part of the occasion — presented with the dignity the moment deserves.',
    whatYouGet: [
      'A dedicated section on the tribute wall showing your bank details or payment channels',
      'Full control over which payment methods to display — bank transfer, mobile money, or others',
      'A private acknowledgement flow — contributors note their support discreetly',
       
      'A running year-to-date total so the family always knows the cumulative position',
      'Full privacy — amounts and details are never shown publicly on the tribute wall',
    ],
    contributorExperience: [
      'Contributors see a tasteful section on the tribute wall inviting them to express their support',
      'They select a payment method, complete the transfer independently, and acknowledge it on the capsule',
      'They receive an immediate confirmation that their gesture has been received and noted with gratitude',
      'No amounts are displayed publicly — only the family sees the details',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Thanksgiving Service', 'Ordination', 'Milestone Birthday'],
    exampleUseCase: "A family hosting a traditional chieftaincy installation adds Gift of Honour to their capsule. Guests from the UK, Nigeria and the US see the family\'s Zenith Bank account and UK bank details presented tastefully alongside the tribute wall. Over the three days of the ceremony, 47 guests acknowledge their support. The family representative receives a midnight digest each day summarising who contributed and the running total — without needing to monitor the capsule manually.",
    faqs: [
      { q: 'Are the payment amounts shown publicly on the tribute wall?', a: 'No. Amounts are completely private. Only the family representative and organiser can see the acknowledgement records. The public tribute wall shows only that a Gift of Honour section exists.' },
      { q: 'Can I add multiple payment channels?', a: 'Yes — you can add as many payment methods as needed: bank transfer, mobile money (MTN, Airtel), PayPal, or any other channel you choose to display.' },
      { q: 'How does the family know when someone has expressed honour?', a: 'A daily digest email is sent at midnight to the family representative, listing every new expression received that day and the cumulative total. No real-time alerts — one clear summary per day.' },
      { q: 'Does LegacyCapsule handle the actual money transfer?', a: 'No — LegacyCapsule displays your payment details and records acknowledgements. The actual transfer happens directly between the contributor and your bank or payment account. LegacyCapsule takes no transaction fee and handles no funds.' },
    ],
    refundNote: 'Gift of Honour is activated immediately on payment and is non-refundable. The service can be deactivated from your dashboard if needed, but the activation fee is not returned.',
  },

  // ── Guest Management ────────────────────────────────────────────────────────
  guest_management: {
    id:      'guest_management',
    title:   'Guest Management & Access Codes',
    icon:    '◉',
    tagline: 'Know exactly who is coming, track arrivals, and manage seating — from one dashboard.',
    summary: 'Guest Management gives you a complete event coordination system within your capsule. Build your guest list, generate unique access codes for each guest, track RSVPs, manage check-in on the day, and organise table seating — all in one place, accessible from your phone.',
    whatYouGet: [
      'A full guest list where you add names, contact details, and group/relationship categories',
      'Unique QR-based access codes generated for each guest — scannable at the door',
      'RSVP tracking — see at a glance who has confirmed, declined, or not yet responded',
      'Real-time check-in dashboard — mark arrivals as they happen on the day',
      'Table management — assign guests to tables and print seating layouts',
      'Bulk invite sending — email access codes to your entire guest list in one action',
    ],
    contributorExperience: [
      'Each invited guest receives a personalised invitation with their unique access code',
      'On arrival, their code is scanned or checked and they are marked as present',
      'Access codes can also be used to unlock personalised sections of the capsule',
    ],
    bestFor: ['Wedding', 'Chieftaincy', 'Award Ceremony', 'Conference', 'Ordination', 'Thanksgiving Service'],
    exampleUseCase: 'A couple organising a wedding with 240 guests uses Guest Management to build their guest list over two weeks, assigning each guest to a table and a group (family, work, university, etc.). They send access codes by email to all 240 guests two weeks before the event. By the morning of the wedding, 198 have confirmed. On the day, a family member uses the check-in dashboard on their phone to mark arrivals in real time — the organiser can see the live count from anywhere.',
    faqs: [
      { q: 'How many guests can I add to the guest list?', a: 'There is no fixed limit. The system is designed to handle events with hundreds of guests comfortably.' },
      { q: 'Can multiple people manage check-in on the day?', a: 'Yes — anyone with manage access to the capsule can use the check-in dashboard simultaneously from their own device.' },
      { q: 'What happens if a guest loses their access code?', a: 'You can resend their code from the guest management dashboard. Codes can also be printed as physical cards if needed.' },
      { q: 'Can I import an existing guest list?', a: 'CSV import is on the roadmap. Currently guests are added manually or individually — suitable for most event sizes.' },
    ],
    refundNote: 'Guest Management is activated immediately on payment and is non-refundable. Your guest data and access codes remain accessible throughout your capsule\'s validity period.',
  },

  // ── Voice Tributes ──────────────────────────────────────────────────────────
  audio_tributes: {
    id:      'audio_tributes',
    title:   'Voice Tributes',
    icon:    '🎙',
    tagline: 'Hearing a voice is irreplaceable. Preserve them.',
    summary: 'Voice Tributes allows contributors to record a personal audio message directly from their phone or computer — no app needed. The recording appears in their tribute card alongside any written message. For memorials, retirements, and milestone events, the sound of a familiar voice carries meaning that text alone cannot.',
    whatYouGet: [
      'An audio recording option appears in the tribute submission form for all contributors',
      'Recordings up to 2 minutes — enough for a heartfelt personal message',
      'Audio plays directly in the tribute card on the wall — no download required',
      'You review and approve audio tributes in the same moderation queue as written tributes',
      'Audio is stored securely and included in the permanent capsule record',
      'Contributors can re-record before submitting if they are not satisfied with their first attempt',
    ],
    contributorExperience: [
      'Contributors see a microphone option in the tribute form — tap to record, tap to stop',
      'They can play back their recording before submitting to make sure they are happy with it',
      'Their audio plays with their name and photo in their tribute card — exactly like a written tribute but with their voice',
      'No app to download, no account to create — works in any modern browser on any device',
    ],
    bestFor: ['Memorial & Funeral', 'Retirement', 'Milestone Birthday', 'Graduation', 'Ordination'],
    exampleUseCase: 'A memorial capsule for a beloved community figure receives 23 voice tributes from friends spread across three continents. A childhood friend records two minutes from Lagos. A former colleague records from Toronto. A family member who cannot travel records a message from her hospital bed. When the family plays these back in the weeks after the service, they hear voices they may never otherwise have captured — a permanent record of how this person was felt by those who knew him.',
    faqs: [
      { q: 'What devices and browsers support voice recording?', a: 'Voice recording works on all modern smartphones, tablets and computers with a microphone. Chrome, Safari, Firefox and Edge are all supported. The contributor does not need to install anything.' },
      { q: 'Can contributors submit both a written tribute and a voice recording?', a: 'Yes — they can include both. The voice recording supplements the written tribute and both appear in the same tribute card.' },
      { q: 'Are voice tributes moderated before appearing on the wall?', a: 'Yes — all voice tributes go through the same approval queue as written tributes. You listen to them before they appear publicly.' },
      { q: 'What is the maximum recording length?', a: 'Two minutes per recording. This is enough for a meaningful personal message and keeps the tribute wall from becoming unwieldy.' },
    ],
    refundNote: 'Voice Tributes is activated immediately on payment. It is non-refundable once activated, but contributors can submit voice recordings at any point during your capsule\'s active period.',
  },

  // ── Video Tributes ──────────────────────────────────────────────────────────
  video_tributes: {
    id:      'video_tributes',
    title:   'Video Tributes',
    icon:    '🎬',
    tagline: 'A face, a voice, an expression. The most personal tribute of all.',
    summary: 'Video Tributes allows contributors to upload a short video message that plays directly in their tribute card. Seeing someone\'s face as they speak about the person being honoured adds a dimension that no written or audio tribute can replicate. For milestone events and memorials, these become among the most treasured records in the entire capsule.',
    whatYouGet: [
      'A video upload option in the tribute submission form — contributors record on their phone and upload directly',
      'Videos up to 60 seconds — concise, personal, powerful',
      'Video plays inline in the tribute card — no external links, no redirects',
      'Same moderation queue as all other tributes — you review before anything goes live',
      'Videos are included in the permanent capsule record and accessible to the family at any time',
      'Mobile-optimised playback — plays smoothly on any device visiting the tribute wall',
    ],
    contributorExperience: [
      'Contributors record their video on their phone camera app, then upload it directly in the tribute form',
      'The video plays in their tribute card alongside their name, location, and relationship',
      'No technical knowledge required — if they can send a WhatsApp video, they can submit a video tribute',
      'They receive the same Keepsake Card confirmation as all other contributors',
    ],
    bestFor: ['Retirement', 'Milestone Birthday', 'Wedding', 'Graduation', 'Memorial & Funeral'],
    exampleUseCase: 'A daughter organises a 70th birthday capsule for her mother and activates Video Tributes. Grandchildren in Australia record short videos at the kitchen table. A lifelong friend records herself holding up an old photograph as she speaks. A former student records from his office in London. When the family gathers at the birthday dinner, the tribute wall becomes a living room of faces — people who could not be there in person, present in the next best way.',
    faqs: [
      { q: 'How do contributors record their video?', a: 'They record using their phone\'s camera app as normal, then upload the file in the tribute form. No special equipment or app is required.' },
      { q: 'What is the maximum video length?', a: 'Sixty seconds. This encourages contributors to be concise and personal — the most memorable video tributes are usually under a minute.' },
      { q: 'What video formats are supported?', a: 'MP4 (the standard format from all smartphone cameras) is fully supported. Most common video formats are accepted.' },
      { q: 'Can a contributor submit both a video and a written tribute?', a: 'Yes — they can include a written message, a photo, and a video in the same submission. All three appear in their tribute card.' },
    ],
    refundNote: 'Video Tributes is activated immediately on payment and is non-refundable. Contributors can submit video tributes at any point during your capsule\'s active period.',
  },

  // ── Fabric & Attire ────────────────────────────────────────────────────────
  attire: {
    id:      'attire',
    title:   'Fabric & Attire',
    icon:    '◐',
    tagline: 'Coordinate your event dress code — from fabric selection to collection — in one place.',
    summary: 'Fabric & Attire gives you a complete dress code coordination system within your capsule. Share fabric options, collect orders, track payments, and manage collection — all from your manage dashboard. Designed for events where coordinated attire is central to the occasion, particularly Aso-Ebi and similar cultural traditions.',
    whatYouGet: [
      'A dedicated Attire section on your tribute wall where guests can view and order fabric',
      'Showcase multiple fabric options with photos, colours, price per yard, and availability',
      'Order management — track who has ordered, quantities, and payment status',
      'Collection tracking — mark orders as collected or dispatched',
      'Guest communication — send order confirmations and collection reminders directly from the dashboard',
      'A complete overview of your attire operation — orders, revenue, and outstanding collections — in one screen',
    ],
    contributorExperience: [
      'Guests see the fabric options presented beautifully on the tribute wall',
      'They select their fabric and quantity, provide their details, and complete their order',
      'They receive an order confirmation with collection instructions',
      'Collection reminders are sent automatically as the event date approaches',
    ],
    bestFor: ['Wedding', 'Chieftaincy', 'Thanksgiving Service', 'Milestone Birthday', 'Ordination'],
    exampleUseCase: 'A family coordinating a thanksgiving service for 300 guests uses Fabric & Attire to showcase three Aso-Ebi options — a burgundy lace, a gold gele fabric, and a mixed print — each with photos and pricing. Over three weeks, 187 guests place orders through the capsule. The organiser tracks every order, marks payments received, and coordinates collection from the dashboard. No spreadsheets, no WhatsApp confusion — one clean record of the entire attire operation.',
    faqs: [
      { q: 'Can I showcase multiple fabric options?', a: 'Yes — add as many fabric or attire options as your event requires. Each can have its own photo, description, price, and availability status.' },
      { q: 'Does LegacyCapsule handle payment for fabric orders?', a: 'Payment collection for fabric orders happens through your own channels (bank transfer, etc.). LegacyCapsule tracks order and payment status but does not process the actual payments.' },
      { q: 'Can I set a cut-off date for orders?', a: 'Yes — you set an order deadline after which new orders are no longer accepted. Orders placed before the deadline are preserved.' },
      { q: 'Is Fabric & Attire suitable for non-Nigerian events?', a: 'Yes — while designed with Aso-Ebi traditions in mind, the system works for any event requiring coordinated dress code or uniform ordering.' },
    ],
    refundNote: 'Fabric & Attire is activated immediately on payment and is non-refundable. The full attire management system is available from your manage dashboard immediately after activation.',
  },

  // ── Community Stories ──────────────────────────────────────────────────────
  community_stories: {
    id:      'community_stories',
    title:   'Community Stories',
    icon:    '◇',
    tagline: 'The stories behind the story — what brought everyone here.',
    summary: 'Community Stories adds a dedicated Stories room to your capsule — a curated space where contributors share the memories, lessons, and personal experiences that explain why this occasion matters. Organised by topic, it captures the community context that tributes alone cannot: the career stories, the funny moments, the shared history, the lessons learned.',
    whatYouGet: [
      'A dedicated Stories room on your capsule — a fourth room alongside Tributes, Profile and Legacy Highlights',
      'Story topics that organise submissions into chapters — some suggested automatically for your event type, others you create yourself',
      'Contributors can propose their own topics if their story doesn\'t fit an existing chapter',
      'Stories are moderated separately from tributes — you control what appears',
      'Stories are included as chapters in the Digital Publication if you generate one',
      'The Stories room is accessible from the capsule navigation — visible to all visitors',
    ],
    contributorExperience: [
      'Contributors see a "Share a Story" option — separate from leaving a tribute',
      'They choose or suggest a topic, then write their story with an optional photo',
      'They receive the same Keepsake Card confirmation as tribute contributors',
      'Their story appears in its topic chapter, attributed to them by name',
    ],
    bestFor: ['Retirement', 'Memorial & Funeral', 'Chieftaincy', 'Graduation', 'Anniversary'],
    exampleUseCase: 'A retirement capsule for a 43-year university career activates Community Stories. Default topics are pre-loaded: "A Lesson I Learned", "A Moment I\'ll Never Forget", "Career Stories". Former students add stories to "A Lesson I Learned" — 34 stories in total across 8 topics. A colleague adds the only entry to a topic they proposed: "The Argument That Changed My Mind". When the family reads the Stories room, they discover a version of his career they had never fully known — told in the words of the people who lived it alongside him.',
    faqs: [
      { q: 'What is the difference between a tribute and a Community Story?', a: 'A tribute is a direct message to or about the person being honoured. A Community Story is a narrative about a shared experience, memory, or lesson — context that explains why the occasion matters. Both appear on the capsule but in separate rooms.' },
      { q: 'Can I set the topics in advance?', a: 'Yes — you can add custom topics from your manage dashboard before sharing the capsule. Default topics are suggested automatically based on your event type.' },
      { q: 'Do Community Stories appear in the Digital Publication?', a: 'Yes — if you have both Community Stories and Digital Publication activated, stories appear as topic chapters in the publication, separate from the tributes section.' },
      { q: 'Can stories include photos?', a: 'Yes — contributors can attach one photo to their story. The photo appears within their story card in the topic chapter.' },
    ],
    refundNote: 'Community Stories is activated immediately on payment and is non-refundable. The Stories room appears on your capsule immediately after activation.',
  },

}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getServiceDetail(id: string): ServiceDetail | null {
  return SERVICE_DETAILS[id] ?? null
}

export const ALL_SERVICE_IDS = Object.keys(SERVICE_DETAILS)
