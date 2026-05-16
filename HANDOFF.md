# HANDOFF.md
## LegacyCapsule — Complete Session Handoff
**16 May 2026 — supersedes all previous handoff documents**
**VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule**

---

## 1. HOW TO START A NEW SESSION

Give any new AI planning session these three files in this order:
1. `CURRENT_STATE.md` — what has been built, current routes, all decisions
2. `PROJECT_RULES.md` — what never to do, scope boundaries, working method
3. This file `HANDOFF.md` — full context, deviations, what is next

Then tell the AI exactly which scope it owns.

---

## 2. WHAT WAS BUILT — COMPLETE RECORD

### Phase 1 — Core Platform (~92% complete)

**Homepage:**
- Full premium animated world map hero
- "Events end. Legacies don't." headline — "Events end." muted white, "Legacies" gold `#D4AE2A`, "don't." white
- 16 rotating capability lines at 4200ms interval
- Trust line: "NO TECHNICAL EXPERIENCE REQUIRED · YOUR TRIBUTE WALL LIVE IN MINUTES FOR FREE"
- All 8 homepage sections built

**Booking Flow (`app/book/page.tsx`):**
- Screen 1: Visitor type — Personal / Professional / Gift
- Screen 2: Event type — 12 cards
- Screen 3: Three packages — Go Live Free / Legacy Honour / Legacy Premier. Prices from Supabase. Features from lc_content.
- Screen 4: Capsule details — subject name (dynamic per event type), event tag, email, slug. No event date (removed — D14).
- Screen 5: Confirmation — capsule link, check email note
- Free path: `page_state: active`, `free_tier_expires_at: NOW() + 90 days`
- Paid path: `page_state: pending_payment` → Stripe checkout (in build)

**Organiser Manage Page (`app/manage/[slug]/page.tsx`):**
- Access via email URL param: `/manage/[slug]?email=[encoded_organiser_email]`
- Stats strip: total / pending / approved tribute counts
- Moderation queue: All / Pending / Approved tabs, approve/decline with instant state update
- Share: copy link + WhatsApp with pre-filled warm message
- No publication card yet (Phase 4 activation item)

**LCAdmin — Complete (`app/admin/*`):**
- Login with server-side session (LCADMIN_PASSWORD + LCADMIN_SESSION_SECRET)
- Dashboard with capsule stats
- Capsule list and individual capsule view with admin actions
- Client accounts management
- Transaction records
- Platform moderation queue
- Reseller management
- Content editor (lc_content table)
- Pricing editor (lc_pricing table)
- Pricing zones editor (lc_pricing_zones table)
- Feature flags editor

**Publication Engine — Complete (`lib/publication/*`, `app/api/publication/*`, `components/publication/*`):**
- Database schema additions applied
- Auto-arrangement algorithm
- Layout helpers
- API routes: init, save, generate
- Hidden render route with all 5 themes
- Full editor shell and all components
- GenerateButton with progress states
- Entry page at `app/manage/[slug]/publication/page.tsx`
- All 17 files building clean

**Email:**
- Resend domain `itslegacycapsule.com` verified
- FROM: `noreply@itslegacycapsule.com`
- Organiser welcome + verification email working
- Approval notification exists (plain — needs Keepsake Card upgrade)
- Submission confirmation — API route exists as placeholder, not yet wired

**Stripe Integration (in progress):**
- `lib/payments/regionDetector.ts` — built
- `lib/payments/priceFetcher.ts` — built
- `lib/payments/StripeAdapter.ts` — built
- `lib/payments/PaymentService.ts` — built
- `app/api/checkout/route.ts` — built
- `app/api/webhooks/stripe/route.ts` — built
- `app/book/page.tsx` — paid path being wired to checkout
- Manage page payment success banner — being wired
- Correcting old route references (pre-D44 paths) in progress

---

## 3. FIVE THEME DEFINITIONS — PUBLICATION ENGINE

The render route implements all five. These are the locked definitions:

| Theme | Events | Background | Gold | Typography |
|---|---|---|---|---|
| **classic** | Retirement, Ordination, Award, Memorial | Deep purple `#2D1B69` | Antique gold `#B8960C` | Playfair Display heavy, formal |
| **soft** | Birthday, Anniversary | Blush `#F2E8E4` | Dusty rose `#C4918A` | Cormorant Garamond light italic |
| **romantic** | Wedding | Ivory `#FAF7F2` | Champagne `#C9A96E` | Cormorant Garamond, ornamental dividers |
| **vibrant** | Graduation, Chieftaincy, Conference | Rich navy `#0D1B3E` | Bright gold `#D4AE2A` | DM Sans bold headers |
| **spiritual** | Thanksgiving, Ordination (alt) | Forest `#1B3A2D` | Warm gold `#C8A96E` | Cormorant Garamond, reverent spacing |

---

## 4. TRIBUTE WALL DESIGN — LOCKED SPEC

The Tribute Wall AI is implementing this. Do not reopen these decisions.

**Zone 1 — Hero (scrolls away):**
Deep purple `#2D1B69`. LogoCapsule size="sm". Event type emoji. Subject name links to `/for/[slug]/profile`. Event tag in antique gold. Gold threshold rule. No photo in hero.

**Zone 2 — Sticky bar (freezes):**
`position: sticky; top: 0; z-index: 50`. Height 180px desktop / 140px mobile.
Left 60%: TributeMap (Leaflet, dark tiles, gold pins, polling every 60s — not Realtime).
Right 40%: Event type · Subject name · Event tag · Tribute count · Copy link · WhatsApp share.

**Zone 3 — Tribute section:**
Header: `──── ✦ TRIBUTE WALL ✦ ────` then `[N] tributes`.
Subject photo ambient backdrop — `hero_image_url`, opacity 0.07, `background-attachment: fixed` desktop.
Tribute cards: ivory `#F5F3EE`, box shadow, gold top rule. Initials avatar or photo. Name · City ✦ Country · Relationship (italic) · Date · Text with expand toggle.
Zero admin controls on public wall.
Profile link card at bottom.

**Zone 4 — Sticky CTA:**
Gold background, deep purple text. `position: sticky; bottom: 0`. Links to `/for/[slug]/submit`.

**Zone 5 — Footer:**
Deep purple. VALNEX attribution. "Planning your own event? Start here →" → `/book`.

**Submission form `/for/[slug]/submit`:**
Fields: Name* · City* · Country* (dropdown) · Tribute message* (20–1000 chars, live counter) · Relationship · Email · Photo
Below email: "Leave your email to receive a keepsake of your tribute when it's approved"
Preview step = final submit step (ivory card preview IS the confirmation — D-new from Tribute AI).
Post-submission: confirmation screen with WhatsApp share + copy link.

---

## 5. SHARING SYSTEM — PLANNED

Phase 1 (building with tribute wall):
- WhatsApp pre-filled message (sticky bar)
- Copy link (sticky bar)
- QR code PNG (manage page)
- QR code print A4 PDF (manage page)
- Social share card auto-generated
- Contributor forward prompt on confirmation screen

Phase 2: Email invite with CSV · SMS via SMSProvince
Phase 3: Planner portfolio share

---

## 6. SUBJECT PROFILE PAGE — PLANNED

Route: `/for/[slug]/profile`

Phase 1 — basic:
- About [Name] section
- Featured Photos album (from `capsule_featured_photos`)
- Gallery (from `capsule_gallery`)
- Link back to tribute wall

Phase 1.5 additions:
- Ways to Honour section (from `capsule_support_accounts`)
- Subject portal (`/for/[slug]/honouree?token=[token]`)

Default sections (organiser activates): About · Career & Legacy · Years of Service · Featured Photos · Gallery · The Journey · In Their Own Words · Family & Roots · Faith & Values · Custom sections

---

## 7. REGIONAL PRICING — lc_pricing_zones

8 zones seeded. Single currency per user, detected by IP at page load.

| Zone | Currency | Symbol | Key countries |
|---|---|---|---|
| EU | EUR | € | PT DE FR ES IT NL BE AT IE + more |
| UK | GBP | £ | GB |
| US | USD | $ | US |
| CA | CAD | CA$ | CA |
| NG | NGN | ₦ | NG (independent pricing) |
| GH | USD | $ | GH SL LR SN CI + more (0.60 multiplier) |
| KE | KES | KES | KE UG TZ RW |
| ROW | EUR | € | All others |

`useRegionalPrice` hook — not yet built. Needed before Stripe goes live publicly.

---

## 8. PAYMENT ARCHITECTURE

PaymentService is the single entry point — booking flow never calls a processor directly.

| Region | Processor | Phase |
|---|---|---|
| EU / UK / US / ROW | Stripe | 1.5 |
| Nigeria / Ghana / Kenya | Paystack | 2 |
| Cross-border Africa | Flutterwave | 2 |

All revenue settles to Valnex LDA Portuguese bank account.

Stripe account: RevoWorldTech (test mode). Migrate to Valnex when bank account ready — one env var swap, no code change (D37).

---

## 9. PUBLICATION ENGINE — ACTIVATION CHECKLIST

The engine is fully built. These items remain before Phase 4 is live:

- [ ] Publication card added to manage page — links to `/manage/[slug]/publication`
- [ ] `getImageMetadata()` wired into gallery upload component
- [ ] `next.config.js` serverComponentsExternalPackages entry confirmed
- [ ] First Vercel Pro end-to-end PDF generation test on real capsule
- [ ] maxDuration confirmed sufficient (raise to 300 if 60s breached)
- [ ] Font loading confirmed clean — self-host if Google Fonts slow at render time
- [ ] Moderation queue live before organiser demo

---

## 10. SIX ENGAGEMENT EXPERIENCES — STATUS

| # | Experience | DB Ready | Code |
|---|---|---|---|
| 1 | Milestone notifications | capsule_milestones | Phase 3 |
| 2 | Keepsake Card | contribution_keepsakes | Template exists — needs wiring |
| 3 | Live Wall (D-day) | Realtime needed | Phase 3 |
| 4 | Collective Belonging email | anniversary_queue | Phase 3 |
| 5 | Subject Reveal | honouree_portal_tokens | Add button to manage page |
| 6 | Anniversary email | anniversary_queue | Phase 3 |

Experience 5 (Subject Reveal): organiser presses one button on manage page → subject receives reveal email. Template in Six Experiences doc. Build alongside manage page enhancements.

Note: All experiences use `capsules.organiser_email` directly — we have no Supabase auth. Do not use `owner_user_id` auth lookups.

---

## 11. OPEN ITEMS — NUMBERED FOR TRACKING

| # | Item | Priority | Session |
|---|---|---|---|
| O1 | `/for/[slug]` tribute wall rebuild | CRITICAL | Tribute Wall AI |
| O2 | `/for/[slug]/submit` submission form | CRITICAL | Tribute Wall AI |
| O3 | Submission confirmation email | HIGH | Tribute Wall AI |
| O4 | Keepsake Card — replaces plain approval email | HIGH | Tribute Wall AI |
| O5 | `/for/[slug]/edit/[token]` contributor edit | HIGH | Tribute Wall AI |
| O6 | Stripe paid path in booking flow | HIGH | Stripe AI |
| O7 | Stripe webhook activation | HIGH | Stripe AI |
| O8 | Manage page payment success banner | HIGH | Stripe AI |
| O9 | itslegacycapsule.com DNS resolution | BLOCKING | Cloudflare support |
| O10 | NEXT_PUBLIC_APP_URL → real domain | After O9 | Vercel env var |
| O11 | `/for/[slug]/profile` subject profile page | HIGH | Next session |
| O12 | useRegionalPrice hook | MEDIUM | Next session |
| O13 | Publication card on manage page | MEDIUM | Next session |
| O14 | imageUtils wired into upload flow | MEDIUM | Next session |
| O15 | Subject Reveal button on manage page | MEDIUM | Next session |
| O16 | About page — real copy | LOW | Content |
| O17 | Examples page — real demo slugs | LOW | Content |

---

## 12. FILES TO REMOVE FROM PROJECT FOLDER

These files are outdated and should be deleted to avoid confusion:

| File | Reason |
|---|---|
| `AGENTS.md` | Replaced by `PROJECT_RULES.md` — old file had VS Code Claude Code rules irrelevant to planning sessions |
| `LegacyCapsule_BuildHandoff_14May2026.md` | Superseded by this file |
| `LegacyCapsule_BuildHandoff_10May2026_Doc4.docx` | Very outdated — predates most current decisions |

**Files to keep:**
- All other `.docx` spec documents — still authoritative for their domains
- `README.md` — keep and update
- `CURRENT_STATE.md` — this version
- `PROJECT_RULES.md` — new file
- `HANDOFF.md` — this file

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*HANDOFF.md — 16 May 2026 — Confidential*
*This document supersedes: LegacyCapsule_BuildHandoff_14May2026.md and LegacyCapsule_BuildHandoff_10May2026_Doc4.docx*
