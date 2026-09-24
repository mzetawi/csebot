import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
// Small deterministic Web Audio adapter: advancing this clock represents audio playback,
// independent of animation frames and wall-clock timers.
class Node { connect=vi.fn(); disconnect=vi.fn(); }
class Source extends Node {buffer:{duration:number}|null=null; start=vi.fn(); stop=vi.fn();}
class Context {
 currentTime=0;sampleRate=100;destination={};sources:Source[]=[];state='running';
 resume=vi.fn(async()=>{});close=vi.fn(async()=>{});
 createGain(){return Object.assign(new Node(),{gain:{value:1}});}
 createAnalyser(){return Object.assign(new Node(),{fftSize:64,frequencyBinCount:32,getByteFrequencyData:(v:Uint8Array)=>v.fill(0)});}
 createBuffer(_channels:number,length:number,sampleRate:number){return {duration:length/sampleRate};}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}
 decodeAudioData=vi.fn(async()=>({duration:20}));
}
vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
vi.stubGlobal('AudioContext',Context);
vi.stubGlobal('location',{origin:'http://localhost'});
const { AudioManager }=await import('../src/audio/AudioManager');
const { useExperience }=await import('../src/store/experienceStore');
const { scenes }=await import('../src/data/scenes');
const { audioSync }=await import('../src/audio/AudioSyncController');
let manager:InstanceType<typeof AudioManager>;
const advance=(n:number)=>{(manager.context as unknown as Context).currentTime+=n;manager.update();};
beforeEach(()=>{vi.stubGlobal('window',{matchMedia:()=>({matches:true})});manager=new AudioManager();useExperience.getState().set({paused:false,muted:false,started:true,time:0,completed:false});});
afterEach(()=>{manager.dispose();vi.unstubAllEnvs();});
describe('audio-master presentation',()=>{
 test('visual fallback completes every scene in exactly 60 seconds',()=>{manager.start();for(const scene of scenes){expect(useExperience.getState().currentScene).toBe(scene.id);advance(scene.end-scene.start);manager.update();}expect(useExperience.getState().time).toBe(60);expect(useExperience.getState().completed).toBe(true);});
 test('portrait interruption freezes exact position, then resumes without a jump',()=>{manager.start();advance(1.125);const before=useExperience.getState().time;manager.pause();advance(37);expect(useExperience.getState().time).toBe(before);manager.resume();advance(.125);expect(useExperience.getState().time).toBeCloseTo(1.25,5);});
 test('replay stops previous source and resets progress',()=>{manager.start();advance(2.7);advance(2.3);advance(5);const context=manager.context as unknown as Context,old=context.sources.at(-1)!;manager.start();expect(old.stop).toHaveBeenCalled();expect(useExperience.getState().time).toBe(0);expect(useExperience.getState().currentScene).toBe('scan');});
 test('recording duration, rather than nominal scene timer, controls progression',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string|URL)=>String(url).endsWith('manifest-ar.json')?{ok:true,json:async()=>({language:'ar-SA',clips:{welcome:'/audio/csebot/01-welcome.mp3'}})}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  manager.unlock();await manager.preload();manager.start();advance(2.7);advance(2.3);advance(10);
  expect(useExperience.getState().currentScene).toBe('welcome');expect(useExperience.getState().time).toBe(8);
  advance(9);expect(useExperience.getState().currentScene).toBe('welcome');advance(1);manager.update();expect(useExperience.getState().currentScene).toBe('major');
 });
 test('mute changes gain without stopping the master clock',()=>{manager.start();manager.mute(true);advance(2);expect(manager.gain?.gain.value).toBe(0);expect(useExperience.getState().time).toBe(2);manager.mute(false);expect(manager.gain?.gain.value).toBe(1);});
 test('dispose stops audio and closes its context',()=>{manager.start();const context=manager.context as unknown as Context;manager.dispose();expect(context.sources[0].stop).toHaveBeenCalled();expect(context.close).toHaveBeenCalled();});
 test('timeline has no gaps, overlaps, or invented course data',()=>{expect(scenes[0].start).toBe(0);scenes.slice(1).forEach((s,i)=>expect(s.start).toBe(scenes[i].end));expect(scenes.at(-1)?.end).toBe(60);});
});


describe('Arabic Fusha fallback',()=>{
 test('fallback speaks Arabic without restarting after pause',()=>{
  class Utterance {text:string;lang='';rate=1;pitch=1;voice:unknown=null;onboundary:((e:{charIndex:number})=>void)|null=null;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
  const speech={getVoices:()=>[{name:'Arabic',lang:'ar-SA'}],cancel:vi.fn(),pause:vi.fn(),resume:vi.fn(),speak:vi.fn()};
  vi.stubGlobal('window',{matchMedia:()=>({matches:true}),speechSynthesis:speech});vi.stubGlobal('speechSynthesis',speech);vi.stubGlobal('SpeechSynthesisUtterance',Utterance);
  manager.start();advance(2.7);advance(2.3);
  expect(speech.speak).toHaveBeenCalledTimes(1);
  const utterance=speech.speak.mock.calls[0][0] as Utterance;
  expect(utterance.lang).toBe('ar-SA');expect(utterance.text).toContain("مَرْحَبًا");expect(utterance.text).toMatch(/[\u0600-\u06ff]/);
  expect(audioSync.state.isSpeaking).toBe(false);utterance.onstart?.();expect(audioSync.state.isSpeaking).toBe(true);
  utterance.onboundary?.({charIndex:0});expect(useExperience.getState().subtitleText).toMatch(/[\u0600-\u06ff]/);
  manager.pause();expect(audioSync.state.isSpeaking).toBe(false);expect(speech.pause).toHaveBeenCalled();manager.resume();expect(audioSync.state.isSpeaking).toBe(true);expect(speech.speak).toHaveBeenCalledTimes(1);
  manager.mute(true);expect(audioSync.state.isSpeaking).toBe(false);manager.mute(false);expect(audioSync.state.isSpeaking).toBe(false);
  manager.stop();utterance.onstart?.();utterance.onend?.();expect(audioSync.state.isSpeaking).toBe(false);expect(speech.cancel).toHaveBeenCalled();
  vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
 });
});
