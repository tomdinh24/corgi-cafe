import type { Metadata } from "next";
import { ExaOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Sign up | Corgi",
  description: "Create your Corgi profile to start an introduction.",
};

export default function SignUpPage() {
  return <ExaOnboarding />;
}
