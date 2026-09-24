import { scenes } from './scenes';
export const subtitles = scenes.flatMap(scene => scene.lines.map((text, i) => ({
  start: scene.start + (scene.end - scene.start) * i / scene.lines.length,
  end: scene.start + (scene.end - scene.start) * (i + 1) / scene.lines.length,
  text,
})));
