import type { Metadata } from "next";
import { ExaOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Corgi",
  description: "Meet someone worth talking to at Corgi.",
};

export default function HomePage() {
  return <ExaOnboarding />;
}
