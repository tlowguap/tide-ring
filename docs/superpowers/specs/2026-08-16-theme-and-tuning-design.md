# Theme and Tuning Settings Design

## Goal

Add a persistent light/dark appearance setting and a live-selectable A=432 Hz or A=528 Hz tuning setting without changing Tide Ring's responsive layout, interaction model, or offline behavior.

The reported iPad Safari speaker issue is explicitly excluded at the user's request.

## Settings Controls

The header will contain two compact, touch-friendly settings:

- A theme toggle that switches between light and dark mode.
- A tuning dropdown with `A = 432 Hz` and `A = 528 Hz` options.

Both controls must remain at least 44 CSS pixels high on phone and coarse-pointer tablet layouts. They must wrap within the existing responsive header without page-level horizontal overflow.

## Theme Behavior

On first visit, the app follows `prefers-color-scheme`. If the system preference changes while no manual choice exists, the app updates immediately.

After the user toggles the theme, that manual choice is stored locally and overrides later system changes. If local storage is unavailable, the current session still changes theme and future visits fall back to the device preference.

The theme is applied through a root `data-theme` attribute and CSS custom properties. The existing light palette remains the light theme. Dark mode uses a deep coastal navy and teal palette with readable text, translucent dark surfaces, visible borders, and preserved active-state contrast. The page's `theme-color` meta value is updated with the active palette.

The toggle exposes its current state through accessible text and `aria-pressed`.

## Tuning Model

The tuning dropdown selects a single mutable reference pitch:

- `432` means A = 432 Hz.
- `528` means A = 528 Hz.

All equal-tempered note frequencies are calculated from the selected reference pitch. The seven bowl notes remain C, D, E, F, G, A, and B with the same semitone offsets. The octave control continues to shift those calculated values by ±1 octave.

Derived synthesized material also follows the selected reference pitch:

- Earth drone and sub tone
- Theta carrier and beat
- Koshi chimes and temple-bell pitch sets
- Synthesized bowl sustain and strikes
- Gong frequency metadata

The three built-in gong recordings, wind-chime recording, and user-loaded samples are pitch-shifted by the ratio `selectedReference / 432`. At A=528 this is approximately `1.2222`, so recordings play faster, brighter, and shorter. Their displayed gong frequencies change from 54/81/108 Hz to 66/99/132 Hz.

The selected tuning is stored locally. Storage failure falls back to A=432 on the next visit without blocking the current session.

## Live Tuning Change

Changing tuning updates every displayed frequency immediately.

If audio has not started, no audio work occurs; the first user gesture initializes the engine with the selected tuning.

During an active session:

- Unpitched ocean and rain voices continue unchanged.
- Active pitched ambience voices fade out, rebuild against the new reference pitch, and fade back to their preserved levels.
- Held or latched bowls fade out and restart at the corresponding new frequency while preserving their held state.
- Already-ringing one-shot gongs finish naturally; new strikes use the new playback-rate ratio.
- The transition must avoid abrupt starts or stops.

Changing tuning does not reset the session clock, octave, ambience levels, master volume, latch mode, or loaded recordings.

## Architecture

One settings model owns `theme`, `themeOverride`, and `referencePitch`. Pure frequency helpers accept a reference pitch rather than closing over a hard-coded `A432` constant. Audio voice constructors read the active derived tuning when creating new nodes.

Theme application, tuning calculation, and active-voice retuning remain separate functions so each behavior can be tested independently. No separate 432/528 pages or duplicated tuning tables will be introduced.

## Error Handling

- Local-storage reads and writes are wrapped so privacy settings or quota errors do not break startup.
- Unsupported system-theme listeners fall back to the preference captured at page load.
- A tuning change made while the AudioContext is suspended updates UI state immediately and defers audio rebuilding until the next valid user activation.
- Failure to decode a recording retains the existing synthesis/error behavior.

## Verification

Automated tests will cover:

- Device-theme selection when no override exists.
- Remembered light/dark override and accessible toggle state.
- A=432 and A=528 note, gong, and sample-rate calculations.
- Frequency labels after tuning and octave changes.
- Smooth active-voice retuning state without losing levels or held bowls.
- Header containment and 44-pixel controls at 390×844, 430×932, 768×1024, and coarse-pointer 1024×768.
- Fine-pointer desktop presentation remaining unchanged.

Visual checks will cover light and dark modes at phone, iPad portrait, iPad landscape, and desktop sizes. Dark-mode text, borders, controls, bowl labels, water columns, recording slots, and active states must remain legible.

Because `index.html` changes, the service-worker cache name advances from `tide-ring-v3` to `tide-ring-v4`. The completed release will be pushed to `main`, deployed through the existing public GitHub Pages site, and verified at `https://tlowguap.github.io/tide-ring/`.
