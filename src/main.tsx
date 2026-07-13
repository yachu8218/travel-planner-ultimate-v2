import React,{useEffect,useMemo,useState} from 'react'
import ReactDOM from 'react-dom/client'
import {
 Plus,Pencil,Copy,Trash2,ArrowLeft,Share2,FileDown,Upload,Palette,Clock3,Ruler,
 StickyNote,ChevronLeft,ChevronRight,House,CalendarDays,Compass,WalletCards,
 Languages,UserRound,RefreshCw,Plane,MapPin,CloudSun,CheckCircle2,MoreHorizontal,
 ArrowUp,ArrowDown,X,Search
} from 'lucide-react'
import './styles.css'

type TType='place'|'meal'|'hotel'|'transport'|'flight'|'note'
type TransportMode='walk'|'metro'|'bus'|'taxi'|'car'|'train'|'flight'|'ferry'
type ThemeId='summer'|'journal'|'sakura'|'forest'|'coast'|'lavender'|'neon'|'cafe'|'christmas'|'washi'
type AppPage='home'|'itinerary'|'explore'|'wallet'|'translate'|'more'
type Check={id:string,text:string,done:boolean}
type Item={
 id:string,type:TType,start:string,end:string,title:string,note?:string,checks?:Check[],
 transportMode?:TransportMode,from?:string,to?:string,durationMin?:number,distanceKm?:number,
 line?:string,flightNo?:string
}
type Day={id:string,date:string,title:string,items:Item[]}
type Traveler={id:string;name:string}
type Expense={id:string;title:string;amount:number;currency:string;payerId:string;participantIds:string[];category:string;date:string;note?:string}
type WalletData={travelers:Traveler[];expenses:Expense[];budgetTwd:number;overseasFee:number}
type Trip={
 id:string,name:string,destination:string,country:string,currency:string,language:string,locale:string,
 start:string,end:string,lat:number,lon:number,cover?:string,days:Day[],theme:ThemeId,wallet?:WalletData,created:number,updated:number
}
type State={version:2,active:string|null,trips:Trip[]}
type WeatherDay={date:string,code:number,max:number,min:number,rain:number}
type PlaceResult={place_id:string;display_name:string;lat:string;lon:string}
type TranslationFavorite={id:string;source:string;translated:string;locale:string}
type FlightResult={flightNo:string;airline?:string;status?:string;departure:{airport?:string;iata?:string;terminal?:string;gate?:string;scheduled?:string};arrival:{airport?:string;iata?:string;terminal?:string;gate?:string;baggage?:string;scheduled?:string};aircraft?:string;durationMin?:number;source?:string}

const KEY='travel-planner-ultimate-v2'
const WEATHER_KEY='travel-planner-weather-v22'
const RATE_KEY='travel-planner-rates-v23'
const TRANSLATION_KEY='travel-planner-translation-v23'
const oldKey='travelPlannerUltimatePortfolioV15'
const id=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`
const themes:{id:ThemeId;name:string;desc:string;colors:string[]}[]=[
 {id:'summer',name:'夏日陽光',desc:'奶油黃・湖水綠・暖橘',colors:['#f6cf67','#8fc7b8','#dc8b72']},
 {id:'journal',name:'復古手帳',desc:'米白・咖啡・芥末黃',colors:['#e7d8bd','#8c6f59','#c79b43']},
 {id:'sakura',name:'櫻花旅行',desc:'櫻花粉・灰紫・奶油白',colors:['#e6a8b8','#9d90ad','#fff4ec']},
 {id:'forest',name:'森林療癒',desc:'鼠尾草綠・森林綠・米色',colors:['#9aae8e','#4f6658','#e9dfc9']},
 {id:'coast',name:'海岸假期',desc:'海藍・沙灘米・珊瑚色',colors:['#82b5c4','#e7d2a8','#d9856f']},
 {id:'lavender',name:'灰紫信紙',desc:'灰紫・奶茶・霧白',colors:['#8f849b','#b8a994','#f2efea']},
 {id:'neon',name:'夜晚霓虹',desc:'深藍・紫色・桃紅',colors:['#263553','#795b9f','#d66b91']},
 {id:'cafe',name:'咖啡館',desc:'奶茶・可可・焦糖',colors:['#c8aa86','#6f5142','#d49a5b']},
 {id:'christmas',name:'聖誕旅行',desc:'酒紅・深綠・金色',colors:['#944b55','#385849','#d1ad5b']},
 {id:'washi',name:'和風紙',desc:'米白・靛藍・赤紅',colors:['#e8ddc5','#3e5872','#a94e4e']},
]
const rules=[
 [/busan|seoul|korea|釜山|首爾|韓國|南韓/i,'KR','KRW','韓文','ko-KR',35.1796,129.0756],
 [/tokyo|osaka|kyoto|japan|東京|大阪|京都|日本/i,'JP','JPY','日文','ja-JP',35.6762,139.6503],
 [/bangkok|thailand|曼谷|泰國/i,'TH','THB','泰文','th-TH',13.7563,100.5018],
 [/london|england|英國|倫敦/i,'GB','GBP','英文','en-GB',51.5072,-.1276],
 [/paris|france|巴黎|法國/i,'FR','EUR','法文','fr-FR',48.8566,2.3522],
 [/singapore|新加坡/i,'SG','SGD','英文','en-SG',1.3521,103.8198],
] as const
const profile=(s:string)=>{const r=rules.find(x=>x[0].test(s));return r?{country:r[1],currency:r[2],language:r[3],locale:r[4],lat:r[5],lon:r[6]}:{country:'XX',currency:'USD',language:'英文',locale:'en-US',lat:25.033,lon:121.5654}}
const range=(a:string,b:string)=>{const out:Day[]=[];let d=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00'),n=1;while(d<=e){const x=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;out.push({id:id(),date:x,title:`Day ${n++}`,items:[]});d.setDate(d.getDate()+1)}return out}
const defaultWallet=():WalletData=>({travelers:[{id:id(),name:'我'}],expenses:[],budgetTwd:0,overseasFee:1.5})
const makeTrip=(v:any):Trip=>{const p=profile(v.destination);return{id:id(),name:v.name||`${v.destination}旅行`,destination:v.destination,...p,start:v.start,end:v.end,cover:v.cover,theme:v.theme||'summer',days:range(v.start,v.end),wallet:defaultWallet(),created:Date.now(),updated:Date.now()}}
const normalizeTrip=(t:any):Trip=>({...t,theme:(themes.some(x=>x.id===t.theme)?t.theme:'summer') as ThemeId,wallet:t.wallet||defaultWallet(),days:(t.days||[]).map((d:any)=>({...d,items:(d.items||[]).map((i:any)=>({...i,transportMode:i.transportMode||undefined}))}))})
const load=():State=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s?.version===2)return{...s,trips:(s.trips||[]).map(normalizeTrip)}}catch{}return{version:2,active:null,trips:[]}}
const save=(s:State)=>localStorage.setItem(KEY,JSON.stringify(s))
const b64=(s:string)=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const ub64=(s:string)=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'='))))
const shared=(()=>{const q=new URLSearchParams(location.search).get('trip');if(!q)return null;try{return normalizeTrip(JSON.parse(ub64(q)))}catch{return null}})()
const wicon=(c:number)=>c===0?'☀️':c<=3?'⛅':c<=48?'🌫️':c<=67?'🌧️':c<=77?'❄️':c<=82?'🌦️':'⛈️'
const modeLabel:Record<TransportMode,string>={walk:'步行',metro:'地鐵',bus:'公車',taxi:'計程車',car:'自駕／租車',train:'火車／高鐵／KTX',flight:'飛機',ferry:'渡輪'}
const modeEmoji:Record<TransportMode,string>={walk:'🚶',metro:'🚇',bus:'🚌',taxi:'🚕',car:'🚗',train:'🚄',flight:'✈️',ferry:'⛴️'}
const typeName:Record<TType,string>={place:'景點',meal:'餐廳／甜點',hotel:'住宿',transport:'交通',flight:'航班',note:'便條紙'}

function ThemePicker({value,onChange}:{value:ThemeId,onChange:(t:ThemeId)=>void}){
 return <div className="theme-grid">{themes.map(t=><button type="button" key={t.id} className={`theme-option ${value===t.id?'selected':''}`} onClick={()=>onChange(t.id)}><span className="theme-dots">{t.colors.map(c=><i key={c} style={{background:c}}/>)}</span><b>{t.name}</b><small>{t.desc}</small></button>)}</div>
}

function ModalShell({children,onClose,title}:{children:React.ReactNode,onClose:()=>void,title:string}){
 useEffect(()=>{document.body.classList.add('modal-open');return()=>document.body.classList.remove('modal-open')},[])
 return <div className="shade" role="dialog" aria-modal="true">
  <section className="modal card">
   <header className="modal-head"><div><span className="tape">TRAVEL NOTE</span><h2>{title}</h2></div><button type="button" className="icon close" onClick={onClose}><X size={19}/></button></header>
   <div className="modal-scroll">{children}</div>
  </section>
 </div>
}

function Form({trip,onSave,onClose}:{trip?:Trip,onSave:(v:any)=>void,onClose:()=>void}){
 const [v,setV]=useState({name:trip?.name||'',destination:trip?.destination||'',start:trip?.start||'',end:trip?.end||'',cover:trip?.cover||'',theme:trip?.theme||'summer' as ThemeId})
 const cover=(f?:File)=>{if(!f)return;const r=new FileReader();r.onload=()=>setV({...v,cover:String(r.result)});r.readAsDataURL(f)}
 return <ModalShell title={trip?'編輯旅行':'新增旅行'} onClose={onClose}>
  <form onSubmit={e=>{e.preventDefault();onSave(v)}}>
   <label>旅行名稱<input value={v.name} onChange={e=>setV({...v,name:e.target.value})} placeholder="例如：釜山夏日旅行"/></label>
   <label>目的地<input required value={v.destination} onChange={e=>setV({...v,destination:e.target.value})} placeholder="例如：Busan、Tokyo"/></label>
   <div className="two"><label>出發日期<input required type="date" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></label><label>回程日期<input required type="date" min={v.start} value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></label></div>
   <label>封面照片<input type="file" accept="image/*" onChange={e=>cover(e.target.files?.[0])}/></label>
   {v.cover&&<img className="preview" src={v.cover}/>}
   <div className="picker-label"><Palette size={18}/>選擇旅行主題</div>
   <ThemePicker value={v.theme} onChange={theme=>setV({...v,theme})}/>
   <div className="sticky-actions"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">儲存旅行</button></div>
  </form>
 </ModalShell>
}

function ItemForm({initial,onSave,onClose}:{initial?:Item,onSave:(x:Item)=>void,onClose:()=>void}){
 const [v,setV]=useState({
  type:initial?.type||'place' as TType,start:initial?.start||'09:00',end:initial?.end||'10:00',
  title:initial?.title||'',note:initial?.note||(initial?.checks||[]).map(c=>c.text).join('\n'),
  transportMode:initial?.transportMode||'metro' as TransportMode,from:initial?.from||'',to:initial?.to||'',
  durationMin:initial?.durationMin?.toString()||'',distanceKm:initial?.distanceKm?.toString()||'',
  line:initial?.line||'',flightNo:initial?.flightNo||''
 })
 const isTransport=v.type==='transport'||v.type==='flight'
 return <ModalShell title={initial?'編輯行程':'加入時間軸'} onClose={onClose}>
  <form onSubmit={e=>{e.preventDefault();onSave({
   id:initial?.id||id(),type:v.type,start:v.start,end:v.end,title:v.title,note:v.note,
   transportMode:isTransport?(v.type==='flight'?'flight':v.transportMode):undefined,
   from:isTransport?v.from:undefined,to:isTransport?v.to:undefined,
   durationMin:v.durationMin?Number(v.durationMin):undefined,distanceKm:v.distanceKm?Number(v.distanceKm):undefined,
   line:isTransport?v.line:undefined,flightNo:v.type==='flight'?v.flightNo:undefined,
   checks:v.type==='note'?v.note.split('\n').filter(Boolean).map((text,i)=>({id:initial?.checks?.[i]?.id||id(),text,done:initial?.checks?.[i]?.done||false})):undefined
  })}}>
   <label>行程類型<select value={v.type} onChange={e=>setV({...v,type:e.target.value as TType})}><option value="place">景點</option><option value="meal">餐廳／甜點</option><option value="hotel">住宿</option><option value="transport">交通</option><option value="flight">飛機</option><option value="note">便條紙</option></select></label>
   <div className="two"><label>開始時間<input type="time" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></label><label>結束時間<input type="time" value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></label></div>
   {v.type==='transport'&&<label>交通方式<select value={v.transportMode} onChange={e=>setV({...v,transportMode:e.target.value as TransportMode})}>{Object.entries(modeLabel).filter(([k])=>k!=='flight').map(([k,label])=><option key={k} value={k}>{modeEmoji[k as TransportMode]} {label}</option>)}</select></label>}
   {isTransport&&<><div className="two"><label>出發地<input value={v.from} onChange={e=>setV({...v,from:e.target.value})} placeholder="例如：海雲台站"/></label><label>抵達地<input value={v.to} onChange={e=>setV({...v,to:e.target.value})} placeholder="例如：西面站"/></label></div><div className="two"><label>通勤時間（分鐘）<input type="number" min="0" value={v.durationMin} onChange={e=>setV({...v,durationMin:e.target.value})}/></label><label>距離（公里）<input type="number" min="0" step="0.1" value={v.distanceKm} onChange={e=>setV({...v,distanceKm:e.target.value})}/></label></div><label>{v.type==='flight'?'航班號碼':'路線／車次'}<input value={v.type==='flight'?v.flightNo:v.line} onChange={e=>v.type==='flight'?setV({...v,flightNo:e.target.value.toUpperCase()}):setV({...v,line:e.target.value})} placeholder={v.type==='flight'?'例如：KE2086':'例如：2號線、KTX 105'}/></label></>}
   <label>標題<input required value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder={v.type==='note'?'例如：機場待辦':v.type==='transport'?'例如：前往飯店':'輸入行程名稱'}/></label>
   <label>{v.type==='note'?'待辦內容（每行一項）':'備註'}<textarea rows={5} value={v.note} onChange={e=>setV({...v,note:e.target.value})}/></label>
   <div className="sticky-actions"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">{initial?'儲存修改':'加入行程'}</button></div>
  </form>
 </ModalShell>
}

function Weather({trip,compact=false}:{trip:Trip,compact?:boolean}){
 const [days,setDays]=useState<WeatherDay[]>([])
 const [loading,setLoading]=useState(false)
 const [updated,setUpdated]=useState<number|null>(null)
 const [offline,setOffline]=useState(false)
 const cacheKey=`${trip.id}:${trip.lat}:${trip.lon}`
 const fetchWeather=async(force=false)=>{
  if(loading)return
  setLoading(true);setOffline(false)
  try{
   const raw=JSON.parse(localStorage.getItem(WEATHER_KEY)||'{}')
   const cached=raw[cacheKey]
   if(!force&&cached&&Date.now()-cached.updated<30*60*1000){setDays(cached.days);setUpdated(cached.updated);setLoading(false);return}
   const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trip.lat}&longitude=${trip.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)
   if(!r.ok)throw new Error()
   const j=await r.json()
   const next=j.daily.time.map((date:string,i:number)=>({date,code:j.daily.weather_code[i],max:Math.round(j.daily.temperature_2m_max[i]),min:Math.round(j.daily.temperature_2m_min[i]),rain:j.daily.precipitation_probability_max[i]||0}))
   const now=Date.now();setDays(next);setUpdated(now)
   localStorage.setItem(WEATHER_KEY,JSON.stringify({...raw,[cacheKey]:{days:next,updated:now}}))
  }catch{
   const raw=JSON.parse(localStorage.getItem(WEATHER_KEY)||'{}');const cached=raw[cacheKey]
   if(cached){setDays(cached.days);setUpdated(cached.updated);setOffline(true)}
  }finally{setLoading(false)}
 }
 useEffect(()=>{fetchWeather(false);const onFocus=()=>{if(!updated||Date.now()-updated>30*60*1000)fetchWeather(false)};addEventListener('focus',onFocus);return()=>removeEventListener('focus',onFocus)},[trip.id,trip.lat,trip.lon])
 const first=days[0]
 return <section className={`card weather ${compact?'compact':''}`}>
  <div className="weather-head"><div><small>WEATHER</small><h3>{compact?'今日天氣':`${trip.destination} 一週天氣`}</h3></div><button className="icon refresh" onClick={()=>fetchWeather(true)} disabled={loading} aria-label="重新整理天氣"><RefreshCw size={18} className={loading?'spin':''}/></button></div>
  {first&&compact&&<div className="weather-now"><b>{wicon(first.code)}</b><strong>{first.max}°</strong><span>最低 {first.min}°・降雨 {first.rain}%</span></div>}
  <div className={`weather-row ${compact?'mini-week':''}`}>{days.map(d=><div className="weather-day" key={d.date}><small>{new Date(d.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'short'})}</small><b>{wicon(d.code)}</b><span>{d.max}°</span><em>{d.min}°</em><small>雨 {d.rain}%</small></div>)}</div>
  <p className="weather-status">{offline?'目前離線，使用上次資料・':''}{updated?`更新於 ${new Date(updated).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}`:'正在整理天氣資訊…'}</p>
 </section>
}


const stations=[
 ['釜山','1號線','多大浦海水浴場','다대포해수욕장','Dadaepo Beach'],['釜山','1號線','下端','하단','Hadan'],['釜山','1號線','沙上','사상','Sasang'],['釜山','1號線','釜山站','부산역','Busan Station'],['釜山','1號線','草梁','초량','Choryang'],['釜山','1號線','中央','중앙','Jungang'],['釜山','1號線','南浦','남포','Nampo'],['釜山','1號線','札嘎其','자갈치','Jagalchi'],['釜山','1號線','土城','토성','Toseong'],['釜山','1號線','西面','서면','Seomyeon'],['釜山','1號線','釜田','부전','Bujeon'],['釜山','1號線','蓮山','연산','Yeonsan'],['釜山','1號線','東萊','동래','Dongnae'],['釜山','1號線','溫泉場','온천장','Oncheonjang'],['釜山','1號線','老圃','노포','Nopo'],
 ['釜山','2號線','萇山','장산','Jangsan'],['釜山','2號線','中洞','중동','Jung-dong'],['釜山','2號線','海雲台','해운대','Haeundae'],['釜山','2號線','冬柏','동백','Dongbaek'],['釜山','2號線','Centum City','센텀시티','Centum City'],['釜山','2號線','民樂','민락','Millak'],['釜山','2號線','廣安','광안','Gwangan'],['釜山','2號線','金蓮山','금련산','Geumnyeonsan'],['釜山','2號線','慶星大釜慶大','경성대·부경대','Kyungsung Univ.'],['釜山','2號線','田浦','전포','Jeonpo'],['釜山','3號線','美南','미남','Minam'],['釜山','3號線','社稷','사직','Sajik'],['釜山','3號線','巨堤','거제','Geoje'],['釜山','東海線','新海雲台','신해운대','Sinhaeundae'],['釜山','東海線','松亭','송정','Songjeong'],['釜山','東海線','機張','기장','Gijang'],['釜山','金海輕軌','金海機場','공항','Gimhae Airport'],
 ['首爾','1號線','首爾站','서울역','Seoul Station'],['首爾','1號線','鐘路三街','종로3가','Jongno 3-ga'],['首爾','2號線','弘大入口','홍대입구','Hongik Univ.'],['首爾','2號線','乙支路入口','을지로입구','Euljiro 1-ga'],['首爾','2號線','東大門歷史文化公園','동대문역사문화공원','Dongdaemun History & Culture Park'],['首爾','2號線','聖水','성수','Seongsu'],['首爾','2號線','江南','강남','Gangnam'],['首爾','3號線','景福宮','경복궁','Gyeongbokgung'],['首爾','4號線','明洞','명동','Myeong-dong'],['首爾','6號線','梨泰院','이태원','Itaewon'],['首爾','機場鐵路','仁川機場第一航廈','인천공항1터미널','Incheon Airport T1'],['首爾','機場鐵路','仁川機場第二航廈','인천공항2터미널','Incheon Airport T2'],
 ['東京','JR山手線','東京','東京','Tokyo'],['東京','JR山手線','上野','上野','Ueno'],['東京','JR山手線','秋葉原','秋葉原','Akihabara'],['東京','JR山手線','新宿','新宿','Shinjuku'],['東京','JR山手線','澀谷','渋谷','Shibuya'],['東京','JR山手線','池袋','池袋','Ikebukuro'],['東京','銀座線','淺草','浅草','Asakusa'],['東京','銀座線','銀座','銀座','Ginza'],['東京','機場線','羽田機場第三航廈','羽田空港第3ターミナル','Haneda Airport T3'],
 ['大阪','御堂筋線','梅田','梅田','Umeda'],['大阪','御堂筋線','心齋橋','心斎橋','Shinsaibashi'],['大阪','御堂筋線','難波','なんば','Namba'],['大阪','御堂筋線','天王寺','天王寺','Tennoji'],['大阪','JR','大阪','大阪','Osaka'],['大阪','JR','環球影城','ユニバーサルシティ','Universal City'],['大阪','南海線','關西機場','関西空港','Kansai Airport'],
 ['京都','JR','京都','京都','Kyoto'],['京都','阪急京都線','京都河原町','京都河原町','Kyoto-kawaramachi'],['京都','京阪本線','祇園四條','祇園四条','Gion-shijo'],['京都','JR奈良線','稻荷','稲荷','Inari'],['福岡','機場線','福岡機場','福岡空港','Fukuoka Airport'],['福岡','機場線','博多','博多','Hakata'],['福岡','機場線','天神','天神','Tenjin']
] as const
const stationSearch=(q:string)=>{const k=q.trim().toLowerCase();return k?stations.filter(s=>s.join(' ').toLowerCase().includes(k)).slice(0,20):[]}
const gmap=(q:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const nmap=(q:string)=>`https://map.naver.com/p/search/${encodeURIComponent(q)}`
const ftime=(s?:string)=>s?new Date(s).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'

function FlightCenter({trip,onAdd}:{trip:Trip,onAdd:(x:Item)=>void}){
 const [flightNo,setFlightNo]=useState('')
 const [date,setDate]=useState(trip.start)
 const [loading,setLoading]=useState(false)
 const [result,setResult]=useState<FlightResult|null>(null)
 const [message,setMessage]=useState('')
 const [manual,setManual]=useState(false)
 const [m,setM]=useState({from:'',to:'',start:'12:00',end:'15:30',airline:'',terminalFrom:'',terminalTo:''})
 const search=async()=>{
  const no=flightNo.trim().toUpperCase();if(!no){setMessage('請先輸入航班號碼。');return}
  setLoading(true);setMessage('');setResult(null)
  try{const r=await fetch(`/.netlify/functions/flight?flight=${encodeURIComponent(no)}&date=${encodeURIComponent(date)}`);const j=await r.json();if(!r.ok)throw new Error(j.message||'查詢失敗');setResult(j.flight)}
  catch(e:any){setMessage(e?.message||'目前無法取得即時航班資料，可改用手動建立。');setManual(true)}finally{setLoading(false)}
 }
 const addResult=()=>{if(!result)return;const dep=result.departure,arr=result.arrival;onAdd({id:id(),type:'flight',start:(dep.scheduled||'').slice(11,16)||'00:00',end:(arr.scheduled||'').slice(11,16)||'00:00',title:`${result.flightNo} ${result.airline||'航班'}`,flightNo:result.flightNo,transportMode:'flight',from:[dep.airport,dep.iata,dep.terminal&&`T${dep.terminal}`].filter(Boolean).join(' '),to:[arr.airport,arr.iata,arr.terminal&&`T${arr.terminal}`].filter(Boolean).join(' '),durationMin:result.durationMin,note:[result.status&&`狀態：${result.status}`,result.aircraft&&`機型：${result.aircraft}`,dep.gate&&`出發 Gate：${dep.gate}`,arr.baggage&&`行李轉盤：${arr.baggage}`].filter(Boolean).join('\n')})}
 const addManual=()=>{const no=flightNo.trim().toUpperCase()||'自訂航班';onAdd({id:id(),type:'flight',start:m.start,end:m.end,title:`${no} ${m.airline||'航班'}`,flightNo:no,transportMode:'flight',from:[m.from,m.terminalFrom&&`T${m.terminalFrom}`].filter(Boolean).join(' '),to:[m.to,m.terminalTo&&`T${m.terminalTo}`].filter(Boolean).join(' '),note:'手動建立的航班資料，請於出發前向航空公司確認。'})}
 return <section className="flight-center"><div className="flight-search card"><div className="feature-head"><div><small>FLIGHT SEARCH</small><h2>航班中心</h2></div><Plane size={30}/></div><p>可先手動建立航班；日後設定 API Key 後即可查詢即時資料。</p><div className="flight-fields"><label>航班號<input value={flightNo} onChange={e=>setFlightNo(e.target.value.toUpperCase())} placeholder="例如：KE2086"/></label><label>搭乘日期<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><button className="btn primary full" onClick={search} disabled={loading}>{loading?<><RefreshCw className="spin" size={18}/>正在查詢</>:<><Search size={18}/>查詢即時航班</>}</button>{message&&<div className="service-message">{message}<small>現在不用設定金鑰，也能使用下方的手動航班表單。</small></div>}<button className="text-toggle" onClick={()=>setManual(!manual)}>{manual?'收起手動輸入':'＋ 手動建立航班'}</button>{manual&&<div className="manual-flight"><div className="flight-fields"><label>航空公司<input value={m.airline} onChange={e=>setM({...m,airline:e.target.value})} placeholder="例如：大韓航空"/></label><label>出發機場<input value={m.from} onChange={e=>setM({...m,from:e.target.value})} placeholder="桃園 TPE"/></label><label>抵達機場<input value={m.to} onChange={e=>setM({...m,to:e.target.value})} placeholder="釜山 PUS"/></label><label>出發航廈<input value={m.terminalFrom} onChange={e=>setM({...m,terminalFrom:e.target.value})} placeholder="例如：2"/></label><label>抵達航廈<input value={m.terminalTo} onChange={e=>setM({...m,terminalTo:e.target.value})}/></label><label>起飛時間<input type="time" value={m.start} onChange={e=>setM({...m,start:e.target.value})}/></label><label>抵達時間<input type="time" value={m.end} onChange={e=>setM({...m,end:e.target.value})}/></label></div><button className="btn yellow full" onClick={addManual}><Plus size={18}/>加入目前 Day</button></div>}</div>{result&&<article className="card flight-result"><div className="flight-result-head"><div><small>{result.airline||'AIRLINE'}</small><h2>{result.flightNo}</h2></div><span className="status-pill">{result.status||'已取得資料'}</span></div><div className="flight-route"><div><b>{result.departure.iata||'—'}</b><span>{result.departure.airport||'出發機場'}</span><strong>{ftime(result.departure.scheduled)}</strong><small>{result.departure.terminal?`Terminal ${result.departure.terminal}`:''}</small></div><Plane size={30}/><div><b>{result.arrival.iata||'—'}</b><span>{result.arrival.airport||'抵達機場'}</span><strong>{ftime(result.arrival.scheduled)}</strong><small>{result.arrival.terminal?`Terminal ${result.arrival.terminal}`:''}</small></div></div><button className="btn primary full" onClick={addResult}><Plus size={18}/>加入目前 Day</button></article>}</section>
}
function ExploreCenter({trip,onAdd}:{trip:Trip,onAdd:(x:Item)=>void}){
 const [q,setQ]=useState(''),[loading,setLoading]=useState(false),[places,setPlaces]=useState<PlaceResult[]>([]),[msg,setMsg]=useState(''),[sq,setSq]=useState('')
 const ss=useMemo(()=>stationSearch(sq),[sq])
 const search=async()=>{if(!q.trim()){setMsg('請輸入地點、店名或地址。');return}setLoading(true);setMsg('');try{const full=`${q} ${trip.destination}`;const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=zh-TW,zh,en,ko,ja&q=${encodeURIComponent(full)}`);if(!r.ok)throw new Error();const j=await r.json();setPlaces(j);if(!j.length)setMsg('免費地圖資料沒有找到結果，可改用 Google Maps 或 Naver Map。')}catch{setMsg('地點搜尋暫時無法使用，請改用外部地圖。')}finally{setLoading(false)}}
 return <section className="explore-center"><div className="card feature-card"><div className="feature-head"><div><small>PLACE SEARCH</small><h2>地點探索</h2></div><MapPin size={30}/></div><div className="search-row"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋景點、餐廳、住宿或地址"/><button className="icon" onClick={search}>{loading?<RefreshCw className="spin" size={18}/>:<Search size={18}/>}</button></div><div className="external"><a className="btn" target="_blank" rel="noreferrer" href={gmap(`${q} ${trip.destination}`)}>Google Maps</a><a className="btn" target="_blank" rel="noreferrer" href={nmap(`${q} ${trip.destination}`)}>Naver Map</a></div>{msg&&<p className="service-message">{msg}</p>}</div><div className="place-list">{places.map(p=><article className="card place-result" key={p.place_id}><div><h3>{p.display_name.split(',')[0]}</h3><p>{p.display_name}</p></div><div><a target="_blank" rel="noreferrer" href={gmap(p.display_name)}>地圖</a><button onClick={()=>onAdd({id:id(),type:'place',start:'09:00',end:'10:00',title:q||p.display_name.split(',')[0],note:p.display_name})}>加入 Day</button></div></article>)}</div><div className="card feature-card"><div className="feature-head"><div><small>TRANSIT STATION</small><h2>地鐵站搜尋</h2></div><span className="bigemoji">🚇</span></div><input value={sq} onChange={e=>setSq(e.target.value)} placeholder="例如：海雲台、西面、梅田、難波"/><div className="station-list">{ss.map(s=><button key={s.join('-')} onClick={()=>onAdd({id:id(),type:'transport',start:'09:00',end:'09:30',title:`前往${s[2]}站`,transportMode:'metro',to:`${s[2]} ${s[3]} ${s[4]}`,line:`${s[0]} ${s[1]}`})}><span><b>{s[2]}</b><small>{s[3]}・{s[4]}</small></span><em>{s[0]}・{s[1]}</em><Plus size={17}/></button>)}</div></div></section>
}


const currencyDigits=(c:string)=>c==='KRW'||c==='JPY'?0:2
const money=(n:number,c:string)=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:c,maximumFractionDigits:currencyDigits(c)}).format(Number.isFinite(n)?n:0)

function WalletCenter({trip,onChange}:{trip:Trip,onChange:(w:WalletData)=>void}){
 const wallet=trip.wallet||defaultWallet()
 const [amount,setAmount]=useState('1000')
 const [from,setFrom]=useState(trip.currency)
 const [to,setTo]=useState('TWD')
 const [rate,setRate]=useState<number|null>(null)
 const [rateDate,setRateDate]=useState('')
 const [rateMsg,setRateMsg]=useState('')
 const [newName,setNewName]=useState('')
 const [expenseOpen,setExpenseOpen]=useState(false)
 const [exp,setExp]=useState({title:'',amount:'',currency:trip.currency,payerId:wallet.travelers[0]?.id||'',participantIds:wallet.travelers.map(t=>t.id),category:'餐飲',date:new Date().toLocaleDateString('en-CA'),note:''})
 const converted=rate?Number(amount||0)*rate:0
 const loadRate=async(force=false)=>{
  if(from===to){setRate(1);setRateDate(new Date().toLocaleDateString('en-CA'));setRateMsg('');return}
  const key=`${from}-${to}`
  const cache=JSON.parse(localStorage.getItem(RATE_KEY)||'{}')
  if(!force&&cache[key]&&Date.now()-cache[key].at<12*60*60*1000){
   setRate(cache[key].rate);setRateDate(cache[key].date);setRateMsg(`使用已儲存匯率・來源 ${cache[key].source||'快取'}`);return
  }
  setRateMsg('正在更新匯率…')
  const providers=[
   async()=>{
    const r=await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`)
    if(!r.ok)throw new Error()
    const j=await r.json(),next=Number(j.rates?.[to]);if(!next)throw new Error()
    return{rate:next,date:new Date((j.time_last_update_unix||Date.now()/1000)*1000).toLocaleDateString('en-CA'),source:'ExchangeRate-API'}
   },
   async()=>{
    const r=await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    if(!r.ok)throw new Error()
    const j=await r.json(),next=Number(j.rates?.[to]);if(!next)throw new Error()
    return{rate:next,date:j.date||new Date().toLocaleDateString('en-CA'),source:'Frankfurter'}
   },
   async()=>{
    const code=from.toLowerCase()
    const r=await fetch(`https://latest.currency-api.pages.dev/v1/currencies/${code}.json`)
    if(!r.ok)throw new Error()
    const j=await r.json(),next=Number(j[code]?.[to.toLowerCase()]);if(!next)throw new Error()
    return{rate:next,date:j.date||new Date().toLocaleDateString('en-CA'),source:'Currency API'}
   }
  ]
  for(const provider of providers){
   try{
    const result=await provider()
    setRate(result.rate);setRateDate(result.date);setRateMsg(`已更新・來源 ${result.source}`)
    localStorage.setItem(RATE_KEY,JSON.stringify({...cache,[key]:{...result,at:Date.now()}}))
    return
   }catch{}
  }
  if(cache[key]){
   setRate(cache[key].rate);setRateDate(cache[key].date);setRateMsg(`目前離線，使用上次匯率・來源 ${cache[key].source||'快取'}`)
  }else{
   setRate(null);setRateDate('');setRateMsg('目前無法取得匯率，請確認網路後按重新整理。')
  }
 }
 useEffect(()=>{loadRate(false)},[from,to])
 const swap=()=>{setFrom(to);setTo(from);setAmount(converted?String(converted.toFixed(currencyDigits(to))):amount)}
 const addTraveler=()=>{const name=newName.trim();if(!name)return;const t={id:id(),name};onChange({...wallet,travelers:[...wallet.travelers,t]});setNewName('');setExp({...exp,participantIds:[...exp.participantIds,t.id]})}
 const removeTraveler=(tid:string)=>{if(wallet.travelers.length<=1)return alert('至少需要保留一位旅伴。');onChange({...wallet,travelers:wallet.travelers.filter(t=>t.id!==tid),expenses:wallet.expenses.map(e=>({...e,participantIds:e.participantIds.filter(x=>x!==tid),payerId:e.payerId===tid?(wallet.travelers.find(t=>t.id!==tid)?.id||''):e.payerId}))})}
 const addExpense=()=>{const n=Number(exp.amount);if(!exp.title.trim()||!n||!exp.payerId||!exp.participantIds.length)return alert('請完整填寫消費名稱、金額、付款人與參與人。');const e:Expense={id:id(),title:exp.title.trim(),amount:n,currency:exp.currency,payerId:exp.payerId,participantIds:exp.participantIds,category:exp.category,date:exp.date,note:exp.note};onChange({...wallet,expenses:[...wallet.expenses,e]});setExpenseOpen(false);setExp({...exp,title:'',amount:'',note:''})}
 const removeExpense=(eid:string)=>onChange({...wallet,expenses:wallet.expenses.filter(e=>e.id!==eid)})
 const toTwd=(e:Expense)=>e.currency==='TWD'?e.amount:e.currency===trip.currency&&trip.currency===from&&to==='TWD'&&rate?e.amount*rate:e.amount
 const totalTwd=wallet.expenses.reduce((a,e)=>a+toTwd(e),0)
 const balances=wallet.travelers.map(t=>{
  let paid=0,share=0
  wallet.expenses.forEach(e=>{const twd=toTwd(e);if(e.payerId===t.id)paid+=twd;if(e.participantIds.includes(t.id)&&e.participantIds.length)share+=twd/e.participantIds.length})
  return{...t,paid,share,balance:paid-share}
 })
 return <section className="wallet-center">
  <article className="card wallet-hero"><div><small>TRAVEL WALLET</small><h2>旅行錢包</h2><p>{trip.destination}・{trip.currency}</p></div><div><small>目前總支出</small><strong>{money(totalTwd,'TWD')}</strong><span>預算 {wallet.budgetTwd?Math.round(totalTwd/wallet.budgetTwd*100):0}%</span></div></article>
  <article className="card rate-card"><div className="feature-head"><div><small>EXCHANGE RATE</small><h2>雙向匯率換算</h2></div><button className="icon" onClick={()=>loadRate(true)}><RefreshCw size={18}/></button></div><div className="rate-grid"><div><label>金額<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><select value={from} onChange={e=>setFrom(e.target.value)}><option>{trip.currency}</option><option>TWD</option><option>USD</option><option>EUR</option><option>JPY</option><option>KRW</option></select></div><button className="swap" onClick={swap}>⇄</button><div><label>換算結果<input readOnly value={rate?converted.toFixed(currencyDigits(to)):''}/></label><select value={to} onChange={e=>setTo(e.target.value)}><option>TWD</option><option>{trip.currency}</option><option>USD</option><option>EUR</option><option>JPY</option><option>KRW</option></select></div></div><div className="amount-shortcuts">{(trip.currency==='KRW'?[1000,5000,10000,30000,50000,100000]:trip.currency==='JPY'?[100,500,1000,3000,5000,10000]:[10,20,50,100,200,500]).map(v=><button key={v} onClick={()=>{setFrom(trip.currency);setTo('TWD');setAmount(String(v))}}>{new Intl.NumberFormat('zh-TW').format(v)} {trip.currency}</button>)}</div><p className="rate-status">{rate?`1 ${from} ≈ ${rate.toFixed(6)} ${to}・資料日期 ${rateDate}・${rateMsg}`:rateMsg||'正在取得匯率…'}</p></article>
  <article className="card budget-card"><div className="feature-head"><div><small>BUDGET</small><h2>旅行預算</h2></div><span>{wallet.budgetTwd?`${Math.max(0,Math.round(100-totalTwd/wallet.budgetTwd*100))}% 剩餘`:'尚未設定'}</span></div><label>總預算（台幣）<input type="number" min="0" value={wallet.budgetTwd||''} onChange={e=>onChange({...wallet,budgetTwd:Number(e.target.value)||0})}/></label><label>海外刷卡手續費（%）<input type="number" min="0" step="0.1" value={wallet.overseasFee} onChange={e=>onChange({...wallet,overseasFee:Number(e.target.value)||0})}/></label></article>
  <article className="card travelers-card"><div className="feature-head"><div><small>TRAVELERS</small><h2>旅伴</h2></div><span>{wallet.travelers.length} 人</span></div><div className="traveler-add"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="輸入旅伴姓名"/><button className="btn primary" onClick={addTraveler}><Plus size={17}/>新增</button></div><div className="traveler-chips">{wallet.travelers.map(t=><span key={t.id}>{t.name}<button onClick={()=>removeTraveler(t.id)}>×</button></span>)}</div></article>
  <div className="wallet-section-head"><div><small>EXPENSES</small><h2>消費紀錄</h2></div><button className="btn primary" onClick={()=>setExpenseOpen(true)}><Plus size={17}/>新增消費</button></div>
  <div className="expense-list">{wallet.expenses.length?wallet.expenses.map(e=><article className="card expense-row" key={e.id}><div><small>{e.date}・{e.category}</small><h3>{e.title}</h3><p>{wallet.travelers.find(t=>t.id===e.payerId)?.name||'未指定'}先付款・{e.participantIds.length}人分攤</p></div><div><strong>{money(e.amount,e.currency)}</strong><button onClick={()=>removeExpense(e.id)}><Trash2 size={16}/></button></div></article>):<p className="empty">還沒有消費紀錄。</p>}</div>
  <article className="card settlement-card"><div className="feature-head"><div><small>SPLIT BILL</small><h2>分帳結算</h2></div></div>{balances.map(b=><div className="balance-row" key={b.id}><div><b>{b.name}</b><small>已付 {money(b.paid,'TWD')}・應分攤 {money(b.share,'TWD')}</small></div><strong className={b.balance>=0?'receive':'pay'}>{b.balance>=0?`應收 ${money(b.balance,'TWD')}`:`應付 ${money(-b.balance,'TWD')}`}</strong></div>)}</article>
  {expenseOpen&&<ModalShell title="新增消費" onClose={()=>setExpenseOpen(false)}><div className="expense-form"><label>消費名稱<input value={exp.title} onChange={e=>setExp({...exp,title:e.target.value})} placeholder="例如：烤肉晚餐"/></label><div className="two"><label>金額<input type="number" inputMode="decimal" value={exp.amount} onChange={e=>setExp({...exp,amount:e.target.value})}/></label><label>幣別<select value={exp.currency} onChange={e=>setExp({...exp,currency:e.target.value})}><option>{trip.currency}</option><option>TWD</option><option>USD</option></select></label></div><div className="two"><label>付款人<select value={exp.payerId} onChange={e=>setExp({...exp,payerId:e.target.value})}>{wallet.travelers.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label><label>分類<select value={exp.category} onChange={e=>setExp({...exp,category:e.target.value})}><option>餐飲</option><option>交通</option><option>住宿</option><option>門票</option><option>購物</option><option>其他</option></select></label></div><label>日期<input type="date" value={exp.date} onChange={e=>setExp({...exp,date:e.target.value})}/></label><fieldset><legend>參與分帳的人</legend>{wallet.travelers.map(t=><label className="person-check" key={t.id}><input type="checkbox" checked={exp.participantIds.includes(t.id)} onChange={e=>setExp({...exp,participantIds:e.target.checked?[...exp.participantIds,t.id]:exp.participantIds.filter(x=>x!==t.id)})}/>{t.name}</label>)}</fieldset><label>備註<textarea rows={3} value={exp.note} onChange={e=>setExp({...exp,note:e.target.value})}/></label><div className="sticky-actions"><button className="btn" onClick={()=>setExpenseOpen(false)}>取消</button><button className="btn primary" onClick={addExpense}>儲存消費</button></div></div></ModalShell>}
 </section>
}


type Phrase={category:string;zh:string;translated:string}
const zhScenes:Record<string,string[]>={
 '常用':['你好。','謝謝。','不好意思。','請問可以幫我嗎？','請再說一次。','請說慢一點。','我聽不懂。','這是什麼意思？','請寫下來。','沒關係。'],
 '餐廳':['請給我菜單。','請推薦招牌餐點。','我要這個。','不要辣。','不要香菜。','請少冰。','請少糖。','請幫我打包。','可以刷卡嗎？','請幫我結帳。'],
 '飯店':['我要辦理入住。','我要辦理退房。','可以寄放行李嗎？','Wi-Fi密碼是什麼？','可以多給一條毛巾嗎？','房間沒有熱水。','房卡不能使用。','有洗衣機嗎？','可以延後退房嗎？','請幫我叫計程車。'],
 '交通':['請問地鐵站在哪裡？','這班車會到這裡嗎？','下一站是哪裡？','我要去哪個月台？','哪一個出口？','哪裡可以買票？','到機場要多久？','請帶我去這個地址。','請在這裡停。','可以幫我叫計程車嗎？'],
 '購物':['這個多少錢？','有其他顏色嗎？','有其他尺寸嗎？','可以試穿嗎？','有折扣嗎？','可以退稅嗎？','我要買這個。','可以分開結帳嗎？','可以刷卡嗎？','請幫我裝袋。'],
 '醫療':['我不舒服。','我發燒。','我頭痛。','我肚子痛。','我對這種藥過敏。','我需要藥局。','我需要看醫生。','我受傷了。','請幫我叫救護車。','附近有醫院嗎？'],
 '緊急':['我需要幫助。','請幫我報警。','我迷路了。','我的護照遺失了。','我的錢包不見了。','我的手機不見了。','我需要翻譯人員。','請聯絡台灣代表處。','請不要離開。','這裡安全嗎？']
}
const translations:Record<string,Record<string,string[]>>={
 'ko-KR':{
 '常用':['안녕하세요.','감사합니다.','실례합니다.','도와주실 수 있을까요?','다시 말씀해 주세요.','천천히 말씀해 주세요.','잘 이해하지 못했습니다.','이게 무슨 뜻인가요?','적어 주세요.','괜찮습니다.'],
 '餐廳':['메뉴판 부탁드립니다.','대표 메뉴를 추천해 주세요.','이것으로 주세요.','맵지 않게 해 주세요.','고수는 빼 주세요.','얼음은 조금만 넣어 주세요.','당도는 낮게 해 주세요.','포장해 주세요.','카드 결제가 가능한가요?','계산 부탁드립니다.'],
 '飯店':['체크인 부탁드립니다.','체크아웃 부탁드립니다.','짐을 맡길 수 있을까요?','와이파이 비밀번호가 무엇인가요?','수건을 한 장 더 주실 수 있을까요?','방에 뜨거운 물이 나오지 않습니다.','객실 카드키가 작동하지 않습니다.','세탁기가 있나요?','체크아웃 시간을 늦출 수 있을까요?','택시를 불러 주세요.'],
 '交通':['지하철역이 어디인가요?','이 차가 여기까지 가나요?','다음 역은 어디인가요?','어느 승강장으로 가야 하나요?','몇 번 출구인가요?','표는 어디에서 살 수 있나요?','공항까지 얼마나 걸리나요?','이 주소로 데려다 주세요.','여기에서 세워 주세요.','택시를 불러 주실 수 있나요?'],
 '購物':['이것은 얼마인가요?','다른 색상이 있나요?','다른 사이즈가 있나요?','입어 봐도 될까요?','할인이 있나요?','택스 리펀드가 가능한가요?','이것을 구매하겠습니다.','따로 계산할 수 있나요?','카드 결제가 가능한가요?','봉투에 넣어 주세요.'],
 '醫療':['몸이 좋지 않습니다.','열이 납니다.','머리가 아픕니다.','배가 아픕니다.','이 약에 알레르기가 있습니다.','약국이 필요합니다.','진료를 받고 싶습니다.','다쳤습니다.','구급차를 불러 주세요.','근처에 병원이 있나요?'],
 '緊急':['도움이 필요합니다.','경찰에 신고해 주세요.','길을 잃었습니다.','여권을 잃어버렸습니다.','지갑을 잃어버렸습니다.','휴대전화를 잃어버렸습니다.','통역사가 필요합니다.','대만 대표부에 연락해 주세요.','떠나지 말아 주세요.','여기는 안전한가요?']},
 'ja-JP':{
 '常用':['こんにちは。','ありがとうございます。','すみません。','手伝っていただけますか。','もう一度お願いします。','ゆっくり話してください。','よく分かりません。','これはどういう意味ですか。','書いてください。','大丈夫です。'],
 '餐廳':['メニューをお願いします。','おすすめ料理を教えてください。','これをお願いします。','辛くしないでください。','パクチーを抜いてください。','氷を少なめにしてください。','甘さ控えめでお願いします。','持ち帰りにしてください。','カードは使えますか。','お会計をお願いします。'],
 '飯店':['チェックインをお願いします。','チェックアウトをお願いします。','荷物を預かっていただけますか。','Wi-Fiのパスワードは何ですか。','タオルをもう一枚いただけますか。','部屋のお湯が出ません。','ルームキーが使えません。','洗濯機はありますか。','チェックアウトを延長できますか。','タクシーを呼んでください。'],
 '交通':['地下鉄の駅はどこですか。','この電車はここまで行きますか。','次の駅はどこですか。','何番ホームですか。','何番出口ですか。','切符はどこで買えますか。','空港までどのくらいかかりますか。','この住所までお願いします。','ここで止めてください。','タクシーを呼んでいただけますか。'],
 '購物':['これはいくらですか。','ほかの色はありますか。','ほかのサイズはありますか。','試着してもいいですか。','割引はありますか。','免税できますか。','これを買います。','別々に会計できますか。','カードは使えますか。','袋に入れてください。'],
 '醫療':['具合が悪いです。','熱があります。','頭が痛いです。','お腹が痛いです。','この薬にアレルギーがあります。','薬局を探しています。','診察を受けたいです。','けがをしました。','救急車を呼んでください。','近くに病院はありますか。'],
 '緊急':['助けが必要です。','警察を呼んでください。','道に迷いました。','パスポートをなくしました。','財布をなくしました。','携帯電話をなくしました。','通訳が必要です。','台湾の代表処に連絡してください。','ここを離れないでください。','ここは安全ですか。']},
 'th-TH':{
 '常用':['สวัสดีค่ะ/ครับ','ขอบคุณค่ะ/ครับ','ขอโทษค่ะ/ครับ','ช่วยฉันได้ไหมคะ/ครับ','กรุณาพูดอีกครั้งค่ะ/ครับ','กรุณาพูดช้าๆ ค่ะ/ครับ','ฉันไม่เข้าใจค่ะ/ครับ','นี่หมายความว่าอะไรคะ/ครับ','กรุณาเขียนให้หน่อยค่ะ/ครับ','ไม่เป็นไรค่ะ/ครับ'],
 '餐廳':['ขอเมนูหน่อยค่ะ/ครับ','ช่วยแนะนำเมนูขึ้นชื่อหน่อยค่ะ/ครับ','เอาอันนี้ค่ะ/ครับ','ไม่เผ็ดค่ะ/ครับ','ไม่ใส่ผักชีค่ะ/ครับ','ใส่น้ำแข็งน้อยๆ ค่ะ/ครับ','หวานน้อยค่ะ/ครับ','ใส่กล่องกลับบ้านให้หน่อยค่ะ/ครับ','จ่ายบัตรได้ไหมคะ/ครับ','คิดเงินด้วยค่ะ/ครับ'],
 '飯店':['ขอเช็กอินค่ะ/ครับ','ขอเช็กเอาต์ค่ะ/ครับ','ฝากกระเป๋าได้ไหมคะ/ครับ','รหัส Wi-Fi คืออะไรคะ/ครับ','ขอผ้าเช็ดตัวเพิ่มหนึ่งผืนค่ะ/ครับ','ในห้องไม่มีน้ำร้อนค่ะ/ครับ','คีย์การ์ดใช้ไม่ได้ค่ะ/ครับ','มีเครื่องซักผ้าไหมคะ/ครับ','ขอเลทเช็กเอาต์ได้ไหมคะ/ครับ','ช่วยเรียกแท็กซี่ให้หน่อยค่ะ/ครับ'],
 '交通':['สถานีรถไฟใต้ดินอยู่ที่ไหนคะ/ครับ','รถคันนี้ไปถึงที่นี่ไหมคะ/ครับ','สถานีถัดไปคือที่ไหนคะ/ครับ','ต้องไปชานชาลาไหนคะ/ครับ','ทางออกหมายเลขอะไรคะ/ครับ','ซื้อตั๋วได้ที่ไหนคะ/ครับ','ไปสนามบินใช้เวลานานเท่าไรคะ/ครับ','กรุณาพาไปที่อยู่นี้ค่ะ/ครับ','จอดตรงนี้ค่ะ/ครับ','ช่วยเรียกแท็กซี่ได้ไหมคะ/ครับ'],
 '購物':['อันนี้ราคาเท่าไรคะ/ครับ','มีสีอื่นไหมคะ/ครับ','มีไซซ์อื่นไหมคะ/ครับ','ลองได้ไหมคะ/ครับ','มีส่วนลดไหมคะ/ครับ','ขอคืนภาษีได้ไหมคะ/ครับ','ฉันจะซื้ออันนี้ค่ะ/ครับ','แยกจ่ายได้ไหมคะ/ครับ','จ่ายบัตรได้ไหมคะ/ครับ','ใส่ถุงให้หน่อยค่ะ/ครับ'],
 '醫療':['ฉันไม่สบายค่ะ/ครับ','ฉันมีไข้ค่ะ/ครับ','ฉันปวดหัวค่ะ/ครับ','ฉันปวดท้องค่ะ/ครับ','ฉันแพ้ยานี้ค่ะ/ครับ','ฉันต้องการหาร้านขายยาค่ะ/ครับ','ฉันต้องการพบแพทย์ค่ะ/ครับ','ฉันได้รับบาดเจ็บค่ะ/ครับ','ช่วยเรียกรถพยาบาลค่ะ/ครับ','มีโรงพยาบาลใกล้ๆ ไหมคะ/ครับ'],
 '緊急':['ฉันต้องการความช่วยเหลือค่ะ/ครับ','ช่วยโทรหาตำรวจค่ะ/ครับ','ฉันหลงทางค่ะ/ครับ','ฉันทำหนังสือเดินทางหายค่ะ/ครับ','ฉันทำกระเป๋าสตางค์หายค่ะ/ครับ','ฉันทำโทรศัพท์หายค่ะ/ครับ','ฉันต้องการล่ามค่ะ/ครับ','กรุณาติดต่อสำนักงานไต้หวันค่ะ/ครับ','กรุณาอย่าไปค่ะ/ครับ','ที่นี่ปลอดภัยไหมคะ/ครับ']},
 'en-US':{},
 'en-GB':{},
 'en-SG':{},
 'fr-FR':{}
}
const englishScenes:Record<string,string[]>={
 '常用':['Hello.','Thank you.','Excuse me.','Could you help me?','Please say it again.','Please speak more slowly.','I do not understand.','What does this mean?','Please write it down.','That is okay.'],
 '餐廳':['May I have the menu, please?','Could you recommend the signature dish?','I would like this one, please.','Please make it not spicy.','Please leave out the cilantro.','Less ice, please.','Less sugar, please.','Could you pack this to go?','Can I pay by card?','Could I have the bill, please?'],
 '飯店':['I would like to check in.','I would like to check out.','Could you store my luggage?','What is the Wi-Fi password?','Could I have one more towel?','There is no hot water in my room.','My room key does not work.','Is there a washing machine?','Could I have a late check-out?','Could you call a taxi for me?'],
 '交通':['Where is the subway station?','Does this train go there?','What is the next station?','Which platform should I use?','Which exit should I take?','Where can I buy a ticket?','How long does it take to the airport?','Please take me to this address.','Please stop here.','Could you call a taxi for me?'],
 '購物':['How much is this?','Do you have another color?','Do you have another size?','May I try this on?','Is there a discount?','Can I get a tax refund?','I would like to buy this.','Can we pay separately?','Can I pay by card?','Please put it in a bag.'],
 '醫療':['I do not feel well.','I have a fever.','I have a headache.','I have a stomachache.','I am allergic to this medicine.','I need a pharmacy.','I need to see a doctor.','I am injured.','Please call an ambulance.','Is there a hospital nearby?'],
 '緊急':['I need help.','Please call the police.','I am lost.','I lost my passport.','I lost my wallet.','I lost my phone.','I need an interpreter.','Please contact the Taiwan representative office.','Please do not leave.','Is it safe here?']
}
translations['en-US']=englishScenes;translations['en-GB']=englishScenes;translations['en-SG']=englishScenes
translations['fr-FR']={
 '常用':['Bonjour.','Merci.','Excusez-moi.','Pouvez-vous m’aider, s’il vous plaît ?','Pouvez-vous répéter, s’il vous plaît ?','Parlez plus lentement, s’il vous plaît.','Je ne comprends pas.','Qu’est-ce que cela signifie ?','Pouvez-vous l’écrire ?','Ce n’est pas grave.'],
 '餐廳':['Puis-je avoir le menu, s’il vous plaît ?','Pouvez-vous recommander la spécialité ?','Je voudrais ceci, s’il vous plaît.','Pas épicé, s’il vous plaît.','Sans coriandre, s’il vous plaît.','Peu de glaçons, s’il vous plaît.','Peu sucré, s’il vous plaît.','À emporter, s’il vous plaît.','Puis-je payer par carte ?','L’addition, s’il vous plaît.'],
 '飯店':['Je voudrais faire le check-in.','Je voudrais faire le check-out.','Puis-je laisser mes bagages ?','Quel est le mot de passe Wi-Fi ?','Puis-je avoir une serviette supplémentaire ?','Il n’y a pas d’eau chaude dans la chambre.','La carte de la chambre ne fonctionne pas.','Y a-t-il une machine à laver ?','Puis-je partir plus tard ?','Pouvez-vous appeler un taxi ?'],
 '交通':['Où est la station de métro ?','Ce train va-t-il jusque-là ?','Quelle est la prochaine station ?','Quel quai dois-je prendre ?','Quelle sortie dois-je prendre ?','Où puis-je acheter un billet ?','Combien de temps faut-il pour aller à l’aéroport ?','Conduisez-moi à cette adresse, s’il vous plaît.','Arrêtez-vous ici, s’il vous plaît.','Pouvez-vous appeler un taxi ?'],
 '購物':['Combien coûte ceci ?','Avez-vous une autre couleur ?','Avez-vous une autre taille ?','Puis-je l’essayer ?','Y a-t-il une réduction ?','Puis-je obtenir une détaxe ?','Je voudrais acheter ceci.','Pouvons-nous payer séparément ?','Puis-je payer par carte ?','Mettez-le dans un sac, s’il vous plaît.'],
 '醫療':['Je ne me sens pas bien.','J’ai de la fièvre.','J’ai mal à la tête.','J’ai mal au ventre.','Je suis allergique à ce médicament.','J’ai besoin d’une pharmacie.','J’ai besoin de voir un médecin.','Je suis blessé(e).','Appelez une ambulance, s’il vous plaît.','Y a-t-il un hôpital à proximité ?'],
 '緊急':['J’ai besoin d’aide.','Appelez la police, s’il vous plaît.','Je suis perdu(e).','J’ai perdu mon passeport.','J’ai perdu mon portefeuille.','J’ai perdu mon téléphone.','J’ai besoin d’un interprète.','Contactez le bureau de représentation de Taïwan.','Ne partez pas, s’il vous plaît.','Est-ce sûr ici ?']
}
const phrasebookFor=(locale:string):Phrase[]=>{
 const lang=translations[locale]||translations['en-US']
 return Object.keys(zhScenes).flatMap(category=>zhScenes[category].map((zh,i)=>({category,zh,translated:(lang[category]||englishScenes[category])[i]})))
}
const localePair=(locale:string)=>locale.startsWith('ko')?'zh-TW|ko':locale.startsWith('ja')?'zh-TW|ja':locale.startsWith('th')?'zh-TW|th':locale.startsWith('fr')?'zh-TW|fr':'zh-TW|en'
const languageTitle=(locale:string)=>locale.startsWith('ko')?'韓文':locale.startsWith('ja')?'日文':locale.startsWith('th')?'泰文':locale.startsWith('fr')?'法文':'英文'
const counters:Record<string,{label:string;values:Record<string,string[]>}>={
 '位':{label:'人數／位',values:{
  'ko-KR':['한 명','두 명','세 명','네 명','다섯 명','여섯 명','일곱 명','여덟 명','아홉 명','열 명'],
  'ja-JP':['1名','2名','3名','4名','5名','6名','7名','8名','9名','10名'],
  'th-TH':['1 คน','2 คน','3 คน','4 คน','5 คน','6 คน','7 คน','8 คน','9 คน','10 คน'],
  'fr-FR':['1 personne','2 personnes','3 personnes','4 personnes','5 personnes','6 personnes','7 personnes','8 personnes','9 personnes','10 personnes'],
  'en':['1 person','2 people','3 people','4 people','5 people','6 people','7 people','8 people','9 people','10 people']}},
 '杯':{label:'飲料／杯',values:{
  'ko-KR':['한 잔','두 잔','세 잔','네 잔','다섯 잔','여섯 잔','일곱 잔','여덟 잔','아홉 잔','열 잔'],
  'ja-JP':['1杯','2杯','3杯','4杯','5杯','6杯','7杯','8杯','9杯','10杯'],
  'th-TH':['1 แก้ว','2 แก้ว','3 แก้ว','4 แก้ว','5 แก้ว','6 แก้ว','7 แก้ว','8 แก้ว','9 แก้ว','10 แก้ว'],
  'fr-FR':['1 verre','2 verres','3 verres','4 verres','5 verres','6 verres','7 verres','8 verres','9 verres','10 verres'],
  'en':['1 cup','2 cups','3 cups','4 cups','5 cups','6 cups','7 cups','8 cups','9 cups','10 cups']}},
 '份':{label:'餐點／份',values:{
  'ko-KR':['한 인분','두 인분','세 인분','네 인분','다섯 인분','여섯 인분','일곱 인분','여덟 인분','아홉 인분','십 인분'],
  'ja-JP':['1人前','2人前','3人前','4人前','5人前','6人前','7人前','8人前','9人前','10人前'],
  'th-TH':['1 ที่','2 ที่','3 ที่','4 ที่','5 ที่','6 ที่','7 ที่','8 ที่','9 ที่','10 ที่'],
  'fr-FR':['1 portion','2 portions','3 portions','4 portions','5 portions','6 portions','7 portions','8 portions','9 portions','10 portions'],
  'en':['1 serving','2 servings','3 servings','4 servings','5 servings','6 servings','7 servings','8 servings','9 servings','10 servings']}},
 '個':{label:'物品／個',values:{
  'ko-KR':['한 개','두 개','세 개','네 개','다섯 개','여섯 개','일곱 개','여덟 개','아홉 개','열 개'],
  'ja-JP':['1つ','2つ','3つ','4つ','5つ','6つ','7つ','8つ','9つ','10個'],
  'th-TH':['1 ชิ้น','2 ชิ้น','3 ชิ้น','4 ชิ้น','5 ชิ้น','6 ชิ้น','7 ชิ้น','8 ชิ้น','9 ชิ้น','10 ชิ้น'],
  'fr-FR':['1 pièce','2 pièces','3 pièces','4 pièces','5 pièces','6 pièces','7 pièces','8 pièces','9 pièces','10 pièces'],
  'en':['1 item','2 items','3 items','4 items','5 items','6 items','7 items','8 items','9 items','10 items']}},
 '瓶':{label:'飲品／瓶',values:{
  'ko-KR':['한 병','두 병','세 병','네 병','다섯 병','여섯 병','일곱 병','여덟 병','아홉 병','열 병'],
  'ja-JP':['1本','2本','3本','4本','5本','6本','7本','8本','9本','10本'],
  'th-TH':['1 ขวด','2 ขวด','3 ขวด','4 ขวด','5 ขวด','6 ขวด','7 ขวด','8 ขวด','9 ขวด','10 ขวด'],
  'fr-FR':['1 bouteille','2 bouteilles','3 bouteilles','4 bouteilles','5 bouteilles','6 bouteilles','7 bouteilles','8 bouteilles','9 bouteilles','10 bouteilles'],
  'en':['1 bottle','2 bottles','3 bottles','4 bottles','5 bottles','6 bottles','7 bottles','8 bottles','9 bottles','10 bottles']}},
 '碗':{label:'食物／碗',values:{'ko-KR':['한 그릇','두 그릇','세 그릇','네 그릇','다섯 그릇','여섯 그릇','일곱 그릇','여덟 그릇','아홉 그릇','열 그릇'],'ja-JP':['1杯','2杯','3杯','4杯','5杯','6杯','7杯','8杯','9杯','10杯'],'th-TH':['1 ชาม','2 ชาม','3 ชาม','4 ชาม','5 ชาม','6 ชาม','7 ชาม','8 ชาม','9 ชาม','10 ชาม'],'fr-FR':['1 bol','2 bols','3 bols','4 bols','5 bols','6 bols','7 bols','8 bols','9 bols','10 bols'],'en':['1 bowl','2 bowls','3 bowls','4 bowls','5 bowls','6 bowls','7 bowls','8 bowls','9 bowls','10 bowls']}},
 '盤':{label:'餐點／盤',values:{'ko-KR':['한 접시','두 접시','세 접시','네 접시','다섯 접시','여섯 접시','일곱 접시','여덟 접시','아홉 접시','열 접시'],'ja-JP':['1皿','2皿','3皿','4皿','5皿','6皿','7皿','8皿','9皿','10皿'],'th-TH':['1 จาน','2 จาน','3 จาน','4 จาน','5 จาน','6 จาน','7 จาน','8 จาน','9 จาน','10 จาน'],'fr-FR':['1 assiette','2 assiettes','3 assiettes','4 assiettes','5 assiettes','6 assiettes','7 assiettes','8 assiettes','9 assiettes','10 assiettes'],'en':['1 plate','2 plates','3 plates','4 plates','5 plates','6 plates','7 plates','8 plates','9 plates','10 plates']}},
 '串':{label:'串物／串',values:{'ko-KR':['한 꼬치','두 꼬치','세 꼬치','네 꼬치','다섯 꼬치','여섯 꼬치','일곱 꼬치','여덟 꼬치','아홉 꼬치','열 꼬치'],'ja-JP':['1本','2本','3本','4本','5本','6本','7本','8本','9本','10本'],'th-TH':['1 ไม้','2 ไม้','3 ไม้','4 ไม้','5 ไม้','6 ไม้','7 ไม้','8 ไม้','9 ไม้','10 ไม้'],'fr-FR':['1 brochette','2 brochettes','3 brochettes','4 brochettes','5 brochettes','6 brochettes','7 brochettes','8 brochettes','9 brochettes','10 brochettes'],'en':['1 skewer','2 skewers','3 skewers','4 skewers','5 skewers','6 skewers','7 skewers','8 skewers','9 skewers','10 skewers']}}
}
const counterValues=(counter:string,locale:string)=>{
 const entry=counters[counter],key=entry.values[locale]?locale:'en'
 return entry.values[key]
}

function TranslateCenter({trip}:{trip:Trip}){
 const [text,setText]=useState('')
 const [translated,setTranslated]=useState('')
 const [loading,setLoading]=useState(false)
 const [msg,setMsg]=useState('')
 const [category,setCategory]=useState('常用')
 const [counter,setCounter]=useState('位')
 const [zoom,setZoom]=useState<{zh:string;translated:string}|null>(null)
 const [favorites,setFavorites]=useState<TranslationFavorite[]>(()=>{try{return JSON.parse(localStorage.getItem(`${TRANSLATION_KEY}:${trip.id}`)||'[]')}catch{return[]}})
 const phrases=phrasebookFor(trip.locale)
 const categories=['常用','餐廳','飯店','交通','購物','醫療','緊急']
 const targetName=languageTitle(trip.locale)
 const translate=async()=>{if(!text.trim())return;setLoading(true);setMsg('');try{const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${encodeURIComponent(localePair(trip.locale))}`);if(!r.ok)throw new Error();const j=await r.json();const out=j.responseData?.translatedText;if(!out)throw new Error();setTranslated(out);setMsg('機器翻譯可能不完全符合敬語，重要場合建議搭配下方常用敬語。')}catch{setMsg('目前無法連線翻譯服務，仍可使用下方離線常用句。')}finally{setLoading(false)}}
 const speak=(value=translated)=>{if(!value)return;const u=new SpeechSynthesisUtterance(value);u.lang=trip.locale;u.rate=.68;speechSynthesis.cancel();speechSynthesis.speak(u)}
 const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value);alert('已複製')}catch{alert('無法複製，請長按文字複製。')}}
 const addFav=(s=text,t=translated)=>{if(!s||!t)return;const next=[...favorites,{id:id(),source:s,translated:t,locale:trip.locale}];setFavorites(next);localStorage.setItem(`${TRANSLATION_KEY}:${trip.id}`,JSON.stringify(next))}
 const removeFav=(fid:string)=>{const next=favorites.filter(f=>f.id!==fid);setFavorites(next);localStorage.setItem(`${TRANSLATION_KEY}:${trip.id}`,JSON.stringify(next))}
 const values=counterValues(counter,trip.locale)
 return <section className="translate-center">
  <article className="card translate-hero"><small>TRAVEL TRANSLATE</small><h2>旅行翻譯</h2><p>目的地：{trip.destination}・只顯示{targetName}禮貌用語</p></article>
  <article className="card translator-card"><label>中文內容<textarea rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="輸入想說的內容"/></label><button className="btn primary full" onClick={translate} disabled={loading}>{loading?<><RefreshCw className="spin" size={18}/>翻譯中</>:<><Languages size={18}/>翻譯成{targetName}</>}</button><div className="translated-box"><small>{targetName}</small><p>{translated||'翻譯結果會顯示在這裡。'}</p><div><button onClick={()=>speak()}>🔊 慢速播放</button><button onClick={()=>copy(translated)}>複製</button><button onClick={()=>addFav()}>☆ 收藏</button></div></div>{msg&&<p className="translation-note">{msg}</p>}</article>
  <article className="card phrase-card"><div className="feature-head"><div><small>POLITE PHRASES</small><h2>敬語常用句</h2></div><span>每個場景 10 句</span></div><div className="phrase-tabs">{categories.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div><div className="phrase-list">{phrases.filter(p=>p.category===category).map(p=><article key={p.zh} onClick={()=>setZoom(p)}><div><b>{p.zh}</b><p>{p.translated}</p></div><div><button onClick={e=>{e.stopPropagation();speak(p.translated)}}>🔊</button><button onClick={e=>{e.stopPropagation();copy(p.translated)}}>複製</button><button onClick={e=>{e.stopPropagation();addFav(p.zh,p.translated)}}>☆</button></div></article>)}</div></article>
  <article className="card quantity-card"><small>ORDER QUICK GUIDE</small><h2>點餐數量速查表</h2><p>依目的地只顯示{targetName}，可點擊放大給店員看。</p><div className="counter-tabs">{Object.entries(counters).map(([key,v])=><button className={counter===key?'active':''} onClick={()=>setCounter(key)} key={key}>{v.label}</button>)}</div><div className="quantity-table-wrap"><table className="quantity-table"><thead><tr><th>中文</th><th>{targetName}</th><th>播放</th></tr></thead><tbody>{values.map((v,i)=><tr key={v} onClick={()=>setZoom({zh:`${i+1}${counter}`,translated:v})}><td>{i+1}{counter}</td><td>{v}</td><td><button onClick={e=>{e.stopPropagation();speak(v)}}>🔊</button></td></tr>)}</tbody></table></div></article>
  <article className="card favorites-card"><small>FAVORITES</small><h2>收藏句子</h2>{favorites.length?favorites.map(f=><div className="favorite-row" key={f.id}><div onClick={()=>setZoom({zh:f.source,translated:f.translated})}><b>{f.source}</b><p>{f.translated}</p></div><button onClick={()=>removeFav(f.id)}><Trash2 size={16}/></button></div>):<p className="empty">還沒有收藏句子。</p>}</article>
  {zoom&&<ModalShell title="給店員看" onClose={()=>setZoom(null)}><div className="phrase-zoom"><small>{zoom.zh}</small><strong>{zoom.translated}</strong><button className="btn primary full" onClick={()=>speak(zoom.translated)}>🔊 慢速播放</button><button className="btn full" onClick={()=>copy(zoom.translated)}>複製文字</button></div></ModalShell>}
 </section>
}

function TransportDetails({item}:{item:Item}){
 const m=item.transportMode||'metro'
 return <div className="transport-card"><div className="transport-title"><span>{modeEmoji[m]}</span><b>{modeLabel[m]}</b>{item.flightNo&&<strong>{item.flightNo}</strong>}{item.line&&<strong>{item.line}</strong>}</div>{(item.from||item.to)&&<div className="route"><span>{item.from||'出發地'}</span><b>→</b><span>{item.to||'抵達地'}</span></div>}<div className="transport-meta">{item.durationMin!=null&&<span><Clock3 size={15}/>{item.durationMin} 分鐘</span>}{item.distanceKm!=null&&<span><Ruler size={15}/>{item.distanceKm} 公里</span>}</div></div>
}

function BottomNav({page,onChange}:{page:AppPage,onChange:(p:AppPage)=>void}){
 const nav:[AppPage,React.ReactNode,string][]=[
  ['home',<House size={20}/>,'首頁'],['itinerary',<CalendarDays size={20}/>,'行程'],
  ['explore',<Compass size={20}/>,'探索'],['wallet',<WalletCards size={20}/>,'錢包'],
  ['translate',<Languages size={20}/>,'翻譯'],['more',<UserRound size={20}/>,'我的']
 ]
 return <nav className="bottom-nav">{nav.map(([p,icon,label])=><button key={p} className={page===p?'active':''} onClick={()=>onChange(p)}>{icon}<span>{label}</span></button>)}</nav>
}

function ComingPage({icon,title,children}:{icon:React.ReactNode,title:string,children:React.ReactNode}){
 return <section className="page-placeholder card"><div className="placeholder-icon">{icon}</div><h2>{title}</h2>{children}</section>
}

function App(){
 const readOnly=!!shared
 const [s,setS]=useState<State>(()=>shared?{version:2,active:shared.id,trips:[shared]}:load())
 const [form,setForm]=useState<Trip|true|null>(null)
 const [itemEditor,setItemEditor]=useState<{dayId:string,item?:Item}|null>(null)
 const [tab,setTab]=useState<string|null>(null)
 const [page,setPage]=useState<AppPage>('home')
 const [flightOpen,setFlightOpen]=useState(false)
 const [weatherOpen,setWeatherOpen]=useState(false)
 const active=s.trips.find(t=>t.id===s.active)||null
 const update=(n:State)=>{setS(n);if(!readOnly)save(n)}
 const updateWallet=(w:WalletData)=>{if(!active)return;const t={...active,wallet:w,updated:Date.now()};update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})}
 useEffect(()=>{if(active&&!active.days.some(d=>d.id===tab))setTab(active.days[0]?.id||null)},[active?.id,active?.days.length])
 const saveTrip=(v:any)=>{
  if(form&&form!==true){
   const p=profile(v.destination);const existing=form;let days=existing.days
   if(v.start!==existing.start||v.end!==existing.end){const fresh=range(v.start,v.end);days=fresh.map((d,i)=>({...d,items:existing.days[i]?.items||[]}))}
   const t={...existing,...v,...p,days,updated:Date.now()};update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})
  }else{const t=makeTrip(v);update({...s,active:t.id,trips:[...s.trips,t]});setTab(t.days[0]?.id||null);setPage('home')}
  setForm(null)
 }
 const remove=(t:Trip)=>{if(confirm(`確定刪除「${t.name}」？`)){const trips=s.trips.filter(x=>x.id!==t.id);update({...s,trips,active:s.active===t.id?(trips[0]?.id||null):s.active})}}
 const duplicate=(t:Trip)=>{const c={...structuredClone(t),id:id(),name:t.name+'（複製）',created:Date.now(),updated:Date.now()};update({...s,active:c.id,trips:[...s.trips,c]});setTab(c.days[0]?.id||null)}
 const addToCurrentDay=(x:Item)=>{if(!active)return;const target=(active.days.find(d=>d.id===tab)||active.days[0]);if(!target)return;const t={...active,days:active.days.map(d=>d.id===target.id?{...d,items:[...d.items,x]}:d),updated:Date.now()};update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)});alert(`已加入 ${target.title}`)}
 const saveItem=(x:Item)=>{
  if(!active||!itemEditor)return
  const t={...active,days:active.days.map(d=>d.id!==itemEditor.dayId?d:{...d,items:itemEditor.item?d.items.map(i=>i.id===x.id?x:i):[...d.items,x]}),updated:Date.now()}
  update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)});setItemEditor(null)
 }
 const itemAction=(dayId:string,itemId:string,action:'delete'|'copy'|'up'|'down')=>{
  if(!active)return
  const t={...active,days:active.days.map(d=>{
   if(d.id!==dayId)return d
   const arr=[...d.items],idx=arr.findIndex(i=>i.id===itemId);if(idx<0)return d
   if(action==='delete'){if(!confirm('確定刪除這個行程？'))return d;arr.splice(idx,1)}
   if(action==='copy'){arr.splice(idx+1,0,{...structuredClone(arr[idx]),id:id(),title:arr[idx].title+'（複製）'})}
   if(action==='up'&&idx>0)[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]
   if(action==='down'&&idx<arr.length-1)[arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]
   return{...d,items:arr}
  }),updated:Date.now()}
  update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)})
 }
 const toggle=(day:string,it:string,cid:string)=>{
  if(!active||readOnly)return
  const t={...active,days:active.days.map(d=>d.id!==day?d:{...d,items:d.items.map(i=>i.id!==it?i:{...i,checks:i.checks?.map(c=>c.id===cid?{...c,done:!c.done}:c)})})}
  update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)})
 }
 const share=async()=>{if(!active)return;const u=new URL(location.origin+location.pathname);u.searchParams.set('trip',b64(JSON.stringify(active)));if(navigator.share)await navigator.share({title:active.name,text:`查看「${active.name}」行程`,url:u.toString()});else{await navigator.clipboard.writeText(u.toString());alert('分享連結已複製')}}
 const legacy=()=>{try{const old=JSON.parse(localStorage.getItem(oldKey)||'null');if(!old?.trips?.length)return alert('找不到舊版資料');const trips=old.trips.map((o:any)=>{const t=makeTrip({name:o.tripName,destination:o.destination,start:o.start,end:o.end});t.id=String(o.tripId||id());t.currency=o.currency||t.currency;t.language=o.langName||t.language;t.days=(o.days||[]).map((d:any)=>({id:String(d.id||id()),date:d.date,title:d.title,items:(d.items||[]).map((i:any)=>({id:String(i.id||id()),type:i.type==='transport'?'transport':'place',start:i.startTime||'',end:i.endTime||'',title:i.place||'',note:i.note||''}))}));return t});update({version:2,active:trips[0].id,trips});setTab(trips[0].days[0]?.id||null);alert(`已匯入 ${trips.length} 個旅行`)}catch{alert('匯入失敗')}}

 if(active){
  const current=active.days.find(d=>d.id===tab)||active.days[0]
  const idx=active.days.findIndex(d=>d.id===current?.id)
  const totalDuration=(current?.items||[]).reduce((a,i)=>a+(i.durationMin||0),0)
  const transportCount=(current?.items||[]).filter(i=>i.type==='transport'||i.type==='flight').length
  const daysUntil=Math.ceil((new Date(active.start+'T12:00:00').getTime()-Date.now())/86400000)
  const todayKey=new Date().toLocaleDateString('en-CA')
  const todayDay=active.days.find(d=>d.date===todayKey)||active.days.find(d=>d.date>=todayKey)||active.days[0]
  const todayIndex=Math.max(0,active.days.findIndex(d=>d.id===todayDay?.id))
  const allItems=active.days.flatMap(d=>d.items)
  const checkedCount=allItems.flatMap(i=>i.checks||[]).filter(c=>c.done).length
  const checkCount=allItems.flatMap(i=>i.checks||[]).length
  const dateProgress=Date.now()<new Date(active.start+'T00:00:00').getTime()?0:Date.now()>new Date(active.end+'T23:59:59').getTime()?100:Math.round(((Date.now()-new Date(active.start+'T00:00:00').getTime())/(new Date(active.end+'T23:59:59').getTime()-new Date(active.start+'T00:00:00').getTime()))*100)
  const completion=checkCount?Math.round(checkedCount/checkCount*100):dateProgress
  const nextFlight=allItems.find(i=>i.type==='flight')

  const itinerary=<>
   <nav className="day-tabs" aria-label="每日行程分頁">{active.days.map((d,i)=><button key={d.id} className={current?.id===d.id?'active':''} onClick={()=>setTab(d.id)}><small>{d.date.slice(5)}</small><b>Day {i+1}</b></button>)}</nav>
   {current&&<section className="card day single-day"><div className="day-head"><div><small>{new Date(current.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'long'})}</small><h2>{current.title}・{current.date.slice(5)}</h2></div>{!readOnly&&<button className="icon" onClick={()=>setItemEditor({dayId:current.id})}><Plus/></button>}</div>
    <div className="day-summary"><span>📌 {current.items.length} 個安排</span><span>🚉 {transportCount} 段交通</span><span>⏱ {totalDuration} 分鐘通勤</span></div>
    <div className="timeline">{current.items.length?current.items.map((i,itemIndex)=><article className={`item ${i.type}`} key={i.id}><div className="time">{i.start}<span>～</span>{i.end}</div><div className="body"><div className="item-head"><div><small>{typeName[i.type].toUpperCase()}</small><h3>{i.title}</h3></div>{!readOnly&&<button className="mini-more" aria-label="編輯行程"><MoreHorizontal size={18}/></button>}</div>{(i.type==='transport'||i.type==='flight')&&<TransportDetails item={i}/>} {i.note&&i.type!=='note'&&<p>{i.note}</p>}{i.checks&&<div className="checks"><div className="note-heading"><StickyNote size={17}/>便條待辦</div>{i.checks.map(c=><label key={c.id}><input disabled={readOnly} type="checkbox" checked={c.done} onChange={()=>toggle(current.id,i.id,c.id)}/><span>{c.text}</span></label>)}</div>}
    {!readOnly&&<div className="item-actions"><button onClick={()=>setItemEditor({dayId:current.id,item:i})}><Pencil size={15}/>編輯</button><button onClick={()=>itemAction(current.id,i.id,'copy')}><Copy size={15}/>複製</button><button disabled={itemIndex===0} onClick={()=>itemAction(current.id,i.id,'up')}><ArrowUp size={15}/></button><button disabled={itemIndex===current.items.length-1} onClick={()=>itemAction(current.id,i.id,'down')}><ArrowDown size={15}/></button><button className="danger" onClick={()=>itemAction(current.id,i.id,'delete')}><Trash2 size={15}/></button></div>}</div></article>):<p className="empty">這一天還沒有行程，按右上角＋加入。</p>}</div>
    <div className="day-pager"><button className="btn" disabled={idx<=0} onClick={()=>setTab(active.days[idx-1]?.id)}><ChevronLeft size={18}/>前一天</button><span>{idx+1} / {active.days.length}</span><button className="btn" disabled={idx>=active.days.length-1} onClick={()=>setTab(active.days[idx+1]?.id)}>後一天<ChevronRight size={18}/></button></div>
   </section>}
  </>

  return <div className={`app theme-${active.theme}`}>
   <header className="top"><button className="icon" onClick={()=>update({...s,active:null})}><ArrowLeft/></button><div><small>{readOnly?'親友唯讀行程':'旅行控制中心'}</small><h1>{active.name}</h1></div>{!readOnly&&<button className="icon" onClick={()=>setForm(active)}><Palette size={18}/></button>}</header>
   <main className="content trip page-with-nav">
    {page==='home'&&<>
     <section className="cover" style={active.cover?{backgroundImage:`url(${active.cover})`}:{}}><div><span>{active.country}</span><h2>{active.destination}</h2><p>{active.start} ～ {active.end}</p><b>{active.currency}・{active.language}</b></div></section>
     <section className="control-grid">
      <article className="card control-card hero-control"><small>NEXT TRIP</small><h3>{daysUntil>0?`距離出發還有 ${daysUntil} 天`:daysUntil===0?'今天出發':'旅程進行中／已完成'}</h3><div className="progress"><i style={{width:`${Math.min(100,Math.max(4,completion))}%`}}/></div><span>旅行進度 {completion}%・共 {active.days.length} Days</span></article>
      <article className="card control-card today-card"><CalendarDays size={25}/><small>TODAY PLAN</small><h3>{todayDay?`Day ${todayIndex+1}・${todayDay.date.slice(5)}`:'尚未建立日期'}</h3><span>{todayDay?.items.length||0} 個安排</span><button className="inline-link" onClick={()=>{setTab(todayDay?.id||active.days[0]?.id);setPage('itinerary')}}>查看今日行程 →</button></article>
      <article className="card control-card"><Plane size={25}/><small>航班資訊</small><h3>{nextFlight?.flightNo||'尚未加入航班'}</h3><span>{nextFlight?`${nextFlight.start} → ${nextFlight.end}`:'可先手動建立航班卡'}</span><button className="inline-link" onClick={()=>setFlightOpen(true)}>開啟航班中心 →</button></article>
      <article className="card control-card"><WalletCards size={25}/><small>旅行錢包</small><h3>{active.currency}</h3><span>即時匯率、預算與旅伴分帳</span><button className="inline-link" onClick={()=>setPage('wallet')}>開啟旅行錢包 →</button></article>
     </section>
     <Weather trip={active}/>

     {!readOnly&&<div className="quick"><button className="btn primary" onClick={share}><Share2 size={18}/>分享行程</button><button className="btn yellow" onClick={()=>window.print()}><FileDown size={18}/>列印／PDF</button></div>}
    </>}
    {page==='itinerary'&&itinerary}
    {page==='explore'&&<ExploreCenter trip={active} onAdd={addToCurrentDay}/>}
    {page==='wallet'&&<WalletCenter trip={active} onChange={updateWallet}/>}
    {page==='translate'&&<TranslateCenter trip={active}/>}
    {page==='more'&&<section className="tools-grid"><button className="card tool-card" onClick={()=>setForm(active)}><Palette/><b>主題風格</b><span>10 種官方主題</span></button><button className="card tool-card" onClick={()=>window.print()}><FileDown/><b>旅行手冊</b><span>列印／PDF</span></button><button className="card tool-card" onClick={()=>setFlightOpen(true)}><Plane/><b>航班中心</b><span>輸入航班號碼查詢</span></button><button className="card tool-card" onClick={()=>setWeatherOpen(true)}><CloudSun/><b>天氣中心</b><span>七天天氣與手動更新</span></button></section>}
   </main>
   {weatherOpen&&<ModalShell title="天氣中心" onClose={()=>setWeatherOpen(false)}><Weather trip={active}/></ModalShell>}
   {flightOpen&&<ModalShell title="航班中心" onClose={()=>setFlightOpen(false)}><FlightCenter trip={active} onAdd={x=>{addToCurrentDay(x);setFlightOpen(false)}}/></ModalShell>}
   <BottomNav page={page} onChange={setPage}/>
   {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
   {itemEditor&&<ItemForm initial={itemEditor.item} onSave={saveItem} onClose={()=>setItemEditor(null)}/>}
  </div>
 }

 return <div className="app theme-summer"><header className="dash-head"><span className="stamp">ULTIMATE 2.3.0</span><h1>我的旅行手帳</h1><p>把每一次出發，收進自己的旅行書櫃。</p></header><main className="content"><div className="section"><div><small>MY JOURNEYS</small><h2>旅行書櫃</h2></div><button className="btn primary" onClick={()=>setForm(true)}><Plus size={18}/>新增旅行</button></div>
 {s.trips.length?<div className="grid">{s.trips.map(t=><article className={`trip-card theme-${t.theme}`} key={t.id}><button className="trip-cover" style={t.cover?{backgroundImage:`url(${t.cover})`}:{}} onClick={()=>{update({...s,active:t.id});setTab(t.days[0]?.id||null);setPage('home')}}><div><small>{t.country}</small><b>{t.destination}</b><span>{t.start} ～ {t.end}</span></div></button><div className="trip-info"><div><h3>{t.name}</h3><p>{t.currency}・{t.language}</p><small className="theme-name">{themes.find(x=>x.id===t.theme)?.name}</small></div><div className="icons"><button onClick={()=>setForm(t)}><Pencil size={17}/></button><button onClick={()=>duplicate(t)}><Copy size={17}/></button><button onClick={()=>remove(t)}><Trash2 size={17}/></button></div></div></article>)}</div>:<section className="card empty-home"><div>🧳</div><h2>建立第一本旅行手帳</h2><p>釜山、日本、泰國或任何目的地，都能建立獨立行程。</p><button className="btn primary" onClick={()=>setForm(true)}><Plus/>新增旅行</button><button className="btn" onClick={legacy}><Upload size={17}/>匯入舊版</button></section>}</main>
 {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
 </div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))
