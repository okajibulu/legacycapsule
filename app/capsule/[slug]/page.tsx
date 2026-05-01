"use client"

/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/* =========================================================
   SECTION 2 — CONFIG
========================================================= */
const ADMIN_EMAIL = "revoworldtech@gmail.com"

/* =========================================================
   SECTION 3 — COMPONENT
========================================================= */
export default function CapsulePage() {

/* =========================================================
   SECTION 4 — ROUTING
========================================================= */
  const params = useParams()
  const slug = params?.slug as string

/* =========================================================
   SECTION 5 — STATE (CORE)
========================================================= */
  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])

/* =========================================================
   SECTION 6 — STATE (FORM)
========================================================= */
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [content, setContent] = useState("")

/* =========================================================
   SECTION 7 — STATE (UI)
========================================================= */
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

/* =========================================================
   SECTION 8 — EFFECT: LOAD EMAIL
========================================================= */
  useEffect(() => {
    const savedEmail = localStorage.getItem("user_email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

/* =========================================================
   SECTION 9 — EFFECT: SAVE EMAIL
========================================================= */
  useEffect(() => {
    if (email.includes("@")) {
      localStorage.setItem("user_email", email)
    }
  }, [email])

/* =========================================================
   SECTION 10 — EFFECT: ADMIN
========================================================= */
  useEffect(() => {
    setIsAdmin(email === ADMIN_EMAIL)
  }, [email])

/* =========================================================
   SECTION 11 — LOAD CAPSULE
========================================================= */
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

/* =========================================================
   SECTION 12 — LOAD CONTRIBUTIONS
========================================================= */
  const loadContributions = async (capsuleId: string) => {
    const { data } = await supabase
      .from("contributions")
      .select("*")
      .eq("capsule_id", capsuleId)
      .order("created_at", { ascending: false })

    if (data) setContributions(data)
  }

/* =========================================================
   SECTION 13 — VALIDATION
========================================================= */
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email"

    if (!city.trim()) newErrors.city = "City is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!content.trim()) newErrors.content = "Message required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

/* =========================================================
   SECTION 14 — SUBMIT
========================================================= */
  const handleSubmit = async () => {
    if (!capsule) return

    if (!validateForm()) return

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

    setName("")
    setCity("")
    setCountry("")
    setContent("")
    setErrors({})

    loadContributions(capsule.id)
  }

/* =========================================================
   SECTION 15 — UPDATE
========================================================= */
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

/* =========================================================
   SECTION 16 — APPROVE
========================================================= */
  const handleApprove = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    loadContributions(capsule.id)
  }

/* =========================================================
   SECTION 17 — EDIT CONTROL
========================================================= */
  const canEdit = (c: any) =>
    isAdmin || (c.status === "pending_review" && c.email === email)

/* =========================================================
   SECTION 18 — UI ROOT
========================================================= */
  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">

/* =========================================================
   SECTION 19 — HEADER
========================================================= */
      <p className="text-xs text-red-500">
        Email: {email || "NONE"} | Admin: {isAdmin ? "YES" : "NO"}
      </p>

      <h1 className="text-2xl font-semibold">
        {capsule?.name || "Loading..."}
      </h1>

/* =========================================================
   SECTION 20 — FORM
========================================================= */
      <div className="space-y-2">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}

        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}

        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}

        <select
          className="w-full border rounded-md p-2 text-sm"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">Select Country</option>
          <option>Nigeria</option>
          <option>United Kingdom</option>
          <option>Germany</option>
          <option>Canada</option>
        </select>
        {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}

        <Textarea placeholder="Message" value={content} onChange={(e) => setContent(e.target.value)} />
        {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}

        <Button onClick={handleSubmit}>Submit</Button>
      </div>

/* =========================================================
   SECTION 21 — TRIBUTE WALL
========================================================= */
      <div className="space-y-2">
        {contributions.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-2 space-y-1">

              <div className="flex justify-between text-xs">
                <span>{c.name}</span>
                <span>{c.city}, {c.country}</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>

              {editingId === c.id ? (
                <>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <Button onClick={() => handleUpdate(c.id)}>Save</Button>
                </>
              ) : (
                <p>{c.content}</p>
              )}

              {isAdmin && c.status === "pending_review" && (
                <Button size="sm" onClick={() => handleApprove(c.id)}>Approve</Button>
              )}

              {canEdit(c) && (
                <Button size="sm" onClick={() => {
                  setEditingId(c.id)
                  setEditContent(c.content)
                }}>
                  Edit
                </Button>
              )}

            </CardContent>
          </Card>
        ))}
      </div>

    </main>
  )
}