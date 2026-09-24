const isFront=(track:MediaStreamTrack)=>track.getSettings().facingMode==='user'||/front|facetime|selfie|user-facing/i.test(track.label);
const stop=(stream:MediaStream)=>stream.getTracks().forEach(t=>t.stop());
/** Lens names are hints, never inferred from device order. Unknown cameras must
 * satisfy an exact environment constraint before we accept them. */
export async function openRearCamera(media:MediaDevices):Promise<MediaStream>{
 const resolution={width:{ideal:1920},height:{ideal:1080}};
 let stream=await media.getUserMedia({video:{...resolution,facingMode:{ideal:'environment'}},audio:false});
 try{
  let track=stream.getVideoTracks()[0];
  if(isFront(track)||(!track.getSettings().facingMode&&!/back|rear|environment|خلف/i.test(track.label))){
   stop(stream);stream=await media.getUserMedia({video:{...resolution,facingMode:{exact:'environment'}},audio:false});track=stream.getVideoTracks()[0];
  }
  if(isFront(track))throw new Error('A rear camera is required.');
  const devices=await media.enumerateDevices().catch(()=>[]);
  const wide=devices.find(d=>d.kind==='videoinput'&&/back|rear|environment|خلف/i.test(d.label)&&/ultra.?wide|0[.,]5|wide.?angle/i.test(d.label)&&!/front|selfie/i.test(d.label));
  if(wide&&wide.deviceId!==track.getSettings().deviceId){
   let replacement:MediaStream|null=null;
   try{replacement=await media.getUserMedia({video:{...resolution,deviceId:{exact:wide.deviceId},facingMode:{exact:'environment'}},audio:false});if(isFront(replacement.getVideoTracks()[0]))stop(replacement);else{stop(stream);stream=replacement;track=stream.getVideoTracks()[0];}}
   catch{replacement?.getTracks().forEach(t=>t.stop());/* Keep the working rear camera. */}
  }
  const caps=track.getCapabilities?.() as MediaTrackCapabilities&{zoom?:{min:number;max:number}};
  if(caps?.zoom&&caps.zoom.min<(track.getSettings() as MediaTrackSettings&{zoom?:number}).zoom!){
   try{await track.applyConstraints({advanced:[{zoom:caps.zoom.min} as MediaTrackConstraintSet]});}catch{/* No lens control on this device. */}
  }
  return stream;
 }catch(error){stop(stream);throw error;}
}
