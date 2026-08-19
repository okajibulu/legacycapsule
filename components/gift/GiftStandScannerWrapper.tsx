'use client'

// FILE PATH: components/gift/GiftStandScannerWrapper.tsx
// PURPOSE:   Client-side wrapper for GiftStandScanner — enables ssr: false dynamic import
//            from within a Server Component page.
// BUILT BY:  AI22 · Claude Opus 4.6 — v2.12.22 hotfix

import dynamic from 'next/dynamic'

const GiftStandScanner = dynamic(
  () => import('@/components/gift/GiftStandScanner'),
  { ssr: false, loading: () => (
    <div className="min-h-screen bg-[#0a061a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
    </div>
  )}
)

export default GiftStandScanner