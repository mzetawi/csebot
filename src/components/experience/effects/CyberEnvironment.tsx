import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, type Group, type MeshBasicMaterial } from 'three';
import { useExperience } from '../../../store/experienceStore';
import { reducedMotion } from '../../../hooks/useReducedMotion';

/** Decorative architecture only: does not touch the presentation clock or composition. */
export function CyberEnvironment(){
 const arcs=useRef<Group>(null),glow=useRef<MeshBasicMaterial>(null),time=useRef(0);
 const quality=useExperience(s=>s.quality);
 const floorLines=useMemo(()=>{
  const lines:number[]=[];
  for(let i=-8;i<=8;i++){
   lines.push(i*.7,-1.44,-6,i*.7,-1.44,3);
   lines.push(-7,-1.44,i*.6,7,-1.44,i*.6);
  }
  return new Float32Array(lines);
 },[]);
 useFrame((_,delta)=>{
  if(useExperience.getState().paused||reducedMotion())return;
  time.current+=Math.min(delta,.05);
  if(arcs.current)arcs.current.rotation.z=time.current*.017;
  if(glow.current)glow.current.opacity=.075+Math.sin(time.current*.31)*.018;
 });
 return <group>
  <group position={[0,.28,-3.6]}>
   {/* Deep architectural rings stay quiet behind the guide. */}
   {[2.25,2.62,3.18].map((radius,i)=><group key={radius} position={[0,0,-i*.22]}>
    <mesh><ringGeometry args={[radius,radius+.13,96]}/><meshStandardMaterial color={i===1?'#071a2b':'#050e19'} metalness={.7} roughness={.38}/></mesh>
    <mesh position={[0,0,.009]}><ringGeometry args={[radius+.012,radius+.021,96]}/><meshBasicMaterial color="#116094" transparent opacity={.45} depthWrite={false}/></mesh>
   </group>)}
   {Array.from({length:12},(_,i)=><group key={i} rotation={[0,0,i*Math.PI/6]}>
    <mesh position={[0,0,.03]}><ringGeometry args={[2.66,2.84,12,1,.035,.43]}/><meshStandardMaterial color="#0a2034" metalness={.62} roughness={.38}/></mesh>
    <mesh position={[0,0,.04]}><ringGeometry args={[2.66,2.674,12,1,.035,.34]}/><meshBasicMaterial color="#128cda" transparent opacity={i%3===0?.75:.25} toneMapped={false}/></mesh>
   </group>)}
   <group ref={arcs}>
    {[0,2.15,4.3].map(angle=><group key={angle} rotation={[0,0,angle]}>
     <mesh><ringGeometry args={[2.22,2.238,24,1,0,.46]}/><meshBasicMaterial color="#36cfff" toneMapped={false}/></mesh>
     <mesh position={[0,0,-.002]}><ringGeometry args={[2.185,2.28,24,1,0,.46]}/><meshBasicMaterial color="#078fff" transparent opacity={.11} blending={AdditiveBlending} depthWrite={false}/></mesh>
    </group>)}
   </group>
  </group>
  {/* Thin floor rails create depth without a reflection/post-processing pass. */}
  <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[floorLines,3]}/></bufferGeometry><lineBasicMaterial color="#16618d" transparent opacity={quality==='low'?.09:.19} depthWrite={false}/></lineSegments>
  {[-1,1].map(side=><group key={side} position={[side*4,-1.32,-1.5]} rotation={[0,0,side*.045]}>
   <mesh><boxGeometry args={[4.5,.09,.35]}/><meshStandardMaterial color="#071a2b" metalness={.75} roughness={.3}/></mesh>
   <mesh position={[0,.052,.17]}><boxGeometry args={[4.5,.012,.015]}/><meshBasicMaterial color="#168ee5" transparent opacity={.55} toneMapped={false}/></mesh>
  </group>)}
  <mesh position={[0,-1.435,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.5,64]}/><meshBasicMaterial ref={glow} color="#007bb8" transparent opacity={.075} blending={AdditiveBlending} side={DoubleSide} depthWrite={false}/></mesh>
 </group>;
}
