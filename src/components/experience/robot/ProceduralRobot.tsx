import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useRobotAnimation } from './useRobotAnimation';
const shell={color:'#e2edf2',metalness:.38,roughness:.22};
const joint={color:'#163140',metalness:.82,roughness:.3};
function Joint({position,radius=.105}:{position:[number,number,number];radius?:number}){return <mesh position={position}><sphereGeometry args={[radius,20,12]}/><meshStandardMaterial {...joint}/></mesh>;}
function Arm({side,armRef,elbowRef}:{side:number;armRef:React.RefObject<THREE.Group|null>;elbowRef:React.RefObject<THREE.Group|null>}){return <group ref={armRef} position={[side*.59,.31,0]}>
 <Joint position={[0,0,0]} radius={.145}/>
 <RoundedBox args={[.32,.25,.34]} radius={.1} position={[side*.035,.045,.01]}><meshStandardMaterial {...shell}/></RoundedBox>
 <mesh position={[0,0,.19]}><ringGeometry args={[.063,.078,24]}/><meshBasicMaterial color="#4bdeff"/></mesh>
 <RoundedBox args={[.23,.35,.27]} radius={.1} position={[0,-.25,0]}><meshStandardMaterial {...shell}/></RoundedBox>
 <group ref={elbowRef} position={[0,-.46,0]}>
  <Joint position={[0,0,0]}/>
  <RoundedBox args={[.28,.35,.3]} radius={.11} position={[0,-.22,.045]}><meshStandardMaterial {...shell}/></RoundedBox>
  <RoundedBox args={[.11,.13,.025]} radius={.025} position={[0,-.19,.201]}><meshStandardMaterial color="#153449" metalness={.6} roughness={.3}/></RoundedBox>
  <RoundedBox args={[.11,.025,.02]} radius={.008} position={[0,-.23,.22]}><meshBasicMaterial color="#4bdeff"/></RoundedBox>
  <Joint position={[0,-.43,.06]} radius={.07}/>
  <group position={[0,-.49,.07]} rotation={[.1,0,side*.1]}>
   <RoundedBox args={[.23,.2,.17]} radius={.065}><meshStandardMaterial {...shell}/></RoundedBox>
   {[-1,0,1].map(n=><RoundedBox key={n} args={[.057,.095,.135]} radius={.024} position={[n*.071,-.11,.012]}><meshStandardMaterial color="#a9c1d0" metalness={.5} roughness={.3}/></RoundedBox>)}
   <RoundedBox args={[.07,.14,.12]} radius={.03} position={[-side*.13,-.015,.04]} rotation={[0,0,-side*.45]}><meshStandardMaterial {...shell}/></RoundedBox>
  </group>
 </group>
 </group>;}
function Legs(){return <group>
 <RoundedBox args={[.78,.23,.48]} radius={.085} position={[0,-.53,0]}><meshStandardMaterial color="#b7cbd5" metalness={.65} roughness={.26}/></RoundedBox>
 <RoundedBox args={[.29,.14,.055]} radius={.04} position={[0,-.54,.25]}><meshStandardMaterial {...joint}/></RoundedBox>
 {[-1,1].map(side=><group key={side} position={[side*.25,0,0]}>
  <Joint position={[0,-.65,0]} radius={.105}/>
  <RoundedBox args={[.28,.25,.29]} radius={.085} position={[0,-.75,0]}><meshStandardMaterial {...shell}/></RoundedBox>
  <Joint position={[0,-.89,.025]} radius={.105}/>
  <mesh position={[0,-.89,.13]}><circleGeometry args={[.075,20]}/><meshStandardMaterial color="#507283" metalness={.8} roughness={.2}/></mesh>
  <mesh position={[0,-.89,.134]}><ringGeometry args={[.047,.057,20]}/><meshBasicMaterial color="#52d9f9"/></mesh>
  <RoundedBox args={[.27,.26,.3]} radius={.08} position={[0,-1.045,.025]}><meshStandardMaterial {...shell}/></RoundedBox>
  <RoundedBox args={[.09,.11,.012]} radius={.022} position={[0,-1.04,.181]}><meshStandardMaterial {...joint}/></RoundedBox>
  <Joint position={[0,-1.18,.025]} radius={.075}/>
  <RoundedBox args={[.39,.17,.58]} radius={.067} position={[0,-1.222,.105]}><meshStandardMaterial {...shell}/></RoundedBox>
  <RoundedBox args={[.39,.049,.58]} radius={.018} position={[0,-1.3055,.105]}><meshStandardMaterial {...joint}/></RoundedBox>
  <RoundedBox args={[.22,.015,.012]} radius={.005} position={[0,-1.26,.401]}><meshBasicMaterial color="#57e9ff"/></RoundedBox>
 </group>)}
 </group>;}
export function ProceduralRobot(){
 const upper=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),leftElbow=useRef<THREE.Group>(null),rightElbow=useRef<THREE.Group>(null),eyes=useRef<THREE.Group>(null),neutralEyes=useRef<THREE.Group>(null),happyEyes=useRef<THREE.Group>(null),glow=useRef<THREE.MeshStandardMaterial>(null);
 const mouth=useRef<THREE.Group>(null);
 useRobotAnimation({upper,head,left,right,leftElbow,rightElbow,eyes,neutralEyes,happyEyes,mouth,glow});
 const badge=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d')!;c.font='500 35px monospace';c.textAlign='center';c.fillStyle='#93b9cc';c.fillText('CSEBOT',128,44);return new THREE.CanvasTexture(canvas);},[]);
 useEffect(()=>()=>badge.dispose(),[badge]);
 return <group><Legs/><group ref={upper}>
 <mesh position={[0,.38,0]}><cylinderGeometry args={[.19,.2,.2,24]}/><meshStandardMaterial {...joint}/></mesh>
 <mesh position={[0,.45,0]}><cylinderGeometry args={[.23,.23,.04,24]}/><meshStandardMaterial {...shell}/></mesh>
 <RoundedBox args={[1.02,.83,.64]} radius={.22} smoothness={5} position={[0,-.025,0]}><meshStandardMaterial {...shell}/></RoundedBox>
 <RoundedBox args={[.76,.54,.08]} radius={.17} smoothness={4} position={[0,-.04,.316]}><meshStandardMaterial color="#0a202e" metalness={.65} roughness={.25}/></RoundedBox>
 <RoundedBox args={[.56,.35,.04]} radius={.1} position={[0,-.04,.365]}><meshStandardMaterial color="#14394b" metalness={.72} roughness={.23}/></RoundedBox>
 <mesh position={[0,-.055,.391]}><circleGeometry args={[.107,6]}/><meshStandardMaterial ref={glow} color="#80f0ff" emissive="#00c8ff" emissiveIntensity={1.5}/></mesh>
 <mesh position={[0,-.055,.396]}><ringGeometry args={[.12,.135,6]}/><meshBasicMaterial color="#47c5e4"/></mesh>
 <mesh position={[0,.155,.363]}><planeGeometry args={[.36,.09]}/><meshBasicMaterial map={badge} transparent depthWrite={false}/></mesh>
 {[-1,1].map(s=><RoundedBox key={s} args={[.023,.26,.016]} radius={.008} position={[s*.43,-.025,.285]} rotation={[0,0,-s*.2]}><meshStandardMaterial color="#34c9ec" emissive="#00a6d3" emissiveIntensity={.5}/></RoundedBox>)}
 <group ref={head} position={[0,.94,0]}>
  <RoundedBox args={[1.43,.96,.86]} radius={.34} smoothness={6}><meshStandardMaterial {...shell}/></RoundedBox>
  <RoundedBox args={[1.29,.8,.23]} radius={.28} smoothness={6} position={[0,-.025,.385]}><meshStandardMaterial color="#356071" metalness={.8} roughness={.2}/></RoundedBox>
  <RoundedBox args={[1.23,.74,.24]} radius={.265} smoothness={6} position={[0,-.02,.417]}><meshPhysicalMaterial color="#020e1c" metalness={.48} roughness={.14} clearcoat={1} clearcoatRoughness={.09}/></RoundedBox>
  <RoundedBox args={[.81,.036,.012]} radius={.018} position={[-.08,.23,.542]} rotation={[0,0,.035]}><meshBasicMaterial color="#a8dcf0" transparent opacity={.16}/></RoundedBox>
  <group ref={eyes} position={[0,0,.552]}>
   <group ref={neutralEyes}>{[-1,1].map(s=><RoundedBox key={s} args={[.18,.255,.035]} radius={.082} smoothness={4} position={[s*.265,.015,0]} rotation={[0,0,s*.06]}><meshBasicMaterial color="#65ecff" toneMapped={false}/></RoundedBox>)}</group>
   <group ref={happyEyes}>{[-1,1].map(s=><mesh key={s} position={[s*.265,-.015,0]}><torusGeometry args={[.086,.025,8,24,Math.PI]}/><meshBasicMaterial color="#65ecff" toneMapped={false}/></mesh>)}</group>
  </group>
  <group ref={mouth} position={[0,-.185,.556]}><RoundedBox args={[.145,.022,.016]} radius={.01} smoothness={3}><meshBasicMaterial color="#63d9ed" toneMapped={false}/></RoundedBox></group>
  {[-1,1].map(s=><group key={s} position={[s*.727,-.015,0]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.174,.174,.12,24]}/><meshStandardMaterial {...joint}/></mesh><mesh position={[0,-s*.068,0]}><cylinderGeometry args={[.127,.127,.027,24]}/><meshStandardMaterial {...shell}/></mesh><mesh position={[0,-s*.086,0]}><cylinderGeometry args={[.068,.068,.012,24]}/><meshBasicMaterial color="#52dfff"/></mesh></group>)}
  <RoundedBox args={[.27,.033,.055]} radius={.016} position={[0,.484,.06]}><meshBasicMaterial color="#41cee9"/></RoundedBox>
 </group>
 <Arm side={-1} armRef={left} elbowRef={leftElbow}/><Arm side={1} armRef={right} elbowRef={rightElbow}/>
 </group></group>;
}
