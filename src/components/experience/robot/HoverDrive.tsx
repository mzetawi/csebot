import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Vector2, DoubleSide } from 'three';
/** Compact, tapered hover body inspired by the supplied reference; no standing legs. */
export function HoverDrive(){
 const profile=useMemo(()=>[[.17,-.93],[.25,-.86],[.37,-.72],[.46,-.55],[.48,-.4]].map(([x,y])=>new Vector2(x,y)),[]);
 return <group>
  <mesh><latheGeometry args={[profile,40]}/><meshPhysicalMaterial color="#eaf5ff" metalness={.32} roughness={.2} clearcoat={1} clearcoatRoughness={.12}/></mesh>
  <mesh position={[0,-.41,0]}><cylinderGeometry args={[.46,.46,.08,40]}/><meshStandardMaterial color="#08111a" metalness={.8} roughness={.24}/></mesh>
  {[-1,1].map(side=><group key={side} position={[side*.4,-.58,0]} rotation={[0,0,side*.2]}>
   <RoundedBox args={[.18,.42,.44]} radius={.085}><meshPhysicalMaterial color="#e8f4ff" metalness={.35} roughness={.2} clearcoat={1}/></RoundedBox>
   <mesh position={[0,0,.23]}><ringGeometry args={[.08,.092,32]}/><meshBasicMaterial color="#16bdff" toneMapped={false}/></mesh>
  </group>)}
  <mesh position={[0,-.92,0]}><cylinderGeometry args={[.19,.21,.09,40]}/><meshStandardMaterial color="#091d30" metalness={.8} roughness={.18}/></mesh>
  {[.185,.24,.31].map((radius,i)=><mesh key={radius} position={[0,-.98-i*.085,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[radius,radius+.013,48]}/><meshBasicMaterial color="#48dcff" transparent opacity={1-i*.3} side={DoubleSide} toneMapped={false} depthWrite={false}/></mesh>)}
  <mesh position={[0,-1.075,0]}><cylinderGeometry args={[.16,.31,.23,32,1,true]}/><meshBasicMaterial color="#00b9ff" transparent opacity={.065} side={DoubleSide} depthWrite={false}/></mesh>
 </group>;
}
