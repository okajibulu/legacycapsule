SYSTEM_MAP.md
LegacyCapsule — Master Systems Architecture
VALNEX, UNIPESSOAL LDA · RevoWorldTech
Last Updated: June 2026

PURPOSE
This document describes LegacyCapsule as a collection of business systems (“Engines”).
COMPONENT_MAP.md answers:
“What file controls this feature?”
SYSTEM_MAP.md answers:
“What business capability controls this feature?”
All future planning, architecture decisions, database design, feature discussions and AI handovers should reference this document.

PLATFORM VISION
LegacyCapsule is not a tribute platform.
LegacyCapsule is a Digital Event Legacy Platform.
The platform supports:
1.	Before Event
2.	During Event
3.	After Event
4.	Long After Event
The goal is to preserve not only memories, but the complete legacy of significant life events.

ENGINE 1 — CAPSULE ENGINE
Status: Mature
Purpose: Core event and tribute experience.
Modules:
	Tribute Wall
	Profile Page
	Gallery System
	Family Representative Portal
	Dashboard
	Moderation
	Media Contributions
Primary Routes:
	/for/[slug]
	/for/[slug]/profile
	/for/[slug]/submit
	/dashboard
Primary Tables:
	capsules
	contributions
	capsule_profile_sections
	capsule_gallery
	tribute_responses
	tribute_reactions
Dependencies:
	Notification Engine
	Profile Engine
	Gallery Engine

ENGINE 2 — PROFILE ENGINE
Status: Active Development
Purpose: Preserve the story, achievements, milestones and identity of the subject of the event.
Modules:
	Biography
	Achievements
	Timeline
	Quotes
	Featured Photos
	Gallery Sections
	Reactions
	Comments
Dependencies:
	Capsule Engine
	Publication Engine

ENGINE 3 — EXPRESSION OF HONOUR ENGINE
Status: Near Completion
Purpose: Allow organisers to provide trusted channels through which guests may express honour and support.
Modules:
	Beneficiary Accounts
	Trust Layer
	Beneficiary Notifications
	Acknowledgements
	Thank-you Emails
Primary Tables:
	capsule_support_accounts
	support_acknowledgements

ENGINE 4 — PUBLICATION ENGINE
Status: In Development
Purpose: Transform event content into a professionally produced digital publication.
Modules:
	Auto Arrangement
	Publication Editor
	Layout Builder
	PDF Renderer
	Distribution
	Publication Archive
Primary Tables:
	publications
Dependencies:
	Capsule Engine
	Profile Engine
	Gallery Engine

ENGINE 5 — EVENT SERVICES ENGINE
Status: 
Architecture Complete
Implementation Pending
Purpose: Manage event logistics before and during the event.
Modules:
RSVP Engine
	Invitations
	RSVP Tracking
	Reminders
	Attendance Reporting
Guest Management Engine
	Guest Registry
	Family Branches
	VIP & Premium Guest Management
	Guest Status Tracking
Access Code Engine
	Private Events
	Family Access
	VIP Access
	Publication Access Control
Table Management Engine
·	Table Assignment
·	Guest Lookup
·	Capacity Management
·	Occupancy Intelligence
·	Zone Management
·	Flexible Seating Models
Attire Coordination Engine
	Fabric Information
	Collection Tracking
	Colour Themes
	Vendor Details
D-Day Collection Engine
	QR Uploads
	Event Photos
	Event Videos
	Voice Messages
Event Command Centre
·	Operational Dashboard
·	Event Pulse
·	Operational Intelligence
·	Readiness
·	Timeline
·	Attention Centre
·	Programme Integration
	Operational Coordination

ENGINE 6 — NOTIFICATION ENGINE
Status: Active
Purpose: Deliver event and platform communications.
Modules:
	Tribute Notifications
	Approval Emails
	Family Rep Emails
	Beneficiary Notifications
	Reminder Emails
	Operational Notifications
	Platform Notifications
	Scheduled Communications
Dependencies:
	Resend
	Cron Services

ENGINE 7 — PAYMENT ENGINE
Status: Active (consumes RW01 Payment Services Platform)
Purpose: Manage LegacyCapsule commercial lifecycle — product
definitions, pricing configuration and feature activation.
Payment infrastructure is provided by RW01.
Modules:
	Pricing Configuration (lc_pricing)
	Feature Activation (capsule.components)
	Bundle Checkout Orchestration
	Gift a Capsule Flow
	Pre-booked Capsule Flow
Platform Dependency:
	RW01  Payment Services Platform
See Also:
	LC04 Payment Engine

ENGINE 8 — LEGACY CONTINUITY & ENGAGEMENT ENGINE
Status: Planned (product-owned — not promoted to platform)
Purpose: Maintain meaningful engagement long after the event.
Modules:
	Milestones Engine
	Anniversary Engine
	Memory Capsules Engine
	Keepsake Engine
	Contributor Appreciation Engine
	Family Engagement Engine
	Community Engagement Engine
	Legacy Timeline Engine (future)
Platform Dependencies:
	RW03  Publication Platform (keepsake outputs)
	RW04  Recognition Platform (milestone recognition)
See Also:
	LC05 Legacy Continuity & Engagement Engine

ENGINE 9 — LEGACY RECOGNITION ENGINE
Status: Planned (consumes RW04 Recognition Platform)
Purpose: Express recognition within LegacyCapsule in ways
appropriate to its context of remembrance and legacy preservation.
Recognition infrastructure is provided by RW04.
Modules:
	Contributor Recognition Expression
	Organiser Recognition Expression
	Context-Sensitive Recognition (memorial vs celebration)
	Planner Recognition Expression (future)
	Reseller Recognition Expression (future)
Platform Dependency:
	RW04  Recognition Platform
See Also:
	LC06 Legacy Recognition Engine

ENGINE 10 — ADMIN ENGINE
Status: Active
Purpose: Platform administration and operational control.
Modules:
	LCAdmin
	Pricing Management
	Feature Flags
	Moderation
	Components Panel
	Transactions
	Reseller Management
Routes:
	admin.revoworldtech.uk

REVOWORLD PLATFORM ALIGNMENT
LegacyCapsule is Product 01 under RevoWorldTech.

Platform realignment completed July 2026 (CG05).
Payment, Publication and Recognition infrastructure have been
promoted to the RevoWorld Platform and are now shared services.

Products in the ecosystem:
	LegacyCapsule  (Product 01 — active)
	LoungeMaster   (Product 02 — documentation complete)
	RevoRent       (Product 03 — in planning)
	Cadence        (Product 04 — in planning)
	Communiva      (Product 05 — in planning)

Platform services available to all products:
	RW01  Payment Services Platform
	RW03  Publication Platform
	RW04  Recognition Platform

See RW00 Platform Architecture Index for full ecosystem overview.

CURRENT DEVELOPMENT PRIORITY
1.	Expression of Honour Completion
2.	Publication Engine
3.	RSVP Engine
4.	Guest Management Engine
5.	Access Code Engine
6.	D-Day Collection Engine
7.	Attire Coordination Engine
8.	Table Management Engine
9.	Payment Engine
10.	Recognition Engine

FOUNDER PRINCIPLES
1.	Mobile-first before desktop.
2.	Premium presentation over feature quantity.
3.	Self-service over customer support.
4.	Emotional impact is a feature.
5.	Automation before manual administration.
6.	Organisers remain in control.
7.	Every event deserves a lasting legacy.


Operational intelligence is generated
by individual engines and consumed
by the Event Command Centre.

Operational engines own data.

The Command Centre owns awareness.
