import { useRef, type RefObject } from "react";

import { useFrame } from "@react-three/fiber";

import {
  MathUtils,
  type Group,
  type MeshStandardMaterial,
  type MeshBasicMaterial,
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
  eyeMaterial: MeshBasicMaterial;
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

    const dt = Math.min(
      rawDelta,
      0.05
    );

    const c =
      controllers.current;

    /**
     * --------------------------------
     * RESET ON REPLAY
     * --------------------------------
     */
    if (
      c.version !==
      s.replayVersion
    ) {
      c.version =
        s.replayVersion;

      c.gesture =
        new RobotGestureController();

      c.mouth =
        new RobotMouthController();

      c.look =
        new RobotLookController();

      c.time = 0;

      c.nextBlink = 3;
      c.blinkAt = -10;
    }

    /**
     * --------------------------------
     * AUDIO STATE
     * --------------------------------
     *
     * أثناء Pause:
     * نخلي الفم يرجع يغلق،
     * لكن نوقف بقية حركة الجسم.
     */
    const sample = audioSync.sample();
    const speech = s.paused
      ? {
          ...sample,
          isSpeaking: false,
        }
      : sample;

    /**
     * --------------------------------
     * MOUTH
     * --------------------------------
     */
    const opening =
      c.mouth.update(
        dt,
        speech
      );

    /**
     * مقدار النشاط أثناء الكلام.
     *
     * نستخدم amplitude حتى لا تكون
     * الحركة ثابتة أو ميكانيكية.
     */
    const speakingAmount =
      speech.isSpeaking
        ? Math.min(
            1,
            opening * 0.85 +
              speech.audioAmplitude * 0.15
          )
        : 0;

    /**
     * حركة الفم.
     *
     * فتح الفم أوضح أثناء الكلام
     * لكنه يبقى Smooth.
     */
    // Imperative Three.js part refs are intentionally updated inside useFrame.
    // oxlint-disable-next-line react/immutability
    if (rig.mouth.current) {
      const targetMouthY =
        speech.isSpeaking
          ? 1 +
            opening *
              3.2
          : 1;

      const targetMouthX =
        speech.isSpeaking
          ? 1 -
            opening *
              0.15
          : 1;

      // oxlint-disable-next-line react/immutability
      rig.mouth.current.scale.y =
        MathUtils.damp(
          rig.mouth.current
            .scale.y,
          targetMouthY,
          14,
          dt
        );

      rig.mouth.current.scale.x =
        MathUtils.damp(
          rig.mouth.current
            .scale.x,
          targetMouthX,
          14,
          dt
        );
    }

    /**
     * أثناء Pause:
     * نوقف الجسم بعد تحديث الفم.
     */
    rig.eyeMaterial.color.setRGB(.025 + opening*.015, .58 + opening*.12, 1);
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
     * --------------------------------
     * GESTURE
     * --------------------------------
     *
     * نفس attention القادم من
     * PresentationController
     * هو المستخدم للكارد والروبوت.
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
     * --------------------------------
     * HEAD
     * --------------------------------
     *
     * أثناء الكلام:
     * nod صغير جدًا يعطي إحساس
     * أن الرأس متفاعل مع الجملة.
     *
     * أثناء ظهور كارد:
     * الرأس يبقى يتجه للكارد.
     */
    if (rig.head.current) {
      const speechNod =
        speech.isSpeaking &&
        !reduced
          ? 0.025 *
            speakingAmount
          : 0;

      c.look.update(
        rig.head.current
          .quaternion,
        dt,

        s.completed
          ? null
          : p.attention,

        gesture.nod +
          speechNod,

        reduced
      );
    }

    /**
     * --------------------------------
     * UPPER BODY
     * --------------------------------
     *
     * هنا نضيف:
     *
     * 1. Lean من gesture
     * 2. حركة تنفس/حديث بسيطة
     * 3. sway خفيف
     *
     * بدون مبالغة.
     */
    if (rig.upper.current) {
      const speakingLean =
        speech.isSpeaking &&
        !reduced
          ? 0.009 *
            speakingAmount
          : 0;

      const speakingSway =
        speech.isSpeaking &&
        !reduced
          ? Math.sin(
              c.time * 1.7
            ) *
            0.012 *
            speakingAmount
          : 0;

      const idleSway =
        reduced
          ? 0
          : Math.sin(
              c.time * 0.37
            ) * 0.006;

      rig.upper.current.rotation.x =
        MathUtils.damp(
          rig.upper.current
            .rotation.x,

          gesture.lean +
            speakingLean,

          4,
          dt
        );

      rig.upper.current.rotation.z =
        MathUtils.damp(
          rig.upper.current
            .rotation.z,

          idleSway +
            speakingSway,

          3,
          dt
        );
    }

    /**
     * --------------------------------
     * ARMS
     * --------------------------------
     *
     * نحافظ على GestureController
     * لأنه صار متزامن مع الكاردات.
     */
    if (rig.left.current) {
      rig.left.current.rotation.z =
        MathUtils.damp(
          rig.left.current
            .rotation.z,

          gesture.left,

          4,
          dt
        );
    }

    if (rig.right.current) {
      rig.right.current.rotation.z =
        MathUtils.damp(
          rig.right.current
            .rotation.z,

          gesture.right,

          4,
          dt
        );
    }

    /**
     * --------------------------------
     * ELBOWS
     * --------------------------------
     */
    for (const elbow of [
      rig.leftElbow,
      rig.rightElbow,
    ]) {
      if (!elbow.current) {
        continue;
      }

      elbow.current.rotation.x =
        MathUtils.damp(
          elbow.current
            .rotation.x,

          gesture.elbow,

          4,
          dt
        );

      elbow.current.rotation.y =
        MathUtils.damp(
          elbow.current
            .rotation.y,

          gesture.state ===
            "PRESENTING"
            ? 0.12
            : 0,

          4,
          dt
        );
    }

    /**
     * --------------------------------
     * BLINK
     * --------------------------------
     */
    if (
      c.time >
      c.nextBlink
    ) {
      c.blinkAt =
        c.time;

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
     * --------------------------------
     * EYES
     * --------------------------------
     *
     * نفس اتجاه الكارد الحالي.
     *
     * 0 = الجهة الأولى
     * 1 = الوسط
     * 2 = الجهة الثانية
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
        eyeTargetX =
          0.038;
      } else if (
        p.attention === 1
      ) {
        eyeTargetX = 0;
      } else if (
        p.attention === 2
      ) {
        eyeTargetX =
          -0.038;
      }

      /**
       * بعد نهاية العرض
       * يرجع ينظر للمشاهد.
       */
      if (s.completed) {
        eyeTargetX = 0;
      }

      rig.eyes.current.position.x =
        MathUtils.damp(
          rig.eyes.current
            .position.x,

          eyeTargetX,

          6,
          dt
        );
    }

    /**
     * --------------------------------
     * EYE EXPRESSION
     * --------------------------------
     */
    const happy =
      scene.id ===
        "welcome" ||
      scene.id ===
        "final";

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
     * --------------------------------
     * SPEECH GLOW
     * --------------------------------
     *
     * أثناء الكلام:
     * الإضاءة تزيد قليلًا حسب الصوت.
     *
     * هذا يساعد العين تفهم مباشرة
     * أن الصوت مرتبط بالروبوت.
     */
    if (rig.glow.current) {
      const speechGlow =
        speech.isSpeaking
          ? 0.22 +
            speakingAmount *
              0.28 +
            opening *
              0.18
          : 0;

      rig.glow.current
        .emissiveIntensity =
        MathUtils.damp(
          rig.glow.current
            .emissiveIntensity,

          1.25 +
            speechGlow,

          4,
          dt
        );
    }
  });
}