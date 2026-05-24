'use client'

/* =========================================================
   /dashboard — Capsule Selector
   Shows all capsules the signed-in user has access to.
   If only one capsule, auth/callback redirects directly to manage.
   This page shows for users with multiple capsules.
========================================================= */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAuthClient } from '@/lib/supabaseAuth'

const gold = '#E2C36B'
const textFaint = 'rgba(255,255,255,0.28)'

interface CapsuleItem {
  id: string
  slug: string
  honouree_name: string
  event_type: string
  event_tag: string | null
  approved_contrib_count: number
}

export default function DashboardPage() {
  const [capsules, setCapsules] = useState<CapsuleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      // Read email from URL param (signin handoff) or localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const authEmail = urlParams.get('auth')
      if (authEmail) {
        const decoded = decodeURIComponent(authEmail)
        localStorage.setItem('lc_visitor_email', decoded)
        window.history.replaceState({}, '', '/dashboard')
      }

      const supabase = getAuthClient()
      const { data: { user } } = await supabase.auth.getUser()
      const emailToUse = authEmail ? decodeURIComponent(authEmail) : user?.email

      if (!emailToUse) {
        window.location.href = '/signin'
        return
      }

      setUserEmail(emailToUse)

      const { data } = await supabase
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag, approved_contrib_count')
        .eq('organiser_email', emailToUse.toLowerCase())
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setCapsules(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid rgba(226,195,107,0.15)`, borderTopColor: gold, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)',
      fontFamily: "'DM Sans', sans-serif",
      padding: '0 16px 60px',
    }}>
      <div style={{ maxWidth: '540px', margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </Link>
          <button
            onClick={async () => {
              const supabase = getAuthClient()
              await supabase.auth.signOut()
              localStorage.removeItem('lc_visitor_email')
              window.location.href = '/signin'
            }}
            style={{ fontSize: '11px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}
          >
            Sign out
          </button>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '20px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800,
            color: 'rgba(255,255,255,0.92)', marginBottom: '8px',
          }}>
            Your Capsules
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {userEmail}
          </p>
        </div>

        {/* Capsule list */}
        {capsules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7, marginBottom: '20px' }}>
              You don't have any capsules yet.
            </p>
            <Link href="/book" style={{
              display: 'inline-block', padding: '12px 28px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
              color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
              letterSpacing: '0.04em',
            }}>
              Create Your First Capsule
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {capsules.map(cap => (
              <Link
                key={cap.id}
                href={`/manage/${cap.slug}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  padding: '18px 20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(226,195,107,0.12)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{
                      fontSize: '15px', fontWeight: 700,
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Playfair Display', serif",
                      margin: 0, marginBottom: '4px',
                    }}>
                      {cap.honouree_name}
                    </p>
                    <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>
                      {cap.event_type}
                      {cap.event_tag ? ` · ${cap.event_tag}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", margin: 0 }}>
                      {cap.approved_contrib_count}
                    </p>
                    <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>tributes</p>
                  </div>
                </div>
              </Link>
            ))}

            {/* Create another */}
            <Link
              href="/book"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '14px', borderRadius: '12px',
                border: `1px dashed rgba(226,195,107,0.18)`,
                background: 'transparent',
                color: 'rgba(226,195,107,0.5)',
                fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '0.04em',
              }}
            >
              + Create Another Capsule
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
