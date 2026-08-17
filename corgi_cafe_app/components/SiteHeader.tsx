import Link from "next/link";
import type { ReactNode } from "react";

// One top bar used across the landing page and the whole onboarding/matching journey. The brand
// (left) links home; `brandHref` points a signed-in visitor at the app home (/home) instead of the
// marketing landing page (/). Only the `center` and `right` slots change per surface.
export function SiteHeader({ center, right, brandHref = "/" }: { center?: ReactNode; right?: ReactNode; brandHref?: string }) {
  return (
    <header className="landing-header">
      <nav className="landing-header-inner" aria-label="Primary">
        <Link className="landing-brand" href={brandHref} aria-label="Corgi Community home">
          <img src="/brand/corgi-logo.svg" alt="Corgi" width="83" height="24" />
          <span>Community</span>
        </Link>
        {center ?? <span aria-hidden="true" />}
        <div className="landing-header-actions">{right}</div>
      </nav>
    </header>
  );
}
