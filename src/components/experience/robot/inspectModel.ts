import type { AnimationClip, Mesh, Object3D } from 'three';
/** Inventory only: never guess a bone name or mutate the uploaded model. */
export function inspectModel(root:Object3D,animations:AnimationClip[]){
 const nodes:{name:string;type:string;parent:string|null}[]=[],bones:string[]=[],skinnedMeshes:string[]=[],morphs:{mesh:string;targets:Record<string,number>}[]=[];
 root.traverse(node=>{nodes.push({name:node.name,type:node.type,parent:node.parent?.name??null});if(node.type==='Bone')bones.push(node.name);if(node.type==='SkinnedMesh')skinnedMeshes.push(node.name);const mesh=node as Mesh;if(mesh.morphTargetDictionary)morphs.push({mesh:node.name,targets:{...mesh.morphTargetDictionary}});});
 return {nodes,bones,skinnedMeshes,morphs,clips:animations.map(clip=>({name:clip.name,duration:clip.duration}))};
}
