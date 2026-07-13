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
type Trip={
 id:string,name:string,destination:string,country:string,currency:string,language:string,locale:string,
 start:string,end:string,lat:number,lon:number,cover?:string,days:Day[],theme:ThemeId,created:number,updated:number
}
type State={version:2,active:string|null,trips:Trip[]}
type WeatherDay={date:string,code:number,max:number,min:number,rain:number}
type PlaceResult={place_id:string;display_name:string;lat:string;lon:string}
type FlightResult={flightNo:string;airline?:string;status?:string;departure:{airport?:string;iata?:string;terminal?:string;gate?:string;scheduled?:string};arrival:{airport?:string;iata?:string;terminal?:string;gate?:string;baggage?:string;scheduled?:string};aircraft?:string;durationMin?:number;source?:string}

const KEY='travel-planner-ultimate-v2'
const WEATHER_KEY='travel-planner-weather-v22'
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
const makeTrip=(v:any):Trip=>{const p=profile(v.destination);return{id:id(),name:v.name||`${v.destination}旅行`,destination:v.destination,...p,start:v.start,end:v.end,cover:v.cover,theme:v.theme||'summer',days:range(v.start,v.end),created:Date.now(),updated:Date.now()}}
const normalizeTrip=(t:any):Trip=>({...t,theme:(themes.some(x=>x.id===t.theme)?t.theme:'summer') as ThemeId,days:(t.days||[]).map((d:any)=>({...d,items:(d.items||[]).map((i:any)=>({...i,transportMode:i.transportMode||undefined}))}))})
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
  {!compact&&<div className="weather-row">{days.map(d=><div className="weather-day" key={d.date}><small>{new Date(d.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'short'})}</small><b>{wicon(d.code)}</b><span>{d.max}°</span><em>{d.min}°</em><small>雨 {d.rain}%</small></div>)}</div>}
  <p className="weather-status">{offline?'目前離線，使用上次資料・':''}{updated?`更新於 ${new Date(updated).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}`:'正在整理天氣資訊…'}</p>
 </section>
}


const stations=[
 ['釜山','1號線','釜山站','부산역','Busan Station'],['釜山','1號線','南浦','남포','Nampo'],['釜山','1號線','札嘎其','자갈치','Jagalchi'],['釜山','1號線','西面','서면','Seomyeon'],['釜山','2號線','海雲台','해운대','Haeundae'],['釜山','2號線','冬柏','동백','Dongbaek'],['釜山','2號線','廣安','광안','Gwangan'],['釜山','2號線','Centum City','센텀시티','Centum City'],['釜山','東海線','松亭','송정','Songjeong'],['釜山','東海線','機張','기장','Gijang'],['釜山','金海輕軌','金海機場','공항','Gimhae Airport'],['首爾','2號線','弘大入口','홍대입구','Hongik Univ.'],['首爾','4號線','明洞','명동','Myeong-dong'],['首爾','2號線','江南','강남','Gangnam'],['東京','JR','東京','東京','Tokyo'],['東京','JR','新宿','新宿','Shinjuku'],['東京','JR','澀谷','渋谷','Shibuya'],['東京','銀座線','淺草','浅草','Asakusa'],['大阪','御堂筋線','梅田','梅田','Umeda'],['大阪','御堂筋線','難波','なんば','Namba'],['京都','JR','京都','京都','Kyoto']
] as const
const stationSearch=(q:string)=>{const k=q.trim().toLowerCase();return k?stations.filter(s=>s.join(' ').toLowerCase().includes(k)).slice(0,20):[]}
const gmap=(q:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const nmap=(q:string)=>`https://map.naver.com/p/search/${encodeURIComponent(q)}`
const ftime=(s?:string)=>s?new Date(s).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'

function FlightCenter({trip,onAdd}:{trip:Trip,onAdd:(x:Item)=>void}){
 const [no,setNo]=useState(''),[date,setDate]=useState(trip.start),[loading,setLoading]=useState(false),[msg,setMsg]=useState(''),[result,setResult]=useState<FlightResult|null>(null)
 const search=async()=>{const f=no.trim().toUpperCase();if(!f){setMsg('請先輸入航班號碼。');return}setLoading(true);setMsg('');setResult(null);try{const r=await fetch(`/.netlify/functions/flight?flight=${encodeURIComponent(f)}&date=${encodeURIComponent(date)}`);const j=await r.json();if(!r.ok)throw new Error(j.message||'查詢失敗');setResult(j.flight)}catch(e:any){setMsg(e?.message||'目前無法取得航班資料，可改用手動建立。')}finally{setLoading(false)}}
 const add=()=>{if(!result)return;const d=result.departure,a=result.arrival;onAdd({id:id(),type:'flight',start:(d.scheduled||'').slice(11,16)||'00:00',end:(a.scheduled||'').slice(11,16)||'00:00',title:`${result.flightNo} ${result.airline||'航班'}`,flightNo:result.flightNo,transportMode:'flight',from:[d.airport,d.iata,d.terminal&&`T${d.terminal}`].filter(Boolean).join(' '),to:[a.airport,a.iata,a.terminal&&`T${a.terminal}`].filter(Boolean).join(' '),durationMin:result.durationMin,note:[result.status&&`狀態：${result.status}`,result.aircraft&&`機型：${result.aircraft}`,d.gate&&`出發 Gate：${d.gate}`,a.baggage&&`行李轉盤：${a.baggage}`].filter(Boolean).join('\n')})}
 return <section className="flight-center"><div className="card feature-card"><div className="feature-head"><div><small>FLIGHT SEARCH</small><h2>航班中心</h2></div><Plane size={30}/></div><p>輸入航班號與搭乘日期，查詢後可直接加入目前 Day。</p><div className="flight-fields"><label>航班號<input value={no} onChange={e=>setNo(e.target.value.toUpperCase())} placeholder="例如：KE2086"/></label><label>搭乘日期<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><button className="btn primary full" onClick={search} disabled={loading}>{loading?<><RefreshCw className="spin" size={18}/>正在查詢</>:<><Search size={18}/>查詢航班</>}</button>{msg&&<div className="service-message">{msg}<small>即時航班需在 Netlify 設定 AVIATIONSTACK_API_KEY；尚未設定時仍可在行程中手動新增。</small></div>}</div>{result&&<article className="card flight-result"><div className="flight-result-head"><div><small>{result.airline||'AIRLINE'}</small><h2>{result.flightNo}</h2></div><span>{result.status||'已取得資料'}</span></div><div className="flight-route"><div><b>{result.departure.iata||'—'}</b><span>{result.departure.airport||'出發機場'}</span><strong>{ftime(result.departure.scheduled)}</strong><small>{result.departure.terminal?`Terminal ${result.departure.terminal}`:''}</small></div><Plane size={30}/><div><b>{result.arrival.iata||'—'}</b><span>{result.arrival.airport||'抵達機場'}</span><strong>{ftime(result.arrival.scheduled)}</strong><small>{result.arrival.terminal?`Terminal ${result.arrival.terminal}`:''}</small></div></div><button className="btn primary full" onClick={add}><Plus size={18}/>加入目前 Day</button></article>}</section>
}

function ExploreCenter({trip,onAdd}:{trip:Trip,onAdd:(x:Item)=>void}){
 const [q,setQ]=useState(''),[loading,setLoading]=useState(false),[places,setPlaces]=useState<PlaceResult[]>([]),[msg,setMsg]=useState(''),[sq,setSq]=useState('')
 const ss=useMemo(()=>stationSearch(sq),[sq])
 const search=async()=>{if(!q.trim()){setMsg('請輸入地點、店名或地址。');return}setLoading(true);setMsg('');try{const full=`${q} ${trip.destination}`;const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=zh-TW,zh,en,ko,ja&q=${encodeURIComponent(full)}`);if(!r.ok)throw new Error();const j=await r.json();setPlaces(j);if(!j.length)setMsg('免費地圖資料沒有找到結果，可改用 Google Maps 或 Naver Map。')}catch{setMsg('地點搜尋暫時無法使用，請改用外部地圖。')}finally{setLoading(false)}}
 return <section className="explore-center"><div className="card feature-card"><div className="feature-head"><div><small>PLACE SEARCH</small><h2>地點探索</h2></div><MapPin size={30}/></div><div className="search-row"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋景點、餐廳、住宿或地址"/><button className="icon" onClick={search}>{loading?<RefreshCw className="spin" size={18}/>:<Search size={18}/>}</button></div><div className="external"><a className="btn" target="_blank" rel="noreferrer" href={gmap(`${q} ${trip.destination}`)}>Google Maps</a><a className="btn" target="_blank" rel="noreferrer" href={nmap(`${q} ${trip.destination}`)}>Naver Map</a></div>{msg&&<p className="service-message">{msg}</p>}</div><div className="place-list">{places.map(p=><article className="card place-result" key={p.place_id}><div><h3>{p.display_name.split(',')[0]}</h3><p>{p.display_name}</p></div><div><a target="_blank" rel="noreferrer" href={gmap(p.display_name)}>地圖</a><button onClick={()=>onAdd({id:id(),type:'place',start:'09:00',end:'10:00',title:q||p.display_name.split(',')[0],note:p.display_name})}>加入 Day</button></div></article>)}</div><div className="card feature-card"><div className="feature-head"><div><small>TRANSIT STATION</small><h2>地鐵站搜尋</h2></div><span className="bigemoji">🚇</span></div><input value={sq} onChange={e=>setSq(e.target.value)} placeholder="例如：海雲台、西面、梅田、難波"/><div className="station-list">{ss.map(s=><button key={s.join('-')} onClick={()=>onAdd({id:id(),type:'transport',start:'09:00',end:'09:30',title:`前往${s[2]}站`,transportMode:'metro',to:`${s[2]} ${s[3]} ${s[4]}`,line:`${s[0]} ${s[1]}`})}><span><b>{s[2]}</b><small>{s[3]}・{s[4]}</small></span><em>{s[0]}・{s[1]}</em><Plus size={17}/></button>)}</div></div></section>
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
 const active=s.trips.find(t=>t.id===s.active)||null
 const update=(n:State)=>{setS(n);if(!readOnly)save(n)}
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
  const completion=active.days.flatMap(d=>d.items).length?Math.round(active.days.flatMap(d=>d.items).filter(i=>i.checks?.length?i.checks.every(c=>c.done):false).length/active.days.flatMap(d=>d.items).length*100):0

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
      <article className="card control-card hero-control"><small>NEXT TRIP</small><h3>{daysUntil>0?`距離出發還有 ${daysUntil} 天`:daysUntil===0?'今天出發':'旅程進行中／已完成'}</h3><div className="progress"><i style={{width:`${Math.min(100,Math.max(8,completion))}%`}}/></div><span>旅行進度 {completion}%</span></article>
      <Weather trip={active} compact/>
      <article className="card control-card"><Plane size={25}/><small>航班資訊</small><h3>{active.days.flatMap(d=>d.items).find(i=>i.type==='flight')?.flightNo||'尚未加入航班'}</h3><span>可在行程新增「飛機」卡片</span></article>
      <article className="card control-card"><WalletCards size={25}/><small>旅行錢包</small><h3>{active.currency}</h3><span>匯率與分帳將於 v2.3 啟用</span></article>
     </section>
     {!readOnly&&<div className="quick"><button className="btn primary" onClick={share}><Share2 size={18}/>分享行程</button><button className="btn yellow" onClick={()=>window.print()}><FileDown size={18}/>列印／PDF</button></div>}
    </>}
    {page==='itinerary'&&itinerary}
    {page==='explore'&&<ExploreCenter trip={active} onAdd={addToCurrentDay}/>}
    {page==='wallet'&&<ComingPage icon={<WalletCards size={40}/>} title="旅行錢包"><p>即時匯率、雙向換算、旅伴分帳與預算管理預定於 v2.3 啟用。</p></ComingPage>}
    {page==='translate'&&<ComingPage icon={<Languages size={40}/>} title="旅行翻譯"><p>敬語翻譯、慢速播放與點餐速查預定於 v2.3 啟用。</p></ComingPage>}
    {page==='more'&&<section className="tools-grid"><button className="card tool-card" onClick={()=>setForm(active)}><Palette/><b>主題風格</b><span>10 種官方主題</span></button><button className="card tool-card" onClick={()=>window.print()}><FileDown/><b>旅行手冊</b><span>列印／PDF</span></button><button className="card tool-card" onClick={()=>setFlightOpen(true)}><Plane/><b>航班中心</b><span>輸入航班號碼查詢</span></button><button className="card tool-card"><CloudSun/><b>天氣中心</b><span>自動與手動更新</span></button></section>}
   </main>
   {flightOpen&&<ModalShell title="航班中心" onClose={()=>setFlightOpen(false)}><FlightCenter trip={active} onAdd={x=>{addToCurrentDay(x);setFlightOpen(false)}}/></ModalShell>}
   <BottomNav page={page} onChange={setPage}/>
   {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
   {itemEditor&&<ItemForm initial={itemEditor.item} onSave={saveItem} onClose={()=>setItemEditor(null)}/>}
  </div>
 }

 return <div className="app theme-summer"><header className="dash-head"><span className="stamp">ULTIMATE 2.2</span><h1>我的旅行手帳</h1><p>把每一次出發，收進自己的旅行書櫃。</p></header><main className="content"><div className="section"><div><small>MY JOURNEYS</small><h2>旅行書櫃</h2></div><button className="btn primary" onClick={()=>setForm(true)}><Plus size={18}/>新增旅行</button></div>
 {s.trips.length?<div className="grid">{s.trips.map(t=><article className={`trip-card theme-${t.theme}`} key={t.id}><button className="trip-cover" style={t.cover?{backgroundImage:`url(${t.cover})`}:{}} onClick={()=>{update({...s,active:t.id});setTab(t.days[0]?.id||null);setPage('home')}}><div><small>{t.country}</small><b>{t.destination}</b><span>{t.start} ～ {t.end}</span></div></button><div className="trip-info"><div><h3>{t.name}</h3><p>{t.currency}・{t.language}</p><small className="theme-name">{themes.find(x=>x.id===t.theme)?.name}</small></div><div className="icons"><button onClick={()=>setForm(t)}><Pencil size={17}/></button><button onClick={()=>duplicate(t)}><Copy size={17}/></button><button onClick={()=>remove(t)}><Trash2 size={17}/></button></div></div></article>)}</div>:<section className="card empty-home"><div>🧳</div><h2>建立第一本旅行手帳</h2><p>釜山、日本、泰國或任何目的地，都能建立獨立行程。</p><button className="btn primary" onClick={()=>setForm(true)}><Plus/>新增旅行</button><button className="btn" onClick={legacy}><Upload size={17}/>匯入舊版</button></section>}</main>
 {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
 </div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))
