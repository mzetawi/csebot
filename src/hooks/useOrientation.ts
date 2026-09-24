import { useEffect } from 'react';
import { useExperience } from '../store/experienceStore';
export function useOrientation() {
  useEffect(() => {
    const query = matchMedia('(orientation: landscape)');
    const update = () => useExperience.getState().set({isLandscape:query.matches,paused:!query.matches || document.hidden});
    update(); query.addEventListener('change',update);
    window.addEventListener('resize',update); window.addEventListener('orientationchange',update);
    screen.orientation?.addEventListener('change',update); document.addEventListener('visibilitychange',update);
    return () => {query.removeEventListener('change',update);window.removeEventListener('resize',update);window.removeEventListener('orientationchange',update);screen.orientation?.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
  },[]);
}
export async function lockLandscape() {
  try { await (screen.orientation as ScreenOrientation & {lock?: (orientation:string)=>Promise<void>})?.lock?.('landscape'); } catch { /* Landscape UI gate remains authoritative on iOS. */ }
}
