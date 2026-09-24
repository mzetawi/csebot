import { audioSync } from "./AudioSyncController";
import { scenes, type Scene } from "../data/scenes";
import { spokenLines } from "../data/narration";
import { EXPERIENCE } from "../config/experience";
import { useExperience } from "../store/experienceStore";

/**
 * AudioManager
 *
 * Priority:
 * 1. Recorded audio files
 * 2. Browser Speech Synthesis fallback
 * 3. Subtitles only
 *
 * Important for iPhone / Safari:
 * - AudioContext must be unlocked from a real user interaction.
 * - Audio files may preload before AudioContext exists.
 * - Raw ArrayBuffers are therefore cached first and decoded later.
 */
export class AudioManager {
  context: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  gain: GainNode | null = null;

  private events: Record<
    string,
    {
      at: number;
      type: string;
    }[]
  > = {};

  /**
   * Decoded audio ready for playback.
   */
  private buffers = new Map<string, AudioBuffer>();

  /**
   * Raw audio files.
   *
   * This fixes an important Safari/iPhone issue:
   * audio may preload before AudioContext is unlocked.
   */
  private audioFiles = new Map<string, ArrayBuffer>();

  private cues: Record<
    string,
    {
      start: number;
      end: number;
      text: string;
    }[]
  > = {};

  private source: AudioBufferSourceNode | null = null;

  private index = 0;
  private offset = 0;
  private anchor = 0;

  private active = false;
  private paused = true;

  private utterance: SpeechSynthesisUtterance | null = null;

  private speechDone = true;
  private speechAttempted = false;

  private generation = 0;

  private bins: Uint8Array<ArrayBuffer> | null = null;

  private loading: Promise<void> | null = null;

  /**
   * Unlock Web Audio.
   *
   * IMPORTANT:
   * Call this as a direct result of a click/touch event on mobile.
   */
  async unlock() {
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("Web Audio API is not supported.");

        return;
      }

      this.context = new AudioContextClass();

      this.gain = this.context.createGain();

      this.analyser = this.context.createAnalyser();

      this.analyser.fftSize = 64;

      this.analyser.smoothingTimeConstant = 0.65;

      this.bins = new Uint8Array(
        this.analyser.frequencyBinCount,
      );

      this.gain.connect(this.analyser);

      this.analyser.connect(this.context.destination);
    }

    try {
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    } catch (error) {
      console.warn("Could not resume AudioContext:", error);
    }

    /**
     * Small silent buffer.
     *
     * Helps properly unlock audio output on some iOS/Safari versions.
     */
    try {
      if (this.context.state === "running") {
        const silentBuffer = this.context.createBuffer(
          1,
          1,
          this.context.sampleRate,
        );

        const silentSource =
          this.context.createBufferSource();

        silentSource.buffer = silentBuffer;

        silentSource.connect(this.context.destination);

        silentSource.start(0);
      }
    } catch {
      // Safari fallback — safe to ignore.
    }

    /**
     * Decode anything downloaded before AudioContext existed.
     */
    await this.decodePendingAudio();
  }

  /**
   * Decode downloaded audio files after AudioContext is available.
   */
  private async decodePendingAudio() {
    if (!this.context) return;

    const jobs: Promise<void>[] = [];

    for (const [id, data] of this.audioFiles.entries()) {
      if (this.buffers.has(id)) continue;

      const job = (async () => {
        try {
          /**
           * Safari can detach ArrayBuffers while decoding,
           * therefore always pass a copy.
           */
          const copy = data.slice(0);

          const decoded =
            await this.context!.decodeAudioData(copy);

          this.buffers.set(id, decoded);
        } catch (error) {
          console.warn(
            `[AudioManager] Failed to decode "${id}"`,
            error,
          );
        }
      })();

      jobs.push(job);
    }

    await Promise.all(jobs);
  }

  /**
   * Load narration manifest + audio files.
   *
   * Files can safely download even before Web Audio is unlocked.
   */
  preload() {
    if (this.loading) {
      return this.loading;
    }

    this.loading = (async () => {
      try {
        const response = await fetch(
          EXPERIENCE.audioManifest,
          {
            signal: AbortSignal.timeout(5000),
            cache: "default",
          },
        );

        if (!response.ok) {
          console.warn(
            "[AudioManager] Audio manifest unavailable:",
            response.status,
          );

          return;
        }

        const manifest = (await response.json()) as {
          language?: string;

          clips: Record<string, string>;

          events?: Record<
            string,
            {
              at: number;
              type: string;
            }[]
          >;

          subtitles?: Record<
            string,
            {
              start: number;
              end: number;
              text: string;
            }[]
          >;
        };

        /**
         * Only accept Arabic narration manifest.
         */
        if (!manifest.language?.startsWith("ar")) {
          console.warn(
            "[AudioManager] Narration manifest is not Arabic.",
          );

          return;
        }

        this.cues = manifest.subtitles ?? {};

        this.events = manifest.events ?? {};

        await Promise.all(
          Object.entries(manifest.clips).map(
            async ([id, path]) => {
              try {
                const url = new URL(
                  path,
                  window.location.origin,
                );

                /**
                 * Security:
                 * narration files must come from our own origin.
                 */
                if (
                  url.origin !==
                  window.location.origin
                ) {
                  console.warn(
                    `[AudioManager] External audio rejected: ${url}`,
                  );

                  return;
                }

                const res = await fetch(url, {
                  signal: AbortSignal.timeout(10000),
                  cache: "default",
                });

                if (!res.ok) {
                  console.warn(
                    `[AudioManager] Audio "${id}" returned ${res.status}`,
                  );

                  return;
                }

                const arrayBuffer =
                  await res.arrayBuffer();

                /**
                 * Keep raw audio regardless of AudioContext state.
                 */
                this.audioFiles.set(
                  id,
                  arrayBuffer,
                );

                /**
                 * If WebAudio already exists, decode immediately.
                 */
                if (
                  this.context &&
                  !this.buffers.has(id)
                ) {
                  try {
                    const decoded =
                      await this.context.decodeAudioData(
                        arrayBuffer.slice(0),
                      );

                    this.buffers.set(
                      id,
                      decoded,
                    );
                  } catch (error) {
                    console.warn(
                      `[AudioManager] Could not decode "${id}"`,
                      error,
                    );
                  }
                }
              } catch (error) {
                console.warn(
                  `[AudioManager] Failed loading "${id}"`,
                  error,
                );
              }
            },
          ),
        );

        /**
         * Audio may have loaded while context was being created.
         */
        if (this.context) {
          await this.decodePendingAudio();
        }
      } catch (error) {
        console.warn(
          "[AudioManager] Audio preload failed:",
          error,
        );
      } finally {
        useExperience.getState().set({
          audioReady: true,
        });
      }
    })();

    return this.loading;
  }

  private scene(): Scene {
    return scenes[this.index];
  }

  /**
   * Recorded file duration is the master duration.
   * Otherwise use nominal scene duration.
   */
  private duration() {
    const scene = this.scene();

    return (
      this.buffers.get(scene.id)?.duration ??
      scene.end - scene.start
    );
  }

  /**
   * Current playback position inside current scene.
   */
  private current() {
    return (
      this.offset +
      (!this.paused && this.context
        ? Math.max(
            0,
            this.context.currentTime -
              this.anchor,
          )
        : 0)
    );
  }

  /**
   * Stop current Web Audio source.
   */
  private haltSource() {
    if (!this.source) return;

    try {
      this.source.onended = null;

      this.source.stop();
    } catch {
      // Source already ended.
    }

    try {
      this.source.disconnect();
    } catch {
      // Safe fallback.
    }

    this.source = null;
  }

  /**
   * Play recorded narration.
   */
  private playBuffer() {
    if (!this.context || !this.gain) {
      return;
    }

    this.haltSource();

    const scene = this.scene();

    const duration = this.duration();

    if (this.offset >= duration) {
      return;
    }

    const recordedBuffer =
      this.buffers.get(scene.id);

    /**
     * No recording exists:
     * create silent timing buffer.
     *
     * Speech Synthesis will provide audio fallback.
     */
    const buffer =
      recordedBuffer ??
      this.context.createBuffer(
        1,
        Math.ceil(
          duration *
            this.context.sampleRate,
        ),
        this.context.sampleRate,
      );

    const source =
      this.context.createBufferSource();

    source.buffer = buffer;

    source.connect(this.gain);

    this.anchor = this.context.currentTime;

    try {
      source.start(
        0,
        Math.min(
          this.offset,
          Math.max(
            0,
            buffer.duration - 0.001,
          ),
        ),
      );
    } catch (error) {
      console.warn(
        "[AudioManager] source.start failed:",
        error,
      );

      return;
    }

    this.source = source;

    this.anchor = this.context.currentTime;

    /**
     * Recorded voice drives lip sync.
     */
    if (recordedBuffer) {
      audioSync.startSpeaking(
        "audioFile",
        scene.id,
        scene.lines.join(" "),
      );

      source.onended = () => {
        if (this.source === source) {
          audioSync.stopSpeaking();
        }
      };
    }
  }

  /**
   * Browser speech fallback.
   *
   * Used ONLY when no recorded file exists.
   */
  private speak() {
    const scene = this.scene();

    const state = useExperience.getState();

    /**
     * Recorded narration wins.
     */
    if (this.buffers.has(scene.id)) {
      this.speechDone = true;

      state.set({
        audioMode: "recorded",
      });

      return;
    }

    /**
     * No fallback speech available.
     */
    if (
      !scene.lines.length ||
      !("speechSynthesis" in window) ||
      state.muted
    ) {
      this.speechDone = true;

      state.set({
        audioMode: "subtitles",
      });

      return;
    }

    this.speechAttempted = true;

    this.speechDone = false;

    const gen = this.generation;

    audioSync.stopSpeaking();

    let boundary = 0;

    const lines =
      spokenLines[scene.id] ?? [];

    const text = lines.join(" ");

    if (!text.trim()) {
      this.speechDone = true;

      state.set({
        audioMode: "subtitles",
      });

      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.onboundary = (event) => {
      if (gen !== this.generation) {
        return;
      }

      boundary = event.charIndex;

      audioSync.update(
        boundary /
          Math.max(
            1,
            utterance.text.length,
          ),
      );

      let textOffset = 0;

      for (
        let i = 0;
        i < lines.length;
        i++
      ) {
        const line = lines[i];

        if (
          boundary <
          textOffset + line.length + 1
        ) {
          useExperience
            .getState()
            .set({
              subtitleText:
                scene.lines[i] ?? line,
            });

          audioSync.sentence(
            scene.lines[i] ?? line,
          );

          break;
        }

        textOffset += line.length + 1;
      }
    };

    utterance.lang =
      EXPERIENCE.narrationLanguage;

    utterance.rate = 1.1;

    utterance.pitch = 1;

    const voices =
      window.speechSynthesis.getVoices();

    utterance.voice =
      voices.find(
        (voice) =>
          voice.lang.startsWith("ar") &&
          /Hamed|Neural|Natural/i.test(
            voice.name,
          ),
      ) ??
      voices.find(
        (voice) =>
          voice.lang === "ar-SA",
      ) ??
      voices.find((voice) =>
        voice.lang.startsWith("ar"),
      ) ??
      null;

    /**
     * Safari frequently has no Arabic browser voice.
     * In that case just use subtitles.
     */
    if (!utterance.voice) {
      this.speechDone = true;

      state.set({
        audioMode: "subtitles",
      });

      return;
    }

    utterance.onstart = () => {
      if (gen !== this.generation) {
        return;
      }

      audioSync.startSpeaking(
        "browser",
        scene.id,
        scene.lines.join(" "),
      );

      audioSync.setPaused(
        this.paused,
      );
    };

    utterance.onend = () => {
      if (gen !== this.generation) {
        return;
      }

      this.speechDone = true;

      audioSync.stopSpeaking();
    };

    utterance.onerror = () => {
      if (gen !== this.generation) {
        return;
      }

      this.speechDone = true;

      audioSync.stopSpeaking();

      state.set({
        audioMode: "subtitles",
      });
    };

    utterance.lang =
      utterance.voice.lang;

    this.utterance = utterance;

    try {
      window.speechSynthesis.cancel();

      window.speechSynthesis.resume();

      window.speechSynthesis.speak(
        utterance,
      );

      state.set({
        audioMode: "speech",
      });
    } catch (error) {
      console.warn(
        "[AudioManager] Speech synthesis failed:",
        error,
      );

      this.speechDone = true;

      state.set({
        audioMode: "subtitles",
      });
    }
  }

  /**
   * Start presentation.
   *
   * IMPORTANT:
   * This should be called directly from a user click/touch.
   *
   * Example:
   *
   * button onClick={() => void audioManager.start()}
   */
  async start() {
    this.stop();

    audioSync.reset();

    /**
     * Unlock FIRST while we're still inside the user's interaction.
     */
    await this.unlock();

    /**
     * Make sure narration assets are loaded.
     *
     * If preload already ran, this resolves immediately.
     */
    await this.preload();

    /**
     * Decode files which may have loaded before AudioContext existed.
     */
    await this.decodePendingAudio();

    this.index = 0;

    this.offset = 0;

    this.active = true;

    this.paused =
      useExperience.getState().paused;

    this.generation++;

    useExperience.getState().set({
      clubIdentityVisible: false,

      replayVersion:
        useExperience.getState()
          .replayVersion + 1,
    });

    this.speechAttempted = false;

    this.speechDone = true;

    this.mute(
      useExperience.getState().muted,
    );

    useExperience.getState().set({
      subtitleText: null,
    });

    useExperience.getState().tick(0);

    if (!this.paused) {
      this.playBuffer();

      this.speak();
    }
  }

  /**
   * Called every animation frame.
   */
  update() {
    if (!this.active || this.paused) {
      return;
    }

    const duration =
      this.duration();

    const current =
      this.current();

    const scene = this.scene();

    /**
     * Recorded narration drives robot mouth level.
     */
    if (this.buffers.has(scene.id)) {
      audioSync.update(
        current / Math.max(duration, 0.001),
        this.level(),
      );
    }

    const durations = scenes.map(
      (s) =>
        this.buffers.get(s.id)?.duration ??
        s.end - s.start,
    );

    const total = durations.reduce(
      (a, b) => a + b,
      0,
    );

    const elapsed =
      durations
        .slice(0, this.index)
        .reduce(
          (a, b) => a + b,
          0,
        ) +
      Math.min(current, duration);

    const cue =
      this.cues[scene.id]?.find(
        (item) =>
          current >= item.start &&
          current < item.end,
      );

    /**
     * Club reveal event.
     */
    if (scene.id === "club") {
      const reveal =
        this.events.club?.find(
          (event) =>
            event.type ===
            "club-reveal",
        )?.at ?? 3.4;

      if (current >= reveal) {
        useExperience.getState().set({
          clubIdentityVisible: true,
        });
      }
    }

    /**
     * Recorded audio subtitle cue.
     */
    if (this.buffers.has(scene.id)) {
      useExperience.getState().set({
        subtitleText:
          cue?.text ?? null,
      });
    }

    /**
     * Some browser speech engines never send onend.
     *
     * Never cut recorded narration.
     * Only bound browser speech fallback.
     */
    if (
      !this.speechDone &&
      current > duration + 12
    ) {
      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      this.speechDone = true;

      audioSync.stopSpeaking();
    }

    /**
     * Move to next scene.
     */
    if (
      current >= duration &&
      this.speechDone
    ) {
      audioSync.stopSpeaking();

      this.haltSource();

      if (
        this.index ===
        scenes.length - 1
      ) {
        this.active = false;

        useExperience
          .getState()
          .tick(EXPERIENCE.duration);

        return;
      }

      this.index++;

      this.offset = 0;

      if (
        this.scene().id === "club"
      ) {
        useExperience.getState().set({
          clubIdentityVisible: false,
        });
      }

      useExperience.getState().set({
        subtitleText: null,
      });

      this.speechAttempted = false;

      this.speechDone = true;

      this.playBuffer();

      this.speak();

      return;
    }

    /**
     * Update presentation timeline.
     */
    const normalized =
      Math.min(
        current /
          Math.max(duration, 0.001),
        0.99999,
      );

    useExperience
      .getState()
      .tick(
        scene.start +
          normalized *
            (scene.end -
              scene.start),
      );

    useExperience.getState().set({
      totalProgress:
        total > 0
          ? elapsed / total
          : 0,
    });
  }

  /**
   * Pause narration.
   */
  pause() {
    audioSync.setPaused(true);

    if (this.paused) {
      return;
    }

    this.offset =
      this.current();

    this.paused = true;

    this.haltSource();

    if (
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Ignore browser-specific issue.
      }
    }
  }

  /**
   * Resume narration.
   */
  async resume() {
    if (
      !this.active ||
      !this.paused
    ) {
      return;
    }

    /**
     * On iPhone resume should also happen
     * from a real user interaction.
     */
    await this.unlock();

    this.paused = false;

    audioSync.setPaused(false);

    if (
      this.context?.state ===
      "suspended"
    ) {
      try {
        await this.context.resume();
      } catch {
        // Ignore.
      }
    }

    this.playBuffer();

    if (
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // Ignore.
      }
    }

    if (!this.speechAttempted) {
      this.speak();
    }
  }

  /**
   * Mute / unmute narration.
   */
  mute(muted: boolean) {
    audioSync.setMuted(muted);

    if (this.gain) {
      this.gain.gain.value =
        muted ? 0 : 1;
    }

    if (
      muted &&
      this.utterance
    ) {
      this.generation++;

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      this.speechDone = true;

      this.utterance = null;

      audioSync.stopSpeaking();
    }
  }

  /**
   * Current audio energy.
   *
   * Used to animate robot mouth.
   *
   * Returns value between 0 and 1.
   */
  level() {
    if (
      !this.analyser ||
      !this.bins ||
      this.paused
    ) {
      return 0;
    }

    this.analyser.getByteFrequencyData(
      this.bins,
    );

    const average =
      this.bins.reduce(
        (sum, value) =>
          sum + value,
        0,
      ) /
      this.bins.length /
      255;

    /**
     * Slightly amplify speech energy
     * for more visible mouth movement.
     */
    return Math.min(
      1,
      average * 1.35,
    );
  }

  /**
   * Stop current experience.
   */
  stop() {
    audioSync.stopSpeaking();

    this.generation++;

    this.haltSource();

    if (
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore.
      }
    }

    this.utterance = null;

    this.active = false;

    this.paused = true;

    this.speechDone = true;

    this.speechAttempted = false;
  }

  /**
   * Destroy manager.
   */
  dispose() {
    this.stop();

    if (this.context) {
      try {
        void this.context.close();
      } catch {
        // Ignore.
      }
    }

    this.context = null;

    this.analyser = null;

    this.gain = null;

    this.loading = null;

    this.buffers.clear();

    this.audioFiles.clear();
  }
}

export const audioManager =
  new AudioManager();

/**
 * Browser speech queues can survive React HMR.
 * Dispose old manager during Vite hot reload.
 */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    audioManager.dispose();
  });
}