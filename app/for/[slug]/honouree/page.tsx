/* =========================================================
   app/for/[slug]/honouree/page.tsx
   Family Representative portal — token-gated
   
   Changes v1.2.6 (AI6):
   - T6 FIX: searchParams is a Promise in Next.js 15+.
     Was: searchParams: { token?: string }  → token = undefined
     Now: await searchParams → token read correctly
     This was causing immediate redirect → 404 on every visit.
   - Fixed capsule_support_accounts query: is_visible → is_active
     (is_visible does not exist in schema)
   - Added deleted_at null guard to support accounts query
========================================================= */
import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import HonoureePortalClient from './HonoureePortalClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function HonoureePortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>   // Next.js 15+ — must await
}) {
  const { slug }    = await params
  const { token }   = await searchParams       // T6 FIX: was searchParams?.token (undefined)

  if (!token) redirect(`/for/${slug}`)

  // Validate token
  const { data: tokenRow } = await supabase
    .from('honouree_portal_tokens')
    .select('capsule_id, expires_at')
    .eq('token', token)
    .single()

  if (!tokenRow) redirect(`/for/${slug}`)
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) redirect(`/for/${slug}`)

  // Update last_accessed_at
  await supabase
    .from('honouree_portal_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('token', token)

  // Fetch capsule
  const { data: capsule } = await supabase
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, event_date, hero_image_url, theme, organiser_email')
    .eq('slug', slug)
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

  // Fetch Ways to Honour accounts — is_active (not is_visible)
  const { data: supportAccounts } = await supabase
    .from('capsule_support_accounts')
    .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order, relationship_to_honouree')
    .eq('capsule_id', capsule.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order')

  // Fetch acknowledgements
  const { data: acknowledgements } = await supabase
    .from('support_acknowledgements')
    .select('id, supporter_name, supporter_email, created_at, support_account_id')
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
