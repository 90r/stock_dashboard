# Stripe — Style Reference
> Architectural blueprint on white marble.

**Theme:** light

Stripe's design system evokes a digital command center on a clean canvas. It combines a serene white background with structured grid layouts and a single vibrant violet to highlight actions and key information. Subtle shadows provide soft elevation, preventing elements from feeling flat, while compact typography paired with highly descriptive gradients for hero sections and product showcases adds visual depth without clutter. The overall effect is one of quiet efficiency, where information is paramount, and interactions are clearly signposted.

## Colors

| Name | Value | Role |
|------|-------|------|
| Midnight Ink | `#061b31` | Primary text, critical headings, icons, primary button text for ghost buttons |
| Slate Blue | `#50617a` | Secondary text, muted links, subtle borders, descriptive captions |
| Ghost Gray | `#64748d` | Tertiary text, placeholder text, inactive states, subtle dividers |
| Platinum White | `#ffffff` | Page backgrounds, card surfaces, primary button text against dark backgrounds |
| Porcelain White | `#f8fafd` | Secondary card surfaces, subtle background variations |
| Powder Blue | `#e5edf5` | Background for secondary sections, light card backgrounds |
| Stone Gray | `#d8d6df` | Horizontal rules, subtle borders, graphical elements |
| Deep Violet | `#533afd` | Primary calls to action (buttons, links), active states, significant icons — establishes brand presence and emphasizes interaction |
| Washed Violet | `#b9b9f9` | Border for ghost buttons, subtle accents |
| Soft Violet | `#8087ff` | Decorative icons, gradient highlights, sub-brand accents |
| Accent Green | `#81b81a` | Green outline accent for tags, dividers, and focused UI edges |
| Vibrant Orange | `#ff6118` | Orange outline accent for tags, dividers, and focused UI edges. |
| Sunburst Gradient | `linear-gradient(90deg, rgb(114, 50, 241) 3.13%, rgb(251, 118, 250) 50%, rgb(255, 207, 94))` | Decorative gradients in hero sections and product showcases, adding a dynamic, abstract visual element |
| Dreamy Gradient | `radial-gradient(circle, rgb(127, 125, 252), rgb(244, 75, 204) 33%, rgb(229, 237, 245) 66%)` | Abstract background graphics, product display panels, adding depth and a tech-centric feel |
| Fuchsia Glow Gradient | `linear-gradient(0deg, rgb(255, 46, 222), rgb(210, 152, 255))` | Decorative illustration elements, feature highlights |

## Typography

### sohne-var — The primary typeface for all content. Weight 300 is used for large, impactful headlines, creating a sense of understated authority rather than shouting. Weight 400 is standard for body text, ensuring clarity and readability. The 'ss01' feature provides alternative character forms, and 'tnum' ensures tabular figures align numerically.
- **Substitute:** system-ui, sans-serif
- **Weights:** 300, 400
- **Sizes:** 8px, 9px, 10px, 11px, 12px, 14px, 16px, 18px, 20px, 22px, 26px, 32px, 34px, 44px, 48px, 56px
- **Line height:** 0.80, 0.85, 1.00, 1.03, 1.07, 1.10, 1.12, 1.15, 1.20, 1.25, 1.30, 1.33, 1.40, 1.43, 1.45, 1.50
- **Letter spacing:** -0.0300em at 56px, -0.0250em at 48px, -0.0090em at 18px
- **OpenType features:** `"ss01" on, "tnum"`

### Type Scale

| Role | Size | Line Height | Letter Spacing |
|------|------|-------------|----------------|
| caption | 11px | 1.45 | 0.03px |
| body | 14px | 1.4 | 0.003px |
| subheading | 18px | 1.25 | -0.009px |
| heading-sm | 22px | 1.2 | -0.01px |
| heading | 32px | 1.15 | -0.02px |
| heading-lg | 44px | 1.1 | -0.025px |
| display | 56px | 1.07 | -0.03px |

## Spacing & Layout

**Base unit:** 4px

**Density:** comfortable

- **Section gap:** 64px
- **Card padding:** 12px
- **Element gap:** 8px

### Border Radius

- **tags:** 4px
- **cards:** 6px
- **images:** 4px
- **inputs:** 4px
- **buttons:** 4px

## Components

### Primary Filled Button
**Role:** Main call to action.

Background: Deep Violet (#533afd), Text: Platinum White (#ffffff), Border: 4px radius, Padding: 15.5px vertical, 24px horizontal. Sohne-var weight 400.

### Ghost Button
**Role:** Secondary action. Low visual hierarchy.

Background: transparent, Text: Midnight Ink (#061b31), Border: 0px, Padding: 12px vertical, 0px horizontal. Sohne-var weight 400.

### Outlined Button
**Role:** Tertiary action.

Background: transparent, Text: Deep Violet (#533afd), Border: Washed Violet (#b9b9f9), 4px radius, Padding: 14.5px vertical, 24px horizontal. Sohne-var weight 400.

### Default Card
**Role:** Content container for features and information.

Background: Powder Blue (#e5edf5), Border: none, 6px radius, Padding: 12px.

### Feature Card
**Role:** Highlighting key features or product aspects.

Background: Porcelain White (#f8fafd), Border: none, 6px radius, Box Shadow: rgba(0, 0, 0, 0.2) 0px 0px 32px 8px. Padding: 12px.

### Primary Navigation Link
**Role:** Top-level navigation item.

Text: Midnight Ink (#061b31), Underline: none on hover, Padding: 0px.

## Do's and Don'ts

### Do
- Use Platinum White (#ffffff) as the default page background for most sections.
- Apply Deep Violet (#533afd) specifically for primary interactive elements, ensuring strong visual call to action.
- Employ sohne-var weight 300 for all display and large heading typography to maintain a refined, impactful presence.
- Keep card surfaces subtle, using Powder Blue (#e5edf5) or Porcelain White (#f8fafd) with soft 6px rounded corners.
- Utilize -0.0300em letter-spacing for large text (56px) to maintain a cohesive, modern typographic aesthetic.
- Implement radial and linear gradients for hero banners and product showcases to add dynamic visual interest without overwhelming the UI.
- Maintain a clear elementGap of 8px for logical grouping of related UI elements.

### Don't
- Do not use saturated colors for large areas or text unless they are part of a decorative gradient or a specific accent.
- Avoid using hard, sharp shadows; prefer soft, diffused shadows like rgba(0, 0, 0, 0.2) 0px 0px 32px 8px for elevation.
- Do not introduce new font families; sohne-var is the sole typeface for all typographic needs.
- Refrain from using border radii other than 4px and 6px for interactive components and cards, respectively.
- Do not use generic blue for links or buttons; Deep Violet (#533afd) is the designated action color.
- Avoid high-contrast, bold headlines; the system relies on lighter weights (300, 400) even for large text.
- Do not vary line heights significantly from the established typographic scale; ensure dense, compact text blocks for body copy and tighter leads for headlines.

## Elevation

- **Feature Card:** `rgba(0, 0, 0, 0.2) 0px 0px 32px 8px`
- **Hovered Card:** `rgba(50, 50, 93, 0.12) 0px 16px 32px 0px`

## Surfaces

- **Platinum White** (`#ffffff`) — Primary page background and base canvas.
- **Porcelain White** (`#f8fafd`) — Slightly elevated secondary surfaces, light card backgrounds.
- **Powder Blue** (`#e5edf5`) — Backgrounds for alternating sections or distinct content blocks.

## Imagery

The site uses a combination of abstract, vibrant gradients for hero sections and product showcases (e.g., radial-gradient using Deep Violet, pinks, and light blues), and clean, contained product screenshots that are often presented within device mockups. For illustrative purposes, icons are outlined or filled with brand colors, maintaining a minimal yet functional aesthetic. Imagery serves primarily as decorative atmosphere and product showcase, with a lesser emphasis on photography, emphasizing a more technical and abstract visual story.

## Layout

The page primarily uses a max-width contained layout, though the hero section often employs full-bleed vibrant gradients to establish a dynamic visual anchor. Sections exhibit a comfortable vertical rhythm, with consistent spacing and a blend of centered content stacks and alternating text-left/image-right arrangements. Feature sets are often presented in multi-column card grids, supporting compact information delivery. Navigation is handled by a sticky top bar with clearly defined interactive elements.

## Similar Brands

- **Linear** — Shares a sophisticated, modern aesthetic with minimal color, strong typography, and subtle UI elements.
- **Figma** — Utilizes a clean white workspace, subtle gray scale, and a vibrant primary accent color for actions.
- **Vercel** — Combines a technical, precise feel with thoughtful spacing, restrained color usage, and abstract background graphics.
- **Notion** — Employs a content-first approach with a high-contrast text palette, clean surfaces, and minimal decorative elements.
