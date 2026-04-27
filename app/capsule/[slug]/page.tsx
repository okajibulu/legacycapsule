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
    const unwrapParams = async () => {
      const resolved = await params
      setSlug(resolved.slug)
    }
    unwrapParams()
  }, [params])

  // check admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (user?.email === "revoworldtech@gmail.com") {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

  // load capsule
  useEffect(() => {
    if (!slug) return
    fetchCapsule(slug)
  }, [slug])

  const fetchCapsule = async (slugValue: string) => {
    const { data } = await supabase
      .from("capsules")
      .select("*")
      .eq("slug", slugValue)
      .single()

    if (data) {
      setCapsule(data)
      fetchContributions(data.id)
    }
  }

  const fetchContributions = async (capsuleId: string) => {
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

    const { error } = await supabase.from("contributions").insert([
      {
        name,
        email,
        content,
        capsule_id: capsule.id,
      },
    ])

    if (error) {
      alert("Something went wrong.")
      return
    }

    setName("")
    setEmail("")
    setContent("")

    alert("Submitted and awaiting approval.")

    fetchContributions(capsule.id)
  }

  // approve
  const handleApprove = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    if (capsule) fetchContributions(capsule.id)
  }

  // admin edit save
  const handleUpdate = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ content: editContent })
      .eq("id", id)

    setEditingId(null)
    setEditContent("")

    if (capsule) fetchContributions(capsule.id)
  }

  // admin delete
  const handleDelete = async (id: string) => {
    await supabase
      .from("contributions")
      .delete()
      .eq("id", id)

    if (capsule) fetchContributions(capsule.id)
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
      <h1 className="text-3xl font-semibold tracking-tight">
        {capsule.name}
      </h1>

      <p className="text-sm text-gray-600">
        Share your tribute and memories.
      </p>

      <Button onClick={handleAdminLogin}>
        Login as Admin
      </Button>

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
            if (c.status === "pending_review" && c.email === userEmail) return true
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

                <p className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </p>

                {c.status === "pending_review" && (
                  <p className="text-xs text-yellow-500">
                    Awaiting approval
                  </p>
                )}

                {/* ADMIN ACTIONS */}
                {isAdmin && (
                  <div className="flex gap-2 mt-2">
                    {c.status === "pending_review" && (
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