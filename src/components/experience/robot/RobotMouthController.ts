import type { SpeechSnapshot } from '../../../audio/AudioSyncController';
export class RobotMouthController {
 value=0;private time=0;private nextSyllable=0;private target=0;
 private random:()=>number;
 constructor(random:()=>number=Math.random){this.random=random;}
 update(delta:number,speech:SpeechSnapshot){
  const dt=Math.min(delta,.05);this.time+=dt;
  if(!speech.isSpeaking){this.target=0;this.nextSyllable=this.time;}
  else if(speech.voiceSource==='browser'){
   if(this.time>=this.nextSyllable){const pause=this.random()<.22;this.target=pause?0:.18+this.random()*.72;this.nextSyllable=this.time+(pause?.09+this.random()*.17:.065+this.random()*.12);}
  }else this.target=Math.max(0,Math.min(1,(speech.audioAmplitude-.018)*4.2));
  this.value+=(this.target-this.value)*(1-Math.exp(-dt*(this.target>this.value?22:16)));
  if(this.value<.001)this.value=0;
  return this.value;
 }
}
