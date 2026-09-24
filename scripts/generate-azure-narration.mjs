/** Offline authoring only. Never import this module into src/. */
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,renameSync,rmSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { tmpdir } from 'node:os';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const key=process.env.AZURE_SPEECH_KEY,region=process.env.AZURE_SPEECH_REGION;
if(!key||!region){console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local. No credentials are sent to the browser.');process.exit(1);}
const script=JSON.parse(readFileSync(resolve('src/data/narration.ar.json'),'utf8'));
const voice=process.env.AZURE_SPEECH_VOICE||'ar-SA-HamedNeural';
const lang=voice.split('-').slice(0,2).join('-');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const stage=mkdtempSync(join(tmpdir(),'csebot-azure-'));
const config=sdk.SpeechConfig.fromSubscription(key,region);
config.speechSynthesisVoiceName=voice;
config.speechSynthesisOutputFormat=sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;
async function synthesize(id,text,rate){
 const synth=new sdk.SpeechSynthesizer(config,null),events=[];
 synth.bookmarkReached=(_,event)=>events.push({at:event.audioOffset/1e7,type:event.text});
 let content=escape(text);
 if(id==='club')content=content.replace('فَهُنَا','<bookmark mark="club-reveal"/>فَهُنَا');
 const ssml=`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${escape(voice)}"><prosody rate="${rate}%">${content}</prosody></voice></speak>`;
 try{return await new Promise((accept,reject)=>synth.speakSsmlAsync(ssml,result=>{
  if(result.reason!==sdk.ResultReason.SynthesizingAudioCompleted){reject(new Error(`Azure failed for ${id}; check resource region, voice and quota.`));return;}
  accept({audio:Buffer.from(result.audioData),duration:result.audioDuration/1e7,events});
 },()=>reject(new Error(`Azure synthesis failed for ${id}. Check your Speech resource.`))));}finally{synth.close();}
}
try{
 let rate=0,results=[];
 for(let attempt=0;attempt<3;attempt++){
  results=[];
  for(const [id,line] of Object.entries(script)){const clip=await synthesize(id,line.speechText,rate);writeFileSync(join(stage,`${id}.mp3`),clip.audio);results.push({id,...clip,audio:undefined});}
  const total=5+results.reduce((a,c)=>a+c.duration,0);
  console.log(`Generated Arabic audio: ${total.toFixed(2)} seconds including preparation, rate ${rate}%.`);
  if(total>=58&&total<=63)break;
  rate=Math.round(((1+rate/100)*(total-5)/55-1)*100);
  if(Math.abs(rate)>25)throw new Error('Natural timing needs a shorter/longer script; refusing excessive speaking speed.');
 }
 const total=5+results.reduce((a,c)=>a+c.duration,0);
 if(total<58||total>63)throw new Error('Audio outside 58–63 seconds. Refine the script before publishing.');
 const manifest={language:lang,provider:'azure',voice,status:'generated-needs-listening-review',duration:total,clips:{},durations:{},events:{}};
 const destination=resolve('public/audio/csebot/ar');mkdirSync(destination,{recursive:true});
 for(const clip of results){renameSync(join(stage,`${clip.id}.mp3`),join(destination,`${clip.id}.mp3`));manifest.clips[clip.id]=`/audio/csebot/ar/${clip.id}.mp3`;manifest.durations[clip.id]=clip.duration;manifest.events[clip.id]=clip.events;}
 const manifestPath=resolve('public/audio/csebot/manifest-ar.json');
 writeFileSync(`${manifestPath}.tmp`,JSON.stringify(manifest,null,2)+'\n');renameSync(`${manifestPath}.tmp`,manifestPath);
 console.log('Arabic files saved. Listen to every clip before accepting pronunciation. Browser fallback is replaced automatically on reload.');
}finally{rmSync(stage,{recursive:true,force:true});}
