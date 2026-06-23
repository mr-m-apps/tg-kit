"use client"

import { SendIcon, ExternalLinkIcon } from "lucide-react"
import { APP_CONFIG } from "@/app/config"
import React from "react"

export function OpenInTelegram() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 text-balance px-6 py-12 text-center md:py-20"
      data-slot="empty"
    >
      <div
        className="flex max-w-sm flex-col items-center text-center"
        data-slot="empty-header"
      >
        <div
          className="relative mb-6"
          data-slot="empty-media"
          data-variant="icon"
        >
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center pointer-events-none absolute bottom-px origin-bottom-left -translate-x-0.5 -rotate-10 scale-84 shadow-none size-9 rounded-md border bg-card text-foreground"
          />
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center pointer-events-none absolute bottom-px origin-bottom-right translate-x-0.5 rotate-10 scale-84 shadow-none size-9 rounded-md border bg-card text-foreground"
          />
          
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-foreground shadow-sm relative">
            <SendIcon className="size-4.5" />
          </div>
        </div>

        <div className="font-heading font-semibold text-xl" data-slot="empty-title">
          Open in Telegram
        </div>
        
        <p
          className="text-muted-foreground text-sm mt-1"
          data-slot="empty-description"
        >
          This app works best within Telegram. Please open it in Telegram to continue.
        </p>
      </div>

      <div
        className="flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm"
        data-slot="empty-content"
      >
        <button
          onClick={() => {
            if (APP_CONFIG?.botUrl) {
              window.open(APP_CONFIG.botUrl, "_blank")
            } else {
              console.error("botUrl is not configured")
            }
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Open in Telegram
          <ExternalLinkIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
