# Responsive Phone and iPad Layout Design

## Goal

Make Tide Ring usable at phone and iPad sizes without changing its desktop appearance or audio behavior. The interface must remain glanceable, touch-friendly, and suitable for one-handed use during a session.

## Supported Viewports

The responsive layout will be verified at these representative sizes:

- 390 × 844 phone portrait
- 430 × 932 large phone portrait
- 768 × 1024 iPad portrait
- 1024 × 768 iPad landscape

Desktop behavior above the tablet breakpoint must remain unchanged.

## Layout Behavior

### Header

On phones, the brand occupies its own row and the tuning badge remains visible beside it when space permits. Volume controls and segmented controls wrap into bounded rows without creating page-level horizontal overflow. Controls retain touch targets of at least 44 CSS pixels.

On iPad, the header wraps naturally into compact rows while preserving all controls and labels. No control is hidden behind a menu.

### Bowl Ring

The bowl stage scales from the available viewport width and height. It must fit within phone portrait width, preserve a square aspect ratio, and retain readable bowl labels. Existing JavaScript positioning continues to derive bowl sizes and locations from the rendered stage dimensions.

### Gong Controls

The three gong buttons remain in one row where width permits. On narrow phones they use equal flexible widths with compact text and spacing. They may wrap only if the viewport is narrower than the supported 390-pixel baseline.

### Ambience Console

The seven ambience sliders remain in one horizontal row on phones, as selected by the user. The console becomes a deliberate horizontal scroller with momentum scrolling, visible overflow affordance, and scroll snapping so each slider settles cleanly. Slider touch targets remain large enough for one-handed use.

At iPad widths, all seven sliders fit in a single row without page-level or console scrolling.

### Recordings Drawer and Help Text

Recording slots collapse to one column on phones and expand automatically at wider widths. Help text stays within the viewport and uses compact line height without becoming smaller than readable mobile text.

### Safe Areas

Body padding accounts for `env(safe-area-inset-left)`, `env(safe-area-inset-right)`, and `env(safe-area-inset-bottom)` so installed PWA and browser layouts do not collide with rounded corners or the home indicator.

## Implementation Boundaries

The change will be CSS-first and limited to responsive presentation. Existing HTML structure, audio code, service worker behavior, event handling, and data flow remain unchanged unless a test demonstrates a layout requirement cannot be met with CSS alone.

Two breakpoints will be used:

- Phone layout at widths up to 600 CSS pixels
- Tablet adjustments from 601 through 900 CSS pixels

Existing fluid sizing with `clamp()` remains the desktop baseline.

## Regression Checks

An automated viewport check will load the real application at each supported size and assert:

- The document does not overflow horizontally.
- Header controls remain inside the viewport.
- The bowl stage remains square and inside the viewport.
- Gong buttons are visible and meet the minimum touch height.
- The ambience console is a single row.
- Phone console content is horizontally scrollable.
- iPad console content fits without horizontal scrolling.

After automated checks pass, visual screenshots will confirm that text is legible, controls do not overlap, and the desktop layout is preserved.

## Delivery

The responsive change will be committed to `main`, pushed to `tlowguap/tide-ring`, deployed through the existing GitHub Pages configuration, and verified at the public URL.
