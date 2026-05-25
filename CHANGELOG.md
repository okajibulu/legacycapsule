# LegacyCapsule — Changelog
## VALNEX, UNIPESSOAL LDA · RevoWorldTech
**Platform:** itslegacycapsule.com
**Versioning:** Semantic (Major.Minor.Patch)

---

## v1.0.0 — Phase 1 MVP Launch
**Released:** May 2026
**Status:** Live

### Platform Foundation
- Next.js 14 · TypeScript · Tailwind CSS v4 · Supabase · Resend · Vercel

### Features Launched

#### Public Experience
- Homepage — animated world map hero, "Events end. Legacies don't." headline, audience routing cards, How It Works section, stats strip (qualitative)
- `/how-it-works` — full sequential 6-step story, add-ons catalogue, Ways to Honour highlight
- `/pricing` — NGN-only pricing read from `lc_pricing` table, free tier gold glow, add-ons with Coming Soon badges
- `/help` — 8-section knowledgebase with live search, accordion articles, gifting section
- `/examples` — holding page (real capsules coming)
- `/for-you`, `/for-planners`, `/gift`, `/resellers` — audience holding pages

#### Tribute Wall (`/for/[slug]`)
- Theme-aware design system (5 themes: Classic, Memorial, Celebration, Royal, Spiritual)
- Honouree hero panel — photo upload, position picker (Fit Width/Height/Custom), panel height (Compact/Standard/Cinematic), Full Bleed toggle
- Hero text anchored to bottom of panel — never blocks face
- Collapsible tribute composer
- Photo tributes — client-side compression, Supabase storage upload
- Audio tributes — MediaRecorder API, 2-minute max, waveform animation
- Video tributes — file upload, thumbnail generation, 50MB max
- Country selector (searchable)
- IP geolocation — `ip_country` stored per contribution
- World map (Leaflet, gold pins) — expands to modal
- Tribute cards — text, photo, audio player, video player
- Organiser admin controls: approve/decline inline
- Event-specific empty states (memorial, retirement, wedding, birthday, graduation, ordination, chieftaincy, anniversary)
- Admin top bar (organiser only): ⚙ Manage + Profile quick links
- `lc_last_capsule` localStorage — powers nav back link

#### Honouree Profile (`/for/[slug]/profile`)
- Theme-aware full canvas
- Sections: Introduction, Occasion, Quote, Organiser Message, Biography, Timeline, Achievements, Family, Legacy, Custom
- Photo gallery — up to 3 sections, 10 photos each, photo + description layout
- Ways to Honour — bank account display, masked account numbers, acknowledgement flow
- Featured photos section

#### Booking Flow (`/book`)
- Screen 1: Visitor path (Personal / Professional / Gift)
- Screen 2: 12 event type cards
- Screen 3: 3 tiers (Free with gold glow, Honour, Premier) — prices from `lc_pricing`
- Screen 4: Capsule details, slug auto-generation
- Screen 5: Confirmation with link + WhatsApp share
- Free path: instant activation, 90-day timer from first tribute
- Paid path: pending_payment state, invoice request

#### Authentication (`/signin`)
- 4-character OTP sign-in — no magic links, no device switching
- Same browser window flow — code entered where it was requested
- Real Supabase Auth session established on verification — persists across page navigations
- Session check order: URL param → Supabase Auth → localStorage fallback
- Silent account creation on first verification
- 30-second resend cooldown

#### Dashboard (`/dashboard`)
- Multi-capsule selector for organisers with multiple capsules
- Links to individual manage pages

#### Manage Dashboard (`/manage/[slug]`)
- Session-aware gate: "Welcome back — Sign In →" instead of dead-end error message
- Four tabs: Overview · Tributes · Profile · Settings
- Tab buttons: visible active state (gold glow), gold underline indicator
- Overview: live link, copy + WhatsApp share, world map, tribute count (hidden until first tribute)
- Tributes: pending queue with Publish/Decline, published list
- Profile: photo upload, gallery editor, section editor
- Settings: display name, event tag, title, date, URL slug, theme picker, family rep fields, upgrade contact form
- Free tier bar: tribute progress, expiry countdown starts from first tribute (not creation date)

#### LCAdmin (`/admin`)
- Password-protected with HMAC session cookies
- Dashboard: live platform stats
- Capsules: all capsules, state badges, detail view, activate/suspend/extend
- Clients: organisers grouped by email with capsule list
- Moderation: platform-wide tribute review queue
- Pricing: EUR + NGN editable, safe ranges, reason required, audit logged
- Feature Flags: toggle switches, emergency flag warnings, all changes logged

#### Navigation
- Session-aware: Guest (Sign In + Start Your Capsule) vs Signed In (My Capsules + Sign Out)
- Hidden on app pages: /for/ · /manage/ · /signin · /dashboard · /auth/
- Contextual back link: "← [Name]'s Wall" when navigated from a tribute wall
- Mobile: hamburger menu, full-screen slide-in, 20px Playfair links
- Desktop: transparent → solid on scroll

#### Email System (via Resend)
- Booking verification — 4-char code, branded template
- Sign-in code — 4-char code, branded template
- Tribute approved — contributor notification (basic)
- Submission confirmation — placeholder (not yet wired)

#### Database
Core tables: `capsules` · `contributions` · `capsule_profile_sections` · `capsule_gallery` · `capsule_support_accounts` · `support_acknowledgements` · `capsule_access` · `honouree_portal_tokens` · `lc_pricing` · `lc_feature_flags` · `lc_content` · `email_verifications` · `admin_audit_log` · `profiles`

Gallery additions: `description` · `section_index` · `sort_order` columns
Hero additions: `hero_image_position` · `hero_image_zoom` · `hero_image_fit` · `hero_panel_size` · `hero_full_bleed` columns

### Known Gaps at Launch
- Paystack integration — account pending activation
- Stripe — pending Valnex Portugal bank account
- Family rep portal — `honouree_portal_tokens` table exists, portal UI not built
- Ownership transfer — designed, not yet built
- Gift a Capsule full flow — Phase 2
- Submission confirmation email — placeholder
- Examples page — holding (needs real demo capsules)
- About page — placeholder narrative
- Legal pages — pending legal review under Valnex LDA / EU GDPR
- Publication engine — Phase 4

---

## Upcoming — v1.1.0
**Target:** June 2026
**Planned:**
- Ownership transfer flow (Settings tab)
- Paystack Nigeria integration
- Invoice request path for international payments
- Family rep invitation email + portal access
- Submission confirmation email (wired)
- Tribute Keepsake Card email (premium design)
- Event-specific email templates
- Analytics (Vercel + Plausible)

---

## Upcoming — v1.2.0
**Target:** July 2026
**Planned:**
- Guest Management & RSVP (Phase 2 Coordinate)
- Fabric & Attire coordination module
- Gift a Capsule — Mode A & Mode B (ceremonial commissioning)
- Group gift — Mode C
- Access codes / QR check-in

---

## Versioning Rules

| Increment | When |
|---|---|
| **Patch** x.x.**N** | Bug fix, copy change, UI tweak, performance improvement |
| **Minor** x.**N**.0 | New page, new feature, new user flow, new email template |
| **Major** **N**.0.0 | New pillar launch, architectural overhaul, Phase transition |

**Every deployment to production increments at minimum a patch version.**
**Every version entry must include: what changed, why, any DB migrations run.**

---

*Maintained by: AI5 / RevoWorldTech development team*
*Format: Keep What Changed · Why · DB changes · Known issues*
