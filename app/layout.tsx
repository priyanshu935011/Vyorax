import type { Metadata } from "next";
import { Bebas_Neue, Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontSans = Syne({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vyorax — Premium Cycles & Fitness Gear Store",
  description: "Ranchi's premier sports and fitness store. Discover premium cycles, heavy-duty home gym weights, and professional sports gear from top global brands like Giant, Trek, Yonex, and Bowflex.",
  metadataBase: new URL("https://vyorax.in"),
  openGraph: {
    title: "Vyorax — Premium Cycles & Fitness Gear Store",
    description: "Ranchi's premier sports and fitness store. Discover premium cycles, heavy-duty home gym weights, and professional sports gear from top global brands.",
    type: "website",
    locale: "en_IN",
    siteName: "Vyorax",
    images: [
      {
        url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Vyorax cycles",
      }
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontBody.variable} antialiased bg-[var(--obsidian)] text-[var(--white)]`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
