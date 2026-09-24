import { Euler, Quaternion } from "three";

export class RobotLookController {
  private target = new Quaternion();
  private euler = new Euler();

  update(
    head: Quaternion,
    delta: number,
    attention: number | null,
    nod: number,
    reduced: boolean
  ) {
    const amount = reduced ? 0.25 : 1;

    let yaw = 0;
    let roll = 0;

    /**
     * Card direction mapping
     *
     * 0 = first side
     * 1 = center
     * 2 = opposite side
     *
     * IMPORTANT:
     * This intentionally reverses the old mapping.
     */
    if (attention === 0) {
      yaw = 0.25;
      roll = -0.018;
    } else if (attention === 1) {
      yaw = 0;
      roll = 0;
    } else if (attention === 2) {
      yaw = -0.25;
      roll = 0.018;
    }

    this.euler.set(
      nod * amount,
      yaw * amount,
      roll * amount
    );

    this.target.setFromEuler(this.euler);

    head.slerp(
      this.target,
      1 - Math.exp(-Math.min(delta, 0.05) * 4)
    );
  }
}