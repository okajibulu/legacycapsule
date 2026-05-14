'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Flag,
  UserCheck,
  FileText,
  MapPin,
  DollarSign,
  ToggleLeft,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin/dashboard',     icon: LayoutDashboard },
  { label: 'Capsules',      href: '/admin/capsules',      icon: Layers },
  { label: 'Clients',       href: '/admin/clients',       icon: Users },
  { label: 'Transactions',  href: '/admin/transactions',  icon: CreditCard },
  { label: 'Moderation',    href: '/admin/moderation',    icon: Flag },
  { label: 'Resellers',     href: '/admin/resellers',     icon: UserCheck },
  { label: 'Content',       href: '/admin/content',       icon: FileText },
  { label: 'Pricing Zones', href: '/admin/pricing-zones', icon: MapPin },
  { label: 'Pricing',       href: '/admin/pricing',       icon: DollarSign },
  { label: 'Feature Flags', href: '/admin/flags',         icon: ToggleLeft },
]

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-[#0a0010]">

      {/* SIDEBAR */}
      <aside className="w-56 flex-shrink-0 border-r border-yellow-400/10
        bg-gradient-to-b from-[#100018] to-[#0a0010] flex flex-col">

        {/* Logo area */}
        <div className="px-5 py-5 border-b border-yellow-400/10">
          <p className="text-[9px] text-yellow-400/40 tracking-widest uppercase">
            LegacyCapsule
          </p>
          <p className="text-sm font-bold text-yellow-100 tracking-wide mt-0.5">
            LCAdmin
          </p>
          <p className="text-[9px] text-white/20 tracking-wide mt-0.5">
            RevoWorldTech
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                  transition-all duration-150 group
                  ${
                    active
                      ? 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Icon
                  size={14}
                  className={
                    active
                      ? 'text-yellow-400'
                      : 'text-white/25 group-hover:text-white/50'
                  }
                />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-yellow-400/10">
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm
                text-white/25 hover:text-red-400/80 hover:bg-red-400/5
                transition-all duration-150"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-12 flex-shrink-0 border-b border-yellow-400/10
          bg-[#0d0018]/80 backdrop-blur-sm flex items-center px-6 gap-4">
          <span className="text-xs text-white/25 tracking-widest uppercase">
            admin.revoworldtech.uk
          </span>
          <span className="ml-auto text-[10px] text-yellow-400/35 tracking-wide">
            VALNEX, UNIPESSOAL LDA · NIPC 519 379 276
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}