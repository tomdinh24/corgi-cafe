import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Baloo_2 } from "next/font/google";
import "@corgi/onboarding-shared/styles.css";
import "./journey.css";
import "./landing.css";

// Rounded, warm display face for the "Community" sub-wordmark so it reads as part of the same brand
// family as the rounded orange "Corgi" logo instead of a cold, generic label. Exposed as a CSS var
// (--font-brand) and applied only to .landing-brand > span.
const brandFont = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-brand" });
export const metadata: Metadata = {
  title: "Corgi Community",
  description: "Meet someone worth talking to at Corgi Cafe",
  // Without this, iOS Safari pattern-matches phrases like "at the Cafe" as an address and
  // renders them as blue tappable links — even on plain <strong> text with no <a> anywhere.
  formatDetection: { telephone: false, date: false, address: false, email: false, url: false },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.className} ${brandFont.variable}`}>
      <body className="corgi-app">{children}</body>
    </html>
  );
}
