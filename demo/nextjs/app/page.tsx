"use client"

import { useEffect, useState } from "react"
import {
  useTelegram,
  useReady,
  useInitData,
  useTelegramMainButton,
  useHapticFeedback,
  useShowAlert,
  useCloudStorage,
  getUserDisplayName,
  getUserAvatarUrl,
} from "@/lib/telegram"

export default function HomePage() {
  useReady()
  const { user, colorScheme, inTelegram, isDevBypass } = useTelegram()
  const initData = useInitData()
  const { impact, notification } = useHapticFeedback()
  const showAlert = useShowAlert()
  const cloud = useCloudStorage()

  const [verified, setVerified] = useState<{ id?: number; first_name?: string } | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  // Validate initData against our server (see app/api/auth/route.ts)
  useEffect(() => {
    if (!initData) return
    fetch("/api/auth", {
      method: "POST",
      headers: { Authorization: `tma ${initData}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setVerified)
      .catch(() => setVerified(null))
  }, [initData])

  // Hydrate "saved count" from CloudStorage
  useEffect(() => {
    cloud.getItem("clicks").then((v) => setSavedCount(Number(v) || 0))
  }, [cloud])

  useTelegramMainButton({
    text: "Continue ✨",
    onClick: async () => {
      impact("medium")
      const next = savedCount + 1
      setSavedCount(next)
      await cloud.setItem("clicks", String(next))
      notification("success")
      await showAlert(`You clicked ${next} times!`)
    },
  })

  return (
    <main
      data-theme={colorScheme}
      className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 text-center"
      style={{ paddingBottom: "calc(96px + var(--tg-safe-area-inset-bottom, 0px))" }}
    >
      <img
        src={getUserAvatarUrl(user ?? undefined)}
        alt={getUserDisplayName(user ?? undefined)}
        className="size-20 rounded-full border border-border shadow-sm"
      />

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Hello, {getUserDisplayName(user ?? undefined)} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Powered by{" "}
          <a
            href="https://www.npmjs.com/package/@mr-m/tg-kit"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            @mr-m/tg-kit
          </a>
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-left text-sm">
        <Stat label="Color scheme" value={colorScheme} />
        <Stat label="In Telegram" value={String(inTelegram)} />
        <Stat label="Dev mode" value={String(isDevBypass)} />
        <Stat label="Cloud clicks" value={String(savedCount)} />
      </div>

      <div className="w-full max-w-sm rounded-md border bg-card p-3 text-left text-xs">
        <div className="text-muted-foreground mb-1">Server-validated initData</div>
        <pre className="overflow-auto">
          {verified
            ? JSON.stringify(verified, null, 2)
            : "Awaiting /api/auth response…"}
        </pre>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
