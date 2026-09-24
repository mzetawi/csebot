import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { reducedMotion } from '../../hooks/useReducedMotion';
import { useExperience } from '../../store/experienceStore';
export function CinematicCamera(){
 useFrame(({camera},delta)=>{
  const state=useExperience.getState();if(state.paused)return;const dt=Math.min(delta,.05),motion=state.started&&!reducedMotion();
  const x=motion&&state.currentScene==='website'?.055:0;
  const z=motion?7-.075*Math.min(state.sceneProgress*1.5,1):7;
  camera.position.x=MathUtils.damp(camera.position.x,x,1.2,dt);camera.position.z=MathUtils.damp(camera.position.z,z,.8,dt);
  camera.lookAt(0,.05,0);
 });return null;
}
