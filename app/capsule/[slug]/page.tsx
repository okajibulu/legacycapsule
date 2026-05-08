"use client"

{/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */}
import { useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

{/* =========================================================
   SECTION 2 — CONFIG
========================================================= */}
const ADMIN_EMAIL = "revoworldtech@gmail.com"

{/* =========================================================
   SECTION 2A — COUNTRY LIST
========================================================= */}
const COUNTRIES = [
  "Nigeria", "United Kingdom", "Germany", "Canada", "United States",
  "Ghana", "Kenya", "South Africa", "France", "Italy", "Spain",
  "Netherlands", "Sweden", "Norway", "Denmark", "China", "India",
  "Brazil", "Mexico", "Australia", "Japan", "South Korea", "Not Listed",
]

{/* =========================================================
   SECTION 3 — COMPONENT
========================================================= */}
import { use } from "react"

export default function CapsulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
 
  {/* =========================================================
     SECTION 4 — ROUTING
  ========================================================= */}

  {/* =========================================================
     SECTION 5 — STATE (CORE)
  ========================================================= */}
  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])

  {/* =========================================================
     SECTION 6 — STATE (FORM)
  ========================================================= */}
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [content, setContent] = useState("")
  const [countryQuery, setCountryQuery] = useState("")
  const [showCountryList, setShowCountryList] = useState(false)

  {/* =========================================================
     SECTION 7 — STATE (UI)
  ========================================================= */}
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const countryRef = useRef<HTMLDivElement | null>(null)

  {/* =========================================================
     SECTION 8 — EFFECT: LOAD EMAIL
  ========================================================= */}
  useEffect(() => {
    const savedEmail = localStorage.getItem("lc_email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

  {/* =========================================================
     SECTION 9 — EFFECT: SAVE EMAIL
  ========================================================= */}
  useEffect(() => {
    if (email.includes("@")) {
      localStorage.setItem("lc_email", email)
    }
  }, [email])

  {/* =========================================================
     SECTION 10 — EFFECT: ADMIN
  ========================================================= */}
  useEffect(() => {
    setIsAdmin(email === ADMIN_EMAIL)
  }, [email])

  {/* =========================================================
     SECTION 10A — EFFECT: CLOSE COUNTRY DROPDOWN ON OUTSIDE CLICK
  ========================================================= */}
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryList(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  {/* =========================================================
     SECTION 11 — LOAD CAPSULE
  ========================================================= */}
  useEffect(() => {
    if (!slug) return

    const loadCapsule = async () => {
      const { data } = await supabase
        .from("capsules")
        .select("*")
        .eq("slug", slug)
        .single()

      if (data) {
        setCapsule(data)
        loadContributions(data.id)
      }
    }

    loadCapsule()
  }, [slug])

  {/* =========================================================
     SECTION 12 — LOAD CONTRIBUTIONS
  ========================================================= */}
  const loadContributions = async (capsuleId: string) => {
const { data } = await supabase
  .from("contributions")
  .select("*")
  .eq("capsule_id", capsuleId)
  .in("status", ["approved", "pending_review"])
  .order("created_at", { ascending: false })

    if (data) setContributions(data)
  }

  {/* =========================================================
     SECTION 13 — VALIDATION
  ========================================================= */}
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) newErrors.name = "Name is required"
    else if (name.length > 50) newErrors.name = "Max 50 characters"

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email"
    } else if (email.length > 100) {
      newErrors.email = "Max 100 characters"
    }

    if (!city.trim()) newErrors.city = "City is required"
    else if (city.length > 50) newErrors.city = "Max 50 characters"

    if (!country.trim()) newErrors.country = "Country is required"

    if (!content.trim()) newErrors.content = "Message required"
    else if (content.length > 500) newErrors.content = "Max 500 characters"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  {/* =========================================================
     SECTION 14 — SUBMIT HANDLER
  ========================================================= */}
  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!capsule) return

    const now = Date.now()
    if (lastSubmitTime && now - lastSubmitTime < 10000) {
      alert("Please wait a moment before submitting again.")
      return
    }

    const isDuplicate = contributions.some(
      (c) =>
        c.email?.toLowerCase() === email?.toLowerCase() &&
        c.tribute_text?.trim().toLowerCase() === content.trim().toLowerCase()
    )
    if (isDuplicate) {
      alert("You have already submitted this message.")
      return
    }

    const { error } = await supabase.from("contributions").insert([
      {
  name,
  email,
  city,
  country,
  tribute_text: content,
  capsule_id: capsule.id,
  status: "pending_review"
},
    ])

    if (error) {
      alert(error.message)
      return
    }

    localStorage.setItem("lc_email", email)
    setLastSubmitTime(now)
    setName("")
    setCity("")
    setCountry("")
    setCountryQuery("")
    setContent("")
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 3500)

    loadContributions(capsule.id)
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 200)
  }

  {/* =========================================================
     SECTION 15 — UPDATE
  ========================================================= */}
  const handleUpdate = async (id: string) => {
    const item = contributions.find((c) => c.id === id)
    if (!item) return

    const isOwner = item.email?.toLowerCase() === email?.toLowerCase()
    const canEdit = isAdmin || (item.status === "pending_review" && isOwner)

    if (!canEdit) {
      alert("You are not allowed to edit this message.")
      return
    }

    const { error } = await supabase
      .from("contributions")
      .update({ tribute_text: editContent })
      .eq("id", id)

    if (error) { alert(error.message); return }

    setEditingId(null)
    setEditContent("")
    loadContributions(capsule.id)
  }

  {/* =========================================================
     SECTION 16 — APPROVE
  ========================================================= */}
  const handleApprove = async (id: string) => {
    await supabase.from("contributions").update({ status: "approved" }).eq("id", id)
    loadContributions(capsule.id)
  }

  {/* =========================================================
     SECTION 17 — HELPERS
  ========================================================= */}
  const isOwner = (c: any) => c.email?.toLowerCase() === email?.toLowerCase()
  const isPending = (c: any) => c.status === "pending_review" || c.status === "pending"
  const canEdit = (c: any) => isAdmin || (isOwner(c) && isPending(c))

  {/* =========================================================
     SECTION 18 — ORDERED CONTRIBUTIONS
  ========================================================= */}
  const visibleContributions = contributions.filter((c) => {
    if (isAdmin) return true
    return c.status === "approved" || isOwner(c)
  })

  const orderedContributions = isAdmin
    ? visibleContributions.slice().sort((a, b) => {
        if (isPending(a) && !isPending(b)) return -1
        if (!isPending(a) && isPending(b)) return 1
        return 0
      })
    : visibleContributions

  {/* =========================================================
     SECTION 19 — STYLE CONSTANTS

     All input fields share one canonical class string.
     The country dropdown inherits the same base.
  ========================================================= */}

  // ── Gold-glow input ────────────────────────────────────────
  const inputBase = [
    // layout & text
    "w-full text-sm px-3 py-1.5 rounded-lg",
    "text-white placeholder:text-yellow-200/60",
    // background
    "bg-white/10 backdrop-blur-sm",
    // border
    "border border-yellow-400/50",
    // default glow (always visible)
    "shadow-[0_0_6px_rgba(234,179,8,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
    // hover
    "hover:border-yellow-300/80 hover:bg-white/15",
    "hover:shadow-[0_0_12px_rgba(234,179,8,0.60),inset_0_1px_0_rgba(255,255,255,0.10)]",
    // focus
    "focus:outline-none focus:border-yellow-300",
    "focus:bg-white/20",
    "focus:shadow-[0_0_0_2px_rgba(234,179,8,0.25),0_0_16px_rgba(234,179,8,0.70),inset_0_1px_0_rgba(255,255,255,0.12)]",
    // transition
    "transition-all duration-200",
  ].join(" ")

  // ── H1 — title over any image backdrop ────────────────────
  //    Multiple layered drop-shadows create legibility on both
  //    light and dark photos without a fixed background colour.
  const h1Style = [
    "text-center font-extrabold tracking-widest uppercase",
    "text-2xl md:text-3xl lg:text-4xl",
    "text-yellow-100",
    // dark halo (readability on bright images)
    "[text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_0_30px_rgba(0,0,0,0.7)]",
    // gold luminescence
    "drop-shadow-[0_0_8px_rgba(234,179,8,0.85)]",
    "drop-shadow-[0_0_20px_rgba(234,179,8,0.55)]",
  ].join(" ")

  // ── H2 — "Tribute Wall" section heading ───────────────────
  const h2Style = [
    "text-center font-bold tracking-widest uppercase",
    "text-lg md:text-xl",
    "text-yellow-100",
    "[text-shadow:0_2px_8px_rgba(0,0,0,0.95),0_0_20px_rgba(0,0,0,0.7)]",
    "drop-shadow-[0_0_6px_rgba(234,179,8,0.75)]",
  ].join(" ")

  {/* =========================================================
     SECTION 20 — RENDER
  ========================================================= */}
  return (
    <main className="h-screen flex flex-col w-full max-w-lg mx-auto bg-gradient-to-b from-[#0a0010] to-[#100018]">

      {/* ── FIXED HERO + FORM PANEL ───────────────────────── */}
      <div
        className="relative flex-shrink-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/honouree.jpg')" }}
      >
        {/* layered overlay — dark at top & bottom, semi-transparent mid */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/80 pointer-events-none" />

        {/* subtle vignette ring */}
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none rounded-none" />

        {/* gold top rule */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />

        <div className="relative z-10 px-3 pt-2 pb-2 space-y-2">

          {/* admin email tag */}
          {isAdmin && (
            <p className="text-center text-[10px] text-yellow-300/60 tracking-widest uppercase">
              Admin · {email}
            </p>
          )}

          {/* ── TITLE H1 ── */}
          <h1 className={h1Style}>
            {capsule?.honouree_name ?? "Legacy Capsule"}          </h1>

          {/* gold ornamental divider */}
          <div className="flex items-center gap-1.5 px-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-400/60" />
            <span className="text-yellow-400/80 text-xs">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-400/60" />
          </div>

          {/* ── FORM ── */}
          <div className="space-y-2">

            {/* ROW 1 — Name / Email */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Input
                  className={inputBase}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
                {errors.name && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  className={inputBase}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                />
                {errors.email && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.email}</p>}
              </div>
            </div>

            {/* ROW 2 — City / Country */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  className={inputBase}
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={50}
                />
                {errors.city && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.city}</p>}
              </div>

              {/* Country with dropdown */}
              <div className="relative" ref={countryRef}>
                <Input
                  className={inputBase}
                  placeholder="Country"
                  value={countryQuery || country}
                  maxLength={50}
                  onChange={(e) => {
                    setCountryQuery(e.target.value)
                    setCountry("")
                    setShowCountryList(true)
                  }}
                  onFocus={() => setShowCountryList(true)}
                />
                {errors.country && <p className="text-[10px] text-red-400 mt-0.5 pl-1">{errors.country}</p>}

                {showCountryList && (
                  <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto
                    bg-[#1a0d2e]/95 backdrop-blur-md border border-yellow-400/30
                    rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-sm">
                    {COUNTRIES
                      .filter((c) => c.toLowerCase().includes((countryQuery || "").toLowerCase()))
                      .slice(0, 20)
                      .map((c) => (
                        <div
                          key={c}
                          className="px-3 py-1.5 text-yellow-100/90 hover:bg-yellow-400/15
                            hover:text-yellow-200 cursor-pointer transition-colors duration-100
                            border-b border-yellow-400/10 last:border-0"
                          onClick={() => {
                            setCountry(c)
                            setCountryQuery("")
                            setShowCountryList(false)
                          }}
                        >
                          {c}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3 — Message + Submit */}
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Textarea
                  className={inputBase + " min-h-[38px] max-h-[80px] resize-none leading-snug py-2"}
                  placeholder="Leave your tribute message…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-0.5 px-1">
                  {errors.content
                    ? <p className="text-[10px] text-red-400">{errors.content}</p>
                    : <span />}
                  <span className={`text-[10px] ${content.length > 450 ? "text-yellow-400" : "text-white/30"}`}>
                    {content.length}/500
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="flex-shrink-0 mt-0.5 px-4 py-2 rounded-lg font-bold text-sm
                  bg-gradient-to-b from-yellow-400 to-yellow-500
                  text-purple-950
                  border border-yellow-300/60
                  shadow-[0_0_12px_rgba(234,179,8,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]
                  hover:from-yellow-300 hover:to-yellow-400
                  hover:shadow-[0_0_20px_rgba(234,179,8,0.8)]
                  active:scale-[0.97] active:shadow-[0_0_8px_rgba(234,179,8,0.4)]
                  transition-all duration-150"
              >
                Submit
              </button>
            </div>

            {/* Success toast */}
            {submitSuccess && (
              <div className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5
                text-yellow-200 text-xs text-center tracking-wide animate-fade-in">
                ✦ Your tribute has been received — thank you.
              </div>
            )}
          </div>

          {/* ── TRIBUTE WALL HEADING H2 ── */}
          <div className="pt-0.5 pb-0">
            <h2 className={h2Style}>
              Tribute Wall{" "}
              <span className="text-yellow-400/70 font-normal normal-case tracking-normal">
                · {contributions.length}
              </span>
            </h2>
            {/* gold rule below h2 */}
            <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          </div>

        </div>
      </div>

      {/* ── SCROLLABLE TRIBUTE CARDS ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-0 space-y-1">


        {orderedContributions.length === 0 && (
          <p className="text-center text-white/30 text-sm pt-10 tracking-wide">
            Be the first to leave a tribute.
          </p>
        )}

        {orderedContributions.map((c) => (
          <Card
            key={c.id}
            className={`w-full rounded-lg border backdrop-blur-sm transition-all duration-200 ${
              isOwner(c)
                ? "border-yellow-400/50 bg-yellow-400/5 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                : "border-white/10 bg-white/5"
            }`}
          >
            <CardContent className="py-0 px-2.5 space-y-0.5">

              {/* card header */}
              <div className="flex justify-between items-start gap-0.5">
<div className="flex justify-between items-center gap-1 w-full">
  <span className="text-xs font-semibold text-yellow-100 truncate max-w-[100px]">
    {c.name}
    {isOwner(c) && (
      <span className="ml-1.5 text-[9px] font-normal text-yellow-400/70 uppercase tracking-widest">
        You
      </span>
  
    )}
  </span>
  <span className="text-[10px] text-white/45 tracking-wide truncate flex-1 text-center px-1">
    {[c.city, c.country].filter(Boolean).join(", ")}
  </span>
  <span className="text-[10px] text-white/30 whitespace-nowrap">
      {new Date(c.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </span>
</div>
  </div>
              {/* message body */}
              {editingId === c.id ? (
                <div className="space-y-1.5">
                  <Textarea
                    className={inputBase + " text-xs min-h-[60px] resize-none"}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdate(c.id)}
                      className="text-[11px] px-3 py-1 rounded-md bg-yellow-400 text-purple-950 font-semibold
                        hover:bg-yellow-300 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditContent("") }}
                      className="text-[11px] px-3 py-1 rounded-md border border-white/20 text-white/60
                        hover:border-white/40 hover:text-white/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/80 leading-relaxed">{c.tribute_text}</p>
              )}

              {/* status + actions */}
              <div className="flex items-center gap-2 pt-0.5">
                {isPending(c) && (
                  <span className="text-[10px] text-yellow-500/80 tracking-wide uppercase">
                    · Pending approval
                  </span>
                )}
                <div className="flex gap-1.5 ml-auto">
                  {isAdmin && isPending(c) && editingId !== c.id && (
                    <button
                      onClick={() => handleApprove(c.id)}
                      className="text-[11px] px-2.5 py-0.5 rounded-md bg-green-500/20 border border-green-400/30
                        text-green-300 hover:bg-green-500/30 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {canEdit(c) && editingId !== c.id && (
                    <button
                      onClick={() => { setEditingId(c.id); setEditContent(c.tribute_text) }}
                      className="text-[11px] px-2.5 py-0.5 rounded-md border border-white/15 text-white/50
                        hover:border-yellow-400/40 hover:text-yellow-300/80 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* gold bottom rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent flex-shrink-0" />
    </main>
  )
}
