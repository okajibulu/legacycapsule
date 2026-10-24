FILE PATH

/docs/LC00_ARCHITECTURE_INDEX.md

DOCUMENT OWNER

CG03 – Architecture Governor

STATUS

Authoritative

VERSION

v2.0

CREATED - june 25 2026

LAST UPDATED - 2 July 2026
DEPENDS ON

LC_CONTEXT.md

PROJECT_RULES.md

START_HERE.md

CURRENT_STATE.md

SUPERSEDES

Previous LC00 Architecture Index

SUPERSEDED BY

None

DOCUMENT PURPOSE

Provide the authoritative index, ownership and governance structure for the LegacyCapsule Architecture Library.
The architecture library defines the long-term structure, direction and operating principles of the LegacyCapsule platform.
All future planning, development, AI collaboration and architectural decisions should reference these documents.

## ARCHITECTURE LIBRARY POSITION

The LegacyCapsule Architecture Library defines the approved architectural vision of the platform.

It is not an implementation guide.

Implementation status is governed separately through:

- LC_CONTEXT.md
- START_HERE.md
- PROJECT_RULES.md
- CURRENT_STATE.md
- COMPONENT_MAP.md

These operational documents explain how work is executed.

The Architecture Library explains what LegacyCapsule is intended to become.

## PROJECT ONBOARDING

Before entering the Architecture Library, every contributor and AI should first review:

1. LC_CONTEXT.md
2. START_HERE.md
3. CURRENT_STATE.md
4. PROJECT_RULES.md

These documents provide operational context.

The Architecture Library should then be read in sequence from LC00 onwards.

READING ORDER
New contributors, AI systems and developers should review the architecture documents in the following order:

1. LC00A — Platform Narrative Standard
2. LC01 — System Map
3. LC01A — Interface & Experience Standard
4. LC02 — Event Services
5. LC03 — Publication
6. LC04 — Payment
7. LC05 — Engagement
8. LC06 — Recognition
9. LC07 — Ecosystem Alignment
10. LC08 — Data Architecture
11. LC09 — AI Operating Framework
12. LC10 — Founder Product Roadmap

---

| Document | Primary Role            |
| -------- | ----------------------- |
| LC00     | Library Governance      |
| LC00A    | Platform Constitution   |
| LC01     | System Architecture     |
| LC01A    | Experience Constitution |
| LC02     | Event Operations        |
| LC03     | Publication             |
| LC04     | Commerce                |
| LC05     | Engagement              |
| LC06     | Recognition             |
| LC07     | Ecosystem               |
| LC08     | Data Architecture       |
| LC09     | AI Governance           |
| LC10     | Product Strategy        |


ARCHITECTURE LIBRARY

LC00A_PLATFORM_NARRATIVE_STANDARD.md

Purpose:

Defines the constitutional philosophy, narrative framework, participation principles and emotional experience governing the entire LegacyCapsule platform.

Use When:

Designing user experiences, writing content, shaping participant journeys, evaluating platform behaviour or resolving questions relating to platform purpose and storytelling.

LC01A_INTERFACE_AND_EXPERIENCE_STANDARD.md

Purpose:

Defines the platform-wide interface, navigation, page taxonomy, onboarding, dashboard, activity workspace and interaction standards governing every LegacyCapsule module.

Use When:

Designing new modules, implementing user interfaces, reviewing user experience consistency or developing reusable interface components.

LC01_SYSTEM_MAP.md

Purpose:

Defines the major business engines, platform structure and architectural relationships that make up LegacyCapsule.

Use When:

Understanding platform architecture, engine ownership and system boundaries.

LC02_EVENT_SERVICES_ENGINE.md

Purpose:

Defines the architecture of the Event Services platform, including RSVP, Guest Management, Access Control, D-Day Collection, Attire Management, Table Management, Event Command Centre and future operational services.

Use When:

Planning, implementing or extending event coordination and operational service modules.

LC03_LEGACY_PUBLICATION_SYSTEM.md

Purpose:

Defines the Legacy Publication System, including editorial philosophy, publication generation, curation, presentation, distribution and long-term preservation.

Use When:

Designing publication experiences, implementing publication features or integrating platform content into publications.

LC04_PAYMENT_ENGINE.md
Purpose:
Defines pricing, checkout, transactions and payment infrastructure.
Use When:
Working on monetisation and commercial activation.

LC05_ENGAGEMENT_ENGINE.md
Purpose:
Defines milestones, anniversaries, memory capsules and post-event engagement.
Use When:
Planning long-term participation features.

LC06_LEGACY_RECOGNITION_ENGINE.md
Purpose:
Defines badges, legacy scores, recognition systems and contributor appreciation.
Use When:
Planning achievement and recognition features.

LC07_ECOSYSTEM_ALIGNMENT.md
Purpose:
Defines how LegacyCapsule fits within the wider RevoWorldTech ecosystem.
Use When:
Planning reusable services and future products.

LC08_DATA_ARCHITECTURE.md
Purpose:
Defines ownership, domains, versioning, audit strategy and future scalability.
Use When:
Designing databases and data structures.

LC09_AI_COLLABORATION_WORKFLOW.md
Purpose:
Defines how AI systems collaborate on the project.
Use When:
Planning implementation workflows and documentation updates.

LC10_FOUNDER_PRODUCT_ROADMAP.md
Purpose:
Defines strategic development priorities and product evolution.
Use When:
Evaluating roadmap decisions and prioritisation.

## ARCHITECTURE GOVERNANCE PRINCIPLES

The Architecture Library is the authoritative definition of the LegacyCapsule platform.

Architecture documents define platform intent.

Operational documents define implementation workflow.

Current implementation is governed by CURRENT_STATE.md.

Architecture should not be modified during implementation unless approved through the amendment process.

Temporary review documents, implementation notes and AI conversations are never considered authoritative architecture.

## Constitutional Dependency Principle

All architecture documents shall be interpreted in the context of the Platform Narrative Standard.

Where implementation choices are technically valid but differ in user experience or behavioural outcomes, preference shall be given to the option that best aligns with the principles defined in LC00A.

The Platform Narrative Standard therefore acts as the constitutional reference for platform philosophy, storytelling, participation and emotional experience.

## ARCHITECTURE AMENDMENT POLICY

Architecture should evolve through controlled amendments.

Existing authoritative documents should be extended wherever practical.

New architecture documents should only be created where ownership, scope or maintainability would otherwise become unclear.

Founder approval is required before introducing significant architectural restructuring.

Minor clarifications and governance improvements may be incorporated through normal document revision.

RELATIONSHIP TO PROJECT DOCUMENTS
The architecture library works alongside the operational project documents.
Operational Documents:
	README.md
	START_HERE.md
	PROJECT_RULES.md
	CURRENT_STATE.md
	COMPONENT_MAP.md
	Latest Handover
Architecture Documents:
	LC00 – LC10
Specifications:
	Publication Guides
	Recognition Specifications
	Rewards Specifications
	Event Service Specifications

SOURCE OF TRUTH
For architectural principles:
LC00_ARCHITECTURE_INDEX.md
For architecture:
LC00–LC10
For current implementation:
Codebase
For current status:
CURRENT_STATE.md
For file ownership and locations:
COMPONENT_MAP.md
For working guidance:
PROJECT_RULES.md

PLATFORM VISION
LegacyCapsule is a Digital Event Legacy Platform.
The platform supports:
Before Event
During Event
After Event
Long After Event
The objective is not simply to host events, but to help people celebrate, capture, organise and preserve meaningful moments and their lasting legacy.

ARCHITECTURE GOVERNANCE PRINCIPLES

All LegacyCapsule architecture documents shall adhere to the following principles.

### Single Source of Truth

Each engine owns its operational domain.

Operational data ownership shall not be duplicated across engines.

### Own • Consume • Publish

Every architecture document shall explicitly define:

- What the engine owns.
- What the engine consumes.
- What the engine publishes.

### Maximum Flexibility • Minimum Complexity

Architectures shall support multiple operational models without imposing a single workflow.

### Progressive Operational Disclosure (POD)

The platform shall reveal operational information progressively based on user context, responsibility and event lifecycle.

Complexity shall remain behind intentional interaction.

### Human Decision Preservation

LegacyCapsule informs and assists.

LegacyCapsule does not replace organiser judgement.

### Operational Intelligence

All operational engines should transform:

Data

↓

Metrics

↓

Operational Intelligence

↓

Better Decisions

### Event Lifecycle Awareness

Every operational engine should consider:

• Before Event

• During Event

• After Event

• Long After Event

### Command Centre Contract

Operational engines should expose standard interfaces to the Event Command Centre including:

- Dashboard Cards
- Health Status
- Alerts
- Timeline Events
- Statistics
- Quick Actions
- Attention Items

### Central Visibility • Distributed Responsibility

Operational responsibility may be delegated.

Operational visibility remains centralised.

FOUNDER PRINCIPLES

Build deliberately.

Document thoroughly.

Scale confidently.

Design for longevity.

Maintain a single source of truth.

Deliver enterprise capability through intuitive experiences.

Transform operational data into lasting intelligence.

Preserve human judgement while enhancing human capability.

Architecture Status

Stable

## ARCHITECTURE FREEZE

The LegacyCapsule Architecture Library is now considered stable for Phase B implementation.

Permitted Changes

- Governance improvements
- Clarifications
- Error corrections
- Founder-approved amendments

Not Permitted

- Structural redesign
- New platform capabilities outside approved roadmap
- Conflicting ownership changes
- Duplicate architectural specifications

Future enhancements should normally be recorded within LC10 unless immediate implementation requires otherwise.

## DOCUMENT HISTORY

### Version 2.0

- Upgraded to standard architecture document header.
- Added Architecture Library Position.
- Added Project Onboarding guidance.
- Added Architecture Governance Principles.
- Added Architecture Amendment Policy.
- Strengthened Architecture Freeze policy.
- Aligned document with the Phase B governance framework.