import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@corgi/onboarding-shared/styles.css";

const description =
  "Tell Corgi what you’re working on and what you’d like to talk about. If someone here wants that conversation too, we’ll introduce you.";

export const metadata: Metadata = {
  title: "Meet someone at Corgi | Corgi",
  description,
  openGraph: {
    title: "Meet someone at Corgi",
    description:
      "Say what you’d like to talk about. If someone at Corgi wants that conversation too, we’ll introduce you both.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet someone at Corgi",
    description:
      "Say what you’d like to talk about. If someone at Corgi wants that conversation too, we’ll introduce you both.",
  },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.className} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
