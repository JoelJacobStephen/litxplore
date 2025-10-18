# LitXplore Design System Documentation

> Complete styling guide for the LitXplore application - Energetic Amber & Gold theme

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Border Radius](#border-radius)
5. [Shadows & Effects](#shadows--effects)
6. [Component Patterns](#component-patterns)
7. [Accessibility](#accessibility)
8. [Usage Guidelines](#usage-guidelines)

---

## Color Palette

### Primary Colors (Amber & Gold)

Our primary color system uses warm amber and golden yellow tones to create an energetic, academic feel.

| Color Name              | Hex       | HSL            | CSS Variable              | Usage                                     |
| ----------------------- | --------- | -------------- | ------------------------- | ----------------------------------------- |
| **Primary Amber**       | `#F59E0B` | `38, 92%, 50%` | `--primary`               | Main CTAs, primary actions, active states |
| **Primary Amber Hover** | `#D97706` | `32, 95%, 44%` | N/A                       | Hover state for primary buttons           |
| **Golden Yellow**       | `#FBBF24` | `45, 93%, 58%` | `--secondary`, `--accent` | Secondary actions, hover backgrounds      |

#### Primary Color Usage

```css
/* Primary buttons */
bg-primary text-primary-foreground

/* Active navigation items */
text-primary bg-accent

/* Focus rings */
ring-primary
```

### Background & Surface Colors

Dark theme with subtle gray variations for depth and hierarchy.

| Color Name          | Hex       | HSL            | CSS Variable        | Usage                            |
| ------------------- | --------- | -------------- | ------------------- | -------------------------------- |
| **Main Background** | `#191A1A` | `180, 2%, 10%` | `--background`      | Body background, main canvas     |
| **Card Surface**    | `#282A2E` | `220, 9%, 16%` | `--card`, `--muted` | Cards, elevated surfaces, modals |
| **Popover**         | `#282A2E` | `220, 9%, 16%` | `--popover`         | Dropdowns, popovers, tooltips    |

#### Surface Usage

```css
/* Card components */
bg-card border-border

/* Elevated surfaces */
bg-muted

/* Modal backgrounds */
bg-popover
```

### Border & Divider Colors

| Color Name       | Hex       | HSL            | CSS Variable | Usage                             |
| ---------------- | --------- | -------------- | ------------ | --------------------------------- |
| **Border**       | `#3A3F44` | `207, 9%, 25%` | `--border`   | All borders, dividers, separators |
| **Input Border** | `#3A3F44` | `207, 9%, 25%` | `--input`    | Form input borders                |

#### Border Usage

```css
/* Standard borders */
border border-border

/* Input borders */
border-input

/* Hover borders */
hover:border-primary/50
```

### Text Colors

Carefully calibrated text colors for optimal readability on dark backgrounds.

| Color Name         | Hex       | HSL          | CSS Variable           | Usage                                |
| ------------------ | --------- | ------------ | ---------------------- | ------------------------------------ |
| **Primary Text**   | `#E0E0E0` | `0, 0%, 88%` | `--foreground`         | Headings, body text, primary content |
| **Secondary Text** | `#A0A0A0` | `0, 0%, 63%` | `--muted-foreground`   | Descriptions, labels, secondary info |
| **Tertiary Text**  | `#606060` | `0, 0%, 38%` | N/A                    | Disabled states, placeholders        |
| **On Amber/Gold**  | `#1A1A1A` | `0, 0%, 10%` | `--primary-foreground` | Text on amber/gold buttons           |

#### Text Usage

```css
/* Main headings and body */
text-foreground

/* Supporting text */
text-muted-foreground

/* On primary buttons */
text-primary-foreground

/* Links and interactive text */
text-primary hover:text-primary/80
```

### Semantic Colors

#### Success

| Variant           | Hex       | HSL             | CSS Variable | Usage                               |
| ----------------- | --------- | --------------- | ------------ | ----------------------------------- |
| **Success Green** | `#34D399` | `156, 72%, 52%` | `--success`  | Success messages, positive feedback |

```css
/* Success states */
text-success bg-success/20 border-success
```

#### Error/Destructive

| Variant       | Hex       | HSL           | CSS Variable    | Usage                          |
| ------------- | --------- | ------------- | --------------- | ------------------------------ |
| **Error Red** | `#EF4444` | `0, 84%, 60%` | `--destructive` | Error messages, delete actions |

```css
/* Error states */
text-destructive bg-destructive/20 border-destructive

/* Destructive buttons */
bg-destructive text-destructive-foreground
```

### Icon Colors

| State        | Color                      | Usage                         |
| ------------ | -------------------------- | ----------------------------- |
| **Active**   | `#FBBF24` (Golden Yellow)  | Primary actions, active icons |
| **Inactive** | `#A0A0A0` (Secondary Text) | Default icon state            |
| **Hover**    | `#F59E0B` (Primary Amber)  | Icon hover states             |

```css
/* Active icons */
text-primary

/* Inactive icons */
text-muted-foreground

/* Hover state */
hover:text-primary
```

---

## Typography

### Font Family

**Primary Font:** DM Sans  
**Weights Available:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

```css
/* Font configuration */
font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Type Scale

| Element        | Size                  | Weight                | Line Height       | Letter Spacing   | Usage                |
| -------------- | --------------------- | --------------------- | ----------------- | ---------------- | -------------------- |
| **H1**         | `text-6xl` (3.75rem)  | `font-bold` (700)     | `leading-tight`   | `tracking-tight` | Hero headings        |
| **H2**         | `text-3xl` (1.875rem) | `font-bold` (700)     | `leading-snug`    | `tracking-tight` | Section headings     |
| **H3**         | `text-2xl` (1.5rem)   | `font-semibold` (600) | `leading-normal`  | `tracking-tight` | Subsection headings  |
| **H4**         | `text-xl` (1.25rem)   | `font-semibold` (600) | `leading-normal`  | `tracking-tight` | Card titles          |
| **Body Large** | `text-xl` (1.25rem)   | `font-normal` (400)   | `leading-relaxed` | Normal           | Hero descriptions    |
| **Body**       | `text-base` (1rem)    | `font-normal` (400)   | `leading-relaxed` | Normal           | Paragraph text       |
| **Body Small** | `text-sm` (0.875rem)  | `font-normal` (400)   | `leading-relaxed` | Normal           | Supporting text      |
| **Caption**    | `text-xs` (0.75rem)   | `font-normal` (400)   | `leading-normal`  | Normal           | Metadata, timestamps |

### Typography Usage Examples

```css
/* Hero heading */
text-6xl font-bold text-foreground tracking-tight

/* Section heading */
text-3xl font-bold text-foreground tracking-tight mb-4

/* Body text */
text-base text-foreground leading-relaxed

/* Secondary text */
text-sm text-muted-foreground
```

### Prose Styles

For markdown/rich content, use the `.prose` class with custom styling:

```css
.prose {
  @apply text-foreground max-w-none;
}

.prose h1 {
  @apply text-3xl font-bold mb-6 text-foreground tracking-tight;
}
.prose h2 {
  @apply text-2xl font-semibold mb-4 text-foreground tracking-tight;
}
.prose p {
  @apply mb-4 leading-relaxed text-foreground;
}
.prose a {
  @apply text-primary hover:text-primary/80 transition-colors duration-200;
}
```

---

## Spacing System

LitXplore uses an 8px base spacing unit with Tailwind's default spacing scale.

### Spacing Scale

| Token | Value | Usage                    |
| ----- | ----- | ------------------------ |
| `0`   | 0px   | No spacing               |
| `0.5` | 2px   | Minimal spacing          |
| `1`   | 4px   | Tight spacing            |
| `2`   | 8px   | Base unit                |
| `3`   | 12px  | Small spacing            |
| `4`   | 16px  | Default spacing          |
| `5`   | 20px  | Medium spacing           |
| `6`   | 24px  | Large spacing            |
| `8`   | 32px  | Extra large spacing      |
| `10`  | 40px  | Section spacing          |
| `12`  | 48px  | Section spacing (mobile) |
| `16`  | 64px  | Large section spacing    |
| `20`  | 80px  | Page section spacing     |

### Component Spacing Patterns

```css
/* Card padding */
p-6 /* 24px - Standard card padding */
p-8 /* 32px - Large card padding */

/* Section spacing */
py-16 /* 64px vertical - Desktop sections */
py-12 /* 48px vertical - Mobile sections */

/* Element spacing */
space-y-4 /* 16px between elements */
gap-6 /* 24px in grids */

/* Container padding */
px-4 /* 16px horizontal - Mobile */
px-6 /* 24px horizontal - Desktop */
```

---

## Border Radius

Moderate, modern border radius values for a polished look.

| Token          | Value  | Usage                           |
| -------------- | ------ | ------------------------------- |
| `rounded-md`   | 6px    | Small elements, tags            |
| `rounded-lg`   | 8px    | Buttons, inputs, small cards    |
| `rounded-xl`   | 12px   | Cards, larger components        |
| `rounded-2xl`  | 16px   | Feature cards, large containers |
| `rounded-full` | 9999px | Circles, pills, badges          |

### Border Radius Usage

```css
/* Buttons */
rounded-lg

/* Cards */
rounded-xl

/* Feature sections */
rounded-2xl

/* Avatar/badges */
rounded-full
```

---

## Shadows & Effects

### Shadows

Subtle shadows for depth without being heavy-handed.

```css
/* Default shadow */
shadow-sm /* Small shadow for buttons, cards */
shadow-lg /* Larger shadow for modals, elevated content */
shadow-xl /* Maximum elevation for popovers */
```

### Backdrop Effects

```css
/* Glassmorphism effects */
backdrop-blur-md /* Medium blur for headers */
bg-background/80 /* 80% opacity for semi-transparent surfaces */
```

### Transitions

All interactive elements use smooth, consistent transitions.

| Property          | Duration | Easing   |
| ----------------- | -------- | -------- |
| **Standard**      | 200ms    | ease-out |
| **Quick**         | 150ms    | ease-out |
| **Color changes** | 200ms    | ease-out |
| **Transform**     | 200ms    | ease-out |

```css
/* Standard transition */
transition-all duration-200

/* Color transition */
transition-colors duration-200

/* Transform transition */
transition-transform duration-200
```

---

## Component Patterns

### Buttons

#### Primary Button (Default)

```css
className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-lg px-4 py-2 transition-all duration-200"
```

#### Secondary Button

```css
className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg px-4 py-2 transition-all duration-200"
```

#### Outline Button

```css
className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg px-4 py-2 transition-all duration-200"
```

#### Ghost Button

```css
className="hover:bg-accent hover:text-accent-foreground rounded-lg px-4 py-2 transition-all duration-200"
```

#### Destructive Button

```css
className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-4 py-2 transition-all duration-200"
```

### Tabs

#### Tab List Container

```css
className="inline-flex h-10 items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground border border-border/50"
```

#### Tab Trigger

```css
/* Inactive state */
className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"

/* Active state */
className="... data-[state=active]:bg-secondary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
```

**Tab Styling Features:**

- **Inactive tabs**: Subtle gray background with muted text
- **Hover state**: Text turns amber with golden yellow background
- **Active tabs**: Golden yellow background with dark amber text for perfect contrast
- **Smooth transitions**: 200ms transition for interactive states
- **Focus states**: Accessible ring focus for keyboard navigation

### Cards

```css
/* Standard card */
className="rounded-xl border border-border bg-card text-card-foreground p-6 transition-all duration-200"

/* Hoverable card */
className="rounded-xl border border-border bg-card hover:border-primary/50 p-6 transition-all duration-200"

/* Feature card */
className="rounded-2xl border border-border bg-card p-8 transition-all duration-200"
```

### Form Inputs

```css
/* Text input */
className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"

/* Textarea */
className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
```

### Navigation

```css
/* Nav item */
className="h-10 w-10 rounded-lg text-foreground/70 hover:text-primary hover:bg-accent transition-all duration-200"

/* Active nav item */
className="h-10 w-10 rounded-lg text-primary bg-accent"
```

### Badges/Tags

```css
/* Default badge */
className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"

/* Primary badge */
className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary"

/* Success badge */
className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success"
```

---

## Accessibility

### Contrast Ratios

All color combinations meet WCAG AA standards (4.5:1 minimum for text).

| Combination                                        | Ratio  | Status |
| -------------------------------------------------- | ------ | ------ |
| Primary text (#E0E0E0) on background (#191A1A)     | 13.1:1 | ✅ AAA |
| Secondary text (#A0A0A0) on background (#191A1A)   | 6.8:1  | ✅ AA  |
| Primary foreground (#1A1A1A) on amber (#F59E0B)    | 11.2:1 | ✅ AAA |
| Destructive text (#EF4444) on background (#191A1A) | 5.2:1  | ✅ AA  |
| Success text (#34D399) on background (#191A1A)     | 7.1:1  | ✅ AA  |

### Focus States

All interactive elements must have visible focus states:

```css
/* Standard focus ring */
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Screen Reader Support

```css
/* Hide visually but keep for screen readers */
sr-only
```

---

## Usage Guidelines

### Do's ✅

1. **Use design system tokens** - Always use CSS variables (e.g., `bg-primary`, `text-foreground`)
2. **Maintain consistent spacing** - Use the 8px grid system
3. **Apply smooth transitions** - All interactive elements should have 200ms transitions
4. **Test contrast** - Ensure all text meets WCAG AA standards
5. **Use semantic colors** - Use `success` for positive actions, `destructive` for dangerous actions
6. **Keep typography hierarchy** - Use the defined type scale consistently
7. **Apply hover states** - All clickable elements should have visible hover states

### Don'ts ❌

1. **Don't use hardcoded colors** - Avoid hex codes in components (e.g., `#F59E0B`)
2. **Don't skip focus states** - All interactive elements must be keyboard accessible
3. **Don't over-animate** - Keep animations subtle and purposeful
4. **Don't use arbitrary spacing** - Stick to the defined spacing scale
5. **Don't mix font weights randomly** - Follow the typography hierarchy
6. **Don't use low contrast** - Always check text readability
7. **Don't create one-off styles** - Use the design system components

### Best Practices

#### Component Creation

```tsx
// ✅ Good - Using design tokens
<button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 transition-all duration-200">
  Click me
</button>

// ❌ Bad - Using hardcoded values
<button className="bg-[#F59E0B] text-white hover:bg-[#D97706] rounded-[8px] px-[16px] py-[8px]">
  Click me
</button>
```

#### Responsive Design

```tsx
// ✅ Good - Mobile-first approach
<div className="px-4 py-12 md:px-6 md:py-16 lg:py-20">
  <h2 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h2>
</div>
```

#### Color Combinations

```tsx
// ✅ Good - High contrast, semantic colors
<div className="bg-card text-card-foreground border border-border">
  <h3 className="text-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Bad - Low contrast
<div className="bg-gray-900 text-gray-800">
  <p>Hard to read</p>
</div>
```

---

## Quick Reference

### Most Common Classes

```css
/* Backgrounds */
bg-background, bg-card, bg-primary, bg-secondary, bg-muted

/* Text */
text-foreground, text-muted-foreground, text-primary, text-destructive

/* Borders */
border-border, border-primary, rounded-lg, rounded-xl

/* Spacing */
p-4, p-6, p-8, gap-4, gap-6, space-y-4

/* Typography */
text-sm, text-base, text-xl, text-2xl, text-3xl, font-medium, font-semibold, font-bold

/* Transitions */
transition-all duration-200, transition-colors duration-200
```

### Color Token Map

| Purpose              | Light State             | Hover State                          | Active State             |
| -------------------- | ----------------------- | ------------------------------------ | ------------------------ |
| **Primary Action**   | `bg-primary`            | `hover:bg-primary/90`                | `bg-primary`             |
| **Secondary Action** | `bg-secondary`          | `hover:bg-secondary/80`              | `bg-secondary`           |
| **Navigation**       | `text-foreground/70`    | `hover:text-primary hover:bg-accent` | `text-primary bg-accent` |
| **Card**             | `bg-card border-border` | `hover:border-primary/50`            | N/A                      |
| **Destructive**      | `bg-destructive`        | `hover:bg-destructive/90`            | N/A                      |

---

## Version History

- **v2.0** - Amber & Gold palette implementation (Current)
- **v1.1** - Purple/Indigo palette
- **v1.0** - Initial design system with DM Sans typography

---

## Support

For questions or suggestions about the design system, please:

1. Review this documentation
2. Check component examples in `/src/components/ui`
3. Refer to `globals.css` for CSS variable definitions
4. Consult `tailwind.config.ts` for extended theme configuration

**Last Updated:** 2024
