import type { Metadata } from "next";
import { ExaOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Build your profile | Corgi",
  description: "Tell Corgi what would make a useful conversation today.",
};

export default function OnboardingPage() {
  return <ExaOnboarding />;
}
