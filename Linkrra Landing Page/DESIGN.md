# Design System Strategy: The Neon Kinetic

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Architect."** 

Fintech often feels either overly clinical (traditional banking) or distractingly chaotic (crypto). This design system carves a third path: **High-Velocity Professionalism.** It rejects the static, flat-box layout of the 2010s in favor of an editorial, high-contrast experience that feels like a premium dashboard from a near-future cockpit. 

We break the "template" look through **intentional asymmetry** and **tonal depth**. By utilizing extreme typography scales and overlapping "glass" surfaces, we create a sense of forward motion. This isn't just a container for data; it is a curated, premium environment where every interaction feels intentional and weighted.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, nocturnal charcoal (`#0b0f11`), allowing the vibrant `primary` (#bc9eff) and `secondary` (#f98c49) to act as light sources within the UI.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. 
Structure must be defined through **Tonal Transitions**. To separate a sidebar from a main feed, use a shift from `surface` to `surface-container-low`. For a card, use `surface-container-high` against a `surface` background. High-contrast lines create visual noise; tonal shifts create "soul."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
- **Base Layer:** `surface` (#0b0f11) - The foundation.
- **Sectioning:** `surface-container-low` (#101416) - For large background regions.
- **Interaction Layer:** `surface-container-highest` (#212729) - For active cards or raised elements.

### The "Glass & Gradient" Rule
To achieve a "futuristic" feel, primary CTAs and hero elements must use the **Signature Kinetic Gradient**: A linear transition from `primary` (#bc9eff) to `primary_dim` (#884efb) at a 135-degree angle. Floating elements should utilize `backdrop-filter: blur(20px)` with a semi-transparent `surface_variant` fill to allow the underlying charcoal depths to bleed through.

---

## 3. Typography: Editorial Authority
We utilize a high-contrast pairing to balance "Future-Tech" with "Sophisticated Finance."

*   **Headlines (Space Grotesk):** This is our "Architect" font. It is wide, geometric, and authoritative. Use `display-lg` (3.5rem) for hero moments to create an editorial feel that dwarfs standard "web" scales.
*   **Body & UI (Manrope):** Our "Workhorse." It is highly legible, modern, and human. 
*   **Hierarchy Note:** Always lead with size before weight. A `headline-lg` in a lighter weight is more premium than a small `title-sm` in bold. Space is your best friend—use the `20` (5rem) and `24` (6rem) spacing tokens to let headlines "breathe."

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "muddy." In this system, we use **Ambient Glows** and **Tonal Stacking**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-highest` card inside a `surface-container-low` section. The delta in HEX values provides all the definition required.
*   **Ambient Shadows:** For floating modals, use a shadow with a `48px` blur, `0%` spread, and `8%` opacity. The shadow color must be a deep purple tint (derived from `primary_dim`) rather than black, making the element look like it is "illuminated" by the background.
*   **The Ghost Border:** If accessibility requires a stroke, use `outline_variant` (#44484b) at **15% opacity**. It should be felt, not seen.
*   **Glowing Hover States:** When hovering over interactive cards, apply a subtle `0 0 20px` outer glow using the `surface_tint` color at 20% opacity.

---

## 5. Components & Interaction

### Buttons: The Kinetic Trigger
*   **Primary:** A solid `primary` fill with a subtle gradient to `primary_dim`. **No Border.** On hover, the element should "lift" via a subtle scale (1.02x) and an increased ambient glow.
*   **Secondary:** An "Inner-Glow" style. Background is `surface-container-high`, with a `Ghost Border` that turns into a full `secondary` color on hover.
*   **Premium Badges:** Small-caps `label-sm` text inside a `secondary_container` pill. Use `0.5rem` horizontal padding.

### Input Fields: The Focused Void
*   **Default:** `surface_container_highest` background. No border.
*   **Focused:** The bottom edge receives a 2px `primary` line, and the background shifts slightly lighter to `surface_bright`.

### Cards & Lists: The Infinite Feed
*   **Mandate:** **Forbid divider lines.** 
*   **Separation:** Use `spacing-6` (1.5rem) of vertical whitespace. If a list is dense, alternate background colors between `surface-container-low` and `surface-container-lowest` to create a "Zebra" effect that feels intentional rather than utilitarian.

### Premium Glow Chips
*   Used for status or tags. A `tertiary_container` background with `on_tertiary_container` text. These should have a slight `box-shadow` of their own color (10% opacity) to look like self-illuminated neon filaments.

---

## 6. Do’s and Don'ts

### Do
*   **Use Asymmetry:** Place a large `display-md` headline on the left with a smaller `body-lg` paragraph offset to the right. 
*   **Embrace the Dark:** Use `surface_container_lowest` (#000000) for deep backgrounds to make the vibrant purples pop.
*   **Smooth Motion:** All hover states must use a `300ms cubic-bezier(0.4, 0, 0.2, 1)` transition. Snap-on states are forbidden.

### Don’t
*   **No 100% White:** Never use #FFFFFF. Use `on_surface` (#f7fafc) for text; it preserves the nocturnal aesthetic and reduces eye strain.
*   **No Sharp Corners:** Always use the `xl` (0.75rem) or `lg` (0.5rem) roundedness tokens. Sharp corners feel aggressive; we want "Future-Industrial," not "Brutalist."
*   **No Default Shadows:** If the shadow looks like a standard CSS `drop-shadow(0 4px 4px)`, delete it. It must be wide, soft, and tinted.