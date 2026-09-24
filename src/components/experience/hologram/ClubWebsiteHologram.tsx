import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Globe, LockKeyhole } from 'lucide-react';
import { CLUB_WEBSITE_URL, EXPERIENCE } from '../../../config/experience';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useSpatialElement } from '../../../hooks/useSpatialElement';
export function ClubWebsiteHologram(){
 const reduced=useReducedMotion();
 const [failed,setFailed]=useState(false),frame=useSpatialElement(.8,1),picture=useSpatialElement(.55,1);
 return <motion.div className="website-anchor" initial={{opacity:0,scale:reduced?1:.97,filter:reduced?'blur(0px)':'blur(6px)'}} animate={{opacity:1,scale:1,filter:'blur(0px)'}} exit={{opacity:0,filter:reduced?'blur(0px)':'blur(4px)'}} transition={{duration:reduced?.15:.85,ease:[.16,1,.3,1]}}>
 <div ref={frame} className="club-window spatial-browser"><div className="frame-emitters"><i/><i/><i/><i/></div>
 <div className="browser-bar"><div className="browser-dots"><i/><i/><i/></div><span><LockKeyhole size={10}/>{new URL(CLUB_WEBSITE_URL).hostname}</span><Globe size={13}/></div>
 <div className="website-image-layer" ref={picture}>{!failed?<img src={EXPERIENCE.clubImage} alt="الصورة الأصلية لموقع نادي هندسة أنظمة الحاسوب: الدورات والفعاليات والمقالات والمصادر التعليمية" onError={()=>setFailed(true)} draggable={false}/>:<div className="website-image-error" dir="rtl">نادي هندسة الحاسوب</div>}</div>
 <div className="website-glass"/><div className="website-link"><span>CSE CLUB // PTUK</span><a href={CLUB_WEBSITE_URL} target="_blank" rel="noopener noreferrer">زيارة موقع النادي <ArrowUpRight size={15}/></a></div>
 </div></motion.div>;
}
