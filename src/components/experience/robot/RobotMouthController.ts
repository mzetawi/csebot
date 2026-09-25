import type { SpeechSnapshot } from '../../../audio/AudioSyncController';
/** Speech envelope only: no random, sine-wave or timer-driven mouth flapping. */
export class RobotMouthController {
 value=0;
 private amplitude=0;
 update(delta:number,speech:SpeechSnapshot){
  const dt=Math.min(delta,.05);
  const raw=speech.isSpeaking?speech.audioAmplitude:0;
  this.amplitude+=(raw-this.amplitude)*(1-Math.exp(-dt*(raw>this.amplitude?32:20)));
  const energy=Math.max(0,Math.min(1,(this.amplitude-.012)*5.5));
  const target=speech.isSpeaking?Math.pow(energy,.7):0;
  this.value+=(target-this.value)*(1-Math.exp(-dt*(target>this.value?28:18)));
  if(this.value<.001)this.value=0;
  return this.value;
 }
}
