import { useEffect } from 'react';
import { audioManager } from '../audio/AudioManager';
export function usePresentationTimeline(){useEffect(()=>{let frame=0,last=0;const tick=(now:number)=>{if(now-last>32){audioManager.update();last=now;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[]);}
