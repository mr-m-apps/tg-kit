import { NextResponse } from "next/server"
import { validateInitData } from "@mr-m/tg-kit/server"

export const runtime = "edge"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

export async function POST(req: Request) {
  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 500 },
    )
  }

  const auth = req.headers.get("authorization") ?? ""
  const initData = auth.startsWith("tma ") ? auth.slice(4) : ""

  if (!initData) {
    return NextResponse.json({ error: "missing initData" }, { status: 400 })
  }

  const result = await validateInitData(initData, BOT_TOKEN, {
    runtime: "edge",
    maxAgeSeconds: 3600,
  })

  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 401 })
  }

  return NextResponse.json(result.user)
}
