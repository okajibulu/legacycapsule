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
  "Nigeria",
  "United Kingdom",
  "Germany",
  "Canada",
  "United States",
  "Ghana",
  "Kenya",
  "South Africa",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Australia",
  "Japan",
  "South Korea",
  "Not Listed",
]

{/* =========================================================
   SECTION 3 — COMPONENT
========================================================= */}
export default function CapsulePage() {

{/* =========================================================
   SECTION 4 — ROUTING
========================================================= */}
  const params = useParams()
  const slug = params?.slug as string

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
   SECTION 7A — SUBMISSION CONTROL
========================================================= */}
const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null)

{/* =========================================================
   SECTION 7B — EMAIL LOCK STATE
========================================================= */}

 

{/* =========================================================
   SECTION 7 — STATE (UI)
========================================================= */}
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

{/* =========================================================
   SECTION 7B — SCROLL CONTROL
========================================================= */}
const bottomRef = useRef<HTMLDivElement | null>(null)

{/* =========================================================
   SECTION 8 — EFFECT: LOAD EMAIL
========================================================= */}
  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

{/* =========================================================
   SECTION 9 — EFFECT: SAVE EMAIL
========================================================= */}
  useEffect(() => {
    if (email.includes("@")) {
      localStorage.setItem("user_email", email)
    }
  }, [email])

{/* =========================================================
   SECTION 10 — EFFECT: ADMIN
========================================================= */}
  useEffect(() => {
    setIsAdmin(email === ADMIN_EMAIL)
  }, [email])

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
      .order("created_at", { ascending: false })

    if (data) setContributions(data)
  }

{/* =========================================================
   SECTION 6A — EMAIL PERSISTENCE
========================================================= */}
useEffect(() => {
  const savedEmail = localStorage.getItem("lc_email")
  if (savedEmail) {
    setEmail(savedEmail)
  }
}, [])

{/* =========================================================
   SECTION 13 — VALIDATION (WITH LIMITS)
========================================================= */}
const validateForm = () => {
  const newErrors: { [key: string]: string } = {}

  if (!name.trim()) newErrors.name = "Name is required"
  else if (name.length > 50) newErrors.name = "Max 50 characters"

 if (!email.trim()) {
  newErrors.email = "Email is required"
} else if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
) {
  newErrors.email = "Enter a valid email (e.g. name@email.com)"
} else if (email.length > 100) {
  newErrors.email = "Max 100 characters"
}

  if (!city.trim()) newErrors.city = "City is required"
  else if (city.length > 50) newErrors.city = "Max 50 characters"

  if (!country.trim()) newErrors.country = "Country is required"
  else if (country.length > 50) newErrors.country = "Max 50 characters"

  if (!content.trim()) newErrors.content = "Message required"
  else if (content.length > 500)
    newErrors.content = "Max 500 characters"

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

{/* =========================================================
   SECTION 14 — SUBMIT HANDLER
========================================================= */}
const handleSubmit = async () => {
  // Validate first
  if (!validateForm()) return

  if (!capsule) return

  const { error } = await supabase.from("contributions").insert([
    {
      name,
      email,
      city,
      country,
      content,
      capsule_id: capsule.id,
      status: "pending_review",
    },
  ])
// Prevent duplicate message (same user, same content)
const isDuplicate = contributions.some((c) => {
  return (
    c.email?.toLowerCase() === email?.toLowerCase() &&
    c.content?.trim().toLowerCase() === content.trim().toLowerCase()
  )
})

if (isDuplicate) {
  alert("You have already submitted this message")
  return
}

  if (error) {
    alert(error.message)
    return
  }

// Prevent rapid submissions (10 sec cooldown)
const now = Date.now()

if (lastSubmitTime && now - lastSubmitTime < 10000) {
  alert("Please wait a few seconds before submitting again")
  return
}
localStorage.setItem("lc_email", email)
 

  // Clear form
  setName("")
  setCity("")
  setCountry("")
  setContent("")

localStorage.setItem("lc_email", email)
 

  // Reload contributions
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

  const isOwner =
    item.email?.toLowerCase() === email?.toLowerCase()

  const canEdit =
    isAdmin || (item.status === "pending_review" && isOwner)

  if (!canEdit) {
    alert("You are not allowed to edit this message")
    return
  }

  const { error } = await supabase
    .from("contributions")
    .update({ content: editContent })
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  setEditingId(null)
  setEditContent("")
  loadContributions(capsule.id)
}

{/* =========================================================
   SECTION 21A — ORDERED CONTRIBUTIONS
========================================================= */}
const visibleContributions = contributions.filter((c) => {
    if (isAdmin) {
      return true
    }

    const isOwner =
      c.email?.toLowerCase() === email?.toLowerCase()

    return c.status === "approved" || isOwner
  })

  const orderedContributions = isAdmin
    ? visibleContributions.slice().sort((a, b) => {
        if (a.status === "pending_review" && b.status !== "pending_review") {
          return -1
        }

        if (b.status === "pending_review" && a.status !== "pending_review") {
          return 1
        }

        return 0
      })
    : visibleContributions
{/* =========================================================
   SECTION 16 — APPROVE
========================================================= */}
  const handleApprove = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    loadContributions(capsule.id)
  }

{/* =========================================================
   SECTION 17 — EDIT CONTROL
========================================================= */}
const isOwner = (c: any) => {
  return (
    c.email?.toLowerCase() === email?.toLowerCase()
  )
}

const isPending = (c: any) => {
  return c.status === "pending_review" || c.status === "pending"
}

const canEdit = (c: any) => {
  // Admin can always edit
  if (isAdmin) return true

  // Must be owner AND still pending
  if (!isOwner(c)) return false
  if (!isPending(c)) return false

  return true
}
{/* =========================================================
   SECTION 18 - 20 — UI: ROOT LAYOUT (FIXED HEADER + FORM)
========================================================= */}
return (
  <main className="h-screen flex flex-col w-full max-w-lg mx-auto px-2 bg-gradient-to-b from-white to-orange-50">

    {/* FIXED TOP SECTION */}
<div
  className="p-3 space-y-2 border-b shadow-sm rounded-b-lg bg-cover bg-center relative"
  style={{
    backgroundImage: `url('/honouree.jpg')`,
  }}
>

  {/* DARK OVERLAY */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 rounded-b-lg pointer-events-none"></div>

  {/* CONTENT */}
  <div className="relative z-10 space-y-2">

    {/* HEADER */}
    <p className="text-xs text-white/90 drop-shadow-sm">
      Logged on as: {email || "Guest"} {isAdmin ? "(Admin)" : ""}
    </p>

    <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow-md">
      {capsule?.name || "Loading..."}
    </h1>
    </div>

      {/* ================= FORM ================= */}

      {/* LINE 1 */}
<div className="grid grid-cols-2 gap-2 items-start">

  {/* NAME */}
  <div>
    <Input
      className="w-full text-sm px-2 py-1 bg-white/90 backdrop-blur-sm border border-white/40 focus:ring-2 focus:ring-orange-400 focus:outline-none"
      placeholder="Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      maxLength={50}
    />
    {errors.name && (
      <p className="text-xs text-red-500">{errors.name}</p>
    )}
  </div>

  {/* EMAIL */}
  <div>
    <Input
      className="w-full text-sm px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:outline-none"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={false}
      maxLength={100}
    />

    {errors.email && (
      <p className="text-xs text-red-500">{errors.email}</p>
    )}


  </div>

</div>

      {/* LINE 2 */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="w-full text-sm px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          placeholder="City"
          value={city}
          maxLength={50}
          onChange={(e) => setCity(e.target.value)}
        />

        {/* COUNTRY */}
        <div className="relative">
          <Input
            className="w-full text-sm px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="Country"
            value={countryQuery || country}
            maxLength={50}
            onChange={(e) => {
              setCountryQuery(e.target.value)
              setShowCountryList(true)
            }}
            onFocus={() => setShowCountryList(true)}
          />

          {showCountryList && (
            <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border rounded-md shadow-sm text-sm">
              {COUNTRIES
                .filter((c) =>
                  c.toLowerCase().includes((countryQuery || "").toLowerCase())
                )
                .slice(0, 20)
                .map((c) => (
                  <div
                    key={c}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
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

          {country === "Not Listed" && (
            <p className="text-[11px] text-gray-500">
              City will be used for map positioning
            </p>
          )}

          {errors.country && (
            <p className="text-xs text-red-500 mt-1">
              {errors.country}
            </p>
          )}
        </div>
      </div>

      {/* LINE 3 */}
      <div className="flex items-end gap-2">
        <Textarea
          className="flex-1 text-sm px-3 py-[2px] min-h-[36px]"
          placeholder="Message"
          value={content}
          maxLength={500}
          onChange={(e) => setContent(e.target.value)}
        />
<p className="text-xs text-gray-400 text-right">
  {content.length}/500
</p>

        <Button className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-md">
  Submit
</Button>
      </div>

      {/* TITLE */}
      <div className="flex justify-between items-center pt-1">
        <p className="text-sm font-semibold">Tribute Wall</p>
        <p className="text-xs text-gray-500">
          {contributions.length} tributes
        </p>
      </div>

    </div>




{/* =========================================================
   SECTION 21 — TRIBUTE WALL (SCROLLABLE)
========================================================= */}
 {/* SCROLL AREA */}
  <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 relative">

  {/* FADE */}
  <div className="sticky top-0 h-6 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none"></div>

  {orderedContributions.map((c) => (
    <Card
      key={c.id}
      className={`w-full backdrop-blur-sm bg-white/85 border ${
        isOwner(c)
          ? "border-orange-400 shadow-md"
          : "border-white/40 shadow-sm"
      } rounded-xl`}
    >
      <CardContent className="py-2 px-3 space-y-1">

        <div className="flex justify-between items-center text-xs font-semibold text-gray-900">
          <span className="truncate max-w-[40%]">
            {c.name}
            {isOwner(c) && (
              <span className="text-[10px] text-orange-500 ml-1">(You)</span>
            )}
          </span>

          <span className="text-gray-700">
            {[c.city, c.country].filter(Boolean).join(", ")}
          </span>

          <span className="text-gray-400 text-[11px]">
            {new Date(c.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <p className="text-sm text-gray-800 leading-snug">
          {c.content}
        </p>

        {(c.status === "pending_review" || c.status === "pending") && (
          <p className="text-[11px] text-orange-600 font-medium">
            Pending approval
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {isAdmin && (c.status === "pending_review" || c.status === "pending") && (
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => handleApprove(c.id)}
            >
              Approve
            </Button>
          )}

          {(isAdmin ||
            ((c.status === "pending_review" || c.status === "pending") &&
              c.email?.toLowerCase() === email?.toLowerCase())) && (
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300"
              onClick={() => {
                setEditingId(c.id)
                setEditContent(c.content)
              }}
            >
              Edit
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  ))}

  <div ref={bottomRef} />

</div>
</main>
  )
}