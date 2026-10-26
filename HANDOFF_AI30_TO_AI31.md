HANDOFF_AI30_TO_AI31.md
LegacyCapsule — Session Handoff
FROM: AI30 · Claude Sonnet 4.6 (setup/infrastructure)
TO:   AI31
DATE: 27 September 2026
SESSION FOCUS: Infrastructure setup — GitHub repo access + Vercel connector

═══════════════════════════════════════════════════════════════
SECTION 0 — BEFORE BUILD COMMENCES (AI31 first priorities)
═══════════════════════════════════════════════════════════════

TWO THINGS BEFORE ANY CODE:

1. CLONE THE REPO (do this immediately, first tool call)
   The GitHub Desktop MCP is NOT yet configured (see Section 1).
   Use the direct clone method instead — confirmed working:

   GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 \
     https://github.com/okajibulu/legacycapsule \
     /home/claude/okajibulu/legacycapsule

   Verify with:
   git -C /home/claude/okajibulu/legacycapsule rev-parse HEAD
   Expected: 95e802049cbece9fc4a2afdbcc5ed752ae7512af

   This gives full read access to all files. For commits/push,
   Valnex applies edits locally and runs:
   git add . && git commit -m "AI31v2.12.XX — description"

2. FOUNDER DISCUSSION — Order flow
   Valnex wants to reason through the payment order flow before
   or after build tasks are done. AI31 should keep this on the
   agenda and open it when Valnex signals readiness.

═══════════════════════════════════════════════════════════════
SECTION 1 — What AI30 completed
═══════════════════════════════════════════════════════════════

── Vercel MCP Connector — CONNECTED ✅
   Installed via Claude Desktop → Settings → Connectors → Discover
   Vercel now appears as a connected tool with full suite of tools
   including env var management, deployments, logs, project access.
   Available in all future Desktop sessions automatically.
   Use for Task 3 (Paystack live switch) — no Vercel dashboard
   login needed for env var changes.

── Repo Read Access — CONFIRMED ✅
   Direct clone via git proxy works cleanly.
   Last commit in repo: AI29v2.12.66
   All three Task 1-2 target files confirmed present:
     app/api/regional-prices/route.ts        ✅
     app/book/page.tsx                       ✅
     components/manage/ServicesTab.tsx       ✅

── GitHub Desktop MCP — UNRESOLVED ⏳
   Attempted but NOT working. Root cause identified:
   Claude Desktop on Windows is installed as a Windows Store
   (packaged) app. Its real config path is:
     C:\Users\USER\AppData\Local\Packages\
       Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\
       claude_desktop_config.json
   This file is also the preferences store — mcpServers key
   added but Claude Desktop is ignoring it (confirmed via logs).
   The github-mcp-server.exe binary is installed at:
     C:\Users\USER\tools\github-mcp-server.exe
   PAT is valid (repo scope confirmed).
   RECOMMENDATION: Do not spend more time on this in AI31.
   The direct clone method covers all read needs. Push is handled
   by Valnex running git locally. GitHub MCP is a nice-to-have,
   not a blocker.

── No code written this session ✅
   Zero files touched in the repo. Last commit remains AI29v2.12.66.
   Next commit will be AI31v2.12.67.

═══════════════════════════════════════════════════════════════
SECTION 2 — PRIMARY AI31 BUILD WORK
═══════════════════════════════════════════════════════════════

MODEL RECOMMENDATION: Sonnet 4.6 — wiring and UI work only.
Switch to Opus 4.6 only if a design decision arises with
downstream architectural consequence.

ALL THREE TASKS: Read file first → present action plan to Valnex
→ await approval → produce surgical edit directive. No exceptions.

── TASK 1: Wire promo prices into regional-prices API
   File: app/api/regional-prices/route.ts
   Currently returns base prices from lc_pricing only.
   Needs to call resolvePromoPrices() from lib/payments/promoResolver.ts
   and return both base and promo prices in the response shape.

   Required new response shape:
     { key, label,
       eur_price, eur_promo_price, eur_has_promo,
       ngn_price, ngn_promo_price, ngn_has_promo,
       discount_pct, promo_label }

   promoResolver.ts location: lib/payments/promoResolver.ts
   Exports to use: resolvePromoPrices()

   IMPORTANT: Read the file first via clone before touching.
   Verify current shape before writing any edit directive.

── TASK 2: Strikethrough pricing display
   Files: app/book/page.tsx (Screen 3 services selector)
          components/manage/ServicesTab.tsx (services list)

   When has_promo = true for a product:
     - Show original price with strikethrough (muted, smaller)
     - Show promo price in gold, prominent
     - No % label — banner already communicates the offer
     - Keep layout compact — price column must not reflow grid

   LC inline style pattern (no Tailwind in these files):
     <span style={{ textDecoration: 'line-through',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '11px' }}>
       €{formatPrice(base_price)}
     </span>
     <span style={{ color: 'var(--lc-gold)', fontWeight: 700 }}>
       €{formatPrice(promo_price)}
     </span>

   IMPORTANT: Read both files via clone before touching.
   Price render is inside a grid — changes must preserve layout.

── TASK 3: Paystack Live switch
   Vercel MCP is connected — AI31 can update env vars directly.
   Do NOT do this until Tasks 1 and 2 are built, committed,
   deployed, and build is confirmed clean.

   Step 1: Grep repo for hardcoded test keys first:
     grep -r "sk_test\|pk_test" across *.ts *.tsx files
     Must return zero results. Flag immediately if any found.

   Step 2: Use Vercel MCP to update env vars on
     itslegacycapsule.com project:
       NEXT_PUBLIC_PAYSTACK_KEY  → swap test for live key
       PAYSTACK_SECRET_KEY       → swap test for live key
     Valnex provides the live keys — do not prompt until ready.

   Step 3: Confirm Paystack dashboard webhook URL is under
     live settings (not just test):
     https://itslegacycapsule.com/api/webhooks/paystack

   Step 4: Smoke test — one real small transaction (lowest
     priced add-on, NGN). Verify: payment → features unlock
     → promo slot claimed → confirmation email received.

   Step 5: Stripe — still pending Valnex Lda account activation.
     Do NOT switch Stripe keys until resolved. Flag if expiring.

═══════════════════════════════════════════════════════════════
SECTION 3 — CARRY-OVER ITEMS (check at end of session)
═══════════════════════════════════════════════════════════════

After primary tasks, check which of these can be done:

  - Profile page section reorder: Event Phases before Contributor
    Gallery. Manual cut-paste once file is read.

  - "2 of 10" hardcoded cap: grep -r "2 of 10\|2\/10" --include="*.tsx"
    Source file not yet identified.

  - Public Event Moments photo count:
    app/for/[slug]/story/[phaseId]/page.tsx
    Should show capped public count, not total DB count.

  - Checkout success "slot N" message: show founding customer
    slot number on payment success page.
    e.g. "You are booking #7 — thank you for being one of our
    first 50."

  - Payment confirmation email promo line: one line in the
    confirmation email body noting launch pricing applied.

  - EDS Video Reel zip export: jszip installed, pending.
    Refer to EDS-SPEC-001-AMD-001-v1.1.md for spec.

  - GCS Phase 8A: blocked on D1 + D2 founder decisions.
    Do not proceed without those confirmed.

  - Unused index audit: 107 flagged by Supabase advisor.
    Do NOT act pre-launch. Re-run 30 days after first customer.

═══════════════════════════════════════════════════════════════
SECTION 4 — TECHNICAL RULES REMINDER FOR AI31
═══════════════════════════════════════════════════════════════

  - All prices stored in minor currency units (kobo/cents).
    Convert before display: divide by 100.

  - LC uses inline styles exclusively — no Tailwind className
    in manage dashboard or booking flow components.
    Homepage uses a mix (both className and inline style).

  - GCS architecture is locked — do not modify without reading
    GCS-SPEC-001.md and all amendments first.

  - Every file touched must have:
    1. File path at top as a comment
    2. AI session + model + date added to update history
    3. No # separator characters — use // for all comments

  - Surgical edits only — find-and-replace directives with
    filenames prominently labeled. Never full-file rewrites.
    Full file replacement only when content is fully verified
    against clone.

  - Section markers: // ═══ SECTION N — Description ═══

  - Component Map: append AI31 addendum to COMPONENT_MAP.md
    after each session. Do not overwrite previous entries.

  - Git commit format:
    AI31v2.12.XX — brief description
    Start from AI31v2.12.67 (last was AI29v2.12.66 —
    AI30 made no commits).

  - Valnex runs npm run build before pushing. AI31 should
    flag any TypeScript issues in edit directives.

═══════════════════════════════════════════════════════════════
SECTION 5 — STANDING CONTEXT
═══════════════════════════════════════════════════════════════

  - No live customers yet — promo counter at 0/50.
  - Paystack on test mode — switch to live is AI31 Task 3.
  - Stripe pending Valnex Lda account activation (SCUML/CAC
    registration issue — Estate Management vs software category).
    International zones stay on Stripe once resolved.
  - Supabase project ID: zclmllbfuekyeshiihgt (LegacyCapsule)
  - RW-Ecosystem project ID: njgwunzphbflivqnyrjs
  - Both under org: qxbzngzoflnicnephzkm
  - Live domain: itslegacycapsule.com
  - Vercel project: itslegacycapsule.com — Vercel MCP connected
  - Leaked password protection: deferred (Supabase Pro required)
  - GitHub PAT (repo scope, stored in Desktop config):
    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
    (for reference only — clone works without it via proxy)

═══════════════════════════════════════════════════════════════
SECTION 6 — SESSION PROTOCOL REMINDERS
═══════════════════════════════════════════════════════════════

  - Present action plan before executing any code — Valnex
    must approve before edits are produced.
  - All files touched must carry AI31 imprint in headers.
  - Recommend model switches in chat window proactively.
  - Founder standing rule: surface anything that can be done
    better — fresh AI eyes bring value.
  - Order flow discussion: keep on agenda, open when Valnex
    signals readiness (after build tasks or between tasks).
