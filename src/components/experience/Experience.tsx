import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ScanLine, RotateCcw, CameraOff } from 'lucide-react';
import { useExperience } from '../../store/experienceStore';
import { useOrientation } from '../../hooks/useOrientation';
import { requestOrientation, useDeviceOrientation, resetMotion } from '../../hooks/useDeviceOrientation';
import { useCamera } from '../../hooks/useCamera';
import { useAudioManager } from '../../hooks/useAudioManager';
import { usePresentationTimeline } from '../../hooks/usePresentationTimeline';
import { scenes } from '../../data/scenes';
import { CLUB_WEBSITE_URL } from '../../config/experience';
import { OrientationGate } from './OrientationGate';
import { CameraBackground } from './CameraBackground';
import { StartExperience } from './StartExperience';
import { SceneCanvas } from './SceneCanvas';
import { CardSequence } from './hologram/CardSequence';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ClubWebsiteHologram } from './hologram/ClubWebsiteHologram';
import { ScanEffect } from './effects/ScanEffect';
import { Controls } from './ui/Controls';
import { useFullscreen, requestImmersiveFullscreen } from '../../hooks/useFullscreen';
import { EXPERIENCE } from '../../config/experience';
import { ProgressBar, Telemetry } from './ui/ProgressBar';
export function Experience(){
 useOrientation();useDeviceOrientation();useFullscreen();usePresentationTimeline();const audio=useAudioManager(),camera=useCamera();
 const state=useExperience(useShallow(s=>({experienceState:s.experienceState,isLandscape:s.isLandscape,paused:s.paused,quality:s.quality,cameraReady:s.cameraReady,started:s.started,completed:s.completed,virtualMode:s.virtualMode,error:s.error,currentScene:s.currentScene,gyroActive:s.gyroActive,clubIdentityVisible:s.clubIdentityVisible,replayVersion:s.replayVersion,set:s.set}))),scene=scenes.find(s=>s.id===state.currentScene)!,starting=useRef(false);
 useEffect(()=>{if(!state.isLandscape||state.experienceState!=='BOOT')return;const timer=setTimeout(()=>useExperience.getState().set({experienceState:'READY'}),0);return()=>clearTimeout(timer);},[state.isLandscape,state.experienceState]);
 const begin=()=>{state.set({started:true,completed:false,error:null});audio.start();};
 const start=async()=>{if(starting.current)return;starting.current=true;void requestImmersiveFullscreen();void requestOrientation();audio.unlock();const preload=audio.preload();state.set({experienceState:'REQUESTING_CAMERA'});const success=await camera.start();await preload;if(success)begin();starting.current=false;};
 const virtual=()=>{camera.stop();state.set({virtualMode:true,cameraReady:false,error:null});begin();};
 const replay=()=>{resetMotion();audio.start();state.set({completed:false});};
 useEffect(()=>{const img=new Image();img.src=EXPERIENCE.clubImage;},[]);
 const active=state.started,reduced=useReducedMotion();
 return <main className={`experience ${state.paused?'is-paused':''} ${reduced?'reduced-motion':''} ${state.quality==='low'?'low-quality':''} ${state.cameraReady?'with-camera':''}`}>
 <div className="virtual-world"><div className="world-grid"/><div className="ambient-halo"/><div className="world-orbit orbit-one"/><div className="world-orbit orbit-two"/></div>
 <CameraBackground stream={camera.stream}/><div className="world-vignette"/>
 <div className="landscape-content" inert={!state.isLandscape}>
 <SceneCanvas/>
 <header className="experience-header"><div className="brand"><ScanLine size={24}/><span>CSE<span>BOT</span></span><i/><small>INTERACTIVE GUIDE</small></div><div className="header-right">{active?<><div className="mode-label"><span className="status-dot"/>{state.gyroActive&&<span className="gyro-label">GYRO · </span>}{state.virtualMode?'3D EXPERIENCE':'CAMERA CONNECTED'}</div><Controls replay={replay}/></>:<span className="university-label" dir="rtl">جامعة فلسطين التقنية — خضوري</span>}</div></header>
 {active&&<div className="scene-heading"><span className="eyebrow">{String(Math.max(1,Math.round(scene.start/16))).padStart(2,'0')} / THE JOURNEY</span><span dir="rtl">{scene.label}</span></div>}
 <AnimatePresence mode="wait">{!active&&state.experienceState!=='BOOT'&&state.experienceState!=='ERROR'&&<StartExperience key="start" requesting={state.experienceState==='REQUESTING_CAMERA'} onStart={()=>void start()}/>}</AnimatePresence>
 {active&&<><CardSequence/>
 <AnimatePresence>{scene.id==='scan'&&<ScanEffect key="scan"/>}{scene.id==='website'&&<ClubWebsiteHologram key="website"/>}</AnimatePresence>
 {(scene.id==='final'||state.completed)&&<motion.div className="final-message" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><h1 dir="rtl">أهلًا بك في<br/><span>هندسة أنظمة الحاسوب</span></h1>{state.completed&&<div className="final-actions"><a className="primary-button" href={CLUB_WEBSITE_URL} target="_blank" rel="noopener noreferrer">  جميع روابط النادي <ArrowUpRight size={16}/></a><button className="secondary-button" onClick={replay}><RotateCcw size={15}/>إعادة الجولة</button></div>}</motion.div>}
 <Telemetry/><ProgressBar/></>}
 <AnimatePresence>{state.experienceState==='BOOT'&&<motion.div className="boot" exit={{opacity:0}} transition={{duration:.5}}><div className="boot-logo">CSE<span>BOT</span></div><div className="boot-line"/><span className="boot-phase">INITIALIZING EXPERIENCE…</span><span className="boot-phase second">CALIBRATING ENVIRONMENT…</span></motion.div>}</AnimatePresence>
 {state.experienceState==='ERROR'&&<div className="error-overlay" role="alertdialog" aria-labelledby="camera-error" dir="rtl"><div className="error-card"><CameraOff size={30}/><h2 id="camera-error">{state.error}</h2><p>بتقدر تكمل نفس الجولة في مساحة ثلاثية الأبعاد.</p><div><button className="primary-button" onClick={()=>void start()}>إعادة المحاولة</button><button className="secondary-button" onClick={virtual}>تشغيل الوضع ثلاثي الأبعاد</button></div></div></div>}
 </div>
 {!state.isLandscape&&<OrientationGate started={state.started}/>}
 </main>;
}
