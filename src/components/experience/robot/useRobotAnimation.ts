import { useRef, type RefObject } from "react";

import { useFrame } from "@react-three/fiber";

import {
  MathUtils,
  type Group,
  type MeshStandardMaterial,
} from "three";

import { audioSync } from "../../../audio/AudioSyncController";

import { useExperience } from "../../../store/experienceStore";

import { sceneAt } from "../../../data/scenes";

import { reducedMotion } from "../../../hooks/useReducedMotion";

import { presentationAt } from "../../../presentation/PresentationController";

import { RobotGestureController } from "./RobotGestureController";

import { RobotMouthController } from "./RobotMouthController";

import { RobotLookController } from "./RobotLookController";

type GroupRef = RefObject<Group | null>;

type Rig = {
  upper: GroupRef;
  head: GroupRef;

  left: GroupRef;
  right: GroupRef;

  leftElbow: GroupRef;
  rightElbow: GroupRef;

  eyes: GroupRef;
  neutralEyes: GroupRef;
  happyEyes: GroupRef;

  mouth: GroupRef;

  glow: RefObject<MeshStandardMaterial | null>;
};

export function useRobotAnimation(rig: Rig) {
  const controllers = useRef({
    gesture: new RobotGestureController(),
    mouth: new RobotMouthController(),
    look: new RobotLookController(),

    time: 0,

    nextBlink: 3,
    blinkAt: -10,

    version: -1,
  });

  useFrame((_, rawDelta) => {
    const s = useExperience.getState();

    const dt = Math.min(rawDelta, 0.05);

    const c = controllers.current;

    /**
     * Reset animation controllers on replay.
     */
    if (c.version !== s.replayVersion) {
      c.version = s.replayVersion;

      c.gesture = new RobotGestureController();

      c.mouth = new RobotMouthController();

      c.look = new RobotLookController();

      c.time = 0;

      c.nextBlink = 3;

      c.blinkAt = -10;
    }

    /**
     * While paused:
     * mouth can still smoothly close,
     * but all body motion freezes.
     */
    const speech = s.paused
      ? {
          ...audioSync.state,
          isSpeaking: false,
        }
      : audioSync.state;

    /**
     * Mouth movement driven by recorded audio amplitude.
     */
    const opening = c.mouth.update(
      dt,
      speech
    );

    if (rig.mouth.current) {
      rig.mouth.current.scale.y =
        1 + opening * 5;

      rig.mouth.current.scale.x =
        1 - opening * 0.2;
    }

    if (s.paused) {
      return;
    }

    c.time += dt;

    const reduced =
      reducedMotion();

    const scene =
      sceneAt(s.time);

    const p =
      presentationAt(
        scene,
        s.sceneProgress,
        s.clubIdentityVisible
      );

    /**
     * Gesture selection.
     *
     * p.attention:
     * 0 = first card side
     * 1 = center
     * 2 = opposite card side
     */
    const gesture =
      c.gesture.update(dt, {
        speaking:
          speech.isSpeaking,

        attention:
          s.completed
            ? null
            : p.attention,

        cue:
          `${scene.id}:${p.cue}`,

        transition:
          p.transition,

        completed:
          s.completed,

        reduced,
      });

    /**
     * Head follows active card direction.
     */
    if (rig.head.current) {
      c.look.update(
        rig.head.current.quaternion,
        dt,
        s.completed
          ? null
          : p.attention,
        gesture.nod,
        reduced
      );
    }

    /**
     * Upper body lean and subtle floating sway.
     */
    if (rig.upper.current) {
      rig.upper.current.rotation.x =
        MathUtils.damp(
          rig.upper.current.rotation.x,
          gesture.lean,
          4,
          dt
        );

      rig.upper.current.rotation.z =
        MathUtils.damp(
          rig.upper.current.rotation.z,
          reduced
            ? 0
            : Math.sin(
                c.time * 0.37
              ) * 0.006,
          3,
          dt
        );
    }

    /**
     * Arms.
     */
    if (rig.left.current) {
      rig.left.current.rotation.z =
        MathUtils.damp(
          rig.left.current.rotation.z,
          gesture.left,
          4,
          dt
        );
    }

    if (rig.right.current) {
      rig.right.current.rotation.z =
        MathUtils.damp(
          rig.right.current.rotation.z,
          gesture.right,
          4,
          dt
        );
    }

    /**
     * Elbows.
     */
    for (const elbow of [
      rig.leftElbow,
      rig.rightElbow,
    ]) {
      if (!elbow.current) continue;

      elbow.current.rotation.x =
        MathUtils.damp(
          elbow.current.rotation.x,
          gesture.elbow,
          4,
          dt
        );

      elbow.current.rotation.y =
        MathUtils.damp(
          elbow.current.rotation.y,
          gesture.state ===
            "PRESENTING"
            ? 0.12
            : 0,
          4,
          dt
        );
    }

    /**
     * Blink timing.
     */
    if (
      c.time >
      c.nextBlink
    ) {
      c.blinkAt = c.time;

      c.nextBlink =
        c.time +
        3 +
        Math.random() * 4;
    }

    const blinkAge =
      c.time -
      c.blinkAt;

    const closure =
      blinkAge < 0.17
        ? Math.sin(
            (blinkAge /
              0.17) *
              Math.PI
          )
        : 0;

    /**
     * Eyes:
     *
     * IMPORTANT:
     * Direction now matches the cards.
     *
     * attention 0 -> positive X
     * attention 1 -> center
     * attention 2 -> negative X
     */
    if (rig.eyes.current) {
      rig.eyes.current.scale.y =
        Math.max(
          0.055,
          1 - closure
        );

      let eyeTargetX = 0;

      if (
        p.attention === 0
      ) {
        eyeTargetX = 0.038;
      } else if (
        p.attention === 1
      ) {
        eyeTargetX = 0;
      } else if (
        p.attention === 2
      ) {
        eyeTargetX = -0.038;
      }

      if (s.completed) {
        eyeTargetX = 0;
      }

      rig.eyes.current.position.x =
        MathUtils.damp(
          rig.eyes.current.position.x,
          eyeTargetX,
          6,
          dt
        );
    }

    /**
     * Happy eye expression
     * during welcome + final scenes.
     */
    const happy =
      scene.id === "welcome" ||
      scene.id === "final";

    if (
      rig.neutralEyes.current
    ) {
      rig.neutralEyes.current.visible =
        !happy;
    }

    if (
      rig.happyEyes.current
    ) {
      rig.happyEyes.current.visible =
        happy;
    }

    /**
     * Glow reacts slightly to speech
     * and mouth opening.
     */
    if (rig.glow.current) {
      rig.glow.current.emissiveIntensity =
        MathUtils.damp(
          rig.glow.current
            .emissiveIntensity,

          1.25 +
            (speech.isSpeaking
              ? 0.25 +
                opening *
                  0.25
              : 0),

          3,
          dt
        );
    }
  });
}