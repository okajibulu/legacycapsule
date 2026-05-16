# PROJECT_RULES.md
## LegacyCapsule — Rules for All AI Planning Sessions
**VALNEX, UNIPESSOAL LDA · RevoWorldTech**
**Last updated:** 16 May 2026

This document is for Claude planning sessions. It is not for VS Code Claude Code.
Read `CURRENT_STATE.md` before this file.

---

## 1. WHAT YOU ARE DOING

You are one of several Claude planning sessions building LegacyCapsule simultaneously. Each session owns a defined scope. You think, plan, and direct — the founder executes your instructions using Claude Code in VS Code or PowerShell directly.

Your job is to:
- Understand the current build state from `CURRENT_STATE.md`
- Plan your scope carefully before producing any code or instructions
- Produce complete, self-contained instructions the founder can execute without ambiguity
- Flag conflicts with existing decisions before proceeding
- Never make decisions that affect another session's scope without coordinator confirmation
- Important to stress test instructions and if there are, propose better options making a good case for new ideology. This is because we need multiple levels of intelligent AI checks so that blind spots are duly covered and that our apps are looking well into the future
- Where possible, also let us avoid placeholder style designs even when guide suggests. So where we see a feasible path to work in a way that movs us some steps ahead, kindl make a good case for it and seek authorization first

---

## 2. DOCUMENT AUTHORITY

Always consult the relevant document before making decisions in its domain.

| Domain | Document |
|---|---|
| Build sequence and phases | Master Build Plan v1.0 |
| Full product specification | Master Document v3.0 |
| Database schema | MVP Build Guide v2.0 Section 2.3 |
| Payment architecture | Payment Integration Guide v1.0 |
| Admin console | LCAdmin Build Guide v1.0 |
| World map component | Animated World Map Build Guide v1.0 |
| Six engagement experiences | Six Engagement Experiences v1.0 |
| Publication engine | Publication Engine Build Guide |
| Reseller system and regional pricing | EcoControl Spec v1.0 |
| All session decisions | CURRENT_STATE.md Section 7 |

If your plan conflicts with a document or a decision in Section 7, say so explicitly before proceeding.

---

## 3. ABSOLUTE RULES — NEVER VIOLATE

### Pricing and content:
- Never hardcode any price — always from `lc_pricing` Supabase table
- Never hardcode tier names or feature lists — always from `lc_content` table
- All prices displayed to users must be single currency per user by IP detection — never dual currency

### Database:
- Always use `contributor_name` not `name` on the contributions table — it was renamed
- Never use `tribute_collection` as a page_state value — it is retired and invalid
- Valid page_state values: `pending_verification` · `pending_payment` · `active` · `suspended` · `expired`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code

### Routes — use exact paths:
- Public capsule: `/for/[slug]` — not `/capsule/[slug]`
- Submission form: `/for/[slug]/submit`
- Contributor edit: `/for/[slug]/edit/[token]`
- Organiser manage: `/manage/[slug]` — not `/for/[slug]/manage`
- Publication editor: `/manage/[slug]/publication`

### Language:
- "Honouree" is internal language only — never use in public UI, emails, or page copy
- All public labels go through `lib/eventLabels.ts`

### Email:
- Never import Resend or email functions directly into client components (`'use client'`)
- All email sends go through API routes
- FROM address: `noreply@itslegacycapsule.com`

### Moderation:
- `auto_approve_tributes` = FALSE on production — always manual moderation
- Public tribute wall has zero admin controls — clean guest-facing only
- Organiser moderates via `/manage/[slug]` only

### Architecture:
- Never create files in `src/` directory — project uses root-level `app/`, `components/`, `lib/`
- Leaflet (TributeMap) must always be dynamically imported with `ssr: false`
- Never touch files outside your defined session scope without coordinator confirmation

---

## 4. THINGS THAT HAVE ALREADY CAUSED PROBLEMS

Learn from these — do not repeat them.

1. **Route path changes without project-wide search** — changing `/capsule/` to `/for/` broke email templates, API routes, and admin links simultaneously. Always search all files before any path rename.

2. **`tribute_collection` as page_state** — a previous session used this value. It is wrong. `active` is correct for both free tier and post-payment activation.

3. **Client components importing server-only modules** — importing `sendOrganiserWelcome` from `lib/email.ts` directly into `app/book/page.tsx` (a client component) caused silent failures. Always use API routes.

4. **`src/` prefix on file paths** — this project has no `src/` directory. Files placed there will not be found by Next.js.

5. **Git detached HEAD** — commits made without being on the `main` branch are lost. Always confirm `(HEAD -> main)` in git log before pushing.

6. **Nested useEffect** — placing a useEffect inside another useEffect causes React error #321 and crashes the page.

7. **localStorage without browser guard** — `localStorage.getItem()` called during server-side rendering causes hydration errors. Always wrap with `typeof window !== 'undefined'`.

8. **`name` vs `contributor_name`** — the contributions table column was renamed. Using `name` causes runtime errors.

---

## 5. WORKING WITH THE FOUNDER

The founder runs your instructions using Claude Code in VS Code or PowerShell directly. He coordinates between sessions.

**When producing instructions:**
- Write complete, self-contained file content — not partial diffs where possible
- For PowerShell: use `;` not `&&` to chain commands (Windows PowerShell rule)
- For SQL: always use IF NOT EXISTS / IF EXISTS guards — the database already has tables
- Group related changes so they can be executed and tested together
- Always specify: run `npm run build` after placing files and paste the result

**When you finish a block:**
- Summarise what was built
- List any deviations from spec documents
- State clearly what the next block is
- Note anything the founder needs to do in parallel (DNS, Vercel, Supabase etc.)

---

## 6. SCOPE BOUNDARIES — CURRENT SESSIONS

Do not touch files owned by another active session.

| Session | Files they own — do not touch |
|---|---|
| Tribute Wall AI | `app/for/[slug]/page.tsx` · `app/for/[slug]/submit/` · `app/for/[slug]/edit/` · `lib/email.ts` (approval + keepsake sections) |
| Stripe AI | `lib/payments/*` · `app/api/checkout/` · `app/api/webhooks/stripe/` · payment sections of `app/book/page.tsx` |
| Publication AI | Complete — `lib/publication/*` · `app/publication-render/` · `app/api/publication/*` · `components/publication/*` · `app/manage/[slug]/publication/` |

If you need to touch a file owned by another session, confirm with the coordinator first.

---

## 7. SUPABASE STORAGE BUCKETS

| Bucket | Access | Contents |
|---|---|---|
| `tribute-photos` | Public | Contributor photo uploads |
| `capsule-publications` | Private — signed URLs only | Generated PDFs |

---

## 8. EMAIL FLOW — REFERENCE

| Email | Trigger | Recipient |
|---|---|---|
| Organiser verification + welcome | Capsule creation | Organiser |
| Submission confirmation + edit link | Tribute submitted (if email given) | Contributor |
| Keepsake Card | Tribute approved | Contributor |
| Collective Belonging | Publication distributed | All contributors |
| Anniversary | 1 year after event date | All contributors |

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*PROJECT_RULES.md — 16 May 2026 — Confidential*
