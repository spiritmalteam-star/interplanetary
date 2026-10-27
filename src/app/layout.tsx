import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Literata } from "next/font/google";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/mirror/theme-provider";
import { QueryProvider } from "@/components/mirror/query-provider";
import { PerfGate } from "@/components/PerfGate";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

/* Literata — the reading voice of the book reader. Every serif
   passage (quotes, mottos, answers) is typeset in it. */
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reflectme.space"),
  title: "Mirror Entity Digital Chamber — Interplanetary Channel",
  description:
    "A translational field of willing representatives from many star civilizations, gathered to reflect the truth of who is supporting your evolution, with love.",
  keywords: [
    "Mirror Entity Digital Chamber",
    "Interplanetary Channel",
    "Galactic Encyclopedia",
    "Mirror OS · Reality Guidance",
    "Observatory",
  ],
  /* the favicon itself is src/app/icon.png (App Router convention) —
     the white glyph on the near-black brand ground */
  /* THE APPLE'S OWN SHELF — added to the home screen, the house stands
     alone: no browser chrome, the status bar wearing the realm's own
     color, and no telephone numbers invented out of the words. */
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mirror Entity",
  },
  formatDetection: { telephone: false, address: false, email: false },
  /* the open door — when the house is shared, the share carries its
     own face: the diamond, the words, the resting ground */
  openGraph: {
    type: "website",
    url: "https://reflectme.space",
    siteName: "ReflectMe",
    title: "Mirror Entity Digital Chamber — Interplanetary Channel",
    description:
      "A translational field of willing representatives from many star civilizations, gathered to reflect the truth of who is supporting your evolution, with love.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "The Mirror Entity — a luminous diamond with threads of light branching outward on a still dark field",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirror Entity Digital Chamber — Interplanetary Channel",
    description:
      "A translational field of willing representatives from many star civilizations, gathered to reflect the truth of who is supporting your evolution, with love.",
    images: ["/og.jpg"],
  },
  /* the house is public to every crawler; nothing here is staged */
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
  ],
  width: "device-width",
  initialScale: 1,
  /* the walk owns its own pinch — the page never zooms under the
     visitor's fingers; the tree scales beneath them instead */
  maximumScale: 1,
  userScalable: false,
  /* the whole application fits the visible frame on every device —
     no scrolling ever needed to reach the input */
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} ${literata.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <QueryProvider>
          {/* the quiet tailor — measures the device once and hangs
              data-perf on <html> so every room dresses for it */}
          <PerfGate />
          {children}
          {/* sonner — the one voice of every toast in the house */}
          <SonnerToaster position="top-center" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
