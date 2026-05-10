import { NextRequest, NextResponse } from "next/server"
import { sendContributorVerification } from "@/lib/verification"

export async function POST(req: NextRequest) {
  const { email, contributorName, contributionId, honoreeName, capsuleSlug } = await req.json()

  try {
    await sendContributorVerification({
      email, contributorName, contributionId, honoreeName, capsuleSlug
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}