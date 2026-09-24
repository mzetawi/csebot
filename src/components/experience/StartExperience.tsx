import { motion } from 'framer-motion';
import { Fingerprint, ScanLine } from 'lucide-react';
export function StartExperience({onStart,requesting}:{onStart:()=>void;requesting:boolean}){return <motion.div className="activation" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
 <div className="activation-wordmark">CSE<span>BOT</span><div className="eyebrow">YOUR WORLD. A NEW PERSPECTIVE.</div></div>
 <div className="activation-control"><div className="activation-ring"/><button disabled={requesting} onClick={onStart} aria-label="ابدأ التجربة"><Fingerprint size={36} strokeWidth={1.2}/><span>{requesting?'جارٍ التجهيز…':'ابدأ التجربة'}</span><small>ACTIVATE CSEBOT</small></button></div>
 <div className="activation-note" dir="rtl"><ScanLine size={15}/> دقيقة لاكتشاف هندسة أنظمة الحاسوب</div>
 </motion.div>;}
