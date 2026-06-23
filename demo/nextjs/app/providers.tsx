"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  useTelegram,
  TelegramProvider,
  FullscreenProvider,
  loadTelegramScript,
  useTelegramBackButton,
  installDevMode,
} from "@/lib/telegram"
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react"
import { OpenInTelegram } from "@/components/open-in-telegram"
import { Loader } from "@/components/loader"
import { APP_CONFIG } from "./config"

function TelegramInitializer() {
  const pathname = usePathname()
  const { ready, webApp, user } = useTelegram()

  useTelegramBackButton({
    pathname,
    hideOnRoot: true,
    onBack: () => {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        webApp?.close()
      }
    },
  })

  useEffect(() => {
    if (!ready || !webApp) return

    const rootStyles = getComputedStyle(document.documentElement)
    const bgColor = rootStyles.getPropertyValue("--background").trim() || "#0f0f0f"

    try {
      webApp.setHeaderColor(bgColor)
      webApp.setBackgroundColor(bgColor)

      if ("setBottomBarColor" in webApp && typeof webApp.setBottomBarColor === "function") {
        webApp.setBottomBarColor(bgColor)
      }
    } catch (error) {
      console.error("Failed to set Telegram colors:", error)
    }
  }, [ready, webApp])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useLayoutEffect(() => {
    const isProduction = process.env.NODE_ENV === "production"
    const isDevModeEnabled = new URLSearchParams(window.location.search).has("tg_dev")

    if (!isProduction || isDevModeEnabled) {
      const installed = installDevMode({
        showIndicator: !isProduction,
        force: isDevModeEnabled,
      })
      if (installed) {
        console.log("[tg-kit] Dev mode activated")
      }
    }

    loadTelegramScript()
      .then(() => {
        setScriptLoaded(true)
      })
      .catch((error) => {
        console.error("Failed to load Telegram script:", error)
        setScriptLoaded(true)
      })
  }, [])

  if (!scriptLoaded) {
    return <Loader />
  }

  return (
    <TonConnectUIProvider
      manifestUrl={APP_CONFIG.manifestTonUrl}
      actionsConfiguration={{
        twaReturnUrl: APP_CONFIG.miniAppUrl,
      }}
      uiPreferences={{
        theme: THEME.DARK,
      }}
    >
      <TelegramProvider
        options={{
          autoExpand: true,
          autoDisableVerticalSwipes: true,
          autoEnableClosingConfirmation: true,
          allowOutsideTelegram: !(process.env.NODE_ENV === "production"),
          loadingComponent: <Loader />,
          notInTelegramComponent: <OpenInTelegram />,
        }}
      >
        <FullscreenProvider
          options={{
            persistPreference: true,
          }}
        >
          <TelegramInitializer />
          {children}
        </FullscreenProvider>
      </TelegramProvider>
    </TonConnectUIProvider>
  )
}
