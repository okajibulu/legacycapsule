"use client"

import Link from "next/link"

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#0a0010] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-yellow-100 tracking-widest uppercase">
            LCAdmin
          </h1>
          <p className="text-xs text-white/40">LegacyCapsule Administration</p>
        </div>

        <div className="space-y-2">
          {[
            { label: "Pricing Configuration", href: "/admin/pricing",
              desc: "Edit all product prices" },
            { label: "Feature Flags",          href: "/admin/flags",
              desc: "Toggle platform features" },
            { label: "Tribute Moderation",     href: "/for/dr-adeyemi-okonkwo-retirement",
              desc: "Enter admin email on tribute page to moderate" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="block px-4 py-3 rounded-xl border border-white/8
                bg-white/4 hover:border-yellow-400/20 hover:bg-yellow-400/4
                transition-all duration-150">
              <p className="text-sm font-medium text-yellow-100">{item.label}</p>
              <p className="text-xs text-white/35 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="pt-4 border-t border-white/8 text-center">
          <p className="text-[10px] text-white/20 tracking-widest uppercase">
            VALNEX, UNIPESSOAL LDA · RevoWorldTech
          </p>
        </div>

      </div>
    </main>
  )
}

