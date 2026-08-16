import type { Metadata } from "next";
import { CorgiOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Start an introduction | Corgi",
  description: "Tell Corgi what would make a useful conversation today.",
};

export default function StartPage() {
  return <CorgiOnboarding />;
}
