import { Component, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { SceneLighting } from './SceneLighting';
import { CinematicCamera } from './CinematicCamera';
import { CSEBot } from './robot/CSEBot';
import { HologramPlatform } from './hologram/HologramPlatform';
import { AmbientParticles } from './effects/AmbientParticles';
import { useExperience } from '../../store/experienceStore';
function Performance(){const timer=useRef({seconds:0,frames:0}),setDpr=useThree(s=>s.setDpr);useFrame((_,delta)=>{if(document.hidden||useExperience.getState().paused)return;timer.current.seconds+=delta;timer.current.frames++;if(timer.current.seconds>4){if(timer.current.frames/timer.current.seconds<38){setDpr(1);useExperience.getState().set({quality:'low'});}timer.current={seconds:0,frames:0};}});return null;}
class CanvasBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="webgl-error" dir="rtl">تعذّر تشغيل العرض ثلاثي الأبعاد. جرّب متصفحاً يدعم WebGL.<br/>النصوص والجولة ما زالت متاحة.</div>:this.props.children;}}
export function SceneCanvas(){return <div className="scene-canvas" aria-label="CSEBOT، مرشد ثلاثي الأبعاد"><CanvasBoundary><Canvas camera={{position:[0,1.2,7],fov:36}} dpr={[1,1.25]} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} onCreated={({camera,gl})=>{camera.lookAt(0,.05,0);gl.setClearColor(0x000000,0);}}>
 <SceneLighting/><CinematicCamera/>
 <CSEBot/><HologramPlatform/><AmbientParticles/><Performance/>
 </Canvas></CanvasBoundary></div>;}
