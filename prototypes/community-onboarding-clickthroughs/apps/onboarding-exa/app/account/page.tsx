import type { Metadata } from "next";
import { ExaOnboarding } from "@/components/ExaOnboarding";

export const metadata: Metadata = {
  title: "Settings | Corgi",
  description: "View and edit your Corgi profile, links, and account.",
};

// Same single-page state machine as /home; ExaOnboarding renders the account-settings view when the
// path is /account (a pushed history entry), so browser Back returns to /home instead of the landing page.
export default function AccountPage() {
  return <ExaOnboarding />;
}
