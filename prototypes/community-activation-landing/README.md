# Recovered community activation landing source

This directory preserves the standalone landing prototype that supplied the original Cafe connection scene and tactile component direction. Its CTA now links directly to `/start`; the former five-step handoff modal has been removed.

The canonical responsive implementation, official local logo, metadata, copy deck, and onboarding route now live in the Next.js workspace at [`../community-onboarding-clickthroughs/`](../community-onboarding-clickthroughs/). Run and validate that workspace for product review.

This recovered source records interaction events only in `window.corgiPrototypeEvents` and dispatches local `corgi:analytics` browser events. No analytics data leaves the browser.
