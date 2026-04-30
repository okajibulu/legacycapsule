"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Community = {
  id: string
  name: string
}

type Tribute = {
  id: string
  name: string
  message: string
  email: string
  status: string
  community_id: string
  created_at: string
  created_by: string | null
}

export default function Home() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [tributes, setTributes] = useState<Tribute[]>([])

  const [isAdmin, setIsAdmin] = useState(false)

  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState("")

  // INIT
  useEffect(() => {
    fetchCommunities()

    const savedEmail = localStorage.getItem("user_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setUserEmail(savedEmail)
    }
  }, [])

  // ADMIN CHECK
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

  // OWNERSHIP BINDING
  useEffect(() => {
    const bindUserToTributes = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user || !user.email) return

      const { data: tributesToUpdate } = await supabase
        .from("tributes")
        .select("id")
        .eq("email", user.email)
        .is("created_by", null)

      if (!tributesToUpdate?.length) return

      const ids = tributesToUpdate.map(t => t.id)

      await supabase
        .from("tributes")
        .update({ created_by: user.id })
        .in("id", ids)

      if (selectedCommunity) {
        fetchTributes(selectedCommunity.id)
      }
    }

    bindUserToTributes()
  }, [selectedCommunity])

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .limit(1)

    if (data && data.length > 0) {
      setCommunities(data)
      setSelectedCommunity(data[0])
      fetchTributes(data[0].id)
    }
  }

  const fetchTributes = async (communityId: string) => {
    const { data } = await supabase
      .from("tributes")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })

    if (data) setTributes(data)
  }

  const handleSubmit = async () => {
    if (!name || !message || !email || !selectedCommunity) {
      toast("Please fill all fields")
      return
    }

    localStorage.setItem("user_email", email)
    setUserEmail(email)

    const { error } = await supabase.from("tributes").insert([
      {
        name,
        message,
        email,
        status: "pending",
        community_id: selectedCommunity.id,
      },
    ])

    if (error) {
      toast("Error submitting tribute")
      return
    }

    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      await supabase.auth.signInWithOtp({ email })
      toast("Check your email to verify ownership.")
    } else {
      toast("Tribute submitted successfully.")
    }

    setName("")
    setMessage("")
    setEmail("")

    await fetchTributes(selectedCommunity.id)
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("tributes")
      .update({ message: editMessage })
      .eq("id", id)

    if (error) {
      toast("Error updating tribute")
      return
    }

    setEditingId(null)
    setEditMessage("")

    if (selectedCommunity) {
      fetchTributes(selectedCommunity.id)
    }
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("tributes")
      .update({ status: "approved" })
      .eq("id", id)

    if (error) {
      toast("Error approving tribute")
      return
    }

    if (selectedCommunity) {
      fetchTributes(selectedCommunity.id)
    }

    toast("Tribute approved")
  }

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">
        {selectedCommunity?.name || "Tribute Wall"}
      </h1>

      {/* FORM */}
      <div className="space-y-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={handleSubmit}>Submit Tribute</Button>
      </div>

      {/* WALL */}
      <div className="grid gap-4">
        {tributes
          .filter((t) => {
            if (isAdmin) return true
            if (t.status === "approved") return true
            if (t.status === "pending" && t.email === userEmail) return true
            return false
          })
          .map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{t.name}</p>

                {editingId === t.id ? (
                  <>
                    <Input value={editMessage} onChange={(e) => setEditMessage(e.target.value)} />
                    <Button onClick={() => handleUpdate(t.id)} className="mt-2">Save</Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm">{t.message}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</p>

                    {t.status === "pending" && t.email === userEmail && (
                      <Button size="sm" className="mt-2" onClick={() => {
                        setEditingId(t.id)
                        setEditMessage(t.message)
                      }}>
                        Edit
                      </Button>
                    )}

                    {isAdmin && t.status === "pending" && (
                      <Button size="sm" className="mt-2 ml-2" onClick={() => handleApprove(t.id)}>
                        Approve
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  )
}