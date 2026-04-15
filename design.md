# Design System Document: Precision Editorial

 

## 1. Overview & Creative North Star

**Creative North Star: "The Kinetic Architect"**

 

This design system is engineered to transform complex tech-journalism into a high-end, cinematic experience. Inspired by the precision of Xiaomi’s product design and the analytical rigor of modern data journalism, the system moves away from traditional "app-like" layouts toward a **Signature Editorial** aesthetic.

 

We break the standard grid through **Intentional Asymmetry**. By utilizing expansive white space (or "dark space") and overlapping elements, we create a sense of momentum. The UI is not a container; it is a canvas where data flows, nodes glow, and typography commands authority. It feels custom, premium, and inherently technical.

 

---

 

## 2. Colors

Our palette is rooted in high-contrast neutrality, punctuated by the vibrant energy of the tech industry.

 

### The Palette (Material Design Convention)

- **Primary:** `#FFB595` / **Primary Container (Xiaomi Orange):** `#FF6700`

- **Surface/Background:** `#131313` (The void for dark mode depth)

- **Secondary (Accents):** `#C6C6C7` (The metallic sheen)

- **Tertiary (Data/Connectivity):** `#9DCAFF` / `#019CFF` (The "Ecosystem Glow")

 

### The "No-Line" Rule

**Explicit Instruction:** Use of 1px solid borders for sectioning is strictly prohibited. 

In this design system, boundaries are defined through:

- **Tonal Shifts:** Transitioning from `surface` to `surface-container-low`.

- **Negative Space:** Using the spacing scale to create psychological breaks.

- **Radial Gradients:** Subtle glows that define the "area of influence" for a component.

 

### Surface Hierarchy & Nesting

Treat the UI as physical layers of tech-grade materials.

- **Level 1 (Base):** `surface` (#131313)

- **Level 2 (Section):** `surface-container-low` (#1C1B1B)

- **Level 3 (Interactive Card):** `surface-container-high` (#2A2A2A)

- **Level 4 (Floating/Overlay):** `surface-bright` (#393939)

 

### The "Glass & Gradient" Rule

To mimic the "connectivity nodes" seen in ecosystem diagrams, use **Glassmorphism**. Floating cards should utilize semi-transparent versions of `surface-container` with a `backdrop-blur` of 20px–40px. Main CTAs must use a linear gradient from `primary` (#FFB595) to `primary-container` (#FF6700) at a 135-degree angle to provide a "lit from within" professional polish.

 

---

 

## 3. Typography

We use typography as a structural element, not just for legibility.

 

- **Display (Plus Jakarta Sans):** Oversized, bold, and authoritative. Used for documentary titles and "Hero Data" points. The tight letter-spacing communicates technical precision.

- **Headline (Plus Jakarta Sans):** High-contrast weights. Used to guide the viewer through data narratives.

- **Body & Labels (Inter):** Chosen for its Swiss-style neutrality. It provides a "readable" counter-balance to the aggressive headlines, ensuring data labels remain legible even at small scales.

 

**Hierarchy Goal:** Create a "Staggered Scale." A `display-lg` headline should sit comfortably near a `label-md` data point to create a sense of scale and importance.

 

---

 

## 4. Elevation & Depth

Traditional drop shadows are replaced with **Tonal Layering** and **Ambient Glows.**

 

### The Layering Principle

Depth is achieved by "stacking" container tiers. To lift a card, do not add a shadow; instead, move it from `surface-container-low` to `surface-container-highest`. This creates a clean, architectural lift.

 

### Ambient Shadows

When a floating effect is non-negotiable (e.g., a video overlay), use an **Ambient Shadow**:

- **Blur:** 60px - 80px.

- **Opacity:** 6% - 10%.

- **Color:** A tinted version of the background (`surface-container-lowest`), never pure black.

 

### The "Ghost Border" Fallback

If a border is required for accessibility, it must be a **Ghost Border**. Use `outline-variant` (#5A4136) at 15% opacity. It should be felt, not seen.

 

---

 

## 5. Components

 

### Buttons (Kinetic Style)

- **Primary:** Gradient fill (`primary` to `primary-container`). Corner radius: `md` (0.75rem). No border.

- **Secondary:** Surface-bright fill with a Ghost Border. 

- **Tertiary:** Text only, using `primary` color with a `label-md` weight for technical metadata actions.

 

### Comparison Cards & Data Lists

- **Forbid Dividers:** Do not use lines to separate list items. Use a `surface-container-low` background for the even rows and `surface` for the odd, or simply use vertical padding (Spacing Scale `lg`).

- **Interaction:** On hover, a card should transition its background to `surface-container-highest` and trigger a subtle `primary` glow node in the top-right corner.

 

### Ecosystem Diagrams & Nodes

- **Nodes:** Circular elements using `tertiary` (#9DCAFF) with an outer glow (box-shadow: 0 0 15px tertiary).

- **Connectivity Lines:** Use `outline-variant` at 30% opacity. For active states, use a "marching ants" CSS animation or a gradient stroke that "flows" between nodes.

 

### Input Fields

- **State:** Resting state is a `surface-container-low` fill with a bottom-only Ghost Border.

- **Active:** Border transforms into a 2px `primary-container` solid line with a subtle ambient glow.

 

---

 

## 6. Do's and Don'ts

 

### Do:

- **Use Asymmetric Margins:** Let a headline bleed into the left margin while the body text is tucked safely in the grid.

- **Embrace the Glow:** Use the "connectivity node" aesthetic for data points in charts.

- **Nesting Surfaces:** Place `surface-container-lowest` elements inside `surface-container-high` sections to create "wells" of content.

 

### Don't:

- **No 100% Opaque Borders:** This shatters the premium "glass and light" aesthetic.

- **No Sharp Corners:** Avoid `none` or `sm` roundedness for main containers. Stick to `md` (0.75rem) or `lg` (1rem) to mimic Xiaomi’s hardware curvature.

- **No Default Shadows:** Never use the standard (0, 4, 8) drop shadow. It looks "template-grade" and cheapens the documentary's visual authority.