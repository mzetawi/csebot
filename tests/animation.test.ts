import { describe, expect, test } from 'vitest';
import { AudioSyncController } from '../src/audio/AudioSyncController';
import { RobotMouthController } from '../src/components/experience/robot/RobotMouthController';
import { RobotGestureController } from '../src/components/experience/robot/RobotGestureController';
import { presentationAt, cardCues } from '../src/presentation/PresentationController';
import { scenes } from '../src/data/scenes';
import { inspectModel } from '../src/components/experience/robot/inspectModel';
import { Group, Bone, Mesh, BoxGeometry, MeshBasicMaterial, AnimationClip } from 'three';
describe('provider-neutral speech animation',()=>{
 test('mouth stays closed before start and closes on pause, mute, end and replay',()=>{
  const sync=new AudioSyncController(),mouth=new RobotMouthController(()=>.5);
  const settle=()=>{for(let i=0;i<80;i++)mouth.update(1/60,sync.state);};
  settle();expect(mouth.value).toBe(0);sync.startSpeaking('browser','major');settle();expect(mouth.value).toBeGreaterThan(.3);
  sync.setPaused(true);settle();expect(mouth.value).toBe(0);sync.setPaused(false);settle();expect(mouth.value).toBeGreaterThan(.3);
  sync.setMuted(true);settle();expect(mouth.value).toBe(0);sync.setMuted(false);sync.stopSpeaking();settle();expect(mouth.value).toBe(0);
  sync.startSpeaking('browser','club');settle();sync.reset();settle();expect(mouth.value).toBe(0);
 });
 test('recorded speech uses real amplitude and silent intervals stay closed',()=>{
  const sync=new AudioSyncController(),mouth=new RobotMouthController();sync.startSpeaking('audioFile','major');
  for(let i=0;i<40;i++){sync.update(.2,0);mouth.update(.02,sync.state);}expect(mouth.value).toBe(0);
  for(let i=0;i<40;i++){sync.update(.4,.2);mouth.update(.02,sync.state);}expect(mouth.value).toBeGreaterThan(.6);
  sync.stopSpeaking();expect(sync.state.audioAmplitude).toBe(0);
 });
});
describe('card and gesture choreography',()=>{
 test('cards are hidden, anticipated, then revealed one at a time and retained',()=>{
  for(const scene of scenes.filter(s=>s.cards.length)){
   expect(presentationAt(scene,0).visible).toHaveLength(0);const duration=scene.end-scene.start;
   for(const cue of cardCues(scene)){
    const before=presentationAt(scene,(cue.reveal-.3)/duration);expect(before.attention).toBe(cue.slot);expect(before.visible.some(c=>c.index===cue.index)).toBe(false);
    const after=presentationAt(scene,(cue.reveal+.01)/duration);expect(after.visible).toHaveLength(cue.index+1);expect(after.active).toBe(cue.index);
   }
  }
 });
 test('club identity gate and replay do not expose future cards',()=>{const scene=scenes.find(s=>s.id==='club')!;expect(presentationAt(scene,.99,false).visible).toHaveLength(2);expect(presentationAt(scene,.99,true).visible).toHaveLength(3);expect(presentationAt(scene,0).visible).toHaveLength(0);});
 test('identical random values cannot select the same gesture twice consecutively',()=>{
  const c=new RobotGestureController(()=>.5),input={speaking:true,attention:null,cue:'major',transition:false,completed:false,reduced:false};let previous='';
  for(let gesture=0;gesture<8;gesture++){c.update(.05,input);expect(c.gesture.id).not.toBe(previous);previous=c.gesture.id;for(let i=0;i<72;i++)c.update(.05,input);}
  expect(c.update(.05,{...input,speaking:false}).state).toBe('LISTENING');expect(c.update(.05,{...input,completed:true}).state).toBe('IDLE');
 });
 test('model inventory reports only real nodes, morphs and clips',()=>{const root=new Group(),bone=new Bone(),mesh=new Mesh(new BoxGeometry(),new MeshBasicMaterial());bone.name='actual_joint_07';mesh.name='face';mesh.morphTargetDictionary={actual_open:0};root.add(bone,mesh);const data=inspectModel(root,[new AnimationClip('provided_clip',1,[])]);expect(data.bones).toEqual(['actual_joint_07']);expect(data.morphs[0].targets).toEqual({actual_open:0});expect(data.clips[0].name).toBe('provided_clip');mesh.geometry.dispose();(mesh.material as MeshBasicMaterial).dispose();});
});
