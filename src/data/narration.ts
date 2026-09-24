import { scenes } from './scenes';
import arabic from './narration.ar.json';
export const speechScript:Record<string,{displayText:string;speechText:string}>=arabic;
export const spokenLines:Record<string,string[]>=Object.fromEntries(Object.entries(arabic).map(([id,line])=>[id,[line.speechText]]));
export const narration=scenes.filter(s=>s.lines.length).map((s,i)=>({id:s.id,file:`${String(i+1).padStart(2,'0')}-${s.id}.mp3`,language:'ar-SA',text:speechScript[s.id].speechText,displayText:speechScript[s.id].displayText,duration:s.end-s.start}));
