export type RobotState =
  | "IDLE"
  | "LISTENING"
  | "SPEAKING"
  | "PRESENTING"
  | "EMPHASIS"
  | "TRANSITIONING";

type Gesture = {
  id: string;
  left: number;
  right: number;
  elbow: number;
  lean: number;
  nod: number;
};

const gestures: Record<RobotState, Gesture[]> = {
  IDLE: [
    {
      id: "rest",
      left: 0.12,
      right: -0.12,
      elbow: -0.22,
      lean: 0,
      nod: 0,
    },
    {
      id: "settle",
      left: 0.09,
      right: -0.09,
      elbow: -0.25,
      lean: 0.008,
      nod: 0,
    },
  ],

  LISTENING: [
    {
      id: "listen",
      left: 0.1,
      right: -0.12,
      elbow: -0.22,
      lean: 0,
      nod: 0,
    },
    {
      id: "attentive",
      left: 0.12,
      right: -0.08,
      elbow: -0.25,
      lean: 0.012,
      nod: 0,
    },
  ],

  SPEAKING: [
    {
      id: "explain-left",
      left: -0.42,
      right: -0.1,
      elbow: -0.48,
      lean: 0.018,
      nod: 0,
    },
    {
      id: "explain-right",
      left: 0.1,
      right: 0.46,
      elbow: -0.4,
      lean: 0.024,
      nod: 0,
    },
    {
      id: "open",
      left: -0.32,
      right: 0.34,
      elbow: -0.3,
      lean: 0.016,
      nod: 0.025,
    },
  ],

  PRESENTING: [
    {
      id: "offer",
      left: -0.82,
      right: 0.82,
      elbow: -0.36,
      lean: 0.018,
      nod: 0,
    },
    {
      id: "indicate",
      left: -0.66,
      right: 0.66,
      elbow: -0.55,
      lean: 0.025,
      nod: 0.02,
    },
  ],

  EMPHASIS: [
    {
      id: "affirm",
      left: 0.1,
      right: 0.5,
      elbow: -0.6,
      lean: 0.035,
      nod: 0.06,
    },
    {
      id: "underline",
      left: -0.5,
      right: -0.1,
      elbow: -0.5,
      lean: 0.03,
      nod: 0.045,
    },
  ],

  TRANSITIONING: [
    {
      id: "gather",
      left: -0.22,
      right: 0.24,
      elbow: -0.32,
      lean: 0.01,
      nod: 0.02,
    },
    {
      id: "release",
      left: -0.16,
      right: 0.18,
      elbow: -0.28,
      lean: 0,
      nod: 0,
    },
  ],
};

export class RobotGestureController {
  state: RobotState = "IDLE";

  gesture = gestures.IDLE[0];

  private age = 0;
  private next = 0;
  private previous = "";
  private cue = "";

  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  update(
    delta: number,
    input: {
      speaking: boolean;
      attention: number | null;
      cue: string;
      transition: boolean;
      completed: boolean;
      reduced: boolean;
    }
  ) {
    this.age += Math.min(delta, 0.05);

    const desired: RobotState = input.completed
      ? "IDLE"
      : input.attention !== null
      ? "PRESENTING"
      : input.transition
      ? "TRANSITIONING"
      : input.speaking
      ? "SPEAKING"
      : "LISTENING";

    const sameFamily =
      desired === "SPEAKING" &&
      this.state === "EMPHASIS";

    if (
      (desired !== this.state && !sameFamily) ||
      input.cue !== this.cue ||
      this.age >= this.next
    ) {
      this.state =
        desired === "SPEAKING" &&
        this.random() < 0.22
          ? "EMPHASIS"
          : desired;

      const pool = gestures[this.state].filter(
        (gesture) =>
          gesture.id !== this.previous
      );

      this.gesture =
        pool[
          Math.floor(
            this.random() * pool.length
          )
        ];

      this.previous = this.gesture.id;
      this.cue = input.cue;

      this.age = 0;

      this.next =
        2.2 + this.random() * 2.8;
    }

    const weight = input.reduced
      ? 0.25
      : 1;

    const envelope =
      this.state === "PRESENTING"
        ? Math.min(1, this.age / 0.3)
        : Math.sin(
            Math.PI *
              Math.min(
                1,
                this.age / this.next
              )
          ) ** 2;

    const g = this.gesture;

    const amount =
      envelope * weight;

    const restingLeft = 0.12;
    const restingRight = -0.12;

    let targetLeft = g.left;
    let targetRight = g.right;

    /**
     * IMPORTANT:
     * Old implementation had the presentation
     * direction reversed.
     *
     * slot 0:
     * use RIGHT arm
     *
     * slot 1:
     * use BOTH arms
     *
     * slot 2:
     * use LEFT arm
     */
    if (
      this.state === "PRESENTING" &&
      input.attention !== null
    ) {
      if (input.attention === 0) {
        targetLeft = restingLeft;
        targetRight = g.right;
      }

      if (input.attention === 1) {
        targetLeft = g.left * 0.7;
        targetRight = g.right * 0.7;
      }

      if (input.attention === 2) {
        targetLeft = g.left;
        targetRight = restingRight;
      }
    }

    return {
      state: this.state,

      left:
        restingLeft +
        (targetLeft - restingLeft) *
          amount,

      right:
        restingRight +
        (targetRight - restingRight) *
          amount,

      elbow:
        -0.22 +
        (g.elbow + 0.22) *
          amount,

      lean:
        g.lean * amount,

      nod:
        g.nod * amount,
    };
  }
}