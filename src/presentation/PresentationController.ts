import type {
  Scene,
} from "../data/scenes";

export type CardCue = {
  index: number;

  /**
   * اتجاه انتباه الروبوت.
   *
   * 0 = يمين
   * 1 = وسط
   * 2 = يسار
   */
  slot: number;

  /**
   * وقت الظهور بالثواني
   * داخل المشهد الحالي.
   */
  reveal: number;
};

/**
 * إنشاء cues للكاردات.
 *
 * revealAt الموجود داخل scenes.ts
 * هو المرجع الأساسي.
 *
 * وبالتالي:
 *
 * Audio progress
 *      ↓
 * PresentationController
 *      ↓
 * نفس اللحظة
 * ├─ Card
 * └─ Robot Gesture
 */
export function cardCues(
  scene: Scene
): CardCue[] {
  const duration =
    scene.end - scene.start;

  return scene.cards.map(
    (card, index) => {
      /**
       * إذا لم نحدد revealAt يدويًا،
       * نستخدم fallback قديم وآمن.
       */
      const fallbackReveal =
        0.85 +
        index *
          ((duration - 2) /
            Math.max(
              1,
              scene.cards.length
            ));

      const reveal =
        card.revealAt !==
        undefined
          ? Math.max(
              0,
              Math.min(
                1,
                card.revealAt
              )
            ) * duration
          : fallbackReveal;

      /**
       * إذا حددنا slot في scenes.ts
       * فهو المصدر الأساسي.
       */
      let slot:
        | 0
        | 1
        | 2;

      if (
        card.slot !== undefined
      ) {
        slot = card.slot;
      } else if (
        scene.cards.length ===
          2 &&
        index === 1
      ) {
        slot = 2;
      } else {
        slot = Math.min(
          2,
          index
        ) as 0 | 1 | 2;
      }

      return {
        index,
        slot,
        reveal,
      };
    }
  );
}

/**
 * حالة العرض في لحظة معينة.
 *
 * مهم:
 * التقدم progress مصدره AudioManager،
 * لذلك يبقى متزامنًا مع ملف MP3 الحقيقي.
 */
export function presentationAt(
  scene: Scene,
  progress: number,
  _clubIdentityVisible = true
) {
  const duration =
    scene.end - scene.start;

  const elapsed =
    Math.max(
      0,
      Math.min(1, progress)
    ) * duration;

  const cues =
    cardCues(scene);

  /**
   * الكاردات التي وصل وقتها.
   *
   * لا يوجد شرط خاص لنادي هندسة الحاسوب هنا.
   *
   * revealAt هو المرجع الوحيد للكارد،
   * حتى لا يحدث تعارض بين:
   *
   * clubIdentityVisible
   * و
   * توقيت التسجيل.
   */
  const visible =
    cues.filter(
      (cue) =>
        elapsed >=
        cue.reveal
    );

  const active =
    visible.at(-1)?.index ??
    -1;

  /**
   * ------------------------------------------------
   * ROBOT/CARD SYNCHRONIZATION
   * ------------------------------------------------
   *
   * الروبوت يبدأ الالتفات قبل ظهور الكارد
   * بقليل جدًا.
   *
   * ثم يشير إليه أثناء ظهوره.
   *
   * نفس cue هو المستخدم للكارد،
   * لذلك لا يوجد مصدر توقيت منفصل.
   */
  const PREPARE_TIME =
    0.18;

  const HOLD_TIME =
    1.45;

  const attention =
    cues.find(
      (cue) =>
        elapsed >=
          cue.reveal -
            PREPARE_TIME &&
        elapsed <
          cue.reveal +
            HOLD_TIME
    );

  /**
   * انتقال بداية المشهد.
   */
  const transition =
    elapsed < 0.2;

  return {
    visible,

    active,

    /**
     * نفس slot الخاص بالكارد
     * يُرسل للروبوت.
     */
    attention:
      attention?.slot ??
      (
        scene.id ===
          "website" &&
        elapsed < 2
          ? 2
          : null
      ),

    /**
     * تغيير cue يجبر
     * GestureController على
     * اختيار حركة presentation جديدة.
     */
    cue:
      attention?.index ??
      -1,

    transition,
  };
}