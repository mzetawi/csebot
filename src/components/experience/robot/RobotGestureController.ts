export type RobotState='IDLE'|'LISTENING'|'SPEAKING'|'PRESENTING'|'EMPHASIS'|'TRANSITIONING';
type Gesture={id:string;left:number;right:number;elbow:number;lean:number;nod:number};
const gestures:Record<RobotState,Gesture[]>={
 IDLE:[{id:'rest',left:.12,right:-.12,elbow:-.22,lean:0,nod:0},{id:'settle',left:.09,right:-.09,elbow:-.25,lean:.008,nod:0}],
 LISTENING:[{id:'listen',left:.1,right:-.12,elbow:-.22,lean:0,nod:0},{id:'attentive',left:.12,right:-.08,elbow:-.25,lean:.012,nod:0}],
 SPEAKING:[{id:'explain-left',left:-.42,right:-.1,elbow:-.48,lean:.018,nod:0},{id:'explain-right',left:.1,right:.46,elbow:-.4,lean:.024,nod:0},{id:'open',left:-.32,right:.34,elbow:-.3,lean:.016,nod:.025}],
 PRESENTING:[{id:'offer',left:-.82,right:.82,elbow:-.36,lean:.018,nod:0},{id:'indicate',left:-.66,right:.66,elbow:-.55,lean:.025,nod:.02}],
 EMPHASIS:[{id:'affirm',left:.1,right:.5,elbow:-.6,lean:.035,nod:.06},{id:'underline',left:-.5,right:-.1,elbow:-.5,lean:.03,nod:.045}],
 TRANSITIONING:[{id:'gather',left:-.22,right:.24,elbow:-.32,lean:.01,nod:.02},{id:'release',left:-.16,right:.18,elbow:-.28,lean:0,nod:0}],
};
export class RobotGestureController {
 state:RobotState='IDLE';gesture=gestures.IDLE[0];private age=0;private next=0;private previous='';private cue='';
 private random:()=>number;
 constructor(random:()=>number=Math.random){this.random=random;}
 update(delta:number,input:{speaking:boolean;attention:number|null;cue:string;transition:boolean;completed:boolean;reduced:boolean}){
  this.age+=Math.min(delta,.05);
  const desired:RobotState=input.completed?'IDLE':input.attention!==null?'PRESENTING':input.transition?'TRANSITIONING':input.speaking?'SPEAKING':'LISTENING';
  const sameFamily=desired==='SPEAKING'&&this.state==='EMPHASIS';
  if((desired!==this.state&&!sameFamily)||input.cue!==this.cue||this.age>=this.next){
   this.state=desired==='SPEAKING'&&this.random()<.22?'EMPHASIS':desired;
   const pool=gestures[this.state].filter(g=>g.id!==this.previous);
   this.gesture=pool[Math.floor(this.random()*pool.length)];this.previous=this.gesture.id;this.cue=input.cue;this.age=0;this.next=2.2+this.random()*2.8;
  }
  const weight=input.reduced?.25:1;
  // An eased, single gesture envelope, followed by rest; never a looping wave.
  const envelope=this.state==='PRESENTING'?Math.min(1,this.age/.3):Math.sin(Math.PI*Math.min(1,this.age/this.next))**2;
  const g=this.gesture,amount=envelope*weight;
  return {state:this.state,left:.12+((input.attention===2?.12:g.left)-.12)*amount,right:-.12+((input.attention!==null&&input.attention!==2?-.12:g.right)+.12)*amount,elbow:-.22+(g.elbow+.22)*amount,lean:g.lean*amount,nod:g.nod*amount};
 }
}
