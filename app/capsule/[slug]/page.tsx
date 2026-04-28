"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CapsulePage({ params }: any) {
  const [slug, setSlug] = useState<string | null>(null)

  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])

  const [isAdmin, setIsAdmin] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  // unwrap params
  useEffect(() => {
    const unwrap = async () => {
      const p = await params
      setSlug(p.slug)
    }
    unwrap()
  }, [params])

  // admin check
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user?.email === "revoworldtech@gmail.com") {
        setIsAdmin(true)
      }
    }
    check()
  }, [])

  // load capsule
  useEffect(() => {
    if (!slug) return
    loadCapsule(slug)
  }, [slug])

  const loadCapsule = async (slugValue: string) => {
    const { data } = await supabase
      .from("capsules")
      .select("*")
      .eq("slug", slugValue)
      .single()

    if (data) {
      setCapsule(data)
      loadContributions(data.id)
    }
  }

  const loadContributions = async (capsuleId: string) => {
    const { data } = await supabase
      .from("contributions")
      .select("*")
      .eq("capsule_id", capsuleId)
      .order("created_at", { ascending: false })

    if (data) setContributions(data)
  }

  // submit
  const handleSubmit = async () => {
    if (!name || !email || !content || !capsule) return

    localStorage.setItem("user_email", email)
    setUserEmail(email)

    await supabase.from("contributions").insert([
      {
        name,
        email,
        content,
        capsule_id: capsule.id,
      },
    ])

    setName("")
    setEmail("")
    setContent("")

    alert("Submitted and awaiting approval")

    loadContributions(capsule.id)
  }

  // approve
  const handleApprove = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    loadContributions(capsule.id)
  }

  // update
  const handleUpdate = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ content: editContent })
      .eq("id", id)

    setEditingId(null)
    setEditContent("")

    loadContributions(capsule.id)
  }

  // delete
  const handleDelete = async (id: string) => {
    await supabase.from("contributions").delete().eq("id", id)
    loadContributions(capsule.id)
  }

  // login
  const handleAdminLogin = async () => {
    await supabase.auth.signInWithOtp({
      email: "revoworldtech@gmail.com",
    })
  }

  if (!capsule) return <p className="p-6">Loading...</p>

  return (
    <main className="p-8 max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">{capsule.name}</h1>

      <p className="text-sm text-gray-600">
        Share your tribute and memories.
      </p>

      <Button onClick={handleAdminLogin}>Login as Admin</Button>

      {/* FORM */}
      <div className="space-y-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Your message" value={content} onChange={(e) => setContent(e.target.value)} />
        <Button onClick={handleSubmit}>Submit Tribute</Button>
      </div>

      {/* WALL */}
      <div className="space-y-4">
        {contributions
          .filter((c) => {
            if (isAdmin) return true
            if (c.status === "approved") return true
            if (c.email === userEmail) return true
            return false
          })
          .map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5 space-y-2">
                <p className="font-semibold">{c.name}</p>

                {editingId === c.id ? (
                  <>
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <Button onClick={() => handleUpdate(c.id)}>Save</Button>
                  </>
                ) : (
                  <p className="text-sm">{c.content}</p>
                )}

                {/* STATUS LABEL */}
                <p className={`text-xs ${
                  c.status === "approved"
                    ? "text-green-600"
                    : "text-yellow-500"
                }`}>
                  {c.status === "approved" ? "Approved" : "Pending"}
                </p>

                <p className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </p>

                {/* ADMIN CONTROLS ALWAYS AVAILABLE */}
                {isAdmin && (
                  <div className="flex gap-2 mt-2">
                    {c.status !== "approved" && (
                      <Button size="sm" onClick={() => handleApprove(c.id)}>
                        Approve
                      </Button>
                    )}

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

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  )
}