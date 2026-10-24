LC03_LEGACY_PUBLICATION_SYSTEM.md and LC03A_PUBLICATION_IMPLEMENTATION_GUIDE
a complete authoritative replacement document.
Including:
·	Founder principles
·	Publication philosophy
·	Legacy Digital Publication
·	Legacy Archive Publication
·	Publication lifecycle
·	Editorial arrangement engine
·	Publication editor
·	Theme engine
·	Publication health engine
·	Publication optimizer
·	Featured content manager
·	Legacy Footprint
·	Community Impact
·	Community Stories integration
·	Event Story integration
·	Recognition integration
·	Legacy Room integration
·	Distribution model
·	Access control model
·	Database requirements
·	Component map additions
·	Implementation roadmap
FILE PATH
/docs/LC03_LEGACY_PUBLICATION_SYSTEM.md
OWNER
CG02
STATUS
Authoritative Specification
SUPERSEDES
LC03 Publication Engine
LegacyCapsule Publication Engine Build Guide
Publication Activation Documents
Publication Review Documents
Publication Sprint Documents
Batch Structure
Batch 1
FILE HEADER

--

PLATFORM ALIGNMENT
Document ID:    LC03
Governance:     CG05 — RevoWorld Platform Realignment Directive
Platform Owner: RW03 Publication Platform
Status:         Product consumption layer — references RW03

This document describes LegacyCapsule's publication experience.
Publication infrastructure is owned by RW03 Publication Platform.
LC03 describes how LegacyCapsule consumes and expresses that
infrastructure as the Legacy Publication Experience.

Platform Dependencies:
    RW03  Publication Platform     (primary — all publication infrastructure)
    RW01  Payment Services Platform (publication distribution payments)
    RW04  Recognition Platform     (recognition content within publications)

---

SECTION 1 — Purpose

SECTION 2 — Vision

SECTION 3 — Core Principles

SECTION 4 — System Position Within LegacyCapsule

SECTION 5 — Publication Philosophy

SECTION 6 — Publication DNA
Batch 2
SECTION 7 — Publication Products

SECTION 8 — Publication Lifecycle

SECTION 9 — Publication Structure
Batch 3
SECTION 10 — Theme & Identity Framework

SECTION 11 — Editorial Arrangement Engine

SECTION 12 — Featured Content System

SECTION 13 — Publication Health Engine

SECTION 14 — Publication Optimizer
Batch 4
SECTION 15 — Publication Editor

SECTION 16 — Publication Sharing

SECTION 17 — Publication Distribution

SECTION 18 — Export Framework

SECTION 19 — Legacy Showcase

SECTION 20 — Access Control
Batch 5
SECTION 21 — Publication Analytics

SECTION 22 — Ecosystem Alignment

SECTION 23 — Data Ownership

SECTION 24 — Future Expansion Layer

SECTION 25 — Founder Principles

Component Map Additions

Migration Notes

Retirement Notes For Old LC03
Component Map Impact
When LC03 is approved, COMPONENT_MAP should gain new architectural components such as:
PublicationThemeEngine

EditorialArrangementEngine

FeaturedContentManager

PublicationHealthEngine

PublicationOptimizer

PublicationNavigator

LegacySnapshot

PublicationVersionManager

PublicationExportCenter

LegacyShowcase
SECTION 1 — PURPOSE
Purpose
The Legacy Publication System (LPS) is the publication, presentation, preservation and distribution system of LegacyCapsule.
Its purpose is to transform event content, community participation, stories, tributes, memories, media and recognition into a premium publication experience that preserves both historical record and emotional significance.
The Legacy Publication System exists to ensure that meaningful life events do not end when the event concludes.
Instead, they become structured, accessible and enduring legacies.
Strategic Objective
The objective of the Legacy Publication System is not merely to generate documents.
The objective is to create meaningful legacy experiences that can be:
·	Read
·	Shared
·	Preserved
·	Revisited
·	Celebrated
·	Remembered
across generations.
Platform Role
Within LegacyCapsule, the Legacy Publication System serves as the primary presentation layer.
Many platform engines collect, manage and enrich information.
The Legacy Publication System transforms those assets into coherent publication experiences.
Founder Intent
LegacyCapsule should not simply collect memories.
It should transform them into something worthy of preservation.
The Legacy Publication System is the mechanism through which that transformation occurs.
SECTION 2 — VISION
Vision Statement
Every meaningful event deserves a publication worthy of the people, stories and community behind it.
The Legacy Publication System exists to make premium digital publications accessible without requiring publishing expertise, design skills or specialist software.
Long-Term Vision
The Legacy Publication System should become the definitive record of an event.
Years after an event concludes, the publication should remain one of the most valuable outputs produced by LegacyCapsule.
Readers should be able to understand:
·	Who was celebrated
·	What happened
·	Who participated
·	What impact was created
·	Why the event mattered
through a single publication experience.
Reader Experience Vision
The publication should feel:
Premium

Personal

Editorial

Readable

Immersive

Memorable
The reader should feel they are experiencing a carefully curated publication rather than navigating software.
Organiser Experience Vision
The organiser should feel:
Confident

Supported

In Control

Proud Of The Result
The system should perform the majority of publication assembly automatically while preserving organiser authority over final decisions.
LegacyCapsule Vision Alignment
The Legacy Publication System directly supports the broader LegacyCapsule mission:
Capture
↓
Celebrate
↓
Preserve
↓
Share
↓
Remember
The publication becomes the most visible expression of that mission.
SECTION 3 — CORE PRINCIPLES
Editorial Authority Over Automation
The system should be intelligent.
The publication should never feel automated.
Readers should feel:
This was thoughtfully assembled.
rather than:
This was automatically exported.
Automation exists to support editorial quality.
Not replace it.
Publication Immersion Principle
The publication should prioritise immersion over navigation.
Readers should feel they are experiencing a publication rather than operating software.
Navigation exists to support discovery and orientation.
It should never dominate the experience.
Invisible Navigation Principle
Navigation should always be available.
Navigation should rarely be visible.
The strongest publication experiences allow readers to focus on stories, memories, people and legacy rather than controls.
Content First Principle
Whenever a conflict exists between content and controls, content takes priority.
The publication should showcase:
·	People
·	Stories
·	Tributes
·	Memories
·	Community
·	Legacy
Technology should remain secondary.
Publication Confidence Principle
Organisers should feel:
If I publish now,
the publication will already look good.
The system should create confidence before editing begins.
Publish-Ready By Default
Every automatically generated publication should be:
Readable

Balanced

Presentable

Shareable
without requiring manual design work.
The organiser should review and enhance.
Not build and repair.
Curation Over Configuration
Whenever possible, the system should become smarter rather than more complicated.
Preference should be given to:
Better recommendations
instead of:
More settings
The platform should reduce decision fatigue.
LegacyCapsule Publication Studio Principle
LegacyCapsule should behave like a publication studio.
Not a publication builder.
Not a publication generator.
Organisers bring:
·	Stories
·	Tributes
·	Photos
·	Memories
·	Event Content
The system helps transform those assets into publication-worthy experiences.
SECTION 4 — SYSTEM POSITION WITHIN LEGACYCAPSULE
System Role
The Legacy Publication System is not an isolated feature.
It is a platform-level system that consumes content from multiple LegacyCapsule engines and transforms that content into publication experiences.
Publication Lifecycle Position
The Legacy Publication System sits near the end of the content lifecycle.
Profile Creation
        ↓
Community Participation
        ↓
Story Collection
        ↓
Tributes
        ↓
Event Coverage
        ↓
Recognition
        ↓
Publication
The publication becomes the consolidated expression of the entire event.
Core Relationships
The Legacy Publication System consumes content from:
Profile Engine
Examples:
·	Biography
·	Timeline
·	Milestones
·	Quotes
·	Achievements
Tribute Engine
Examples:
·	Written tributes
·	Media tributes
·	Community messages
Community Story Engine
Examples:
·	Memories
·	Community topics
·	Story collections
Event Engine
Examples:
·	Event phases
·	Programme highlights
·	Event coverage
·	D-Day content
Legacy Recognition Engine
Examples:
·	Recognition milestones
·	Achievements
·	Community impact indicators
Brand & Identity Layer
Examples:
·	Event themes
·	Brand identity
·	White-label configuration
Ecosystem Position
Publication infrastructure has been promoted to the RevoWorld Platform as RW03 Publication Platform (see RW00 Platform Architecture Index).

The Legacy Publication System consumes RW03 for rendering, themes, editorial arrangement, distribution and health checking. LegacyCapsule retains ownership of the publication experience — the editorial philosophy, Legacy DNA, publication identity and the emotional journey of creating a Legacy publication.

Future ecosystem products that require publication capability will consume RW03 directly rather than referencing LC03.

SECTION 5 — PUBLICATION PHILOSOPHY
Purpose
The Legacy Publication System exists to transform collected event content into a premium publication experience that preserves both factual history and emotional significance.
The publication should feel intentionally curated rather than automatically assembled.
Editorial-First Philosophy
The Legacy Publication System follows an editorial-first model.
The goal is not to display everything.
The goal is to present the most meaningful and representative version of the event.
Publication quality should prioritise:
·	Storytelling
·	Readability
·	Emotional impact
·	Visual balance
·	Content flow
·	Long-term relevance
Curated vs Preserved
The Legacy Publication System serves two distinct purposes.
Legacy Digital Publication
Curated.
Optimised for reading and sharing.
Not every approved item must appear.
Legacy Archive Publication
Preserved.
Designed to contain all approved publication-eligible content.
Optimised for completeness.
Publication Experience Over Document Generation
The Legacy Publication System is not primarily a document generator.
It is a publication experience platform.
Outputs such as PDFs are export products.
They are not the primary purpose of the system.
Human Story Before Statistics
Statistics support the publication.
They should never dominate it.
People, stories, memories and meaning remain the primary focus.
Metrics exist to reinforce impact.
Not replace narrative.
SECTION 6 — PUBLICATION DNA
Every Legacy Publication should express five core dimensions regardless of event type.
The Person
Who is being recognised, remembered or celebrated?
Typically expressed through:
·	Biography
·	Personal story
·	Timeline
·	Milestones
·	Achievements
·	Family information
·	Career journey
The Community
How did others experience the person or event?
Typically expressed through:
·	Memories
·	Stories
·	Tributes
·	Reflections
·	Shared experiences
The Event
What happened?
Typically expressed through:
·	Event Story
·	Event phases
·	Programme highlights
·	Official coverage
·	Guest captures
·	Significant moments
The Impact
What influence was created?
Typically expressed through:
·	Highlights
·	Legacy Footprint
·	Community Impact
·	Participation milestones
·	Geographic reach
·	Recognition milestones
The Reflection
What remains after the event concludes?
Typically expressed through:
·	Closing Reflection
·	Closing Messages
·	Appreciation
·	Future hopes
·	Legacy statements
Publication Integrity Rule
A publication should never become excessively weighted toward a single dimension.
Examples of poor balance:
Hundreds of tributes
No profile

Hundreds of photos
No stories

Statistics only
The Publication Health Engine will help monitor balance across publication dimensions.
SECTION 7 — PUBLICATION PRODUCTS
Purpose
The Legacy Publication System produces publication experiences and publication outputs.
Publication experiences are designed for consumption.
Publication outputs are designed for preservation, sharing, export and distribution.
The publication itself remains the primary product.
Exports remain secondary products.
Publication Experiences
Legacy Digital Publication (LDP)
The flagship publication experience.
The Legacy Digital Publication serves as the primary way readers experience a legacy publication.
It is optimised for:
·	Mobile devices
·	Tablets
·	Desktop devices
·	Sharing
·	Reading
·	Reflection
·	Community participation
·	Legacy preservation
Characteristics
The Legacy Digital Publication is:
Responsive

Theme Aware

Brand Aware

Event Aware

Accessible

Shareable

Curated
Reading Philosophy
The publication should feel like a premium editorial experience.
Not a website.
Not a document viewer.
Not a PDF reader.
Navigation Model
The Legacy Digital Publication supports:
·	Contents & Legacy Snapshot
·	Active section tracking
·	Return to Contents
·	Section jump navigation
while preserving immersion.
Legacy Showcase Publication
A publication experience displayed within the Legacy Showcase.
Purpose:
·	Discovery
·	Inspiration
·	Planner visibility
·	Community visibility
·	LegacyCapsule promotion
Participation remains optional.
Publication owners control visibility.
Publication Outputs
Publication outputs are generated from publication experiences.
A publication is authored once.
Outputs are generated as needed.
Digital PDF
Purpose:
·	Offline reading
·	Download
·	Sharing
·	Personal preservation
The PDF is an export product.
It is not the primary publication experience.
Print PDF
Purpose:
·	Home printing
·	Commercial printing
·	Physical keepsakes
Optimised for print fidelity.
Archive Package
Purpose:
Long-term preservation.
May contain:
·	Publication export
·	Publication metadata
·	Approved publication assets
·	Publication configuration
·	Publication history
Future Outputs
Potential future outputs include:
·	Booklet Package
·	Hardcover Print Package
·	Family Archive Package
·	Institutional Archive Package
·	Anniversary Edition Package
Founder Rule
The publication should be created once.
All outputs should be generated from the same publication source.
No separate publication creation workflow should exist for different output types.
SECTION 8 — PUBLICATION LIFECYCLE
Purpose
The Publication Lifecycle governs how publications move from collected content to published legacy experiences.
The lifecycle must remain aligned with the parent capsule.
Lifecycle Alignment Principle
The Legacy Publication System does not maintain an independent business lifecycle.
Publication lifecycle follows capsule lifecycle.
Capsule
      ↓
Publication
Publication Flow
Content Collection
        ↓
Publication Draft
        ↓
Auto Generation
        ↓
Review
        ↓
Publication Release
        ↓
Publication Updates (Optional)
        ↓
Capsule Expiry
        ↓
Retention Window
        ↓
Removal
Publication States
Draft
Publication exists but has not yet been generated.
Auto Generated
System-generated publication available for review.
Under Review
Publication awaiting organiser approval.
Edited
Publication has received manual adjustments.
Ready For Release
Publication approved for release.
Released
Publication available to readers.
Archived
Publication retained within lifecycle rules.
Superseded
Replaced by a newer publication version.
Failed
Generation process encountered an error.
Publication Versions
Publications should support version history.
Examples:
Version 1
Initial Release

Version 2
Post Review

Version 3
Expanded Edition
Version Philosophy
History should be preserved.
New versions should not overwrite historical publication records.
Release Models
Immediate Release
Publication becomes available immediately.
Scheduled Release
Publication becomes available at a specified date and time.
Invitation Release
Publication becomes available to selected recipients first.
Retention Alignment
Publication retention follows capsule retention rules.
The Publication System should never create conflicting retention policies.
Founder Rule
A publication is part of a capsule.
It should never behave as an independent product lifecycle.
SECTION 9 — PUBLICATION STRUCTURE
Structure Philosophy
Every publication should feel familiar while remaining unique.
Readers should immediately recognise a LegacyCapsule publication while still feeling the individuality of the event.
The structure provides consistency.
Themes and content provide uniqueness.
Standard Publication Flow
Cover
Provides first impression.
May contain:
·	Hero image
·	Event title
·	Person or honouree name
·	Event date
·	Dedication line
·	Opening quote
Purpose:
Create emotional and visual impact immediately.
Opening Tribute
A featured tribute selected by:
·	Family representative
·	Event owner
·	Organiser
·	Honouree
·	Institution representative
Purpose:
Set emotional tone.
Contents & Legacy Snapshot
Serves as both orientation and impact summary.
Legacy Snapshot
May include:
·	Contributors
·	Tributes
·	Stories
·	Countries represented
·	Photos
·	Event phases
·	Recognition milestones
Metrics should remain supportive rather than dominant.
Publication Navigator
Provides linked access to major publication sections.
Profile
The official story of the person, family, organisation or event.
Possible content:
·	Biography
·	Personal story
·	Timeline
·	Milestones
·	Achievements
·	Quotes
·	Gallery highlights
Memories
Community-generated story collections.
Stories are grouped beneath topics.
Topics may originate from:
·	Organiser
·	Family
·	Community
·	Event participants
Purpose:
Capture collective memory.
Tributes
Approved tribute submissions.
Possible groupings:
·	Family
·	Friends
·	Colleagues
·	Community
·	Institutions
Purpose:
Preserve voices of appreciation and remembrance.
Event Story
The story of the event itself.
May contain:
·	Event phases
·	Programme highlights
·	Official coverage
·	Guest captures
·	Reflections
·	Significant moments
Purpose:
Document how the event unfolded.
Highlights
Editorially selected moments from across the publication.
May include:
·	Featured stories
·	Featured tributes
·	Featured photos
·	Featured event moments
·	Recognition highlights
Purpose:
Elevate memorable content.
Legacy Footprint
Measures reach and representation.
Examples:
·	Countries represented
·	Community representation
·	Participation reach
·	Geographic diversity
Purpose:
Demonstrate scale of participation.
Community Impact
Measures influence and engagement.
Examples:
·	Participation milestones
·	Community involvement
·	Recognition achievements
·	Legacy-building indicators
Purpose:
Demonstrate collective contribution.
Closing Reflection
Provides emotional interpretation of the publication journey.
Purpose:
Help readers reflect on the meaning behind the event and participation.
Closing Messages
Dedicated space for official voices associated with the event.
Examples:
·	Family Representative
·	Honouree
·	Event Owner
·	Institution Representative
·	Community Representative
Voice Hierarchy Principle
The publication may support:
Primary Voice

Supporting Voices

Community Voices
Not all voices require equal prominence.
Acknowledgements
Recognises participants and supporters.
Examples:
·	Contributors
·	Volunteers
·	Families
·	Communities
·	Supporters
Opt-out preferences must be respected.
Event Credits
Recognises organisations and individuals who helped deliver the event.
Examples:
·	Event Planner
·	Event Coordinator
·	Photography Team
·	Videography Team
·	Venue
·	Production Team
·	Host Organisation
Purpose:
Recognise event ecosystem participants.
Back Cover
Provides publication closure.
May contain:
·	Final image
·	Closing quote
·	Publication date
·	Brand identity
·	Closing statement
Suggested closing statement:
Events End.
Legacies Continue.
Publication Integrity Rule
The standard publication structure should remain recognisable across all event types.
Themes may alter presentation.
Event types may alter emphasis.
The core publication journey should remain intact.

SECTION 10 — THEME & IDENTITY FRAMEWORK
Purpose
The Theme & Identity Framework ensures that every Legacy Publication feels unique while remaining recognisably part of the LegacyCapsule ecosystem.
The framework balances:
Platform Consistency
+
Event Identity
+
Brand Identity
+
Publication Personality
Theme Architecture
The Legacy Publication System uses a layered identity model.
Layer 1 — Platform Identity
Provides the common LegacyCapsule foundation.
Examples:
·	Publication standards
·	Reading experience standards
·	Navigation behaviour
·	Publication structure
·	Accessibility standards
Purpose:
Ensure all publications feel like part of the same platform family.
Layer 2 — Brand Identity
Defines ownership identity.
May originate from:
LegacyCapsule

Community Brand

Institution Brand

White Label Brand
Controls:
·	Logos
·	Brand marks
·	Attribution
·	Footer identity
·	Brand messaging
Layer 3 — Event Identity
Inherited from the capsule.
Controls:
Primary Colour

Secondary Colour

Accent Colour
Used within:
·	Cover
·	Section headers
·	Quotes
·	Dividers
·	Recognition elements
·	Highlight cards
Layer 4 — Publication Personality
Defines emotional presentation.
Examples:
Memorial

Wedding

Recognition

Retirement

Birthday

Institutional

Executive

Celebration
Personality Responsibilities
Publication personalities may influence:
·	Typography
·	Spacing
·	Decorative elements
·	Image treatment
·	Quote treatment
·	Visual rhythm
·	Emotional tone
They must never alter publication structure.
Event Signature Elements
Personality types may introduce subtle visual signatures.
Memorial
Examples:
Reflection Styling

Memory Accents

Quiet Visual Language
Wedding
Examples:
Celebration Styling

Elegant Dividers

Floral Influences
Recognition
Examples:
Achievement Accents

Recognition Styling

Award Treatments
Institutional
Examples:
School Colours

Institution Identity

Formal Presentation
Theme Selection Philosophy
Themes should alter atmosphere.
Not architecture.
Two publications may feel entirely different emotionally while sharing the same underlying structure.
Founder Rule
Themes should enhance identity.
They must never create usability problems.
Beauty must never reduce readability.
SECTION 11 — EDITORIAL ARRANGEMENT ENGINE
Purpose
The Editorial Arrangement Engine transforms collected content into a publication that feels curated rather than assembled.
The engine determines:
What Appears

Where It Appears

How It Appears

Why It Appears
Philosophy
Traditional publication systems organise content.
The Legacy Publication System curates content.
The objective is not chronology.
The objective is narrative quality.
Editorial Authority Principle
Automation exists to support editorial quality.
Readers should feel:
Someone thoughtfully put this together.
even when the publication was largely assembled by the system.
Arrangement Inputs
The engine may consider:
Content Richness
Examples:
·	Story depth
·	Tribute depth
·	Media richness
·	Completeness
Community Signals
Examples:
·	Featured status
·	Organiser preference
·	Community significance
Narrative Relevance
Examples:
·	Emotional significance
·	Historical significance
·	Event significance
Visual Quality
Examples:
·	Resolution
·	Composition
·	Visual diversity
·	Subject clarity
Arrangement Responsibilities
The engine may:
·	Select hero images
·	Suggest featured stories
·	Suggest featured tributes
·	Suggest featured photos
·	Suggest featured moments
·	Prevent repetition
·	Improve pacing
·	Improve visual balance
·	Improve narrative flow
Narrative Flow Principle
The publication should feel like a journey.
Not a collection of database records.
The reader should naturally progress through:
Person
↓
Community
↓
Event
↓
Impact
↓
Reflection
Founder Rule
The organiser should never feel required to design the publication.
The system should produce a strong publication by default.
SECTION 12 — FEATURED CONTENT SYSTEM
Purpose
The Featured Content System creates memorable moments throughout the publication.
Not all content should receive identical treatment.
Some content deserves elevation.
Signature Moments Principle
Every publication should contain a small number of elevated moments.
These moments become the pages readers remember most.
Featured Content Types
Featured Tribute
Receives premium treatment.
Examples:
·	Hero presentation
·	Enhanced typography
·	Editorial framing
Featured Story
Receives enhanced narrative treatment.
Examples:
·	Full-width presentation
·	Pull quotes
·	Visual emphasis
Featured Memory
Receives prominence within community stories.
Featured Photo
May become:
·	Cover image
·	Section hero
·	Full-width image feature
Featured Event Moment
Receives elevated placement within Event Story.
Featured Recognition
Receives enhanced recognition presentation.
Highlights Relationship
Highlights operate in two ways.
Editorial Layer
Featured content may appear anywhere within the publication.
Highlights Section
A dedicated section may showcase selected publication highlights.
Both approaches may coexist.
Selection Model
System Suggestions
The system identifies potential featured content.
Organiser Approval
The organiser remains final editor.
The system recommends.
The organiser approves.
Founder Rule
Featured content should feel earned.
Not artificially promoted.
SECTION 13 — PUBLICATION HEALTH ENGINE
Purpose
The Publication Health Engine measures publication quality before publication release.
The objective is guidance.
Not restriction.
Publication Confidence Principle
Organisers should feel:
If I release this publication now,
it will already represent the event well.
The Health Engine supports confidence.
Publication Dimensions
Profile Coverage
Measures:
·	Biography completeness
·	Milestone coverage
·	Achievement coverage
Community Representation
Measures:
·	Story diversity
·	Tribute diversity
·	Representation quality
Event Coverage
Measures:
·	Event phase coverage
·	Programme representation
·	Event documentation
Visual Coverage
Measures:
·	Image quality
·	Image diversity
·	Visual storytelling
Legacy Representation
Measures:
·	Impact indicators
·	Reach indicators
·	Recognition indicators
Publication Balance
Measures alignment with Publication DNA.
Person

Community

Event

Impact

Reflection
Health Results
Use human language.
Examples:
Excellent

Strong

Developing

Limited
Avoid technical scores as primary language.
Publication Snapshot Principle
The Health Engine should help organisers understand:
Who participated?

What was collected?

How well is it represented?
within seconds.
Founder Rule
The Health Engine should think like an editor.
Not a database administrator.
SECTION 14 — PUBLICATION OPTIMIZER
Purpose
The Publication Optimizer helps organisers improve publication quality through intelligent recommendations.
The Optimizer builds upon insights generated by the Health Engine.
Philosophy
The Optimizer should behave like an experienced publication consultant.
Not a validation tool.
Guidance Principles
Recommendations should be:
Helpful

Actionable

Positive

Specific
Never punitive.
Example Guidance
Poor:
Only 2 stories found.
Better:
Additional community stories could enrich the Memories section.
Poor:
Profile incomplete.
Better:
Adding career milestones could strengthen the profile narrative.
Optimizer Categories
Profile Recommendations
Examples:
·	Missing milestones
·	Missing biography details
·	Missing achievements
Community Recommendations
Examples:
·	Additional memories
·	Additional tributes
·	Broader representation
Event Recommendations
Examples:
·	Missing event phases
·	Limited event coverage
·	Missing event imagery
Visual Recommendations
Examples:
·	Missing hero image
·	Limited visual diversity
·	Weak image coverage
Editorial Recommendations
Examples:
·	Feature this tribute
·	Promote this story
·	Highlight this moment
·	Add closing message
Recommendation Priorities
Recommendations may be grouped as:
Suggested

Recommended

Highly Recommended
The system should avoid alarmist language.
Continuous Improvement Philosophy
The publication should be releasable at any point.
The Optimizer exists to improve quality.
Not to block publication.
Founder Rule
The Optimizer should encourage excellence without creating friction.
The objective is a better publication experience.
Not a longer publishing process.
SECTION 15 — PUBLICATION EDITOR
Purpose
The Publication Editor provides a controlled environment for reviewing, refining and approving publications before release.
The editor exists to improve publication quality.
It does not exist to turn organisers into publication designers.
Editor Philosophy
The Publication Editor follows:
Review First

Curate Second

Design Last
The publication should already be publication-ready before the editor is opened.
Publish-Ready Principle
The organiser should feel:
The publication already looks good.

I am improving it.

Not building it.
Editor Modes
Quick Review Mode
Default experience.
Designed for most users.
Capabilities:
·	Review publication
·	Approve publication
·	Select theme
·	Replace cover image
·	Edit section introductions
·	Edit closing messages
·	Hide optional sections
·	Release publication
Goal:
5–10 Minute Review Experience
Curator Mode
Enhanced control for organisers.
Capabilities:
·	Reorder sections
·	Feature content
·	Reorder featured content
·	Replace suggested content
·	Manage highlights
·	Manage acknowledgements
·	Manage Event Credits
Purpose:
Improve publication storytelling.
Designer Mode
Future capability.
Potential abilities:
·	Advanced layouts
·	Typography controls
·	Custom cover treatments
·	Planner branding packages
Not required for MVP.
Publication Workspace
The editor should be organised into:
Publication Preview
Shows publication as readers will experience it.
Publication Health
Displays publication quality indicators.
Optimizer Recommendations
Displays suggested improvements.
Publication Settings
Controls publication-level options.
Auto Save Principle
All publication edits should save automatically.
Display:
Saved Just Now

Saved 30 Seconds Ago
No dedicated save button required.
Version Snapshots
Major changes may generate version snapshots.
Examples:
Auto Generated

Post Review

Published Version

Updated Version
History should remain recoverable.
Founder Rule
The Publication Editor should feel like a review studio.
Not a desktop publishing application.
SECTION 16 — PUBLICATION SHARING
Purpose
Publication Sharing allows readers to access publication experiences.
Sharing is user-driven.
Sharing is not distribution.
Primary Sharing Philosophy
The primary shareable asset is:
The Publication Experience
not:
The PDF
Publication links should be the default sharing mechanism.
Sharing Channels
Direct Link
Primary sharing method.
Examples:
Publication URL

Private URL

Invitation URL
QR Code
Automatically generated.
Useful for:
·	Printed programmes
·	Memorial services
·	Weddings
·	Recognition events
·	Anniversary events
WhatsApp
Priority sharing channel.
Especially important across:
·	Africa
·	Diaspora communities
·	Family networks
·	Community groups
Email Sharing
Manual sharing capability.
Social Sharing
Future capability.
Examples:
·	Facebook
·	LinkedIn
·	X
Share Preview System
Shared links should display:
·	Cover image
·	Publication title
·	Event subtitle
·	Publication summary
Purpose:
Improve share quality.
Founder Rule
Sharing should always favour the publication experience before export files.
SECTION 17 — PUBLICATION DISTRIBUTION
Purpose
Publication Distribution manages system-driven publication delivery.
Unlike sharing, distribution is automated.
Distribution Targets
Organiser
Receives publication release notification.
Contributors
May receive publication release notification.
Family Representatives
Optional.
Institution Representatives
Optional.
Event Team
Optional.
Distribution Package
Release communications may include:
·	Publication cover
·	Publication message
·	Publication link
·	QR code
·	Release note
Distribution Timing
Supported models:
Immediate
Release instantly.
Scheduled
Release at specified date and time.
Controlled Release
Release to selected recipients first.
Release Events
Examples:
Publication Released

Publication Updated

New Edition Released

Anniversary Edition Released
Founder Rule
Distribution should feel personal.
Not transactional.
SECTION 18 — EXPORT FRAMEWORK
Purpose
The Export Framework converts publication experiences into preservation and distribution formats.
Export Philosophy
The publication experience remains primary.
Exports remain secondary.
The publication should never be designed around export limitations.
Export Profiles
Digital PDF
Purpose:
·	Offline reading
·	Download
·	Personal preservation
Print PDF
Purpose:
·	Home printing
·	Professional printing
·	Keepsakes
Archive Package
Purpose:
Long-term preservation.
May contain:
·	Publication
·	Publication metadata
·	Approved media
·	Publication configuration
·	Publication history
Publication Collection Concept
Large events may contain more content than is suitable for a publication.
The Publication System may therefore support:
Curated Publication
+
Extended Archive
The publication remains readable.
The archive remains comprehensive.
Export States
Examples:
Pending

Generating

Ready

Failed

Archived
Regeneration Principle
New exports should not overwrite previous exports.
History should remain recoverable.
Founder Rule
A publication should be authored once and exported many times.
SECTION 19 — LEGACY SHOWCASE
Purpose
The Legacy Showcase is the public discovery layer for selected publications.
Participation is optional.
Publication owners retain control.
Showcase Objectives
The Showcase supports:
·	Inspiration
·	Discovery
·	Legacy preservation
·	Planner visibility
·	Institutional visibility
·	Community visibility
Showcase Eligibility
Default:
Not Included
Publication owners must explicitly opt in.
Showcase Categories
Examples:
Memorials

Retirements

Recognition Events

Weddings

Anniversaries

Community Celebrations

Institutional Events
Showcase Cards
May display:
·	Cover image
·	Publication title
·	Event type
·	Country
·	Publication date
Sensitive information must remain protected.
Featured Publications
LegacyCapsule may feature selected publications.
Selection should be editorial.
Not commercial.
Planner Visibility
Where permitted, Event Credits may provide visibility for:
·	Event planners
·	Planning companies
·	Event teams
This supports planner ecosystem growth.
Founder Rule
The Showcase should celebrate meaningful events.
Not become a publication marketplace.
SECTION 20 — ACCESS CONTROL
Purpose
Access Control governs publication visibility and access rights.
Inheritance Principle
Publication visibility should inherit from capsule visibility.
Default behaviour:
Capsule
      ↓
Publication
Override Principle
Organisers may explicitly override publication visibility when permitted.
Examples:
Private Capsule
Public Publication
or
Public Capsule
Restricted Publication
Access Methods
Open Access
Anyone with access may view.
Access Code Access
Uses Access Code Engine integration.
Invitation Access
Invitation-based access.
Contributor Access
Restricted to contributors.
Organiser Access
Restricted to organisers.
Audit Events
Examples:
Publication Generated

Publication Released

Publication Shared

Publication Exported

Publication Accessed
Privacy Principle
The publication should expose only information appropriate to its visibility level.
Public access must never imply unrestricted access to all underlying event data.
Founder Rule
Publication access should remain simple for readers while remaining controllable for organisers.
SECTION 21 — PUBLICATION ANALYTICS
Purpose
Publication Analytics provides organisers with meaningful insight into publication reach, engagement and legacy impact.
The objective is not traffic monitoring.
The objective is understanding how the publication is being experienced and preserved.
Analytics Philosophy
The Legacy Publication System prioritises meaningful impact metrics over vanity metrics.
The system should answer:
Who was reached?

How was the publication experienced?

How far did the publication travel?

What engagement occurred?
Publication Reach Metrics
Examples:
·	Publication recipients
·	Unique readers
·	Countries reached
·	Regions reached
·	Communities reached
·	Access code usage
Publication Engagement Metrics
Examples:
·	Publication opens
·	Repeat visits
·	Reading sessions
·	Section engagement
·	QR code scans
·	Publication shares
Community Impact Metrics
Examples:
·	Contributors reached
·	Contributor return rate
·	Family engagement
·	Community participation rate
·	Recognition participation
Publication Snapshot Analytics
Provide organisers with a concise summary.
Example:
Publication Reach

12 Countries
428 Readers
92 Contributors Reached
84% Contributor Return Rate
Privacy Principle
Analytics should respect privacy settings and applicable regulations.
Personal behaviour tracking should be minimised.
The objective is publication insight.
Not surveillance.
Founder Rule
Analytics should measure legacy impact.
Not website popularity.
SECTION 22 — ECOSYSTEM ALIGNMENT
Purpose
The Legacy Publication System operates as part of the broader LegacyCapsule ecosystem.
It is not a standalone content ownership system.
Architectural Role
The Legacy Publication System is responsible for:
Presentation

Publication

Curation

Distribution

Preservation

Showcase
It is not responsible for originating most content.
Content Ownership Principle
The Legacy Publication System does not own content.
Content ownership remains with source systems.
Profile Engine
Owns:
·	Biography
·	Timeline
·	Milestones
·	Profile data
Tribute Engine
Owns:
·	Tribute submissions
·	Tribute media
·	Tribute approvals
Community Story Engine
Owns:
·	Stories
·	Memories
·	Topics
·	Community contributions
Event Engine
Owns:
·	Event phases
·	Event programme
·	Event coverage
Recognition Engine
Owns:
·	Recognition data
·	Achievements
·	Community recognition records
Publication Responsibility
The Legacy Publication System:
Consumes
Curates
Presents
It does not replace source systems.
Shared Platform Services
The Legacy Publication System integrates with:
·	Brand Layer
·	White Label Layer
·	Access Code Engine
·	Engagement Engine
·	Notification Services
·	Analytics Services
Ecosystem Value
The publication becomes the most visible expression of work performed by multiple LegacyCapsule systems.
Founder Rule
The Legacy Publication System should amplify ecosystem value rather than duplicate ecosystem responsibilities.
SECTION 23 — DATA OWNERSHIP
Purpose
Define ownership and responsibility for publication-related information.
Publication Ownership
The publication belongs to the capsule owner or authorised organisation responsible for the capsule.
Contributor Rights
Contributors retain ownership of their submitted content subject to platform terms and permissions granted during contribution.
Publication Rights
Publication generation does not transfer ownership of underlying content to LegacyCapsule.
LegacyCapsule provides:
Hosting

Presentation

Preservation

Distribution
within platform rules.
Publication Visibility Rights
Visibility remains controlled by authorised publication administrators.
Examples:
·	Capsule Owner
·	Family Representative
·	Institution Administrator
·	Event Organiser
depending on configuration.
Showcase Rights
Publication owners control Showcase participation.
Participation must be opt-in.
Export Rights
Authorised publication administrators may export publication outputs made available by the platform.
Founder Rule
Ownership should remain clear, transparent and easy to understand.
SECTION 24 — FUTURE EXPANSION LAYER
Purpose
Provide architectural space for future publication capabilities.
The Future Expansion Layer documents anticipated growth areas without creating MVP obligations.
Future Publication Experiences
Potential future experiences include:
Anniversary Editions
Example:
1 Year Reflection Edition

5 Year Reflection Edition

10 Year Reflection Edition
Where content availability and retention policies permit.
Family Archive Editions
Extended preservation experiences for families.
Institutional Yearbooks
School, church and association publication experiences.
Recognition Collections
Multi-recipient recognition publications.
Legacy Collections
Grouped publications connected by theme, organisation or family.
Future Publication Intelligence
Potential future capabilities include:
AI Assisted Curation
Suggestions for:
·	Featured stories
·	Featured tributes
·	Editorial summaries
·	Publication improvements
Multi-Language Publications
Support for multiple reading languages from a single publication source.
Adaptive Publication Themes
Themes that respond to publication type and content characteristics.
Future Output Formats
Potential outputs include:
·	Hardcover Print Editions
·	Commercial Print Packages
·	Gift Editions
·	Commemorative Book Collections
Future Ecosystem Opportunities
Potential alignment with:
·	Educational products
·	Institutional products
·	RevoWorld Publishing initiatives
·	Community heritage projects
Founder Rule
Future possibilities should influence architecture.
They should not create present-day complexity.
SECTION 25 — FOUNDER PRINCIPLES
Purpose
These principles guide future decisions affecting the Legacy Publication System.
When uncertainty exists, these principles take precedence.
Publication Experience First
The publication experience is the primary product.
Everything else is secondary.
Editorial Authority Over Automation
Automation supports quality.
Automation should never become visible.
Publish Ready By Default
Every publication should look good before editing begins.
Curation Over Configuration
Prefer smarter systems over more settings.
Content First
Content takes priority over controls.
Invisible Navigation
Navigation should always be available.
Navigation should rarely be visible.
Publication Confidence
Organisers should feel confident publishing at any stage.
Legacy Before Technology
Readers should remember:
·	Stories
·	People
·	Tributes
·	Memories
·	Legacy
Not software features.
Ecosystem Alignment
The Legacy Publication System should strengthen the broader LegacyCapsule ecosystem.
Simplicity At Scale
As the platform grows, complexity should remain hidden from users.
Founder Standard
A publication should cause organisers to feel:
I cannot believe the system produced this.
That standard should guide future enhancements.



LC03A_PUBLICATION_IMPLEMENTATION_GUIDE

PURPOSE

Translate LC03 into a build-ready engineering architecture while preventing implementation drift.

This document defines:

Technical architecture
Domain boundaries
Data architecture
Service architecture
Build sequencing
Engineering constraints

It does not redefine product behaviour already established in LC03.

SECTION 1 — IMPLEMENTATION PHILOSOPHY
Purpose

This document exists to ensure that implementation remains aligned with the approved Legacy Publication System architecture.

Engineering decisions must support LC03.

Engineering decisions must not redefine LC03.

Source Of Truth Hierarchy

When conflicts occur:

Tier 1
Founder Decisions

Highest authority.

Tier 2
LC03
Legacy Publication System

Authoritative product specification.

Tier 3
LC03A
Implementation Guide

Engineering interpretation of LC03.

Tier 4
Implementation Preferences

Developer preferences.

Lowest authority.

Anti-Drift Principle

Engineers may improve implementation.

Engineers may not alter product intent without approval.

Examples:

Allowed:

Improve performance

Improve scalability

Reduce infrastructure cost

Improve maintainability

Not Allowed:

Remove publication intelligence

Replace publication experience with PDF-first workflow

Eliminate editorial arrangement

Reduce publication quality standards

without product approval.

Publication First Principle

The primary product is:

Legacy Digital Publication

Everything else is secondary.

Examples:

PDF

Print

Archive Package

are outputs.

They are not the primary experience.

Experience Preservation Principle

Implementation should preserve:

Publication Immersion

Invisible Navigation

Content First

Publish Ready By Default

Editorial Authority Over Automation

These principles must survive implementation.

Domain Responsibility Principle

The Legacy Publication System consumes content.

It does not own most content.

Ownership remains with source systems.

LPS is responsible for:

Aggregation

Curation

Presentation

Distribution

Preservation
Founder Rule

Technical convenience must never degrade publication quality.

SECTION 2 — PUBLICATION SYSTEM ARCHITECTURE
High-Level Architecture

The Legacy Publication System consists of four major layers.

Source Systems
        ↓
Publication Intelligence Layer
        ↓
Publication Experience Layer
        ↓
Publication Delivery Layer
Layer 1 — Source Systems

External systems supplying publication content.

Examples:

Profile Engine

Tribute Engine

Community Story Engine

Event Engine

Recognition Engine

These systems remain owners of their content.

Layer 2 — Publication Intelligence Layer

Responsible for transforming content into publication-ready experiences.

Components:

PublicationThemeEngine

EditorialArrangementEngine

FeaturedContentManager

PublicationHealthEngine

PublicationOptimizer

Purpose:

Raw Content
        ↓
Curated Publication Content
Layer 3 — Publication Experience Layer

Responsible for reader-facing publication experiences.

Components:

PublicationRenderer

PublicationNavigator

LegacySnapshot

PublicationEditor

PublicationVersionManager

Purpose:

Curated Content
        ↓
Publication Experience
Layer 4 — Publication Delivery Layer

Responsible for access and distribution.

Components:

PublicationExportCenter

LegacyShowcase

PublicationAnalytics

Access Control Layer

Distribution Services

Purpose:

Publication Experience
        ↓
Sharing
Distribution
Preservation
Architectural Boundaries
LPS Owns
Publication Assembly

Publication Rendering

Publication Themes

Publication Navigation

Publication Exports

Publication Showcase

Publication Analytics
LPS Does Not Own
Profiles

Tributes

Stories

Event Records

Recognition Records
Publication Assembly Pipeline
Source Content
        ↓
Content Aggregation
        ↓
Editorial Arrangement
        ↓
Featured Content Selection
        ↓
Health Evaluation
        ↓
Publication Assembly
        ↓
Theme Application
        ↓
Publication Rendering

This pipeline becomes the backbone of the implementation.

Founder Rule

Publication Intelligence must remain separate from Publication Rendering.

This separation allows future improvements without rebuilding the publication experience.

SECTION 3 — DATA ARCHITECTURE
Purpose

Define the data structures owned by the Legacy Publication System.

Architectural Principle

The Publication System should store:

Publication State

not:

Duplicate Source Content

Whenever possible, source content should be referenced rather than copied.

Core Entities
publications

Primary publication record.

Stores:

publication_id

capsule_id

publication_status

publication_theme

publication_visibility

publication_version
publication_versions

Stores publication history.

Examples:

Version 1

Version 2

Version 3

Supports:

Rollback

History

Auditability
publication_sections

Stores publication structure.

Examples:

Profile

Memories

Tributes

Event Story

Closing Messages

Stores:

visibility

order

configuration
publication_themes

Stores:

Theme

Personality

Colours

Brand Configuration
publication_highlights

Stores:

Featured Stories

Featured Tributes

Featured Photos

Featured Moments

Selected by the Featured Content Manager.

publication_health

Stores:

Health Evaluations

Health Dimensions

Health Status

Generated by Publication Health Engine.

publication_optimizer

Stores:

Recommendations

Improvement Suggestions

Priority Levels

Generated by Publication Optimizer.

publication_exports

Stores:

Export Type

Export Status

Generation Date

Export Location
publication_showcase

Stores:

Showcase Status

Visibility

Featured Status

Showcase Metadata
publication_analytics

Stores:

Reach Metrics

Engagement Metrics

Distribution Metrics
Reference Strategy

Publication sections should primarily reference source content.

Example:

publication_story_reference
        ↓
community_story_id

instead of duplicating story records.

Versioning Principle

Each publication version should be reproducible.

A historical version must be rebuildable from stored publication state.

Audit Principle

Major publication actions should be auditable.

Examples:

Publication Generated

Publication Released

Publication Exported

Publication Updated

Publication Shared
Founder Rule

The Publication System should store publication intelligence and publication state.

It should avoid becoming a second content management system.

SECTION 4 — PUBLICATION GENERATION PIPELINE
Purpose

The Publication Generation Pipeline defines how source content becomes a publication experience.

This pipeline is the operational backbone of the Legacy Publication System.

Generation Philosophy

The system should not generate publications directly from source content.

Instead:

Source Content
        ↓
Publication Blueprint
        ↓
Publication Experience
        ↓
Publication Outputs
Publication Blueprint Principle

The Publication Blueprint is the authoritative publication model.

It represents:

The Publication

before rendering.

Every renderer must consume the same blueprint.

Benefits

The blueprint becomes the single source of truth for:

Web Publication

PDF Export

Print Export

Archive Package

Showcase Display

Analytics
Generation Stages
Stage 1 — Content Aggregation

Collect publication-eligible content from source systems.

Sources include:

Profile Engine

Tribute Engine

Community Story Engine

Event Engine

Recognition Engine

Output:

Aggregated Publication Dataset
Stage 2 — Editorial Arrangement

EditorialArrangementEngine evaluates:

Content Richness

Narrative Relevance

Visual Quality

Community Significance

Featured Status

Output:

Editorial Layout Model
Stage 3 — Featured Content Selection

FeaturedContentManager identifies:

Featured Stories

Featured Tributes

Featured Photos

Featured Moments

Featured Recognition

Output:

Featured Content Model
Stage 4 — Publication Health Evaluation

PublicationHealthEngine evaluates:

Profile Coverage

Community Representation

Event Coverage

Visual Coverage

Impact Representation

Publication Balance

Output:

Publication Health Profile
Stage 5 — Publication Optimization

PublicationOptimizer generates:

Suggestions

Recommendations

Improvement Opportunities

Output:

Optimizer Recommendation Set
Stage 6 — Blueprint Assembly

Publication Blueprint is generated.

Contains:

Structure

Ordering

Featured Content

Theme References

Configuration

Publication Metadata
Stage 7 — Theme Resolution

PublicationThemeEngine resolves:

Brand Identity

Event Identity

Publication Personality

Output:

Resolved Theme Package
Stage 8 — Rendering

PublicationRenderer consumes:

Publication Blueprint
+
Resolved Theme Package

and produces:

Publication Experience
Regeneration Principle

Publication regeneration should rebuild from source content and blueprint rules.

Not from previously rendered outputs.

Founder Rule

Renderers should never make editorial decisions.

Editorial decisions belong upstream.

SECTION 5 — PUBLICATION RENDERING ARCHITECTURE
Purpose

Define how publication experiences are rendered across channels.

Renderer Independence Principle

Renderers determine:

How Content Appears

They must not determine:

What Content Appears

Content selection belongs to:

EditorialArrangementEngine

FeaturedContentManager
Rendering Inputs

Every renderer receives:

Publication Blueprint

Contains:

Publication Structure

Content References

Featured Content

Publication Configuration
Resolved Theme Package

Contains:

Brand Tokens

Theme Tokens

Personality Tokens
Core Renderers
Legacy Digital Publication Renderer

Primary renderer.

Produces:

Responsive Publication Experience

Supports:

Mobile
Tablet
Desktop
PDF Renderer

Consumes same blueprint.

Produces:

Digital PDF

No separate publication assembly logic permitted.

Print Renderer

Consumes same blueprint.

Produces:

Print Optimized Output
Showcase Renderer

Consumes same blueprint.

Produces:

Showcase Presentation
Archive Renderer

Consumes same blueprint.

Produces:

Archive Package
Responsive Design Principle

Mobile experience is primary.

Desktop experience enhances.

Neither should be treated as secondary.

Rendering Strategy

Recommended:

Publication Blueprint
        ↓
React Components
        ↓
HTML Experience

Then:

HTML Experience
        ↓
PDF Renderer

rather than:

Publication
        ↓
Direct PDF
Publication Collection Support

Renderers must support:

Curated Publication

Extended Archive

as separate experiences.

Performance Principle

Large publications should remain responsive.

Rendering architecture must support:

Progressive Loading

Lazy Loading

Media Optimization

where appropriate.

Founder Rule

The publication experience is the product.

Exports are derived experiences.

SECTION 6 — THEME ENGINE ARCHITECTURE
Purpose

Define how publication identity and visual personality are resolved.

Theme Engine Responsibilities

PublicationThemeEngine is responsible for:

Brand Resolution

Theme Resolution

Personality Resolution

Visual Token Generation
Theme Resolution Hierarchy

Themes are resolved from four layers.

Platform
        ↓
Brand
        ↓
Event
        ↓
Personality
Layer 1 — Platform Layer

Provides:

Accessibility Rules

Reading Standards

Navigation Standards

Spacing Standards

Never overridden.

Layer 2 — Brand Layer

Provides:

Logo

Brand Colours

Brand Assets

Brand Messaging

Supports:

LegacyCapsule

Institutions

Associations

Churches

White Label Clients
Layer 3 — Event Layer

Provides:

Primary Colour

Secondary Colour

Accent Colour

Inherited from event configuration.

Layer 4 — Personality Layer

Provides:

Typography Style

Image Style

Quote Style

Recognition Style

Decorative Style

Examples:

Memorial

Wedding

Recognition

Executive

Institutional
Theme Token Architecture

The Theme Engine should resolve all styling into tokens.

Examples:

Colour Tokens
primary_color

secondary_color

accent_color

background_color
Typography Tokens
heading_style

body_style

quote_style
Layout Tokens
section_spacing

content_spacing

hero_spacing
Recognition Tokens
recognition_style

achievement_style

award_style
Highlight Tokens
highlight_style

feature_style

callout_style
White Label Principle

White-label implementations should modify:

Brand Layer

without modifying:

Publication Architecture

Publication Structure

Publication Intelligence
Theme Package Output

Theme Engine outputs:

Resolved Theme Package

containing:

Theme Tokens

Brand Assets

Personality Assets

Visual Rules

for renderer consumption.

Founder Rule

Themes should influence emotion.

They should not influence structure.

A wedding publication and a memorial publication should feel different while remaining recognisably part of the same Legacy Publication System.

SECTION 7 — EDITORIAL ARRANGEMENT ENGINE
Purpose

The Editorial Arrangement Engine transforms aggregated content into a coherent publication narrative.

Its responsibility is not content ownership.

Its responsibility is editorial assembly.

Core Responsibility

Transform:

Aggregated Content

into:

Editorial Blueprint

before rendering begins.

Engine Inputs
Profile Content

Examples:

Biography
Timeline
Milestones
Quotes
Community Content

Examples:

Stories
Memories
Reflections
Tribute Content

Examples:

Written tributes
Media tributes
Community messages
Event Content

Examples:

Event phases
Programme coverage
Event moments
Recognition Content

Examples:

Awards
Recognition records
Impact indicators
Editorial Evaluation Dimensions
Content Richness

Measures:

Depth

Completeness

Context

Story Value
Narrative Relevance

Measures:

Emotional Significance

Historical Significance

Publication Relevance
Visual Strength

Measures:

Image Quality

Composition

Visual Diversity
Community Importance

Measures:

Participation Value

Contributor Relevance

Community Impact
Editorial Confidence Model

Internal only.

Not reader-facing.

Examples:

Featured Story Confidence

Featured Tribute Confidence

Featured Photo Confidence

Featured Moment Confidence

Purpose:

Support explainable editorial decisions.

Editorial Override Layer

System recommendations must remain editable.

Workflow:

System Recommendation
        ↓
Organiser Review
        ↓
Organiser Override
        ↓
Final Blueprint

The system recommends.

Humans remain editors.

Engine Outputs

Produces:

Content Ordering

Section Ordering

Featured Candidates

Narrative Flow

Editorial Metadata
Founder Rule

The engine should optimise for publication quality.

Not content quantity.

SECTION 8 — FEATURED CONTENT MANAGER
Purpose

Identify and manage elevated content throughout the publication.

Featured content creates memorable publication moments.

Supported Content Types
Featured Story

Community story receiving enhanced treatment.

Featured Tribute

Tribute receiving elevated visibility.

Featured Photo

Photo receiving premium placement.

Featured Moment

Event moment receiving prominence.

Featured Recognition

Recognition item receiving enhanced presentation.

Selection Sources

Every featured item must record its origin.

System Selected

Chosen automatically.

Organiser Selected

Chosen manually.

Family Selected

Chosen by authorised family representative.

Institution Selected

Chosen by authorised institution representative.

Hybrid Selection

System recommendation approved by editor.

Featured Content Record

Stores:

featured_item_id

source_record_id

selection_source

selection_reason

confidence_level

approval_status
Selection Logic

The system may evaluate:

Narrative Strength

Emotional Significance

Community Relevance

Visual Quality

Publication Balance
Blueprint Integration

Featured content becomes part of the Publication Blueprint.

Renderers do not independently select featured content.

Founder Rule

Featured content should feel deserved.

Not random.

Not promotional.

SECTION 9 — PUBLICATION HEALTH ENGINE
Purpose

Evaluate publication readiness and publication balance.

The Health Engine exists to build organiser confidence.

Health Philosophy

The Health Engine is advisory.

It is not a publication gatekeeper.

Publications may be released regardless of health status.

Health Evaluation Areas
Profile Coverage

Evaluates:

Biography completeness
Timeline coverage
Milestone representation
Community Representation

Evaluates:

Story diversity
Tribute diversity
Contributor representation
Event Coverage

Evaluates:

Event phases
Event moments
Event documentation
Visual Coverage

Evaluates:

Media diversity
Media quality
Visual storytelling
Legacy Representation

Evaluates:

Impact indicators
Reach indicators
Recognition representation
Publication Balance

Evaluates alignment with:

Person

Community

Event

Impact

Reflection
Health Storage Model

Avoid score-first architecture.

Store:

Dimension

Status

Explanation

Recommendation

Example:

Community Representation

Strong

Stories and tributes reflect multiple participant groups.

Additional family stories could further strengthen representation.
Health Status Values

Examples:

Excellent

Strong

Developing

Limited
Health Engine Output

Produces:

Publication Health Profile

for:

Publication Editor
Optimizer
Analytics
Founder Rule

Health should guide.

Never intimidate.

SECTION 10 — PUBLICATION OPTIMIZER
Purpose

Generate actionable recommendations that improve publication quality.

Philosophy

The Optimizer behaves like a publication consultant.

Not a validator.

Not an auditor.

Input Sources

Consumes:

Publication Blueprint

Health Profile

Featured Content Data

Publication Metadata
Recommendation Categories
Profile Recommendations

Examples:

Add milestones
Expand biography
Add quotations
Community Recommendations

Examples:

Encourage more memories
Increase contributor diversity
Add family perspectives
Event Recommendations

Examples:

Add missing event phases
Include more event imagery
Visual Recommendations

Examples:

Improve cover image
Increase image diversity
Editorial Recommendations

Examples:

Feature this story
Promote this tribute
Highlight this moment
Recommendation Lifecycle

Every recommendation should support:

Generated

System created recommendation.

Accepted

User accepted recommendation.

Dismissed

User rejected recommendation.

Completed

Recommendation implemented.

Recommendation Record

Stores:

recommendation_id

recommendation_type

priority_level

status

generation_reason

completion_state
Priority Levels

Examples:

Suggested

Recommended

Highly Recommended

Avoid:

Critical

Error

Failure

unless technical issues exist.

Learning Opportunity Layer

Future capability.

The system may eventually learn from:

Accepted Recommendations

Dismissed Recommendations

Publication Outcomes

to improve future suggestions.

Founder Rule

The Optimizer exists to improve publication quality without increasing publication friction.


SECTION 11 — PUBLICATION EDITOR ARCHITECTURE
Purpose

Define the technical architecture supporting publication review, curation and approval.

The editor exists to manage publication state.

The editor does not generate publication intelligence.

Architectural Principle

Publication intelligence is generated before the editor opens.

The editor consumes intelligence outputs.

It does not recreate them.

Editor Architecture
Publication Blueprint
        ↓
Editor Workspace
        ↓
Editor Actions
        ↓
Updated Blueprint
Blueprint Separation Principle

The editor must maintain two distinct blueprint states.

Published Blueprint

Represents the currently released publication.

Immutable.

Used by:

Readers
Showcase
Analytics
Distribution
Working Blueprint

Represents the editable publication draft.

Used by:

Organisers
Editors
Family Representatives
Institution Administrators
Publication Update Flow
Published Blueprint
        ↓
Create Working Blueprint
        ↓
Editor Changes
        ↓
Review
        ↓
Publish Update
        ↓
New Published Blueprint

This prevents accidental modification of released publications.

Editor Modes
Quick Review Mode

Default mode.

Capabilities:

Approve Publication

Replace Cover

Change Theme

Edit Introductions

Edit Closing Messages

Manage Visibility
Curator Mode

Advanced editorial mode.

Capabilities:

Feature Content

Reorder Sections

Adjust Highlights

Manage Credits

Manage Acknowledgements
Designer Mode

Reserved for future phases.

Not required for MVP.

Editor Services
PublicationEditorService

Responsible for:

Editor State

Editor Permissions

Draft Management

Autosave
PublicationVersionManager

Responsible for:

Version Creation

Version History

Version Restoration

Version Comparison
PublicationDraftManager

Responsible for:

Working Blueprint Creation

Draft Persistence

Draft Recovery
Autosave Architecture

Editor changes should be persisted automatically.

Recommended model:

Editor Change
        ↓
Draft Update
        ↓
Autosave Queue
        ↓
Persistence
Editor Permissions
Publication Owner

Full access.

Organiser

Configurable access.

Family Representative

Configurable access.

Institution Administrator

Configurable access.

Contributor

No editor access.

Founder Rule

The editor should feel like a publication review studio.

Not a page-building application.

SECTION 12 — PUBLICATION DELIVERY ARCHITECTURE
Purpose

Manage publication access, sharing, notifications and release workflows.

Delivery Architecture

Publication delivery consists of two independent domains.

Access Domain

Controls:

Who Can Access
Notification Domain

Controls:

Who Gets Informed

These domains must remain separate.

ACCESS ARCHITECTURE
PublicationAccessService

Responsible for:

Visibility Rules

Access Validation

Permission Resolution

Access Logging
Access Methods
Open Access

Anyone with valid publication access.

Access Code Access

Integrated with:

Access Code Engine
Invitation Access

Email or identity based.

Contributor Access

Restricted to approved contributors.

Organiser Access

Restricted to authorised organisers.

Visibility Resolution Flow
Capsule Visibility
        ↓
Publication Visibility
        ↓
Publication Override Rules
        ↓
Final Access Decision
Access Audit Events

Examples:

Publication Viewed

Publication Access Granted

Publication Access Denied

Access Code Used
NOTIFICATION ARCHITECTURE
PublicationNotificationService

Responsible for:

Release Notifications

Update Notifications

Reminder Notifications

Distribution Notifications
Notification Channels
Email

MVP channel.

In-App Notifications

Future.

WhatsApp

Future integration.

Architecture should remain channel-agnostic.

Notification Events

Examples:

Publication Released

Publication Updated

Publication Shared

Anniversary Edition Released
Founder Rule

Access should remain secure.

Notifications should remain personal.

SECTION 13 — EXPORT FRAMEWORK ARCHITECTURE
Purpose

Provide scalable export generation without affecting publication performance.

Export Philosophy

Exports are generated from publication blueprints.

Never from rendered output copies.

Export Architecture
Publication Blueprint
        ↓
Export Request
        ↓
Export Job
        ↓
Export Renderer
        ↓
Generated Asset
Export Service
PublicationExportService

Responsible for:

Export Requests

Export Queues

Export Tracking

Export Retrieval
Export Job Model
export_jobs

Stores:

job_id

publication_id

export_type

job_status

created_at

completed_at

output_location
Export Status Values

Examples:

Pending

Queued

Generating

Completed

Failed

Archived
Export Types
Digital PDF

Purpose:

Offline Reading
Print PDF

Purpose:

Commercial Printing

Home Printing
Archive Package

Purpose:

Long-Term Preservation
Export Rendering Flow
Publication Blueprint
        ↓
Theme Resolution
        ↓
Export Renderer
        ↓
Generated Asset
Renderer Reuse Principle

Export renderers must consume:

Publication Blueprint

used by the publication experience.

No independent export assembly logic permitted.

Asynchronous Processing Principle

Export generation should always be background processed.

Never block publication usage.

Example:

Generate PDF
        ↓
Queue Job
        ↓
Background Processing
        ↓
User Notification
Storage Strategy

Generated exports should be stored separately from:

Publication Blueprint

Publication Metadata

Source Content

to preserve architectural separation.

Export Retention Alignment

Export retention follows:

Capsule Lifecycle

Publication Lifecycle

No independent export retention rules should exist.

Export Audit Events

Examples:

Export Requested

Export Generated

Export Downloaded

Export Archived
Founder Rule

A publication should be assembled once.

Everything else should be generated from that assembly.


SECTION 14 — LEGACY SHOWCASE ARCHITECTURE
Purpose

The Legacy Showcase provides a controlled public discovery layer for eligible publications.

It exists to celebrate meaningful events, increase publication visibility and support ecosystem growth while preserving owner control.

Showcase Philosophy

The Showcase is:

Celebration First

Discovery Second

Marketing Third

It must never feel like a publication marketplace.

Showcase Participation Model

Default:

Excluded From Showcase

Participation requires explicit opt-in.

Showcase Eligibility Workflow
Publication Released
        ↓
Owner Opt-In
        ↓
Eligibility Validation
        ↓
Showcase Listing
Showcase Components
ShowcaseCatalog

Responsible for:

Browsing

Filtering

Discovery

Category Navigation
ShowcasePublicationCard

Displays:

Cover

Title

Event Type

Country

Publication Date
ShowcaseProfile

Optional.

Supports:

Planner Visibility

Institution Visibility

Organisation Visibility

when permitted.

Showcase Categories

Examples:

Memorials

Retirements

Recognition Events

Weddings

Anniversaries

Community Celebrations

Institutional Events
Featured Showcase System

Supports:

Featured Publications

Editor's Choice

Community Highlights

Selection must be editorial.

Never paid placement.

Showcase Moderation Layer

Future-proof architecture should support:

Content Review

Reporting

Removal Requests

Visibility Suspension
Founder Rule

The Showcase exists to celebrate legacies.

Not sell visibility.

SECTION 15 — PUBLICATION ANALYTICS ARCHITECTURE
Purpose

Collect and present meaningful publication engagement data.

Analytics Philosophy

Measure:

Reach

Engagement

Legacy Impact

Avoid vanity metrics.

Analytics Domains
Reach Analytics

Examples:

Readers Reached

Countries Reached

Regions Reached

Contributor Reach
Engagement Analytics

Examples:

Publication Opens

Repeat Visits

QR Scans

Publication Shares
Community Analytics

Examples:

Contributor Return Rate

Family Participation

Recognition Participation
Analytics Components
PublicationAnalyticsService

Responsible for:

Event Collection

Aggregation

Reporting

Privacy Controls
PublicationMetricsAggregator

Responsible for:

Metric Calculation

Snapshot Generation

Trend Calculation
Analytics Storage

Store:

Aggregated Metrics

Prefer:

Meaningful Insights

over:

Raw Tracking Data

where possible.

Analytics Snapshot

Example:

12 Countries Reached

428 Readers

91 Contributors Reached

76% Return Visits
Privacy Principle

Analytics must remain privacy-aware.

Publication insight should never become behavioural surveillance.

Founder Rule

Analytics should measure legacy impact.

Not website popularity.

SECTION 16 — BUILD ORDER & IMPLEMENTATION ROADMAP
Purpose

Define implementation sequence.

Teams should not build components in arbitrary order.

Phase 1 — Foundation

Build:

Publication Models

Publication State

Publication Blueprint

Publication Blueprint Builder

Publication Versioning

Deliverable:

Publication Blueprint Generation
Phase 2 — Publication Renderer

Build:

Publication Renderer

Publication Navigator

Legacy Snapshot

Publication Reading Experience

Deliverable:

Functional Publication Experience
Phase 3 — Theme Engine

Build:

PublicationThemeEngine

Theme Tokens

Theme Resolver

Brand Resolver

Deliverable:

Theme-Aware Publications
Phase 4 — Editorial Intelligence

Build:

EditorialArrangementEngine

FeaturedContentManager

Deliverable:

Editorially Curated Publications
Phase 5 — Health & Optimization

Build:

PublicationHealthEngine

PublicationOptimizer

Deliverable:

Publication Quality Guidance
Phase 6 — Publication Editor

Build:

PublicationEditor

Draft Manager

Version Manager

Deliverable:

Publication Review Studio
Phase 7 — Delivery Layer

Build:

Access Control

Notifications

Distribution Services

Deliverable:

Publication Release System
Phase 8 — Export Framework

Build:

Export Jobs

PDF Renderer

Archive Renderer

Deliverable:

Publication Outputs
Phase 9 — Legacy Showcase

Build:

Showcase Catalog

Showcase Cards

Featured Publications

Deliverable:

Public Discovery Layer
Phase 10 — Analytics

Build:

PublicationAnalytics

Metrics Aggregator

Analytics Dashboard

Deliverable:

Publication Insight Layer
Founder Rule

Build publication experience first.

Exports later.

SECTION 17 — COMPONENT MAP ADDITIONS

The following components should be added to COMPONENT_MAP.

PublicationBlueprint

PublicationBlueprintBuilder

PublicationThemeEngine

EditorialArrangementEngine

FeaturedContentManager

PublicationHealthEngine

PublicationOptimizer

PublicationRenderer

PublicationNavigator

LegacySnapshot

PublicationVersionManager

PublicationDraftManager

PublicationEditor

PublicationExportCenter

PublicationAnalytics

PublicationMetricsAggregator

PublicationAccessService

PublicationNotificationService

LegacyShowcase

ShowcaseCatalog

ShowcasePublicationCard
SECTION 18 — ANTI-DRIFT CONTROLS
Purpose

Protect the Legacy Publication System from implementation drift.

Architectural Drift Warnings

The following indicate architectural drift:

Renderer Selecting Content

Bad:

Renderer chooses featured stories.

Correct:

FeaturedContentManager chooses.
Renderer displays.
Renderer Calculating Health

Bad:

Renderer evaluates publication quality.

Correct:

Health Engine evaluates.
Renderer displays.
Export Logic Rebuilding Publications

Bad:

PDF builds publication separately.

Correct:

PDF consumes Publication Blueprint.
Product Drift Warnings

The following indicate product drift:

PDF Becomes Primary

Incorrect.

Publication experience remains primary.

Publication Intelligence Removed

Incorrect.

Editorial intelligence is a core differentiator.

Publication Health Reduced To Scores

Incorrect.

Health remains human-centred.

Publication Becomes Static Export

Incorrect.

Publication remains an experience.

UX Drift Warnings

The following indicate user experience drift:

Excessive Settings

Prefer:

Smarter Systems

over:

More Configuration
Excessive Design Controls

Publication Editor is:

Review Studio

not:

Desktop Publishing Software
Manual Assembly Dependence

The system should create publication-ready experiences before editing begins.

Drift Review Requirement

Any major architectural change should be evaluated against:

LC03

LC03A

Founder Principles

before approval.

SECTION 19 — ENGINEERING FOUNDER RULES
Purpose

Provide engineering guidance when implementation decisions become ambiguous.

Publication Experience First

Always optimise for the publication experience.

Never optimise solely for export generation.

Editorial Before Technical

If a technically simpler solution reduces publication quality, reconsider the solution.

One Publication Many Outputs

Build once.

Render many times.

Intelligence Before Rendering

Content decisions belong to intelligence systems.

Rendering systems display decisions.

Human Authority Over Automation

Automation recommends.

Humans approve.

Content Before Controls

Publication content should dominate the experience.

Controls should remain secondary.

Simplicity At Scale

As complexity increases internally, the user experience should remain simple.

Ecosystem Alignment

The Publication System should strengthen other LegacyCapsule systems.

Never compete with them.

White Label Without Forking

Brand customisation should occur through identity layers and theme tokens.

Never through separate publication architectures.

Founder Standard

The final publication should consistently create the reaction:

I cannot believe this was produced by the platform.

If a design or implementation decision moves away from that standard, it should be reconsidered.


SECTION 20 — ACCESS CONTROL
Purpose
Access Control governs publication visibility and access rights.
Inheritance Principle
Publication visibility should inherit from capsule visibility.
Default behaviour:
Capsule
      ↓
Publication
Override Principle
Organisers may explicitly override publication visibility when permitted.
Examples:
Private Capsule
Public Publication
or
Public Capsule
Restricted Publication
Access Methods
Open Access
Anyone with access may view.
Access Code Access
Uses Access Code Engine integration.
Invitation Access
Invitation-based access.
Contributor Access
Restricted to contributors.
Organiser Access
Restricted to organisers.
Audit Events
Examples:
Publication Generated

Publication Released

Publication Shared

Publication Exported

Publication Accessed
Privacy Principle
The publication should expose only information appropriate to its visibility level.
Public access must never imply unrestricted access to all underlying event data.
Founder Rule
Publication access should remain simple for readers while remaining controllable for organisers.

SECTION 21 — PUBLICATION ANALYTICS
Purpose
Publication Analytics provides organisers with meaningful insight into publication reach, engagement and legacy impact.
The objective is not traffic monitoring.
The objective is understanding how the publication is being experienced and preserved.
Analytics Philosophy
The Legacy Publication System prioritises meaningful impact metrics over vanity metrics.
The system should answer:
Who was reached?

How was the publication experienced?

How far did the publication travel?

What engagement occurred?
Publication Reach Metrics
Examples:
·	Publication recipients
·	Unique readers
·	Countries reached
·	Regions reached
·	Communities reached
·	Access code usage
Publication Engagement Metrics
Examples:
·	Publication opens
·	Repeat visits
·	Reading sessions
·	Section engagement
·	QR code scans
·	Publication shares
Community Impact Metrics
Examples:
·	Contributors reached
·	Contributor return rate
·	Family engagement
·	Community participation rate
·	Recognition participation
Publication Snapshot Analytics
Provide organisers with a concise summary.
Example:
Publication Reach

12 Countries
428 Readers
92 Contributors Reached
84% Contributor Return Rate
Privacy Principle
Analytics should respect privacy settings and applicable regulations.
Personal behaviour tracking should be minimised.
The objective is publication insight.
Not surveillance.
Founder Rule
Analytics should measure legacy impact.
Not website popularity.

SECTION 22 — PLATFORM ALIGNMENT
Purpose
LC03 describes LegacyCapsule's publication experience as a product.
Publication infrastructure is provided by the RevoWorld Platform.

Platform Services Consumed
RW03  Publication Platform
      Rendering Engine
      Theme Engine
      Editorial Arrangement Engine
      Featured Content Manager
      Publication Health Engine
      Publication Optimizer
      Publication Editor
      Export Framework
      Distribution Engine
      Publication Analytics

RW01  Payment Services Platform
      Checkout for publication distribution
      Transaction recording

RW04  Recognition Platform
      Recognition content consumed into publication sections
      Recognition milestone data

LegacyCapsule Ownership Within Publication
LC03 retains ownership of:

    Legacy Publication Experience
    The emotional and editorial journey specific to LegacyCapsule.

    Publication DNA
    The unique character attributes defining a Legacy publication —
    what deserves to be recorded and why.

    Legacy Snapshot
    Single-page condensed event record.

    Legacy Footprint
    Geographic and demographic reach narrative.

    Community Impact narrative
    Story of community participation within the publication.

    Legacy Editorial Philosophy
    Principles guiding what LC organisers include and why.

These are LegacyCapsule experiences. They are not platform capabilities.
No other product would replicate them.

Architectural Role
The Legacy Publication System is responsible for:
·	Presenting LegacyCapsule content through the publication experience
·	Curating content using editorial principles defined in this document
·	Expressing Legacy identity and meaning within publication outputs
·	Orchestrating platform publication services for LegacyCapsule contexts

It is not responsible for:
·	Originating content (owned by source engines)
·	Rendering (owned by RW03)
·	Theme design (owned by RW03)
·	Distribution mechanics (owned by RW03)

Content Ownership Principle
The Legacy Publication System does not own content.
Content ownership remains with source systems.

    Profile Engine          → Biography, Timeline, Milestones, Profile data
    Tribute Engine          → Tribute submissions, media, approvals
    Community Story Engine  → Stories, Memories, Topics, Contributions
    Event Engine            → Event phases, programme, coverage
    RW04 Recognition        → Recognition data, achievements, community records

Publication Responsibility
The Legacy Publication System:
Consumes
Curates
Presents
It does not replace source systems.

Founder Rule
The Legacy Publication System should amplify ecosystem value
rather than duplicate ecosystem responsibilities.
Publication infrastructure is platform-owned.
Publication experience is product-owned.

Cross-References
RW00  Platform Architecture Index     (ecosystem overview)
RW01  Payment Services Platform       (checkout and transactions)
RW03  Publication Platform            (all publication infrastructure)
RW04  Recognition Platform            (recognition content)
LC04  Payment Engine                  (LC payment consumption layer)
LC06  Legacy Recognition Engine       (LC recognition consumption layer)

SECTION 23 — DATA OWNERSHIP
Purpose
Define ownership and responsibility for publication-related information.
Publication Ownership
The publication belongs to the capsule owner or authorised organisation responsible for the capsule.
Contributor Rights
Contributors retain ownership of their submitted content subject to platform terms and permissions granted during contribution.
Publication Rights
Publication generation does not transfer ownership of underlying content to LegacyCapsule.
LegacyCapsule provides:
Hosting

Presentation

Preservation

Distribution
within platform rules.
Publication Visibility Rights
Visibility remains controlled by authorised publication administrators.
Examples:
·	Capsule Owner
·	Family Representative
·	Institution Administrator
·	Event Organiser
depending on configuration.
Showcase Rights
Publication owners control Showcase participation.
Participation must be opt-in.
Export Rights
Authorised publication administrators may export publication outputs made available by the platform.
Founder Rule
Ownership should remain clear, transparent and easy to understand.

SECTION 24 — FUTURE EXPANSION LAYER
Purpose
Provide architectural space for future publication capabilities.
The Future Expansion Layer documents anticipated growth areas without creating MVP obligations.
Future Publication Experiences
Potential future experiences include:
Anniversary Editions
Example:
1 Year Reflection Edition

5 Year Reflection Edition

10 Year Reflection Edition
Where content availability and retention policies permit.
Family Archive Editions
Extended preservation experiences for families.
Institutional Yearbooks
School, church and association publication experiences.
Recognition Collections
Multi-recipient recognition publications.
Legacy Collections
Grouped publications connected by theme, organisation or family.
Future Publication Intelligence
Potential future capabilities include:
AI Assisted Curation
Suggestions for:
·	Featured stories
·	Featured tributes
·	Editorial summaries
·	Publication improvements
Multi-Language Publications
Support for multiple reading languages from a single publication source.
Adaptive Publication Themes
Themes that respond to publication type and content characteristics.
Future Output Formats
Potential outputs include:
·	Hardcover Print Editions
·	Commercial Print Packages
·	Gift Editions
·	Commemorative Book Collections
Future Ecosystem Opportunities
Publication infrastructure is now platform-owned via RW03.
Future products requiring publication capability will consume
RW03 directly. LegacyCapsule will continue to evolve its
publication experience through LC03 while the platform evolves
through RW03.

Potential future alignment:
·	Educational products consuming RW03
·	Institutional products consuming RW03
·	RevoWorld Publishing initiatives
·	Community heritage projects
·	Anniversary publication editions (LC product feature)
·	Legacy Collections (LC product feature)

Founder Rule
Future possibilities should influence architecture.
They should not create present-day complexity.

SECTION 25 — FOUNDER PRINCIPLES
Purpose
These principles guide future decisions affecting the Legacy Publication System.
When uncertainty exists, these principles take precedence.
Publication Experience First
The publication experience is the primary product.
Everything else is secondary.
Editorial Authority Over Automation
Automation supports quality.
Automation should never become visible.
Publish Ready By Default
Every publication should look good before editing begins.
Curation Over Configuration
Prefer smarter systems over more settings.
Content First
Content takes priority over controls.
Invisible Navigation
Navigation should always be available.
Navigation should rarely be visible.
Publication Confidence
Organisers should feel confident publishing at any stage.
Legacy Before Technology
Readers should remember:
·	Stories
·	People
·	Tributes
·	Memories
·	Legacy
Not software features.
Ecosystem Alignment
The Legacy Publication System should strengthen the broader LegacyCapsule ecosystem.
Simplicity At Scale
As the platform grows, complexity should remain hidden from users.
Founder Standard
A publication should cause organisers to feel:
I cannot believe the system produced this.
That standard should guide future enhancements.
