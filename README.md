# CSEBOT — one-minute spatial tour

The existing React + Vite + TypeScript project, upgraded to a landscape-only camera experience with a floating procedural mascot, holographic cards, calibrated device orientation and the exact club image supplied by the user. One R3F canvas overlays the camera; there is no WebXR, environment tracking, video recording or camera upload.

## Run and check

Node 22.12+ (24 recommended).

```sh
npm install
npm run dev
npm run check
npm run audio:validate
```

Production: `npm run build`, publish `dist` with HTTPS on Vercel, Netlify or Cloudflare Pages. Existing provider configurations are included. Phone camera/motion access requires HTTPS, except localhost on the device itself.

## Current tour

| Nominal time | Presentation |
| --- | --- |
| 0–5s | Camera, scan, platform, materialization and greeting gesture |
| 5–11s | Introduction |
| 11–24s | Software and systems, supporting engineering foundation |
| 24–32s | General technical paths |
| 32–44s | Computer Engineering Club |
| 44–53s | User-supplied website image in a spatial browser |
| 53–60s | Final welcome and actions |

There are **no narration subtitles** and **no English narration**. Old English recordings are not registered in the active manifest. Camera-permission waiting happens before the presentation clock starts. The native fullscreen request runs synchronously from the centered start button. Landscape lock follows it; gyro permission, camera permission and AudioContext activation are launched in the same click without awaiting a permission dialog first.

Browsers may refuse fullscreen, especially on iOS. The app retains a fixed `100vw × 100dvh` immersive layout. It cannot bypass browser permissions or prevent the user from exiting fullscreen. Portrait and hidden-tab changes pause the master clock and presentation. Native speech-engine pause support varies across browsers; exact decoded MP3 pause/resume is covered by tests.

## Preserved Arabic voice system

**Current default remains Arabic browser SpeechSynthesis**, with local recorded clips supported by the existing manifest. This animation upgrade does not migrate providers or require credentials. If no Arabic voice is installed, the existing visual fallback continues silently. Voice selection, Arabic narration, playback rate, audio scheduling and pause/replay behavior are preserved. The nominal tour is 60 seconds; browser utterances are allowed to finish, so duration depends on the installed voice.

The following offline Azure generator was already present. It remains optional and is not invoked by the application or required for these animation improvements.

The official `microsoft-cognitiveservices-speech-sdk` is a development dependency, used only by an offline Node script. It is not imported into `src` or included in the browser bundle. Narration lives in `src/data/narration.ar.json` with separate clean `displayText` and pronunciation-oriented `speechText`.

1. Copy `.env.example` to `.env.local`.
2. Set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`; do not prefix secrets with `VITE_`.
3. Optionally choose `AZURE_SPEECH_VOICE` (default `ar-SA-HamedNeural`).
4. Run `npm run audio:generate`.
5. Listen to **all six clips**, check technical Arabic pronunciation, refine tashkeel/punctuation if needed, regenerate, then reload the app.

The generator writes local MP3s to `public/audio/csebot/ar/` and atomically replaces `manifest-ar.json` after successful generation. It measures actual synthesis duration and adjusts speaking rate within a natural ±25% range, refusing out-of-range delivery rather than accepting an overlong tour. A club bookmark synchronizes the identity reveal. No runtime generation endpoint is enabled: without a configured authenticated server, local-file playback plus the explicitly accepted browser fallback is safer and avoids exposing a subscription key.

```sh
npm run audio:generate
node scripts/validate-audio.mjs --require-recordings
```

The strict validation command intentionally fails until recorded files exist. No dummy MP3s are substituted. Normal `npm run check` validates the accepted temporary mode. Audio is the clock: decoded clip durations drive scene progression and progress; no independently advancing carousel timer is used.

## Device handling

- Requests 1920×1080 with an environment-camera preference, then checks the returned facing direction. Front cameras are stopped and rejected.
- Unknown cameras must satisfy an exact environment constraint. A desktop with only a front camera correctly offers 3D mode.
- Explicitly labelled rear ultra-wide lenses are preferred. If a lens switch fails, the working rear stream is kept. Browsers do not consistently expose lens metadata, so true ultrawide capture cannot be guaranteed.
- Uses minimum zoom when exposed. Releases all tracks on replacement/unmount.
- Gyro baseline uses the phone's first actual beta/gamma readings, remapped for landscape-left/right, clamped and damped. Denial preserves the tour. Desktop pointers provide optional parallax.
- Camera, robot, card and website layers have separate depths; particle count and blur reduce under sustained slow frame rates.

## Robot and image

The mascot has a layered chest/core, glossy visor, eye shapes, randomized blinks, quaternion head turns, articulated elbows/hands and complete legs with knees/ankles. The body floats 0.22 scene units above the platform, with a damped, multi-frequency hover of only a few centimeters. Foot contact shadows were removed. Replay resets the presentation and animation state without reopening the camera.

`public/images/club-website-preview.jpg` is a byte-for-byte copy of the user's `IMG_5529.JPG`. It is preloaded, shown uncropped with its original aspect ratio, and placed behind a reflective segmented frame. The website scene uses **no iframe**. Its link comes from the single `CLUB_WEBSITE_URL` in `src/config/experience.ts`.

## Sources and practical limits

The [official PTUK program page](https://ptuk.edu.ps/ar/academic-programs/program.php?name=bachelor-of-computer-systems-engineering) and the [club's About page](https://cseptuk.com/about/) informed broad areas and activities. No courses, credits, statistics, committees or employment guarantees are asserted. Software dominates this tour; no unsupported software/hardware percentage is claimed.

Unit tests cover the audio clock, pause/replay, the active Arabic script, camera lens selection/failure cleanup, gyro baseline math, and fullscreen/permission rejection. Visual checks use landscape browser sizes. Physical iOS/Android camera-lens behavior, motion permissions, speech quality and sustained 45–60 FPS still require device testing. Desktop success does not establish those mobile hardware results.


## Animation architecture and future assets

- `src/audio/AudioSyncController.ts`: provider-neutral `isSpeaking`, `voiceSource`, `speechProgress`, `currentSentence`, `currentSection`, `audioAmplitude`. The existing manager only forwards start/end/error/boundary, pause, mute and analyser readings. Browser speech begins animating on `onstart`, not when an utterance is queued.
- `RobotMouthController`: analyser amplitude for decoded recordings; irregular syllables with randomized micro-pauses for browser synthesis, whose waveform is unavailable. A damped envelope closes the mouth on silence/pause/mute/end. This is approximate speech animation, not phoneme/viseme alignment.
- `RobotGestureController`: IDLE, LISTENING, SPEAKING, PRESENTING, EMPHASIS and TRANSITIONING, randomized durations, no consecutive identical gesture IDs, eased single gestures and calm intervals. `RobotLookController` uses quaternion interpolation to follow the upcoming card and return to the viewer. `useRobotAnimation` applies these controllers to the real procedural part refs.
- `PresentationController`: each section's existing audio-master progress drives reveal cues; attention starts 0.65 seconds before reveal. `CardSequence` retains previous cards within the section, highlights the newest card and never mounts upcoming cards. Section changes dissolve the old group. Replay clears the sequence; pause freezes its clock. Timings are section-relative, not word-level transcription.
- `SceneLighting` / `CinematicCamera`: smooth rim-light response and a very small camera push-in/reframe. Reduced-motion preference reduces hover and gestures, disables camera movement and spatial card movement, lowers particle count and simplifies entrances. No post-processing passes or real-time shadows were added.

Keep future uploads in the existing locations:

| Asset | Location / integration |
| --- | --- |
| Arabic recordings | `public/audio/csebot/ar/`; map scene IDs (`welcome`, `major`, `careers`, `club`, `website`, `final`) to same-origin file paths in `public/audio/csebot/manifest-ar.json`, keeping `language: "ar-SA"`. Actual decoded duration drives playback. No Azure dependency is required. |
| Robot GLB | `public/models/csebot.glb`; opt in through `EXPERIENCE.modelEnabled` and `modelUrl`. |
| Images | `public/images/`; club image path lives in `EXPERIENCE.clubImage`. |
| Textures | `public/textures/`; reference them from the future model/material. |
| Video / PDF | Add `public/videos/` or `public/documents/` when supplied and reference the file from its presentation component. These are extension points, not an implemented media uploader/player. |

No GLB/GLTF was supplied: the shipped robot has explicit procedural head/arm/elbow groups, but no skeleton, facial morph targets or embedded animation clips. Its mouth is a non-destructive visor display. `inspectModel` inventories actual nodes, bones, skinned meshes, morph dictionaries and clips when a future GLB is enabled (development console). Inspect that inventory before mapping facial controls, preferring morphs, then jaw/mouth joints; no bone names are assumed. Existing GLTF clip playback and fades remain intact. A custom model still requires its real rig mappings; procedural part controllers are not automatically compatible with arbitrary rigs.

Animation tests cover mouth gating and amplitude, all card reveal boundaries, club gate/replay, non-repeating gestures and real-node inventory. The audio integration test verifies delayed speech start, pause/resume, mute and stale replay callbacks. Browser validation does not establish physical phone sensor behavior or audible voice quality.
