import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Dieta",
    template: "%s · Dieta",
  },
  description: "Acompanhe sua dieta — refeições, água e metas, juntos.",
  applicationName: "Dieta",
  appleWebApp: {
    capable: true,
    // 'default' = barra opaca clara com ícones escuros (combina com tema light).
    // 'black-translucent' deixava o conteúdo passar por baixo do notch — em
    // light mode os ícones do iOS ficam invisíveis sobre fundo claro.
    statusBarStyle: "default",
    title: "Dieta",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
}

// Splash screens iOS (apple-touch-startup-image). Cada device tem dimensão CSS
// (física ÷ DPR) — a media query casa o device certo. React 19 faz hoist dos
// <link> pro <head>.
const APPLE_SPLASH = [
  { w: 1170, h: 2532, r: 3 }, // iPhone 12/13/14/16e
  { w: 1179, h: 2556, r: 3 }, // iPhone 15/16 Pro
  { w: 1206, h: 2622, r: 3 }, // iPhone 16 Pro
  { w: 1290, h: 2796, r: 3 }, // iPhone 14/15 Pro Max
  { w: 1320, h: 2868, r: 3 }, // iPhone 16 Pro Max
  { w: 1284, h: 2778, r: 3 }, // iPhone 12/13 Pro Max
  { w: 1125, h: 2436, r: 3 }, // iPhone X/XS/11 Pro
  { w: 1242, h: 2688, r: 3 }, // iPhone XS Max/11 Pro Max
  { w: 828, h: 1792, r: 2 }, // iPhone XR/11
]

function AppleSplashLinks() {
  return (
    <>
      {APPLE_SPLASH.map(({ w, h, r }) => (
        <link
          key={`${w}x${h}`}
          rel="apple-touch-startup-image"
          media={`(device-width: ${w / r}px) and (device-height: ${h / r}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`}
          href={`/splash/splash-${w}x${h}.png`}
        />
      ))}
    </>
  )
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#fafafa",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-screen flex-col">
        <AppleSplashLinks />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
