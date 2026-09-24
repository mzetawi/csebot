import { useEffect, useRef } from 'react';
import { reducedMotion } from './useReducedMotion';
import { parallax } from './useDeviceOrientation';
import { useExperience } from '../store/experienceStore';
export function useSpatialElement(depth:number,phase=0){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{let frame=0,time=0,last=performance.now();const update=(now:number)=>{const delta=Math.min((now-last)/1000,.05);last=now;if(!useExperience.getState().paused){time+=delta;const amount=reducedMotion()?0:1;if(ref.current){ref.current.style.setProperty('--gyro-x',`${parallax.x*12*depth*amount}px`);ref.current.style.setProperty('--gyro-y',`${(parallax.y*8*depth+Math.sin(time*.7+phase)*3)*amount}px`);ref.current.style.setProperty('--gyro-r',`${(parallax.x*1.4*depth+Math.sin(time*.31+phase)*.5)*amount}deg`);ref.current.style.setProperty('--reflection',`${40+parallax.x*18}%`);}}frame=requestAnimationFrame(update);};frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);},[depth,phase]);
 return ref;
}
