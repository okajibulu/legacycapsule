import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import TributeWallClient from '@/components/TributeWallClient'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function HoldingScreen({ title, message, sub }: {
  title: string
  message: string
  sub?: string
}) {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0D0820',
    }}>
      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: '420px' }}>
        <div style={{ fontSize: '36px', marginBottom: '20px' }}>✦</div>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '24px', fontWeight: 700,
          color: '#F5F3EE', margin: '0 0 12px',
        }}>
          {title}
        </h1>
        <p style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.7, margin: '0 0 8px',
        }}>
          {message}
        </p>
        {sub && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            {sub}
          </p>
        )}
      </div>
    </main>
  )
}

export default async function TributeWallPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // ── await params — required in Next.js 16 on Node.js 24 ───────────────
  const { slug } = await params

  const { data: capsule, error: capsuleError } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, page_state, tier, hero_image_url, organiser_email, free_tier_expires_at, created_at')
    .eq('slug', slug)
    .single()

  if (capsuleError || !capsule) notFound()

  if (capsule.page_state === 'pending_verification') {
    return (
      <HoldingScreen
        title="Almost ready"
        message="This tribute wall is being prepared. The organiser needs to verify their email before it goes live."
        sub="If you're the organiser, check your inbox for the verification email from LegacyCapsule."
      />
    )
  }

  if (capsule.page_state === 'pending_payment') {
    return (
      <HoldingScreen
        title="Payment pending"
        message="This tribute wall will go live once the organiser completes their setup. Check back shortly."
      />
    )
  }

  if (capsule.page_state === 'suspended') {
    return (
      <HoldingScreen
        title="Temporarily unavailable"
        message="This tribute wall is temporarily unavailable."
      />
    )
  }

  const { data: contributions } = await adminClient
    .from('contributions')
    .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, lat, lng, status, email, created_at')
    .eq('capsule_id', capsule.id)
.in('status', ['approved', 'pending_review', 'pending'])
    .order('created_at', { ascending: false })

  return (
    <TributeWallClient
      capsule={capsule as any}
      initialContributions={(contributions ?? []) as any}
    />
  )
}