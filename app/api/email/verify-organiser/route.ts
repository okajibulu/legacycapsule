import { NextRequest, NextResponse } from "next/server"
import { sendOrganiserVerification } from "@/lib/verification"

export async function POST(req: NextRequest) {
  const { email, capsuleId, capsuleSlug, honoreeName } = await req.json()

  try {
    await sendOrganiserVerification({
      email, capsuleId, capsuleSlug, honoreeName
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
