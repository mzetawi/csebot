import { motion } from 'framer-motion';
import { useExperience } from '../../../store/experienceStore';
export function ScanEffect(){const ready=useExperience(s=>s.time>2.1);return <motion.div className="scan-overlay" exit={{opacity:0}}><div className="scan-line"/><div className="scan-brackets"><i/><i/><i/><i/></div><div className="scan-label"><span className="status-dot"/>{ready?'ENVIRONMENT READY':'SCANNING SPACE…'}<small dir="rtl">{ready?'جاهزين. خلّينا نبدأ.':'ثبّت الهاتف لحظة'}</small></div></motion.div>;}
