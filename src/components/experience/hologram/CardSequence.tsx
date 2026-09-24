import { AnimatePresence, motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useExperience } from '../../../store/experienceStore';
import { sceneAt } from '../../../data/scenes';
import { presentationAt } from '../../../presentation/PresentationController';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { HolographicCard } from './HolographicCard';
export function CardSequence(){
 // Select a cue signature, so clock ticks do not rerender every card.
 const {scene,version,signature}=useExperience(useShallow(s=>{const scene=sceneAt(s.time),p=presentationAt(scene,s.sceneProgress,s.clubIdentityVisible);return {scene,version:s.replayVersion,signature:p.visible.map(c=>c.index).join(',')};}));
 const reduced=useReducedMotion(),visible=signature?signature.split(',').map(Number):[];
 return <AnimatePresence mode="wait"><motion.div className="cards-composition" key={`${version}-${scene.id}`} exit={{opacity:0,filter:reduced?'blur(0px)':'blur(4px)'}} transition={{duration:reduced?.1:.32}}>
 {visible.map((index)=><HolographicCard key={index} card={scene.cards[index]} index={scene.cards.length===2&&index===1?2:index} active={index===visible.at(-1)}/>)}
 </motion.div></AnimatePresence>;
}
