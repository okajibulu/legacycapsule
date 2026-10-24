    LC02_EVENT_SERVICES_ENGINE.md
    LegacyCapsule Event Services Architecture
    Consumer of RW02 Event Services Platform
    VALNEX, UNIPESSOAL LDA · RevoWorldTech

    DOCUMENT INFORMATION
    Document ID:    LC02
    Owner:          LegacyCapsule Product Architecture
    Status:         Active — Revised post-RW02
    Platform Ref:   RW02_EVENT_SERVICES_PLATFORM.md
    Version:        v2.0
    Revised:        July 2026
    Revision By:    AI12 — Claude Opus 4.6
    Revision Brief: LC02-REV-001

PURPOSE
The Event Services Engine manages event logistics before and during an event.
While the Capsule Engine preserves memories and tributes, the Event Services Engine helps organisers coordinate attendance, participation, communication and event-day activities.
This engine is one of LegacyCapsule’s key differentiators from traditional tribute, memorial and event websites.

  ─────────────────────────────────────────────────────────
    PLATFORM RELATIONSHIP — IMPORTANT
    ─────────────────────────────────────────────────────────

    The event services capabilities described in this document
    are architecturally owned by the RevoWorld Event Services
    Platform (RW02).

    LegacyCapsule is a CONSUMER of RW02, not the owner of
    these capabilities.

    This document describes:
        · How LegacyCapsule uses RW02 capabilities
        · What LC-specific context and configuration is applied
        · Which capabilities remain exclusively LC-owned
        · The integration standard for LC's capsule context

    For the authoritative capability definitions, module
    specifications, data ownership rules, and Command Centre
    Contract, refer to:

        RW02_EVENT_SERVICES_PLATFORM.md


POSITION IN THE PLATFORM
Timeline coverage:
BEFORE EVENT ↓ DURING EVENT ↓ AFTER EVENT ↓ LONG AFTER EVENT
The Event Services Engine owns:
BEFORE EVENT and DURING EVENT

ENGINE STRUCTURE

 LC02 STRUCTURE — CONSUMER OF RW02

    Platform-Provided (via RW02)       LC-Owned
    ─────────────────────────────      ─────────────────────────
    RSVP Engine                        D-Day Collection Engine
    Guest Management Engine            Capsule Phase Lifecycle
    Access Control & Check-in          Context-Aware QR Redirect
    Table & Section Management         LC Integration Standard
    Attire Coordination Engine           (LC02A)
    Usher Session Management
    Event Command Centre

    LC02 documents how LegacyCapsule configures and consumes
    the RW02 platform modules, and defines the LC-specific
    capabilities that have no platform equivalent.

    MODULE 1 — RSVP ENGINE
    Platform Owner: RW02 (Section 5, Module 1)
    LC Status:      Consumer — LC configures, does not own
    LC Context:     Used for capsule event attendance tracking.
                    Scope identifier: capsule_id
REASON: Signals ownership boundary at the module level.

Purpose:
Track attendance intentions and provide organisers with reliable attendance forecasting.
Core Features:
	Invitation tracking
	RSVP responses
	Attendance forecasting
	Reminder scheduling
	RSVP exports
Response States:
	Attending
	Not Attending
	Undecided
Future States:
	Attending In Person
	Attending Virtually
	Family Representative
	Premium Guest Management
Suggested Tables:
rsvp_invitations
rsvp_responses
rsvp_reminders

    LC CONSUMER NOTE
    LegacyCapsule consumes the RSVP Engine using capsule_id
    as the scope identifier. All RSVP records belong to the
    capsule. LegacyCapsule does not extend the RSVP Engine
    with capsule-specific business logic — the core module
    is consumed as-is.


    MODULE 2 — GUEST MANAGEMENT ENGINE
    Platform Owner: RW02 (Section 5, Module 2)
    LC Status:      Consumer — partially implemented in LC
                    (v1.5.9–v1.7.8 build phase)
    LC Context:     Guest registry scoped to capsule_id.
                    Extended fields (participant_type,
                    vendor_company etc) are platform-standard.
REASON: The guest management component is built and live.
The revision must reflect that while correctly attributing
ownership to RW02.

Purpose:
Maintain the master registry of all invited and participating guests.
Core Features:
	Guest list
	Family grouping
	VIP management
	Guest tagging
	Attendance status
Guest Categories:
	Family
	Friend
	Colleague
	Community Member
	Religious Associate
	VIP
	Organiser Team
Future Features:
	Check-in
	Arrival tracking
	Guest badges
Suggested Tables:
event_guests
guest_groups
guest_tags

    LC CONSUMER NOTE
    The guests table and its extended fields were implemented
    in LegacyCapsule during the v1.5.9 build phase. These
    records conform to the RW02 Guest Management schema.
    GuestManagementSection component requires capsuleSlug prop
    — this is the LC implementation of the scope identifier.

    MODULE 3 — ACCESS CONTROL AND CHECK-IN ENGINE
    Platform Owner: RW02 (Section 5, Module 3)
    LC Status:      Consumer — fully implemented in LC
                    (v1.5.9–v1.6.0 build phase)
    LC Context:     All access code records scoped to capsule_id.
                    Access codes unique per capsule (composite
                    index), not globally unique.

REASON: The access code system is the most fully built of
all promoted modules. The revision must document the
implementation accurately while establishing platform ownership.

Purpose:
Control access to private event areas and restricted content.
Access Levels:
Public
Guest Access
VIP Access
Family Access
Organiser Access
Protected Assets:
	Event pages
	RSVP pages
	Publications
	Galleries
	D-Day uploads
Suggested Tables:
event_access_codes
event_access_logs

    LC CONSUMER NOTE
    The Access Code System was fully built during v1.5.9–v1.6.0.
    Files:
        app/api/access-codes/*     — all access code API routes
        app/api/usher/*            — usher session routes
        app/manage/[slug]/checkin/ — standalone check-in page
        components/manage/access-codes/* — 4 UI components

    Critical rules:
        · event_checkin_log is append-only — never update/delete
        · numeric_code is unique per capsule (composite index)
        · Usher check-in page has no navigation, no sidebar
        · GuestManagementSection requires capsuleSlug prop


    MODULE 4 — TABLE AND SECTION MANAGEMENT ENGINE
    Platform Owner: RW02 (Section 5, Module 4)
    LC Status:      Consumer — planned, not yet implemented
    LC Context:     Seating for capsule events (ceremonies,
                    weddings, memorials). Scope: capsule_id.
REASON: Consistent ownership signal. Clarifies this is event
seating, not restaurant table service.

Purpose:
Help organisers manage seating and guest allocation.
Core Features:
	Table creation
	Seat allocation
	Guest assignment
	Printable layouts
	Lookup tools
Future Features:
	QR seat lookup
	Interactive floor plans
Suggested Tables:
event_tables
table_assignments

    MODULE 5 — ATTIRE COORDINATION ENGINE
    Platform Owner: RW02 (Section 5, Module 5)
    LC Status:      Consumer — planned, not yet implemented
    LC Context:     Fabric and attire coordination for LC
                    events (weddings, chieftaincy, memorials).
                    Scope: capsule_id.
REASON: Ownership boundary established.

Purpose:
Coordinate event attire, fabrics, colours and collection logistics.
Particularly important for African weddings, memorials and cultural ceremonies.
Core Features:
	Fabric information
	Colour themes
	Vendor information
	Collection instructions
	Collection status tracking
Statuses:
Interested
Reserved
Paid
Collected
Declined
Suggested Tables:
event_attire
attire_orders
attire_collection_status

    MODULE 6 — D-DAY COLLECTION ENGINE
    Owner:    LegacyCapsule (LC-owned, NOT in RW02)
    Status:   Implemented — v1.6.6 build phase
    Reason:   D-Day capture outputs feed LC-specific data
              structures (gallery_items source='dday',
              contributions is_dday=true). The concept of
              capturing memories on event day for a permanent
              life capsule is inseparable from LC's purpose.
              No other current RevoWorldTech product requires
              this pattern.
    Future:   Candidate for RW02-F06 Media Capture module
              if a future product requires generic event-day
              capture. Do not extract prematurely.

Purpose:
Capture photos, videos and voice messages from attendees during the event.
Collection Methods:
QR code upload
Direct upload
Guest portal upload
Content Types:
Photos
Videos
Voice Notes
Future Features:
	Auto-tagging by phase
	AI-assisted grouping
	Publication integration
Suggested Tables:
event_media_uploads
event_media_tags

    LC IMPLEMENTATION NOTE
    D-Day portal implemented at app/for/[slug]/dday/page.tsx
    API route: app/api/dday/upload/route.ts
    D-Day window: 6am–6am, system-fixed, not organiser-adjustable
    Photos → gallery_items with source='dday'
    Tributes → contributions with is_dday=true

REASON: D-Day is the one module that stays LC-owned. Its header
must make this unambiguous so no future architect promotes it
to a platform service prematurely.

    MODULE 7 — EVENT COMMAND CENTRE
    Platform Owner: RW02 (Section 5, Module 7)
    LC Status:      Consumer — planned, not yet implemented
    LC Context:     Organiser operational view during capsule
                    events. Scope: capsule_id.
                    LC extends the Command Centre with
                    capsule-specific panels:
                        · Publication Readiness
                        · Tribute and Story Counts
                        · D-Day Capture Progress
                    These extensions are additive and do not
                    modify the Command Centre Contract.

Purpose:
Provide organisers with a real-time operational dashboard.

    PLATFORM REFERENCE
    The Command Centre architecture, including the Command
    Centre Contract, Event Pulse definition, Progressive
    Operational Disclosure standard, and Operational Role
    Framework, is fully specified in:

        RW02_EVENT_SERVICES_PLATFORM.md — Sections 5–11

    LC02 documents only the LC-specific configuration and
    extensions. The platform specification is authoritative.

REASON: The Command Centre specification in LC02 is extensive
and detailed. Replacing it entirely would lose valuable content.
The instruction instead correctly attributes ownership to RW02
while preserving LC's extension documentation.

Key Metrics:
RSVP Count
Expected Attendance
Check-ins
Media Uploads
Expression of Honour Notifications
Pending Actions
Publication Readiness
Future Metrics:
Guest arrival heatmap
Live upload feed
Venue activity indicators

    ═══════════════════════════════════════════════════════
    LC-OWNED CAPABILITIES (NOT IN RW02)
    ═══════════════════════════════════════════════════════

    The following capabilities are owned exclusively by
    LegacyCapsule. They are not part of RW02 and must not
    be treated as platform services.

    D-Day Collection Engine
        Purpose: Capture event-day photos and tributes for
        inclusion in the capsule memory record.
        Implementation: app/for/[slug]/dday/page.tsx
        Data: gallery_items (source='dday'),
              contributions (is_dday=true)

    Capsule Phase Lifecycle
        Purpose: Govern event phase transitions tied to
        capsule page_state.
        Phases: pre / live / post / anniversary
        These are capsule lifecycle states, not RW02 phases.

    Context-Aware QR Redirect
        Purpose: Redirect QR scans to the contextually
        correct destination based on capsule phase.
        Before event → tribute wall
        Event day window → D-Day portal
        After event → tribute wall
        Implementation: app/api/qr/[token]/route.ts

    LC Event Service Integration Standard (LC02A)
        Purpose: Define how event services integrate within
        the LC capsule context.
        This is the LC-specific complement to the platform's
        Command Centre Contract standard.

REASON: A dedicated section for LC-owned capabilities
ensures no future revision accidentally promotes them
to RW02 scope.

    RELATIONSHIP TO OTHER ENGINES

    LC02 Consumes (Platform):
        RW02  Event Services Platform (primary)
        RW01  Payment Services Platform (via feature purchases)

    LC02 Depends On (LC-internal):
        LC01  System Map (capsule scope and auth)
        LC08  Data Architecture (database standards)

    LC02 Supports (LC-internal):
        LC03  Legacy Publication System
              (D-Day captures feed publication)
        LC05  Legacy Continuity & Engagement Engine
              (event phases inform engagement triggers)
        LC06  Legacy Recognition Engine
              (event participation feeds recognition)

    Future:
        RW05  Identity Platform (role authentication)
        RW06  Notification Platform (RSVP reminders, alerts)

REASON: The previous version listed internal engines using
informal names. The revision uses correct document IDs and
reflects the updated platform architecture.


PHASED IMPLEMENTATION ORDER IN THE DOCUMENT


LC02_EVENT_SERVICES_ENGINE.md

PART I
Overview

PART II
LC02A — Event Service Integration Standard

PART III
LC02B — RSVP Engine

PART IV
LC02C — Guest Management Engine

PART V
LC02D — Access Control & Check-in Engine

PART VI
LC02E — D-Day Collection Engine

PART VII
LC02F — Attire Management Suite

PART VIII
LC02G — Table Management Engine

PART IX
LC02H — Event Command Centre Engine



FOUNDER PRINCIPLE
Event planning should be simpler because LegacyCapsule exists.
Every feature in this engine must reduce organiser workload, improve guest participation or increase event quality.



PART II
# LC02A_EVENT_SERVICE_INTEGRATION_STANDARD

FILE PATH

`LC02A_EVENT_SERVICE_INTEGRATION_STANDARD.md`

DOCUMENT OWNER

CG01 – LegacyCapsule Architecture

STATUS

Draft

VERSION

v1.0

CREATED

24 June 2026

LAST UPDATED

24 June 2026

DEPENDS ON

* LC01_SYSTEM_MAP.md
* LC02_EVENT_SERVICES_ENGINE.md
* LC03_LEGACY_PUBLICATION_SYSTEM.md
* LC04_PAYMENT_ENGINE.md
* LC05_ENGAGEMENT_ENGINE.md
* LC06_LEGACY_RECOGNITION_ENGINE.md
* LC08_DATA_ARCHITECTURE.md

SUPERSEDES

None

SUPERSEDED BY

None

DOCUMENT PURPOSE

Define the mandatory architectural, integration, ownership, lifecycle, notification, publication, recognition, audit and implementation standards that every Event Services Engine module must follow.

---

# DOCUMENT HISTORY

| Version | Date        | Author | Summary                                    |
| ------- | ----------- | ------ | ------------------------------------------ |
| v1.0    | 24 Jun 2026 | CG01   | Initial Event Service Integration Standard |

    | v2.0 | July 2026 | AI12 / Claude Opus 4.6 |
    | Revised post-RW02. Ownership of seven modules |
    | transferred to RW02 platform. LC repositioned as |
    | consumer. D-Day, Phase Lifecycle, QR Redirect, |
    | LC02A retained as LC-owned. Platform reference |
    | headers added to all promoted modules. |

REASON: Permanent governance audit trail.
---

# SECTION 1 — PURPOSE

The Event Services Engine is not a collection of independent features.

It is a coordinated operational layer that supports organisers before and during meaningful events.

This document exists to ensure that every current and future Event Service module behaves consistently across:

* Architecture
* Data ownership
* Lifecycle management
* Dashboard experience
* Notification handling
* Publication integration
* Recognition integration
* Audit requirements
* Future ecosystem extraction

No Event Service module may be specified or implemented outside this standard.

---

# SECTION 2 — SCOPE

This standard governs:

### Current Modules

* RSVP Engine
* Guest Management Engine
* Access Control & Check-in Engine
* D-Day Collection Engine
* Attire Coordination Engine
* Table Management Engine
* Event Command Centre

### Future Modules

* Volunteer Management
* Vendor Management
* Transport Coordination
* Accommodation Coordination
* Event Operations Extensions

All future Event Service modules inherit this standard automatically.

---

# SECTION 3 — EVENT SERVICE POSITION WITHIN LEGACYCAPSULE

Event Services occupy the operational phase of the platform.

```text
Profile
    ↓
Planning
    ↓
Event Services
    ↓
Event Day
    ↓
Publication
    ↓
Engagement
    ↓
Recognition
```

The Event Services Engine exists primarily in:

### Before Event

Planning

Coordination

Preparation

Forecasting

### During Event

Execution

Participation

Collection

Monitoring

### Not Responsible For

Publication generation

Recognition management

Commercial payments

Long-term engagement

Those remain owned by their respective engines.

---

# SECTION 4 — EVENT SERVICE ARCHITECTURAL PRINCIPLES

## Principle 1 — Capsule Centric

Every service belongs to a capsule.

Never create orphan operational records.

Ownership chain:

```text
User
  ↓
Capsule
  ↓
Event Service Records
```

---

## Principle 2 — Single Source Of Truth

Guest data must not be duplicated.

Attendee data must not be duplicated.

Access permissions must not be duplicated.

Every module references authoritative records.

---

## Principle 3 — Service Independence

Each service must be deployable independently.

Example:

RSVP can launch before Table Management.

Attire Coordination can launch before Access Codes.

Modules may depend on shared infrastructure but must not require all modules to exist.

---

## Principle 4 — Publication Awareness

Every module must assume publication integration will occur.

Operational data should be publication-ready.

---

## Principle 5 — Recognition Awareness

Meaningful participation may later generate:

* badges
* achievements
* recognition milestones

Modules must preserve sufficient participation history.

---

# SECTION 5 — STANDARD OWNERSHIP MODEL

Every Event Service record must support:

```text
capsule_id
owner_user_id
created_by
created_at
updated_at
```

Where applicable:

```text
status
is_active
deleted_at
```

Soft deletion is preferred.

Hard deletion should be exceptional.

This aligns with Data Architecture policy. 

---

# SECTION 6 — STANDARD LIFECYCLE MODEL

Every Event Service module must support:

### Draft

Being configured.

### Active

Available to participants.

### Suspended

Temporarily disabled.

### Completed

Operational purpose fulfilled.

### Archived

Retained for history.

```text
Draft
 ↓
Active
 ↓
Completed
 ↓
Archived
```

Suspended may occur from any active state.

---

# SECTION 7 — STANDARD DASHBOARD INTEGRATION

Every Event Service must expose:

### Service Card

Displayed in Organiser Dashboard.

Contains:

* Service name
* Status
* Progress summary
* Alerts

---

### Service Workspace

Dedicated management interface.

Examples:

```text
/manage/[slug]/rsvp

/manage/[slug]/guests

/manage/[slug]/attire
```

---

### Service Metrics

Each module must expose metrics consumable by:

* Event Command Centre
* Publication Engine
* Recognition Engine
* Future Analytics Service

---

# SECTION 8 — STANDARD NOTIFICATION INTEGRATION

Every Event Service must integrate with Notification Engine.

Notifications are event-driven.

Examples:

### RSVP

Invitation sent

Reminder sent

Response received

---

### Guest Management

Guest added

VIP tagged

Status changed

---

### Attire

Reservation made

Collection reminder

Collection confirmed

---

### D-Day

Upload received

Upload milestone reached

---

Notification history belongs to Notification Domain.

Services only emit events.

---

# SECTION 9 — STANDARD PUBLICATION INTEGRATION

Event Services contribute operational context to publications.

Examples:

### RSVP Engine

Attendance summary

Participation statistics

---

### Guest Management

Guest representation

Community representation

---

### D-Day Collection

Event photos

Event videos

Voice captures

---

### Attire Coordination

Cultural context

Visual identity references

---

### Event Command Centre

Event activity summary

Publication Engine remains publication owner.

Event Services provide source material only.

This aligns with the Publication System architecture. 

---

# SECTION 10 — STANDARD RECOGNITION INTEGRATION

Event Services may generate recognition inputs.

Examples:

### RSVP

High participation events

---

### Guest Management

Community engagement

---

### D-Day Collection

Contributor participation

---

### Event Command Centre

Operational excellence indicators

Recognition ownership remains with Recognition Engine. 

---

# SECTION 11 — STANDARD PAYMENT INTEGRATION

Event Services must never process payments directly.

All commercial actions route through Payment Engine.

Examples:

```text
Attire Reservation Fee
VIP Access Upgrade
Premium Event Services
```

Flow:

```text
Event Service
     ↓
Payment Engine
     ↓
Verification
     ↓
Service Activation
```

This maintains payment abstraction compliance. 

---

# SECTION 12 — STANDARD AUDIT REQUIREMENTS

The following actions must generate audit records:

* Service activation
* Service suspension
* Status changes
* Bulk imports
* Guest exports
* Access permission changes
* Table assignments
* Attire collection confirmations
* D-Day moderation actions

Audit records should include:

```text
actor
action
entity
entity_id
before
after
timestamp
```

---

# SECTION 13 — STANDARD REPORTING CONTRACT

Every Event Service must expose:

### Operational Metrics

Current activity.

### Historical Metrics

Past event performance.

### Publication Metrics

Data suitable for publication inclusion.

### Recognition Metrics

Data suitable for recognition evaluation.

### Analytics Metrics

Future ecosystem analytics consumption.

---

# SECTION 14 — STANDARD API CONTRACT

Each Event Service should expose:

```text
GET
POST
PATCH
DELETE (soft)
```

Recommended pattern:

```text
/api/event-services/[service]
```

Examples:

```text
/api/event-services/rsvp

/api/event-services/guests

/api/event-services/attire
```

Provides consistency for future extraction.

---

# SECTION 15 — STANDARD DATA DOMAIN POSITION

Event Services belong to:

### Domain 7 — Event Services

As defined in LC08 Data Architecture. 

Ownership examples:

```text
RSVP → Capsule

Guest → Capsule

Attire Order → Capsule

Access Code → Capsule

Table Assignment → Capsule

D-Day Upload → Capsule
```

---

# SECTION 16 — FUTURE ECOSYSTEM EXTRACTION

The Event Services Engine should be extractable into:

```text
RevoWorld Event Services Platform
```

Future consumers:

* LegacyCapsule
* Communiva
* Cadence
* LoungeMaster

Therefore:

* avoid LegacyCapsule-specific table names where possible
* maintain clean service boundaries
* maintain event ownership clarity

---

# SECTION 17 — IMPLEMENTATION SEQUENCE STANDARD

Modules should be implemented in this order:

### Phase 1

RSVP Engine

### Phase 2

Guest Management Engine

### Phase 3

Access Control & Check-in Engine

### Phase 4

D-Day Collection Engine

### Phase 5

Attire Coordination Engine

### Phase 6

Table Management Engine

### Phase 7

Event Command Centre

Matches founder roadmap and Event Services architecture.  

---

# SECTION 18 — FOUNDER PRINCIPLES

Event Services exist to reduce organiser workload.

Event Services exist to improve guest participation.

Event Services exist to improve event quality.

Operational complexity should be absorbed by the platform, not pushed onto organisers.

The platform should feel like an experienced event operations assistant rather than a collection of tools.

Every Event Service must answer at least one question:

* Does it save time?
* Does it reduce stress?
* Does it improve participation?
* Does it improve event quality?
* Does it improve legacy preservation?

If not, it should not be built.

---

# COMPONENT_MAP ADDITIONS

When this document is approved, add:

| Component                      | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| EventServiceIntegrationLayer   | Shared standards layer for all Event Services |
| EventServiceLifecycleManager   | Standard lifecycle handling                   |
| EventServiceAuditManager       | Audit framework                               |
| EventServiceNotificationBridge | Notification integration                      |
| EventServicePublicationBridge  | Publication integration                       |
| EventServiceRecognitionBridge  | Recognition integration                       |
| EventServiceMetricsContract    | Reporting contract                            |
| EventServiceDashboardContract  | Dashboard integration standard                |

---

PART III
LC02B_RSVP_ENGINE

FILE PATH

LC02B_RSVP_ENGINE

DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

STATUS

Draft

VERSION

v1.0

CREATED

24 June 2026

LAST UPDATED

24 June 2026

DEPENDS ON

LC02_EVENT_SERVICES_ENGINE.md
LC02A_EVENT_SERVICE_INTEGRATION_STANDARD
LC04_PAYMENT_ENGINE.md
LC08_DATA_ARCHITECTURE.md

SUPERSEDES

None

SUPERSEDED BY

None

DOCUMENT PURPOSE

Define the RSVP Engine architecture, user experience, lifecycle, data ownership, integrations and implementation standards for attendance planning and participation forecasting within LegacyCapsule.

SECTION 1 — PURPOSE

The RSVP Engine exists to help organisers understand:

Who is coming?

Who is not coming?

Who has not responded?

What attendance should be expected?

The purpose is not merely collecting responses.

The purpose is reducing uncertainty and improving planning quality.

SECTION 2 — PROBLEM SOLVED

Without RSVP:

Attendance estimates are unreliable.
Catering quantities become guesswork.
Seating plans become inaccurate.
Event communication becomes inefficient.
Organisers repeatedly chase guests.

The RSVP Engine centralises attendance management.

SECTION 3 — ORGANISER EXPERIENCE

The organiser should be able to:

Create invitations
Send invitations
Track responses
Monitor attendance forecasts
View non-responders
Send reminders
Export attendance information

The organiser should never need spreadsheets for basic attendance planning.

SECTION 4 — GUEST EXPERIENCE

Guest experience must remain frictionless.

Guest receives:

Invitation
↓
Response Page
↓
Confirmation

Maximum completion target:

Less than 30 seconds

No account creation required.

SECTION 5 — RSVP DISCOVERY EXPERIENCE

Before activation:

Discovery Card
RSVP+

Know who is attending before event day.

Track responses.
Send reminders.
Forecast attendance.

Benefits:

Attendance planning
Family tracking
VIP visibility
Reminder automation

SECTION 5A — RSVP PARTICIPATION PHILOSOPHY

Purpose:

RSVP should feel like participation rather than administration.

The RSVP Engine exists to help guests indicate their intended level of participation while helping organisers forecast attendance and prepare effectively.

Founder Principles:

Minimise guest effort.
Maximise organiser clarity.
Encourage participation.
Reduce uncertainty.
Avoid unnecessary data collection.
SECTION 5B — RSVP MODELS

The RSVP Engine supports multiple participation models.

Open RSVP

Available to anyone with access.

Invitation RSVP

Available only to invited participants.

Family RSVP

One response may represent multiple family members.

VIP RSVP

Supports enhanced tracking and management.

Access-Controlled RSVP

Requires valid access credentials.

Future integration:

Access Control & Check-in Engine
SECTION 5C — RSVP IDENTITY FRAMEWORK

Response identity may originate from:

Guest Record

Email

Phone Number

Access Code

Manual Entry

The RSVP Engine validates participation identity.

The RSVP Engine does not own guest records.

SECTION 5D — RSVP OWNERSHIP RULES

Ownership separation shall remain explicit.

RSVP Engine Owns
Response Status

Response Timestamp

Response Notes

Reminder History
Guest Management Engine Owns
Guest Identity

Family Relationships

VIP Status

Guest Categories

Guest Tags

Founder Rule:

RSVP owns responses.

Guest Management owns people.

SECTION 6 — ACTIVATION MODEL

Visibility Type:

Public Experience

Activation Type:

Payment Activated

Commercial Type:

One-Time Event Activation

Available During Reservation:

Yes

Available Post Activation:

Yes

SECTION 7 — SERVICE LIFECYCLE

States:

Available
↓
Selected
↓
Awaiting Payment
↓
Activated
↓
Configured
↓
Published
↓
Live
↓
Completed
↓
Archived

SECTION 8 — RESPONSE STATES

Initial:

No Response

Primary:

Attending

Not Attending

Undecided

Future:

Attending In Person

Attending Virtually

Family Representative

VIP Guest

SECTION 9 — RSVP ONBOARDING FLOW

Step 1

Introduction

Step 2

Invitation Setup

Step 3

Response Settings

Step 4

Preview

Step 5

Activate

Standard LC02A onboarding applies.

SECTION 10 — DASHBOARD EXPERIENCE

Bottom Navigation:

Overview
Activity
Legacy
Reports
Help
Overview

KPIs

Invited

Responded

Attending

Pending
Activity

Core working area.

Invitations

Responses

Reminders
Legacy

Publication contribution preview.

Recognition contribution preview.

Reports

Attendance analytics.

Help

Guides.

FAQ.

Best practices.

SECTION 11 — PUBLIC EXPERIENCE

Public RSVP page appears through:

Experience Rail

Example:

[ RSVP ]

Visible only after publication by organiser.

SECTION 11A — VISIBILITY RULES

Public RSVP experiences remain hidden until:

Activated
+
Configured
+
Published

Activation alone does not make a service publicly visible.

This prevents incomplete experiences from appearing to guests.


SECTION 12 — DATA OWNERSHIP

Domain:

EVENT SERVICES

Owner:

Capsule

Tables:

rsvp_invitations
rsvp_responses
rsvp_reminders

Future:

rsvp_groups
rsvp_exports

Aligned with LC08 ownership rules.

SECTION 13 — NOTIFICATION INTEGRATION

Supported:

Email Invitations
Reminder Emails
Confirmation Emails

Future:

SMS Invitations
WhatsApp Invitations
Push Notifications

Notification Engine remains owner of delivery.

SECTION 14 — PUBLICATION INTEGRATION

Publication Contributions:

Attendance Statistics
Participation Metrics
Geographic Reach
Community Representation

Publication should not expose private attendee information.

Only aggregated metrics.

This aligns with the publication philosophy.


SECTION 14A — PUBLICATION CONTRIBUTION MATRIX

Eligible Publication Contributions:

Contribution	Allowed
Attendance Forecast	Yes
Response Rate	Yes
Geographic Reach	Yes
Participation Representation	Yes
Guest Names	No
Email Addresses	No
Phone Numbers	No

Privacy takes precedence over publication completeness.

SECTION 15A — RECOGNITION CONTRIBUTION FRAMEWORK

Potential Recognition Signals:

Early Responder

Family Mobiliser

Community Connector

Participation Champion

Recognition contributions must be derived from participation behaviour rather than personal information.


SECTION 15 — RECOGNITION INTEGRATION

Potential inputs:

Early Responders
Community Participation
Family Participation
Organiser Achievement Metrics

Recognition Engine consumes participation signals only.

SECTION 16 — ENGAGEMENT INTEGRATION

Potential future uses:

Anniversary Attendance Reflection
Milestone Participation
Community Engagement Metrics
Event Reach Analysis

Supports future Engagement Engine capabilities.

SECTION 17 — REPORTING FRAMEWORK

Metrics:

Invitations Sent
Responses Received
Response Rate
Attendance Forecast
Pending Responses
Reminder Effectiveness

Exports:

CSV
PDF Summary

Future:

Planner Analytics


SECTION 17A — REMINDER STRATEGY FRAMEWORK

Supported reminder triggers:

7 Days

3 Days

1 Day

Custom

Supported channels:

Email

SMS

WhatsApp

Reminder delivery remains under Notification Engine governance.

SECTION 17B — EVENT-TYPE ADAPTATION FRAMEWORK

The RSVP Engine shall support event-specific question sets.

Wedding

Examples:

Attendance

Guest Count

Meal Preference

Family Participation
Memorial

Examples:

Attendance Intention

Family Representation
Recognition Event

Examples:

Attendance

Institution Representation

The engine remains consistent while adapting to event requirements.

SECTION 17C — SNAPSHOT CONTRIBUTION FRAMEWORK

Contribution Type:

Metrics Only

Potential Snapshot Contributions:

Response Rate

Attendance Forecast

Community Reach

Participation Representation

No personally identifiable information may appear in Snapshot contributions.

CG03 Review Outcome

SECTION 18 — SECURITY & PRIVACY

Guest information is private.

Public capsule pages may display:

125 Guests Expected

but never:

Guest Names
Email Addresses
Phone Numbers

unless organiser permissions explicitly allow.

SECTION 19 — IMPLEMENTATION ROADMAP

Phase 1

Database

Phase 2

Invitation APIs

Phase 3

Response Portal

Phase 4

Reminder Engine

Phase 5

Dashboard

Phase 6

Publication Integration

Phase 7

Recognition Integration

SECTION 20 — COMPONENT MAP IMPACT

New Components:

RSVPOverviewCard

RSVPInvitationManager

RSVPResponsePortal

RSVPReminderManager

RSVPAnalyticsPanel

RSVPPublicExperience

RSVPPublicationBridge

RSVPRecognitionBridge

New APIs:

/api/rsvp/invite

/api/rsvp/respond

/api/rsvp/remind

/api/rsvp/report

New Tables:

rsvp_invitations

rsvp_responses

rsvp_reminders


SECTION 21 — FOUNDER PRINCIPLES

RSVP should reduce organiser uncertainty.

RSVP should minimise guest friction.

Attendance forecasting should be simple.

Response collection should feel effortless.

The organiser should gain clarity, not administration.



PART IV

# LC02C_GUEST_MANAGEMENT_ENGINE

FILE PATH

```text
LC02C_GUEST_MANAGEMENT_ENGINE
```

DOCUMENT OWNER

```text
CG03 – LegacyCapsule Build Auditor
```

STATUS

```text
Draft
```

VERSION

```text
v1.0
```

CREATED

```text
24 June 2026
```

LAST UPDATED

```text
24 June 2026
```

DEPENDS ON

```text
LC02_EVENT_SERVICES_ENGINE.md

LC02A_EVENT_SERVICE_INTEGRATION_STANDARD

LC02B_RSVP_ENGINE

LC08_DATA_ARCHITECTURE.md
```

SUPERSEDES

```text
None
```

SUPERSEDED BY

```text
None
```

DOCUMENT PURPOSE

Define the Guest Management Engine as the authoritative Event Participant Registry for all Event Services within LegacyCapsule.

---

# SECTION 1 — PURPOSE

The Guest Management Engine exists to provide a single authoritative source of truth for all event participants.

The engine manages:

```text
People

Groups

Families

VIPs

Relationships

Participant Categories
```

and serves as the participant foundation for:

```text
RSVP

Access Codes

Table Management

Check-In

Command Centre

Recognition

Publication
```

Founder Principle:

```text
Guest Management owns people.

Other services own interactions.
```

---

# SECTION 2 — EVENT PARTICIPANT PHILOSOPHY

LegacyCapsule does not merely manage guests.

LegacyCapsule manages participation.

Every participant contributes to the success and memory of an event.

Participants may include:

```text
Guests

Family Members

VIPs

Organisers

Volunteers

Media Teams

Vendors

Sponsors
```

The Guest Management Engine exists to understand who participates.

---

# SECTION 3 — PARTICIPANT REGISTRY MODEL

Internal Architecture Name:

```text
Event Participant Registry
```

Customer Facing Name:

```text
Guest Management
```

This distinction allows the platform to remain intuitive while supporting future expansion.

---

# SECTION 4 — PARTICIPANT TYPES

Launch Types:

```text
Guest

Family

VIP

Organiser

Volunteer

Vendor

Media
```

Future Types:

```text
Sponsor

Performer

Protocol

Security

Partner Organisation
```

Participant Types must remain configurable.

---

# SECTION 5 — PARTICIPANT CATEGORIES

Categories provide logical grouping.

Examples:

```text
Friends

Colleagues

Church Members

School Alumni

Community Members

Neighbours

Professional Associates
```

Categories support:

```text
Reporting

Recognition

Publication

Communications
```

---

# SECTION 6 — FAMILY BRANCH ARCHITECTURE

Family relationships are first-class citizens.

Examples:

```text
Bride Family

Groom Family
```

---

```text
Maternal Family

Paternal Family
```

---

```text
Immediate Family

Extended Family

In-Laws
```

Purpose:

```text
Participation Analysis

RSVP Tracking

Recognition

Publication Context
```

---

# SECTION 7 — PARTICIPANT TAGGING FRAMEWORK

Participants may be tagged.

Examples:

```text
VIP

Speaker

Elder

Committee Member

Sponsor

Media Partner
```

Tags remain flexible.

Tags must not replace participant types.

---

# SECTION 8 — PARTICIPANT RELATIONSHIP FRAMEWORK

Relationships may be declared.

Examples:

```text
Spouse

Parent

Child

Sibling

Friend

Colleague

Mentor
```

Future publication and recognition systems may consume these relationships.

---

# SECTION 9 — PARTICIPANT LIFECYCLE

Standard lifecycle:

```text
Created
↓
Invited
↓
Responded
↓
Confirmed
↓
Checked In
↓
Participated
↓
Archived
```

The Guest Management Engine owns lifecycle status.

Other engines may update lifecycle progression.

---

# SECTION 10 — DISCOVERY EXPERIENCE

Discovery Card:

```text
Guest Management Suite

Manage participants,
attendance,
access,
and seating
from one place.
```

Benefits:

```text
Central Registry

Family Tracking

VIP Management

Participation Insights

Operational Control
```

---

# SECTION 11 — COMMERCIAL CLASSIFICATION

Visibility:

```text
Internal
```

Activation Type:

```text
Payment Activated
```

Commercial Type:

```text
One-Time Event Activation
```

Included In:

```text
Guest Management Suite
```

Suite Components:

```text
Guest Management

RSVP+

Access Codes

Table Management
```

---

# SECTION 12 — OWNERSHIP RULES

Guest Management Owns:

```text
Participant Identity

Participant Type

Categories

Groups

Tags

Relationships

Lifecycle Status
```

Guest Management Does Not Own:

```text
RSVP Responses

Access Codes

Table Assignments

Check-In Logs

Media Uploads
```

Those remain under their respective engines.

---

# SECTION 13 — DASHBOARD EXPERIENCE

Navigation:

```text
Overview

Activity

Legacy

Reports

Help
```

Overview:

```text
Total Participants

Families

VIPs

Groups

Participation Status
```

Activity:

```text
Registry

Groups

Tags

Relationships
```

---

# SECTION 14 — PUBLICATION INTEGRATION

Eligible Contributions:

```text
Family Representation

Community Representation

Participant Diversity

VIP Participation

Geographic Representation
```

Publication must consume only aggregate information.

No personal information is published automatically.

---

# SECTION 15 — SNAPSHOT CONTRIBUTION

Contribution Type:

```text
Metrics Only
```

Examples:

```text
Total Participants

Family Representation

Community Reach

VIP Participation
```

---

# SECTION 16 — RECOGNITION INTEGRATION

Potential Recognition Inputs:

```text
Family Participation

Community Participation

Volunteer Participation

Committee Participation
```

Recognition Engine consumes metrics.

Not identities.

---

# SECTION 17 — FUTURE CHECK-IN FRAMEWORK

Check-In is planned as a future Guest Management submodule.

Potential Features:

```text
Arrival Tracking

Attendance Verification

QR Check-In

VIP Arrival Tracking
```

Check-In shall consume Participant Registry data.

---

# SECTION 18 — COMMAND CENTRE INTEGRATION

The Event Command Centre consumes:

```text
Participant Counts

VIP Counts

Arrival Status

RSVP Statistics

Participation Metrics
```

Guest Management remains the source of truth.

---

# SECTION 19 — DATA OWNERSHIP

Suggested Tables:

```text
event_participants

participant_groups

participant_categories

participant_tags

participant_relationships

participant_lifecycle
```

Primary Owner:

```text
Capsule
```

Domain:

```text
Event Services
```

---

# SECTION 20 — COMPONENT MAP IMPACT

New Components:

```text
ParticipantRegistry

ParticipantProfile

ParticipantGroupManager

ParticipantCategoryManager

ParticipantTagManager

FamilyBranchManager

ParticipantRelationshipManager

ParticipantLifecycleManager

VIPManager
```

New APIs:

```text
/api/participants

/api/participants/groups

/api/participants/tags

/api/participants/relationships
```

New Tables:

```text
event_participants

participant_groups

participant_categories

participant_tags

participant_relationships

participant_lifecycle
```

---

# SECTION 21 — FOUNDER PRINCIPLES

```text
Guests are not merely attendees.

Guests are participants.
```

```text
Guest Management owns people.

Other services own interactions.
```

```text
A participant should exist once
and be reused throughout the platform.
```

```text
Event Services should share participant intelligence,
not duplicate participant records.
```

---

# COMPONENT MAP ADDITIONS REQUIRED

```text
ParticipantRegistry

ParticipantProfile

ParticipantGroupManager

ParticipantCategoryManager

ParticipantTagManager

FamilyBranchManager

ParticipantRelationshipManager

ParticipantLifecycleManager

VIPManager



PART V
LC02_ACCESS_CONTROL_ENGINE

DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

STATUS

Draft

VERSION

v1.0

CREATED

24 June 2026

LAST UPDATED

24 June 2026

DEPENDS ON

- LC02_EVENT_SERVICES_ENGINE.md
- LC02A_EVENT_SERVICE_INTEGRATION_STANDARD
- LC02C_GUEST_MANAGEMENT_ENGINE
- LC04_PAYMENT_ENGINE.md
- LC08_DATA_ARCHITECTURE.md

SUPERSEDES

None

SUPERSEDED BY

None

DOCUMENT PURPOSE

Define the Access Control & Check-in Engine as the access control, entitlement and admission framework for LegacyCapsule Event Services and protected capsule experiences.

---

# DOCUMENT HISTORY

| Version | Date | Summary |
|----------|----------|----------|
| v1.0 | 24 Jun 2026 | Initial specification |

---

# SECTION 1 — PURPOSE

The Access Control & Check-in Engine controls access to protected event experiences, restricted content and authorised participation.

The engine exists to ensure organisers can decide:

- Who can access
- What can be accessed
- When access is allowed
- How access is verified

---

# SECTION 2 — ACCESS PHILOSOPHY

Access should be:

- Secure
- Simple
- Flexible
- Event-aware

The objective is not security complexity.

The objective is controlled participation.

---

# SECTION 3 — POSITION IN EVENT SERVICES

The Access Control & Check-in Engine consumes participant records from the Guest Management Engine.

Ownership model:

Guest Management → Participant Identity

Access Control & Check-in Engine → Access Rights

The Access Control & Check-in Engine never owns participant records.

---

# SECTION 4 — ACCESS LEVELS

Supported levels:

- Public
- Guest Access
- Family Access
- VIP Access
- Organiser Access

Future:

- Vendor Access
- Media Access
- Volunteer Access
- Sponsor Access

---

# SECTION 5 — PROTECTED RESOURCES

The engine may protect:

- RSVP Experiences
- Private Capsule Pages
- D-Day Upload Portals
- Publications
- Galleries
- Event Resources
- VIP Areas

---

# SECTION 6 — ACCESS CODE TYPES

## Single Use

Valid once.

## Multi Use

Reusable within limits.

## Family Code

Shared by family group.

## VIP Code

Enhanced permissions.

## Time Limited Code

Expires automatically.

## Event Window Code

Valid only during configured event period.

---

# SECTION 7 — CODE DELIVERY METHODS

Supported channels:

- Email
- SMS
- WhatsApp
- Manual Distribution
- QR Code

---

# SECTION 8 — QR FRAMEWORK

Access Codes may generate QR representations.

Uses:

- Event Entry
- RSVP Verification
- D-Day Upload Access
- VIP Access
- Future Check-In

---

# SECTION 9 — ACTIVATION MODEL

Visibility Type:

Internal

Commercial Type:

Included within Guest Management Suite

Activation:

Payment Activated

---

## ACCESS CONTROL WORKFLOW

Invitation

↓

RSVP

↓

Guest Approval

↓

Credential Generation

↓

Credential Delivery

↓

Verification

↓

Check-in

↓

Attendance Update

↓

Occupancy Update

↓

Command Centre Update

---

# SECTION 10 — ACCESS LIFECYCLE

Available
↓
Generated
↓
Distributed
↓
Activated
↓
Used
↓
Expired
↓
Archived

---

# SECTION 11 — PARTICIPANT INTEGRATION

Access codes may be assigned to:

- Individual Participants
- Families
- Groups
- Categories
- VIP Lists

Participant ownership remains within Guest Management.

---

# SECTION 12 — PUBLIC EXPERIENCE RULES

Protected experiences remain hidden until:

- Service Activated
- Service Configured
- Service Published

Unauthorised users should receive guided access requests where permitted.

---

# SECTION 13 — PAYMENT INTEGRATION

The engine never processes payments.

Commercial activation flows through LC04 Payment Engine.

Potential premium uses:

- VIP Event Access
- Private Publications
- Premium Galleries
- Restricted Experiences

---

# SECTION 14 — SNAPSHOT CONTRIBUTION

Contribution Type:

Metrics Only

Examples:

- Access Requests
- Access Utilisation
- Participation Reach

No access codes are exposed publicly.

---

# SECTION 15 — PUBLICATION CONTRIBUTION

Allowed:

- Participation Metrics
- Access Statistics
- Geographic Representation

Not Allowed:

- Access Codes
- Participant Credentials
- Security Information

---

# SECTION 16 — RECOGNITION INTEGRATION

Potential Inputs:

- VIP Participation
- Family Participation
- Community Participation

Recognition consumes outcomes, not credentials.

---

# SECTION 17 — EVENT COMMAND CENTRE INTEGRATION

Metrics supplied:

- Active Codes
- Used Codes
- Expired Codes
- Access Success Rate
- Access Failures

---

# SECTION 18 — DATA OWNERSHIP

### Owns

* Access Credentials
* Credential Status
* Verification Events
* Check-in Records
* Attendance Events

### Consumes

* Guest Information (Guest Management)
* RSVP Status
* Seating Assignment
* Event Configuration

### Publishes

* Guest Checked In
* Guest Denied Entry
* Attendance Updated
* Occupancy Updated
* VIP Arrival
* Command Centre Events

Suggested Tables:

- event_access_codes
- event_access_assignments
- event_access_logs
- event_access_permissions

Domain:

Event Services

Owner:

Capsule

---

# SECTION 19 — API CONTRACT

- /api/access-codes
- /api/access-codes/generate
- /api/access-codes/assign
- /api/access-codes/validate
- /api/access-codes/logs

---

# SECTION 20 — COMPONENT MAP IMPACT

New Components:

- AccessCodeManager
- AccessCodeGenerator
- AccessCodeValidator
- AccessCodeAssignmentManager
- QRAccessGenerator
- AccessPermissionManager
- AccessAuditPanel

New APIs:

- access-codes
- access-assignments
- access-validation

New Tables:

- event_access_codes
- event_access_assignments
- event_access_logs
- event_access_permissions

---

# SECTION 21 — FOUNDER PRINCIPLES

Access should never create friction without purpose.

Protected experiences should remain easy to join for authorised participants.

Guest Management owns people.

Access Control & Check-in Engine owns permissions.

Every access decision should be traceable through audit records.
Access credentials do not grant entry.

Verification grants entry.

Check-in records attendance.

Attendance generates operational intelligence.

Each responsibility belongs to a different module to maintain architectural clarity and future extensibility.

## INTERNAL MODULES

The Access Control Engine consists of four cooperating modules.

### 1. Credential Management

Responsible for the complete lifecycle of event access credentials.

Functions include:

* Credential generation
* QR code generation
* Numeric/alphanumeric code generation
* Credential activation
* Credential expiry
* Credential revocation
* Credential reissue
* Guest-to-credential association

This module owns credential identity only.

---

### 2. Verification Interface

Responsible for verifying presented credentials at authorised entry points.

Supported verification methods:

* QR code scanning
* Manual access code entry
* Guest name lookup
* Phone number lookup

Future capability:

* NFC verification
* Barcode verification
* Digital wallet verification

The Verification Interface determines whether entry should be granted.

It does not record attendance.

---

### 3. Check-in Engine

Responsible for recording successful and unsuccessful entry attempts.

Records include:

* Timestamp
* Entry gate
* Verification operator
* Verification device
* Entry outcome
* Re-entry attempts
* Manual overrides
* Denied access attempts

The Check-in Engine owns attendance events.

---

### 4. Attendance Intelligence

Transforms check-in events into operational intelligence.

Provides:

* Live attendance count
* Current occupancy
* Arrival trends
* No-show analysis
* Peak arrival periods
* Zone occupancy
* Table occupancy
* VIP arrival monitoring

Attendance Intelligence publishes operational events to the Event Command Centre.

PART VI
# LC02E_DDAY_COLLECTION_ENGINE

FILE PATH

`LC02E_DDAY_COLLECTION_ENGINE.md`

DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

STATUS

Draft

VERSION

v1.0

CREATED

24 June 2026

LAST UPDATED

24 June 2026

DEPENDS ON

- LC02_EVENT_SERVICES_ENGINE.md
- LC02A_EVENT_SERVICE_INTEGRATION_STANDARD
- LC03_LEGACY_PUBLICATION_SYSTEM.md
- LC05_ENGAGEMENT_ENGINE.md
- LC08_DATA_ARCHITECTURE.md

SUPERSEDES

None

SUPERSEDED BY

None

DOCUMENT PURPOSE

Define the D-Day Collection Engine responsible for capturing event-day memories, media, reactions and participant-generated content during live events.

---

# DOCUMENT HISTORY

| Version | Date | Summary |
|----------|----------|----------|
| v1.0 | 24 Jun 2026 | Initial specification |

---

# SECTION 1 — PURPOSE

The D-Day Collection Engine exists to capture authentic event experiences while they are happening.

The objective is not media storage.

The objective is preserving participation, reactions, emotions and moments that would otherwise be lost.

---

# SECTION 2 — COLLECTION PHILOSOPHY

Professional photographers document events.

Participants experience events.

The D-Day Collection Engine captures the participant perspective.

Founder Principle:

Important moments should not be lost simply because nobody on the official media team captured them.

---

# SECTION 3 — COMMERCIAL MODEL

Commercial Unit:

D-Day Capture Window

Definition:

6:00 AM
↓
6:00 AM Next Day

A capture window remains active for 24 hours.

---

# SECTION 4 — DEFAULT ENTITLEMENT

Standard Activation Includes:

2 Capture Windows

Suitable for:

- Weddings
- Memorial Events
- Celebrations
- Conferences
- Multi-stage Events

Additional Capture Windows may be purchased.

---

# SECTION 5 — COLLECTION STREAMS

## Stream A — Guest Live Collection

Active during capture windows.

Supports:

- Photos
- Videos
- Voice Messages
- Event Moments

---

## Stream B — Official Media Collection

Organiser controlled.

Supports:

- Professional Photography
- Videography
- Drone Footage
- Official Albums
- Curated Highlights

Official uploads may occur days or weeks after the event.

---

# SECTION 6 — COLLECTION METHODS

Supported:

- QR Upload
- Guest Upload Portal
- Direct Link Upload
- Access Code Protected Upload
- Future Mobile Upload

---

# SECTION 7 — CONTENT TYPES

Launch:

- Photos
- Videos
- Voice Messages

Future:

- Stories
- Testimonials
- Audio Tributes
- Live Reactions

---

# SECTION 8 — EVENT SEGMENTS

Although pricing is based on Capture Windows, content may be organised internally by:

- Introduction
- Ceremony
- Reception
- After Party
- Thanksgiving
- Session
- Programme Item

Segments do not affect billing.

---

# SECTION 9 — VISIBILITY MODEL

Visibility Type:

Public Experience

Participants contribute content.

Organisers moderate publication visibility.

---

# SECTION 10 — SERVICE LIFECYCLE

Available
↓
Activated
↓
Capture Window Open
↓
Collecting
↓
Review
↓
Published
↓
Archived

---

# SECTION 11 — CONTENT MODERATION

Moderation options:

- Auto Approved
- Manual Approval
- Hybrid Approval

Organisers remain final authority.

---

# SECTION 12 — SNAPSHOT INTEGRATION

Contribution Type:

Content Contribution

Potential Contributions:

- Featured Photos
- Event Highlights
- Participation Moments
- Capture Statistics

---

# SECTION 13 — PUBLICATION INTEGRATION

Primary Publication Source

Provides:

- Event Story Content
- Event Galleries
- Participant Perspectives
- Voice Contributions
- Highlight Media

This engine is a major supplier to the Publication System.

---

# SECTION 14 — COMMUNITY INTEGRATION

Content may also support:

- Community Discussions
- Community Memories
- Event Reflection Threads

Subject to organiser permissions.

---

# SECTION 15 — RECOGNITION INTEGRATION

Potential Recognition Signals:

- Top Contributors
- Event Story Contributors
- Community Participation
- Family Participation

Recognition ownership remains external.

---

# SECTION 16 — ENGAGEMENT INTEGRATION

Future Uses:

- Anniversary Reflections
- This Day In Legacy History
- Memory Resurfacing
- Event Re-engagement

---

# SECTION 17 — EVENT COMMAND CENTRE INTEGRATION

Metrics Supplied:

- Upload Count
- Contributor Count
- Active Contributors
- Media Pending Review
- Highlight Candidates

---

# SECTION 18 — DATA OWNERSHIP

Suggested Tables:

- event_capture_windows
- event_media_uploads
- event_media_segments
- event_media_reviews
- event_media_highlights

Domain:

Event Services

Owner:

Capsule

---

# SECTION 19 — API CONTRACT

- /api/dday/windows
- /api/dday/uploads
- /api/dday/review
- /api/dday/highlights
- /api/dday/statistics

---

# SECTION 20 — COMPONENT MAP IMPACT

New Components:

- DDayCollectionManager
- CaptureWindowManager
- EventUploadPortal
- QRUploadGateway
- MediaReviewPanel
- MediaHighlightManager
- EventSegmentManager
- ContributorInsightsPanel

New APIs:

- dday-windows
- dday-uploads
- dday-review
- dday-highlights

New Tables:

- event_capture_windows
- event_media_uploads
- event_media_segments
- event_media_reviews
- event_media_highlights

---

# SECTION 21 — FOUNDER PRINCIPLES

Every meaningful event contains moments not captured by official media.

The participant perspective matters.

Memories should be collected while they are fresh.

Collection should be simple enough that participation feels natural.

The D-Day Collection Engine exists to transform fleeting moments into lasting legacy assets.


PART VII
# LC02F_ATTIRE_MANAGEMENT_ENGINE

FILE PATH

LC02F_ATTIRE_MANAGEMENT_ENGINE.md

DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

STATUS

Authoritative Draft

VERSION

v2.0

CREATED

24 June 2026

LAST UPDATED

24 June 2026

DOCUMENT PURPOSE

Define the Attire Management Suite responsible for attire campaigns, reservations, inventory visibility, participant fulfilment, payment coordination, gift allocation, collection management, dispatch management, communication workflows and analytics.

---

LC02F v2.0 architecture freeze approved.

Core domains:

- Campaign Management
- Attire Options
- Bundle Management
- Interest Registration
- Reservation Management
- Inventory Management
- Inventory Allocation
- Restocking
- Payment Policies
- Payment Handlers
- Financial Responsibility
- Vendor Management
- Production Tracking
- Collection Management
- Fulfilment Management
- Dispatch Management
- Gift & Package Fulfilment
- Communication Framework
- Participation Analytics

Founder principles:

- Central Visibility, Distributed Responsibility
- Inventory belongs to options, not campaigns
- Reservation does not imply allocation
- Multiple payment handlers may exist
- The suite is not restricted to fabrics
- Attire and related fulfilment items may be managed together

This file serves as the authoritative LC02F freeze placeholder and reference artifact pending any future formatting expansion.


PART VIII

# LC02G_TABLE_MANAGEMENT_ENGINE

## FILE PATH

```text
LC02G_TABLE_MANAGEMENT_ENGINE
```

## DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

## STATUS

Authoritative Draft

## VERSION

v1.0

## CREATED

25 June 2026

## LAST UPDATED

25 June 2026

## DEPENDS ON

* LC02_EVENT_SERVICES_ENGINE
* LC02A_EVENT_SERVICE_INTEGRATION_STANDARD
* LC02B_RSVP_ENGINE
* LC02C_GUEST_MANAGEMENT_ENGINE
* LC02D_Access Control Engine
* LC08_DATA_ARCHITECTURE.md

## SUPERSEDES

None

## SUPERSEDED BY

None

## DOCUMENT PURPOSE

Define the architecture, governance, operational workflows and integration standards for the LegacyCapsule Table Management Engine.

The engine provides a flexible framework for guest placement, venue planning, protocol support, occupancy monitoring and live event seating operations while allowing organisers complete control over placement decisions.

---

# DOCUMENT HISTORY

| Version | Date         | Author | Summary                                                                                   |
| ------- | ------------ | ------ | ----------------------------------------------------------------------------------------- |
| v1.0    | 25 June 2026 | CG03   | Initial authoritative architecture generated following architecture discovery and freeze. |

---

# SECTION 1 — PURPOSE

The Table Management Engine enables organisers to plan, organise, monitor and manage guest placement throughout the complete event lifecycle.

The engine supports intimate family gatherings through to large multi-venue events without assuming any particular seating methodology.

LegacyCapsule does not determine seating decisions.

LegacyCapsule provides organisers with planning tools, operational visibility, occupancy intelligence and communication capabilities.

---

# SECTION 2 — DESIGN OBJECTIVES

The engine shall:

* Support every major seating methodology.
* Adapt to cultural, religious and regional event styles.
* Scale from small ceremonies to very large events.
* Integrate seamlessly with Guest Management.
* Integrate seamlessly with RSVP.
* Integrate seamlessly with Access Codes.
* Integrate seamlessly with Event Command Centre.
* Provide live operational visibility.
* Reduce organiser workload.
* Preserve organiser decision-making authority.

---

# SECTION 3 — FOUNDER PRINCIPLES

## Maximum Flexibility

LegacyCapsule shall support multiple placement methodologies without imposing one.

---

## Organiser Authority

Placement decisions always belong to organisers.

LegacyCapsule shall never automatically determine:

* where guests should sit
* political placements
* protocol hierarchy
* cultural arrangements
* family positioning

---

## Central Visibility

The organiser should always possess complete visibility of venue occupancy and guest placement.

---

## Distributed Responsibility

Different coordinators may manage different seating areas while the event owner maintains complete oversight.

---

## Operational Intelligence

The engine shall provide operational insight without making operational decisions.

Warnings, alerts and statistics may be generated.

Recommendations affecting guest relationships shall not.

---

# SECTION 4 — PLACEMENT PHILOSOPHY

Table Management exists to support guest placement rather than simply table assignment.

The engine recognises that real-world events involve:

* Protocol
* Relationships
* Family structures
* Organisations
* Sponsors
* Committees
* Accessibility
* Cultural traditions
* Operational flexibility

The engine therefore models placement as an operational framework rather than a seating chart.

---

# SECTION 5 — PLACEMENT MODES

The engine supports multiple placement models.

## Open Seating

Guests choose their own seats.

Suitable for:

* Community events
* Church programmes
* Informal gatherings
* Open receptions

---

## Table Assignment

Guests are assigned to tables but not individual seats.

Suitable for:

* Weddings
* Alumni reunions
* Banquets
* Award dinners

---

## Fixed Seating

Guests are assigned both a table and a specific seat.

Suitable for:

* Premium events
* Diplomatic dinners
* Formal ceremonies
* High-security events

---

## Hybrid Placement

Different placement models may coexist within the same event.

Examples:

* High Table uses fixed seating.
* VIP tables use table assignment.
* General guests use open seating.

This hybrid model is expected to be common.

---

# SECTION 6 — VENUE FRAMEWORK

The engine supports one or more venues.

Each venue may contain:

* Buildings
* Halls
* Floors
* Rooms
* Outdoor Areas
* Overflow Areas
* Reception Areas
* Waiting Areas

Tables belong to venue zones rather than existing independently.

---

# SECTION 7 — VENUE ZONES

Venue Zones improve operational visibility.

Examples include:

* Main Hall
* VIP Lounge
* Reception Hall
* Outdoor Pavilion
* Garden
* Gallery
* Overflow Hall
* Conference Room A
* Conference Room B

Zones support:

* occupancy monitoring
* communications
* analytics
* event-day operations

---

# SECTION 8 — TABLE FRAMEWORK

A table represents an operational entity rather than merely a piece of furniture.

Each table supports:

* Name
* Identifier
* Category
* Venue
* Zone
* Capacity
* Reserved Capacity
* Occupied Capacity
* Available Capacity
* Status
* Notes

Tables remain active throughout the event lifecycle.

---

# SECTION 9 — TABLE CATEGORIES

Default categories include:

* High Table
* VVVIP Table
* VVIP Table
* VIP Table
* Guest of Honour Table
* Sponsor Table
* Family Table
* Committee Table
* Media Table
* Vendor Table
* Press Table
* General Guest Table

Organisers may define unlimited custom categories.

---

# SECTION 10 — TABLE OWNERSHIP FRAMEWORK

Tables may optionally define:

## Table Owner

Responsible for ownership of the table allocation.

Examples:

* Family
* Organisation
* Committee
* Sponsor
* Individual

---

## Table Host

Responsible for operational coordination.

Typical responsibilities include:

* welcoming guests
* confirming occupancy
* assisting arrivals
* coordinating table activities

---

## Table Sponsor

Supports sponsored tables.

Examples:

* ABC Bank
* AJPSA Class of 1984
* Johnson Family

One sponsor may support multiple tables.

---

# SECTION 11 — GUEST PLACEMENT FRAMEWORK

The Table Management Engine shall support flexible placement of guests across all seating models while preserving organiser authority over final placement decisions.

The engine supports placement of:

* Individual Guests
* Families
* Organisations
* Committees
* Sponsors
* VIP Guests
* VVIP Guests
* VVVIP Guests
* Media Representatives
* Vendors
* Performers
* Volunteers

Guest placement shall integrate directly with the Guest Management Engine.

The Table Management Engine shall consume guest records but shall not own them.

Guest Management remains the system of record.

---

# SECTION 12 — GROUP PLACEMENT FRAMEWORK

The engine shall support placement of predefined groups.

Examples include:

* Bride's Family
* Groom's Family
* Alumni Class Sets
* Church Executives
* Sponsors
* Board Members
* Committee Members
* Friends of the Family
* Corporate Delegations

Groups may occupy:

* one table
* multiple tables
* multiple venue zones

The engine records group placement but does not recommend placement strategies.

---

# SECTION 13 — GUEST ACCOMMODATION FRAMEWORK

LegacyCapsule shall support guests requiring special placement consideration.

This framework exists to assist organisers in identifying guest needs during planning and event operations.

Accommodation types may include:

## Accessibility

* Wheelchair Access
* Walking Aid Access
* Limited Mobility
* Visual Impairment
* Hearing Impairment

---

## Medical Considerations

* Medical Equipment Access
* Emergency Exit Preference
* Medication Requirements
* Health Support Access

---

## Family Considerations

* Nursing Mothers
* Parents with Infants
* Young Children
* Elderly Relatives
* Family Caregivers

---

## Religious & Cultural Considerations

* Religious Leaders
* Traditional Rulers
* Ceremonial Participants
* Reserved Cultural Positions

---

## Event-Specific Requirements

* Photographer Visibility
* Media Positioning
* Sign Language Interpreter Access
* Performer Holding Areas
* Award Recipient Holding Areas

Guest records may include placement constraints for organiser reference.

---

# SECTION 14 — PLACEMENT CONSTRAINT FRAMEWORK

Guests may optionally define placement constraints.

Examples include:

* Must Sit Together
* Must Not Sit Together
* Companion Seating Required
* Accessible Seating Required
* Near Stage
* Near Exit
* Quiet Area
* Host Table Required
* Family Seating Required

The engine records and displays constraints.

It does not automatically enforce or resolve them.

---

# SECTION 15 — CAPACITY MANAGEMENT FRAMEWORK

Each table shall maintain live capacity statistics.

Track:

* Maximum Capacity
* Reserved Capacity
* Assigned Guests
* Checked-In Guests
* Available Seats
* Overflow Count

The engine shall generate operational alerts when:

* Capacity is exceeded.
* Reserved seats are consumed.
* Tables remain significantly under-utilised.
* Occupancy thresholds are reached.

Alerts remain informational.

---

# SECTION 16 — OCCUPANCY MAP ENGINE

The Occupancy Map Engine provides organisers with a live operational view of venue utilisation.

Visibility includes:

* Venue Occupancy
* Zone Occupancy
* Table Occupancy
* Reserved Capacity
* Available Capacity
* Guest Distribution
* Check-In Spread

The engine supports both list-based and visual floor-plan presentations where venue layouts are available.

Occupancy data shall refresh in real time as guest check-ins and seating updates occur.

---

# SECTION 17 — LIVE EVENT OPERATIONS

The engine shall support operational seating changes during live events.

Examples include:

* Guest Arrival
* Guest No-Show
* Late Arrival
* Additional Guest
* Table Reassignment
* Temporary Seating
* Overflow Activation

All changes shall be logged for operational audit purposes.

---

# SECTION 18 — COMMUNICATION FRAMEWORK

The organiser may communicate directly with seating groups.

Supported communication targets include:

* Individual Table
* Multiple Tables
* Entire Zone
* Table Category
* Table Owner
* Table Host
* Table Sponsor

Typical communication examples:

* Dinner Service Announcement
* Photography Call
* Committee Briefing
* Sponsor Notification
* Stage Invitation
* Departure Instructions

The Event Owner shall receive copies of organiser communications by default, unless this preference is disabled.

---

# SECTION 19 — PROTOCOL INTEGRATION

The engine integrates with Guest Management classifications.

Supported classifications include:

* General Guest
* VIP
* VVIP
* VVVIP
* Guest of Honour
* Sponsors
* Distinguished Guests

The engine supports protocol seating while leaving all placement decisions to organisers.

Protocol classifications shall integrate with:

* RSVP
* Access Codes
* Event Command Centre
* Future VVIP Management Suite

---

# SECTION 20 — OCCUPANCY ANALYTICS

The engine shall provide operational analytics including:

## Venue Metrics

* Overall Occupancy
* Guest Arrival Rate
* Zone Utilisation
* Seating Distribution

---

## Table Metrics

* Capacity Utilisation
* Reserved Capacity Usage
* Occupancy Percentage
* Guest Count
* Empty Seat Count

---

## Operational Metrics

* Arrival Trends
* Table Fill Progress
* Zone Activity
* Seating Exceptions
* Overflow Usage

These analytics support event operations and post-event reporting.

---

# SECTION 21 — PUBLICATION CONTRIBUTION FRAMEWORK

The Table Management Engine may contribute structured information to Legacy Publication outputs where authorised by the Event Owner.

Potential publication elements include:

* Venue Layout Overview
* Table Naming Convention
* Table Categories
* Guest Distribution Statistics
* Attendance Summary
* Occupancy Statistics
* Sponsor Table Recognition
* Committee Recognition
* Event Layout Story
* Seating Highlights

Publication participation remains optional and subject to publication privacy settings.

The engine shall not expose confidential seating information without explicit authorisation.

---

# SECTION 22 — DATA OWNERSHIP FRAMEWORK

The Table Management Engine owns operational placement data only.

It consumes guest identity data from Guest Management and attendance data from Access Control.

### Primary Data Entities

#### Venue

Stores venue records and structural information.

#### Venue Zone

Stores halls, rooms, floors and operational areas.

#### Event Table

Stores individual table records.

#### Table Category

Stores default and custom table classifications.

#### Table Assignment

Stores guest placement records.

#### Table Ownership

Stores owner, host and sponsor relationships.

#### Occupancy Record

Stores live occupancy information.

#### Placement Constraint

Stores planner-defined guest placement requirements.

#### Communication Log

Stores seating-related communications.

The engine shall never duplicate guest identity information already managed by the Guest Management Engine.

---

# SECTION 23 — SECURITY & PERMISSION FRAMEWORK

The engine shall support role-based permissions.

### Event Owner

May:

* View all tables
* Modify all placements
* Override assignments
* View analytics
* Communicate with all seating groups
* Export reports

---

### Event Organiser

May:

* Manage assigned seating areas
* Communicate with allocated groups
* Monitor occupancy
* Generate reports

Subject to owner permissions.

---

### Table Host

May:

* View assigned table
* Confirm arrivals
* Report seating issues
* Communicate with assigned guests (if permitted)

---

### Table Owner

May:

* View owned tables
* View occupancy
* Review assignments

Permissions remain configurable.

---

### Read-Only Roles

May include:

* Committee Observers
* Sponsors
* Family Representatives

Read-only access shall respect organiser privacy settings.

---

# SECTION 24 — INTEGRATION FRAMEWORK

The Table Management Engine integrates with:

### LC02B RSVP Engine

Consumes:

* Attendance Intent
* RSVP Status
* Guest Responses

---

### LC02C Guest Management Engine

Consumes:

* Guest Records
* Guest Classifications
* Family Relationships
* Guest Groups

---

### LC02D Access Control & Check-in Engine

Consumes:

* Check-In Events
* Arrival Status
* Attendance Verification

---

### LC02E D-Day Collection Engine

Supports:

* Photographer Table Assignments
* Zone Coverage
* Media Coordination

---

### LC02F Attire Management Engine

Supports:

* Family Placement
* Attire Campaign Coordination
* Group Recognition

---

### LC02H Event Command Centre

Provides:

* Live Occupancy
* Placement Status
* Capacity Alerts
* Operational Events
* Venue Intelligence

The Event Command Centre consumes operational data but does not own it.

---

# SECTION 25 — COMPONENT MAP IMPACT

The following components shall be added to `COMPONENT_MAP.md` with full architectural entries.

---

## VenueManager

**Purpose**

Maintains venue definitions and structural hierarchy.

**Inputs**

Venue records, venue configuration.

**Outputs**

Venue hierarchy for placement planning.

**Dependencies**

Event Management.

---

## VenueZoneManager

**Purpose**

Manages operational venue zones.

**Inputs**

Venue definitions.

**Outputs**

Zone allocation.

**Dependencies**

VenueManager.

---

## PlacementManager

**Purpose**

Coordinates guest placement operations.

**Inputs**

Guest records, table records.

**Outputs**

Placement assignments.

**Dependencies**

Guest Management.

---

## TableManager

**Purpose**

Maintains event tables and operational status.

**Inputs**

Venue Zones.

**Outputs**

Table inventory.

---

## CapacityManager

**Purpose**

Tracks seating capacity utilisation.

**Inputs**

Assignments and check-ins.

**Outputs**

Capacity statistics and alerts.

---

## OccupancyMapEngine

**Purpose**

Produces live occupancy views.

**Inputs**

Check-ins, assignments.

**Outputs**

Venue occupancy intelligence.

---

## OccupancyAnalyticsEngine

**Purpose**

Generates operational analytics.

**Outputs**

Occupancy reports and utilisation metrics.

---

## GuestAccommodationManager

**Purpose**

Maintains guest accommodation requirements.

**Outputs**

Placement visibility.

---

## PlacementCommunicationManager

**Purpose**

Coordinates communications targeted by table, zone or category.

**Outputs**

Operational messaging.

---

## ReassignmentManager

**Purpose**

Records and manages live seating adjustments.

**Outputs**

Updated placements and audit records.

---

## VenueOperationsDashboard

**Purpose**

Provides operational visibility for organisers.

**Outputs**

Real-time seating intelligence.

---

# SECTION 26 — IMPLEMENTATION GUIDANCE

Implementation shall prioritise:

### Phase 1

* Venue Management
* Table Management
* Placement Modes
* Capacity Tracking
* Basic Occupancy

---

### Phase 2

* Live Operations
* Communications
* Analytics
* Occupancy Maps
* Table Hosts
* Table Sponsors

---

### Phase 3+

Reserved enhancements:

* Interactive Venue Floor Plans
* AI-assisted Layout Validation (validation only, not recommendations)
* Smart Occupancy Heat Maps
* Multi-Venue Command Views
* Advanced Venue Simulation
* VVIP Management Suite Integration

---

# SECTION 27 — FOUNDER OUTCOME

The Table Management Engine transforms seating from a static planning activity into a live operational management capability.

LegacyCapsule shall enable organisers to understand venue activity in real time without replacing organiser judgement.

The engine shall always prioritise:

* Operational visibility
* Planning flexibility
* Cultural adaptability
* Protocol awareness
* Accessibility
* Simplicity of use

while maintaining the Founder Principle of:

> **Maximum Flexibility, Minimum Complexity.**

---


PART IX

# LC02H_EVENT_COMMAND_CENTRE_ENGINE

## FILE PATH

```text
LC02H_EVENT_COMMAND_CENTRE_ENGINE.md
```

## DOCUMENT OWNER

CG03 – LegacyCapsule Build Auditor

## STATUS

Authoritative Draft

## VERSION

v1.0

## CREATED

25 June 2026

## LAST UPDATED

25 June 2026

## DEPENDS ON

* LC00_ARCHITECTURE_INDEX.md
* LC01_SYSTEM_MAP.md
* LC02_EVENT_SERVICES_ENGINE.md
* LC02A_EVENT_SERVICE_INTEGRATION_STANDARD
* LC02B_RSVP_ENGINE
* LC02C_GUEST_MANAGEMENT_ENGINE
* LC02D_Access Control Engine
* LC02E_DDAY_COLLECTION_ENGINE
* LC02F_ATTIRE_MANAGEMENT_SUITE
* LC02G_TABLE_MANAGEMENT_ENGINE
* LC08_DATA_ARCHITECTURE.md

## SUPERSEDES

None

## SUPERSEDED BY

None

---

# DOCUMENT PURPOSE

The Event Command Centre Engine provides the operational intelligence layer for LegacyCapsule Event Services.

Unlike other Event Service engines, the Event Command Centre owns **no operational business data**.

Its responsibility is to consume operational intelligence published by Event Service engines, present unified operational awareness, coordinate live event operations and assist authorised personnel in making informed decisions throughout the event lifecycle.

---

# DOCUMENT HISTORY

| Version | Date         | Author | Summary                                                        |
| ------- | ------------ | ------ | -------------------------------------------------------------- |
| v1.0    | 25 June 2026 | CG03   | Initial authoritative architecture following discovery freeze. |

---

# SECTION 1 — PURPOSE

The Event Command Centre exists to provide a unified operational view of an event before, during and after execution.

It enables Event Owners and operational teams to understand the current operational state of an event without replacing the responsibilities of individual Event Service engines.

---

# SECTION 2 — FOUNDER PRINCIPLES

## Operational Awareness

The Command Centre exists to maintain continuous awareness of event operations.

---

## Single Source of Truth

The Command Centre owns no operational records.

Each Event Service remains the authoritative owner of its own data.

---

## Progressive Operational Disclosure (POD)

Information shall be revealed according to:

* Event Phase
* User Role
* Operational Context
* Responsibility

Complexity shall remain hidden until required.

---

## Human Decision Preservation

The Command Centre informs and coordinates.

It does not make operational decisions on behalf of organisers.

---

## Operational Realism

LegacyCapsule models how successful events are actually managed.

Technology supports operational teams.

Technology does not replace human coordination.

---

# SECTION 3 — ROLE WITHIN EVENT SERVICES

The Event Command Centre is the orchestration layer for the Event Services ecosystem.

It consumes operational intelligence from:

* RSVP Engine
* Guest Management Engine
* Access Control & Check-in Engine
* D-Day Collection Engine
* Attire Management Suite
* Table Management Engine
* Future Event Service engines

It presents a unified operational interface without duplicating ownership.

---

# SECTION 4 — EVENT LIFECYCLE SUPPORT

The Command Centre supports the complete event lifecycle.

## Planning Mode

Focus:

* Event Readiness
* Outstanding Preparation
* Planning Progress

---

## Live Operations Mode

Focus:

* Operational Health
* Guest Arrivals
* Occupancy
* Alerts
* Programme Progress
* Event Timeline

---

## Wrap-Up Mode

Focus:

* Event Summary
* Outstanding Actions
* Publication Readiness
* Operational Review

---

# SECTION 5 — ONE SCREEN PRINCIPLE

The Command Centre shall enable authorised users to understand the operational state of an event from a single screen.

Navigation to individual Event Service engines should only be required for operational detail or corrective action.

---

# SECTION 6 — EVENT PULSE

The Command Centre shall calculate an overall Event Pulse representing operational health.

Possible states include:

* Healthy
* Attention Required
* Critical

The Event Pulse is derived from operational intelligence published by participating Event Service engines.

---

# SECTION 7 — EVENT READINESS ENGINE

Prior to the event, the Command Centre shall present an Event Readiness assessment.

Readiness considers factors including:

* RSVP progress
* Guest preparation
* Access readiness
* Venue readiness
* Table readiness
* Attire readiness
* Media readiness
* Operational assignments

The Event Readiness score provides guidance only.

Final readiness remains the responsibility of the Event Owner.

---

# SECTION 8 — EVENT READINESS CHECKLIST

The Command Centre shall maintain a configurable operational checklist.

Typical checklist items include:

* Event Details Complete
* Venue Confirmed
* Guest List Ready
* RSVP Active
* Access Codes Generated
* Tables Configured
* Media Team Assigned
* Operational Roles Assigned

Checklist templates may vary by event type.

---

# SECTION 9 — EXECUTIVE SUMMARY

The Executive Summary provides a concise operational overview.

Typical information includes:

* Event Pulse
* Guest Progress
* Programme Status
* Outstanding Actions
* Operational Alerts
* Event Readiness (pre-event)
* Publication Progress (post-event)

This summary is intended primarily for Event Owners and Lead Organisers.

---

# SECTION 10 — DASHBOARD COMPOSITION

The Command Centre shall dynamically compose its dashboard from information published by participating Event Service engines.

Dashboard content shall adapt according to:

* Event Phase
* User Role
* Operational Context
* Service Availability
* Operational Priority

The Command Centre shall not contain hardcoded service-specific logic.
---

# SECTION 11 — OPERATIONAL HEALTH FRAMEWORK

The Command Centre shall continuously assess the operational health of each participating Event Service.

Health reflects operational status rather than technical system status.

Possible health states include:

* Healthy
* Attention Required
* Critical
* Inactive
* Not Enabled

Each Event Service is responsible for publishing its own health status through the Command Centre Contract.

The Command Centre aggregates these statuses into the overall Event Pulse.

---

# SECTION 12 — ATTENTION CENTRE

The Attention Centre is the primary operational workspace during live events.

Its purpose is to surface only items requiring human attention.

Typical entries include:

* Outstanding approvals
* Critical operational alerts
* Unresolved assignments
* Capacity exceptions
* Access incidents
* Programme delays
* Vendor exceptions
* Outstanding follow-up actions

Items are removed automatically once resolved.

The Attention Centre shall not function as a notification inbox.

---

# SECTION 13 — CROSS-SERVICE TIMELINE

The Command Centre shall maintain a unified operational timeline.

Unlike individual service logs, this timeline combines significant events across all participating Event Services.

Examples:

* Registration Opened
* First Guest Checked In
* VVVIP Arrival
* Ceremony Commenced
* Programme Delayed
* Table Overflow Activated
* Media Upload Started
* Cake Cutting Completed
* Publication Processing Started

The timeline becomes the authoritative operational history of the event.

---

# SECTION 14 — EVENT PROGRAMME INTEGRATION

The Command Centre shall understand the operational state of the event programme.

Programme information includes:

* Activities
* Planned Start
* Planned Finish
* Actual Start
* Actual Finish
* Current Status

Programme states include:

* Scheduled
* Upcoming
* In Progress
* Delayed
* Completed
* Cancelled
* Skipped

Programme information shall influence dashboard composition but shall not control operational engines.

---

# SECTION 15 — PROGRAMME-AWARE OPERATIONS

Dashboard emphasis shall change according to the active programme phase.

Examples:

### Registration Phase

Surface:

* Guest Arrivals
* Access Control
* Registration Activity

---

### Ceremony Phase

Surface:

* Programme Progress
* Media Coverage
* VVVIP Presence
* Operational Health

---

### Reception Phase

Surface:

* Table Occupancy
* Catering Readiness
* Photography Progress
* Attire Collection (where applicable)

This behaviour implements Progressive Operational Disclosure.

---

# SECTION 16 — MULTI-USER COLLABORATION FRAMEWORK

The Command Centre supports simultaneous operation by multiple authorised personnel.

Typical operational roles include:

* Event Owner
* Lead Organiser
* Guest Manager
* Registration Lead
* Protocol Lead
* Media Lead
* Attire Lead
* Finance Lead
* Venue Coordinator
* Stage Manager
* Security Coordinator

Each role views an operational workspace relevant to its responsibilities.

Role permissions are defined by the Security Framework.

---

# SECTION 17 — OPERATIONAL PRESENCE

The Command Centre shall display active operational participants.

Presence information may include:

* Currently Active
* Recently Active
* Offline

Presence exists solely to improve operational coordination.

It shall not function as a social presence system.

---

# SECTION 18 — OPERATIONAL ASSIGNMENT FRAMEWORK

Operational assignments coordinate live event responsibilities.

Assignments may originate from:

* Event Owner
* Lead Organiser
* Operational Services
* Programme Context
* Manual Creation

Typical assignments include:

* Receive Guest of Honour
* Cover Award Presentation
* Open Registration Desk
* Confirm Catering Readiness
* Monitor Parking Entrance
* Prepare Stage

Assignments remain lightweight and operational in nature.

The Command Centre is not intended to replace project management software.

---

# SECTION 19 — OPERATIONAL HANDOVER

The Command Centre supports structured handover between operational personnel.

Typical use cases include:

* Shift Changes
* Temporary Delegation
* Area Transfer
* Team Rotation

Handover records include:

* Previous Owner
* New Owner
* Time
* Operational Notes

This preserves operational continuity throughout the event.

---

# SECTION 20 — OPERATIONAL JOURNAL & DECISION LOG

The Command Centre automatically maintains an Operational Journal.

Entries include:

* Significant operational events
* Critical incidents
* Major operational decisions
* Programme deviations
* Venue changes
* Emergency responses

Authorised users may also record manual Decision Log entries.

Decision records should capture:

* Decision
* Reason
* Authorising Role
* Timestamp
* Operational Impact

The Operational Journal forms part of the permanent event record and may contribute to post-event reporting where appropriate.

---

# SECTION 21 — NOTIFICATION & ESCALATION FRAMEWORK

The Event Command Centre shall coordinate operational awareness through structured alerts and escalation rather than functioning as a messaging platform.

Its responsibility is to ensure that the appropriate operational role becomes aware of operational conditions requiring attention.

The Command Centre shall not assume that operational personnel, vendors or guests are continuously monitoring the application during live events.

Critical operational communication may occur outside LegacyCapsule using methods appropriate to the event.

---

## Alert Sources

Operational alerts may originate from:

* RSVP Engine
* Guest Management Engine
* Access Control & Check-in Engine
* D-Day Collection Engine
* Attire Management Suite
* Table Management Engine
* Future Event Service Engines

Each engine owns the generation of its operational alerts.

---

## Alert Classification

Alerts shall be classified as:

### Critical

Immediate operational impact.

Examples:

* Registration halted
* Venue emergency
* Access failure
* Critical programme disruption

---

### Warning

Requires timely operational attention.

Examples:

* Programme delay
* Seating issue
* Outstanding operational assignment

---

### Advisory

Operational awareness.

Examples:

* Sponsor arrival
* Media milestone
* Vendor check-in

---

### Informational

Historical events contributing to reporting and operational journals.

---

## Escalation

Escalation follows operational responsibility.

Typical flow:

```text
Operational Owner

↓

Service Lead

↓

Lead Organiser

↓

Event Owner
```

Escalation rules remain configurable.

---

## Operational Status

Actionable alerts support:

* New
* Acknowledged
* In Progress
* Resolved
* Closed

The objective is operational accountability rather than message delivery confirmation.

---

# SECTION 22 — COMMAND CENTRE CONTRACT

Every Event Service integrating with the Command Centre shall publish a standard operational contract.

The Command Centre consumes these contracts to compose its operational dashboard.

Mandatory contract elements include:

## Dashboard Summary

High-level operational overview.

---

## Operational Health

Current operational status.

---

## Operational Statistics

Dashboard-ready metrics.

---

## Operational Alerts

Current operational issues.

---

## Attention Items

Outstanding operational actions.

---

## Timeline Events

Significant operational milestones.

---

## Quick Actions

Role-appropriate operational shortcuts.

---

## Operational Assignments

Current responsibilities.

---

## Permissions

Visibility and operational authority.

---

## Integration Status

Indicates whether the service is:

* Active
* Partially Available
* Disabled
* Offline

The Command Centre shall not directly interrogate internal engine logic outside this published contract.

---

# SECTION 23 — SECURITY FRAMEWORK

The Command Centre enforces role-based operational access.

Typical operational roles include:

* Event Owner
* Lead Organiser
* Operational Leads
* Coordinators
* Read-Only Observers

Operational users shall only view information appropriate to their assigned responsibilities.

Sensitive operational information shall remain restricted.

---

# SECTION 24 — DATA OWNERSHIP

The Event Command Centre owns no business-domain operational records.

Its responsibilities are limited to:

* Dashboard Composition
* Event Pulse
* Operational Journal
* Decision Log
* Dashboard Preferences
* Operational Workspace Configuration

Business data ownership remains within the originating Event Service engines.

This preserves the Founder Principle of a Single Source of Truth.

---

# SECTION 25 — INTEGRATION FRAMEWORK

The Event Command Centre integrates with all Event Service engines.

It consumes operational intelligence from:

* RSVP Engine
* Guest Management Engine
* Access Control & Check-in Engine
* D-Day Collection Engine
* Attire Management Suite
* Table Management Engine
* Future Ticketing Engine
* Future VVIP Management Suite
* Future Event Services

Integration shall occur exclusively through published operational contracts.

---

# SECTION 26 — COMPONENT MAP IMPACT

The following components shall be added to `COMPONENT_MAP.md` with full architectural entries.

---

## EventCommandCentreEngine

**Purpose**

Provides unified operational awareness across all Event Services.

**Inputs**

Published Command Centre Contracts.

**Outputs**

Operational dashboards and event intelligence.

**Dependencies**

All Event Service engines.

---

## EventPulseEngine

**Purpose**

Calculates overall operational health.

---

## ReadinessEngine

**Purpose**

Determines event readiness before commencement.

---

## DashboardCompositionEngine

**Purpose**

Builds context-aware dashboards using Progressive Operational Disclosure.

---

## OperationalHealthEngine

**Purpose**

Aggregates operational health across Event Services.

---

## AttentionCentreManager

**Purpose**

Coordinates outstanding operational actions.

---

## OperationalTimelineEngine

**Purpose**

Maintains unified cross-service operational timeline.

---

## ProgrammeIntegrationManager

**Purpose**

Maintains programme-aware operational context.

---

## OperationalAssignmentManager

**Purpose**

Coordinates live operational responsibilities.

---

## HandoverManager

**Purpose**

Maintains operational continuity between personnel.

---

## OperationalJournalManager

**Purpose**

Records operational history and significant decisions.

---

## EscalationEngine

**Purpose**

Manages operational escalation workflows.

---

## CommandCentreContractManager

**Purpose**

Validates and consumes published Event Service contracts.

---

# SECTION 27 — IMPLEMENTATION GUIDANCE

Implementation shall prioritise:

## Phase 1

* Dashboard Composition
* Event Pulse
* Event Readiness
* Operational Health
* Attention Centre
* Timeline

---

## Phase 2

* Programme Integration
* Operational Assignments
* Handover
* Operational Journal
* Decision Log

---

## Phase 3+

Reserved for:

* Predictive Operational Intelligence
* AI-assisted anomaly detection
* Multi-event operational monitoring
* Advanced operational analytics
* Expanded Event Service integrations

---

# SECTION 28 — FOUNDER OUTCOME

The Event Command Centre transforms LegacyCapsule from a collection of Event Service engines into a unified operational platform.

Its purpose is not to replace individual operational engines, but to provide continuous operational awareness before, during and after every event.

The Command Centre shall remain focused on:

* Operational Awareness
* Operational Intelligence
* Progressive Operational Disclosure
* Human Decision Preservation
* Operational Realism
* Single Source of Truth

Through these principles, LegacyCapsule enables organisers to manage events confidently while preserving the flexibility and human judgement required for successful private events.

---

