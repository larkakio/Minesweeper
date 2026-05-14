import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const shareTech = Share_Tech_Mono({
  variable: "--font-share",
  subsets: ["latin"],
  weight: "400",
});

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID?.trim() || "neon-sweep-base-app";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  title: "NeonSweep — Minesweeper on Base",
  description:
    "Cyberpunk minesweeper for mobile with swipe controls, Base wallet, and Builder Code attribution.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/app-icon.jpg",
    apple: "/app-icon.jpg",
  },
  openGraph: {
    title: "NeonSweep — Minesweeper on Base",
    description: "Neural-grid minesweeper with Base check-in and Builder Codes.",
    images: [{ url: "/app-thumbnail.jpg", width: 1910, height: 1000, alt: "NeonSweep" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${shareTech.variable} h-full antialiased`}
    >
      <head>
        <meta name="base:app_id" content={baseAppId} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans scanlines cyber-grid-bg min-h-dvh text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
