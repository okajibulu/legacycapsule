// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  app/gift/stand/[sessionId]/page.tsx
// PURPOSE:    Stand-facing scanner page — accessed by stand staff directly.
//             Validates session exists and is active, then mounts the scanner.
//             GiftStandScanner is dynamically imported with ssr: false
//             (QR camera access requires browser environment).
// SPEC:       GCS-SPEC-001-AMD-001 Section 2.9 + AMD-002 Phase 5 Step 21
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.22
// DATE:       19 August 2026
// ═══════════════════════════════════════════════════════════════════════════════

import { notFound }  from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import dynamic          from 'next/dynamic'

// ssr: false — QR camera requires browser (AMD-002 Phase 5 Step 21 build rule)
const GiftStandScanner = dynamic(
  () => import('@/components/gift/GiftStandScanner'),
  { ssr: false, loading: () => <ScannerLoader /> }
)

function ScannerLoader() {
  return (
    <div className="min-h-screen bg-[#0a061a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
    </div>
  )
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function GiftStandPage({ params }: PageProps) {
  const { sessionId } = await params
  const db = getDb()

  const { data: session } = await db
    .from('gift_stand_sessions')
    .select('id, capsule_id, stand_name, staff_name, status, dispatched_count, failed_count, session_start')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) notFound()

  if (session.status === 'closed') {
    return (
      <div className="min-h-screen bg-[#0a061a] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-3">
          <p className="text-white/40 text-lg">This stand session has been closed.</p>
          <p className="text-white/20 text-sm">Contact the event coordinator to open a new session.</p>
        </div>
      </div>
    )
  }

  const { data: capsule } = await db
    .from('capsules')
    .select('event_name, slug')
    .eq('id', session.capsule_id)
    .maybeSingle()

  return (
    <GiftStandScanner
      session={{
        id:               session.id,
        capsule_id:       session.capsule_id,
        stand_name:       session.stand_name,
        staff_name:       session.staff_name,
        status:           session.status,
        dispatched_count: session.dispatched_count,
        failed_count:     session.failed_count,
      }}
      eventName={capsule?.event_name ?? 'Event'}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { sessionId } = await params
  const db = getDb()
  const { data: session } = await db
    .from('gift_stand_sessions')
    .select('stand_name')
    .eq('id', sessionId)
    .maybeSingle()

  return {
    title: `${session?.stand_name ?? 'Gift Stand'} · LegacyCapsule`,
  }
}
