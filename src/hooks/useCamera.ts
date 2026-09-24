import { useCallback, useEffect, useRef, useState } from 'react';
import { openRearCamera } from './cameraSelection';
import { useExperience } from '../store/experienceStore';
export function useCamera() {
 const streamRef=useRef<MediaStream|null>(null), alive=useRef(true), generation=useRef(0);
 const [stream,setStream]=useState<MediaStream|null>(null);
 const release=useCallback(()=>{generation.current++;streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;},[]);
 const stop=useCallback(()=>{release();setStream(null);},[release]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;release();};},[release]);
 const start=useCallback(async()=>{
  const id=++generation.current;
  try {
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera requires HTTPS or localhost.');
   const next=await openRearCamera(navigator.mediaDevices);
   if(!alive.current||id!==generation.current){next.getTracks().forEach(t=>t.stop());return false;}
   streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=next;setStream(next);
   useExperience.getState().set({cameraReady:true,cameraPermission:'granted',virtualMode:false,error:null});return true;
  } catch { if(alive.current&&id===generation.current)useExperience.getState().set({cameraPermission:'denied',experienceState:'ERROR',error:'نحتاج إذن الكاميرا حتى يظهر CSEBOT داخل بيئتك.'});return false; }
 },[]);
 return {stream,start,stop};
}
