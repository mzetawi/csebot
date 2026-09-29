import { useMemo, type ReactNode } from 'react';
import { Shape } from 'three';
/** A shallow extruded rounded panel avoids self-intersection on a thin glass visor. */
export function FacePanel({width,height,radius,depth=.018,position=[0,0,0],children}:{width:number;height:number;radius:number;depth?:number;position?:[number,number,number];children:ReactNode}){
 const shape=useMemo(()=>{
  const x=width/2,y=height/2,r=Math.min(radius,x,y),s=new Shape();
  s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);
  s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);
  s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);
  return s;
 },[width,height,radius]);
 return <mesh position={position}><extrudeGeometry args={[shape,{depth,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:3,curveSegments:12,steps:1}]}/>{children}</mesh>;
}
