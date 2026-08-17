import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@corgi/onboarding-shared/styles.css";
import "./journey.css";
import "./landing.css";
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
    <html lang="en" className={GeistSans.className}>
      <body className="corgi-app">{children}</body>
    </html>
  );
}
