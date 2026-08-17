import type { Metadata } from "next";
import { ExaOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Sign in | Corgi",
  description: "Sign in to your Corgi account.",
};

export default function SignInPage() {
  return <ExaOnboarding />;
}
