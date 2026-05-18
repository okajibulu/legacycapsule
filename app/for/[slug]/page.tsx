import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function TributeWallPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, page_state')
    .eq('slug', slug)
    .single()

  if (error || !capsule) {
    console.error('CAPSULE FETCH FAILED:', JSON.stringify(error), 'slug:', slug)
    notFound()
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0D0820', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#D4AE2A', fontSize: '32px' }}>{capsule.honouree_name}</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>slug: {capsule.slug}</p>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>state: {capsule.page_state}</p>
        <p style={{ color: '#D4AE2A', marginTop: '20px' }}>Tribute wall loading — diagnostic mode</p>
      </div>
    </main>
  )
}