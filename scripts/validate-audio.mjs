import { readFile,stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve('public');
const manifest=JSON.parse(await readFile(resolve(root,'audio/csebot/manifest-ar.json'),'utf8'));
const ids=['welcome','major','careers','club','website','final'];
let missing=0;
if(!manifest.language?.startsWith('ar'))throw new Error('Arabic-only narration is required.');
for(const id of ids){const path=manifest.clips[id];if(!path){console.log(`${id}: temporary Arabic browser speech`);missing++;continue;}const full=resolve(root,`.${path}`);if(!full.startsWith(root+'/'))throw new Error(`Invalid audio path for ${id}`);const file=await stat(full);if(file.size<1000)throw new Error(`Invalid audio file: ${id}`);console.log(`${id}: ${file.size} bytes`);}
if(!missing){const total=5+Object.values(manifest.durations).reduce((a,b)=>a+Number(b),0);if(total<58||total>63)throw new Error(`Tour duration ${total} outside 58–63 seconds.`);console.log(`Azure tour duration: ${total.toFixed(2)} seconds.`);}
else console.log('Azure integration is ready. Final audio requires credentials and a listening review; temporary browser Arabic is enabled.');
if(process.argv.includes('--require-recordings')&&missing)process.exitCode=1;
