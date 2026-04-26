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
  community_id: string
  created_at: string
}

export default function Home() {
  const [community, setCommunity] = useState<Community | null>(null)
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchCommunity()
  }, [])

  const fetchCommunity = async () => {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .limit(1)
      .single()

    if (error) {
      toast("Error loading community")
      return
    }

    setCommunity(data)
    fetchTributes(data.id)
  }

  const fetchTributes = async (communityId: string) => {
    const { data, error } = await supabase
      .from("tributes")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })

    if (error) {
      toast("Error loading tributes")
      return
    }

    if (data) setTributes(data)
  }

  const handleSubmit = async () => {
    if (!name || !message || !community) {
      toast("Missing data")
      return
    }

    const { error } = await supabase.from("tributes").insert([
      {
        name,
        message,
        community_id: community.id,
      },
    ])

    if (error) {
      toast("Error saving tribute")
      return
    }

    setName("")
    setMessage("")

    await fetchTributes(community.id)

    toast("Tribute saved!")
  }

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">
        {community ? community.name : "Loading..."}
      </h1>

      {/* FORM */}
      <div className="space-y-3">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <Button onClick={handleSubmit}>Add Tribute</Button>
      </div>

      {/* WALL */}
      <div className="grid gap-4">
        {tributes.map((tribute) => (
          <Card key={tribute.id}>
            <CardContent className="p-4">
              <p className="font-semibold">{tribute.name}</p>
              <p className="text-sm text-muted-foreground">
                {tribute.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}