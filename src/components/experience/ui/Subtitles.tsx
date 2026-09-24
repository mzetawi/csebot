import { useExperience } from '../../../store/experienceStore';
import { subtitles } from '../../../data/subtitles';
export function Subtitles(){const text=useExperience(s=>s.subtitleText);const time=useExperience(s=>s.time),enabled=useExperience(s=>s.subtitlesEnabled),completed=useExperience(s=>s.completed);const segment=subtitles.find(s=>time>=s.start&&time<s.end);if(!enabled||!segment||completed)return null;return <div className="subtitles" dir="rtl"><span className="subtitle-speaker">CSEBOT</span><p>{text??segment.text}</p></div>;}
