(() => {
  "use strict";

  const eventStore = [];
  const dialog = document.querySelector("#onboarding-handoff");
  const startButtons = [...document.querySelectorAll(".js-start")];
  const closeButton = dialog?.querySelector(".dialog-close");
  const doneButton = dialog?.querySelector(".dialog-done");
  let lastTrigger = null;

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

  function showHandoff(trigger) {
    if (!dialog || dialog.open) return;

    lastTrigger = trigger;
    const placement = trigger.dataset.placement || "unknown";
    track("community_landing_cta_clicked", { placement });
    track("signup_started", { placement, prototype: true });
    dialog.showModal();
  }

  function closeHandoff(reason) {
    if (!dialog?.open) return;

    track("onboarding_handoff_closed", { reason });
    dialog.close();
    lastTrigger?.focus();
  }

  startButtons.forEach((button) => {
    button.addEventListener("click", () => showHandoff(button));
  });

  closeButton?.addEventListener("click", () => closeHandoff("close_button"));
  doneButton?.addEventListener("click", () => closeHandoff("return_button"));

  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeHandoff("escape");
  });

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeHandoff("backdrop");
  });

  const viewedSections = new Set();
  const sections = [...document.querySelectorAll("[data-analytics-section]")];

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.dataset.analyticsSection;
          if (!entry.isIntersecting || viewedSections.has(section)) return;

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
    prototype: true,
    viewport: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1200 ? "tablet" : "desktop",
  });
})();
