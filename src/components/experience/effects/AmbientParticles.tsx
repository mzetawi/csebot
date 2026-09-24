import { useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '../../../store/experienceStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { parallax } from '../../../hooks/useDeviceOrientation';
export function AmbientParticles(){
 const ref=useRef<THREE.Points>(null),time=useRef(0),quality=useExperience(s=>s.quality),reduced=useReducedMotion();
 const [seeds,positions]=useMemo(()=>{const random=(i:number)=>{const n=Math.sin(i*127.1+42)*43758.5453;return n-Math.floor(n);};const a=new Float32Array(Array.from({length:(reduced?24:quality==='low'?80:130)*3},(_,i)=>random(i)));return[a,new Float32Array(a.length)];},[quality,reduced]);
 useFrame((_,delta)=>{
  const s=useExperience.getState();if(s.paused||!ref.current)return;time.current+=Math.min(delta,.05)*(reduced?.05:1);const t=time.current;
  const values=ref.current.geometry.getAttribute('position').array as Float32Array;
  const spawn=!reduced&&s.started&&s.time>1.6&&s.time<5;
  const website=!reduced&&s.currentScene==='website'&&s.sceneProgress<.14;
  for(let i=0;i<seeds.length;i+=3){
   const a=seeds[i],b=seeds[i+1],c=seeds[i+2];
   if(spawn){const angle=a*Math.PI*2+t*1.4;const radius=.5+b*.75;values[i]=Math.cos(angle)*radius;values[i+1]=-1.2+((c+(s.time-1.6)*.35)%1)*3;values[i+2]=Math.sin(angle)*radius;}
   else if(website){const k=s.sceneProgress/.14;values[i]=-1.3+k*3.5+(a-.5)*.35;values[i+1]=.5+Math.sin(k*Math.PI)*.3+(b-.5)*.3;values[i+2]=(c-.5)*.3;}
   else{values[i]=(a-.5)*10;values[i+1]=(b-.5)*5+Math.sin(t*.2+a)*.1;values[i+2]=(c-.5)*4;}
  }
  const attr=ref.current.geometry.getAttribute('position');attr.needsUpdate=true;
  ref.current.position.x=parallax.x*(reduced?0:.036);
  const material=ref.current.material as THREE.PointsMaterial;material.size=spawn||website?.026:.014;material.opacity=spawn||website?.85:.38;
 });
 return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial size={.014} color="#8debff" transparent opacity={.4} depthWrite={false}/></points>;
}
