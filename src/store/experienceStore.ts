import { create } from 'zustand';
import { EXPERIENCE } from '../config/experience';
import { sceneAt } from '../data/scenes';
export type ExperienceState = 'BOOT'|'ORIENTATION_REQUIRED'|'READY'|'REQUESTING_CAMERA'|'SCANNING'|'SPAWNING'|'PRESENTING'|'CLUB'|'WEBSITE'|'ENDING'|'COMPLETED'|'ERROR';
type Store = {
  experienceState: ExperienceState; isLandscape: boolean; cameraReady: boolean;
  cameraPermission: 'unknown'|'granted'|'denied'; orientationPermission: 'unknown'|'granted'|'denied'|'unavailable';
  clubIdentityVisible: boolean; fullscreen: 'native'|'immersive'; gyroActive:boolean; replayVersion:number; audioReady: boolean; robotReady: boolean; currentScene: string; sceneProgress: number;
  totalProgress: number; time: number; muted: boolean; subtitlesEnabled: boolean;
  paused: boolean; completed: boolean; started: boolean; virtualMode: boolean; error: string|null;
  subtitleText: string|null; quality: 'high'|'low'; audioMode: 'recorded'|'speech'|'subtitles';
  set: (data: Partial<Omit<Store,'set'|'tick'>>) => void; tick: (time:number) => void;
};
export const useExperience = create<Store>((set) => ({
  experienceState:'BOOT',isLandscape:window.matchMedia('(orientation: landscape)').matches,
  cameraReady:false,cameraPermission:'unknown',orientationPermission:'unknown',clubIdentityVisible:false,fullscreen:'immersive',gyroActive:false,replayVersion:0,audioReady:false,robotReady:false,
  currentScene:'scan',sceneProgress:0,totalProgress:0,time:0,muted:false,subtitlesEnabled:false,
  paused:false,completed:false,started:false,virtualMode:false,error:null,subtitleText:null,quality:'high',audioMode:'subtitles',
  set: data => set(data),
  tick: time => { const scene = sceneAt(time); set({time,currentScene:scene.id,sceneProgress:(time-scene.start)/(scene.end-scene.start),totalProgress:time/EXPERIENCE.duration,
    completed:time>=EXPERIENCE.duration,experienceState:time>=EXPERIENCE.duration?'COMPLETED':scene.id==='scan'?'SCANNING':scene.id==='spawn'?'SPAWNING':scene.id==='club'?'CLUB':scene.id==='website'?'WEBSITE':scene.id==='final'?'ENDING':'PRESENTING'}); },
}));
