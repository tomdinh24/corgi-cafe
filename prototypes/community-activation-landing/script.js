(() => {
  "use strict";

  const eventStore = [];
  window.corgiPrototypeEvents = eventStore;

  function track(name, properties = {}) {
    const event = {
      name,
      properties,
      occurredAt: new Date().toISOString(),
    };
    eventStore.push(event);
    window.dispatchEvent(new CustomEvent("corgi:analytics", { detail: event }));
  }

  document.querySelectorAll(".js-start").forEach((link) => {
    link.addEventListener("click", () => {
      const placement = link.dataset.placement || "unknown";
      track("community_landing_cta_clicked", { placement });
      track("onboarding_started", { placement });
    });
  });

  const viewedSections = new Set();
  const sections = [...document.querySelectorAll("[data-analytics-section]")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.dataset.analyticsSection;
          if (!entry.isIntersecting || !section || viewedSections.has(section)) return;
          viewedSections.add(section);
          track("community_landing_section_viewed", { section });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 },
    );
    sections.forEach((section) => observer.observe(section));
  }

  track("community_landing_viewed", {
    viewport:
      window.innerWidth < 768
        ? "mobile"
        : window.innerWidth < 1200
          ? "tablet"
          : "desktop",
  });
})();
