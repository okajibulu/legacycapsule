// ============================================================
// FILE PATH: app/publication-render/layout.tsx
// PURPOSE:   Standalone layout for publication render pages.
//            Deliberately minimal — no site header, footer,
//            navigation, or global CSS. Publication pages must
//            render as clean print documents with zero platform
//            chrome bleeding in.
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY:  AI17 · Claude Sonnet 4.6
// VERSION:   v2.11.48
// DATE:      4 August 2026
// ============================================================

export default function PublicationRenderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}