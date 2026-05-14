# AGENTS.md
## LegacyCapsule — Claude Agent Behaviour Rules
**For:** Claude (claude.ai chat) + Claude Code (VS Code extension)
**Applies to:** Every Claude session on this project without exception.
**Last updated:** 14 May 2026

---

## 1. READ THESE FILES FIRST — EVERY SESSION

Before responding to any request, Claude must read these files in order:

1. `CURRENT_STATE.md` — exact build state, what is done, what is next
2. `AGENTS.md` — this file — behaviour rules
3. `README.md` — project overview

If project knowledge search is available, search it before answering any technical question. The project documents are the authoritative source. Claude's training data is secondary.

---

## 2. ROLE SPLIT — CLAUDE CHAT vs CLAUDE CODE

### Claude (claude.ai chat) — PLANNING & DIRECTION
- Reads documents and current state
- Plans what to build and in what order
- Makes architectural decisions
- Writes complete file content for Claude Code to apply
- Flags deviations from spec documents before they happen
- Never executes terminal commands directly
- Produces clear, precise, complete instructions Claude Code can execute without ambiguity
- **Token efficiency:** Gives Claude Code one complete, self-contained instruction per task — no incremental back-and-forth corrections

### Claude Code (VS Code extension) — EXECUTION
- Applies code changes to files
- Runs terminal commands
- Reports errors and output back to Claude chat
- Does not make architectural decisions independently
- Asks Claude chat for direction when encountering unexpected errors
- Never modifies spec document files — read-only references
- **Must run `npm run build` after every change and report results**

**If Claude Code encounters something unexpected:** stop, report the exact error, wait for direction. Do not improvise.

---

## 3. DOCUMENT AUTHORITY

| Domain | Authoritative document |
|---|---|
| Build sequence and phase order | Master Build Plan v1.0 |
| Product specification and feature rules | Master Document v3.0 |
| Database schema — every column | MVP Build Guide v2.0 Section 2.3 |
| Payment architecture | Payment Integration Guide v1.0 |
| Pricing and admin console | LCAdmin Build Guide v1.0 |
| World map component | Animated World Map Build Guide v1.0 |
| Six engagement experiences | Six Engagement Experiences v1.0 |
| Publication engine | Publication Engine Build Guide |
| Reseller system and regional pricing | EcoControl Spec v1.0 |
| All deviations from the above | LegacyCapsule_BuildHandoff (latest version) |
| All session decisions | CURRENT_STATE.md Section 5 |

**Rule:** If Claude is about to suggest something that affects one of these domains, search project knowledge first. If the suggestion conflicts, say so explicitly and propose a deliberate deviation — do not silently proceed.

---

## 4. CODING RULES

### 4.1 General
- Language: TypeScript everywhere. No .js files in app/ or lib/
- Package manager: `npm` only. Never `yarn` or `pnpm`
- Terminal: PowerShell on Windows. Use `;` not `&&` to chain commands
- Framework: Next.js 16 App Router. No Pages Router patterns
- All new routes go in `app/` directory

### 4.2 Imports
- Use `@/` alias for all internal imports
- Correct: `import LogoCapsule from "@/components/LogoCapsule"`
- Wrong: `import LogoCapsule from "../../components/LogoCapsule"`
- Google Fonts: `<link>` tags in `app/layout.tsx` only — NOT CSS `@import url()`

### 4.3 Styling
- Marketing pages: CSS custom properties from `app/globals.css`
- Tribute wall and admin: Tailwind dark theme directly
- Never mix both systems on the same element
- Never `@apply border-border` or `@apply bg-background` — Tailwind v4 does not support these

### 4.4 Database
- **Never hardcode prices.** Always read from `lc_pricing` Supabase table
- **Never hardcode tier names or feature lists.** Read from `lc_content` table
- **Use `contributor_name` not `name`** on contributions table — renamed, `name` causes runtime errors
- Server components and API routes: service role client (`SUPABASE_SERVICE_ROLE_KEY`)
- Client components: anon client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- **Do not import server-only modules (Resend, etc.) into `'use client'` components.** Use API routes instead.

### 4.5 Components
- `LogoCapsule.tsx` — single source of truth for the logo. Never create alternatives.
- `AnimatedWorldMap.tsx` — props: `mode="hero"|"idle"`, `showOverlay={boolean}`. Always `showOverlay={false}` on homepage.
- `TributeMap.tsx` — Leaflet map for tribute wall. Always dynamically imported with `ssr: false`.
- `NavigationWrapper.tsx` and `FooterWrapper.tsx` in `app/layout.tsx` — never import Navigation or Footer directly in page files.

### 4.6 Environment variables
- All env vars in `.env.local` for local dev. Never commit this file.
- All env vars must be duplicated in Vercel project settings.
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally. Currently Vercel preview URL until `itslegacycapsule.com` DNS resolves fully.

### 4.7 Public-facing language
- **"Honouree" is internal language only.** Never use in public UI, emails, or page copy.
- All public references use the subject's name or an event-type phrase from `lib/eventLabels.ts`.
- All public-facing dynamic labels go through `lib/eventLabels.ts`. Do not hardcode event-specific copy.

### 4.8 Email sending
- All email sends must go through API routes — never import Resend or email functions directly into `'use client'` components.
- FROM address: `noreply@itslegacycapsule.com` — confirmed in both `lib/email.ts` and `lib/verification.ts`.
- The `/capsule/` route (not `/event/`) must be used in all email links. Double-check every email template.

---

## 5. WHAT CLAUDE MUST NEVER DO

| Never do this | Why |
|---|---|
| Hardcode any price | Prices managed in lc_pricing. Hardcoding breaks admin control. |
| Hardcode tier names or feature lists | Managed in lc_content. |
| Use `name` on contributions table | Renamed to `contributor_name`. Runtime errors. |
| Use "honouree" in public UI or emails | Internal language only. Use lib/eventLabels.ts. |
| Import Navigation or Footer directly in page files | NavigationWrapper/FooterWrapper in layout.tsx handle this. |
| Use `&&` in PowerShell commands | Not valid in Windows PowerShell. Use `;`. |
| Use `@apply border-border` in CSS | Tailwind v4 throws CssSyntaxError. |
| Use `@import url()` for fonts in globals.css | Tailwind v4 rejects it. Fonts in layout.tsx only. |
| Import Resend or email.ts into client components | Security + architecture violation. Use API routes. |
| Expose SUPABASE_SERVICE_ROLE_KEY to client | Security violation. Server-side only. |
| Change routing paths without checking all references | /capsule/ route exists in DB slugs, email templates, API routes, admin. Any path change must be searched project-wide before applying. |
| Build Phase N+1 features while Phase N incomplete | Phase discipline is a project rule. |
| Make architectural decisions without consulting spec documents | Documents exist to prevent ad-hoc decisions. |
| Create files in `src/` directory | Project uses root-level app/, components/, lib/. |
| Use `yarn` or `pnpm` | npm only. |
| Set `auto_approve_tributes` to true on production | Tribute moderation must always be manual. |
| Show admin controls on public tribute wall | Moderation is organiser's job via /manage. Public wall is guest-facing only. |

---

## 6. DEVIATION PROTOCOL

When Claude wants to suggest something that differs from an authoritative document:

1. **State the conflict explicitly.** "The spec says X. I am proposing Y instead."
2. **Give the reason.** Why is the deviation necessary or beneficial?
3. **Confirm before implementing.** Wait for the founder to agree.
4. **Record it.** After the session, add to CURRENT_STATE.md Section 5 and Build Handoff doc.

---

## 7. COMMUNICATION STYLE

### Claude chat:
- Plan before coding. State the full plan, confirm, then write code.
- One issue at a time when debugging.
- Never produce placeholder solutions that need replacing. Build the real thing first time.
- Be direct about trade-offs.
- **Token efficiency:** When giving Claude Code instructions, write complete self-contained instructions. Do not send partial instructions that require follow-up corrections.

### Claude Code:
- Run exact commands specified. Report output verbatim.
- If a command fails, report the full error. Do not paraphrase.
- Confirm each file change before moving to the next.
- Do not combine multiple changes unless explicitly instructed.

---

## 8. SESSION START CHECKLIST

- [ ] Read `CURRENT_STATE.md` fully
- [ ] Search project knowledge for context relevant to today's task
- [ ] State what the session will accomplish (max 3 items)
- [ ] Confirm immediate next task matches Section 9 of `CURRENT_STATE.md`
- [ ] Flag any open decisions that must be made before today's task can complete

---

## 9. SESSION END CHECKLIST

- [ ] Run `npm run build` — confirm zero errors
- [ ] Commit to GitHub: `git add .` then `git commit -m "descriptive message"` then `git push`
- [ ] Update `CURRENT_STATE.md` — mark completed items, add new deviations
- [ ] Note any new open decisions discovered during the session

---

## 10. PHASE DISCIPLINE

- Do not build Phase 2 features during Phase 1.
- Payment integration (Phase 1.5) is next after Phase 1 is complete.
- Schema anticipation is permitted — creating tables for future phases is encouraged. Implementing their logic is not.
- Phase 3 DB tables already exist. Do not build Phase 3 experience code until Phase 3 is active.

---

## 11. KNOWN GOTCHAS — READ BEFORE EVERY BUILD SESSION

1. **Tailwind v4 + CSS @import url()** — CssSyntaxError. Google Fonts in layout.tsx only.
2. **Tailwind v4 + @apply border-border** — "Cannot apply unknown utility class". Use plain CSS values.
3. **contributor_name vs name** — always `contributor_name` on contributions table.
4. **PowerShell && operator** — not valid. Use `;` to chain commands.
5. **File casing on Windows** — TypeScript is case-sensitive. Use exact casing from imports.
6. **Turbopack compilation delay** — first page load in dev takes 5–15 seconds. Normal.
7. **NavigationWrapper vs direct import** — never import Navigation directly in page files.
8. **showOverlay on AnimatedWorldMap** — must be `false` on homepage.
9. **NEXT_PUBLIC_APP_URL** — update to `https://itslegacycapsule.com` in Vercel when DNS resolves.
10. **VS Code file conflict popup** — always click Overwrite (not Compare) after PowerShell edits.
11. **localStorage in Next.js client components** — always guard with `typeof window !== 'undefined'` before accessing. Hydration errors (React #321) if not guarded.
12. **Nested useEffect** — never place a useEffect inside another useEffect. React error #321. Each useEffect must be at component top level.
13. **Leaflet SSR** — TributeMap must always be dynamically imported with `{ ssr: false }`. Leaflet cannot run server-side.
14. **Email function imports in client components** — never import from lib/email.ts or lib/verification.ts in 'use client' files. Always call via API route (fetch POST).
15. **Routing path changes** — changing /capsule/ to /event/ or any other path breaks email templates, API routes, DB slugs, and admin links simultaneously. Always search project-wide before any route rename.
16. **page_state values** — `pending_verification` (just created) → `active` (verified). Never `tribute_collection` — that was an old value, now corrected to `active`. The verify route sets `active`.
17. **Git detached HEAD** — commits made in detached HEAD state are not on any branch and will not push to origin/main. Always confirm `(HEAD -> main)` in git log before pushing.
18. **Vercel deployment protection** — preview URLs may be blocked by Vercel authentication. Disable deployment protection in Vercel settings for testing.
19. **Manage page email access** — the manage page reads organiser email from URL param `?email=` first, then localStorage `lc_organiser_email`. The email param must be included in both the verification redirect and the welcome email manage link.
20. **Single currency display** — never show dual currency (EUR + NGN) on the same UI element. Regional detection determines which currency to show.

---

*VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule*
*AGENTS.md — 14 May 2026 — Confidential*
