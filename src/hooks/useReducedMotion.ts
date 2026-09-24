import { useSyncExternalStore } from 'react';
const query=typeof window!=='undefined'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
export const reducedMotion=()=>query?.matches??false;
const subscribe=(callback:()=>void)=>{query?.addEventListener('change',callback);return()=>query?.removeEventListener('change',callback);};
export const useReducedMotion=()=>useSyncExternalStore(subscribe,reducedMotion,()=>false);
