import { useEffect } from 'react';
import { useExperience } from '../store/experienceStore';
export const parallax={x:0,y:0};
export const motionTarget={x:0,y:0,baselineBeta:null as number|null,baselineGamma:null as number|null};
export function resetMotion(){motionTarget.baselineBeta=null;motionTarget.baselineGamma=null;motionTarget.x=0;motionTarget.y=0;parallax.x=0;parallax.y=0;}
export async function requestOrientation(){
 const api=window.DeviceOrientationEvent as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<string>};
 resetMotion();
 if(!api){useExperience.getState().set({orientationPermission:'unavailable'});return;}
 try{const allowed=api.requestPermission?await api.requestPermission():'granted';useExperience.getState().set({orientationPermission:allowed==='granted'?'granted':'denied'});}catch{useExperience.getState().set({orientationPermission:'denied'});}
}
export function relativeTilt(beta:number,gamma:number,baseBeta:number,baseGamma:number,angle:number){
 const rad=angle*Math.PI/180;
 const wrap=(n:number)=>((n+540)%360)-180;
 const b=wrap(beta-baseBeta),g=wrap(gamma-baseGamma);
 const clamp=(n:number)=>Math.max(-1,Math.min(1,n/25));
 return{x:clamp(g*Math.cos(rad)+b*Math.sin(rad)),y:clamp(b*Math.cos(rad)-g*Math.sin(rad))};
}
export function useDeviceOrientation(){useEffect(()=>{
 let frame=0,last=performance.now();
 const orient=(e:DeviceOrientationEvent)=>{
  const state=useExperience.getState();
  if(state.orientationPermission!=='granted'||state.paused||e.beta===null||e.gamma===null)return;
  if(motionTarget.baselineBeta===null){motionTarget.baselineBeta=e.beta;motionTarget.baselineGamma=e.gamma;state.set({gyroActive:true});}
  const angle=screen.orientation?.angle??(window as Window&{orientation?:number}).orientation??90;
  const target=relativeTilt(e.beta,e.gamma,motionTarget.baselineBeta,motionTarget.baselineGamma!,angle);
  motionTarget.x=target.x;motionTarget.y=target.y;
 };
 const pointer=(e:PointerEvent)=>{const state=useExperience.getState();if(e.pointerType==='mouse'&&!state.gyroActive){motionTarget.x=(e.clientX/innerWidth-.5)*.6;motionTarget.y=(e.clientY/innerHeight-.5)*.6;}};
 const smooth=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;if(!useExperience.getState().paused){const a=1-Math.exp(-dt*3.5);parallax.x+=(motionTarget.x-parallax.x)*a;parallax.y+=(motionTarget.y-parallax.y)*a;}frame=requestAnimationFrame(smooth);};
 frame=requestAnimationFrame(smooth);window.addEventListener('deviceorientation',orient);window.addEventListener('pointermove',pointer);window.addEventListener('orientationchange',resetMotion);screen.orientation?.addEventListener('change',resetMotion);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('deviceorientation',orient);window.removeEventListener('pointermove',pointer);window.removeEventListener('orientationchange',resetMotion);screen.orientation?.removeEventListener('change',resetMotion);};
},[]);}
