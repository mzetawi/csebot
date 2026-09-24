import { Code2, Network, ShieldCheck, Cloud, Cpu, Users, Trophy, GraduationCap, type LucideIcon } from 'lucide-react';
import type { CardData } from '../../../data/scenes';
import { useSpatialElement } from '../../../hooks/useSpatialElement';
const icons:Record<string,LucideIcon>={code:Code2,network:Network,shield:ShieldCheck,cloud:Cloud,cpu:Cpu,users:Users,trophy:Trophy,graduation:GraduationCap};
function CardVisual({card}:{card:CardData}){
 if(card.variant==='terminal')return <div className="code-visual" aria-hidden="true"><div><b>01</b><span>function</span> buildIdea() {'{'}</div><div><b>02</b>　connect(<em>people</em>);</div><div><b>03</b>　<span>return</span> possibilities;</div><div><b>04</b>{'}'}<i/></div></div>;
 if(card.variant==='network')return <div className="nodes-visual" aria-hidden="true"><span>API</span><i/><span className="hub">CSE</span><i/><span>DATA</span><div className="node-trace"/></div>;
 if(card.variant==='data')return <div className="servers-visual" aria-hidden="true"><Cloud/><i/><div><span/><span/><span/></div></div>;
 if(card.icon==='shield')return <div className="shield-visual" aria-hidden="true"><ShieldCheck/><i/></div>;
 return null;
}
export function HolographicCard({card,index,active}:{card:CardData;index:number;active:boolean}){
 const Icon=icons[card.icon]??Code2,ref=useSpatialElement(index===2?1.1:.65,index*1.3);
 return <div data-card-state={active?'active':'previous'} className={`card-slot slot-${index} variant-${card.variant??'secondary'} ${active?'is-active':'is-previous'}`}>
 <div ref={ref} className={`holo-card ${card.variant??''}`}><div className="hologram-seed"/><div className="frame-emitters"><i/><i/><i/><i/></div><div className="holo-content"><div className="card-top"><Icon size={20} strokeWidth={1.4}/><span className="card-index">CSE // 0{index+1}</span></div><div className="eyebrow">{card.eyebrow}</div><h2 dir="rtl">{card.title}</h2><p dir="rtl">{card.body}</p><CardVisual card={card}/><div className="card-baseline"><i/><i/><i/><span>{active?'ACTIVE':'NODE ONLINE'}</span></div></div><span className="edge-ticks">┊┊┊</span></div></div>;
}
