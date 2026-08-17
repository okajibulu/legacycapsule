// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/manage/[slug]/page.tsx
// PURPOSE:   Server component — auth gate for the manage dashboard.
//            Validates lc_mgr_[slug] session cookie for FRFA and Co-admin.
//            Organiser flow unchanged — identified client-side via localStorage.
//            Passes accountType, accountName, accountEmail, permissions as
//            props to ManagePageClient (the existing client component).
//            If FRFA or Co-admin session found: their identity is injected
//            server-side and the client component uses it directly.
//            If no mgr session: organiser default passed — client handles
//            organiser identity via existing localStorage flow.
// ARCHITECTURE: CA-SPEC-001 — Step 15b.
//               Auth: lib/manageAuth.ts
//               Client: app/manage/[slug]/ManagePageClient.tsx
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { checkManageAuth } from '@/lib/manageAuth'
import ManagePageClient    from './ManagePageClient'

// ═══ SECTION 1 — Server component ═══

export default async function ManagePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // ── Auth check — server side ──────────────────────────────────────────────
  // Returns accountType 'organiser' if no mgr cookie found.
  // Returns FRFA or co-admin account data if valid cookie found.
  const auth = await checkManageAuth(slug)

  // ── Pass auth result to client component ──────────────────────────────────
  return (
    <ManagePageClient
      slug={slug}
      serverAccountType={auth.accountType}
      serverAccountName={auth.accountName}
      serverAccountEmail={auth.accountEmail}
      serverPermissions={auth.permissions}
    />
  )
}
