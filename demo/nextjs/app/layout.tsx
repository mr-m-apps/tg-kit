import type React from "react"
import "./globals.css"
import Script from "next/script"
import { Providers } from "./providers"
import { Roboto, Geist, Geist_Mono } from "next/font/google"
import { APP_CONFIG } from "./config"
import { Suspense } from "react"

const roboto = Roboto({
  weight: "700",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-roboto",
})

const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const fontHeading = Geist({ variable: "--font-heading", subsets: ["latin"], weight: "600" })
const fontMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: APP_CONFIG.url,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    images: [
      {
        url: APP_CONFIG.icon,
        width: 512,
        height: 512,
        alt: `${APP_CONFIG.name} Logo`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: [APP_CONFIG.icon],
  },
  icons: {
    icon: APP_CONFIG.icon,
    shortcut: APP_CONFIG.icon,
    apple: APP_CONFIG.icon,
    other: [
      {
        rel: "mask-icon",
        url: APP_CONFIG.icon,
      },
    ],
  },
  manifest: "/manifest.webmanifest",
}

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportfit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
    
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: "eruda.init();" }} />
        
        <Providers>
          <Suspense>
            <div className="app-container isolate relative">
              {children}
            </div>
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
