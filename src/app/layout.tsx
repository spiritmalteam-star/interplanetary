import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Literata } from "next/font/google";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/mirror/theme-provider";

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
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
  ],
  width: "device-width",
  initialScale: 1,
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
          {children}
          <Toaster />
          {/* sonner — the voice of every toast in the Laboratory */}
          <SonnerToaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
