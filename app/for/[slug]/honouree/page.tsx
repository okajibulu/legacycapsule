/* =========================================================
   app/for/[slug]/honouree/page.tsx
   Family Representative portal — token-gated
   - Read-only tribute wall
   - Ways to Honour acknowledgements
   - No tribute composer — observer view only
========================================================= */
import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import HonoureePortalClient from './HonoureePortalClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function HonoureePortalPage({ params, searchParams }: {
  params: { slug: string }
  searchParams: { token?: string }
}) {
  const token = searchParams?.token
  if (!token) redirect(`/for/${params.slug}`)

  // Validate token — check exists and not expired
  const { data: tokenRow } = await supabase
    .from('honouree_portal_tokens')
    .select('capsule_id, expires_at')
    .eq('token', token)
    .single()

  if (!tokenRow) redirect(`/for/${params.slug}`)
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) redirect(`/for/${params.slug}`)

  // Update last_accessed_at
  await supabase
    .from('honouree_portal_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('token', token)

  // Fetch capsule
  const { data: capsule } = await supabase
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, theme, organiser_email')
    .eq('slug', params.slug)
    .single()

  if (!capsule || capsule.id !== tokenRow.capsule_id) notFound()

  // Fetch approved tributes with responses
  const { data: tributes } = await supabase
    .from('contributions')
    .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, audio_url, video_url, created_at, status, email, tribute_responses(response_text, responded_by)')
    .eq('capsule_id', capsule.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch Ways to Honour accounts + acknowledgements
  const { data: supportAccounts } = await supabase
    .from('capsule_support_accounts')
    .select('*')
    .eq('capsule_id', capsule.id)
    .eq('is_visible', true)
    .order('sort_order')

  const { data: acknowledgements } = await supabase
    .from('support_acknowledgements')
    .select('id, contributor_name, relationship, amount, currency, note, created_at, support_account_id')
    .eq('capsule_id', capsule.id)
    .order('created_at', { ascending: false })

  return (
    <HonoureePortalClient
      capsule={capsule}
      tributes={tributes ?? []}
      supportAccounts={supportAccounts ?? []}
      acknowledgements={acknowledgements ?? []}
      token={token}
    />
  )
}
