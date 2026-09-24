import arabic from './narration.ar.json';
export type RobotPose = 'idle' | 'spawn' | 'wave' | 'talk' | 'pointLeft' | 'pointRight' | 'presentLeft' | 'presentRight' | 'openHands' | 'thinking' | 'celebrate' | 'finalPose';
export type SceneId = 'scan' | 'spawn' | 'welcome' | 'major' | 'careers' | 'club' | 'website' | 'final';
export type CardData = { title:string; eyebrow:string; body:string; icon:string; variant?:'terminal'|'network'|'featured'|'mini'|'data' };
export type Scene = {id:SceneId;start:number;end:number;label:string;pose:RobotPose;lines:string[];cards:CardData[]};
export const scenes:Scene[]=[
 {id:'scan',start:0,end:2.7,label:'معايرة المكان',pose:'idle',lines:[],cards:[]},
 {id:'spawn',start:2.7,end:5,label:'تفعيل المرشد',pose:'spawn',lines:[],cards:[]},
 {id:'welcome',start:5,end:11,label:'اكتشف التخصص',pose:'wave',lines:[arabic.welcome.displayText],cards:[
  {title:'من فكرة إلى نظام',eyebrow:'01 / DISCOVER',body:'تفكير. تصميم. تطوير.',icon:'code',variant:'network'},
  {title:'هندسة أنظمة الحاسوب',eyebrow:'COMPUTER SYSTEMS ENGINEERING',body:'جامعة فلسطين التقنية — خضوري',icon:'graduation',variant:'featured'}]},
 {id:'major',start:11,end:24,label:'البرمجيات والأنظمة',pose:'presentLeft',lines:[arabic.major.displayText],cards:[
  {title:'برمجيات تصنع الفرق',eyebrow:'SOFTWARE DEVELOPMENT',body:'فكرة ← منطق ← تطبيق',icon:'code',variant:'terminal'},
  {title:'فهم هندسي أوسع',eyebrow:'HARDWARE FOUNDATIONS',body:'البرنامج والجهاز، معًا.',icon:'cpu',variant:'mini'},
  {title:'أنظمة مترابطة',eyebrow:'BACKEND · NETWORKS · DATA',body:'خدمات تتواصل. بيانات تتدفق.',icon:'network',variant:'network'}]},
 {id:'careers',start:24,end:32,label:'مسارات تستكشفها',pose:'openHands',lines:[arabic.careers.displayText],cards:[
  {title:'تطوير البرمجيات',eyebrow:'SOFTWARE · BACKEND',body:'منطق يحوّل الفكرة إلى تجربة.',icon:'code',variant:'terminal'},
  {title:'الأمن السيبراني',eyebrow:'NETWORKS · SECURITY',body:'اتصال آمن. أنظمة موثوقة.',icon:'shield',variant:'mini'},
  {title:'الحوسبة السحابية',eyebrow:'CLOUD · SYSTEMS',body:'مسارات توسّعها بالتعلّم والممارسة.',icon:'cloud',variant:'data'}]},
 {id:'club',start:32,end:44,label:'مجتمع تتعلّم معه',pose:'celebrate',lines:[arabic.club.displayText],cards:[
  {title:'ورشات ودورات',eyebrow:'LEARN TOGETHER',body:'معرفة تتحول إلى ممارسة.',icon:'users',variant:'network'},
  {title:'مسابقات تقنية',eyebrow:'THINK · BUILD · SHARE',body:'تعلّم، شارك، وتحدّ نفسك.',icon:'trophy',variant:'mini'},
  {title:'نادي هندسة الحاسوب',eyebrow:'CSE CLUB · PTUK',body:'مجتمع طلابي. وطموح مشترك.',icon:'graduation',variant:'featured'}]},
 {id:'website',start:44,end:53,label:'نافذتك إلى النادي',pose:'presentRight',lines:[arabic.website.displayText],cards:[]},
 {id:'final',start:53,end:60,label:'مرحبًا بك',pose:'finalPose',lines:[arabic.final.displayText],cards:[]},
];
export function sceneAt(time:number){return scenes.find(s=>time>=s.start&&time<s.end)??scenes[scenes.length-1];}
