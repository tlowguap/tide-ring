# Tide Ring

A live sound-healing instrument for Salty Dog Retreats. Seven singing bowls with selectable A = 432 Hz and A = 528 Hz tunings, two real gong recordings, and a continuous ambience bed. Built to sit on an iPad beside the practitioner during a session.

No build step, no dependencies, no server code. It is plain HTML, CSS and JavaScript.

---

## Putting it online with GitHub Pages

Free, public, and takes about five minutes.

1. Create a new repository on GitHub — for example `tide-ring`. Public is fine; there is nothing secret in here.
2. Upload the contents of this folder to the repository root. On github.com: **Add file → Upload files**, then drag everything in, including the `audio` and `icons` folders. Make sure `index.html` ends up at the top level, not inside a subfolder.
3. Go to **Settings → Pages**.
4. Under *Build and deployment*, set **Source** to `Deploy from a branch`, **Branch** to `main`, folder `/ (root)`. Save.
5. Wait a minute or two. The site appears at `https://<your-username>.github.io/tide-ring/`.

That URL is public. Anyone with the link can open it — there is no login. If you would rather it not be findable, keep the link private and add a `robots.txt` containing `User-agent: *` and `Disallow: /`.

### Getting it onto the iPad

Open the URL in Safari, then **Share → Add to Home Screen**. It installs as a standalone app with its own icon, opens without Safari's address bar, and works offline from then on.

### Updating it later

Replace the changed files in the repository, **and bump the version string at the top of `sw.js`** (`tide-ring-v1` → `tide-ring-v2`). Without that, devices that already have it installed will keep serving the old cached copy and your changes will not appear.

---

## What is in here

| File | Purpose |
|---|---|
| `index.html` | The whole app — markup, styles, audio engine |
| `settings.js` | Persistent light/dark theme and tuning preferences |
| `audio/` | The three active recordings plus the retained Deep gong source file |
| `icons/` | Home-screen and PWA icons |
| `manifest.webmanifest` | Makes it installable as an app |
| `sw.js` | Service worker; caches everything for offline use |
| `.nojekyll` | Stops GitHub Pages processing the files as a Jekyll site |
| `tide-ring-standalone.html` | Everything in one file, audio included as base64 |

### Which version to use

**Hosted (`index.html`)** for normal use. Smaller initial load, audio cached separately by the browser, installable, and updatable by pushing to the repository.

**Standalone (`tide-ring-standalone.html`)** as the backup. One 2.2 MB file with the audio embedded — put it on a USB stick or email it, double-click, and it runs with no server and no internet whatsoever. Worth keeping a copy on the iPad as insurance.

---

## Other ways to host it

Any static host works, and all of these are drag-and-drop:

- **Netlify Drop** — netlify.com/drop, drag the folder in, get a URL instantly. Easiest if you do not want a GitHub account.
- **Cloudflare Pages**, **Vercel**, **Surge** — all fine, all free at this size.
- **A plain web server** — copy the folder anywhere that serves static files.

The only requirement is that it is served over `http://` or `https://`. The service worker and the audio loading both need a real origin; opening `index.html` by double-clicking it from the filesystem will not load the gongs. That is what the standalone file is for.

---

## Notes for whoever maintains this

**Fonts.** Fraunces and Karla load from Google Fonts. The service worker caches them after the first visit, so offline use is fine once it has run online at least once. For guaranteed offline fidelity from a cold start, download the two `woff2` files, put them in a `fonts/` folder, replace the `<link>` in `index.html` with `@font-face` rules, and add the files to the `ASSETS` list in `sw.js`.

**Appearance and tuning.** The app follows the device's light or dark appearance until the header toggle is used. Both the manual appearance and tuning choice are remembered on that device. A = 432 Hz and A = 528 Hz use the same equal-temperament intervals.

**Audio.** Everything except the three active recordings is synthesised live in the Web Audio API — ocean, rain, koshi chimes, temple bells, earth drone and the theta binaural beat. Nothing loops except the wind chime bed, which is crossfaded end-to-start so the 95-second cycle has no audible seam. In A = 528 Hz mode, recorded gongs and wind chimes play at `528 / 432` (about 1.2222×), so they sound brighter, faster, and shorter. Changing tuning during a session smoothly rebuilds active pitched sounds; ocean and rain continue uninterrupted.

**Screen sleep.** The app takes a screen wake lock and re-takes it every time the page returns to the foreground, with a muted-video fallback for iOS below 16.4. The **Keep awake** button in the header shows whether it is actually holding. Also set the iPad's Auto-Lock to Never as a backstop.

**Locked-screen audio.** iOS suspends Web Audio when the device locks. This cannot be worked around in Safari; the app is designed to stop the screen locking instead. If genuine background audio is ever needed, the same HTML runs unchanged inside a Capacitor wrapper with the background audio mode enabled.

**Silent switch.** On iPad the physical silent switch or the software mute can silence Web Audio. If there is no sound at all, check that first.

See `tide-ring-handover-brief.md` for the full technical brief if this is being rebuilt as a production app.
