# Tide Ring — Developer Handover Brief

**Client:** Salty Dog Retreats
**Product:** A live accompaniment instrument for a sound healer, used during sessions
**Status:** Working prototype (`tide-ring-v3.html`), validated with the practitioner. Ready to be rebuilt as a production web app.
**Prepared:** August 2026

---

## 1. What this is, and who uses it

A single-screen instrument that sits on an iPad or laptop beside the practitioner during a sound bath. She plays it with one hand while working with her physical instruments and her clients.

This is **not** a music player and **not** a DAW. Two design constraints drive everything:

1. **Nothing ever cuts.** Every start and stop is a fade of 2–9 seconds. An abrupt sound in a sound bath is a failure, not a bug.
2. **One hand, glanceable, no reading.** Her eyes are on the room. Controls are large, always visible, never nested more than one level deep.

The prototype is deliberately not a design mock — the audio engine, the interaction model and the visual language in it are all the real thing and have been tuned against feedback. Treat it as an executable spec.

---

## 2. What exists

`tide-ring-v3.html` — one self-contained file, ~1,400 lines. No frameworks, no build step, no dependencies beyond two Google Fonts. Runs offline from a file:// URL.

| Part | Verdict |
|---|---|
| Synthesis engine (Web Audio) | **Keep.** Hard-won and tuned. Port largely as-is. |
| Scene transport (glide / scrub / pause / stop / manual takeover) | **Keep the model.** Rewrite as a proper state machine. |
| Visual language, palette, type, layout | **Keep.** Signed off by the client. |
| DOM wiring, global state, event handling | **Throw away.** Prototype-grade. |
| Sample loading | **Keep the concept, redo the delivery.** See §6. |

---

## 3. Functional specification

### 3.1 Bowl circle (top)
- Seven bowls arranged around a ring, root at 6 o'clock, ascending clockwise to crown. Physical metaphor: bowls set around a mat.
- Each shows **name**, **key letter**, **frequency in Hz**. Diameter and font size are computed from ring width, never fixed.
- **Tap** = strike. **Hold** = the note sustains underneath (bowed rim), releasing on lift with a 4.5s fade.
- **Latch** toggle in the header switches hold-to-sustain into tap-to-latch, so a bowl can sing hands-free.
- **Low / Mid / High** octave switch shifts the whole ring by ±1 octave; displayed Hz updates.
- Struck bowls emit a visual ripple. Stereo position is derived from the bowl's actual x-position in the ring.

### 3.2 Gongs
Three one-shot strike buttons directly under the circle: Deep 54 Hz, Temple 81 Hz, Bright 108 Hz. Tap to strike; hold past 420 ms to bow it into a sustained swell (synthesis path only). These play over everything and are not part of the scene bed.

### 3.3 Ambient bed — seven continuous layers
Ocean, Rain, Koshi chimes, Shell chimes, Temple bells, Earth drone, Theta beat.

- Vertical water-column faders, one per layer. Drag to set level. Tap the layer name to mute or restore to its last level (6s / 5s fade).
- Layers are **generative and endless**, not loops. Chimes, shells and bells are scheduled event streams with randomised timing, pitch and level, so nothing ever audibly repeats. This matters — preserve it.
- Layers spin up lazily on first use and then persist for the session.

### 3.4 Scenes
Five named scenes: Arrival, Deepening, Stillness, Return, Silence. Each defines a target level for every layer and optionally one bowl to hold underneath.

Tapping a scene starts a **glide** from the current mix to the target over an adjustable 5–180 s (default 30 s). The transport supports:

- **Scrub** — a draggable position bar with `elapsed / total`. Dragging jumps every layer to that point in the transition.
- **Pause** — freezes the glide *and* mutes the bed over 1.4 s. Resume unmutes over 1.6 s.
- **Stop** — silences over 1.8 s, then zeroes every layer and reopens the gate.
- **Manual takeover** — the critical behaviour. Touching any fader mid-glide removes that layer from the glide permanently; it stays where she puts it while everything else keeps moving. The strip highlights to show it's hand-held. Starting a new scene hands all layers back.
- **Scene volume** — rides the entire bed, independent of Room volume, and does not touch bowls or gongs.

### 3.5 Global
- **Room** master volume.
- **Fade all out** — nine-second exit from everything. This is the panic button; it must never be more than one tap away.
- Session clock in the centre of the ring, starting on first interaction.
- No splash or start screen. Audio context is created and resumed on the first pointer event anywhere.

---

## 4. Audio architecture

Everything is Web Audio API. No audio files are required for the app to work.

```
bowls, gongs ─────────────────────────────► master ─► compressor ─► destination
                    └─► reverb send ─► revBus ─┘

ambient layer ─► layerGain ─► volDry ─► gateDry ─► master
             └─► revSend ──► volWet ─► gateWet ─► revBus
```

Two details worth carrying over verbatim:

- **`vol*` and `gate*` are separate nodes on purpose.** The volume node is what the Scene volume slider writes to; the gate is what pause and stop mute. Collapsing them into one node was a real bug in v2 — the slider stopped responding while paused.
- **Reverb** is a procedurally generated impulse response (5 s, decay 2.3), not a file. Keeps the app self-contained.

### Tuning
Everything pitched derives from **A = 432 Hz**, computed at runtime — there are no hardcoded frequencies. Bowls are equal temperament off 432 (C 257 / D 288 / E 324 / F 343 / G 385 / A 432 / B 485). Earth drone sits on 108, theta carrier on 216 with a 6 Hz beat, chimes and shells use a pentatonic derived from 432, gongs are 54 / 81 / 108. **Make the reference pitch a single constant** so 440 or other tunings become a one-line setting later — the client may want this.

### Synthesis notes
- **Bowls:** inharmonic partials at 1 / 2.76 / 5.4 / 8.9 / 13.4, each doubled with a small offset to create beating.
- **Gongs:** thirteen randomised inharmonic partials, three detuned oscillators each, a *delayed bloom* where high partials climb in over 0.1–2 s (this is what makes a gong sound real rather than synthetic), per-partial wobble LFOs, and a filter that opens then settles over 13 s. Every strike randomises ratios, decays and beat rates.
- **Shell chimes:** modal resonators — a 4 ms noise click exciting three high-Q bandpass filters. Physically correct and cheap. The nine-shell strand is deliberately untuned.
- **Temple bells:** rin standing bell with a hum tone an octave below the strike note, slow partial attacks, 14 s tail.
- **Ocean / rain:** filtered brown and white noise with LFO-driven swell.

---

## 5. Design system

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0F323F` | Primary text |
| `--ink-2` / `--ink-3` | `#446B79` / `#83A2AD` | Secondary, tertiary |
| `--lagoon` / `--lagoon-2` / `--lagoon-3` | `#7CC3D6` / `#3F92AC` / `#276579` | Fills, borders, active states |
| `--shell` | `rgba(255,255,255,.72)` | Card surfaces over the gradient |
| `--line` | `rgba(39,101,121,.15)` | All borders |
| Background | `linear-gradient(180deg, #F4FAFC, #E6F3F8 45%, #D8EBF3)`, fixed | Page |

Type: **Fraunces** (display, weight 300–400) and **Karla** (body). Self-host both — Google Fonts is a network dependency and the app must work offline.

Bowl tints run from `#3F92AC` (root) to `#B4DAE5` (crown), encoding the ascending scale.

Reference: the client's own [villa wellness retreat page](https://saltydogretreats.com/villa-wellness-retreat/). Warm, coastal, unhurried. Avoid anything that reads as an audio plugin.

---

## 6. What needs building properly

### Priority 1 — production foundation
1. **Real recordings.** The single biggest quality win. Synthesis is good; a recording of her actual gongs and bowls is better. Build a sample layer with per-slot recordings, round-robin variants where available, and randomised pitch/level per hit so repeats never sound identical. Ship the samples with the app; keep synthesis as the offline fallback. The prototype has a working file-picker version of this to build on. **Do not hotlink third-party audio** — the app must work with no network.
2. **PWA, offline-first.** Installable to the iPad home screen, service worker caching everything including samples and fonts. Retreat venues have unreliable wifi; a session must never depend on it.
3. **Proper state management.** The transport is a state machine (`idle / running / paused / done`) with a scrub position, a manual-override set, and a mute gate. Model it explicitly rather than as flags on an object.
4. **Wake lock and audio session handling.** Screen must not sleep. Handle backgrounding, interruptions, headphone connect/disconnect, and re-request the wake lock on visibility change.

### Priority 2 — features the client will ask for next
5. **Custom scenes.** Let her build, name, save and reorder her own scenes from the current mix. This is the natural next request and the data model should anticipate it now.
6. **Session presets.** Save a whole configuration — layer levels, scene set, glide length, tuning — and recall it. Different retreats, different rooms.
7. **Bowl tuning per-bowl.** Currently only a global octave shift. She will want to retune individual bowls.
8. **Interval bell / timer.** Soft chime after N minutes for timing a session arc.

### Priority 3 — worth discussing
9. Second screen for the room (visual only).
10. Session recording — capture the timeline of what she played, for review or reuse.
11. Two-device sync, so a phone can act as a remote.

---

## 7. Technical constraints and gotchas

- **iOS silent switch mutes Web Audio.** This has bitten us in testing. Set the audio session category appropriately, or at minimum warn on first launch. If it can't be solved reliably in the browser, that alone is the argument for a Capacitor wrapper.
- **Audio must start from a user gesture.** No splash screen is a client requirement, so the context is created on the first pointer event anywhere on the page. Preserve this.
- **`decodeAudioData` and Ogg Vorbis** are unreliable in Safari. Ship samples as AAC/M4A or MP3.
- **`StereoPannerNode`** needs a fallback path on older Safari; the prototype has one.
- **Node cleanup.** Every scheduled oscillator must be stopped and disconnected. The prototype does this with `setTimeout` after the release tail — replace with a proper voice pool. A ninety-minute session with hundreds of strikes will leak otherwise.
- **CPU budget.** A gong strike is ~40 oscillators. Cap concurrent voices and profile on the oldest iPad the client actually owns, not a dev machine.
- **Touch.** `touch-action: none` on faders, pointer capture on every draggable, `user-select: none` throughout, and no reliance on hover.

---

## 8. Suggested stack

Vanilla TypeScript with Vite, or Svelte if a framework is wanted — the UI is small and mostly custom controls, so React would be overhead. The audio engine should be a framework-agnostic module with no DOM knowledge, so it can survive a UI rewrite. Vitest for engine unit tests; Playwright for interaction. Deploy as a PWA first; evaluate Capacitor only if the iOS silent-switch problem can't be solved in the browser.

---

## 9. Acceptance criteria

- No sound ever starts or stops instantly. Every transition is audibly a fade.
- Any fader responds within one frame of touch, during a scene glide, while paused, and while stopped.
- Scene volume changes are audible immediately in every transport state.
- The app functions fully with the device in airplane mode, from a cold start.
- Ninety minutes of continuous use with no audible dropout, no CPU climb, no memory growth.
- Fade all out silences everything within nine seconds from any state.
- Screen never sleeps during a session.
- Runs on the client's iPad in both orientations without horizontal scrolling.

---

## 10. Open questions for the client

1. Are her own gong, bowl and chime recordings available, or should a recording session be budgeted? This determines the single biggest quality variable.
2. Should scenes be user-editable in v1, or are the five fixed scenes enough to launch?
3. One practitioner, or will this be rolled out to other facilitators — and does that mean accounts, or is a shared installed app sufficient?
4. Is 432 Hz fixed, or should the reference pitch be a setting?
5. Any need to run sound to a separate PA rather than the device output? That changes the routing and latency requirements.
