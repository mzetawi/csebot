import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ScanLine,
  RotateCcw,
} from 'lucide-react';

import { useExperience } from '../../store/experienceStore';
import { useOrientation } from '../../hooks/useOrientation';

import {
  requestOrientation,
  useDeviceOrientation,
  resetMotion,
} from '../../hooks/useDeviceOrientation';

import { useAudioManager } from '../../hooks/useAudioManager';
import { usePresentationTimeline } from '../../hooks/usePresentationTimeline';

import { scenes } from '../../data/scenes';

import {
  CLUB_WEBSITE_URL,
  EXPERIENCE,
} from '../../config/experience';

import { OrientationGate } from './OrientationGate';
import { StartExperience } from './StartExperience';
import { SceneCanvas } from './SceneCanvas';
import { CardSequence } from './hologram/CardSequence';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ClubWebsiteHologram } from './hologram/ClubWebsiteHologram';
import { ScanEffect } from './effects/ScanEffect';
import { Controls } from './ui/Controls';

import {
  useFullscreen,
  requestImmersiveFullscreen,
} from '../../hooks/useFullscreen';

import {
  ProgressBar,
  Telemetry,
} from './ui/ProgressBar';

export function Experience() {
  useOrientation();
  useDeviceOrientation();
  useFullscreen();
  usePresentationTimeline();

  const audio = useAudioManager();
  useEffect(() => { void audio.preload(); }, [audio]);

  const state = useExperience(
    useShallow((s) => ({
      experienceState: s.experienceState,
      isLandscape: s.isLandscape,
      paused: s.paused,
      quality: s.quality,
      started: s.started,
      completed: s.completed,
      error: s.error,
      currentScene: s.currentScene,
      gyroActive: s.gyroActive,
      clubIdentityVisible: s.clubIdentityVisible,
      replayVersion: s.replayVersion,
      set: s.set,
    }))
  );

  const scene =
    scenes.find(
      (s) =>
        s.id === state.currentScene
    ) ?? scenes[0];

  const starting = useRef(false);

  /*
   * BOOT -> READY
   */
  useEffect(() => {
    if (
      !state.isLandscape ||
      state.experienceState !== 'BOOT'
    ) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        useExperience
          .getState()
          .set({
            experienceState: 'READY',
          });
      },
      0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    state.isLandscape,
    state.experienceState,
  ]);

  /*
   * Start experience
   *
   * IMPORTANT:
   * audio.start() is called directly from
   * the user's click.
   *
   * AudioManager already handles:
   * - AudioContext unlock
   * - preload
   * - decoding
   * - tick(0)
   * - narration playback
   */
  const start = async () => {
    if (starting.current) {
      return;
    }

    starting.current = true;

    /*
     * These are intentionally fired directly
     * from the click interaction.
     */
    void requestImmersiveFullscreen();
    void requestOrientation();

    /*
     * Show the 3D experience immediately.
     */
    state.set({
      started: true,
      completed: false,
      error: null,
      experienceState: 'READY',
    });

    try {
      /*
       * Do NOT preload before this.
       *
       * AudioManager.start() already performs:
       * unlock -> preload -> decode -> tick(0)
       */
      await audio.start();
    } catch (error) {
      console.error(
        '[CSEBOT] Failed to start experience:',
        error
      );

      /*
       * Even if audio fails, keep the
       * visual presentation available.
       */
      useExperience
        .getState()
        .set({
          error: null,
          audioMode: 'subtitles',
        });
    } finally {
      starting.current = false;
    }
  };

  /*
   * Replay
   */
  const replay = async () => {
    resetMotion();

    state.set({
      started: true,
      completed: false,
      error: null,
    });

    try {
      await audio.start();
    } catch (error) {
      console.error(
        '[CSEBOT] Replay failed:',
        error
      );
    }
  };

  /*
   * Preload only the visual image.
   */
  useEffect(() => {
    const img = new Image();

    img.src =
      EXPERIENCE.clubImage;
  }, []);

  const active =
    state.started;

  const reduced =
    useReducedMotion();

  return (
    <main
      className={`
        experience
        ${
          state.paused
            ? 'is-paused'
            : ''
        }
        ${
          reduced
            ? 'reduced-motion'
            : ''
        }
        ${
          state.quality === 'low'
            ? 'low-quality'
            : ''
        }
      `}
    >
      {/* =========================
          BACKGROUND
          ========================= */}

      <div className="virtual-world">
        <div className="world-grid" />

        <div className="ambient-halo" />

        <div className="world-orbit orbit-one" />

        <div className="world-orbit orbit-two" />
      </div>

      <div className="world-vignette" />

      {/* =========================
          EXPERIENCE
          ========================= */}

      <div
        className="landscape-content"
        inert={!state.isLandscape}
      >
        <SceneCanvas />

        {/* =========================
            HEADER
            ========================= */}

        <header className="experience-header">
          <div className="brand">
            <ScanLine size={24} />

            <span>
              CSE
              <span>BOT</span>
            </span>

            <i />

            <small>
              INTERACTIVE GUIDE
            </small>
          </div>

          <div className="header-right">
            {active ? (
              <>
                <div className="mode-label">
                  <span className="status-dot" />

                  {state.gyroActive && (
                    <span className="gyro-label">
                      GYRO ·
                    </span>
                  )}

                  3D EXPERIENCE
                </div>

                <Controls
                  replay={() => {
                    void replay();
                  }}
                />
              </>
            ) : (
              <span
                className="university-label"
                dir="rtl"
              >
                جامعة فلسطين التقنية — خضوري
              </span>
            )}
          </div>
        </header>

        {/* =========================
            SCENE LABEL
            ========================= */}

        {active && (
          <div className="scene-heading">
            <span className="eyebrow">
              {String(
                Math.max(
                  1,
                  Math.round(
                    scene.start /
                      16
                  )
                )
              ).padStart(
                2,
                '0'
              )}{' '}
              / THE JOURNEY
            </span>

            <span dir="rtl">
              {scene.label}
            </span>
          </div>
        )}

        {/* =========================
            START SCREEN
            ========================= */}

        <AnimatePresence mode="wait">
          {!active &&
            state.experienceState !==
              'BOOT' && (
              <StartExperience
                key="start"
                requesting={false}
                onStart={() => {
                  void start();
                }}
              />
            )}
        </AnimatePresence>

        {/* =========================
            PRESENTATION
            ========================= */}

        {active && (
          <>
            <CardSequence />

            <AnimatePresence>
              {scene.id ===
                'scan' && (
                <ScanEffect
                  key="scan"
                />
              )}

              {scene.id ===
                'website' && (
                <ClubWebsiteHologram
                  key="website"
                />
              )}
            </AnimatePresence>

            {/* =========================
                FINAL
                ========================= */}

            {(scene.id ===
              'final' ||
              state.completed) && (
              <motion.div
                className="final-message"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <h1 dir="rtl">
                  أهلًا بك في
                  <br />

                  <span>
                    هندسة أنظمة الحاسوب
                  </span>
                </h1>

                {state.completed && (
                  <div className="final-actions">
                    <a
                      className="primary-button"
                      href={
                        CLUB_WEBSITE_URL
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      جميع روابط النادي

                      <ArrowUpRight
                        size={16}
                      />
                    </a>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        void replay();
                      }}
                    >
                      <RotateCcw
                        size={15}
                      />

                      إعادة الجولة
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            <Telemetry />

            <ProgressBar />
          </>
        )}

        {/* =========================
            BOOT
            ========================= */}

        <AnimatePresence>
          {state.experienceState ===
            'BOOT' && (
            <motion.div
              className="boot"
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.5,
              }}
            >
              <div className="boot-logo">
                CSE
                <span>
                  BOT
                </span>
              </div>

              <div className="boot-line" />

              <span className="boot-phase">
                INITIALIZING EXPERIENCE…
              </span>

              <span className="boot-phase second">
                CALIBRATING ENVIRONMENT…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================
          ORIENTATION
          ========================= */}

      {!state.isLandscape && (
        <OrientationGate
          started={
            state.started
          }
        />
      )}
    </main>
  );
}