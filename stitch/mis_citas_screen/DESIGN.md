---
name: Caribbean Modernist
colors:
  surface: '#f8faf9'
  surface-dim: '#d8dada'
  surface-bright: '#f8faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f3'
  surface-container: '#eceeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#3c4946'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#eff1f0'
  outline: '#6c7a76'
  outline-variant: '#bbcac5'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#00a896'
  on-primary-container: '#00352e'
  inverse-primary: '#59dbc7'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#ffd167'
  on-secondary-container: '#765900'
  tertiary: '#b71849'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff5b7f'
  on-tertiary-container: '#630021'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#79f7e3'
  primary-fixed-dim: '#59dbc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#ffdf9b'
  secondary-fixed-dim: '#edc157'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bc'
  on-tertiary-fixed: '#400013'
  on-tertiary-fixed-variant: '#910034'
  background: '#f8faf9'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  touch-target-min: 48px
---

## Brand & Style

The design system is built on the philosophy of "Tropical Clarity." It marries the vibrant energy of Caribbean culture with the structured efficiency of modern service booking. The brand personality is approachable, helpful, and didactic—guiding users through the booking process with an interface that feels as warm as a Havana afternoon but as precise as a professional appointment.

The visual style is **Modern/Minimalist** with a **Tactile** edge. It avoids the coldness of traditional tech by utilizing soft geometry, high-legibility type, and a color palette that evokes the sea and sun. Every interaction is designed to be low-stress, ensuring that users of all tech-literacy levels feel confident navigating the services.

## Colors

The palette is anchored by **Caribbean Teal**, used for primary actions, branding, and active states to evoke trust and serenity. **Saffron Yellow** serves as the high-energy accent, reserved for primary call-to-actions, promotional highlights, and "book now" triggers.

To maintain the "didactic" nature of the design system, neutrals are kept slightly cool (#F8FAF9) to contrast against the warmth of the saffron, ensuring the UI feels airy and clean. A tertiary "Hibiscus Red" (#EF476F) is utilized sparingly for error states and urgent notifications to maintain visibility without breaking the tropical harmony.

## Typography

This design system utilizes **Quicksand** exclusively to maintain a friendly, rounded aesthetic that remains highly legible. The "didactic" feel is achieved through generous line heights and clear hierarchy. 

Headlines use a heavier weight (700) to provide strong structural anchors on the page, while body text is kept at a medium weight (400-500) to ensure readability on mobile screens under various lighting conditions. Mobile-specific display sizes are capped at 32px to ensure titles do not wrap awkwardly on smaller devices common in the region.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile-first interaction. We use an 8px rhythmic scale to define all spatial relationships. 

- **Mobile:** 4-column grid with 20px side margins and 16px gutters.
- **Desktop:** 12-column grid with a max-width of 1140px.

A "Safe-Tap" philosophy is applied throughout this design system, ensuring no interactive element is smaller than 48x48px, accounting for the tactile nature of service booking apps where users are often on the go.

## Elevation & Depth

Hierarchy in the design system is communicated through **Ambient Shadows** and **Tonal Layering**. We avoid harsh black shadows in favor of tinted depths that utilize the primary teal or a deep slate blue to maintain the vibrant aesthetic.

- **Level 0 (Base):** The main canvas, using the background neutral.
- **Level 1 (Cards/Surface):** White surfaces with a very soft, diffused shadow (Blur: 12px, Opacity: 0.05, Y: 4). Used for service listings.
- **Level 2 (Floating/Nav):** Higher contrast shadows (Blur: 20px, Opacity: 0.1, Y: 8). Used for the bottom navigation bar and primary action buttons.

Glassmorphism is used exclusively for top-app bars during scroll to maintain context of the underlying content without sacrificing legibility.

## Shapes

The shape language is defined by **Soft Continuity**. 

- **Standard Elements:** (Buttons, Input Fields) use a 0.5rem (8px) radius.
- **Containers:** (Service Cards, Modal Sheets) use a `rounded-lg` 1rem (16px) radius to create a friendly, approachable container for information.
- **Selection States:** (Chips, Active Indicators) use a pill-shape (32px+) to provide maximum visual distinction from rectangular structural elements.

## Components

### Buttons
Primary buttons use the Saffron Yellow with dark-neutral text for maximum contrast. They feature a subtle "press" animation that scales the element down slightly (0.98x) to provide tactile feedback. Secondary buttons use the Caribbean Teal in an outlined or soft-fill style.

### Bottom Navigation
A persistent navigation bar with a frosted glass (Backdrop Blur) effect. Icons are stroke-based (2px weight) with the active state indicated by a Teal color change and a small saffron dot underneath.

### Service Cards
Cards are the primary didactic tool. They feature a large image at the top with a 16px corner radius, followed by clear typography for the service name, price, and a "Quick Book" button. 

### Input Fields
Inputs use a "Soft-Fill" style—a light grey background (#F0F5F4) that turns Teal on focus. Labels are always visible above the field (never just placeholder text) to aid user orientation.

### Service Icons
Icons for categories (Barbers, Salons, Restaurants) must use a consistent 2px stroke with rounded caps and joins to match the Quicksand typeface. They should be enclosed in a circular "blob" background of varying soft tropical pastels for easy categorization.