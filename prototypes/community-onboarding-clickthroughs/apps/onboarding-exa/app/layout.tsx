import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@corgi/onboarding-shared/styles.css";
export const metadata: Metadata = {
  title: "Corgi intro setup · Exa",
  description: "Internal Corgi assisted onboarding prototype",
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
