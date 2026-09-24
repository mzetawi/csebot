import type { RobotPose } from '../../../data/scenes';
export type Pose = {left:number;right:number;head:number;lean:number};
export const poses:Record<RobotPose,Pose>={
 idle:{left:.12,right:-.12,head:0,lean:0},spawn:{left:.3,right:-.3,head:0,lean:0},
 wave:{left:.12,right:2.35,head:-.12,lean:.04},talk:{left:.25,right:-.4,head:.05,lean:0},
 pointLeft:{left:-1.25,right:-.15,head:.2,lean:-.05},pointRight:{left:.15,right:1.25,head:-.2,lean:.05},
 presentLeft:{left:-1.05,right:-.2,head:.15,lean:-.03},presentRight:{left:.2,right:1.05,head:-.18,lean:.03},
 openHands:{left:-.7,right:.7,head:0,lean:0},thinking:{left:.1,right:1.8,head:-.15,lean:.04},
 celebrate:{left:-1.65,right:1.65,head:0,lean:0},finalPose:{left:-.5,right:.8,head:-.05,lean:0},
};
