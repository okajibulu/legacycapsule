"use client"

import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const ADMIN_EMAIL = "revoworldtech@gmail.com"

export default function CapsulePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [content, setContent] = useState("")
const [isAdmin, setIsAdmin] = useState(false)

// 🔁 Load saved email on page load
useEffect(() => {
  const savedEmail = localStorage.getItem("user_email")
  if (savedEmail) {
    setEmail(savedEmail)
  }
}, [])

// 💾 Save email whenever it changes
useEffect(() => {
  if (email && email.includes("@")) {
    localStorage.setItem("user_email", email)
  }
}, [email])

  useEffect(() => {
  if (email === ADMIN_EMAIL) {
    setIsAdmin(true)
  } else {
    setIsAdmin(false)
  }
}, [email])
  // ===============================
  // LOAD CAPSULE + CONTRIBUTIONS
  // ===============================
useEffect(() => {
  if (!slug) return

  const loadCapsule = async () => {
    const { data, error } = await supabase
      .from("capsules")
      .select("*")
      .eq("slug", slug)
      .single()

    console.log("CAPSULE:", data, error)

    if (data) {
      setCapsule(data)
      loadContributions(data.id)
    }
  }

  loadCapsule()
}, [slug])

  const loadContributions = async (capsuleId: string) => {
    const { data } = await supabase
      .from("contributions")
      .select("*")
      .eq("capsule_id", capsuleId)
      .order("created_at", { ascending: false })

    console.log("DATA FROM DB:", data)

    if (data) setContributions(data)
  }

 
  // ===============================
  // SUBMIT CONTRIBUTION
  // ===============================
 const handleSubmit = async () => {
  if (!name || !email || !content || !capsule) {
    alert("Missing required fields")
    return
  }

if (!name) {
  alert("Please enter your name")
  return
}

if (!email) {
  alert("Please enter a valid email address")
  return
}

if (!content) {
  alert("Please write a tribute message")
  return
}

  const { data, error } = await supabase
    .from("contributions")
    .insert([
      {
        name,
        email,
        content,
        city,
        country,
        capsule_id: capsule.id,
        status: "pending_review",
      },
    ])
    .select()

  console.log("INSERT RESULT:", data)
  console.log("INSERT ERROR:", error)

  if (error) {
    alert(error.message)
    return
  }

  alert("Message submitted")

  setName("")
  setContent("")
  loadContributions(capsule.id)
}



  // ===============================
  // ADMIN ACTIONS
  // ===============================
  const handleApprove = async (id: string) => {
  const { error } = await supabase
    .from("contributions")
    .update({ status: "approved" })
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  loadContributions(capsule.id)
}
  const handleAdminLogin = async () => {
    await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
    })
  }

  // ===============================
  // LOADING STATE
  // ===============================
{email && (
  <div className="text-sm text-gray-600 mb-2">
    Logged in as:{" "}
    <span className="font-semibold">{email}</span>
    {isAdmin && (
      <span className="ml-2 text-green-600 font-semibold">(Admin)</span>
    )}
  </div>
)}

  // ===============================
  // UI
  // ===============================
 
if (!capsule) {
  return (
    <div className="p-6">
      <p>Loading capsule...</p>
    </div>
  )
}
 
  return (
    <main className="p-8 max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">{capsule.name}</h1>

      <p className="text-sm text-gray-600">
        Share your tribute and memories.
      </p>


{isAdmin && (
  <p className="text-xs text-green-600 font-semibold">
    Admin Mode
  </p>
)}


     {!isAdmin && (
  <>
    {/* FORM */}
    <div className="space-y-3">

      <Input
        placeholder="Your name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        placeholder="Your email (required)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        placeholder="City (required)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <Input
        placeholder="Country (optional)"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      />

      <Input
        placeholder="Your message (required)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <Button onClick={handleSubmit}>
        Submit Tribute
      </Button>

    </div>
  </>
)}
      {/* WALL */}
      <div className="space-y-4">
       
{contributions
.filter((c) => {
  if (isAdmin) return true

  if (c.status === "approved") return true

  if (
    c.status === "pending_review" &&
    c.email &&
    email &&
    c.email.toLowerCase() === email.toLowerCase()
  ) {
    return true
  }

  return false
})
  .map((c) => (
          <Card key={c.id}>
<CardContent className="p-3 space-y-1">
  <div className="flex justify-between items-start">
    <p className="font-semibold text-sm">{c.name}</p>
<p className="text-xs text-gray-500">
  {c.city || ""}{c.city && c.country ? ", " : ""}{c.country || ""}
</p>
    <p className="text-xs text-gray-400">
      {new Date(c.created_at).toLocaleDateString()}
    </p>
  </div>

  <p className="text-sm">{c.content}</p>

{isAdmin && c.status === "pending_review" && (
  <p className="text-yellow-600 text-sm">Pending approval</p>
)}

{!isAdmin &&
  c.status === "pending_review" &&
  c.email?.toLowerCase() === email?.toLowerCase() && (
    <p className="text-yellow-600 text-sm">Awaiting approval</p>
)}
 {isAdmin && (
  <Button onClick={() => handleApprove(c.id)}>
    Approve
  </Button>
)}
</CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}