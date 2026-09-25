import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
class Node { connect=vi.fn(); disconnect=vi.fn(); }
class Source extends Node {buffer:{duration:number}|null=null;onended:(()=>void)|null=null;start=vi.fn();stop=vi.fn();}
class Context {
 currentTime=0;sampleRate=100;destination={};sources:Source[]=[];state='running';sample=128;
 resume=vi.fn(async()=>{});close=vi.fn(async()=>{});
 createGain(){return Object.assign(new Node(),{gain:{value:1}});}
 createAnalyser(){return Object.assign(new Node(),{fftSize:512,frequencyBinCount:256,getByteTimeDomainData:(v:Uint8Array)=>v.fill(this.sample)});}
 createBuffer(_channels:number,length:number,sampleRate:number){return {duration:length/sampleRate};}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}
 decodeAudioData=vi.fn(async()=>({duration:20}));
}
const fakeWindow=()=>({matchMedia:()=>({matches:true}),AudioContext:Context,location:{origin:'http://localhost'}});
vi.stubGlobal('window',fakeWindow());
const { AudioManager }=await import('../src/audio/AudioManager');
const { audioSync }=await import('../src/audio/AudioSyncController');
const { useExperience }=await import('../src/store/experienceStore');
const { scenes }=await import('../src/data/scenes');
let manager:InstanceType<typeof AudioManager>;
const advance=(n:number)=>{(manager.context as unknown as Context).currentTime+=n;manager.update();};
const recordingFetch=()=>vi.fn(async(url:string|URL)=>String(url).endsWith('manifest-ar.json')?{ok:true,json:async()=>({language:'ar-SA',clips:{welcome:'/audio/csebot/ar/01-welcome.mp3'}})}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
beforeEach(()=>{
 vi.stubGlobal('window',fakeWindow());vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({language:'ar-SA',clips:{}})})));
 manager=new AudioManager();useExperience.getState().set({paused:false,muted:false,started:true,time:0,completed:false});
});
afterEach(()=>{manager.dispose();});
describe('preserved recorded-audio master clock',()=>{
 test('silent fallback completes the original nominal scene timing',async()=>{await manager.start();for(const scene of scenes){expect(useExperience.getState().currentScene).toBe(scene.id);advance(scene.end-scene.start);manager.update();}expect(useExperience.getState().time).toBe(60);expect(useExperience.getState().completed).toBe(true);});
 test('portrait pause freezes exact offset and resumes without a jump',async()=>{await manager.start();advance(1.125);const before=useExperience.getState().time;manager.pause();advance(37);expect(useExperience.getState().time).toBe(before);await manager.resume();advance(.125);expect(useExperience.getState().time).toBeCloseTo(1.25,5);});
 test('replay stops old audio and resets cards and speech state',async()=>{await manager.start();advance(2.7);advance(2.3);advance(5);const context=manager.context as unknown as Context,old=context.sources.at(-1)!;await manager.start();expect(old.stop).toHaveBeenCalled();expect(useExperience.getState().time).toBe(0);expect(audioSync.state.isSpeaking).toBe(false);});
 test('recording duration still drives scenes and mouth samples the waveform between timeline ticks',async()=>{
  vi.stubGlobal('fetch',recordingFetch());await manager.start();advance(2.7);advance(2.3);advance(10);
  expect(useExperience.getState().currentScene).toBe('welcome');expect(useExperience.getState().time).toBe(8);expect(audioSync.state.isSpeaking).toBe(true);
  const context=manager.context as unknown as Context;context.sample=152;expect(audioSync.sample().audioAmplitude).toBeCloseTo(.1875);context.sample=128;expect(audioSync.sample().audioAmplitude).toBe(0);
  advance(9);expect(useExperience.getState().currentScene).toBe('welcome');advance(1);manager.update();expect(useExperience.getState().currentScene).toBe('major');expect(audioSync.state.isSpeaking).toBe(false);
 });
 test('preload before unlock retains bytes and decodes after a direct start',async()=>{vi.stubGlobal('fetch',recordingFetch());await manager.preload();expect(manager.context).toBe(null);await manager.start();advance(2.7);advance(2.3);manager.update();expect(audioSync.state.voiceSource).toBe('audioFile');expect(audioSync.state.isSpeaking).toBe(true);});
 test('mute silences motion and gain without stopping the timeline; unmute resumes recorded motion',async()=>{vi.stubGlobal('fetch',recordingFetch());await manager.start();advance(2.7);advance(2.3);manager.mute(true);advance(2);expect(manager.gain?.gain.value).toBe(0);expect(audioSync.state.isSpeaking).toBe(false);const time=useExperience.getState().time;manager.mute(false);expect(audioSync.state.isSpeaking).toBe(true);advance(1);expect(useExperience.getState().time).toBeGreaterThan(time);});
 test('natural source end closes speech; stale source callbacks cannot reopen a replay',async()=>{vi.stubGlobal('fetch',recordingFetch());await manager.start();advance(2.7);advance(2.3);const source=(manager.context as unknown as Context).sources.at(-1)!;const end=source.onended!;end();expect(audioSync.state.isSpeaking).toBe(false);await manager.start();end();expect(audioSync.state.isSpeaking).toBe(false);});
 test('dispose disconnects the source and clears the amplitude reader',async()=>{await manager.start();const context=manager.context as unknown as Context,source=context.sources.at(-1)!;manager.dispose();expect(source.stop).toHaveBeenCalled();expect(source.disconnect).toHaveBeenCalled();expect(context.close).toHaveBeenCalled();expect(audioSync.sample().isSpeaking).toBe(false);});
 test('timeline has no gaps or overlaps',()=>{expect(scenes[0].start).toBe(0);scenes.slice(1).forEach((s,i)=>expect(s.start).toBe(scenes[i].end));expect(scenes.at(-1)?.end).toBe(60);});
});
