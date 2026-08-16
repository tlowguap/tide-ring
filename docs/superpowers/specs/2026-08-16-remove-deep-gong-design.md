# Remove Deep Gong Design

## Goal

Remove the Deep gong sound option from the hosted Tide Ring app without changing the other instruments or deleting the source recording.

## Changes

- Remove `gongDeep` from the sample-slot registry, built-in audio-file map, and rendered gong list.
- Remove `audio/deep-gong.mp3` from the service-worker precache and bump the cache version so installed devices receive the change.
- Keep the MP3 file in the repository so the removal remains reversible.
- Retain Temple gong and Bright gong; the existing responsive flex layout will center and reflow them automatically.

## Verification

- Add a browser test that fails while the Deep gong control exists and confirms the two remaining gong controls.
- Update tuning and service-worker assertions.
- Run the full Playwright suite, inspect phone and iPad geometry, deploy to GitHub Pages, and verify the public site.
