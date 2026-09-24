import { useExperience } from '../../../store/experienceStore';
export function ProgressBar(){const progress=useExperience(s=>s.totalProgress);return <div className="progress-track" role="progressbar" aria-label="تقدم الجولة" aria-valuenow={Math.round(progress*100)} aria-valuemin={0} aria-valuemax={100}><div style={{transform:`scaleX(${progress})`}}/></div>;}

export function Telemetry(){const completed=useExperience(s=>s.completed),mode=useExperience(s=>s.audioMode),progress=useExperience(s=>Math.round(s.totalProgress*100));return <div className="bottom-telemetry"><span>{completed?'JOURNEY COMPLETE':mode==='speech'?'VOICE PREVIEW':mode==='recorded'?'CSEBOT · AUDIO':'CSEBOT · VISUAL'}</span><span>{progress.toString().padStart(2,'0')}% <i>／</i> CSE DISCOVERY</span></div>;}
