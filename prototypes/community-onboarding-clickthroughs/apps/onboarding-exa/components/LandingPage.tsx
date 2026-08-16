import Link from "next/link";

function Logo({ linked = false }: { linked?: boolean }) {
  const image = (
    <img src="/brand/corgi-logo.svg" alt="Corgi" width="83" height="24" />
  );
  return linked ? (
    <Link className="landing-brand" href="/" aria-label="Corgi Cafe introductions home">
      {image}
      <span>Cafe introductions</span>
    </Link>
  ) : (
    <div className="landing-brand">{image}</div>
  );
}

function StartLink({ className = "" }: { className?: string }) {
  return (
    <Link className={`button primary ${className}`.trim()} href="/start">
      Start an intro
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#landing-main">
        Skip to main content
      </a>
      <header className="landing-header">
        <nav className="landing-header-inner" aria-label="Primary">
          <Logo linked />
          <div className="landing-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#your-control">Your control</a>
          </div>
          <div className="landing-header-actions">
            <span className="cafe-chip">At Corgi · 9 Claude Lane</span>
            <StartLink className="compact" />
          </div>
        </nav>
      </header>

      <main id="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="eyebrow">Here today</p>
              <h1 id="landing-title">Want to meet someone at Corgi?</h1>
              <p className="landing-lede">
                Tell us what you’re working on and what you’d like to talk about.
                If someone here wants that conversation too, we’ll introduce you.
              </p>
              <StartLink />
            </div>

            <div className="connection-scene" aria-hidden="true">
              <div className="scene-note scene-note-left">Early sales?</div>
              <div className="scene-note scene-note-right">Let’s talk.</div>
              <div className="scene-person scene-person-left"><span /></div>
              <div className="scene-person scene-person-right"><span /></div>
              <div className="cafe-table"><span /></div>
              <div className="connection-line"><i /><i /><i /></div>
              <div className="session-clock">
                <span>INTRO WINDOW</span>
                <strong>00:42</strong>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-section"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="landing-shell">
            <div className="landing-section-heading">
              <p className="eyebrow">How it works</p>
              <h2 id="how-title">Skip the cold approach.</h2>
            </div>
            <ol className="landing-steps">
              <li>
                <span aria-hidden="true">01</span>
                <h3>Say what’s on your mind.</h3>
                <p>Share what you’re building or figuring out today.</p>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <h3>Choose what you’re up for.</h3>
                <p>Tell us what you can help with and what to skip.</p>
              </li>
              <li>
                <span aria-hidden="true">03</span>
                <h3>Get introduced together.</h3>
                <p>If the conversation fits, Corgi introduces you both.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="landing-section example-section" aria-labelledby="example-title">
          <div className="landing-shell example-layout">
            <div className="landing-section-heading">
              <p className="eyebrow">Example intro</p>
              <h2 id="example-title">A real reason to say hello.</h2>
            </div>
            <article className="example-intro" aria-labelledby="maya-title">
              <header>
                <span className="status-dot" aria-hidden="true" />
                <strong>OPEN NOW · 42 MIN LEFT</strong>
              </header>
              <div className="example-person">
                <span className="example-avatar" aria-hidden="true">M</span>
                <div>
                  <h3 id="maya-title">Maya · GTM operator</h3>
                  <p>Example introduction</p>
                </div>
              </div>
              <p>
                You’re working through early sales. Maya has helped two
                developer-tool teams move beyond founder-led sales and is open to
                comparing notes.
              </p>
              <div className="example-prompt">
                <span>START HERE</span>
                <strong>What changed when founder-led sales stopped scaling?</strong>
              </div>
              <small>Example only. No member data is shown.</small>
            </article>
          </div>
        </section>

        <section
          className="control-section"
          id="your-control"
          aria-labelledby="control-title"
        >
          <div className="landing-shell control-layout">
            <div className="landing-section-heading">
              <p className="eyebrow">Your call</p>
              <h2 id="control-title">No awkward surprises.</h2>
            </div>
            <ul className="ground-rules">
              <li><strong>Both people opt in.</strong><span>Corgi only introduces people who are open to that conversation.</span></li>
              <li><strong>No surprise pitches.</strong><span>Sales, recruiting, and fundraising stay off unless both people choose them.</span></li>
              <li><strong>Private by default.</strong><span>Your profile isn’t a public directory listing.</span></li>
              <li><strong>No forced match.</strong><span>If no one fits, we’ll say so.</span></li>
              <li><strong>Easy out.</strong><span>Skip, pause, block, or report anytime.</span></li>
            </ul>
          </div>
        </section>

        <section className="landing-final" aria-labelledby="final-title">
          <div className="landing-shell landing-final-inner">
            <h2 id="final-title">Open to an intro?</h2>
            <StartLink />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <Logo />
          <nav aria-label="Corgi links">
            <a href="https://www.corgicafe.com/">Corgi Cafe</a>
            <a href="https://www.corgi.insure/">Corgi Insurance</a>
          </nav>
          <p>An introduction isn’t guaranteed. You can stop or change your mind at any time.</p>
        </div>
      </footer>
    </div>
  );
}
