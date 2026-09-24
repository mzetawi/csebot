import type { Scene } from '../data/scenes';
export type CardCue={index:number;slot:number;reveal:number};
export function cardCues(scene:Scene):CardCue[]{
 const duration=scene.end-scene.start;
 return scene.cards.map((_,index)=>({index,slot:scene.cards.length===2&&index===1?2:index,reveal:.85+index*(duration-2)/scene.cards.length}));
}
/** The existing audio-master scene progress drives every reveal, including replay/pause. */
export function presentationAt(scene:Scene,progress:number,clubIdentityVisible=true){
 const elapsed=Math.max(0,progress)*(scene.end-scene.start),cues=cardCues(scene);
 const allowed=(cue:CardCue)=>!(scene.id==='club'&&cue.index===2&&!clubIdentityVisible);
 const visible=cues.filter(cue=>elapsed>=cue.reveal&&allowed(cue));
 const active=visible.at(-1)?.index??-1;
 const attention=cues.find(cue=>allowed(cue)&&elapsed>=cue.reveal-.65&&elapsed<cue.reveal+1.35);
 return {visible,active,attention:attention?.slot??(scene.id==='website'&&elapsed<2?2:null),cue:attention?.index??-1,transition:elapsed<.2};
}
