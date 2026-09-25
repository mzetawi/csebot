import { beforeEach,expect,test,vi } from 'vitest';
vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
const {relativeTilt,requestOrientation}=await import('../src/hooks/useDeviceOrientation');
const {requestImmersiveFullscreen}=await import('../src/hooks/useFullscreen');
const {useExperience}=await import('../src/store/experienceStore');
beforeEach(()=>vi.stubGlobal('screen',{orientation:{lock:vi.fn(async()=>{})}}));
test('calibration uses the held device angle and clamps both landscape directions',()=>{
 expect(relativeTilt(80,-50,80,-50,90)).toEqual({x:0,y:0});
 expect(relativeTilt(90,-50,80,-50,90).x).toBeCloseTo(.4);
 expect(relativeTilt(90,-50,80,-50,270).x).toBeCloseTo(-.4);
 expect(Math.abs(relativeTilt(160,-100,80,-50,90).x)).toBeLessThanOrEqual(1);
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
