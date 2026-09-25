export type VoiceSource = 'browser' | 'audioFile' | 'azure' | 'custom';
export type SpeechSnapshot = { isSpeaking:boolean; voiceSource:VoiceSource; speechProgress:number; currentSentence:string; currentSection:string; audioAmplitude:number };
/** Animation-only adapter. It never starts, schedules, or changes audio playback. */
export class AudioSyncController {
 readonly state:SpeechSnapshot = {isSpeaking:false,voiceSource:'browser',speechProgress:0,currentSentence:'',currentSection:'',audioAmplitude:0};
 private amplitudeReader:(()=>number)|null=null;
 setAmplitudeReader(reader:(()=>number)|null){this.amplitudeReader=reader;}
 sample(){if(this.amplitudeReader)this.update(this.state.speechProgress,this.amplitudeReader());return this.state;}
 private sounding=false;
 private paused=false;
 private muted=false;
 private refresh(){this.state.isSpeaking=this.sounding&&!this.paused&&!this.muted;if(!this.state.isSpeaking)this.state.audioAmplitude=0;}
 startSpeaking(voiceSource:VoiceSource,currentSection:string,currentSentence=''){Object.assign(this.state,{voiceSource,currentSection,currentSentence,speechProgress:0});this.sounding=true;this.refresh();}
 stopSpeaking(){this.sounding=false;this.refresh();}
 setPaused(value:boolean){this.paused=value;this.refresh();}
 setMuted(value:boolean){this.muted=value;this.refresh();}
 update(progress:number,amplitude=0){this.state.speechProgress=Math.max(0,Math.min(1,progress));this.state.audioAmplitude=this.state.isSpeaking?Math.max(0,Math.min(1,amplitude)):0;}
 sentence(text:string){this.state.currentSentence=text;}
 reset(){this.sounding=false;this.paused=false;this.muted=false;Object.assign(this.state,{isSpeaking:false,speechProgress:0,currentSentence:'',currentSection:'',audioAmplitude:0});}
}
export const audioSync=new AudioSyncController();
