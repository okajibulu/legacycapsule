"use client"

{/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */}
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
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
   SECTION 7 — STATE (UI)
========================================================= */}
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
   SECTION 13 — SUBMIT
========================================================= */}
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // NAME
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    // EMAIL
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address"
    }

    // CITY (always required)
    if (!city.trim()) {
      newErrors.city = "City is required"
    } else if (country === "Not Listed" && city.trim().length < 2) {
      newErrors.city = "Enter a valid city for mapping"
    }

    // COUNTRY (still required)
    if (!country.trim()) {
      newErrors.country = "Country is required"
    }

    // MESSAGE
    if (!content.trim()) {
      newErrors.content = "Message cannot be empty"
    }

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

  if (error) {
    alert(error.message)
    return
  }

  // Clear form
  setName("")
  setCity("")
  setCountry("")
  setContent("")

  // Reload contributions
  loadContributions(capsule.id)
}

{/* =========================================================
   SECTION 15 — UPDATE
========================================================= */}
  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("contributions")
      .update({ content: editContent })
      .eq("id", id)

    if (!error) {
      setEditingId(null)
      loadContributions(capsule.id)
    }
  }

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
    return c.email?.toLowerCase() === email?.toLowerCase()
  }

  const canEdit = (c: any) => {
    // Admin can edit everything
    if (isAdmin) return true

    // Owner can only edit BEFORE approval
    const isPending =
      c.status === "pending_review" || c.status === "pending"

    return isPending && isOwner(c)
  }

{/* =========================================================
   SECTION 18 — UI: ROOT LAYOUT (FIXED HEADER + SCROLL BODY)
========================================================= */}
return (
  <main className="h-screen flex flex-col max-w-md mx-auto">

    {/* FIXED TOP SECTION */}
    <div className="p-2 space-y-2 border-b bg-white">

      {/* HEADER */}
      <p className="text-xs text-red-500">
        Logged on as: {email || "Guest"} {isAdmin ? "(Admin)" : ""}
      </p>

      <h1 className="text-lg font-semibold">
        {capsule?.name || "Loading..."}
      </h1>
   </div>
    {/* =========================================================
       SECTION 20 — UI: FORM (COMPACT GRID)
    ========================================================= */}

    {/* LINE 1 */}
    <div className="grid grid-cols-2 gap-2">
      <Input
        className="w-full text-sm px-2 py-1"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        className="w-full text-sm px-2 py-1"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    {/* LINE 2 */}
    <div className="grid grid-cols-2 gap-2">
      <Input
        className="w-full text-sm px-2 py-1"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

 { /* COUNTRY (SEARCHABLE COMBOBOX) */}
<div className="relative">
  <Input
    className="w-full text-sm px-2 py-1"
    placeholder="Country"
    value={countryQuery || country}
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

    {/* LINE 3 */}
    <div className="flex gap-2">
     <Textarea
  className="flex-1 text-sm px-3 py-[3x] min-h-[36px]"
        placeholder="Message"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <Button className="h-auto px-3" onClick={handleSubmit}>
        Submit
      </Button>
    </div>

    {/* TITLE */}
<div className="flex justify-between items-center pt-1">
  <p className="text-sm font-semibold">
    Tribute Wall
  </p>

  <p className="text-xs text-gray-500">
    {contributions.length} tributes
  </p>
</div>

  </div>

{/* =========================================================
   SECTION 21 — TRIBUTE WALL (SCROLLABLE)
========================================================= */}
 {/* SCROLL AREA */}
  <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2">

    {contributions
      .filter((c) => {
        if (isAdmin) return true

        const isOwner =
          c.email?.toLowerCase() === email?.toLowerCase()

        return c.status === "approved" || isOwner
      })
      .map((c) => {
        return (
          <Card key={c.id}>
            <CardContent className="py-1 px-2 space-y-[2px]">

              <div className="flex justify-between text-xs">
                <span>{c.name}</span>
                <span>{c.city}, {c.country}</span>
                <span>
                  {new Date(c.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="text-sm">{c.content}</p>

              {(c.status === "pending_review" || c.status === "pending") && (
                <p className="text-[11px] text-yellow-600">
                  Pending approval
                </p>
              )}

              {/* ACTIONS */}
              <div className="flex gap-2">
                {isAdmin && (c.status === "pending_review" || c.status === "pending") ? (
                  <Button size="sm" onClick={() => handleApprove(c.id)}>
                    Approve
                  </Button>
                ) : null}

                {(isAdmin ||
                  ((c.status === "pending_review" || c.status === "pending") &&
                    c.email?.toLowerCase() === email?.toLowerCase())) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(c.id)
                      setEditContent(c.content)
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </div>

            </CardContent>
          </Card>
        )
      })}

  </div>
</main>
  )
}
