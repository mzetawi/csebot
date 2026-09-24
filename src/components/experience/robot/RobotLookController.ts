import { Euler, Quaternion } from 'three';
export class RobotLookController {
 private target=new Quaternion();private euler=new Euler();
 update(head:Quaternion,delta:number,attention:number|null,nod:number,reduced:boolean){
  const amount=reduced?.25:1;
  this.euler.set(nod*amount,attention===null?0:(attention===2?.25:-.25)*amount,attention===null?0:(attention===2?-.018:.018)*amount);
  this.target.setFromEuler(this.euler);head.slerp(this.target,1-Math.exp(-Math.min(delta,.05)*4));
 }
}
