# Community Activation Landing Prototype

This is a standalone, responsive prototype of Corgi's post-order discovery page. It demonstrates
the marketing narrative and the handoff into centralized onboarding; it does not create accounts,
collect personal information, call Crustdata, or perform matching.

From this directory, preview it with:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

The prototype records interaction events only in `window.corgiPrototypeEvents` and dispatches local
`corgi:analytics` browser events. No analytics data leaves the browser.

See the [marketing and design handoff](../../docs/product/post-order-discovery-landing-page-handoff.md)
and [onboarding enrichment proposal](../../docs/product/onboarding-enrichment-proposal.md) for the
product boundaries behind the prototype.
