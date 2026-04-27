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
  created_by?: string | null
}

export default function Home() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [tributes, setTributes] = useState<Tribute[]>([])

  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState("")

  // INIT
  useEffect(() => {
    fetchCommunities()

    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("user_email")
      if (savedEmail) {
        setEmail(savedEmail)
        setUserEmail(savedEmail)
      }
    }
      const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    console.log("USER:", data.user)
  }

  checkUser()
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

      if (!tributesToUpdate || tributesToUpdate.length === 0) return

      const ids = tributesToUpdate.map((t) => t.id)

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

    await supabase.auth.signInWithOtp({ email })

    setName("")
    setMessage("")
    setEmail("")

    await fetchTributes(selectedCommunity.id)

    window.scrollTo({ top: 0, behavior: "smooth" })

    toast("Tribute submitted. Check your email to verify ownership.")
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

    toast("Tribute updated")
  }

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">
        {selectedCommunity?.name || "Tribute Wall"}
      </h1>

      {/* FORM */}
      <div className="space-y-3">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <Button onClick={handleSubmit}>Submit Tribute</Button>
      </div>

      {/* WALL */}
      <div className="grid gap-4">
        {tributes
          .filter((tribute) => {
            if (tribute.status === "approved") return true
            if (tribute.status === "pending" && tribute.email === userEmail) return true
            return false
          })
          .map((tribute) => (
            <Card key={tribute.id}>
              <CardContent className="p-4">
                <p className="font-semibold">{tribute.name}</p>

                {editingId === tribute.id ? (
                  <>
                    <Input
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                    />
                    <Button
                      onClick={() => handleUpdate(tribute.id)}
                      className="mt-2"
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {tribute.message}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(tribute.created_at).toLocaleString()}
                    </p>

                    {tribute.status === "pending" &&
                      tribute.email === userEmail && (
                        <>
                          <p className="text-xs text-yellow-500 mt-2">
                            Awaiting approval
                          </p>

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setEditingId(tribute.id)
                              setEditMessage(tribute.message)
                            }}
                          >
                            Edit
                          </Button>
                        </>
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