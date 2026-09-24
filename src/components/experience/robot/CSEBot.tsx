import {
  Component,
  Suspense,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  useAnimations,
  useGLTF,
} from "@react-three/drei";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import {
  EXPERIENCE,
} from "../../../config/experience";

import {
  useExperience,
} from "../../../store/experienceStore";

import {
  sceneAt,
} from "../../../data/scenes";

import {
  inspectModel,
} from "./inspectModel";

import {
  ProceduralRobot,
} from "./ProceduralRobot";

import {
  reducedMotion,
} from "../../../hooks/useReducedMotion";

import {
  parallax,
} from "../../../hooks/useDeviceOrientation";


/**
 * ============================================================
 * MODEL ERROR BOUNDARY
 * ============================================================
 *
 * إذا فشل تحميل موديل GLTF لأي سبب
 * نرجع تلقائيًا إلى ProceduralRobot.
 */
class ModelBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = {
    failed: false,
  };

  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }

  render() {
    if (this.state.failed) {
      return <ProceduralRobot />;
    }

    return this.props.children;
  }
}


/**
 * ============================================================
 * OPTIONAL GLTF MODEL
 * ============================================================
 *
 * يبقى موجود إذا أردت استخدام موديل خارجي لاحقًا.
 *
 * أما ProceduralRobot الجديد
 * فيعمل عندما modelEnabled = false
 * أو إذا فشل تحميل الموديل.
 */
function Model() {
  const {
    scene,
    animations,
  } = useGLTF(
    EXPERIENCE.modelUrl
  );

  const root =
    useRef<THREE.Group>(
      null
    );

  /**
   * DEV inventory only.
   */
  useEffect(() => {
    if (
      import.meta.env.DEV
    ) {
      console.info(
        "CSEBOT model inventory",
        inspectModel(
          scene,
          animations
        )
      );
    }
  }, [
    scene,
    animations,
  ]);

  const {
    actions,
    mixer,
  } = useAnimations(
    animations,
    root
  );

  const id =
    useExperience(
      (state) =>
        state.currentScene
    );

  const paused =
    useExperience(
      (state) =>
        state.paused
    );

  /**
   * تشغيل Animation المناسبة
   * للمشهد الحالي.
   */
  useEffect(() => {
    const pose =
      sceneAt(
        useExperience.getState()
          .time
      ).pose;

    const action =
      actions[pose] ??
      actions.idle;

    action
      ?.reset()
      .fadeIn(0.4)
      .play();

    return () => {
      action?.fadeOut(
        0.4
      );
    };
  }, [
    id,
    actions,
  ]);

  /**
   * وقف GLTF animation
   * أثناء Pause.
   */
  useEffect(() => {
    mixer.timeScale =
      paused
        ? 0
        : 1;
  }, [
    paused,
    mixer,
  ]);

  return (
    <group ref={root}>
      <primitive
        object={scene}
      />
    </group>
  );
}


/**
 * ============================================================
 * CSEBOT WORLD CONTROLLER
 * ============================================================
 *
 * هذا الملف يتحكم بحركة الروبوت كاملة داخل العالم:
 *
 * - Spawn
 * - Hover
 * - Floating
 * - Position
 * - Rotation
 * - Website transition
 * - Device parallax
 *
 * أما:
 *
 * الرأس
 * الأيدي
 * الفم
 * العيون
 * الصدر
 *
 * كلها موجودة داخل:
 *
 * useRobotAnimation.ts
 */
export function CSEBot() {
  const group =
    useRef<THREE.Group>(
      null
    );

  /**
   * الوقت الخاص بحركة الطيران.
   */
  const hoverTime =
    useRef(0);

  /**
   * تستخدم لإضافة حركة دخول
   * خفيفة عند البداية.
   */
  const spawnEnergy =
    useRef(0);

  useEffect(() => {
    useExperience
      .getState()
      .set({
        robotReady: true,
      });
  }, []);

  useFrame(
    (
      _,
      rawDelta
    ) => {
      const state =
        useExperience.getState();

      if (
        !group.current ||
        state.paused
      ) {
        return;
      }

      const delta =
        Math.min(
          rawDelta,
          0.05
        );

      hoverTime.current +=
        delta;

      const time =
        hoverTime.current;

      /**
       * Reduced Motion
       */
      const motionAmount =
        reducedMotion()
          ? 0.15
          : 1;

      /**
       * ======================================================
       * SCENE POSITION
       * ======================================================
       */
      const websiteScene =
        state.currentScene ===
        "website";

      /**
       * في مشهد الموقع نزيح الروبوت
       * لجهة حتى نعطي مساحة للمحتوى.
       */
      const targetX =
        websiteScene
          ? -2.05
          : 0;

      /**
       * ======================================================
       * PARALLAX
       * ======================================================
       *
       * حركة بسيطة جدًا حسب الجهاز.
       */
      const parallaxX =
        parallax.x *
        0.10 *
        motionAmount;

      /**
       * ======================================================
       * HORIZONTAL MOTION
       * ======================================================
       */
      group.current.position.x =
        THREE.MathUtils.damp(
          group.current
            .position.x,

          targetX +
            parallaxX,

          4,
          delta
        );

      /**
       * ======================================================
       * FLYING / HOVER MOTION
       * ======================================================
       *
       * الروبوت الجديد جسمه أثقل بصريًا،
       * لذلك حركة الطيران هنا أبطأ وأنعم.
       */

      const hoverPrimary =
        Math.sin(
          time * 0.72
        ) *
        0.032;

      const hoverSecondary =
        Math.sin(
          time * 0.41 +
            1.2
        ) *
        0.014;

      const hoverMicro =
        Math.sin(
          time * 1.23 +
            0.45
        ) *
        0.004;

      const hoverOffset =
        (
          hoverPrimary +
          hoverSecondary +
          hoverMicro
        ) *
        motionAmount;

      /**
       * ارتفاع الروبوت الأساسي.
       *
       * رفعناه قليلًا ليناسب
       * الجسم الجديد والأقدام الأطول.
       */
      const baseHeight =
        -1.28 +
        1.33 +
        0.27;

      /**
       * في website نصغره قليلًا
       * ونخفضه بشكل بسيط.
       */
      const websiteHeightOffset =
        websiteScene
          ? -0.14
          : 0;

      const targetY =
        baseHeight +
        websiteHeightOffset +
        hoverOffset;

      group.current.position.y =
        THREE.MathUtils.damp(
          group.current
            .position.y,

          targetY,

          4,
          delta
        );

      /**
       * ======================================================
       * DEPTH MOTION
       * ======================================================
       *
       * حركة للأمام والخلف شبه غير محسوسة.
       * تضيف إحساس أن الروبوت فعليًا طائر.
       */
      const targetZ =
        Math.sin(
          time * 0.28
        ) *
        0.025 *
        motionAmount;

      group.current.position.z =
        THREE.MathUtils.damp(
          group.current
            .position.z,

          targetZ,

          3,
          delta
        );

      /**
       * ======================================================
       * BODY TILT
       * ======================================================
       *
       * ميل طيران بسيط جدًا.
       */

      const targetRoll =
        (
          Math.sin(
            time * 0.43
          ) *
            0.008 +
          Math.sin(
            time * 0.19
          ) *
            0.003
        ) *
        motionAmount;

      group.current.rotation.z =
        THREE.MathUtils.damp(
          group.current
            .rotation.z,

          targetRoll,

          2.5,
          delta
        );

      /**
       * Y rotation:
       * دوران خفيف جدًا
       * حتى لا يبقى الجسم ثابتًا
       * بشكل مصطنع.
       */
      const targetYaw =
        Math.sin(
          time * 0.31
        ) *
        0.012 *
        motionAmount;

      group.current.rotation.y =
        THREE.MathUtils.damp(
          group.current
            .rotation.y,

          targetYaw,

          2.5,
          delta
        );

      /**
       * X rotation:
       * ميل بسيط أثناء الطيران.
       */
      const targetPitch =
        Math.sin(
          time * 0.26 +
            0.8
        ) *
        0.006 *
        motionAmount;

      group.current.rotation.x =
        THREE.MathUtils.damp(
          group.current
            .rotation.x,

          targetPitch,

          2.4,
          delta
        );

      /**
       * ======================================================
       * SPAWN
       * ======================================================
       *
       * Scale ناعم عند ظهور الروبوت.
       */
      const spawn =
        state.started
          ? THREE.MathUtils
              .smoothstep(
                state.time,
                2.7,
                3.5
              )
          : 0;

      spawnEnergy.current =
        THREE.MathUtils.damp(
          spawnEnergy.current,
          spawn,
          5,
          delta
        );

      /**
       * ======================================================
       * SCALE
       * ======================================================
       *
       * الجسم الجديد فيه تفاصيل أكثر
       * لذلك نخليه بالحجم الكامل في
       * معظم المشاهد.
       *
       * website أصغر حتى يترك مساحة.
       */
      const sceneScale =
        websiteScene
          ? 0.84
          : 1;

      const targetScale =
        sceneScale *
        spawnEnergy.current;

      const currentScale =
        group.current
          .scale.x;

      const smoothScale =
        THREE.MathUtils.damp(
          currentScale,
          targetScale,
          5,
          delta
        );

      group.current.scale.setScalar(
        smoothScale
      );
    }
  );

  return (
    <group
      ref={group}
      scale={0}
    >
      <ModelBoundary>
        <Suspense
          fallback={
            <ProceduralRobot />
          }
        >
          {EXPERIENCE.modelEnabled ? (
            <Model />
          ) : (
            <ProceduralRobot />
          )}
        </Suspense>
      </ModelBoundary>
    </group>
  );
}