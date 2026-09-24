import { useEffect } from 'react';
import { audioManager } from '../audio/AudioManager';
import { useExperience } from '../store/experienceStore';
export function useAudioManager(){
 const paused=useExperience(s=>s.paused),muted=useExperience(s=>s.muted);
 useEffect(()=>{if(paused)audioManager.pause();else audioManager.resume();},[paused]);
 useEffect(()=>audioManager.mute(muted),[muted]);
 useEffect(()=>()=>audioManager.dispose(),[]);
 return audioManager;
}
