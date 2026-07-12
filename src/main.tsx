import React,{useEffect,useMemo,useState} from 'react'
import ReactDOM from 'react-dom/client'
import {Plus,Pencil,Copy,Trash2,ArrowLeft,Share2,FileDown,Upload,Palette,MapPin,Plane,TrainFront,Bus,Car,Footprints,Ship,Clock3,Ruler,StickyNote,ChevronLeft,ChevronRight} from 'lucide-react'
import './styles.css'

type TType='place'|'meal'|'hotel'|'transport'|'flight'|'note'
type TransportMode='walk'|'metro'|'bus'|'taxi'|'car'|'train'|'flight'|'ferry'
type ThemeId='summer'|'journal'|'sakura'|'forest'|'coast'|'lavender'
type Item={id:string,type:TType,start:string,end:string,title:string,note?:string,checks?:{id:string,text:string,done:boolean}[],transportMode?:TransportMode,from?:string,to?:string,durationMin?:number,distanceKm?:number,line?:string,flightNo?:string}
type Day={id:string,date:string,title:string,items:Item[]}
type Trip={id:string,name:string,destination:string,country:string,currency:string,language:string,locale:string,start:string,end:string,lat:number,lon:number,cover?:string,days:Day[],theme:ThemeId,created:number,updated:number}
type State={version:2,active:string|null,trips:Trip[]}
const KEY='travel-planner-ultimate-v2'
const oldKey='travelPlannerUltimatePortfolioV15'
const id=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`
const themes:{id:ThemeId;name:string;desc:string;colors:string[]}[]=[
 {id:'summer',name:'夏日陽光',desc:'奶油黃・湖水綠・暖橘',colors:['#f6cf67','#8fc7b8','#dc8b72']},
 {id:'journal',name:'復古手帳',desc:'米白・咖啡・芥末黃',colors:['#e7d8bd','#8c6f59','#c79b43']},
 {id:'sakura',name:'櫻花旅行',desc:'櫻花粉・灰紫・奶油白',colors:['#e6a8b8','#9d90ad','#fff4ec']},
 {id:'forest',name:'森林療癒',desc:'鼠尾草綠・森林綠・米色',colors:['#9aae8e','#4f6658','#e9dfc9']},
 {id:'coast',name:'海岸假期',desc:'海藍・沙灘米・珊瑚色',colors:['#82b5c4','#e7d2a8','#d9856f']},
 {id:'lavender',name:'灰紫信紙',desc:'灰紫・奶茶・霧白',colors:['#8f849b','#b8a994','#f2efea']},
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

function ThemePicker({value,onChange}:{value:ThemeId,onChange:(t:ThemeId)=>void}){
 return <div className="theme-grid">{themes.map(t=><button type="button" key={t.id} className={`theme-option ${value===t.id?'selected':''}`} onClick={()=>onChange(t.id)}><span className="theme-dots">{t.colors.map(c=><i key={c} style={{background:c}}/>)}</span><b>{t.name}</b><small>{t.desc}</small></button>)}</div>
}
function Form({trip,onSave,onClose}:{trip?:Trip,onSave:(v:any)=>void,onClose:()=>void}){
 const [v,setV]=useState({name:trip?.name||'',destination:trip?.destination||'',start:trip?.start||'',end:trip?.end||'',cover:trip?.cover||'',theme:trip?.theme||'summer' as ThemeId})
 const cover=(f?:File)=>{if(!f)return;const r=new FileReader();r.onload=()=>setV({...v,cover:String(r.result)});r.readAsDataURL(f)}
 return <div className="shade"><form className="modal card" onSubmit={e=>{e.preventDefault();onSave(v)}}>
  <span className="tape">JOURNEY</span><h2>{trip?'編輯旅行':'新增旅行'}</h2>
  <label>旅行名稱<input value={v.name} onChange={e=>setV({...v,name:e.target.value})}/></label>
  <label>目的地<input required value={v.destination} onChange={e=>setV({...v,destination:e.target.value})} placeholder="Busan、Tokyo"/></label>
  <div className="two"><label>出發<input required type="date" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></label><label>回程<input required type="date" min={v.start} value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></label></div>
  <label>封面照片<input type="file" accept="image/*" onChange={e=>cover(e.target.files?.[0])}/></label>
  {v.cover&&<img className="preview" src={v.cover}/>}<div className="picker-label"><Palette size={18}/>選擇旅行主題</div><ThemePicker value={v.theme} onChange={theme=>setV({...v,theme})}/>
  <div className="actions"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">儲存</button></div>
 </form></div>
}
function ItemForm({onSave,onClose}:{onSave:(x:Item)=>void,onClose:()=>void}){
 const [v,setV]=useState({type:'place' as TType,start:'09:00',end:'10:00',title:'',note:'',transportMode:'metro' as TransportMode,from:'',to:'',durationMin:'',distanceKm:'',line:'',flightNo:''})
 const isTransport=v.type==='transport'||v.type==='flight'
 return <div className="shade"><form className="modal card" onSubmit={e=>{e.preventDefault();onSave({id:id(),type:v.type,start:v.start,end:v.end,title:v.title,note:v.note,transportMode:isTransport?(v.type==='flight'?'flight':v.transportMode):undefined,from:isTransport?v.from:undefined,to:isTransport?v.to:undefined,durationMin:v.durationMin?Number(v.durationMin):undefined,distanceKm:v.distanceKm?Number(v.distanceKm):undefined,line:isTransport?v.line:undefined,flightNo:v.type==='flight'?v.flightNo:undefined,checks:v.type==='note'?v.note.split('\n').filter(Boolean).map(text=>({id:id(),text,done:false})):undefined})}}>
  <span className="tape">TIMELINE</span><h2>加入時間軸</h2>
  <label>類型<select value={v.type} onChange={e=>setV({...v,type:e.target.value as TType})}><option value="place">景點</option><option value="meal">餐廳／甜點</option><option value="hotel">住宿</option><option value="transport">交通</option><option value="flight">飛機</option><option value="note">便條紙</option></select></label>
  <div className="two"><label>開始<input type="time" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></label><label>結束<input type="time" value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></label></div>
  {v.type==='transport'&&<label>交通方式<select value={v.transportMode} onChange={e=>setV({...v,transportMode:e.target.value as TransportMode})}>{Object.entries(modeLabel).filter(([k])=>k!=='flight').map(([k,label])=><option key={k} value={k}>{modeEmoji[k as TransportMode]} {label}</option>)}</select></label>}
  {isTransport&&<><div className="two"><label>出發地<input value={v.from} onChange={e=>setV({...v,from:e.target.value})} placeholder="例如：海雲台站"/></label><label>抵達地<input value={v.to} onChange={e=>setV({...v,to:e.target.value})} placeholder="例如：西面站"/></label></div><div className="two"><label>通勤時間（分鐘）<input type="number" min="0" value={v.durationMin} onChange={e=>setV({...v,durationMin:e.target.value})} placeholder="例如：25"/></label><label>距離（公里）<input type="number" min="0" step="0.1" value={v.distanceKm} onChange={e=>setV({...v,distanceKm:e.target.value})} placeholder="例如：8.5"/></label></div><label>{v.type==='flight'?'航班號碼':'路線／車次'}<input value={v.type==='flight'?v.flightNo:v.line} onChange={e=>v.type==='flight'?setV({...v,flightNo:e.target.value}):setV({...v,line:e.target.value})} placeholder={v.type==='flight'?'例如：KE2086':'例如：2號線、KTX 105'}/></label></>}
  <label>標題<input required value={v.title} onChange={e=>setV({...v,title:e.target.value})} placeholder={v.type==='note'?'例如：機場待辦':v.type==='transport'?'例如：前往飯店':'輸入行程名稱'}/></label>
  <label>{v.type==='note'?'待辦內容（每行一項）':'備註'}<textarea rows={5} value={v.note} onChange={e=>setV({...v,note:e.target.value})}/></label>
  <div className="actions"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">加入</button></div>
 </form></div>
}
function Weather({trip}:{trip:Trip}){
 const [days,setDays]=useState<any[]>([])
 useEffect(()=>{fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trip.lat}&longitude=${trip.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`).then(r=>r.json()).then(j=>setDays(j.daily.time.map((date:string,i:number)=>({date,code:j.daily.weather_code[i],max:Math.round(j.daily.temperature_2m_max[i]),min:Math.round(j.daily.temperature_2m_min[i]),rain:j.daily.precipitation_probability_max[i]})))).catch(()=>setDays([]))},[trip.id])
 return <section className="card weather"><small>WEEKLY WEATHER</small><h3>{trip.destination} 一週天氣</h3><div className="weather-row">{days.map(d=><div className="weather-day" key={d.date}><small>{new Date(d.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'short'})}</small><b>{wicon(d.code)}</b><span>{d.max}°</span><em>{d.min}°</em><small>雨 {d.rain}%</small></div>)}</div></section>
}
function TransportDetails({item}:{item:Item}){
 const m=item.transportMode||'metro';return <div className="transport-card"><div className="transport-title"><span>{modeEmoji[m]}</span><b>{modeLabel[m]}</b>{item.flightNo&&<strong>{item.flightNo}</strong>}{item.line&&<strong>{item.line}</strong>}</div>{(item.from||item.to)&&<div className="route"><span>{item.from||'出發地'}</span><b>→</b><span>{item.to||'抵達地'}</span></div>}<div className="transport-meta">{item.durationMin!=null&&<span><Clock3 size={15}/>{item.durationMin} 分鐘</span>}{item.distanceKm!=null&&<span><Ruler size={15}/>{item.distanceKm} 公里</span>}</div></div>
}
function App(){
 const readOnly=!!shared
 const [s,setS]=useState<State>(()=>shared?{version:2,active:shared.id,trips:[shared]}:load())
 const [form,setForm]=useState<Trip|true|null>(null)
 const [itemDay,setItemDay]=useState<string|null>(null)
 const [tab,setTab]=useState<string|null>(null)
 const active=s.trips.find(t=>t.id===s.active)||null
 const update=(n:State)=>{setS(n);if(!readOnly)save(n)}
 useEffect(()=>{if(active&&!active.days.some(d=>d.id===tab))setTab(active.days[0]?.id||null)},[active?.id,active?.days.length])
 const saveTrip=(v:any)=>{if(form&&form!==true){const p=profile(v.destination);const existing=form;let days=existing.days;if(v.start!==existing.start||v.end!==existing.end){const fresh=range(v.start,v.end);days=fresh.map((d,i)=>({...d,items:existing.days[i]?.items||[]}))}const t={...existing,...v,...p,days,updated:Date.now()};update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})}else{const t=makeTrip(v);update({...s,active:t.id,trips:[...s.trips,t]});setTab(t.days[0]?.id||null)}setForm(null)}
 const remove=(t:Trip)=>{if(confirm(`刪除「${t.name}」？`)){const trips=s.trips.filter(x=>x.id!==t.id);update({...s,trips,active:s.active===t.id?(trips[0]?.id||null):s.active})}}
 const duplicate=(t:Trip)=>{const c={...structuredClone(t),id:id(),name:t.name+'（複製）',created:Date.now(),updated:Date.now()};update({...s,active:c.id,trips:[...s.trips,c]});setTab(c.days[0]?.id||null)}
 const addItem=(x:Item)=>{if(!active||!itemDay)return;const t={...active,days:active.days.map(d=>d.id===itemDay?{...d,items:[...d.items,x]}:d),updated:Date.now()};update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)});setItemDay(null)}
 const toggle=(day:string,it:string,cid:string)=>{if(!active||readOnly)return;const t={...active,days:active.days.map(d=>d.id!==day?d:{...d,items:d.items.map(i=>i.id!==it?i:{...i,checks:i.checks?.map(c=>c.id===cid?{...c,done:!c.done}:c)})})};update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)})}
 const share=async()=>{if(!active)return;const u=new URL(location.origin+location.pathname);u.searchParams.set('trip',b64(JSON.stringify(active)));if(navigator.share)await navigator.share({title:active.name,text:`查看「${active.name}」行程`,url:u.toString()});else{await navigator.clipboard.writeText(u.toString());alert('連結已複製')}}
 const legacy=()=>{try{const old=JSON.parse(localStorage.getItem(oldKey)||'null');if(!old?.trips?.length)return alert('找不到舊版資料');const trips=old.trips.map((o:any)=>{const t=makeTrip({name:o.tripName,destination:o.destination,start:o.start,end:o.end});t.id=String(o.tripId||id());t.currency=o.currency||t.currency;t.language=o.langName||t.language;t.days=(o.days||[]).map((d:any)=>({id:String(d.id||id()),date:d.date,title:d.title,items:(d.items||[]).map((i:any)=>({id:String(i.id||id()),type:i.type==='transport'?'transport':'place',start:i.startTime||'',end:i.endTime||'',title:i.place||'',note:i.note||''}))}));return t});update({version:2,active:trips[0].id,trips});setTab(trips[0].days[0]?.id||null);alert(`已匯入 ${trips.length} 個旅行`)}catch{alert('匯入失敗')}}
 if(active){const current=active.days.find(d=>d.id===tab)||active.days[0];const idx=active.days.findIndex(d=>d.id===current?.id);const totalDuration=(current?.items||[]).reduce((a,i)=>a+(i.durationMin||0),0);const transportCount=(current?.items||[]).filter(i=>i.type==='transport'||i.type==='flight').length;return <div className={`app theme-${active.theme}`}>
  <header className="top"><button className="icon" onClick={()=>update({...s,active:null})}><ArrowLeft/></button><div><small>{readOnly?'親友唯讀':'ACTIVE JOURNEY'}</small><h1>{active.name}</h1></div>{!readOnly&&<button className="icon" onClick={()=>setForm(active)}><Palette size={18}/></button>}</header>
  <main className="content trip">
   <section className="cover" style={active.cover?{backgroundImage:`url(${active.cover})`}:{}}><div><span>{active.country}</span><h2>{active.destination}</h2><p>{active.start} ～ {active.end}</p><b>{active.currency}・{active.language}</b></div></section>
   <Weather trip={active}/>
   {!readOnly&&<div className="quick"><button className="btn primary" onClick={share}><Share2 size={18}/>分享</button><button className="btn yellow" onClick={()=>window.print()}><FileDown size={18}/>列印／PDF</button></div>}
   <nav className="day-tabs" aria-label="每日行程分頁">{active.days.map((d,i)=><button key={d.id} className={current?.id===d.id?'active':''} onClick={()=>setTab(d.id)}><small>{d.date.slice(5)}</small><b>Day {i+1}</b></button>)}</nav>
   {current&&<section className="card day single-day"><div className="day-head"><div><small>{new Date(current.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'long'})}</small><h2>{current.title}・{current.date.slice(5)}</h2></div>{!readOnly&&<button className="icon" onClick={()=>setItemDay(current.id)}><Plus/></button>}</div>
    <div className="day-summary"><span>📌 {current.items.length} 個安排</span><span>🚉 {transportCount} 段交通</span><span>⏱ {totalDuration} 分鐘通勤</span></div>
    <div className="timeline">{current.items.length?current.items.sort((a,b)=>a.start.localeCompare(b.start)).map(i=><article className={`item ${i.type}`} key={i.id}><div className="time">{i.start}<span>～</span>{i.end}</div><div className="body"><small>{i.type==='note'?'NOTE':i.type==='transport'?'TRANSPORT':i.type==='flight'?'FLIGHT':i.type.toUpperCase()}</small><h3>{i.title}</h3>{(i.type==='transport'||i.type==='flight')&&<TransportDetails item={i}/>} {i.note&&i.type!=='note'&&<p>{i.note}</p>}{i.checks&&<div className="checks"><div className="note-heading"><StickyNote size={17}/>便條待辦</div>{i.checks.map(c=><label key={c.id}><input disabled={readOnly} type="checkbox" checked={c.done} onChange={()=>toggle(current.id,i.id,c.id)}/><span>{c.text}</span></label>)}</div>}</div></article>):<p className="empty">這一天還沒有行程，按右上角＋加入。</p>}</div>
    <div className="day-pager"><button className="btn" disabled={idx<=0} onClick={()=>setTab(active.days[idx-1]?.id)}><ChevronLeft size={18}/>前一天</button><span>{idx+1} / {active.days.length}</span><button className="btn" disabled={idx>=active.days.length-1} onClick={()=>setTab(active.days[idx+1]?.id)}>後一天<ChevronRight size={18}/></button></div>
   </section>}
  </main>{form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>} {itemDay&&<ItemForm onSave={addItem} onClose={()=>setItemDay(null)}/>} </div>}
 return <div className="app"><header className="dash-head"><span className="stamp">ULTIMATE 2.1</span><h1>我的旅行手帳</h1><p>把每一次出發，收進自己的旅行書架。</p></header><main className="content"><div className="section"><div><small>MY JOURNEYS</small><h2>旅行書架</h2></div><button className="btn primary" onClick={()=>setForm(true)}><Plus size={18}/>新增旅行</button></div>
 {s.trips.length?<div className="grid">{s.trips.map(t=><article className={`trip-card theme-${t.theme}`} key={t.id}><button className="trip-cover" style={t.cover?{backgroundImage:`url(${t.cover})`}:{}} onClick={()=>{update({...s,active:t.id});setTab(t.days[0]?.id||null)}}><div><small>{t.country}</small><b>{t.destination}</b><span>{t.start} ～ {t.end}</span></div></button><div className="trip-info"><div><h3>{t.name}</h3><p>{t.currency}・{t.language}</p><small className="theme-name">{themes.find(x=>x.id===t.theme)?.name}</small></div><div className="icons"><button onClick={()=>setForm(t)}><Pencil size={17}/></button><button onClick={()=>duplicate(t)}><Copy size={17}/></button><button onClick={()=>remove(t)}><Trash2 size={17}/></button></div></div></article>)}</div>:<section className="card empty-home"><div>🧳</div><h2>建立第一本旅行手帳</h2><button className="btn primary" onClick={()=>setForm(true)}><Plus/>新增旅行</button><button className="btn" onClick={legacy}><Upload size={17}/>匯入舊版</button></section>}</main>{form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}</div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))
