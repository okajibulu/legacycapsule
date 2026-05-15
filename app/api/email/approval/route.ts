import { NextRequest, NextResponse } from "next/server"
import { sendApprovalNotification } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { to, contributorName, honoreeName, capsuleSlug } = await req.json()

  try {
    await sendApprovalNotification({ to, contributorName, honoreeName, capsuleSlug })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
