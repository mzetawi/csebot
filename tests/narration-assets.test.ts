import { readFileSync,statSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect,test } from 'vitest';
import { scenes } from '../src/data/scenes';
import { EXPERIENCE } from '../src/config/experience';
import arabic from '../src/data/narration.ar.json';
test('active Arabic script covers the minute tour and uses the supplied image',()=>{
 const manifest=JSON.parse(readFileSync(resolve('public',`.${EXPERIENCE.audioManifest}`),'utf8'));
 expect(manifest.language).toMatch(/^ar/);expect(manifest.provider).toBe('azure');
 expect(scenes.filter(s=>s.lines.length).map(s=>s.id)).toEqual(Object.keys(arabic));
 expect(scenes.find(s=>s.id==='welcome')?.start).toBe(5);expect(scenes.at(-1)?.end).toBe(60);
 for(const line of Object.values(arabic)){expect(line.speechText).toMatch(/[\u064b-\u0652]/);expect(line.speechText).not.toMatch(/[a-zA-Z]/);}
 expect(statSync(resolve('public',`.${EXPERIENCE.clubImage}`)).size).toBeGreaterThan(10000);
});
