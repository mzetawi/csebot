import { useEffect } from 'react';
import { lockLandscape } from './useOrientation';
import { useExperience } from '../store/experienceStore';
type WebkitElement=HTMLElement&{webkitRequestFullscreen?:()=>Promise<void>|void};
export async function requestImmersiveFullscreen(){
 const root=document.documentElement as WebkitElement;
 try {
  if(!document.fullscreenElement){
   if(root.requestFullscreen)await root.requestFullscreen({navigationUI:'hide'});
   else if(root.webkitRequestFullscreen)await root.webkitRequestFullscreen();
  }
 }catch{/* iOS / rejected requests retain the fixed, edge-to-edge immersive layout. */}
 await lockLandscape();
}
export function useFullscreen(){useEffect(()=>{
 const update=()=>useExperience.getState().set({fullscreen:document.fullscreenElement?'native':'immersive'});
 document.addEventListener('fullscreenchange',update);document.addEventListener('webkitfullscreenchange',update);
 return()=>{document.removeEventListener('fullscreenchange',update);document.removeEventListener('webkitfullscreenchange',update);};
},[]);}
