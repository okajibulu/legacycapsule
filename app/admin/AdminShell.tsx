'use client'

/* =========================================================
   AdminShell — client component for sidebar + session check
   Wraps all /admin/* pages
========================================================= */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.5)'
const goldFaint = 'rgba(226,195,107,0.12)'
const bg = '#0a0618'
const cardBg = 'rgba(255,255,255,0.03)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.3)'

const NAV_ITEMS = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: '◈' },
  { href: '/admin/capsule',    label: 'Capsules',     icon: '◎' },
  { href: '/admin/clients',     label: 'Clients',      icon: '◇' },
  { href: '/admin/moderation',  label: 'Moderation',   icon: '◉' },
  { href: '/admin/pricing',     label: 'Pricing',      icon: '◆' },
  { href: '/admin/flags',       label: 'Flags',        icon: '◐' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (isLoginPage) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop sidebar */}
      <aside className="lca-sidebar" style={{
        width: '220px', flexShrink: 0, background: 'rgba(255,255,255,0.02)',
        borderRight: `1px solid ${goldFaint}`, padding: '20px 0',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 40, overflowY: 'auto',
      }}>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.7)' }} onClick={() => setSidebarOpen(false)} />
      )}
      <aside className="lca-sidebar-mobile" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px',
        background: bg, borderRight: `1px solid ${goldFaint}`, padding: '20px 0',
        zIndex: 50, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main content area */}
      <div className="lca-main" style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }}>
        {/* Mobile top bar */}
        <div className="lca-topbar" style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 38,
          background: 'rgba(10,6,24,0.97)', backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${goldFaint}`, padding: '10px 16px',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: gold, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>☰</button>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: gold }}>LCADMIN</span>
          <div style={{ width: '28px' }} />
        </div>

        <div style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        .lca-sidebar { display: flex; }
        .lca-sidebar-mobile { display: flex; }
        .lca-topbar { display: none !important; }
        .lca-main { margin-left: 220px; }
        @media (max-width: 768px) {
          .lca-sidebar { display: none !important; }
          .lca-topbar { display: flex !important; }
          .lca-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}

function SidebarContent({ pathname }: { pathname: string | null }) {
  return (
    <>
      <div style={{ padding: '0 16px 20px', borderBottom: `1px solid ${goldFaint}` }}>
        <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.16em', color: gold }}>LC</span>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint }}>ADMIN</span>
        </Link>
        <p style={{ fontSize: '10px', color: textFaint, marginTop: '4px', letterSpacing: '0.06em' }}>RevoWorldTech</p>
      </div>

      <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname?.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              background: active ? goldFaint : 'transparent',
              color: active ? gold : textFaint,
              fontSize: '13px', fontWeight: active ? 700 : 500,
              textDecoration: 'none', transition: 'all 0.15s',
              letterSpacing: '0.02em',
            }}>
              <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: `1px solid ${goldFaint}` }}>
        <Link href="/" style={{ fontSize: '11px', color: textFaint, textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Back to site</Link>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" style={{ fontSize: '11px', color: 'rgba(248,113,113,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign Out</button>
        </form>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Valnex LDA · RevoWorldTech</p>
      </div>
    </>
  )
}
