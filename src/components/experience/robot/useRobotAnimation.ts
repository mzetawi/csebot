import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group, type MeshStandardMaterial } from 'three';
import { audioSync } from '../../../audio/AudioSyncController';
import { useExperience } from '../../../store/experienceStore';
import { sceneAt } from '../../../data/scenes';
import { reducedMotion } from '../../../hooks/useReducedMotion';
import { presentationAt } from '../../../presentation/PresentationController';
import { RobotGestureController } from './RobotGestureController';
import { RobotMouthController } from './RobotMouthController';
import { RobotLookController } from './RobotLookController';
type GroupRef=RefObject<Group|null>;
type Rig={upper:GroupRef;head:GroupRef;left:GroupRef;right:GroupRef;leftElbow:GroupRef;rightElbow:GroupRef;eyes:GroupRef;neutralEyes:GroupRef;happyEyes:GroupRef;mouth:GroupRef;glow:RefObject<MeshStandardMaterial|null>};
export function useRobotAnimation(rig:Rig){
 const controllers=useRef({gesture:new RobotGestureController(),mouth:new RobotMouthController(),look:new RobotLookController(),time:0,nextBlink:3,blinkAt:-10,version:-1});
 useFrame((_,rawDelta)=>{
  const s=useExperience.getState(),dt=Math.min(rawDelta,.05),c=controllers.current;
  if(c.version!==s.replayVersion){c.version=s.replayVersion;c.gesture=new RobotGestureController();c.mouth=new RobotMouthController();c.time=0;c.nextBlink=3;c.blinkAt=-10;}
  // Mouth may finish closing while the presentation is paused; the other joints freeze.
  const speech=s.paused?{...audioSync.state,isSpeaking:false}:audioSync.state;
  const opening=c.mouth.update(dt,speech);
  // These refs hold imperative Three.js objects, not React state.
  // oxlint-disable-next-line react/immutability
  if(rig.mouth.current){rig.mouth.current.scale.y=1+opening*5;rig.mouth.current.scale.x=1-opening*.2;}
  if(s.paused)return;
  c.time+=dt;const reduced=reducedMotion(),scene=sceneAt(s.time),p=presentationAt(scene,s.sceneProgress,s.clubIdentityVisible);
  const gesture=c.gesture.update(dt,{speaking:speech.isSpeaking,attention:s.completed?null:p.attention,cue:`${scene.id}:${p.cue}`,transition:p.transition,completed:s.completed,reduced});
  if(rig.head.current)c.look.update(rig.head.current.quaternion,dt,s.completed?null:p.attention,gesture.nod,reduced);
  if(rig.upper.current){rig.upper.current.rotation.x=MathUtils.damp(rig.upper.current.rotation.x,gesture.lean,4,dt);rig.upper.current.rotation.z=MathUtils.damp(rig.upper.current.rotation.z,reduced?0:Math.sin(c.time*.37)*.006,3,dt);}
  if(rig.left.current)rig.left.current.rotation.z=MathUtils.damp(rig.left.current.rotation.z,gesture.left,4,dt);
  if(rig.right.current)rig.right.current.rotation.z=MathUtils.damp(rig.right.current.rotation.z,gesture.right,4,dt);
  for(const elbow of [rig.leftElbow,rig.rightElbow])if(elbow.current){elbow.current.rotation.x=MathUtils.damp(elbow.current.rotation.x,gesture.elbow,4,dt);elbow.current.rotation.y=MathUtils.damp(elbow.current.rotation.y,gesture.state==='PRESENTING'?.12:0,4,dt);}
  if(c.time>c.nextBlink){c.blinkAt=c.time;c.nextBlink=c.time+3+Math.random()*4;}
  const blinkAge=c.time-c.blinkAt,closure=blinkAge<.17?Math.sin(blinkAge/.17*Math.PI):0;
  if(rig.eyes.current){rig.eyes.current.scale.y=Math.max(.055,1-closure);rig.eyes.current.position.x=MathUtils.damp(rig.eyes.current.position.x,p.attention===null?0:p.attention===2?.038:-.038,6,dt);}
  const happy=scene.id==='welcome'||scene.id==='final';
  if(rig.neutralEyes.current)rig.neutralEyes.current.visible=!happy;
  if(rig.happyEyes.current)rig.happyEyes.current.visible=happy;
  if(rig.glow.current)rig.glow.current.emissiveIntensity=MathUtils.damp(rig.glow.current.emissiveIntensity,1.25+(speech.isSpeaking?.25+opening*.25:0),3,dt);
 });
}
