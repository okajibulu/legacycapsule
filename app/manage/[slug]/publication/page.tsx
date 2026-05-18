/**
 * ============================================================
 * LEGACYCAPSULE — app/manage/[slug]/publication/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 */

import { notFound }      from 'next/navigation'
import { createClient }  from '@supabase/supabase-js'
import PublicationEditor from '@/components/publication/PublicationEditor'

// ─────────────────────────────────────────────────────────────
// SECTION 1 — Supabase admin client (server-side only)
// ─────────────────────────────────────────────────────────────
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────
// SECTION 2 — Page props
// await params required — Next.js 16 on Node.js 24
// ─────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ slug: string }>
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — Page component
// ─────────────────────────────────────────────────────────────
export default async function PublicationPage({ params }: PageProps) {
  const { slug } = await params

  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, page_state, tier')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !capsule) {
    return notFound()
  }

  return (
    <div
      className="h-screen flex flex-col bg-[#0a0010] overflow-hidden"
      aria-label="Publication Editor"
    >
      <header className="
        flex-shrink-0 flex items-center justify-between
        px-6 py-3
        border-b border-yellow-400/10
        bg-[#0a0010]
      ">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-yellow-200 tracking-tight">
            LegacyCapsule
          </span>
          <span aria-hidden="true" className="text-white/20 text-xs">/</span>
          <span className="text-xs text-white/40">Publication Editor</span>
        </div>
        <span className="text-[10px] text-white/25 font-mono truncate max-w-[140px]">
          {slug}
        </span>
      </header>

      <div className="flex-1 min-h-0">
        <PublicationEditor
          capsuleId={capsule.id}
          capsuleSlug={capsule.slug}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION 4 — Metadata
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return {
    title: 'Publication Editor — ' + slug + ' | LegacyCapsule',
    robots: { index: false, follow: false },
  }
}