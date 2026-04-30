"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

const ADMIN_EMAIL = "revoworldtech@gmail.com"

export default function AdminPage() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (loading) return

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
  email: ADMIN_EMAIL,
  options: {
    emailRedirectTo: "http://localhost:3000/capsule/test-capsule",
  },
})

    if (error) {
      console.log("LOGIN ERROR:", error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage("Secure login link sent to your email.")
  }

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Admin Login</h1>

      <p className="text-sm text-gray-600">
        Login to manage tributes
      </p>

      <Button onClick={handleLogin} disabled={loading}>
        {loading ? "Sending..." : "Login as Admin"}
      </Button>

      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  )
}