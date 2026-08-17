import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@corgi/onboarding-shared/styles.css";
import "./journey.css";
import "./landing.css";
export const metadata: Metadata = {
  title: "Corgi Community",
  description: "Meet someone worth talking to at Corgi Cafe",
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
