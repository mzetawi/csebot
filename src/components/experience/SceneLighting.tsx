import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type DirectionalLight } from 'three';
import { audioSync } from '../../audio/AudioSyncController';
import { reducedMotion } from '../../hooks/useReducedMotion';
import { useExperience } from '../../store/experienceStore';
export function SceneLighting(){
 const rim=useRef<DirectionalLight>(null);
 useFrame((_,delta)=>{if(!rim.current)return;const s=useExperience.getState(),speech=audioSync.state;const strength=!s.paused&&speech.isSpeaking&&!reducedMotion()?.35+speech.audioAmplitude*.3:0;rim.current.intensity=MathUtils.damp(rim.current.intensity,3+strength,2,Math.min(delta,.05));});
 return <><ambientLight intensity={.95}/><hemisphereLight args={['#d7f8ff','#173154',1.45]}/><directionalLight position={[-3,5,5]} intensity={3.5} color="#f2faff"/><directionalLight position={[3,2,4]} intensity={1.1} color="#90baff"/><directionalLight ref={rim} position={[4,1,-2]} intensity={3} color="#31caff"/><directionalLight position={[-4,0,-2]} intensity={1.2} color="#187aff"/></>;
}
