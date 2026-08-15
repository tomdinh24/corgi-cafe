# Corgi Cafe Frontend Design Standard

Status: proposed foundation  
Owner: persistent Design Lead  
Last studied: 2026-08-15

## 1. Scope and evidence

This standard studies the desktop and mobile presentation of:

- [Corgi Insurance](https://www.corgi.insure/)
- [Corgi Cafe](https://www.corgicafe.com/)

It defines a reusable frontend vocabulary; it does not define product scope or authorize reuse of
third-party assets.

Observed in the references:

- Both properties use a bright orange and near-black identity, corgi imagery, direct typography,
  generous whitespace, and compact calls to action.
- Corgi Insurance is an editorial/corporate layer: structured navigation, atmospheric hero art,
  serif emphasis, engraved illustration, credibility marks, and conversion CTAs.
- Corgi Cafe is a retail/community layer: a hand-drawn wordmark, orange line art, product imagery,
  digital-clock type, location chips, and tactile controls.
- Source styles name Geist, Geist Sans, Geist Mono, F37 Bolton, Georgia, DM Sans, and Digital
  Numbers. Availability and licensing have not been established.

Recommended here:

- Share primitives and accessible behavior between both layers.
- Theme components through semantic tokens rather than duplicate components.
- Keep insurance precise and editorial; let cafe be warmer and more tactile.
- Correct reference-site mobile clipping or overflow instead of reproducing it.

## 2. Design principles

1. **Corgi is the throughline.** Orange, crisp dark contrast, confident whitespace, and selective
   corgi character make the family recognizable.
2. **One system, two expressions.** Structure and interaction behavior stay consistent while type,
   imagery, and surface treatment adapt to insurance or cafe contexts.
3. **Whitespace carries confidence.** Prefer a few strong sections to nested cards and decorative
   containers.
4. **Playfulness stays functional.** Mascots, clocks, line art, and engraved imagery should support
   hierarchy or recognition, never obstruct content.
5. **Mobile is recomposed, not cropped.** Art, copy, CTA groups, logo rows, and chips reflow within
   the viewport.
6. **Accessibility is structural.** Contrast, focus, target size, motion preferences, zoom, and
   keyboard behavior are part of each component definition.

## 3. Foundation tokens

### Color

These exact reference values are evidence from the source styles. Semantic assignments are the
recommended system.

| Token | Value | Intended use |
|---|---:|---|
| `orange-600` | `#ff5c00` | primary brand field and accent |
| `orange-700` | `#cc4a00` | dark interaction/accent state |
| `orange-500` | `#ff7d33` | lighter interactive state |
| `orange-400` | `#ff9d66` | subtle accent; not small text |
| `ink-900` | `#191919` | primary text and dark surfaces |
| `ink-700` | `#4a4a4a` | secondary text |
| `gray-300` | `#e1e1e1` | borders and dividers |
| `paper-100` | `#f6f6f6` | warm page background |
| `white` | `#ffffff` | raised surface |

```css
:root {
  --ref-orange-600: #ff5c00;
  --ref-orange-700: #cc4a00;
  --ref-orange-500: #ff7d33;
  --ref-orange-400: #ff9d66;
  --ref-ink-900: #191919;
  --ref-ink-700: #4a4a4a;
  --ref-gray-300: #e1e1e1;
  --ref-paper-100: #f6f6f6;
  --ref-white: #ffffff;

  --color-canvas: var(--ref-paper-100);
  --color-surface: var(--ref-white);
  --color-text: var(--ref-ink-900);
  --color-text-muted: var(--ref-ink-700);
  --color-border: var(--ref-gray-300);
  --color-brand: var(--ref-orange-600);
  --color-brand-hover: var(--ref-orange-500);
  --color-brand-pressed: var(--ref-orange-700);
  --color-focus: var(--ref-ink-900);
}
```

Contrast rules:

- Use `#191919` for normal-size text on `#ff5c00`; the measured contrast is about `5.68:1`.
- White on `#ff5c00` is about `3.10:1`: it is not an AA normal-text pair. Do not use it for a
  standard button label.
- White on `#cc4a00` is about `4.62:1`, but state changes must remain legible and coherent.
- `#4a4a4a` passes comfortably on white and `#f6f6f6` for body text.
- Never rely on orange alone to communicate selection, error, success, or focus.
- Validate every text-over-image treatment against the actual crop.

### Typography

```css
:root {
  --font-sans: "Geist", "Geist Sans", "DM Sans", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-display: "F37 Bolton", "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-digital: "Digital Numbers", "Geist Mono", ui-monospace, monospace;
}
```

| Role | Desktop | Mobile | Family and treatment |
|---|---|---|---|
| Display XL | `64/64` | `44/46` | display sans; short hero only |
| Display L | `48/50` | `36/40` | display sans; serif may emphasize a short phrase |
| Heading L | `36/40` | `30/34` | sans, compact tracking |
| Heading M | `28/34` | `24/30` | sans |
| Heading S | `22/28` | `20/26` | sans |
| Body L | `18/26` | `18/26` | sans |
| Body M | `16/24` | `16/24` | sans |
| Body S | `14/20` | `14/20` | sans |
| Caption | `12/16` | `12/16` | sans or mono |
| Clock/data | contextual | contextual | mono/digital with tabular numerals |

Do not fluidly shrink headings below these mobile sizes. `F37 Bolton` and `Digital Numbers` may
require commercial licenses; do not bundle or self-host them until rights are confirmed. The system
must remain coherent using the listed fallbacks.

### Spacing, sizing, and layout

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-pill: 999px;

  --shadow-button: 0 3px 0 rgb(25 25 25 / 25%);
  --shadow-raised: 0 8px 24px rgb(25 25 25 / 12%);
  --border-default: 1px solid var(--color-border);
}
```

- Content width: `1200–1280px` maximum.
- Gutters: `16px` under `768px`, `24px` from `768px`, `32px` from `1280px`.
- Grid: 4 columns on mobile, 8 on tablet, 12 on desktop.
- Section rhythm: generally `64px` mobile and `96px` desktop.
- Touch targets: at least `44 × 44px`.
- Insurance uses crisp borders and minimal shadows. Cafe may use button offset, inset clock frames,
  and restrained raised surfaces.
- Default surface radius is no more than `8px`; reserve pill radius for chips and compact controls.

## 4. Theme layers

```css
[data-brand-layer="insurance"] {
  --hero-font: var(--font-display);
  --accent-font: var(--font-serif);
  --component-shadow: none;
  --component-radius: var(--radius-sm);
}

[data-brand-layer="cafe"] {
  --hero-font: var(--font-sans);
  --accent-font: var(--font-digital);
  --component-shadow: var(--shadow-button);
  --component-radius: var(--radius-md);
}
```

| Quality | Insurance editorial/corporate | Cafe retail/community |
|---|---|---|
| Voice | concise, credible, direct | warm, local, energetic |
| Hero | atmospheric/editorial composition | wordmark, line art, product/community motif |
| Type accent | restrained serif italic | mono or digital display |
| Surfaces | flat, crisp, spacious | tactile controls and compact chips |
| Imagery | painterly or engraved metaphor | drinks, food, interiors, people, hand-drawn art |
| CTA priority | conversion and inquiry | product/location action, once product intent confirms it |

## 5. Component standard

Each interactive component ships with default, hover, pressed, focus-visible, disabled, loading
where relevant, error where relevant, and reduced-motion behavior.

| Component | Anatomy | Variants | Mobile behavior |
|---|---|---|---|
| Announcement bar | message, optional link, close | news, event/local notice | wraps to two lines; close remains 44px |
| Header/nav | mark, links, utilities, primary action | insurance structured; cafe compact/centered | menu/drawer; preserve at most one primary action |
| Hero | eyebrow, headline, copy, actions, art | insurance editorial; cafe community/product | art repositions; copy never clips; next section may peek |
| Button | label, optional icon, focus ring | orange, black, outline, text, icon, cafe raised | 44px minimum; full width only in narrow stacks |
| Link | label, optional caret | body, nav, inline action | wraps without separating icon and last word |
| Dropdown/disclosure | trigger, panel, items | nav, contextual | becomes disclosure rows in the menu drawer |
| Logo row | label, approved marks | customer, partner, press | wraps or explicit horizontal scroller; never accidental clipping |
| Location chips | place, secondary label, status | active, soon, disabled | wrapped rows or snap scroller; active item stays visible |
| Product/menu list | heading, item, detail, price, divider | compact, illustrated | price stays scannable; no clipped leaders |
| Clock/time badge | numerals, frame, label, text equivalent | live, static, countdown if justified | tabular numerals; no disruptive announcements |
| Badge | short label, optional status/icon | place-only, soon, category | stays secondary; never masquerades as primary action |
| Card | optional media, heading, body, metadata, action | editorial, product, location | repeated content only; never nest cards |
| Form control | visible label, field, help/error, status | text, select, checkbox, radio | appropriate input mode; errors explain recovery |
| Modal/drawer | title, body, actions, close | blocking decision, nav/context | drawer preferred for navigation; focus is trapped and restored |

### Button color behavior

- Primary: orange field with near-black text; hover may use `orange-500` with near-black text.
- Pressed: use an independently contrast-tested pair; do not blindly combine `orange-700` with
  near-black normal text.
- Secondary: near-black field with white text.
- Body links use an underline or another non-color affordance.
- Icon-only actions require an accessible name and visible tooltip when meaning is not universal.

## 6. Responsive behavior

- Breakpoints are content-driven; begin evaluation around `480`, `768`, `1024`, and `1280px`.
- No component may create page-level horizontal scrolling at `320px` CSS width.
- Desktop hero art cannot retain fixed coordinates on smaller screens. Use bounded containers,
  art-direction, and explicit focal points.
- Navigation density decreases before text or actions collide.
- CTA groups stack when labels cannot fit without compression.
- Logo rows and chip groups wrap by default; use horizontal scrolling only with a clear affordance.
- Meaningful images use responsive crops and declared aspect ratios. Decorative art may be hidden
  when it competes with mobile content.
- Test at 200% browser zoom as well as nominal viewport sizes.

## 7. Assets and media

- **Mascot:** the orange corgi is a signature element. Use only an approved source asset or commission
  an original, legally distinct treatment. Do not trace the observed mascot.
- **Wordmark:** treat the hand-drawn Corgi Cafe mark as proprietary until rights are confirmed.
- **Illustration:** insurance may use licensed archival/engraved black artwork; cafe may use original
  orange line work. Do not reproduce the captured compositions.
- **Photography:** cafe favors drinks, food, interiors, staff, and community. Define focal point,
  crop, alt text, and rights metadata for each image.
- **Logos:** partner, sponsor, press, and customer marks require explicit display approval. Preserve
  aspect ratio and do not imply endorsement.
- **Icons:** use one simple line-icon family with consistent optical size and stroke weight.
- **Fallbacks:** every image-dependent component needs a deliberate no-image state.

Maintain an asset register with source, owner, license, permitted surfaces, expiration if any, alt
text, and approved transformations.

## 8. Motion

- Default duration: `120–220ms`; use ease-out for entrance and ease-in for exit.
- Insurance motion is restrained and confidence-building.
- Cafe may use subtle tactile press, clock, or line-art motion when it communicates state.
- Never delay access to critical text or controls for animation.
- Under `prefers-reduced-motion: reduce`, remove nonessential movement and replace spatial transitions
  with immediate or opacity-only state changes.

## 9. Accessibility requirements

- Target WCAG 2.2 AA.
- All navigation, disclosures, forms, dialogs, drawers, scrollers, and controls are keyboard usable.
- Focus is visible on light, dark, orange, and image backgrounds.
- State is never communicated by color alone.
- Text remains usable at 200% zoom and reflows at narrow widths.
- Meaningful images have contextual alt text; decorative images use empty alt text or equivalent.
- Live clocks should not announce every tick. Only announce meaningful, user-valued changes.
- Modal focus is trapped and restored; Escape and close behavior are defined.
- Error text identifies the field and explains recovery.
- Automated checks support, but do not replace, keyboard and screen-reader review.

## 10. Implementation contract

- Keep reference, semantic, and component tokens in a single source of truth.
- Components consume semantic/component tokens, never raw hex values.
- Generate CSS variables and typed application exports from the same token data when practical.
- Theme through a root `data-brand-layer` attribute; avoid component forks based only on styling.
- Use semantic HTML first and ARIA only to supply missing semantics.
- Add visual-regression coverage for the header and hero at one desktop and one mobile viewport per
  theme, plus interaction-state coverage for shared controls.
- Document component anatomy, variants, states, content constraints, and accessibility behavior next
  to the implementation.

## 11. Do and do not

Do:

- Use orange, dark contrast, whitespace, and corgi character as the shared family signal.
- Let insurance feel editorial, fast, and credible.
- Let cafe feel local, product-forward, and tactile.
- Use serif emphasis sparingly and digital/mono type for short data-like moments.
- Validate mobile composition, contrast, keyboard behavior, and asset rights before release.

Do not:

- Copy mascot art, wordmarks, photography, illustrations, or third-party logos without rights.
- Use white normal-size text on `#ff5c00`.
- Infer ordering, membership, event, location, or insurance flows from visual references alone.
- Reproduce reference-site clipping, overflow, or inaccessible treatments.
- Turn every section into a card or nest cards.
- Make the cafe look like generic corporate SaaS or insurance look like a retail menu.

## 12. Open decisions

- Are the properties sharing one codebase, a token package, or only a visual family?
- Which mascot, wordmark, photography, illustration, and logo files are approved for production?
- Are F37 Bolton and Digital Numbers licensed for web use?
- What is the cafe frontend's primary user goal: ordering, location discovery, events, membership, or
  brand storytelling?
- Which locales, content lengths, browsers, and assistive technologies are required?
- Are there accessibility targets beyond WCAG 2.2 AA?

Until Product Lead/human decisions answer these, components should stay content-neutral and the
system should not encode an assumed conversion funnel.

## 13. Frontend acceptance criteria

- Reference, semantic, and component tokens are centralized and documented.
- Insurance and cafe presentations use shared components with explicit theme tokens.
- No raw colors appear in component styles outside token definitions.
- Header, hero, buttons, links, logo rows, chips, cards, forms, drawers, and dialogs implement all
  relevant interaction states.
- There is no unintended horizontal overflow at 320px or at 200% zoom.
- Hero text and controls remain fully readable at mobile widths.
- Interactive targets are at least 44px in both dimensions.
- Keyboard order is logical and focus is always visible.
- Required text contrast passes WCAG 2.2 AA, including states and text over images.
- Reduced-motion preferences are honored.
- Images have correct alternative-text behavior and an approved rights record.
- Proprietary assets are licensed, replaced, or omitted.
- Visual regression tests cover desktop and mobile header/hero layouts for both themes.
- The real user path is exercised once product intent and an executable frontend exist.
