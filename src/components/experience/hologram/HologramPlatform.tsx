import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../../store/experienceStore';
import { parallax } from '../../../hooks/useDeviceOrientation';
import { audioSync } from '../../../audio/AudioSyncController';
import { reducedMotion } from '../../../hooks/useReducedMotion';
export function HologramPlatform(){
 const replay=useRef(-1);
 const root=useRef<THREE.Group>(null),ring=useRef<THREE.Group>(null),outer=useRef<THREE.Group>(null),time=useRef(0),light=useRef<THREE.MeshBasicMaterial>(null);
 const ticks=useMemo(()=>{const p=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2,r=i%4===0?1.36:1.43;p.push(Math.cos(a)*r,Math.sin(a)*r,0,Math.cos(a)*1.49,Math.sin(a)*1.49,0);}return new Float32Array(p);},[]);
 useFrame(({viewport},delta)=>{const s=useExperience.getState();if(s.paused||!root.current)return;if(replay.current!==s.replayVersion){replay.current=s.replayVersion;time.current=0;}time.current+=Math.min(delta,.05)*(reducedMotion()?.08:1);if(ring.current)ring.current.rotation.z=time.current*.15;if(outer.current)outer.current.rotation.z=-time.current*.08;root.current.position.x=THREE.MathUtils.damp(root.current.position.x,(s.currentScene==='website'?-viewport.width*.27:0)+parallax.x*.1,4,delta);const scale=s.started?THREE.MathUtils.smoothstep(s.time,1.6,2.4):0;root.current.scale.setScalar(scale*(s.currentScene==='website'?.8:1));if(light.current)light.current.opacity=.05+audioSync.state.audioAmplitude*.08+Math.sin(time.current*1.3)*.015;});
 return <group ref={root} scale={0} position={[0,-1.28,0]} rotation={[-Math.PI/2,0,0]}>
  <mesh position={[0,0,-.015]}><circleGeometry args={[1.5,64]}/><meshBasicMaterial color="#00101d" transparent opacity={.35} depthWrite={false}/></mesh>
  <mesh><circleGeometry args={[1.5,64]}/><meshBasicMaterial ref={light} color="#00c8ff" transparent opacity={.08} depthWrite={false}/></mesh>
  {[.62,.72,1.07,1.16,1.52,1.57].map((r,i)=><mesh key={r} position={[0,0,i*.003]}><ringGeometry args={[r,r+(i===3?.021:.009),80]}/><meshBasicMaterial color="#3cdfff" transparent opacity={i%2?.65:.3} side={THREE.DoubleSide}/></mesh>)}
  <group ref={outer}><lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[ticks,3]}/></bufferGeometry><lineBasicMaterial color="#57e3ff" transparent opacity={.65}/></lineSegments></group>
  <group ref={ring}>{[0,2.1,4.2].map(a=><mesh key={a} rotation={[0,0,a]}><ringGeometry args={[.87,.9,32,1,0,1.35]}/><meshBasicMaterial color="#6aebff" transparent opacity={.8} side={THREE.DoubleSide}/></mesh>)}</group>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,0,.43]}><cylinderGeometry args={[.28,.7,.85,32,1,true]}/><meshBasicMaterial color="#00c8ff" transparent opacity={.028} side={THREE.DoubleSide} depthWrite={false}/></mesh>
 </group>;
}
