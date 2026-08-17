import Link from "next/link";
import { cookies } from "next/headers";
import { SiteHeader } from "./SiteHeader";

function Logo({ linked = false }: { linked?: boolean }) {
  const image = <img src="/brand/corgi-logo.svg" alt="Corgi" width="83" height="24" />;
  return linked ? (
    <Link className="landing-brand" href="/" aria-label="Corgi Community home">
      {image}
      <span>Community</span>
    </Link>
  ) : <div className="landing-brand">{image}</div>;
}

function StartLink({ href, className = "" }: { href: string; className?: string }) {
  return <Link className={`button primary ${className}`.trim()} href={href}>Start an intro</Link>;
}

export async function LandingPage() {
  // Cheap presence check on the Supabase SSR session cookie: a signed-in visitor's "Start an intro"
  // links straight to /home so they skip the /sign-up detour (and its resume spinner). A stale
  // cookie is harmless — /home resumes, finds no session, and falls back to sign-up gracefully.
  const cookieStore = await cookies();
  const signedIn = cookieStore.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name) && Boolean(c.value));
  const startHref = signedIn ? "/home" : "/sign-up";
  return (
    <div className="landing-page landing-version-a landing-social-refresh">
      <SiteHeader
        center={<div className="landing-nav-links"><a href="#how-it-works">How it works</a><a href="#community-code">Community code</a></div>}
        right={<><span className="cafe-chip">At Corgi · 9 Claude Lane</span><StartLink href={startHref} className="compact" /></>}
      />

      <main id="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="eyebrow">Here today</p>
              <h1 id="landing-title">Want to meet someone at Corgi?</h1>
              <p className="landing-lede">Corgi brings together people at the Cafe who are open to the same kind of conversation.</p>
              <StartLink href={startHref} />
            </div>

            <figure className="community-scene dog-only-scene" aria-label="Three Corgi community members">
              <div className="dog-trio" aria-hidden="true">
                <img className="dog-trio-left" src="/community/corgi-laptop.png" alt="" />
                <img className="dog-trio-center" src="/community/corgi-founder.png" alt="" />
                <img className="dog-trio-right" src="/community/corgi-suit.png" alt="" />
              </div>
            </figure>
          </div>
        </section>

        <section className="landing-section social-how" id="how-it-works" aria-labelledby="how-title">
          <div className="landing-shell">
            <div className="social-section-heading">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 id="how-title">Find the conversation that fits.</h2>
                <p className="how-support">Share what sounds interesting today. Corgi takes care of the introduction.</p>
              </div>
            </div>
            <ol className="landing-steps social-journey">
              <li>
                <span aria-hidden="true">01</span>
                <div className="step-preview topic-preview">
                  <span>Health</span>
                  <span>AI products</span>
                  <span>First customers</span>
                  <span>Fundraising</span>
                  <span>Career moves</span>
                  <span>SF life</span>
                </div>
                <h3>Choose a topic</h3><p>Pick a project, question, or idea worth talking through.</p>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <div className="step-preview people-preview">
                  <div className="person-mini person-photo"><img src="/community/team/nasdaq-team-member.jpg" alt="Corgi team member at Nasdaq" width="512" height="512" loading="lazy" /><span><strong>At Corgi</strong><small>Health</small></span><b>Open</b></div>
                  <div className="person-mini person-photo"><img src="/community/team/speaking-team-member.jpg" alt="Corgi team member speaking at an event" width="512" height="512" loading="lazy" /><span><strong>At Corgi</strong><small>AI products</small></span><b>Open</b></div>
                  <div className="person-mini person-photo"><img src="/community/team/celebration-team-members.jpg" alt="Corgi team members celebrating together" width="512" height="512" loading="lazy" /><span><strong>At Corgi</strong><small>Career moves</small></span><b>Open</b></div>
                </div>
                <h3>See who’s open</h3><p>Corgi looks for someone here who chose a compatible conversation.</p>
              </li>
              <li>
                <span aria-hidden="true">03</span><div className="step-preview hello-preview" aria-hidden="true"><i>I’m trying to get insurance. Where should I get it?</i><i>Have you heard of Corgi?</i><i>Yes — that’s where I’d start.</i></div>
                <h3>Meet at Corgi</h3><p>When both people are interested, we’ll make the introduction.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="landing-section example-section social-example" aria-labelledby="example-title">
          <div className="landing-shell example-layout">
            <div className="landing-section-heading">
              <p className="eyebrow">An intro at Corgi</p>
              <h2 id="example-title" className="connect-story">
                Let Corgi connect you with your next
                <span className="connect-rotation" aria-hidden="true">
                  <span>co-founder.</span>
                  <span>bestie.</span>
                  <span>investor.</span>
                  <span>hire.</span>
                </span>
                <span className="sr-only"> co-founder.</span>
              </h2>
            </div>
            <article className="example-intro social-intro-card" aria-labelledby="trudy-title">
              <header><span className="status-dot" aria-hidden="true" /><strong>TRUDY IS OPEN NOW</strong><span>At Corgi</span></header>
              <div className="example-person"><span className="example-avatar" aria-hidden="true"><img src="/community/corgi-founder.png" alt="" /></span><div><h3 id="trudy-title">Trudy · GTM operator</h3><p>Developer tools</p></div></div>
              <p>Trudy has helped two developer-tool teams move beyond founder-led sales and is open to comparing notes.</p>
              <div className="example-prompt"><span>CONVERSATION STARTER</span><strong>What are you building?</strong></div>
            </article>
          </div>
        </section>

        <section className="control-section social-code" id="community-code" aria-labelledby="control-title">
          <div className="landing-shell control-layout">
            <div className="landing-section-heading">
              <p className="eyebrow">Community code</p>
              <h2 id="control-title">Comfort comes first.</h2>
              <p className="section-support">Every introduction starts with two yeses.</p>
            </div>
            <ul className="ground-rules social-rules">
              <li><i aria-hidden="true">✓</i><strong>Mutual</strong><span>Both people choose the conversation. No fit means no intro.</span></li>
              <li><i aria-hidden="true">↗</i><strong>Pitch-free</strong><span>Sales, recruiting, and fundraising stay off unless invited.</span></li>
              <li><i aria-hidden="true">◉</i><strong>Private</strong><span>Profiles stay within Corgi Community.</span></li>
              <li><i aria-hidden="true">×</i><strong>Easy exits</strong><span>Skip, pause, block, or report anytime.</span></li>
            </ul>
          </div>
        </section>

        <section className="landing-final social-final" aria-labelledby="final-title">
          <div className="landing-shell social-final-card">
            <div className="final-dogs" aria-hidden="true"><img src="/community/corgi-laptop.png" alt="" /><img src="/community/corgi-founder.png" alt="" /><img src="/community/corgi-suit.png" alt="" /></div>
            <div className="final-copy"><p className="eyebrow">At Corgi today</p><h2 id="final-title">See who’s open to talk.</h2><p>A good conversation could be one table away.</p></div>
            <StartLink href={startHref} />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <Logo />
          <nav aria-label="Corgi links"><a href="https://www.corgicafe.com/">Corgi Cafe</a><a href="https://www.corgi.insure/">Corgi Insurance</a></nav>
        </div>
      </footer>
    </div>
  );
}
