LC06_LEGACY_RECOGNITION_ENGINE.md
LegacyCapsule Legacy Recognition Engine
VALNEX, UNIPESSOAL LDA · RevoWorldTech

DOCUMENT INFORMATION
Document ID:    LC06
Owner:          LegacyCapsule Product Architecture
Status:         Authoritative Product Specification
Governance:     CG05 — RevoWorld Platform Realignment Directive

PLATFORM ALIGNMENT
Recognition infrastructure is owned by RW04 Recognition Platform.
LC06 describes how LegacyCapsule expresses recognition within
its product experience — not how recognition is awarded or stored.

Platform Dependencies:
    RW04  Recognition Platform  (all recognition infrastructure)

═══════════════════════════════════════════════════════════════
SECTION 1 — PURPOSE
═══════════════════════════════════════════════════════════════

The LegacyCapsule Legacy Recognition Engine defines how
LegacyCapsule expresses recognition to contributors, organisers,
planners, resellers and communities.

Recognition infrastructure — the rules, badges, scores, records
and milestones — is owned by RW04 Recognition Platform.

LC06 defines the LegacyCapsule-specific recognition experience:
how recognition is surfaced, communicated and celebrated within
the product in ways that are meaningful to the LegacyCapsule
context of remembrance, legacy preservation and community.

═══════════════════════════════════════════════════════════════
SECTION 2 — FOUNDER PRINCIPLE
═══════════════════════════════════════════════════════════════

People are more likely to contribute when their contribution
is appreciated.

Recognition should encourage participation, not competition.

Success is not the number of badges awarded.
Success is increased participation, stronger communities and
greater preservation of memories and legacies.

═══════════════════════════════════════════════════════════════
SECTION 3 — DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════

1.  Recognition must feel earned, not automatic.
2.  Community impact matters more than volume of activity.
3.  Legacy preservation should be valued and celebrated.
4.  Recognition should inspire further contribution.
5.  Recognition must remain respectful of its context —
    especially in memorial and bereavement settings.
6.  LegacyCapsule determines how recognition is expressed.
    RW04 determines whether recognition is awarded.

═══════════════════════════════════════════════════════════════
SECTION 4 — OWNERSHIP BOUNDARY
═══════════════════════════════════════════════════════════════

LegacyCapsule owns:

    · Recognition expression design (how it looks and feels)
    · Recognition communication (what is said and when)
    · Context-sensitive recognition rules (memorial vs celebration)
    · Product-specific recognition surfaces (tribute wall, portal)
    · Activity event publishing to RW04

LegacyCapsule does NOT own:

    · Recognition eligibility rules (owned by RW04)
    · Badge definitions (owned by RW04)
    · Legacy Score calculation (owned by RW04)
    · Achievement records (owned by RW04)
    · Hall of Legends infrastructure (owned by RW04)
    · Cross-product recognition (owned by RW04)

LegacyCapsule publishes activity events.
RW04 evaluates, awards and records recognition.
LegacyCapsule receives recognition.awarded events and
expresses them within its product experience.

═══════════════════════════════════════════════════════════════
SECTION 5 — LEGACYCAPSULE RECOGNITION EXPERIENCE
═══════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────────
Contributor Recognition Expression
──────────────────────────────────────────────────────────────

When RW04 awards recognition to a contributor:

First Tribute:
    · Keepsake Card email sent (already implemented)
    · Recognition acknowledged in confirmation screen

Subsequent Milestones:
    · Milestone email sent when thresholds reached
    · Badge surfaced in contributor's profile (future)

Context Sensitivity:
    Memorial and bereavement capsules require restrained
    recognition tone. Celebration capsules may use warmer
    recognition language.

LC06 defines tone per capsule event_type. RW04 awards
recognition without awareness of tone — LC06 applies it.

──────────────────────────────────────────────────────────────
Organiser Recognition Expression
──────────────────────────────────────────────────────────────

Recognised for:
    · Capsule completion quality
    · Participant engagement
    · Publication completion
    · Community participation

Expression:
    · Recognition summary in manage dashboard
    · Milestone notifications
    · Badge display (future)

──────────────────────────────────────────────────────────────
Planner Recognition Expression
──────────────────────────────────────────────────────────────

Status: Future

Recognised for:
    · Events successfully facilitated
    · Organiser satisfaction
    · Community impact
    · Legacy preservation quality

Expression:
    · Planner certification (via RW04)
    · Planner directory listing
    · Planner profile badges

──────────────────────────────────────────────────────────────
Reseller Recognition Expression
──────────────────────────────────────────────────────────────

Status: Future

Recognised for:
    · Sales performance
    · Customer satisfaction
    · Event success outcomes
    · Community impact

Expression:
    · Partner tier status
    · Regional recognition
    · Awards programme participation

──────────────────────────────────────────────────────────────
Community Recognition Expression
──────────────────────────────────────────────────────────────

Status: Future

Eligible Communities:
    · Churches
    · Schools
    · Associations
    · Alumni bodies
    · Professional groups

Expression:
    · Community impact badge
    · Community profile recognition
    · Hall of Legends nomination

═══════════════════════════════════════════════════════════════
SECTION 6 — ACTIVITY EVENTS PUBLISHED TO RW04
═══════════════════════════════════════════════════════════════

LegacyCapsule publishes verified activity events to RW04.
RW04 evaluates these against recognition rules.

Events Published:
    · tribute.submitted        (contributor activity)
    · tribute.approved         (verified contribution)
    · story.submitted          (community story activity)
    · story.approved           (verified story contribution)
    · photo.submitted          (media contribution)
    · publication.distributed  (organiser milestone)
    · capsule.completed        (organiser milestone)
    · anniversary.contributed  (long-term engagement)

Events are published after verification.
Unverified activity is never submitted to RW04.

═══════════════════════════════════════════════════════════════
SECTION 7 — RECOGNITION RECEIVED FROM RW04
═══════════════════════════════════════════════════════════════

LegacyCapsule receives and acts on:

    recognition.awarded       → Display to recipient
    recognition.milestone     → Trigger milestone communication
    recognition.score.updated → Update Legacy Score display

LC06 defines the product expression for each event type.
The same recognition event may be expressed differently
across capsule types (memorial vs celebration).

═══════════════════════════════════════════════════════════════
SECTION 8 — RECOGNITION LIFECYCLE (LEGACYCAPSULE VIEW)
═══════════════════════════════════════════════════════════════

Verified LC activity occurs
            ↓
LC publishes activity event to RW04
            ↓
RW04 Recognition Rules Engine evaluates
            ↓
RW04 awards recognition (if eligible)
            ↓
recognition.awarded event received by LC
            ↓
LC06 determines appropriate expression
            ↓
Recognition communicated to recipient
            ↓
Recognition displayed in relevant LC surfaces

═══════════════════════════════════════════════════════════════
SECTION 9 — CONTEXT SENSITIVITY
═══════════════════════════════════════════════════════════════

LegacyCapsule serves deeply emotional event types.
Recognition expression must respect this.

Memorial & Funeral:
    · Quiet acknowledgement preferred over celebration
    · Language: "Your tribute has been preserved"
    · Avoid celebratory emoji or tone

Wedding & Celebration:
    · Warm, celebratory expression appropriate
    · Language: "You are part of this celebration"

Chieftaincy & Cultural Events:
    · Respectful, formal tone
    · Cultural sensitivity in language

Retirement:
    · Warm, appreciative tone
    · Acknowledgement of relationship and service

LC06 maps recognition expressions to event types.
RW04 awards recognition without event-type awareness.
LC06 applies the appropriate expression after receipt.

═══════════════════════════════════════════════════════════════
SECTION 10 — RELATIONSHIPS
═══════════════════════════════════════════════════════════════

Consumes:
    RW04  Recognition Platform    (all recognition infrastructure)

Depends On:
    Capsule Engine                (event type for context sensitivity)
    Contribution Engine           (verified activity events)
    LC05 Legacy Continuity        (anniversary and milestone activity)

Supports:
    Contributor experience        (appreciation and acknowledgement)
    Organiser experience          (milestone recognition)
    Community growth              (participation encouragement)

Cross-References:
    RW00  Platform Architecture Index
    RW04  Recognition Platform
    LC01  System Map
    LC05  Legacy Continuity & Engagement Engine

═══════════════════════════════════════════════════════════════
SECTION 11 — FUTURE REVENUE OPPORTUNITIES
═══════════════════════════════════════════════════════════════

    · Professional Planner Certifications
    · Planner Directory Programme
    · Recognition Packages
    · Community Programme Subscriptions
    · Institutional Recognition Programmes
    · Partner Awards Programmes

═══════════════════════════════════════════════════════════════
SECTION 12 — LONG-TERM VISION
═══════════════════════════════════════════════════════════════

LegacyCapsule should become a platform where meaningful
contributions are acknowledged and remembered.

Recognition should celebrate the people who help preserve
stories, honour lives and strengthen communities.

The Legacy Recognition Engine ensures that no meaningful
contribution goes unacknowledged — and that acknowledgement
is always expressed with the sensitivity and warmth that
the LegacyCapsule context deserves.
