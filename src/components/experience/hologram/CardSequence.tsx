import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useShallow,
} from "zustand/react/shallow";

import {
  useExperience,
} from "../../../store/experienceStore";

import {
  sceneAt,
} from "../../../data/scenes";

import {
  presentationAt,
} from "../../../presentation/PresentationController";

import {
  useReducedMotion,
} from "../../../hooks/useReducedMotion";

import {
  HolographicCard,
} from "./HolographicCard";

export function CardSequence() {
  const {
    scene,
    version,
    signature,
  } = useExperience(
    useShallow((s) => {
      const scene =
        sceneAt(s.time);

      const presentation =
        presentationAt(
          scene,
          s.sceneProgress,
          s.clubIdentityVisible
        );

      /**
       * نخزن:
       *
       * card index
       * +
       * نفس slot الذي يستخدمه الروبوت.
       *
       * مثال:
       *
       * 0:0
       *
       * يعني:
       * card 0
       * robot attention 0
       */
      const signature =
        presentation.visible
          .map(
            (cue) =>
              `${cue.index}:${cue.slot}`
          )
          .join(",");

      return {
        scene,

        version:
          s.replayVersion,

        signature,
      };
    })
  );

  const reduced =
    useReducedMotion();

  const visible =
    signature
      ? signature
          .split(",")
          .map((value) => {
            const [
              index,
              slot,
            ] = value
              .split(":")
              .map(Number);

            return {
              index,
              slot,
            };
          })
      : [];

  const activeIndex =
    visible.at(-1)?.index ??
    -1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="cards-composition"

        key={`${version}-${scene.id}`}

        exit={{
          opacity: 0,

          filter: reduced
            ? "blur(0px)"
            : "blur(4px)",
        }}

        transition={{
          duration: reduced
            ? 0.1
            : 0.32,
        }}
      >
        {visible.map(
          ({
            index,
            slot,
          }) => {
            const card =
              scene.cards[index];

            if (!card) {
              return null;
            }

            /**
             * ------------------------------------------------
             * IMPORTANT
             * ------------------------------------------------
             *
             * Robot slot:
             *
             * 0 = يمين
             * 1 = وسط
             * 2 = يسار
             *
             * أما HolographicCard/CSS الحالي
             * عندك فترتيبه البصري معاكس.
             *
             * لذلك نعكس المكان هنا فقط.
             *
             * لا نعكس الـ cue.
             * لا نعكس الروبوت.
             * لا نعكس التوقيت.
             */
            const visualSlot =
              2 - slot;

            return (
              <HolographicCard
                key={`${scene.id}-${index}`}

                card={card}

                index={
                  visualSlot
                }

                active={
                  index ===
                  activeIndex
                }
              />
            );
          }
        )}
      </motion.div>
    </AnimatePresence>
  );
}