import { Component, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EXPERIENCE } from '../../../config/experience';
import { useExperience } from '../../../store/experienceStore';
import { sceneAt } from '../../../data/scenes';
import { inspectModel } from './inspectModel';
import { ProceduralRobot } from './ProceduralRobot';
import { reducedMotion } from '../../../hooks/useReducedMotion';
import { parallax } from '../../../hooks/useDeviceOrientation';
class ModelBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<ProceduralRobot/>:this.props.children;}}
function Model(){
 const {scene,animations}=useGLTF(EXPERIENCE.modelUrl),root=useRef<THREE.Group>(null);
 useEffect(()=>{if(import.meta.env.DEV)console.info('CSEBOT model inventory',inspectModel(scene,animations));},[scene,animations]);
 const {actions,mixer}=useAnimations(animations,root),id=useExperience(s=>s.currentScene),paused=useExperience(s=>s.paused);
 useEffect(()=>{const name=sceneAt(useExperience.getState().time).pose;const action=actions[name]??actions.idle;action?.reset().fadeIn(.4).play();return()=>{action?.fadeOut(.4);};},[id,actions]);
 // AnimationMixer is an imperative Three.js resource, not React state.
 // oxlint-disable-next-line react/immutability
 useEffect(()=>{mixer.timeScale=paused?0:1;},[paused,mixer]);
 return <group ref={root}><primitive object={scene}/></group>;
}
export function CSEBot(){
 const group=useRef<THREE.Group>(null),hover=useRef(0);
 useEffect(()=>{useExperience.getState().set({robotReady:true});},[]);
 useFrame((_,delta)=>{
  const state=useExperience.getState();if(!group.current||state.paused)return;
  delta=Math.min(delta,.05);hover.current+=delta;const amount=reducedMotion()?.15:1;
  const web=state.currentScene==='website';const target=web?-2.05:0;
  group.current.position.x=THREE.MathUtils.damp(group.current.position.x,target+parallax.x*.12,4,delta);
  group.current.position.y=THREE.MathUtils.damp(group.current.position.y,-1.28+1.33*(web?.84:1)+.22+(Math.sin(hover.current*.73)*.027+Math.sin(hover.current*.41+1.2)*.014)*amount,4,delta);
  group.current.rotation.z=THREE.MathUtils.damp(group.current.rotation.z,Math.sin(hover.current*.43)*.009*amount,2.5,delta);
  group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,Math.sin(hover.current*.31)*.014*amount,2.5,delta);
  const spawn=state.started?THREE.MathUtils.smoothstep(state.time,2.7,3.5):0;
  const scale=(web?.84:1)*spawn;group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x,scale,5,delta));
 });
 return <group ref={group} scale={0}><ModelBoundary><Suspense fallback={<ProceduralRobot/>}>{EXPERIENCE.modelEnabled?<Model/>:<ProceduralRobot/>}</Suspense></ModelBoundary></group>;
}
