import { beforeEach,expect,test,vi } from 'vitest';
vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
const {openRearCamera}=await import('../src/hooks/cameraSelection');
const {relativeTilt,requestOrientation}=await import('../src/hooks/useDeviceOrientation');
const {requestImmersiveFullscreen}=await import('../src/hooks/useFullscreen');
const {useExperience}=await import('../src/store/experienceStore');
function stream(label:string,facingMode:string,deviceId='rear'){
 const track={label,getSettings:()=>({facingMode,deviceId}),getCapabilities:()=>({}),stop:vi.fn()};
 return{track,value:{getVideoTracks:()=>[track],getTracks:()=>[track]} as unknown as MediaStream};
}
beforeEach(()=>vi.stubGlobal('screen',{orientation:{lock:vi.fn(async()=>{})}}));
test('calibration uses the held device angle and clamps both landscape directions',()=>{
 expect(relativeTilt(80,-50,80,-50,90)).toEqual({x:0,y:0});
 expect(relativeTilt(90,-50,80,-50,90).x).toBeCloseTo(.4);
 expect(relativeTilt(90,-50,80,-50,270).x).toBeCloseTo(-.4);
 expect(Math.abs(relativeTilt(160,-100,80,-50,90).x)).toBeLessThanOrEqual(1);
});
test('wide rear lens replaces and releases the initial rear camera',async()=>{
 const normal=stream('Back camera','environment'),wide=stream('Back ultra wide','environment','wide');
 const media={getUserMedia:vi.fn().mockResolvedValueOnce(normal.value).mockResolvedValueOnce(wide.value),enumerateDevices:async()=>[{kind:'videoinput',label:'Back ultra wide',deviceId:'wide'}]} as unknown as MediaDevices;
 expect(await openRearCamera(media)).toBe(wide.value);expect(normal.track.stop).toHaveBeenCalled();expect(wide.track.stop).not.toHaveBeenCalled();
});
test('front camera is rejected and released if environment capture is unavailable',async()=>{
 const front=stream('FaceTime HD','user');
 const media={getUserMedia:vi.fn().mockResolvedValueOnce(front.value).mockRejectedValueOnce(new Error('unavailable'))} as unknown as MediaDevices;
 await expect(openRearCamera(media)).rejects.toThrow('unavailable');expect(front.track.stop).toHaveBeenCalled();
});
test('failed wide lens selection keeps the working environment camera',async()=>{
 const normal=stream('Rear camera','environment');
 const media={getUserMedia:vi.fn().mockResolvedValueOnce(normal.value).mockRejectedValueOnce(new Error('lens unavailable')),enumerateDevices:async()=>[{kind:'videoinput',label:'Rear ultra wide',deviceId:'wide'}]} as unknown as MediaDevices;
 expect(await openRearCamera(media)).toBe(normal.value);expect(normal.track.stop).not.toHaveBeenCalled();
});
test('denied native fullscreen falls through to landscape lock without throwing',async()=>{
 const requestFullscreen=vi.fn(async()=>{throw new Error('denied');});vi.stubGlobal('document',{documentElement:{requestFullscreen},fullscreenElement:null});
 await expect(requestImmersiveFullscreen()).resolves.toBeUndefined();expect(requestFullscreen).toHaveBeenCalled();expect(screen.orientation.lock).toHaveBeenCalledWith('landscape');
});
test('native fullscreen is requested synchronously from the gesture',async()=>{
 const requestFullscreen=vi.fn(async()=>{});vi.stubGlobal('document',{documentElement:{requestFullscreen},fullscreenElement:null});
 const result=requestImmersiveFullscreen();expect(requestFullscreen).toHaveBeenCalledTimes(1);await result;
});
test('gyroscope permission denial does not block the experience',async()=>{
 vi.stubGlobal('window',{DeviceOrientationEvent:{requestPermission:vi.fn(async()=>'denied')}});await requestOrientation();expect(useExperience.getState().orientationPermission).toBe('denied');
});
