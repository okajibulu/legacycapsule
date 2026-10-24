LC09-AP01A — FOUNDATION

Contains only:

Rename document
Standard document header
Document Position
Scope
Core Operating Principle
Operating Philosophy
Document History

Nothing else.

LC09-AP01B — OPERATING MODEL

Contains:

Worker Roles
AI Recommendation Panel
Cost Optimisation
Vendor Neutrality
Worker Responsibilities
Role Assignment
LC09-AP01C — DELIVERY LIFECYCLE

Contains:

Discovery
Existing Implementation First
Convergence
Worker Lifecycle
Founder Review
Documentation Updates
Completion Reports
LC09-AP01D — GOVERNANCE

Contains:

Single Source of Truth
AI Disagreement Protocol
Amendment Policy
Success Principles
Governance Checklist
Relationship with PROJECT_RULES
Relationship with CURRENT_STATE

=================================================

LC09-AP01A

FOUNDATION

=================================================

FILE PATH

/docs/LC09_AI_OPERATING_FRAMEWORK.md

DOCUMENT OWNER

CG03 – Architecture Governor

STATUS

Authoritative

VERSION

v2.0

CREATED

31 May 2026

LAST UPDATED

2 JULY 2026

DEPENDS ON

LC00_ARCHITECTURE_INDEX.md

PROJECT_RULES.md

START_HERE.md

CURRENT_STATE.md

SUPERSEDES

LC09_AI_COLLABORATION_WORKFLOW.md

SUPERSEDED BY

None

DOCUMENT PURPOSE

Define the AI operating model, governance framework and implementation workflow used throughout LegacyCapsule. This document governs how AI workers participate in planning, implementation, review and documentation while remaining independent of any individual AI provider.

# DOCUMENT POSITION

This document is part of the LegacyCapsule Architecture Library.

It complements the technical architecture by defining the operational framework through which AI-assisted development is performed.

# SCOPE

This framework applies to:

• Architecture planning

• Feature implementation

• Documentation

• Refactoring

• Code review

• Testing support

• Research activities

• Cross-product reviews

It applies regardless of which AI provider performs the work.

This document governs:

• AI operating model

• Worker roles

• AI task assignment

• Discovery workflow

• Implementation lifecycle

• Review workflow

• Documentation synchronisation

It does not replace PROJECT_RULES.md.

PROJECT_RULES defines the governing rules.

This document defines how those rules are applied during AI-assisted development.

# OPERATING PHILOSOPHY

Artificial intelligence is treated as a project resource rather than a project owner.

Responsibilities are assigned to operational roles instead of specific AI providers.

The AI occupying a role may change over time according to capability, cost, availability and project requirements.

The governing architecture, project rules and documentation remain stable regardless of which AI performs the work.

This approach ensures that LegacyCapsule remains independent of any individual AI provider while preserving consistency throughout development.

# CORE OPERATING PRINCIPLE

LegacyCapsule is governed by documentation rather than AI conversations.

AI systems do not synchronise with one another.

They synchronise through approved project documentation.

No AI session is considered a permanent source of project knowledge.

The project documents remain the single source of truth.

CORE PRINCIPLE
No AI owns the project.
All AI systems contribute to a shared vision.
The project documents are the authority.
Not individual AI conversations.

SOURCE OF TRUTH
Priority Order:
PROJECT_RULES.md

↓

START_HERE.md

↓

CURRENT_STATE.md

↓

COMPONENT_MAP.md

↓

LC00–LC10 Architecture

↓

Codebase

↓

Latest Handover

↓

Conversation
If a conversation conflicts with project documentation:
Project documentation wins.

AI ROLES

CFounder

↓

Architecture Governor

↓

Implementation Worker

↓

Research Worker

↓

Review Worker

↓

Local Development Worker
REQUIRED READING ORDER
Every AI entering the project should review:
START_HERE.md
PROJECT_RULES.md
CURRENT_STATE.md
COMPONENT_MAP.md
LC00_ARCHITECTURE_INDEX.md
Relevant Engine Documents
Latest Handover
Only then should implementation begin.

DOCUMENTATION RULE
Every meaningful change should update:
CURRENT_STATE.md
If architecture changes:
Relevant LC document
If new component introduced:
COMPONENT_MAP.md
If major milestone reached:
Latest Handover

FILE EDITING RULES
When editing code:
Always reference:
File Path
Component Name
Section Name
Reason For Change
Example:
File: app/for/[slug]/page.tsx
Component: ExpressionOfHonourPanel
Section: Beneficiary Notification
Reason: Add acknowledgement flow

COMPONENT DISCIPLINE
Large files should be divided into sections.
Example:
SECTION A — Top Bar
SECTION B — Hero
SECTION C — Actions
SECTION D — Submission Form
SECTION E — Feed
SECTION F — Footer
Purpose:
Improve maintainability.
Improve AI navigation.
Reduce edit errors.

IMPLEMENTATION DISCIPLINE
Before building:
Confirm:
1.	Existing solution?
2.	Reusable component?
3.	Existing table?
4.	Existing API?
Avoid duplicate systems.
Reuse first.
Build second.

=================================================
LC09-AP01B — OPERATING MODEL
=================================================

# AI OPERATING MODEL

LegacyCapsule follows a role-based AI operating model.

Project responsibilities are assigned to operational roles rather than specific AI providers.

The AI occupying a role may change over time according to:

• Capability

• Cost efficiency

• Availability

• Subscription status

• Suitability for the assigned task

The operating model remains stable even when AI providers change.

No AI provider permanently owns any project responsibility.

# WORKER ROLES

## Founder (CG01)

Responsibilities

• Product vision

• Commercial decisions

• Priority management

• Final approval

---

## Architecture Governor (CA01)

Responsibilities

• Protect approved architecture

• Maintain governance

• Review cross-document consistency

• Recommend implementation strategy

• Produce AI Recommendation Panels

• Conduct architecture audits

---

## Implementation Worker

Responsibilities

• Feature implementation

• Refactoring

• UI development

• Backend implementation

• Database changes

• Integration

The occupying AI is selected through the AI Recommendation Panel.

---

## Research Worker

Responsibilities

• Technology evaluation

• Industry research

• Competitive analysis

• Large document synthesis

---

## Review Worker

Responsibilities

• Code review

• Architecture compliance

• Quality assurance

• Testing support

---

# AI RECOMMENDATION PANEL

Before assigning any significant task, the Architecture Governor should recommend up to three suitable AI options in order of preference.

Recommendations should consider:

• Task complexity

• Expected quality

• Cost efficiency

• Available subscriptions

• Turnaround time

Where multiple AI systems are capable of delivering equivalent outcomes, preference should normally be given to the lower-cost option.

Recommendations should follow this structure:

1st Choice

AI

Reason

---

2nd Choice

AI

Reason

---

Escalation (Only if Required)

AI

Reason

## Local Development Worker

Responsibilities

• IDE assistance

• Debugging

• Productivity support

• Local development

ARCHITECTURE FREEZE RULE

During implementation, AI systems shall assume that the approved architecture is stable.

Implementation should faithfully realise the documented architecture rather than redesign it.

If an implementation appears to require an architectural change, the AI shall:

1. Complete the architectural review.
2. Explain why the change is required.
3. Await Founder approval before modifying architecture documentation.

Potential improvements should normally be recorded for future phases rather than incorporated during implementation.

CHANGE CLASSIFICATION

Minor Change
Examples:
Text changes
Styling tweaks
Validation updates
Documentation update optional.

Moderate Change
Examples:
New component
New API
New database field
Update:
CURRENT_STATE.md
COMPONENT_MAP.md

Major Change
Examples:
New engine
New workflow
New table group
New feature family
Update:
CURRENT_STATE.md
COMPONENT_MAP.md
Architecture documents
Handover

HANDOVER RULE
Handovers should contain:
Current Version
Completed Work
Active Work
Known Issues
Pending Decisions
Next Priorities
Avoid:
Long discussions
Historical debates
Duplicate specifications

AI Recommendation Panel

Every task begins with:

1st Recommendation

Reason

2nd Recommendation

Reason

3rd Recommendation

Reason

DISAGREEMENT RULE
When AI systems disagree:
Review:
Project Rules
Architecture Documents
Current State
Actual Code
Choose:

The solution that best aligns with:

• Approved architecture
• Founder principles
• Existing implementation
• Long-term maintainability

AI preference is never a deciding factor.

----

# VENDOR NEUTRALITY

LegacyCapsule is designed to remain independent of any individual AI provider.

The project's permanent assets are:

• Architecture

• Governance

• Documentation

• Standards

• Source code

AI providers are implementation resources.

Worker roles remain constant.

The AI occupying a role may change without affecting project governance.

---

# COST OPTIMISATION

AI resources should be selected according to value rather than familiarity.

The preferred AI is the lowest-cost option capable of delivering the required quality.

Premium AI services should only be recommended where they provide a clear and measurable advantage.

Recommendations should reflect the project's current commercial strategy rather than historical preferences.

---

Cost Optimisation Policy


Lowest-cost capable AI first.
Premium AI only when justified.
AI providers are interchangeable.
Roles remain constant.
Occupants change.

-----

FOUNDER OVERRIDE
The Founder retains final authority.
AI recommendations are advisory.
Project direction remains a founder decision.

SUCCESS MEASUREMENT
Success is not the amount of AI assistance.
Success is:
Consistency
Quality
Maintainability
Scalability
Reduced rework
Faster delivery

----

Discovery

Discovery Report

↓

Existing Implementation

↓

Architecture Review

↓

Convergence Plan

↓

Implementation

----

Existing Implementation First

Reuse

↓

Refine

↓

Extend

↓

Replace

----

Current Implementation Queue


Example:

Every AI shall check:

Current Sprint
Founder Review Queue
Active Worker Assignments
Current Blockers

before accepting work.

----

Worker Lifecycle
Task Assigned

↓

Document Review

↓

Discovery

↓

Implementation Plan

↓

Implementation

↓

Review

↓

Founder Approval

↓

Documentation Update

↓

Complete

----

FOUNDER PRINCIPLE
AI systems are collaborators.
Documentation is memory.
The codebase is reality.
AI systems never synchronise with one another.

They synchronise through project documentation.


LC00–LC08 answer "What are we building?"
LC09 answers "How do we build it?"
LC10 answers "Where do we go next?"

# DOCUMENT HISTORY

## Version 2.0

Changes:

• Renamed document to AI Operating Framework.

• Upgraded to standard architecture document format.

• Added document positioning.

• Added scope.

• Added core operating principle.

• Introduced vendor-neutral operating philosophy.

• Introduced role-based AI Operating Model.

• Added Worker Roles.

• Added AI Recommendation Panel.

• Added Vendor Neutrality policy.

• Added Cost Optimisation policy.

• Removed provider-specific role assignments.

Status:

Approved for Phase B Governance.