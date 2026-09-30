import type { Metadata, Viewport } from "next";
import { Sora, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/mirror/theme-provider";

/* PARTICLEX DNA — three voices:
   Sora speaks the interface, Fraunces speaks the entity,
   IBM Plex Mono speaks the instruments. */
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirror Entity Laboratory — Interplanetary Channel",
  description:
    "A translational field of willing representatives from many star civilizations, gathered to reflect the truth of who is supporting your evolution, with love.",
  keywords: [
    "Mirror Entity Laboratory",
    "Interplanetary Channel",
    "Galactic Encyclopedia",
    "Mirror OS · Reality Guidance",
    "Observatory",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060a09" },
    { media: "(prefers-color-scheme: light)", color: "#f2f8f4" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${fraunces.variable} ${plexMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          {/* sonner — the voice of every toast in the Laboratory */}
          <SonnerToaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
