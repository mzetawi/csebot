import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useExperience } from '../../../store/experienceStore';
export function Controls({replay}:{replay:()=>void}){const muted=useExperience(s=>s.muted),set=useExperience(s=>s.set);return <div className="controls"><button title={muted?'تشغيل الصوت':'كتم الصوت'} aria-label={muted?'تشغيل الصوت':'كتم الصوت'} aria-pressed={muted} onClick={()=>set({muted:!muted})}>{muted?<VolumeX/>:<Volume2/>}</button><button title="إعادة الجولة" aria-label="إعادة الجولة" onClick={replay}><RotateCcw/></button></div>;}
