import type { MetadataRoute } from "next"
import { APP_CONFIG } from "./config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.name,
    description: `${APP_CONFIG.description}`,
    lang: "en",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    theme_color: APP_CONFIG.color,
    background_color: APP_CONFIG.color,
    display: "standalone",
    orientation: "portrait-primary",
    start_url: "/",
    scope: "/",
    id: "app-v1",
  }
}
