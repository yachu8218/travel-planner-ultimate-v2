import React,{useEffect,useMemo,useRef,useState} from 'react'
import ReactDOM from 'react-dom/client'
import {
 Plus,Pencil,Copy,Trash2,ArrowLeft,Share2,FileDown,Upload,Palette,Clock3,Ruler,
 StickyNote,ChevronLeft,ChevronRight,House,CalendarDays,CalendarPlus,Compass,WalletCards,
 Languages,UserRound,RefreshCw,Plane,MapPin,CloudSun,CheckCircle2,MoreHorizontal,
 ArrowUp,ArrowDown,X,Search,Navigation,Phone,Globe2,ImagePlus,Ticket,ReceiptText,Star,NotebookPen,Heart,HeartOff
} from 'lucide-react'
import {compressToEncodedURIComponent,decompressFromEncodedURIComponent} from 'lz-string'
import './styles.css'

type TType='place'|'meal'|'hotel'|'transport'|'flight'|'note'
type TransportMode='walk'|'metro'|'bus'|'taxi'|'car'|'train'|'flight'|'ferry'
type ThemeId='summer'|'journal'|'sakura'|'forest'|'coast'|'lavender'|'neon'|'cafe'|'christmas'|'washi'|'lemon'|'peach'|'strawberry'|'orange'|'apple'|'sky'|'grape'|'rainbow'|'mint'|'sunny'
type AppPage='home'|'itinerary'|'explore'|'wallet'|'memories'|'translate'|'more'
type Check={id:string,text:string,done:boolean}
type Item={
 id:string,type:TType,start:string,end:string,title:string,note?:string,checks?:Check[],
 transportMode?:TransportMode,from?:string,to?:string,durationMin?:number,distanceKm?:number,
 line?:string,flightNo?:string,address?:string,openingHours?:string,phone?:string,website?:string,
 lat?:number,lon?:number,rating?:number,userRatingCount?:number,openNow?:boolean,placeSource?:string,
 photoName?:string,primaryType?:string,secondaryName?:string,
 flightDate?:string,flightStatus?:string,airline?:string,aircraftRegistration?:string,
 departureScheduled?:string,arrivalScheduled?:string,flightUpdatedAt?:number,
 departureTerminal?:string,arrivalTerminal?:string,departureGate?:string,arrivalGate?:string,
 baggageBelt?:string,aircraftModel?:string,flightSource?:string,
 departureTimezone?:string,arrivalTimezone?:string,departureUtcOffset?:string,arrivalUtcOffset?:string,
 completed?:boolean,completedAt?:number
}
type DayMemory={note:string;rating:number;photos:string[]}
type Day={id:string,date:string,title:string,items:Item[]}
type Traveler={id:string;name:string}
type Expense={id:string;title:string;amount:number;currency:string;payerId:string;participantIds:string[];category:string;date:string;note?:string}
type WalletData={travelers:Traveler[];expenses:Expense[];budgetTwd:number;overseasFee:number}
type ShareScope='itinerary'|'budget'|'wallet'
type PdfMode='app'|'a4'
type PdfOptions={cover:boolean;tripInfo:boolean;flights:boolean;itinerary:boolean;notes:boolean;budget:boolean;expenses:boolean}
type LiveShareInfo={code:string;url:string;editToken:string;scope:ShareScope;expiresInDays:number;password:string;updatedAt:number}
type Trip={
 id:string,name:string,destination:string,country:string,currency:string,language:string,locale:string,
 start:string,end:string,lat:number,lon:number,cover?:string,days:Day[],theme:ThemeId,wallet?:WalletData,favorites?:Item[],memories?:Record<string,DayMemory>,created:number,updated:number
}
type State={version:2,active:string|null,trips:Trip[]}
type WeatherDay={date:string,code:number,max:number,min:number,rain:number}
type PlaceResult={
 place_id:string;display_name:string;lat:string;lon:string;type?:string;class?:string;
 name?:string;openingHours?:string;phone?:string;website?:string;rating?:number;
 userRatingCount?:number;openNow?:boolean;source?:string;photoName?:string;primaryType?:string;secondaryName?:string
}
type TranslationFavorite={id:string;source:string;translated:string;locale:string}
type FlightMovement={
 airport?:string;iata?:string;icao?:string;terminal?:string;gate?:string;baggage?:string;
 scheduled?:string;revised?:string;runway?:string;timezone?:string;utcOffset?:string
}
type FlightResult={
 id?:string;flightNo:string;airline?:string;airlineIata?:string;status?:string;codeshareStatus?:string;
 departure:FlightMovement;arrival:FlightMovement;aircraft?:string;registration?:string;
 durationMin?:number;distanceKm?:number;source?:string;updatedAt?:string
}

const KEY='travel-planner-ultimate-v2'
const WEATHER_KEY='travel-planner-weather-v22'
const RATE_KEY='travel-planner-rates-v23'
const TRANSLATION_KEY='travel-planner-translation-v23'
const FLIGHT_CACHE_KEY='travel-planner-flight-cache-v280'
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
 {id:'lemon',name:'檸檬汽水',desc:'亮黃・天空藍・白色',colors:['#ffe66d','#67c7ff','#fffdf1']},
 {id:'peach',name:'蜜桃蘇打',desc:'蜜桃粉・奶油橘・亮白',colors:['#ffb5a7','#ffd166','#fff7ef']},
 {id:'strawberry',name:'草莓牛奶',desc:'莓果粉・淡粉・奶白',colors:['#ff6f91','#ffc2d1','#fff6f2']},
 {id:'orange',name:'橘子陽光',desc:'鮮橘・亮黃・奶油白',colors:['#ff9f43','#ffe66d','#fff8e7']},
 {id:'apple',name:'青蘋果',desc:'蘋果綠・檸檬黃・白色',colors:['#7bd389','#e9f76f','#f8fff4']},
 {id:'sky',name:'晴空藍',desc:'天空藍・水藍・亮白',colors:['#55c2ff','#94e1ff','#f5fcff']},
 {id:'grape',name:'葡萄汽水',desc:'亮紫・粉藍・柔粉',colors:['#a78bfa','#93c5fd','#f7d6ff']},
 {id:'rainbow',name:'彩虹手帳',desc:'粉紅・亮黃・水綠',colors:['#ff8fab','#ffe066','#70d6b9']},
 {id:'mint',name:'薄荷糖',desc:'薄荷綠・湖水藍・亮白',colors:['#70d6b9','#6ed5e8','#f4fffb']},
 {id:'sunny',name:'陽光花園',desc:'向日葵黃・嫩綠・珊瑚粉',colors:['#ffd23f','#8bd17c','#ff8a80']},
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
const shareParams=new URLSearchParams(location.search)
const shortShareCode=shareParams.get('shareId')
const legacyShared=(()=>{const compact=shareParams.get('share');const legacy=shareParams.get('trip');try{if(compact){const raw=decompressFromEncodedURIComponent(compact);return raw?normalizeTrip(JSON.parse(raw)):null}if(legacy)return normalizeTrip(JSON.parse(ub64(legacy)))}catch{}return null})()
const wicon=(c:number)=>c===0?'☀️':c<=3?'⛅':c<=48?'🌫️':c<=67?'🌧️':c<=77?'❄️':c<=82?'🌦️':'⛈️'
const modeLabel:Record<TransportMode,string>={walk:'步行',metro:'地鐵',bus:'公車',taxi:'計程車',car:'自駕／租車',train:'火車／高鐵／KTX',flight:'飛機',ferry:'渡輪'}
const modeEmoji:Record<TransportMode,string>={walk:'🚶',metro:'🚇',bus:'🚌',taxi:'🚕',car:'🚗',train:'🚄',flight:'✈️',ferry:'⛴️'}
const typeName:Record<TType,string>={place:'景點',meal:'餐廳／甜點',hotel:'住宿',transport:'交通',flight:'航班',note:'便條紙'}
const defaultPdfOptions:PdfOptions={cover:true,tripInfo:true,flights:true,itinerary:true,notes:true,budget:false,expenses:false}
const liveShareStorageKey=(tripId:string)=>`travel-live-share-${tripId}`
const readLiveShare=(tripId:string):LiveShareInfo|null=>{try{return JSON.parse(localStorage.getItem(liveShareStorageKey(tripId))||'null')}catch{return null}}
const writeLiveShare=(tripId:string,value:LiveShareInfo)=>localStorage.setItem(liveShareStorageKey(tripId),JSON.stringify(value))

const timeValue=(value?:string)=>{
 if(!value)return Number.MAX_SAFE_INTEGER
 const match=value.match(/^(\d{1,2}):(\d{2})/)
 if(!match)return Number.MAX_SAFE_INTEGER
 return Number(match[1])*60+Number(match[2])
}
const sortItemsByTime=(items:Item[])=>items
 .map((item,index)=>({item,index,value:timeValue(item.start)}))
 .sort((a,b)=>a.value-b.value||a.index-b.index)
 .map(x=>x.item)
const compactReadonlyTrip=(trip:Trip,scope:ShareScope='itinerary'):Trip=>{
 const sourceWallet=trip.wallet||defaultWallet()
 const wallet=scope==='wallet'?structuredClone(sourceWallet):scope==='budget'?{
  travelers:structuredClone(sourceWallet.travelers),
  expenses:[],
  budgetTwd:sourceWallet.budgetTwd,
  overseasFee:sourceWallet.overseasFee
 }:undefined
 return{
  ...trip,
  cover:undefined,
  favorites:undefined,
  wallet,
  days:trip.days.map(day=>({...day,items:day.items.map(item=>({
   ...item,
   photoName:undefined,
   checks:item.checks?.map(check=>({...check}))
  }))}))
 }
}
const escapeHtml=(value:any)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch))
const legacyReadonlyShareUrl=(trip:Trip)=>{
 const url=new URL(location.origin+location.pathname)
 url.searchParams.set('share',compressToEncodedURIComponent(JSON.stringify(compactReadonlyTrip(trip,'itinerary'))))
 return url.toString()
}


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
   <div className="two"><label>出發日期<div className="date-time-field"><CalendarDays size={18}/><input required type="date" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></div></label><label>回程日期<div className="date-time-field"><CalendarDays size={18}/><input required type="date" min={v.start} value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></div></label></div>
   <label>封面照片<input type="file" accept="image/*" onChange={e=>cover(e.target.files?.[0])}/></label>
   {v.cover&&<img className="preview" src={v.cover}/>}
   <div className="picker-label"><Palette size={18}/>選擇旅行主題</div>
   <ThemePicker value={v.theme} onChange={theme=>setV({...v,theme})}/>
   <div className="sticky-actions"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">儲存旅行</button></div>
  </form>
 </ModalShell>
}

function ItemForm({initial,onSave,onClose,trip}:{initial?:Item,onSave:(x:Item)=>void,onClose:()=>void,trip?:Trip}){
 const [v,setV]=useState({
  type:initial?.type||'place' as TType,start:initial?.start||'09:00',end:initial?.end||'10:00',
  title:initial?.title||'',note:initial?.note||(initial?.checks||[]).map(c=>c.text).join('\n'),
  transportMode:initial?.transportMode||'metro' as TransportMode,from:initial?.from||'',to:initial?.to||'',
  durationMin:initial?.durationMin?.toString()||'',distanceKm:initial?.distanceKm?.toString()||'',
  line:initial?.line||'',flightNo:initial?.flightNo||'',address:initial?.address||'',
  openingHours:initial?.openingHours||'',phone:initial?.phone||'',website:initial?.website||'',
  lat:initial?.lat,lon:initial?.lon,rating:initial?.rating,userRatingCount:initial?.userRatingCount,
  openNow:initial?.openNow,placeSource:initial?.placeSource||'',photoName:initial?.photoName||'',primaryType:initial?.primaryType||'',
  secondaryName:initial?.secondaryName||'',flightDate:initial?.flightDate||trip?.start||'',airline:initial?.airline||'',
  departureTerminal:initial?.departureTerminal||'',arrivalTerminal:initial?.arrivalTerminal||'',
  departureGate:initial?.departureGate||'',arrivalGate:initial?.arrivalGate||'',baggageBelt:initial?.baggageBelt||'',
  aircraftModel:initial?.aircraftModel||'',aircraftRegistration:initial?.aircraftRegistration||'',
  flightStatus:initial?.flightStatus||'',departureScheduled:initial?.departureScheduled||'',
  arrivalScheduled:initial?.arrivalScheduled||'',flightUpdatedAt:initial?.flightUpdatedAt,
  flightSource:initial?.flightSource||'',departureTimezone:initial?.departureTimezone||'',
  arrivalTimezone:initial?.arrivalTimezone||'',departureUtcOffset:initial?.departureUtcOffset||'',
  arrivalUtcOffset:initial?.arrivalUtcOffset||''
 })
 const [placeLoading,setPlaceLoading]=useState(false)
 const [suggestLoading,setSuggestLoading]=useState(false)
 const [showSuggestions,setShowSuggestions]=useState(false)
 const [placeResults,setPlaceResults]=useState<PlaceResult[]>([])
 const [placeMessage,setPlaceMessage]=useState('')
 const isTransport=v.type==='transport'||v.type==='flight'
 const isPlace=v.type==='place'||v.type==='meal'||v.type==='hotel'
 useEffect(()=>{
  if(!isPlace||v.title.trim().length<2){
   setShowSuggestions(false)
   return
  }
  const timer=setTimeout(async()=>{
   setSuggestLoading(true)
   try{
    const destination=trip?.destination||''
    const aliases:Record<string,string>={'釜山':'부산','首爾':'서울','濟州':'제주','大邱':'대구','仁川':'인천'}
    const q=[v.title,aliases[destination]||destination].filter(Boolean).join(' ')
    const r=await fetch(`/api/places?q=${encodeURIComponent(q)}&language=${encodeURIComponent(trip?.locale||'zh-TW')}&destination=${encodeURIComponent(destination)}&mode=autocomplete`)
    const j=await r.json()
    if(r.ok&&Array.isArray(j.results)&&j.results.length){
     setPlaceResults(j.results)
     setShowSuggestions(true)
     setPlaceMessage('')
    }else if(j.configured===false){
     setPlaceMessage('Google Places 金鑰尚未在目前部署生效；仍可按下方按鈕使用備援搜尋。')
    }
   }catch{}
   finally{setSuggestLoading(false)}
  },550)
  return()=>clearTimeout(timer)
 },[v.title,trip?.destination,trip?.locale,isPlace])

 const destinationAlias=(value='')=>{
  const pairs:Record<string,string>={
   '釜山':'부산','首爾':'서울','濟州':'제주','大邱':'대구','仁川':'인천',
   '東京':'東京','大阪':'大阪','京都':'京都','福岡':'福岡','沖繩':'沖縄',
   '曼谷':'กรุงเทพ','巴黎':'Paris','倫敦':'London'
  }
  return pairs[value]||value
 }
 const placeQueries=()=>{
  const title=v.title.trim(),destination=trip?.destination?.trim()||''
  return Array.from(new Set([
   [title,destinationAlias(destination)].filter(Boolean).join(' '),
   [title,destination].filter(Boolean).join(' '),
   title
  ].filter(Boolean)))
 }
 const searchPlace=async()=>{
  if(!v.title.trim()){setPlaceMessage('請先輸入店名或景點名稱。');return}
  setPlaceLoading(true);setPlaceMessage('正在確認 Google Places 設定…');setPlaceResults([]);setShowSuggestions(false)
  const queries=placeQueries()
  let apiMessage=''
  try{
   for(const q of queries){
    const r=await fetch(`/api/places?q=${encodeURIComponent(q)}&language=${encodeURIComponent(trip?.locale||'zh-TW')}&destination=${encodeURIComponent(trip?.destination||'')}`)
    const j=await r.json()
    apiMessage=j.message||apiMessage
    if(r.ok&&Array.isArray(j.results)&&j.results.length){
     setPlaceResults(j.results)
     setShowSuggestions(true)
     setPlaceMessage(j.configured?`已使用 Google Places 找到 ${j.results.length} 筆結果，請選擇正確分店。`:'使用免費地址資料搜尋。')
     setPlaceLoading(false)
     return
    }
    if(j.configured===false){
     apiMessage='Cloudflare 尚未讀取到 GOOGLE_PLACES_API_KEY。請確認 Secret 設在 Production，並完成一次新部署。'
     break
    }
   }
  }catch{
   apiMessage='無法連線到 Cloudflare 地點搜尋功能。'
  }
  setPlaceMessage(apiMessage||'Google Places 沒有找到結果，正在改用免費地址搜尋…')
  try{
   for(const q of queries){
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=zh-TW,zh,en,ko,ja&q=${encodeURIComponent(q)}`,{headers:{Accept:'application/json'}})
    if(!r.ok)continue
    const j=await r.json()
    if(Array.isArray(j)&&j.length){
     setPlaceResults(j.map((p:PlaceResult)=>({...p,source:'OpenStreetMap'})))
     setShowSuggestions(true)
     setPlaceMessage(`Google Places 未取得結果，目前顯示免費地址搜尋的 ${j.length} 筆結果。`)
     setPlaceLoading(false)
     return
    }
   }
   setPlaceMessage(`${apiMessage?apiMessage+' ':''}仍找不到符合店家。建議輸入完整店名、分店名或城市，例如「다담 부산」。`)
  }catch{
   setPlaceMessage(`${apiMessage?apiMessage+' ':''}免費地址搜尋也暫時無法使用，可先手動輸入地址。`)
  }finally{
   setPlaceLoading(false)
  }
 }
 const choosePlace=(p:PlaceResult)=>{
  setV({...v,
   title:p.name||v.title,address:p.display_name,lat:Number(p.lat),lon:Number(p.lon),
   openingHours:p.openingHours||v.openingHours,phone:p.phone||v.phone,website:p.website||v.website,
   rating:p.rating,userRatingCount:p.userRatingCount,openNow:p.openNow,placeSource:p.source||'',photoName:p.photoName||'',primaryType:p.primaryType||'',secondaryName:p.secondaryName||''
  })
  setPlaceResults([]);setShowSuggestions(false)
  setPlaceMessage(p.source==='Google Places'?'已帶入 Google 店家資料。':'已帶入地址；營業時間與電話可手動補充。')
 }
 return <ModalShell title={initial?'編輯行程':'加入時間軸'} onClose={onClose}>
  <form onSubmit={e=>{e.preventDefault();onSave({
   ...(initial||{}),id:initial?.id||id(),type:v.type,start:v.start,end:v.end,title:v.title,note:v.note,
   transportMode:isTransport?(v.type==='flight'?'flight':v.transportMode):undefined,
   from:isTransport?v.from:undefined,to:isTransport?v.to:undefined,
   durationMin:v.durationMin?Number(v.durationMin):undefined,distanceKm:v.distanceKm?Number(v.distanceKm):undefined,
   line:isTransport?v.line:undefined,flightNo:v.type==='flight'?v.flightNo:undefined,
   address:isPlace?v.address:undefined,openingHours:isPlace?v.openingHours:undefined,
   phone:isPlace?v.phone:undefined,website:isPlace?v.website:undefined,
   lat:isPlace?v.lat:undefined,lon:isPlace?v.lon:undefined,
   rating:isPlace?v.rating:undefined,userRatingCount:isPlace?v.userRatingCount:undefined,
   openNow:isPlace?v.openNow:undefined,placeSource:isPlace?v.placeSource:undefined,
   photoName:isPlace?v.photoName:undefined,primaryType:isPlace?v.primaryType:undefined,
   secondaryName:isPlace?v.secondaryName:undefined,
   flightDate:v.type==='flight'?v.flightDate:undefined,airline:v.type==='flight'?v.airline:undefined,
   departureTerminal:v.type==='flight'?v.departureTerminal:undefined,
   arrivalTerminal:v.type==='flight'?v.arrivalTerminal:undefined,
   departureGate:v.type==='flight'?v.departureGate:undefined,arrivalGate:v.type==='flight'?v.arrivalGate:undefined,
   baggageBelt:v.type==='flight'?v.baggageBelt:undefined,aircraftModel:v.type==='flight'?v.aircraftModel:undefined,
   aircraftRegistration:v.type==='flight'?v.aircraftRegistration:undefined,
   flightStatus:v.type==='flight'?v.flightStatus:undefined,
   departureScheduled:v.type==='flight'?v.departureScheduled:undefined,
   arrivalScheduled:v.type==='flight'?v.arrivalScheduled:undefined,
   flightUpdatedAt:v.type==='flight'?v.flightUpdatedAt:undefined,
   flightSource:v.type==='flight'?v.flightSource:undefined,
   departureTimezone:v.type==='flight'?v.departureTimezone:undefined,
   arrivalTimezone:v.type==='flight'?v.arrivalTimezone:undefined,
   departureUtcOffset:v.type==='flight'?v.departureUtcOffset:undefined,
   arrivalUtcOffset:v.type==='flight'?v.arrivalUtcOffset:undefined,
   checks:v.type==='note'?v.note.split('\n').filter(Boolean).map((text,i)=>({id:initial?.checks?.[i]?.id||id(),text,done:initial?.checks?.[i]?.done||false})):initial?.checks
  })}}>
   <label>行程類型<select value={v.type} onChange={e=>setV({...v,type:e.target.value as TType})}><option value="place">景點</option><option value="meal">餐廳／甜點</option><option value="hotel">住宿</option><option value="transport">交通</option><option value="flight">飛機</option><option value="note">便條紙</option></select></label>
   <div className="two"><label>開始時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={v.start} onChange={e=>setV({...v,start:e.target.value})}/></div></label><label>結束時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={v.end} onChange={e=>setV({...v,end:e.target.value})}/></div></label></div>
   {v.type==='transport'&&<label>交通方式<select value={v.transportMode} onChange={e=>setV({...v,transportMode:e.target.value as TransportMode})}>{Object.entries(modeLabel).filter(([k])=>k!=='flight').map(([k,label])=><option key={k} value={k}>{modeEmoji[k as TransportMode]} {label}</option>)}</select></label>}
   {isTransport&&<><div className="two"><label>出發地<input value={v.from} onChange={e=>setV({...v,from:e.target.value})} placeholder="例如：海雲台站"/></label><label>抵達地<input value={v.to} onChange={e=>setV({...v,to:e.target.value})} placeholder="例如：西面站"/></label></div><div className="two"><label>通勤時間（分鐘）<input type="number" min="0" value={v.durationMin} onChange={e=>setV({...v,durationMin:e.target.value})}/></label><label>距離（公里）<input type="number" min="0" step="0.1" value={v.distanceKm} onChange={e=>setV({...v,distanceKm:e.target.value})}/></label></div><label>{v.type==='flight'?'航班號碼':'路線／車次'}<input value={v.type==='flight'?v.flightNo:v.line} onChange={e=>v.type==='flight'?setV({...v,flightNo:e.target.value.toUpperCase()}):setV({...v,line:e.target.value})} placeholder={v.type==='flight'?'例如：KE2086':'例如：2號線、KTX 105'}/></label></>}
   {v.type==='flight'&&<section className="flight-edit-fields">
    <label>航班日期<div className="date-time-field"><CalendarDays size={18}/><input type="date" value={v.flightDate} onChange={e=>setV({...v,flightDate:e.target.value})}/></div></label>
    <div className="two">
     <label>航空公司<input value={v.airline} onChange={e=>setV({...v,airline:e.target.value})} placeholder="例如：Korean Air"/></label>
     <label>航班狀態<input value={v.flightStatus} onChange={e=>setV({...v,flightStatus:e.target.value})} placeholder="Expected／Delayed"/></label>
    </div>
    <div className="two">
     <label>出發航廈<input value={v.departureTerminal} onChange={e=>setV({...v,departureTerminal:e.target.value})} placeholder="例如：1"/></label>
     <label>抵達航廈<input value={v.arrivalTerminal} onChange={e=>setV({...v,arrivalTerminal:e.target.value})} placeholder="例如：1"/></label>
    </div>
    <div className="two">
     <label>出發登機門<input value={v.departureGate} onChange={e=>setV({...v,departureGate:e.target.value})}/></label>
     <label>抵達登機門<input value={v.arrivalGate} onChange={e=>setV({...v,arrivalGate:e.target.value})}/></label>
    </div>
    <div className="two">
     <label>行李轉盤<input value={v.baggageBelt} onChange={e=>setV({...v,baggageBelt:e.target.value})}/></label>
     <label>機型<input value={v.aircraftModel} onChange={e=>setV({...v,aircraftModel:e.target.value})}/></label>
    </div>
   </section>}
   <label>標題<div className="smart-title-field"><Search size={17}/><input required value={v.title} onChange={e=>{setV({...v,title:e.target.value});setShowSuggestions(true)}} onFocus={()=>placeResults.length&&setShowSuggestions(true)} placeholder={v.type==='note'?'例如：機場待辦':v.type==='transport'?'例如：前往飯店':'輸入店名或景點名稱'}/>{suggestLoading&&<RefreshCw className="spin" size={16}/>}</div></label>{isPlace&&showSuggestions&&placeResults.length>0&&<div className="autocomplete-list">{placeResults.map(p=><button type="button" key={p.place_id} onClick={()=>choosePlace(p)}><MapPin size={16}/><span><b>{p.name||p.display_name.split(',')[0]}{p.secondaryName&&p.secondaryName!==p.name&&<em className="secondary-place-name">（{p.secondaryName}）</em>}</b><small>{p.display_name}</small>{p.rating!=null&&<em>⭐ {p.rating}（{p.userRatingCount||0}）{p.openNow===true?'・營業中':p.openNow===false?'・目前休息':''}</em>}</span></button>)}</div>}
   {isPlace&&<section className="place-enrich">
    <button type="button" className="btn full" onClick={searchPlace} disabled={placeLoading}>{placeLoading?<><RefreshCw className="spin" size={17}/>搜尋中</>:<><Search size={17}/>重新搜尋完整資料</>}</button>
    {placeMessage&&<p className="place-message">{placeMessage}</p>}
    {placeResults.length>0&&<div className="place-pick-list">{placeResults.map(p=><button type="button" key={p.place_id} onClick={()=>choosePlace(p)}><MapPin size={17}/><span><b>{p.name||p.display_name.split(',')[0]}</b><small>{p.display_name}</small>{p.rating!=null&&<em>⭐ {p.rating}（{p.userRatingCount||0}）{p.openNow===true?'・營業中':p.openNow===false?'・目前休息':''}</em>}</span></button>)}</div>}
    <label>地址<input value={v.address} onChange={e=>setV({...v,address:e.target.value})} placeholder="搜尋後可自動帶入，亦可手動輸入"/></label>
    <label>營業時間<input value={v.openingHours} onChange={e=>setV({...v,openingHours:e.target.value})} placeholder="例如：每日 11:30–22:00"/></label>{v.rating!=null&&<div className="place-auto-meta"><span>⭐ {v.rating}（{v.userRatingCount||0}則）</span>{v.openNow!=null&&<span>{v.openNow?'營業中':'目前休息'}</span>}{v.placeSource&&<small>資料來源：{v.placeSource}</small>}</div>}
    <div className="two"><label>電話<input value={v.phone} onChange={e=>setV({...v,phone:e.target.value})} placeholder="選填"/></label><label>官方網站<input value={v.website} onChange={e=>setV({...v,website:e.target.value})} placeholder="選填"/></label></div>
   </section>}
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
   if(!force&&cached&&Array.isArray(cached.days)&&cached.days.length>=7&&Date.now()-cached.updated<30*60*1000){setDays(cached.days.slice(0,7));setUpdated(cached.updated);setLoading(false);return}
   const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trip.lat}&longitude=${trip.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)
   if(!r.ok)throw new Error()
   const j=await r.json()
   const next=j.daily.time.map((date:string,i:number)=>({date,code:j.daily.weather_code[i],max:Math.round(j.daily.temperature_2m_max[i]),min:Math.round(j.daily.temperature_2m_min[i]),rain:j.daily.precipitation_probability_max[i]||0}))
   const now=Date.now();setDays(next);setUpdated(now)
   localStorage.setItem(WEATHER_KEY,JSON.stringify({...raw,[cacheKey]:{days:next,updated:now}}))
  }catch{
   const raw=JSON.parse(localStorage.getItem(WEATHER_KEY)||'{}');const cached=raw[cacheKey]
   if(cached&&Array.isArray(cached.days)){setDays(cached.days.slice(0,7));setUpdated(cached.updated);setOffline(true)}
  }finally{setLoading(false)}
 }
 useEffect(()=>{fetchWeather(false);const onFocus=()=>{if(!updated||Date.now()-updated>30*60*1000)fetchWeather(false)};addEventListener('focus',onFocus);return()=>removeEventListener('focus',onFocus)},[trip.id,trip.lat,trip.lon])
 const first=days[0]
 return <section className={`card weather ${compact?'compact':''}`}>
  <div className="weather-head"><div><small>WEATHER</small><h3>{compact?'今日天氣':`${trip.destination} 一週天氣`}</h3></div><button className="icon refresh" onClick={()=>fetchWeather(true)} disabled={loading} aria-label="重新整理天氣"><RefreshCw size={18} className={loading?'spin':''}/></button></div>
  {first&&compact&&<div className="weather-now"><b>{wicon(first.code)}</b><strong>{first.max}°</strong><span>最低 {first.min}°・降雨 {first.rain}%</span></div>}
  <div className={`weather-row ${compact?'mini-week':''}`}>{days.slice(0,7).map(d=><div className="weather-day" key={d.date}><small>{new Date(d.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'short'})}</small><b>{wicon(d.code)}</b><span>{d.max}°</span><em>{d.min}°</em><small>雨 {d.rain}%</small></div>)}</div>
  <p className="weather-status">{offline?'目前離線，使用上次資料・':''}{updated?`更新於 ${new Date(updated).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}`:'正在整理天氣資訊…'}</p>
 </section>
}


const stations=[
 ['釜山','1號線','多大浦海水浴場','다대포해수욕장','Dadaepo Beach'],['釜山','1號線','下端','하단','Hadan'],['釜山','1號線','沙上','사상','Sasang'],['釜山','1號線','釜山站','부산역','Busan Station'],['釜山','1號線','草梁','초량','Choryang'],['釜山','1號線','中央','중앙','Jungang'],['釜山','1號線','南浦','남포','Nampo'],['釜山','1號線','札嘎其','자갈치','Jagalchi'],['釜山','1號線','土城','토성','Toseong'],['釜山','1號線','西面','서면','Seomyeon'],['釜山','1號線','釜田','부전','Bujeon'],['釜山','1號線','蓮山','연산','Yeonsan'],['釜山','1號線','東萊','동래','Dongnae'],['釜山','1號線','溫泉場','온천장','Oncheonjang'],['釜山','1號線','老圃','노포','Nopo'],
 ['釜山','2號線','萇山','장산','Jangsan'],['釜山','2號線','中洞','중동','Jung-dong'],['釜山','2號線','海雲台','해운대','Haeundae'],['釜山','2號線','冬柏','동백','Dongbaek'],['釜山','2號線','Centum City','센텀시티','Centum City'],['釜山','2號線','民樂','민락','Millak'],['釜山','2號線','廣安','광안','Gwangan'],['釜山','2號線','金蓮山','금련산','Geumnyeonsan'],['釜山','2號線','慶星大釜慶大','경성대·부경대','Kyungsung Univ.'],['釜山','2號線','田浦','전포','Jeonpo'],['釜山','3號線','美南','미남','Minam'],['釜山','3號線','社稷','사직','Sajik'],['釜山','3號線','巨堤','거제','Geoje'],['釜山','東海線','新海雲台','신해운대','Sinhaeundae'],['釜山','東海線','松亭','송정','Songjeong'],['釜山','東海線','機張','기장','Gijang'],['釜山','金海輕軌','金海機場','공항','Gimhae Airport'],

 ['首爾','1號線','逍遙山','소요산','Soyosan'],['首爾','1號線','東豆川','동두천','Dongducheon'],['首爾','1號線','議政府','의정부','Uijeongbu'],['首爾','1號線','道峰山','도봉산','Dobongsan'],['首爾','1號線','倉洞','창동','Chang-dong'],['首爾','1號線','光云大','광운대','Kwangwoon Univ.'],['首爾','1號線','清涼里','청량리','Cheongnyangni'],['首爾','1號線','東廟前','동묘앞','Dongmyo'],['首爾','1號線','東大門','동대문','Dongdaemun'],['首爾','1號線','鐘路五街','종로5가','Jongno 5-ga'],['首爾','1號線','鐘路三街','종로3가','Jongno 3-ga'],['首爾','1號線','鐘閣','종각','Jonggak'],['首爾','1號線','市廳','시청','City Hall'],['首爾','1號線','首爾站','서울역','Seoul Station'],['首爾','1號線','龍山','용산','Yongsan'],['首爾','1號線','鷺梁津','노량진','Noryangjin'],['首爾','1號線','新道林','신도림','Sindorim'],['首爾','1號線','九老','구로','Guro'],['首爾','1號線','加山數碼園區','가산디지털단지','Gasan Digital Complex'],['首爾','1號線','衿井','금정','Geumjeong'],['首爾','1號線','水原','수원','Suwon'],['首爾','1號線','仁川','인천','Incheon'],
 ['首爾','2號線','市廳','시청','City Hall'],['首爾','2號線','乙支路入口','을지로입구','Euljiro 1-ga'],['首爾','2號線','乙支路三街','을지로3가','Euljiro 3-ga'],['首爾','2號線','乙支路四街','을지로4가','Euljiro 4-ga'],['首爾','2號線','東大門歷史文化公園','동대문역사문화공원','Dongdaemun History & Culture Park'],['首爾','2號線','新堂','신당','Sindang'],['首爾','2號線','往十里','왕십리','Wangsimni'],['首爾','2號線','漢陽大','한양대','Hanyang Univ.'],['首爾','2號線','纛島','뚝섬','Ttukseom'],['首爾','2號線','聖水','성수','Seongsu'],['首爾','2號線','建大入口','건대입구','Konkuk Univ.'],['首爾','2號線','九宜','구의','Guui'],['首爾','2號線','江邊','강변','Gangbyeon'],['首爾','2號線','蠶室渡口','잠실나루','Jamsillaru'],['首爾','2號線','蠶室','잠실','Jamsil'],['首爾','2號線','蠶室新川','잠실새내','Jamsilsaenae'],['首爾','2號線','綜合運動場','종합운동장','Sports Complex'],['首爾','2號線','三成','삼성','Samseong'],['首爾','2號線','宣陵','선릉','Seolleung'],['首爾','2號線','驛三','역삼','Yeoksam'],['首爾','2號線','江南','강남','Gangnam'],['首爾','2號線','教大','교대','Seoul Natl Univ. of Education'],['首爾','2號線','瑞草','서초','Seocho'],['首爾','2號線','方背','방배','Bangbae'],['首爾','2號線','舍堂','사당','Sadang'],['首爾','2號線','落星垈','낙성대','Nakseongdae'],['首爾','2號線','首爾大入口','서울대입구','Seoul Natl Univ.'],['首爾','2號線','奉天','봉천','Bongcheon'],['首爾','2號線','新林','신림','Sillim'],['首爾','2號線','新大方','신대방','Sindaebang'],['首爾','2號線','九老數碼園區','구로디지털단지','Guro Digital Complex'],['首爾','2號線','大林','대림','Daerim'],['首爾','2號線','新道林','신도림','Sindorim'],['首爾','2號線','文來','문래','Mullae'],['首爾','2號線','永登浦區廳','영등포구청','Yeongdeungpo-gu Office'],['首爾','2號線','堂山','당산','Dangsan'],['首爾','2號線','合井','합정','Hapjeong'],['首爾','2號線','弘大入口','홍대입구','Hongik Univ.'],['首爾','2號線','新村','신촌','Sinchon'],['首爾','2號線','梨大','이대','Ewha Womans Univ.'],['首爾','2號線','阿峴','아현','Ahyeon'],['首爾','2號線','忠正路','충정로','Chungjeongno'],
 ['首爾','3號線','大化','대화','Daehwa'],['首爾','3號線','注葉','주엽','Juyeop'],['首爾','3號線','鼎鉢山','정발산','Jeongbalsan'],['首爾','3號線','白石','백석','Baekseok'],['首爾','3號線','花井','화정','Hwajeong'],['首爾','3號線','延新川','연신내','Yeonsinnae'],['首爾','3號線','佛光','불광','Bulgwang'],['首爾','3號線','弘濟','홍제','Hongje'],['首爾','3號線','獨立門','독립문','Dongnimmun'],['首爾','3號線','景福宮','경복궁','Gyeongbokgung'],['首爾','3號線','安國','안국','Anguk'],['首爾','3號線','鐘路三街','종로3가','Jongno 3-ga'],['首爾','3號線','乙支路三街','을지로3가','Euljiro 3-ga'],['首爾','3號線','忠武路','충무로','Chungmuro'],['首爾','3號線','東大入口','동대입구','Dongguk Univ.'],['首爾','3號線','藥水','약수','Yaksu'],['首爾','3號線','金湖','금호','Geumho'],['首爾','3號線','玉水','옥수','Oksu'],['首爾','3號線','狎鷗亭','압구정','Apgujeong'],['首爾','3號線','新沙','신사','Sinsa'],['首爾','3號線','蠶院','잠원','Jamwon'],['首爾','3號線','高速巴士客運站','고속터미널','Express Bus Terminal'],['首爾','3號線','教大','교대','Seoul Natl Univ. of Education'],['首爾','3號線','南部客運站','남부터미널','Nambu Bus Terminal'],['首爾','3號線','良才','양재','Yangjae'],['首爾','3號線','道谷','도곡','Dogok'],['首爾','3號線','大峙','대치','Daechi'],['首爾','3號線','鶴灘','학여울','Hangnyeoul'],['首爾','3號線','大廳','대청','Daecheong'],['首爾','3號線','逸院','일원','Irwon'],['首爾','3號線','水西','수서','Suseo'],['首爾','3號線','可樂市場','가락시장','Garak Market'],['首爾','3號線','警察醫院','경찰병원','National Police Hospital'],['首爾','3號線','梧琴','오금','Ogeum'],
 ['首爾','4號線','榛接','진접','Jinjeop'],['首爾','4號線','別內星江','별내별가람','Byeollae Byeolgaram'],['首爾','4號線','堂嶺','당고개','Danggogae'],['首爾','4號線','蘆原','노원','Nowon'],['首爾','4號線','倉洞','창동','Chang-dong'],['首爾','4號線','雙門','쌍문','Ssangmun'],['首爾','4號線','水踰','수유','Suyu'],['首爾','4號線','彌阿','미아','Mia'],['首爾','4號線','吉音','길음','Gireum'],['首爾','4號線','誠信女大入口','성신여대입구','Sungshin Women’s Univ.'],['首爾','4號線','漢城大入口','한성대입구','Hansung Univ.'],['首爾','4號線','惠化','혜화','Hyehwa'],['首爾','4號線','東大門','동대문','Dongdaemun'],['首爾','4號線','東大門歷史文化公園','동대문역사문화공원','Dongdaemun History & Culture Park'],['首爾','4號線','忠武路','충무로','Chungmuro'],['首爾','4號線','明洞','명동','Myeong-dong'],['首爾','4號線','會賢','회현','Hoehyeon'],['首爾','4號線','首爾站','서울역','Seoul Station'],['首爾','4號線','淑大入口','숙대입구','Sookmyung Women’s Univ.'],['首爾','4號線','三角地','삼각지','Samgakji'],['首爾','4號線','新龍山','신용산','Sinyongsan'],['首爾','4號線','二村','이촌','Ichon'],['首爾','4號線','銅雀','동작','Dongjak'],['首爾','4號線','總神大入口','총신대입구','Chongshin Univ.'],['首爾','4號線','舍堂','사당','Sadang'],['首爾','4號線','南泰嶺','남태령','Namtaeryeong'],['首爾','4號線','衿井','금정','Geumjeong'],['首爾','4號線','安山','안산','Ansan'],['首爾','4號線','烏耳島','오이도','Oido'],
 ['首爾','5號線','傍花','방화','Banghwa'],['首爾','5號線','金浦機場','김포공항','Gimpo Airport'],['首爾','5號線','松亭','송정','Songjeong'],['首爾','5號線','缽山','발산','Balsan'],['首爾','5號線','禾谷','화곡','Hwagok'],['首爾','5號線','喜鵲山','까치산','Kkachisan'],['首爾','5號線','木洞','목동','Mok-dong'],['首爾','5號線','梧木橋','오목교','Omokgyo'],['首爾','5號線','永登浦區廳','영등포구청','Yeongdeungpo-gu Office'],['首爾','5號線','汝矣島','여의도','Yeouido'],['首爾','5號線','麻浦','마포','Mapo'],['首爾','5號線','孔德','공덕','Gongdeok'],['首爾','5號線','忠正路','충정로','Chungjeongno'],['首爾','5號線','西大門','서대문','Seodaemun'],['首爾','5號線','光化門','광화문','Gwanghwamun'],['首爾','5號線','鐘路三街','종로3가','Jongno 3-ga'],['首爾','5號線','乙支路四街','을지로4가','Euljiro 4-ga'],['首爾','5號線','東大門歷史文化公園','동대문역사문화공원','Dongdaemun History & Culture Park'],['首爾','5號線','往十里','왕십리','Wangsimni'],['首爾','5號線','君子','군자','Gunja'],['首爾','5號線','峨嵯山','아차산','Achasan'],['首爾','5號線','千戶','천호','Cheonho'],['首爾','5號線','江東','강동','Gangdong'],['首爾','5號線','奧林匹克公園','올림픽공원','Olympic Park'],['首爾','5號線','梧琴','오금','Ogeum'],['首爾','5號線','河南市廳','하남시청','Hanam City Hall'],
 ['首爾','6號線','鷹岩','응암','Eungam'],['首爾','6號線','延新川','연신내','Yeonsinnae'],['首爾','6號線','佛光','불광','Bulgwang'],['首爾','6號線','數碼媒體城','디지털미디어시티','Digital Media City'],['首爾','6號線','世界盃競技場','월드컵경기장','World Cup Stadium'],['首爾','6號線','合井','합정','Hapjeong'],['首爾','6號線','上水','상수','Sangsu'],['首爾','6號線','廣興倉','광흥창','Gwangheungchang'],['首爾','6號線','大興','대흥','Daeheung'],['首爾','6號線','孔德','공덕','Gongdeok'],['首爾','6號線','孝昌公園前','효창공원앞','Hyochang Park'],['首爾','6號線','三角地','삼각지','Samgakji'],['首爾','6號線','綠莎坪','녹사평','Noksapyeong'],['首爾','6號線','梨泰院','이태원','Itaewon'],['首爾','6號線','漢江鎮','한강진','Hangangjin'],['首爾','6號線','藥水','약수','Yaksu'],['首爾','6號線','新堂','신당','Sindang'],['首爾','6號線','東廟前','동묘앞','Dongmyo'],['首爾','6號線','普門','보문','Bomun'],['首爾','6號線','高麗大','고려대','Korea Univ.'],['首爾','6號線','石溪','석계','Seokgye'],['首爾','6號線','泰陵入口','태릉입구','Taereung'],['首爾','6號線','烽火山','봉화산','Bonghwasan'],['首爾','6號線','新內','신내','Sinnae'],
 ['首爾','7號線','長岩','장암','Jangam'],['首爾','7號線','道峰山','도봉산','Dobongsan'],['首爾','7號線','蘆原','노원','Nowon'],['首爾','7號線','上鳳','상봉','Sangbong'],['首爾','7號線','君子','군자','Gunja'],['首爾','7號線','建大入口','건대입구','Konkuk Univ.'],['首爾','7號線','清潭','청담','Cheongdam'],['首爾','7號線','江南區廳','강남구청','Gangnam-gu Office'],['首爾','7號線','鶴洞','학동','Hak-dong'],['首爾','7號線','論峴','논현','Nonhyeon'],['首爾','7號線','高速巴士客運站','고속터미널','Express Bus Terminal'],['首爾','7號線','內方','내방','Naebang'],['首爾','7號線','總神大入口','총신대입구','Chongshin Univ.'],['首爾','7號線','南城','남성','Namseong'],['首爾','7號線','崇實大入口','숭실대입구','Soongsil Univ.'],['首爾','7號線','上道','상도','Sangdo'],['首爾','7號線','新大方三叉路口','신대방삼거리','Sindaebang Samgeori'],['首爾','7號線','大林','대림','Daerim'],['首爾','7號線','加山數碼園區','가산디지털단지','Gasan Digital Complex'],['首爾','7號線','溫水','온수','Onsu'],['首爾','7號線','富平區廳','부평구청','Bupyeong-gu Office'],['首爾','7號線','石南','석남','Seongnam'],
 ['首爾','8號線','別內','별내','Byeollae'],['首爾','8號線','岩寺','암사','Amsa'],['首爾','8號線','千戶','천호','Cheonho'],['首爾','8號線','江東區廳','강동구청','Gangdong-gu Office'],['首爾','8號線','夢村土城','몽촌토성','Mongchontoseong'],['首爾','8號線','蠶室','잠실','Jamsil'],['首爾','8號線','石村','석촌','Seokchon'],['首爾','8號線','松坡','송파','Songpa'],['首爾','8號線','可樂市場','가락시장','Garak Market'],['首爾','8號線','文井','문정','Munjeong'],['首爾','8號線','長旨','장지','Jangji'],['首爾','8號線','福井','복정','Bokjeong'],['首爾','8號線','牡丹','모란','Moran'],
 ['首爾','9號線','開花','개화','Gaehwa'],['首爾','9號線','金浦機場','김포공항','Gimpo Airport'],['首爾','9號線','麻谷渡口','마곡나루','Magongnaru'],['首爾','9號線','加陽','가양','Gayang'],['首爾','9號線','鹽倉','염창','Yeomchang'],['首爾','9號線','堂山','당산','Dangsan'],['首爾','9號線','國會議事堂','국회의사당','National Assembly'],['首爾','9號線','汝矣島','여의도','Yeouido'],['首爾','9號線','鷺梁津','노량진','Noryangjin'],['首爾','9號線','銅雀','동작','Dongjak'],['首爾','9號線','高速巴士客運站','고속터미널','Express Bus Terminal'],['首爾','9號線','新論峴','신논현','Sinnonhyeon'],['首爾','9號線','彥州','언주','Eonju'],['首爾','9號線','宣靖陵','선정릉','Seonjeongneung'],['首爾','9號線','奉恩寺','봉은사','Bongeunsa'],['首爾','9號線','綜合運動場','종합운동장','Sports Complex'],['首爾','9號線','石村古墳','석촌고분','Seokchon Gobun'],['首爾','9號線','石村','석촌','Seokchon'],['首爾','9號線','奧林匹克公園','올림픽공원','Olympic Park'],['首爾','9號線','中央報勳醫院','중앙보훈병원','VHS Medical Center'],
 ['首爾','機場鐵路','仁川機場第二航廈','인천공항2터미널','Incheon Airport T2'],['首爾','機場鐵路','仁川機場第一航廈','인천공항1터미널','Incheon Airport T1'],['首爾','機場鐵路','雲西','운서','Unseo'],['首爾','機場鐵路','青羅國際城','청라국제도시','Cheongna Int’l City'],['首爾','機場鐵路','桂陽','계양','Gyeyang'],['首爾','機場鐵路','金浦機場','김포공항','Gimpo Airport'],['首爾','機場鐵路','數碼媒體城','디지털미디어시티','Digital Media City'],['首爾','機場鐵路','弘大入口','홍대입구','Hongik Univ.'],['首爾','機場鐵路','孔德','공덕','Gongdeok'],['首爾','機場鐵路','首爾站','서울역','Seoul Station'],
 ['東京','JR山手線','東京','東京','Tokyo'],['東京','JR山手線','上野','上野','Ueno'],['東京','JR山手線','秋葉原','秋葉原','Akihabara'],['東京','JR山手線','新宿','新宿','Shinjuku'],['東京','JR山手線','澀谷','渋谷','Shibuya'],['東京','JR山手線','池袋','池袋','Ikebukuro'],['東京','銀座線','淺草','浅草','Asakusa'],['東京','銀座線','銀座','銀座','Ginza'],['東京','機場線','羽田機場第三航廈','羽田空港第3ターミナル','Haneda Airport T3'],
 ['大阪','御堂筋線','梅田','梅田','Umeda'],['大阪','御堂筋線','心齋橋','心斎橋','Shinsaibashi'],['大阪','御堂筋線','難波','なんば','Namba'],['大阪','御堂筋線','天王寺','天王寺','Tennoji'],['大阪','JR','大阪','大阪','Osaka'],['大阪','JR','環球影城','ユニバーサルシティ','Universal City'],['大阪','南海線','關西機場','関西空港','Kansai Airport'],
 ['京都','JR','京都','京都','Kyoto'],['京都','阪急京都線','京都河原町','京都河原町','Kyoto-kawaramachi'],['京都','京阪本線','祇園四條','祇園四条','Gion-shijo'],['京都','JR奈良線','稻荷','稲荷','Inari'],['福岡','機場線','福岡機場','福岡空港','Fukuoka Airport'],['福岡','機場線','博多','博多','Hakata'],['福岡','機場線','天神','天神','Tenjin']
] as const
const stationSearch=(q:string)=>{const k=q.trim().toLowerCase();return k?stations.filter(s=>s.join(' ').toLowerCase().includes(k)).slice(0,20):[]}

type MetroStation=typeof stations[number]
type MetroRouteSegment={line:string;from:string;to:string;stops:number}
type MetroRouteResult={
 city:string;from:MetroStation;to:MetroStation;minutes:number;stations:number;
 transfers:number;fare:number;currency:string;segments:MetroRouteSegment[]
}

const metroLines:Record<string,Record<string,string[]>>={
 '釜山':{
  '1號線':['多大浦海水浴場','下端','札嘎其','南浦','中央','釜山站','草梁','西面','釜田','蓮山','東萊','溫泉場','老圃'],
  '2號線':['萇山','中洞','海雲台','冬柏','Centum City','民樂','廣安','金蓮山','慶星大釜慶大','田浦','西面','沙上'],
  '3號線':['美南','社稷','蓮山','巨堤'],
  '東海線':['釜田','巨堤','新海雲台','松亭','機張'],
  '金海輕軌':['沙上','金海機場']
 },
 '首爾':{
  '1號線':['逍遙山','東豆川','議政府','道峰山','倉洞','光云大','清涼里','東廟前','東大門','鐘路五街','鐘路三街','鐘閣','市廳','首爾站','龍山','鷺梁津','新道林','九老','加山數碼園區','衿井','水原','仁川'],
  '2號線':['市廳','乙支路入口','乙支路三街','乙支路四街','東大門歷史文化公園','新堂','往十里','漢陽大','纛島','聖水','建大入口','九宜','江邊','蠶室渡口','蠶室','蠶室新川','綜合運動場','三成','宣陵','驛三','江南','教大','瑞草','方背','舍堂','落星垈','首爾大入口','奉天','新林','新大方','九老數碼園區','大林','新道林','文來','永登浦區廳','堂山','合井','弘大入口','新村','梨大','阿峴','忠正路'],
  '3號線':['大化','注葉','鼎鉢山','白石','花井','延新川','佛光','弘濟','獨立門','景福宮','安國','鐘路三街','乙支路三街','忠武路','東大入口','藥水','金湖','玉水','狎鷗亭','新沙','蠶院','高速巴士客運站','教大','南部客運站','良才','道谷','大峙','鶴灘','大廳','逸院','水西','可樂市場','警察醫院','梧琴'],
  '4號線':['榛接','別內星江','堂嶺','蘆原','倉洞','雙門','水踰','彌阿','吉音','誠信女大入口','漢城大入口','惠化','東大門','東大門歷史文化公園','忠武路','明洞','會賢','首爾站','淑大入口','三角地','新龍山','二村','銅雀','總神大入口','舍堂','南泰嶺','衿井','安山','烏耳島'],
  '5號線':['傍花','金浦機場','松亭','缽山','禾谷','喜鵲山','木洞','梧木橋','永登浦區廳','汝矣島','麻浦','孔德','忠正路','西大門','光化門','鐘路三街','乙支路四街','東大門歷史文化公園','往十里','君子','峨嵯山','千戶','江東','奧林匹克公園','梧琴','河南市廳'],
  '6號線':['鷹岩','延新川','佛光','數碼媒體城','世界盃競技場','合井','上水','廣興倉','大興','孔德','孝昌公園前','三角地','綠莎坪','梨泰院','漢江鎮','藥水','新堂','東廟前','普門','高麗大','石溪','泰陵入口','烽火山','新內'],
  '7號線':['長岩','道峰山','蘆原','上鳳','君子','建大入口','清潭','江南區廳','鶴洞','論峴','高速巴士客運站','內方','總神大入口','南城','崇實大入口','上道','新大方三叉路口','大林','加山數碼園區','溫水','富平區廳','石南'],
  '8號線':['別內','岩寺','千戶','江東區廳','夢村土城','蠶室','石村','松坡','可樂市場','文井','長旨','福井','牡丹'],
  '9號線':['開花','金浦機場','麻谷渡口','加陽','鹽倉','堂山','國會議事堂','汝矣島','鷺梁津','銅雀','高速巴士客運站','新論峴','彥州','宣靖陵','奉恩寺','綜合運動場','石村古墳','石村','奧林匹克公園','中央報勳醫院'],
  '機場鐵路':['仁川機場第二航廈','仁川機場第一航廈','雲西','青羅國際城','桂陽','金浦機場','數碼媒體城','弘大入口','孔德','首爾站']
 },
 '東京':{
  'JR山手線':['東京','秋葉原','上野','池袋','新宿','澀谷'],
  '銀座線':['淺草','上野','銀座'],
  '機場線':['羽田機場第三航廈','東京']
 },
 '大阪':{
  '御堂筋線':['梅田','心齋橋','難波','天王寺'],
  'JR':['大阪','環球影城'],
  '南海線':['關西機場','難波']
 },
 '京都':{
  'JR':['京都','稻荷'],
  '阪急京都線':['京都河原町'],
  '京阪本線':['祇園四條']
 },
 '福岡':{
  '機場線':['福岡機場','博多','天神']
 }
}

const normStation=(v:string)=>v.toLowerCase().replace(/[\s站駅·・\-_()（）]/g,'')
const stationAliases=(s:MetroStation)=>[s[2],s[3],s[4],`${s[2]}站`,`${s[4]} Station`]
const findStations=(query:string,city='')=>{
 const key=normStation(query)
 if(!key)return [] as MetroStation[]
 return stations
  .filter(s=>(!city||s[0]===city)&&stationAliases(s).some(x=>normStation(x).includes(key)))
  .sort((a,b)=>(a[0]===city?0:1)-(b[0]===city?0:1))
  .slice(0,12)
}
const cityForTrip=(destination:string)=>{
 const d=destination.toLowerCase()
 if(/釜山|busan/.test(d))return '釜山'
 if(/首爾|seoul/.test(d))return '首爾'
 if(/東京|tokyo/.test(d))return '東京'
 if(/大阪|osaka/.test(d))return '大阪'
 if(/京都|kyoto/.test(d))return '京都'
 if(/福岡|fukuoka/.test(d))return '福岡'
 return ''
}
const addClockMinutes=(time:string,minutes:number)=>{
 const [h,m]=time.split(':').map(Number)
 const total=((h||0)*60+(m||0)+minutes)%(24*60)
 return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}
const metroFare=(city:string,stationsCount:number)=>{
 if(city==='釜山')return {fare:stationsCount<=10?1600:1800,currency:'KRW'}
 if(city==='首爾')return {fare:stationsCount<=10?1550:1750,currency:'KRW'}
 if(['東京','大阪','京都','福岡'].includes(city))return {fare:stationsCount<=5?180:stationsCount<=10?240:320,currency:'JPY'}
 return {fare:0,currency:''}
}
const calculateMetroRoute=(from:MetroStation,to:MetroStation):MetroRouteResult|null=>{
 if(from[0]!==to[0])return null
 const city=from[0]
 const lines=metroLines[city]
 if(!lines)return null

 type State={station:string;line:string}
 const stateKey=(s:State)=>`${s.line}::${s.station}`
 const states:State[]=[]
 Object.entries(lines).forEach(([line,list])=>list.forEach(station=>states.push({station,line})))
 const adjacency=new Map<string,{state:State;cost:number}[]>()
 const add=(a:State,b:State,cost:number)=>{
  const k=stateKey(a)
  if(!adjacency.has(k))adjacency.set(k,[])
  adjacency.get(k)!.push({state:b,cost})
 }
 const rideMinutes=(line:string)=>{
  if(line==='機場鐵路')return 5
  if(line==='東海線'||line==='金海輕軌')return 4
  if(line==='1號線'||line==='4號線')return 3
  if(line==='9號線')return 2.4
  return 2.2
 }
 Object.entries(lines).forEach(([line,list])=>{
  list.forEach((station,i)=>{
   if(i<list.length-1){
    const a={station,line},b={station:list[i+1],line}
    const minutes=rideMinutes(line)
    add(a,b,minutes);add(b,a,minutes)
   }
  })
 })
 const byStation=new Map<string,State[]>()
 states.forEach(s=>byStation.set(s.station,[...(byStation.get(s.station)||[]),s]))
 byStation.forEach(group=>{
  group.forEach(a=>group.forEach(b=>{if(a.line!==b.line)add(a,b,city==='首爾'?5:4)}))
 })

 const starts=states.filter(s=>s.station===from[2])
 const targets=new Set(states.filter(s=>s.station===to[2]).map(stateKey))
 if(!starts.length||!targets.size)return null

 const dist=new Map<string,number>(),prev=new Map<string,string>()
 const queue:{state:State;distance:number}[]=starts.map(s=>({state:s,distance:0}))
 starts.forEach(s=>dist.set(stateKey(s),0))

 while(queue.length){
  queue.sort((a,b)=>a.distance-b.distance)
  const current=queue.shift()!,ck=stateKey(current.state)
  if(current.distance!==dist.get(ck))continue
  if(targets.has(ck)){
   const path:State[]=[current.state]
   let cursor=ck
   while(prev.has(cursor)){
    cursor=prev.get(cursor)!
    const sep=cursor.indexOf('::')
    path.unshift({line:cursor.slice(0,sep),station:cursor.slice(sep+2)})
   }

   const segments:MetroRouteSegment[]=[]
   let activeLine=path[0].line
   let segmentStart=path[0].station
   let stops=0
   let totalStations=0

   for(let i=1;i<path.length;i++){
    const previous=path[i-1],next=path[i]
    if(next.line!==activeLine){
     if(stops>0)segments.push({line:activeLine,from:segmentStart,to:previous.station,stops})
     activeLine=next.line
     segmentStart=next.station
     stops=0
    }else if(next.station!==previous.station){
     stops++
     totalStations++
    }
   }
   if(stops>0||segments.length===0){
    segments.push({line:activeLine,from:segmentStart,to:path[path.length-1].station,stops})
   }

   const transfers=Math.max(0,segments.length-1)
   const baseWait=city==='首爾'?4:3
   const minutes=Math.max(4,Math.round(current.distance+baseWait))
   const fareInfo=metroFare(city,totalStations)
   return {city,from,to,minutes,stations:totalStations,transfers,segments,...fareInfo}
  }

  for(const edge of adjacency.get(ck)||[]){
   const nk=stateKey(edge.state),nd=current.distance+edge.cost
   if(nd<(dist.get(nk)??Infinity)){
    dist.set(nk,nd)
    prev.set(nk,ck)
    queue.push({state:edge.state,distance:nd})
   }
  }
 }
 return null
}

const gmap=(q:string)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const nmap=(q:string)=>`https://map.naver.com/p/search/${encodeURIComponent(q)}`
const ftime=(s?:string)=>s?new Date(s).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'

const flightStatusLabel=(status='')=>{
 const map:Record<string,string>={
  Unknown:'狀態未知',Expected:'預定',EnRoute:'飛行中',CheckIn:'辦理登機',
  Boarding:'登機中',GateClosed:'登機門已關閉',Departed:'已起飛',
  Arrived:'已抵達',Delayed:'延誤',Cancelled:'已取消',Diverted:'轉降'
 }
 return map[status]||status||'已取得資料'
}
const bestFlightTime=(m:FlightMovement)=>m.revised||m.runway||m.scheduled
const localParts=(value?:string)=>{
 if(!value)return {date:'',time:'—'}
 const match=value.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
 if(match)return {date:`${Number(match[2])}/${Number(match[3])}`,time:`${match[4]}:${match[5]}`}
 const d=new Date(value)
 if(Number.isNaN(d.getTime()))return {date:'',time:value}
 return {
  date:d.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'}),
  time:d.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})
 }
}
const timeOnly=(value?:string)=>localParts(value).time
const fullFlightTime=(value?:string)=>{
 const p=localParts(value)
 return p.date?`${p.date} ${p.time}`:p.time
}
const offsetLabel=(value?:string)=>value?`GMT${value.replace(':00','')}`:''
const terminalLabel=(value?:string)=>value?`第 ${String(value).replace(/^T/i,'')} 航廈`:'航廈待公布'

function FlightResultCard({flight,selected,onSelect}:{key?:React.Key;flight:FlightResult;selected:boolean;onSelect:()=>void}){
 const dep=flight.departure,arr=flight.arrival
 return <button type="button" className={`flight-choice ${selected?'selected':''}`} onClick={onSelect}>
  <div className="flight-choice-head">
   <div><small>{flight.airline||'航空公司'}</small><h3>{flight.flightNo}</h3></div>
   <span className={`flight-status status-${(flight.status||'unknown').toLowerCase()}`}>{flightStatusLabel(flight.status)}</span>
  </div>
  <div className="flight-choice-route">
   <div><b>{dep.iata||'—'}</b><strong>{timeOnly(bestFlightTime(dep))}</strong><small>{dep.terminal?`T${dep.terminal}`:''}{dep.gate?`・Gate ${dep.gate}`:''}</small></div>
   <div className="flight-line"><Plane size={19}/><span>{flight.durationMin?`${Math.floor(flight.durationMin/60)}小時${flight.durationMin%60}分`:''}</span></div>
   <div><b>{arr.iata||'—'}</b><strong>{timeOnly(bestFlightTime(arr))}</strong><small>{arr.terminal?`T${arr.terminal}`:''}{arr.baggage?`・行李 ${arr.baggage}`:''}</small></div>
  </div>
 </button>
}

function FlightCenter({trip,onAdd}:{trip:Trip,onAdd:(x:Item)=>void}){
 const [flightNo,setFlightNo]=useState('')
 const [date,setDate]=useState(trip.start)
 const [loading,setLoading]=useState(false)
 const [results,setResults]=useState<FlightResult[]>([])
 const [selected,setSelected]=useState(0)
 const [message,setMessage]=useState('')
 const [manual,setManual]=useState(false)
 const [m,setM]=useState({from:'',to:'',start:'12:00',end:'15:30',airline:'',terminalFrom:'',terminalTo:'',gate:'',baggage:''})

 const search=async(force=false)=>{
  const no=flightNo.replace(/\s+/g,'').trim().toUpperCase()
  if(!no){setMessage('請先輸入航班號碼。');return}
  setLoading(true);setMessage('正在查詢航班資料…');setResults([]);setSelected(0)
  const cacheId=`${no}:${date}`
  try{
   const cache=JSON.parse(localStorage.getItem(FLIGHT_CACHE_KEY)||'{}')
   if(!force&&cache[cacheId]&&Date.now()-cache[cacheId].at<30*60*1000){
    setResults(cache[cacheId].results)
    setMessage(`使用 ${new Date(cache[cacheId].at).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})} 的快取資料。`)
    setLoading(false)
    return
   }
   const r=await fetch(`/api/flight?flight=${encodeURIComponent(no)}&date=${encodeURIComponent(date)}`)
   const j=await r.json()
   if(!r.ok)throw new Error(j.message||'航班查詢失敗')
   if(!Array.isArray(j.flights)||!j.flights.length)throw new Error(j.message||'找不到這個日期的航班。')
   setResults(j.flights)
   setMessage(j.flights.length>1?`找到 ${j.flights.length} 筆班次，請確認出發與抵達機場。`:`已取得航班資料・${j.provider||'AeroDataBox'}`)
   localStorage.setItem(FLIGHT_CACHE_KEY,JSON.stringify({...cache,[cacheId]:{results:j.flights,at:Date.now()}}))
  }catch(e:any){
   const cache=JSON.parse(localStorage.getItem(FLIGHT_CACHE_KEY)||'{}')
   const reason=e?.message||'連線錯誤'
   if(cache[cacheId]?.results?.length){
    setResults(cache[cacheId].results)
    setMessage(`即時查詢失敗，使用上次快取：${reason}`)
   }else{
    setMessage(reason.includes('配額')||reason.includes('quota')||reason.includes('429')
     ?'RapidAPI 本月配額或請求頻率已達上限，已切換為手動建立航班。'
     :reason)
    setManual(true)
   }
  }finally{setLoading(false)}
 }

 const addResult=()=>{
  const result=results[selected]
  if(!result)return
  const dep=result.departure,arr=result.arrival
  const depTime=bestFlightTime(dep),arrTime=bestFlightTime(arr)
  onAdd({
   id:id(),type:'flight',
   start:depTime?timeOnly(depTime):'00:00',end:arrTime?timeOnly(arrTime):'00:00',
   title:`${result.airline||''} ${result.flightNo}`.trim(),
   flightNo:result.flightNo,flightDate:date,flightStatus:result.status,airline:result.airline,
   aircraftRegistration:result.registration,aircraftModel:result.aircraft,
   departureScheduled:depTime,arrivalScheduled:arrTime,flightUpdatedAt:Date.now(),
   departureTerminal:dep.terminal,arrivalTerminal:arr.terminal,departureGate:dep.gate,
   arrivalGate:arr.gate,baggageBelt:arr.baggage,flightSource:result.source||'AeroDataBox',
   departureTimezone:dep.timezone,arrivalTimezone:arr.timezone,
   departureUtcOffset:dep.utcOffset,arrivalUtcOffset:arr.utcOffset,
   transportMode:'flight',
   from:[dep.airport,dep.iata].filter(Boolean).join(' '),
   to:[arr.airport,arr.iata].filter(Boolean).join(' '),
   durationMin:result.durationMin,distanceKm:result.distanceKm,
   checks:flightChecklistDefaults.map(text=>({id:id(),text,done:false})),
   note:[
    `狀態：${flightStatusLabel(result.status)}`,
    result.aircraft&&`機型：${result.aircraft}`,
    result.registration&&`機身編號：${result.registration}`,
    dep.gate&&`出發 Gate：${dep.gate}`,
    arr.gate&&`抵達 Gate：${arr.gate}`,
    arr.baggage&&`行李轉盤：${arr.baggage}`,
    `資料來源：${result.source||'AeroDataBox'}`
   ].filter(Boolean).join('\n')
  })
 }

 const addManual=()=>{
  const no=flightNo.trim().toUpperCase()||'自訂航班'
  onAdd({
   id:id(),type:'flight',start:m.start,end:m.end,title:`${m.airline||''} ${no}`.trim(),
   flightNo:no,flightDate:date,airline:m.airline,transportMode:'flight',
   departureTerminal:m.terminalFrom,arrivalTerminal:m.terminalTo,departureGate:m.gate,
   baggageBelt:m.baggage,flightSource:'手動建立',
   from:m.from,to:m.to,
   checks:flightChecklistDefaults.map(text=>({id:id(),text,done:false})),
   note:'手動建立的航班資料，請於出發前向航空公司確認。'
  })
 }

 return <section className="flight-center">
  <div className="flight-search card">
   <div className="feature-head"><div><small>FLIGHT DATABASE</small><h2>智慧航班資料庫</h2></div><Plane size={30}/></div>
   <p>輸入航班號與搭乘日期，可查詢班表或即時狀態；同一班號有多條航線時會先讓你選擇。</p>
   <div className="flight-fields">
    <label>航班號<input value={flightNo} onChange={e=>setFlightNo(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="例如：KE2086、LJ751"/></label>
    <label>搭乘日期<div className="date-time-field"><CalendarDays size={18}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div></label>
   </div>
   <div className="flight-search-actions">
    <button className="btn primary" onClick={()=>search(false)} disabled={loading}>{loading?<><RefreshCw className="spin" size={18}/>查詢中</>:<><Search size={18}/>查詢航班</>}</button>
    <button className="btn" onClick={()=>search(true)} disabled={loading||!flightNo}><RefreshCw size={17}/>強制更新</button>
   </div>
   {message&&<div className="service-message">{message}<small>尚未設定 RapidAPI 金鑰或配額不足時，可繼續使用下方手動航班。</small></div>}
   <button className="text-toggle" onClick={()=>setManual(!manual)}>{manual?'收起手動輸入':'＋ 手動建立航班'}</button>
   {manual&&<div className="manual-flight">
    <div className="flight-fields">
     <label>航空公司<input value={m.airline} onChange={e=>setM({...m,airline:e.target.value})} placeholder="例如：大韓航空"/></label>
     <label>出發機場<input value={m.from} onChange={e=>setM({...m,from:e.target.value})} placeholder="桃園 TPE"/></label>
     <label>抵達機場<input value={m.to} onChange={e=>setM({...m,to:e.target.value})} placeholder="釜山 PUS"/></label>
     <label>出發航廈<input value={m.terminalFrom} onChange={e=>setM({...m,terminalFrom:e.target.value})} placeholder="例如：2"/></label>
     <label>抵達航廈<input value={m.terminalTo} onChange={e=>setM({...m,terminalTo:e.target.value})}/></label>
     <label>登機門<input value={m.gate} onChange={e=>setM({...m,gate:e.target.value})}/></label>
     <label>行李轉盤<input value={m.baggage} onChange={e=>setM({...m,baggage:e.target.value})}/></label>
     <label>起飛時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={m.start} onChange={e=>setM({...m,start:e.target.value})}/></div></label>
     <label>抵達時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={m.end} onChange={e=>setM({...m,end:e.target.value})}/></div></label>
    </div>
    <button className="btn yellow full" onClick={addManual}><Plus size={18}/>加入目前 Day</button>
   </div>}
  </div>

  {results.length>0&&<section className="flight-results-section">
   <div className="result-section-head"><div><small>SEARCH RESULTS</small><h3>選擇正確班次</h3></div><span>{results.length} 筆</span></div>
   <div className="flight-choice-list">{results.map((f,i)=><FlightResultCard key={f.id||`${f.flightNo}-${i}`} flight={f} selected={selected===i} onSelect={()=>setSelected(i)}/>)}</div>
   <article className="card selected-flight-detail compact-flight-detail">
    <div className="flight-result-head"><div><small>{results[selected].airline||'AIRLINE'}</small><h2>{results[selected].flightNo}</h2></div><span className={`status-pill ${flightStatusClass(results[selected].status)}`}>{flightStatusLabel(results[selected].status)}</span></div>
    <div className="selected-flight-date"><CalendarDays size={17}/><b>航班日期：{date}</b></div>
    <div className="flight-route compact-route">
     <div><b>{results[selected].departure.iata||'—'}</b><span>{results[selected].departure.airport||'出發機場'}</span><strong>{fullFlightTime(bestFlightTime(results[selected].departure))}</strong><small>{terminalLabel(results[selected].departure.terminal)}{results[selected].departure.gate?`・Gate ${results[selected].departure.gate}`:'・Gate 待公布'}</small><em>{offsetLabel(results[selected].departure.utcOffset)||results[selected].departure.timezone||''}</em></div>
     <div className="route-flight-center"><Plane size={27}/><span>{results[selected].durationMin?`${Math.floor(results[selected].durationMin/60)}小時${results[selected].durationMin%60}分`:''}</span></div>
     <div><b>{results[selected].arrival.iata||'—'}</b><span>{results[selected].arrival.airport||'抵達機場'}</span><strong>{fullFlightTime(bestFlightTime(results[selected].arrival))}</strong><small>{terminalLabel(results[selected].arrival.terminal)}{results[selected].arrival.baggage?`・行李 ${results[selected].arrival.baggage}`:'・行李待公布'}</small><em>{offsetLabel(results[selected].arrival.utcOffset)||results[selected].arrival.timezone||''}</em></div>
    </div>
    <div className="flight-meta compact-flight-meta">
     <span><b>航廈</b>{results[selected].departure.terminal?`T${results[selected].departure.terminal}`:'待公布'} → {results[selected].arrival.terminal?`T${results[selected].arrival.terminal}`:'待公布'}</span>
     <span><b>登機門</b>{results[selected].departure.gate||'待公布'}</span>
     <span><b>行李轉盤</b>{results[selected].arrival.baggage||'待公布'}</span>
     <span><b>機型</b>{results[selected].aircraft||'待公布'}</span>
     <span><b>資料來源</b>{results[selected].source||'AeroDataBox'}</span>
    </div>
    <button className="btn primary full" onClick={addResult}><Plus size={18}/>加入目前 Day</button>
   </article>
  </section>}
 </section>
}

function ExploreCenter({trip,onAdd,onFavorite,onRemoveFavorite}:{trip:Trip,onAdd:(x:Item)=>void,onFavorite:(x:Item)=>void,onRemoveFavorite:(id:string)=>void}){
 const [q,setQ]=useState('')
 const [loading,setLoading]=useState(false)
 const [places,setPlaces]=useState<PlaceResult[]>([])
 const [msg,setMsg]=useState('')
 const metroCity=cityForTrip(trip.destination)
 const [metroFromQuery,setMetroFromQuery]=useState('')
 const [metroToQuery,setMetroToQuery]=useState('')
 const [metroFrom,setMetroFrom]=useState<MetroStation|null>(null)
 const [metroTo,setMetroTo]=useState<MetroStation|null>(null)
 const [metroStart,setMetroStart]=useState('09:00')
 const [metroRoute,setMetroRoute]=useState<MetroRouteResult|null>(null)
 const [metroMessage,setMetroMessage]=useState('')
 const [view,setView]=useState<'search'|'favorites'>('search')
 const fromSuggestions=useMemo(()=>findStations(metroFromQuery,metroCity),[metroFromQuery,metroCity])
 const toSuggestions=useMemo(()=>findStations(metroToQuery,metroCity),[metroToQuery,metroCity])
 const chooseMetroStation=(side:'from'|'to',station:MetroStation)=>{
  if(side==='from'){setMetroFrom(station);setMetroFromQuery(`${station[2]}｜${station[3]}`)}
  else{setMetroTo(station);setMetroToQuery(`${station[2]}｜${station[3]}`)}
  setMetroRoute(null);setMetroMessage('')
 }
 const swapMetro=()=>{
  const from=metroFrom,fromQ=metroFromQuery
  setMetroFrom(metroTo);setMetroFromQuery(metroToQuery)
  setMetroTo(from);setMetroToQuery(fromQ)
  setMetroRoute(null);setMetroMessage('')
 }
 const searchMetroRoute=()=>{
  if(!metroFrom||!metroTo){setMetroMessage('請先從搜尋結果選擇起點與終點站。');return}
  if(metroFrom[2]===metroTo[2]){setMetroMessage('起點與終點不能是同一站。');return}
  const route=calculateMetroRoute(metroFrom,metroTo)
  if(!route){setMetroRoute(null);setMetroMessage('目前資料無法計算這兩站的路線，請確認兩站位於同一城市。');return}
  setMetroRoute(route);setMetroMessage('')
 }
 const addMetroRoute=()=>{
  if(!metroRoute)return
  const routeLines=metroRoute.segments.map(s=>s.line).join(' → ')
  onAdd({id:id(),type:'transport',start:metroStart,end:addClockMinutes(metroStart,metroRoute.minutes),
   title:`${metroRoute.from[2]} → ${metroRoute.to[2]}`,transportMode:'metro',
   from:`${metroRoute.from[2]} ${metroRoute.from[3]} ${metroRoute.from[4]}`,
   to:`${metroRoute.to[2]} ${metroRoute.to[3]} ${metroRoute.to[4]}`,
   line:routeLines,durationMin:metroRoute.minutes,
   note:`共 ${metroRoute.stations} 站・轉乘 ${metroRoute.transfers} 次${metroRoute.fare?`・約 ${metroRoute.fare.toLocaleString()} ${metroRoute.currency}`:''}`})
  setMetroMessage('已加入目前 Day。')
 }
 const favorites=trip.favorites||[]
 const isFavorite=(placeId:string)=>favorites.some(f=>f.placeSource===placeId||f.id===placeId)
 const resultToItem=(p:PlaceResult):Item=>({
  id:id(),type:/restaurant|cafe|bakery|food/.test(p.primaryType||'')?'meal':'place',
  start:'09:00',end:'10:00',title:p.name||q||p.display_name.split(',')[0],
  address:p.display_name,lat:Number(p.lat),lon:Number(p.lon),
  openingHours:p.openingHours,phone:p.phone,website:p.website,rating:p.rating,
  userRatingCount:p.userRatingCount,openNow:p.openNow,photoName:p.photoName,
  primaryType:p.primaryType,secondaryName:p.secondaryName,placeSource:p.place_id
 })
 const search=async()=>{
  if(!q.trim()){setMsg('請輸入地點、店名或地址。');return}
  setLoading(true);setMsg('正在搜尋 Google Places…');setPlaces([])
  const aliases:Record<string,string>={'釜山':'부산','首爾':'서울','濟州':'제주','大邱':'대구','仁川':'인천'}
  const queries=Array.from(new Set([
   `${q} ${aliases[trip.destination]||trip.destination}`.trim(),
   `${q} ${trip.destination}`.trim(),
   q.trim()
  ]))
  try{
   for(const full of queries){
    const r=await fetch(`/api/places?q=${encodeURIComponent(full)}&language=${encodeURIComponent(trip.locale)}&destination=${encodeURIComponent(trip.destination)}`)
    const j=await r.json()
    if(r.ok&&Array.isArray(j.results)&&j.results.length){
     setPlaces(j.results)
     setMsg(`找到 ${j.results.length} 筆結果，請確認店名與分店。`)
     setLoading(false)
     return
    }
    if(j.configured===false)setMsg('Google Places 金鑰尚未生效，請確認 Cloudflare Production Secret。')
    else if(j.message)setMsg(j.message)
   }
   setMsg('找不到符合結果，建議輸入完整店名、分店名或當地語言名稱。')
  }catch{
   setMsg('地點搜尋暫時無法使用，仍可使用外部地圖搜尋。')
  }finally{setLoading(false)}
 }
 return <section className="explore-center">
  <div className="explore-tabs">
   <button className={view==='search'?'active':''} onClick={()=>setView('search')}><Search size={17}/>搜尋地點</button>
   <button className={view==='favorites'?'active':''} onClick={()=>setView('favorites')}><Heart size={17}/>我的收藏 <span>{favorites.length}</span></button>
  </div>

  {view==='search'&&<>
   <div className="card feature-card">
    <div className="feature-head"><div><small>PLACE SEARCH</small><h2>地點探索</h2></div><MapPin size={30}/></div>
    <div className="search-row"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="搜尋景點、餐廳、住宿或地址"/><button className="icon" onClick={search}>{loading?<RefreshCw className="spin" size={18}/>:<Search size={18}/>}</button></div>
    <div className="external"><a className="btn" target="_blank" rel="noreferrer" href={gmap(`${q} ${trip.destination}`)}>Google Maps</a><a className="btn" target="_blank" rel="noreferrer" href={nmap(`${q} ${trip.destination}`)}>Naver Map</a></div>
    {msg&&<p className="service-message">{msg}</p>}
   </div>
   <div className="place-list rich-place-results">{places.map(p=>{
    const item=resultToItem(p)
    const favorite=isFavorite(p.place_id)
    return <article className="card place-result-rich" key={p.place_id}>
     {p.photoName&&<img src={`/api/place-photo?name=${encodeURIComponent(p.photoName)}&maxWidth=700`} alt={p.name||''} loading="lazy" onError={e=>e.currentTarget.style.display='none'}/>}
     <div className="place-result-content">
      <small>{/restaurant|food/.test(p.primaryType||'')?'餐廳／甜點':'景點／地點'}</small>
      <h3>{p.name||p.display_name.split(',')[0]}{p.secondaryName&&p.secondaryName!==p.name&&<span className="result-secondary-name">（{p.secondaryName}）</span>}</h3>
      {p.rating!=null&&<div className="result-badges"><span>⭐ {p.rating}</span><span>👥 {p.userRatingCount||0}</span>{p.openNow!=null&&<span>{p.openNow?'● 營業中':'● 目前休息'}</span>}</div>}
      <p><MapPin size={14}/>{p.display_name}</p>
      <div className="result-actions">
       <button onClick={()=>onAdd(item)}><Plus size={16}/>加入 Day</button>
       <button className={favorite?'favorite active':'favorite'} onClick={()=>favorite?onRemoveFavorite(favorites.find(f=>f.placeSource===p.place_id)?.id||''):onFavorite(item)}>{favorite?<HeartOff size={16}/>:<Heart size={16}/>} {favorite?'取消收藏':'收藏'}</button>
      </div>
     </div>
    </article>
   })}</div>

   <div className="card feature-card metro-planner">
    <div className="feature-head"><div><small>METRO PLANNER</small><h2>地鐵雙向導航</h2><p>{metroCity||trip.destination}・中文／當地語言／英文皆可搜尋</p></div><span className="bigemoji">🚇</span></div>

    <div className="metro-route-inputs">
     <div className="metro-point">
      <span className="metro-dot start">起</span>
      <div className="metro-search-box">
       <label>起點站</label>
       <input value={metroFromQuery} onChange={e=>{setMetroFromQuery(e.target.value);setMetroFrom(null);setMetroRoute(null)}} placeholder="例如：西面、서면、Seomyeon"/>
       {metroFromQuery&&!metroFrom&&fromSuggestions.length>0&&<div className="metro-suggestions">{fromSuggestions.map(s=><button type="button" key={`from-${s.join('-')}`} onClick={()=>chooseMetroStation('from',s)}><span><b>{s[2]}</b><small>{s[3]}・{s[4]}</small></span><em>{s[1]}</em></button>)}</div>}
      </div>
     </div>

     <button className="metro-swap" type="button" onClick={swapMetro} aria-label="交換起點與終點">⇅</button>

     <div className="metro-point">
      <span className="metro-dot end">迄</span>
      <div className="metro-search-box">
       <label>終點站</label>
       <input value={metroToQuery} onChange={e=>{setMetroToQuery(e.target.value);setMetroTo(null);setMetroRoute(null)}} placeholder="例如：海雲台、해운대、Haeundae"/>
       {metroToQuery&&!metroTo&&toSuggestions.length>0&&<div className="metro-suggestions">{toSuggestions.map(s=><button type="button" key={`to-${s.join('-')}`} onClick={()=>chooseMetroStation('to',s)}><span><b>{s[2]}</b><small>{s[3]}・{s[4]}</small></span><em>{s[1]}</em></button>)}</div>}
      </div>
     </div>
    </div>

    <div className="metro-plan-actions">
     <label>預計出發時間<input type="time" value={metroStart} onChange={e=>setMetroStart(e.target.value)}/></label>
     <button className="btn primary" type="button" onClick={searchMetroRoute}><Search size={17}/>計算路線</button>
    </div>
    {metroMessage&&<p className="service-message">{metroMessage}</p>}

    {metroRoute&&<article className="metro-route-result">
     <header>
      <div><small>ROUTE RESULT</small><h3>{metroRoute.from[2]} → {metroRoute.to[2]}</h3></div>
      <strong>約 {metroRoute.minutes} 分鐘</strong>
     </header>
     <div className="metro-summary">
      <span><b>{metroRoute.stations}</b>站</span>
      <span><b>{metroRoute.transfers}</b>次轉乘</span>
      <span><b>{metroStart}</b>出發</span>
      <span><b>{addClockMinutes(metroStart,metroRoute.minutes)}</b>抵達</span>
      {metroRoute.fare>0&&<span><b>{metroRoute.fare.toLocaleString()}</b>{metroRoute.currency}</span>}
     </div>
     <div className="metro-segments">{metroRoute.segments.map((segment,index)=><div className="metro-segment" key={`${segment.line}-${index}`}>
      <span className="metro-line-badge">{segment.line}</span>
      <div><b>{segment.from}</b><i>↓ 搭乘 {segment.stops} 站</i><b>{segment.to}</b></div>
      {index<metroRoute.segments.length-1&&<em>轉乘</em>}
     </div>)}</div>
     <p className="metro-estimate-note">時間與票價為路線規劃估算，實際班距、轉乘步行及票價請以當地交通資訊為準。</p>
     <div className="metro-result-actions">
      <a className="btn" target="_blank" rel="noreferrer" href={gmap(`${metroRoute.from[4]} Station to ${metroRoute.to[4]} Station transit`)}>Google Maps</a>
      {metroRoute.city==='釜山'&&<a className="btn" target="_blank" rel="noreferrer" href={nmap(`${metroRoute.from[3]} ${metroRoute.to[3]} 지하철`)}>Naver Map</a>}
      <button className="btn yellow" type="button" onClick={addMetroRoute}><Plus size={17}/>加入目前 Day</button>
     </div>
    </article>}
   </div>
  </>}

  {view==='favorites'&&<section className="favorite-center">
   <article className="card favorite-summary"><div><small>MY FAVORITES</small><h2>我的收藏</h2><p>{trip.destination}・共 {favorites.length} 個地點</p></div><Heart size={34}/></article>
   {favorites.length===0?<article className="card favorite-empty"><Heart size={32}/><h3>還沒有收藏地點</h3><p>搜尋店家或在行程卡右上角「⋯」中加入收藏。</p><button className="btn primary" onClick={()=>setView('search')}>開始搜尋</button></article>:
   <div className="favorite-grid">{favorites.map(f=><article className="card favorite-card" key={f.id}>
    {f.photoName&&<img src={`/api/place-photo?name=${encodeURIComponent(f.photoName)}&maxWidth=700`} alt={f.title} loading="lazy" onError={e=>e.currentTarget.style.display='none'}/>}
    <div>
     <span className="favorite-type">{placeCategory(f).emoji} {placeCategory(f).label}</span>
     <h3>{f.title}{f.secondaryName&&f.secondaryName!==f.title&&<span className="result-secondary-name">（{f.secondaryName}）</span>}</h3>
     {f.rating!=null&&<p className="favorite-rating">⭐ {f.rating}・{f.userRatingCount||0} 則{f.openNow===true?'・營業中':f.openNow===false?'・目前休息':''}</p>}
     {f.address&&<p className="favorite-address"><MapPin size={14}/>{shortAddress(f.address)}</p>}
     <div className="favorite-actions">
      <button onClick={()=>onAdd({...structuredClone(f),id:id(),start:'09:00',end:'10:00'})}><Plus size={16}/>加入 Day</button>
      <button onClick={()=>window.open(gmap(f.address||f.title),'_blank')}><Navigation size={16}/>導航</button>
      <button className="remove" onClick={()=>onRemoveFavorite(f.id)}><Trash2 size={16}/></button>
     </div>
    </div>
   </article>)}</div>}
  </section>}
 </section>
}


const currencyDigits=(c:string)=>c==='KRW'||c==='JPY'?0:2
const money=(n:number,c:string)=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:c,maximumFractionDigits:currencyDigits(c)}).format(Number.isFinite(n)?n:0)

function WalletCenter({trip,onChange,readOnly=false}:{trip:Trip,onChange:(w:WalletData)=>void;readOnly?:boolean}){
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
 return <section className={`wallet-center ${readOnly?'readonly-wallet':''}`}>
  <article className="card wallet-hero"><div><small>TRAVEL WALLET</small><h2>旅行錢包</h2><p>{trip.destination}・{trip.currency}</p></div><div><small>目前總支出</small><strong>{money(totalTwd,'TWD')}</strong><span>預算 {wallet.budgetTwd?Math.round(totalTwd/wallet.budgetTwd*100):0}%</span></div></article>
  <article className="card rate-card"><div className="feature-head"><div><small>EXCHANGE RATE</small><h2>雙向匯率換算</h2></div><button className="icon" onClick={()=>loadRate(true)}><RefreshCw size={18}/></button></div><div className="rate-grid"><div><label>金額<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><select value={from} onChange={e=>setFrom(e.target.value)}><option>{trip.currency}</option><option>TWD</option><option>USD</option><option>EUR</option><option>JPY</option><option>KRW</option></select></div><button className="swap" onClick={swap}>⇄</button><div><label>換算結果<input readOnly value={rate?converted.toFixed(currencyDigits(to)):''}/></label><select value={to} onChange={e=>setTo(e.target.value)}><option>TWD</option><option>{trip.currency}</option><option>USD</option><option>EUR</option><option>JPY</option><option>KRW</option></select></div></div><div className="amount-shortcuts">{(trip.currency==='KRW'?[1000,5000,10000,30000,50000,100000]:trip.currency==='JPY'?[100,500,1000,3000,5000,10000]:[10,20,50,100,200,500]).map(v=><button key={v} onClick={()=>{setFrom(trip.currency);setTo('TWD');setAmount(String(v))}}>{new Intl.NumberFormat('zh-TW').format(v)} {trip.currency}</button>)}</div><p className="rate-status">{rate?`1 ${from} ≈ ${rate.toFixed(6)} ${to}・資料日期 ${rateDate}・${rateMsg}`:rateMsg||'正在取得匯率…'}</p></article>
  <article className="card budget-card"><div className="feature-head"><div><small>BUDGET</small><h2>旅行預算</h2></div><span>{wallet.budgetTwd?`${Math.max(0,Math.round(100-totalTwd/wallet.budgetTwd*100))}% 剩餘`:'尚未設定'}</span></div><label>總預算（台幣）<input readOnly={readOnly} type="number" min="0" value={wallet.budgetTwd||''} onChange={e=>!readOnly&&onChange({...wallet,budgetTwd:Number(e.target.value)||0})}/></label><label>海外刷卡手續費（%）<input readOnly={readOnly} type="number" min="0" step="0.1" value={wallet.overseasFee} onChange={e=>!readOnly&&onChange({...wallet,overseasFee:Number(e.target.value)||0})}/></label></article>
  <article className="card travelers-card"><div className="feature-head"><div><small>TRAVELERS</small><h2>旅伴</h2></div><span>{wallet.travelers.length} 人</span></div>{!readOnly&&<div className="traveler-add"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="輸入旅伴姓名"/><button className="btn primary" onClick={addTraveler}><Plus size={17}/>新增</button></div>}<div className="traveler-chips">{wallet.travelers.map(t=><span key={t.id}>{t.name}{!readOnly&&<button onClick={()=>removeTraveler(t.id)}>×</button>}</span>)}</div></article>
  <div className="wallet-section-head"><div><small>EXPENSES</small><h2>消費紀錄</h2></div>{!readOnly&&<button className="btn primary" onClick={()=>setExpenseOpen(true)}><Plus size={17}/>新增消費</button>}</div>
  <div className="expense-list">{wallet.expenses.length?wallet.expenses.map(e=><article className="card expense-row" key={e.id}><div><small>{e.date}・{e.category}</small><h3>{e.title}</h3><p>{wallet.travelers.find(t=>t.id===e.payerId)?.name||'未指定'}先付款・{e.participantIds.length}人分攤</p></div><div><strong>{money(e.amount,e.currency)}</strong>{!readOnly&&<button onClick={()=>removeExpense(e.id)}><Trash2 size={16}/></button>}</div></article>):<p className="empty">還沒有消費紀錄。</p>}</div>
  <article className="card settlement-card"><div className="feature-head"><div><small>SPLIT BILL</small><h2>分帳結算</h2></div></div>{balances.map(b=><div className="balance-row" key={b.id}><div><b>{b.name}</b><small>已付 {money(b.paid,'TWD')}・應分攤 {money(b.share,'TWD')}</small></div><strong className={b.balance>=0?'receive':'pay'}>{b.balance>=0?`應收 ${money(b.balance,'TWD')}`:`應付 ${money(-b.balance,'TWD')}`}</strong></div>)}</article>
  {expenseOpen&&!readOnly&&<ModalShell title="新增消費" onClose={()=>setExpenseOpen(false)}><div className="expense-form"><label>消費名稱<input value={exp.title} onChange={e=>setExp({...exp,title:e.target.value})} placeholder="例如：烤肉晚餐"/></label><div className="two"><label>金額<input type="number" inputMode="decimal" value={exp.amount} onChange={e=>setExp({...exp,amount:e.target.value})}/></label><label>幣別<select value={exp.currency} onChange={e=>setExp({...exp,currency:e.target.value})}><option>{trip.currency}</option><option>TWD</option><option>USD</option></select></label></div><div className="two"><label>付款人<select value={exp.payerId} onChange={e=>setExp({...exp,payerId:e.target.value})}>{wallet.travelers.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label><label>分類<select value={exp.category} onChange={e=>setExp({...exp,category:e.target.value})}><option>餐飲</option><option>交通</option><option>住宿</option><option>門票</option><option>購物</option><option>其他</option></select></label></div><label>日期<input type="date" value={exp.date} onChange={e=>setExp({...exp,date:e.target.value})}/></label><fieldset><legend>參與分帳的人</legend>{wallet.travelers.map(t=><label className="person-check" key={t.id}><input type="checkbox" checked={exp.participantIds.includes(t.id)} onChange={e=>setExp({...exp,participantIds:e.target.checked?[...exp.participantIds,t.id]:exp.participantIds.filter(x=>x!==t.id)})}/>{t.name}</label>)}</fieldset><label>備註<textarea rows={3} value={exp.note} onChange={e=>setExp({...exp,note:e.target.value})}/></label><div className="sticky-actions"><button className="btn" onClick={()=>setExpenseOpen(false)}>取消</button><button className="btn primary" onClick={addExpense}>儲存消費</button></div></div></ModalShell>}
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


function TransitCenter({trip,onAdd}:{trip:Trip,onAdd:(item:Item)=>void}){
 const [mode,setMode]=useState<TransportMode>('metro'),[from,setFrom]=useState(''),[to,setTo]=useState('')
 const [start,setStart]=useState('09:00'),[end,setEnd]=useState('09:30'),[duration,setDuration]=useState('30')
 const [distance,setDistance]=useState(''),[fare,setFare]=useState(''),[line,setLine]=useState(''),[note,setNote]=useState('')
 const add=()=>{if(!from.trim()&&!to.trim())return alert('請至少輸入出發地或抵達地。');onAdd({id:id(),type:mode==='flight'?'flight':'transport',start,end,title:`${modeLabel[mode]}：${from||'出發地'} → ${to||'抵達地'}`,transportMode:mode,from,to,durationMin:duration?Number(duration):undefined,distanceKm:distance?Number(distance):undefined,line:line||undefined,note:[fare&&`預估費用：${fare} ${trip.currency}`,note].filter(Boolean).join('\n')})}
 const g=()=>window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode==='walk'?'walking':mode==='car'||mode==='taxi'?'driving':'transit'}`,'_blank')
 const n=()=>window.open(`https://map.naver.com/p/directions/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,'_blank')
 return <section className="transit-center"><article className="card transit-hero"><div className="feature-head"><div><small>SMART TRANSIT</small><h2>智慧交通中心</h2></div><span>{modeEmoji[mode]}</span></div><p>建立交通卡後可直接加入目前 Day，並可開啟地圖導航。</p></article><article className="card transit-builder"><label>交通方式<select value={mode} onChange={e=>setMode(e.target.value as TransportMode)}>{Object.entries(modeLabel).map(([k,v])=><option key={k} value={k}>{modeEmoji[k as TransportMode]} {v}</option>)}</select></label><div className="transit-two"><label>出發地<input value={from} onChange={e=>setFrom(e.target.value)} placeholder="例如：西面站"/></label><label>抵達地<input value={to} onChange={e=>setTo(e.target.value)} placeholder="例如：海雲台站"/></label></div><div className="transit-two"><label>開始時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={start} onChange={e=>setStart(e.target.value)}/></div></label><label>結束時間<div className="date-time-field"><Clock3 size={18}/><input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></div></label></div><div className="transit-three"><label>時間（分鐘）<input type="number" min="0" value={duration} onChange={e=>setDuration(e.target.value)}/></label><label>距離（公里）<input type="number" min="0" step="0.1" value={distance} onChange={e=>setDistance(e.target.value)}/></label><label>費用（{trip.currency}）<input type="number" min="0" value={fare} onChange={e=>setFare(e.target.value)}/></label></div><label>路線／車次<input value={line} onChange={e=>setLine(e.target.value)} placeholder="例如：2號線、KTX 105"/></label><label>備註<textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="月台、出口、轉乘或集合資訊"/></label><div className="transit-actions"><button className="btn" onClick={g} disabled={!from||!to}>Google Maps</button><button className="btn" onClick={n} disabled={!from||!to}>Naver Map</button><button className="btn primary" onClick={add}><Plus size={17}/>加入目前 Day</button></div></article></section>
}


const placeCategory=(item:Item)=>{
 const t=(item.primaryType||'').toLowerCase()
 if(item.type==='meal'){
  if(/cafe|coffee/.test(t))return {emoji:'☕',label:'咖啡'}
  if(/bakery|dessert/.test(t))return {emoji:'🧁',label:'甜點'}
  return {emoji:'🍽️',label:'餐廳'}
 }
 if(item.type==='hotel')return {emoji:'🏨',label:'住宿'}
 if(/museum|tourist|park|temple|church|landmark/.test(t))return {emoji:'🏛️',label:'景點'}
 if(/shopping|store|mall/.test(t))return {emoji:'🛍️',label:'購物'}
 return {emoji:'📍',label:'景點'}
}
const shortAddress=(address='')=>{
 if(!address)return ''
 const parts=address.split(',').map(x=>x.trim()).filter(Boolean)
 return parts.slice(0,3).join(', ')
}
const todayHours=(hours='')=>{
 if(!hours)return ''
 const labels=['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
 const english=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
 const korean=['일요일','월요일','화요일','수요일','목요일','금요일','토요일']
 const day=new Date().getDay()
 const segments=hours.split('／')
 const found=segments.find(s=>s.includes(labels[day])||s.includes(english[day])||s.includes(korean[day]))
 return found||segments[0]||''
}
function PlaceCardDetails({item}:{item:Item}){
 const [showAddress,setShowAddress]=useState(false)
 const [showHours,setShowHours]=useState(false)
 const category=placeCategory(item)
 const query=item.address||item.title
 const photoUrl=item.photoName?`/api/place-photo?name=${encodeURIComponent(item.photoName)}&maxWidth=900`:'' 
 const google=()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,'_blank')
 const naver=()=>window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`,'_blank')
 return <div className="smart-place-card">
  {photoUrl&&<div className="place-photo-wrap">
   <img src={photoUrl} alt={item.title} loading="lazy" onError={e=>{(e.currentTarget.parentElement as HTMLElement).style.display='none'}}/>
  </div>}
  <div className="place-card-head">
   <span className="place-category-badge">{category.emoji} {category.label}</span>
   <h3 className="place-title">{item.title}{item.secondaryName&&item.secondaryName!==item.title&&<span>（{item.secondaryName}）</span>}</h3>
  </div>
  {item.rating!=null&&<div className="place-badges">
   <span>⭐ {item.rating}</span>
   <span>👥 {item.userRatingCount||0}則</span>
   {item.openNow!=null&&<span className={item.openNow?'open':'closed'}>{item.openNow?'● 營業中':'● 目前休息'}</span>}
  </div>}
  {item.address&&<div className="place-detail-row"><MapPin size={16}/><div><b className={showAddress?'':'address-clamp'}>{showAddress?item.address:shortAddress(item.address)}</b>{item.address!==shortAddress(item.address)&&<button onClick={()=>setShowAddress(!showAddress)}>{showAddress?'收合地址':'查看完整地址'}</button>}</div></div>}
  {item.openingHours&&<div className="place-detail-row"><Clock3 size={16}/><div><b>{showHours?item.openingHours:todayHours(item.openingHours)}</b><button onClick={()=>setShowHours(!showHours)}>{showHours?'收合營業時間':'顯示完整營業時間'}</button></div></div>}
  {item.phone&&<a className="place-phone" href={`tel:${item.phone}`}><Phone size={16}/>{item.phone}</a>}
  <div className="place-map-actions">
   <button onClick={google}><Navigation size={16}/>Google Maps</button>
   <button onClick={naver}><Compass size={16}/>NAVER Map</button>
  </div>
 </div>
}

function SmartItemMenu({item,index,total,isFavorite,onClose,onEdit,onCopy,onUp,onDown,onDelete,onFavorite,onRefreshFlight}:{item:Item,index:number,total:number,isFavorite:boolean,onClose:()=>void,onEdit:()=>void,onCopy:()=>void,onUp:()=>void,onDown:()=>void,onDelete:()=>void,onFavorite:()=>void,onRefreshFlight:()=>void}){
 const isPlace=item.type==='place'||item.type==='meal'||item.type==='hotel'
 const isFlight=item.type==='flight'
 const query=item.address||item.title
 const openGoogle=()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,'_blank')
 const openNaver=()=>window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`,'_blank')
 const openWebsite=()=>item.website&&window.open(item.website.startsWith('http')?item.website:`https://${item.website}`,'_blank')
 const call=()=>item.phone&&(location.href=`tel:${item.phone}`)
 return <ModalShell title={item.title} onClose={onClose}>
  <div className="smart-menu">
   {isPlace&&<><button onClick={openGoogle}><Navigation/>Google Maps 導航</button><button onClick={openNaver}><Compass/>Naver Map 搜尋</button>{item.phone&&<button onClick={call}><Phone/>撥打店家電話</button>}{item.website&&<button onClick={openWebsite}><Globe2/>開啟官方網站</button>}<button onClick={onEdit}><RefreshCw/>更新地址與營業時間</button><button onClick={onFavorite}>{isFavorite?<HeartOff/>:<Heart/>}{isFavorite?'取消收藏':'加入我的收藏'}</button><button><ImagePlus/>加入照片</button><button><ReceiptText/>記錄消費</button><button><Ticket/>加入票券</button></>}
   {isFlight&&<><button onClick={onRefreshFlight}><RefreshCw/>更新即時航班資料</button><button onClick={onEdit}><Plane/>航班與航廈資訊</button><button onClick={onEdit}><Ticket/>登機證與座位資料</button><button onClick={onEdit}><NotebookPen/>行李與備註</button></>}
   {!isPlace&&!isFlight&&<button onClick={onEdit}><NotebookPen/>查看與編輯詳細資料</button>}
   <div className="smart-menu-divider"/>
   <button onClick={onEdit}><Pencil/>編輯</button>
   <button onClick={onCopy}><Copy/>複製到目前 Day</button>
   <button disabled={index===0} onClick={onUp}><ArrowUp/>上移</button>
   <button disabled={index===total-1} onClick={onDown}><ArrowDown/>下移</button>
   <button className="danger" onClick={onDelete}><Trash2/>刪除</button>
  </div>
 </ModalShell>
}


const flightStatusClass=(status='')=>{
 const s=status.toLowerCase()
 if(/cancel|divert/.test(s))return 'danger'
 if(/delay/.test(s))return 'warning'
 if(/arrived|departed|enroute/.test(s))return 'success'
 if(/boarding|checkin|gateclosed/.test(s))return 'boarding'
 return 'neutral'
}
const flightChecklistDefaults=[
 '確認護照與簽證',
 '完成線上報到',
 '確認行李限重',
 '確認航廈與登機門',
 '下載或截圖登機證'
]

const flightDepartureDate=(item:Item)=>{
 if(item.departureScheduled){
  const d=new Date(item.departureScheduled)
  if(!Number.isNaN(d.getTime()))return d
 }
 if(item.flightDate){
  const [h,m]=(item.start||'00:00').split(':').map(Number)
  const d=new Date(`${item.flightDate}T00:00:00`)
  d.setHours(h||0,m||0,0,0)
  return d
 }
 return null
}
const flightCountdown=(item:Item)=>{
 const d=flightDepartureDate(item)
 if(!d)return {label:'尚未設定日期',urgent:false,past:false,hours:0}
 const diff=d.getTime()-Date.now()
 const hours=Math.floor(diff/3600000)
 const days=Math.floor(hours/24)
 if(diff<0)return {label:'已過起飛時間',urgent:false,past:true,hours}
 if(hours<6)return {label:`${Math.max(0,hours)} 小時內起飛`,urgent:true,past:false,hours}
 if(days===0)return {label:`今天 ${item.start} 起飛`,urgent:true,past:false,hours}
 if(days===1)return {label:`明天 ${item.start} 起飛`,urgent:true,past:false,hours}
 return {label:`還有 ${days} 天出發`,urgent:false,past:false,hours}
}
const airportArrivalAdvice=(item:Item)=>{
 const d=flightDepartureDate(item)
 if(!d)return ''
 const international=true
 const hoursBefore=international?3:2
 const arrive=new Date(d.getTime()-hoursBefore*3600000)
 return `建議 ${arrive.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})} ${arrive.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})} 前抵達機場`
}
const checkInAdvice=(item:Item)=>{
 const d=flightDepartureDate(item)
 if(!d)return ''
 const open=new Date(d.getTime()-48*3600000)
 const close=new Date(d.getTime()-90*60000)
 return `線上報到建議：${open.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})} ${open.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})} 起，最晚起飛前 90 分鐘完成`
}
const downloadFlightICS=(item:Item)=>{
 const start=flightDepartureDate(item)
 if(!start){alert('這筆航班缺少日期或時間。');return}
 let end:Date
 if(item.arrivalScheduled){
  end=new Date(item.arrivalScheduled)
  if(Number.isNaN(end.getTime()))end=new Date(start.getTime()+(item.durationMin||180)*60000)
 }else{
  const [eh,em]=(item.end||'00:00').split(':').map(Number)
  end=new Date(start)
  end.setHours(eh||0,em||0,0,0)
  if(end<=start)end.setDate(end.getDate()+1)
 }
 const fmt=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')
 const esc=(s='')=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')
 const desc=[
  item.flightStatus&&`狀態：${flightStatusLabel(item.flightStatus)}`,
  item.departureTerminal&&`出發航廈：${item.departureTerminal}`,
  item.departureGate&&`登機門：${item.departureGate}`,
  item.arrivalTerminal&&`抵達航廈：${item.arrivalTerminal}`,
  item.baggageBelt&&`行李轉盤：${item.baggageBelt}`,
  item.aircraftModel&&`機型：${item.aircraftModel}`
 ].filter(Boolean).join('\n')
 const ics=[
  'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Travel Planner Ultimate//Flight//ZH-TW',
  'CALSCALE:GREGORIAN','BEGIN:VEVENT',
  `UID:${item.id}@travel-planner`,
  `DTSTAMP:${fmt(new Date())}`,
  `DTSTART:${fmt(start)}`,
  `DTEND:${fmt(end)}`,
  `SUMMARY:${esc(`${item.airline||''} ${item.flightNo||item.title}`.trim())}`,
  `LOCATION:${esc(`${item.from||''} → ${item.to||''}`)}`,
  `DESCRIPTION:${esc(desc)}`,
  'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:請準備前往機場','END:VALARM',
  'END:VEVENT','END:VCALENDAR'
 ].join('\r\n')
 const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'})
 const url=URL.createObjectURL(blob)
 const a=document.createElement('a')
 a.href=url
 a.download=`${item.flightNo||'flight'}-${item.flightDate||'schedule'}.ics`
 a.click()
 setTimeout(()=>URL.revokeObjectURL(url),1000)
}

const timezoneDifferenceText=(item:Item)=>{
 const parse=(s?:string)=>{if(!s)return null;const m=s.match(/^([+-])(\d{2}):?(\d{2})?$/);if(!m)return null;return (m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0))}
 const a=parse(item.departureUtcOffset),b=parse(item.arrivalUtcOffset)
 if(a==null||b==null||a===b)return ''
 const diff=(b-a)/60
 return `抵達地比出發地${diff>0?'快':'慢'} ${Math.abs(diff)} 小時`
}
function FlightCardDetails({item,onRefresh,refreshing}:{item:Item;onRefresh?:()=>void;refreshing?:boolean}){
 const status=flightStatusLabel(item.flightStatus)
 const updated=item.flightUpdatedAt?new Date(item.flightUpdatedAt).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}):''
 const depCode=item.from?.match(/\b[A-Z]{3}\b/)?.[0]||item.from?.split(' ').at(-1)||'—'
 const arrCode=item.to?.match(/\b[A-Z]{3}\b/)?.[0]||item.to?.split(' ').at(-1)||'—'
 const countdown=flightCountdown(item)
 const checks=item.checks||[]
 const done=checks.filter(c=>c.done).length
 return <div className="saved-flight-card">
  <div className="saved-flight-top">
   <div><span>{item.airline||'航班'}</span><h3>{item.flightNo||item.title}</h3></div>
   <span className={`saved-flight-status ${flightStatusClass(item.flightStatus)}`}>{status}</span>
  </div>
  <div className={`flight-reminder-strip ${countdown.urgent?'urgent':''} ${countdown.past?'past':''}`}>
   <div><CalendarDays size={16}/><b>{item.flightDate?`航班日期：${item.flightDate}`:countdown.label}</b></div>
   <small>{item.flightDate?`${countdown.label}・${airportArrivalAdvice(item)}`:airportArrivalAdvice(item)}</small>
  </div>
  <div className="saved-flight-route">
   <div>
    <b>{depCode}</b>
    <strong>{item.start}</strong>
    <em>{offsetLabel(item.departureUtcOffset)||item.departureTimezone||''}</em>
   </div>
   <div className="saved-flight-path"><Plane size={20}/><span>{item.durationMin?`${Math.floor(item.durationMin/60)}小時${item.durationMin%60}分`:''}</span></div>
   <div>
    <b>{arrCode}</b>
    <strong>{item.end}</strong>
    <em>{offsetLabel(item.arrivalUtcOffset)||item.arrivalTimezone||''}</em>
   </div>
  </div>
  <div className="saved-flight-info compact-info">
   <span><b>航廈</b>{item.departureTerminal?`T${item.departureTerminal}`:'待公布'} → {item.arrivalTerminal?`T${item.arrivalTerminal}`:'待公布'}</span>
   <span><b>登機門</b>{item.departureGate||'待公布'}</span>
   <span><b>行李轉盤</b>{item.baggageBelt||'待公布'}</span>
   <span><b>機型</b>{item.aircraftModel||'待公布'}</span>
  </div>
  {timezoneDifferenceText(item)&&<div className="timezone-reminder"><Clock3 size={14}/>{timezoneDifferenceText(item)}</div>}
  {checks.length>0&&<div className="flight-check-progress">
   <div><span>登機前準備</span><b>{done}/{checks.length}</b></div>
   <div className="flight-progress-track"><i style={{width:`${checks.length?done/checks.length*100:0}%`}}/></div>
   <small>{checkInAdvice(item)}</small>
  </div>}
  <div className="saved-flight-actions">
   <button onClick={()=>downloadFlightICS(item)}><CalendarPlus size={15}/>加入行事曆</button>
   {onRefresh&&item.flightNo&&item.flightDate&&<button onClick={onRefresh} disabled={refreshing}>{refreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>}更新航班</button>}
  </div>
  <div className="saved-flight-footer">
   <small>{updated?`更新於 ${updated}`:item.flightSource||'手動資料'}</small>
  </div>
 </div>
}


const connectorVisual=(current:Item,next?:Item)=>{
 if(current.type==='flight'||next?.type==='flight')return {emoji:'✈️',label:'航班移動',className:'flight'}
 if(current.type==='meal')return {emoji:'🍽️',label:'用餐後前往下一站',className:'meal'}
 if(current.type==='hotel')return {emoji:'🌙',label:'住宿與休息',className:'hotel'}
 if(current.type==='transport'){
  const mode=current.transportMode||'metro'
  const map:Record<TransportMode,{emoji:string;label:string;className:string}>={
   walk:{emoji:'🚶',label:'步行前往下一站',className:'walk'},
   metro:{emoji:'🚇',label:'搭乘地鐵',className:'metro'},
   bus:{emoji:'🚌',label:'搭乘公車',className:'bus'},
   taxi:{emoji:'🚕',label:'搭乘計程車',className:'taxi'},
   car:{emoji:'🚗',label:'自駕前往',className:'car'},
   train:{emoji:'🚆',label:'搭乘火車',className:'train'},
   flight:{emoji:'✈️',label:'搭乘飛機',className:'flight'},
   ferry:{emoji:'⛴️',label:'搭乘渡輪',className:'ferry'}
  }
  return map[mode]
 }
 if(next?.type==='meal')return {emoji:'🍴',label:'前往用餐地點',className:'meal'}
 if(next?.type==='hotel')return {emoji:'🏨',label:'返回住宿',className:'hotel'}
 return {emoji:'📷',label:'前往下一個景點',className:'place'}
}
function ItineraryConnector({current,next}:{current:Item;next?:Item}){
 if(!next)return null
 const visual=connectorVisual(current,next)
 return <div className={`itinerary-connector ${visual.className}`} aria-label={visual.label}>
  <span className="connector-icon" aria-hidden="true">{visual.emoji}</span>
 </div>
}

function TransportDetails({item}:{item:Item}){
 const m=item.transportMode||'metro'
 return <div className="transport-card"><div className="transport-title"><span>{modeEmoji[m]}</span><b>{modeLabel[m]}</b>{item.flightNo&&<strong>{item.flightNo}</strong>}{item.line&&<strong>{item.line}</strong>}</div>{(item.from||item.to)&&<div className="route"><span>{item.from||'出發地'}</span><b>→</b><span>{item.to||'抵達地'}</span></div>}<div className="transport-meta">{item.durationMin!=null&&<span><Clock3 size={15}/>{item.durationMin} 分鐘</span>}{item.distanceKm!=null&&<span><Ruler size={15}/>{item.distanceKm} 公里</span>}</div></div>
}


function MemoriesCenter({trip,readOnly,onToggle,onSaveMemory}:{trip:Trip;readOnly:boolean;onToggle:(dayId:string,itemId:string)=>void;onSaveMemory:(dayId:string,memory:DayMemory)=>void}){
 const [selectedDay,setSelectedDay]=useState<string>('all')
 const [replayIndex,setReplayIndex]=useState(-1)
 const [draft,setDraft]=useState<DayMemory>({note:'',rating:5,photos:[]})
 const days=selectedDay==='all'?trip.days:trip.days.filter(day=>day.id===selectedDay)
 const points=days.flatMap(day=>day.items.filter(item=>item.lat!=null&&item.lon!=null).map(item=>({day,item,lat:Number(item.lat),lon:Number(item.lon)})))
 const minLat=Math.min(...points.map(point=>point.lat),trip.lat-0.01)
 const maxLat=Math.max(...points.map(point=>point.lat),trip.lat+0.01)
 const minLon=Math.min(...points.map(point=>point.lon),trip.lon-0.01)
 const maxLon=Math.max(...points.map(point=>point.lon),trip.lon+0.01)
 const xy=(lat:number,lon:number)=>({
  x:8+84*((lon-minLon)/Math.max(.0001,maxLon-minLon)),
  y:8+74*(1-(lat-minLat)/Math.max(.0001,maxLat-minLat))
 })
 const mapped=points.map((point,index)=>({...point,...xy(point.lat,point.lon),index}))
 const selected=selectedDay==='all'?null:trip.days.find(day=>day.id===selectedDay)
 const memory=selected?(trip.memories?.[selected.id]||{note:'',rating:5,photos:[]}):null
 useEffect(()=>{if(memory)setDraft({...memory,photos:[...(memory.photos||[])]})},[selectedDay])
 useEffect(()=>{
  if(replayIndex<0)return
  if(replayIndex>=mapped.length){setReplayIndex(-1);return}
  const timer=window.setTimeout(()=>setReplayIndex(value=>value+1),850)
  return()=>window.clearTimeout(timer)
 },[replayIndex,mapped.length])
 const stats=useMemo(()=>{
  const all=trip.days.flatMap(day=>day.items)
  return{
   places:all.filter(item=>item.type==='place').length,
   meals:all.filter(item=>item.type==='meal').length,
   transport:all.filter(item=>item.type==='transport').length,
   flights:all.filter(item=>item.type==='flight').length,
   completed:all.filter(item=>item.completed).length,
   distance:Math.round(all.reduce((sum,item)=>sum+(item.distanceKm||0),0)*10)/10
  }
 },[trip.updated])
 const addPhotos=(files:FileList|null)=>{
  if(!files)return
  Array.from(files).slice(0,6).forEach(file=>{
   const reader=new FileReader()
   reader.onload=()=>setDraft(current=>({...current,photos:[...current.photos,String(reader.result)].slice(0,12)}))
   reader.readAsDataURL(file)
  })
 }
 return <section className="memories-center">
  <article className="card memories-hero">
   <div><small>TRAVEL MEMORIES</small><h2>旅行足跡</h2><p>{trip.destination}・{trip.start} ～ {trip.end}</p></div>
   <span>🌍</span>
  </article>
  <div className="memory-day-tabs">
   <button className={selectedDay==='all'?'active':''} onClick={()=>setSelectedDay('all')}>整趟旅行</button>
   {trip.days.map((day,index)=><button key={day.id} className={selectedDay===day.id?'active':''} onClick={()=>setSelectedDay(day.id)}>Day {index+1}</button>)}
  </div>
  <article className="card footprint-map-card">
   <header><div><small>FOOTPRINT MAP</small><h3>{selectedDay==='all'?'完整旅行路線':selected?.title}</h3></div><button className="btn yellow" disabled={!mapped.length||replayIndex>=0} onClick={()=>setReplayIndex(0)}>▶ 回放</button></header>
   <div className="footprint-map">
    <svg viewBox="0 0 100 90" preserveAspectRatio="none">
     <defs><pattern id="memory-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth=".2" opacity=".16"/></pattern></defs>
     <rect width="100" height="90" fill="url(#memory-grid)"/>
     {mapped.length>1&&<polyline points={mapped.filter(point=>replayIndex<0||point.index<=replayIndex).map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>}
     {mapped.map(point=><g key={`${point.day.id}-${point.item.id}`} className={`${point.item.completed?'done':''} ${replayIndex===point.index?'playing':''}`} opacity={replayIndex>=0&&point.index>replayIndex?.25:1}>
      <circle cx={point.x} cy={point.y} r="3.5"/><text x={point.x} y={point.y+1.3} textAnchor="middle">{point.index+1}</text>
     </g>)}
    </svg>
    {!mapped.length&&<div className="memory-map-empty">行程地點需要有經緯度，才會顯示足跡路線。</div>}
   </div>
   <div className="footprint-legend">{mapped.map(point=><button key={point.item.id} className={point.item.completed?'completed':''} onClick={()=>!readOnly&&onToggle(point.day.id,point.item.id)}>
    <span>{point.item.completed?'✓':point.index+1}</span><div><b>{point.item.title}</b><small>{point.day.date}・{point.item.start||'未設定時間'}</small></div>
   </button>)}</div>
  </article>
  <section className="memory-stats">
   {[['📍','景點',stats.places],['🍽️','餐飲',stats.meals],['🚇','交通',stats.transport],['✈️','航班',stats.flights],['✅','已完成',stats.completed],['🛣️','紀錄距離',`${stats.distance} km`]].map(([icon,label,value])=><article className="card" key={String(label)}><span>{icon}</span><b>{value}</b><small>{label}</small></article>)}
  </section>
  {selected&&<article className="card memory-journal">
   <header><div><small>DAY MEMORY</small><h3>{selected.date} 回憶日記</h3></div><div className="memory-stars">{[1,2,3,4,5].map(star=><button disabled={readOnly} key={star} onClick={()=>setDraft({...draft,rating:star})}>{star<=draft.rating?'★':'☆'}</button>)}</div></header>
   <textarea readOnly={readOnly} value={draft.note} onChange={event=>setDraft({...draft,note:event.target.value})} placeholder="記錄今天最好玩的事、餐廳心得或旅行感想…"/>
   <div className="memory-photos">{draft.photos.map((photo,index)=><div key={index}><img src={photo}/>{!readOnly&&<button onClick={()=>setDraft({...draft,photos:draft.photos.filter((_,i)=>i!==index)})}>×</button>}</div>)}</div>
   {!readOnly&&<div className="memory-actions"><label className="btn">＋ 加入照片<input hidden multiple type="file" accept="image/*" onChange={event=>addPhotos(event.target.files)}/></label><button className="btn primary" onClick={()=>onSaveMemory(selected.id,draft)}>儲存回憶</button></div>}
  </article>}
 </section>
}

function BottomNav({page,onChange}:{page:AppPage,onChange:(p:AppPage)=>void}){
 const nav:[AppPage,React.ReactNode,string][]=[
  ['home',<House size={20}/>,'首頁'],['itinerary',<CalendarDays size={20}/>,'行程'],
  ['explore',<Compass size={20}/>,'探索'],['wallet',<WalletCards size={20}/>,'錢包'],
  ['memories',<span className="nav-emoji">🌍</span>,'回憶'],['translate',<Languages size={20}/>,'翻譯'],['more',<UserRound size={20}/>,'我的']
 ]
 return <nav className="bottom-nav">{nav.map(([p,icon,label])=><button key={p} className={page===p?'active':''} onClick={()=>onChange(p)}>{icon}<span>{label}</span></button>)}</nav>
}

function ComingPage({icon,title,children}:{icon:React.ReactNode,title:string,children:React.ReactNode}){
 return <section className="page-placeholder card"><div className="placeholder-icon">{icon}</div><h2>{title}</h2>{children}</section>
}

function App(){
 const [remoteShared,setRemoteShared]=useState<Trip|null>(null)
 const [shareLoadError,setShareLoadError]=useState('')
 const [shareLoadNonce,setShareLoadNonce]=useState(0)
 const sharedTrip=legacyShared||remoteShared
 const readOnly=!!sharedTrip||!!shortShareCode
 const [s,setS]=useState<State>(()=>legacyShared?{version:2,active:legacyShared.id,trips:[legacyShared]}:load())
 const [form,setForm]=useState<Trip|true|null>(null)
 const [itemEditor,setItemEditor]=useState<{dayId:string,item?:Item}|null>(null)
 const [tab,setTab]=useState<string|null>(null)
 const [page,setPage]=useState<AppPage>('home')
 const [flightOpen,setFlightOpen]=useState(false)
 const [transitOpen,setTransitOpen]=useState(false)
 const [smartMenu,setSmartMenu]=useState<{dayId:string,item:Item,index:number,total:number}|null>(null)
 const [weatherOpen,setWeatherOpen]=useState(false)
 const [shareOpen,setShareOpen]=useState(false)
 const [shareBusy,setShareBusy]=useState(false)
 const [shareMessage,setShareMessage]=useState('')
 const [shortShareUrl,setShortShareUrl]=useState('')
 const [shareExpiryDays,setShareExpiryDays]=useState(30)
 const [shareScope,setShareScope]=useState<ShareScope>('wallet')
 const [sharePassword,setSharePassword]=useState('')
 const [shareAccessPassword,setShareAccessPassword]=useState('')
 const [shareNeedsPassword,setShareNeedsPassword]=useState(false)
 const [liveShare,setLiveShare]=useState<LiveShareInfo|null>(null)
 const [shareRemoteUpdatedAt,setShareRemoteUpdatedAt]=useState(0)
 const [shareUpdateAvailable,setShareUpdateAvailable]=useState(false)
 const [pendingSharedTrip,setPendingSharedTrip]=useState<Trip|null>(null)
 const [pdfOpen,setPdfOpen]=useState(false)
 const [pdfBusy,setPdfBusy]=useState(false)
 const [pdfMode,setPdfMode]=useState<PdfMode>('app')
 const [pdfOptions,setPdfOptions]=useState<PdfOptions>(defaultPdfOptions)
 const liveSyncTimer=useRef<number|undefined>(undefined)
 const [draggingItem,setDraggingItem]=useState<string|null>(null)
 const dragTimer=useRef<number|undefined>(undefined)
 const dragPointer=useRef<number|undefined>(undefined)
 const [flightNotesCollapsed,setFlightNotesCollapsed]=useState<Record<string,boolean>>(()=>{
  try{return JSON.parse(localStorage.getItem('travel-flight-notes-collapsed')||'{}')}catch{return {}}
 })
 const toggleFlightNotes=(itemId:string)=>{
  setFlightNotesCollapsed(current=>{
   const next={...current,[itemId]:!current[itemId]}
   localStorage.setItem('travel-flight-notes-collapsed',JSON.stringify(next))
   return next
  })
 }
 const [refreshingFlight,setRefreshingFlight]=useState<string|null>(null)
 const [showConnectors,setShowConnectors]=useState(()=>localStorage.getItem('travel-planner-show-connectors')!=='false')
 const active=s.trips.find(t=>t.id===s.active)||null
 const update=(n:State)=>{setS(n);if(!readOnly)save(n)}
 const updateWallet=(w:WalletData)=>{if(!active)return;const t={...active,wallet:w,updated:Date.now()};update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})}
 const toggleCompleted=(dayId:string,itemId:string)=>{
  if(!active||readOnly)return
  const t={...active,days:active.days.map(day=>day.id!==dayId?day:{...day,items:day.items.map(item=>item.id!==itemId?item:{...item,completed:!item.completed,completedAt:!item.completed?Date.now():undefined})}),updated:Date.now()}
  update({...s,trips:s.trips.map(trip=>trip.id===t.id?t:trip)})
 }
 const saveDayMemory=(dayId:string,memory:DayMemory)=>{
  if(!active||readOnly)return
  const t={...active,memories:{...(active.memories||{}),[dayId]:memory},updated:Date.now()}
  update({...s,trips:s.trips.map(trip=>trip.id===t.id?t:trip)})
 }
 const addFavorite=(item:Item)=>{
  if(!active)return
  const favorites=active.favorites||[]
  const exists=favorites.some(f=>(item.placeSource&&f.placeSource===item.placeSource)||(f.title===item.title&&f.address===item.address))
  if(exists){alert('這個地點已經收藏。');return}
  const favorite={...structuredClone(item),id:id()}
  const t={...active,favorites:[...favorites,favorite],updated:Date.now()}
  update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})
  alert('已加入我的收藏')
 }
 const removeFavorite=(favoriteId:string)=>{
  if(!active)return
  const t={...active,favorites:(active.favorites||[]).filter(f=>f.id!==favoriteId),updated:Date.now()}
  update({...s,trips:s.trips.map(x=>x.id===t.id?t:x)})
 }
 const toggleFavorite=(item:Item)=>{
  if(!active)return
  const found=(active.favorites||[]).find(f=>(item.placeSource&&f.placeSource===item.placeSource)||(f.title===item.title&&f.address===item.address))
  if(found)removeFavorite(found.id)
  else addFavorite(item)
 }

 useEffect(()=>{
  if(!shortShareCode)return
  let cancelled=false
  setShareLoadError('')
  fetch(`/api/share/${encodeURIComponent(shortShareCode)}`,{
   headers:shareAccessPassword?{'x-share-password':shareAccessPassword}:{}
  })
   .then(async response=>{
    const body=await response.json().catch(()=>({}))
    if(response.status===401){setShareNeedsPassword(true);throw new Error(body.error||'此分享需要密碼')}
    if(!response.ok)throw new Error(body.error||'找不到這個分享行程')
    setShareNeedsPassword(false)
    return body
   })
   .then(payload=>{
    if(cancelled)return
    const trip=normalizeTrip(payload.trip)
    setRemoteShared(trip)
    setShareRemoteUpdatedAt(Number(payload.updatedAt)||trip.updated||Date.now())
    setShareUpdateAvailable(false)
    setPendingSharedTrip(null)
    setS({version:2,active:trip.id,trips:[trip]})
   })
   .catch(error=>{if(!cancelled)setShareLoadError(error?.message||'分享行程載入失敗')})
  return()=>{cancelled=true}
 },[shareLoadNonce,shareAccessPassword])
 useEffect(()=>{
  if(!shortShareCode||!remoteShared)return
  let cancelled=false
  const checkLatest=async()=>{
   try{
    const response=await fetch(`/api/share/${encodeURIComponent(shortShareCode)}`,{
     headers:shareAccessPassword?{'x-share-password':shareAccessPassword}:{},
     cache:'no-store'
    })
    if(!response.ok)return
    const payload=await response.json()
    const updatedAt=Number(payload.updatedAt)||0
    if(!cancelled&&updatedAt>shareRemoteUpdatedAt){
     setPendingSharedTrip(normalizeTrip(payload.trip))
     setShareUpdateAvailable(true)
    }
   }catch{}
  }
  const timer=window.setInterval(checkLatest,30000)
  const visible=()=>{if(document.visibilityState==='visible')checkLatest()}
  document.addEventListener('visibilitychange',visible)
  return()=>{cancelled=true;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible)}
 },[shortShareCode,remoteShared?.id,shareRemoteUpdatedAt,shareAccessPassword])
 const applySharedUpdate=()=>{
  if(!pendingSharedTrip)return
  setRemoteShared(pendingSharedTrip)
  setShareRemoteUpdatedAt(pendingSharedTrip.updated||Date.now())
  setS({version:2,active:pendingSharedTrip.id,trips:[pendingSharedTrip]})
  setPendingSharedTrip(null)
  setShareUpdateAvailable(false)
 }
 useEffect(()=>{if(active&&!active.days.some(d=>d.id===tab))setTab(active.days[0]?.id||null)},[active?.id,active?.days.length])
 useEffect(()=>{setShortShareUrl('')},[active?.updated,shareScope,sharePassword,shareExpiryDays])
 useEffect(()=>{
  if(!active||readOnly){setLiveShare(null);return}
  const stored=readLiveShare(active.id)
  setLiveShare(stored)
  if(stored){setShortShareUrl(stored.url);setShareScope(stored.scope);setShareExpiryDays(stored.expiresInDays)}
 },[active?.id,readOnly])
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
 const addToCurrentDay=(x:Item)=>{if(!active)return;const target=(active.days.find(d=>d.id===tab)||active.days[0]);if(!target)return;const t={...active,days:active.days.map(d=>d.id===target.id?{...d,items:sortItemsByTime([...d.items,x])}:d),updated:Date.now()};update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)});alert(`已依 ${x.start||'設定時間'} 加入 ${target.title}`)}
 const saveItem=(x:Item)=>{
  if(!active||!itemEditor)return
  const t={...active,days:active.days.map(d=>{
   if(d.id!==itemEditor.dayId)return d
   const items=itemEditor.item?d.items.map(i=>i.id===x.id?x:i):[...d.items,x]
   return {...d,items:sortItemsByTime(items)}
  }),updated:Date.now()}
  update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)});setItemEditor(null)
 }
 const refreshSavedFlight=async(dayId:string,item:Item)=>{
  if(!active||!item.flightNo||!item.flightDate){
   alert('這筆航班缺少航班號或日期，請先編輯補齊。')
   return
  }
  setRefreshingFlight(item.id)
  try{
   const r=await fetch(`/api/flight?flight=${encodeURIComponent(item.flightNo)}&date=${encodeURIComponent(item.flightDate)}`)
   const j=await r.json()
   if(!r.ok||!Array.isArray(j.flights)||!j.flights.length)throw new Error(j.message||'找不到航班資料')
   const matches=j.flights as FlightResult[]
   const oldFrom=item.from||'',oldTo=item.to||''
   const best=matches.find(f=>(f.departure.iata&&oldFrom.includes(f.departure.iata))&&(f.arrival.iata&&oldTo.includes(f.arrival.iata)))||matches[0]
   const dep=best.departure,arr=best.arrival
   const depTime=bestFlightTime(dep),arrTime=bestFlightTime(arr)
   const updated:Item={
    ...item,
    title:`${best.airline||item.airline||''} ${best.flightNo||item.flightNo}`.trim(),
    airline:best.airline||item.airline,flightStatus:best.status,
    start:depTime?timeOnly(depTime):item.start,end:arrTime?timeOnly(arrTime):item.end,
    departureScheduled:depTime||item.departureScheduled,arrivalScheduled:arrTime||item.arrivalScheduled,
    departureTerminal:dep.terminal,arrivalTerminal:arr.terminal,departureGate:dep.gate,
    arrivalGate:arr.gate,baggageBelt:arr.baggage,aircraftModel:best.aircraft,
    departureTimezone:dep.timezone,arrivalTimezone:arr.timezone,
    departureUtcOffset:dep.utcOffset,arrivalUtcOffset:arr.utcOffset,
    aircraftRegistration:best.registration,durationMin:best.durationMin,distanceKm:best.distanceKm,
    from:[dep.airport,dep.iata].filter(Boolean).join(' ')||item.from,
    to:[arr.airport,arr.iata].filter(Boolean).join(' ')||item.to,
    flightUpdatedAt:Date.now(),flightSource:best.source||'AeroDataBox'
   }
   const t={...active,days:active.days.map(d=>d.id===dayId?{...d,items:d.items.map(i=>i.id===item.id?updated:i)}:d),updated:Date.now()}
   update({...s,trips:s.trips.map(z=>z.id===t.id?t:z)})
   alert(`航班已更新：${flightStatusLabel(best.status)}`)
  }catch(e:any){
   alert(`更新失敗：${e?.message||'目前無法取得航班資料'}\n原本資料已保留。`)
  }finally{
   setRefreshingFlight(null)
  }
 }


 const reorderItems=(dayId:string,fromId:string,toId:string)=>{
  if(!active||fromId===toId)return
  const t={...active,days:active.days.map(day=>{
   if(day.id!==dayId)return day
   const items=[...day.items]
   const fromIndex=items.findIndex(item=>item.id===fromId)
   const toIndex=items.findIndex(item=>item.id===toId)
   if(fromIndex<0||toIndex<0)return day
   const [moved]=items.splice(fromIndex,1)
   items.splice(toIndex,0,moved)
   return {...day,items}
  }),updated:Date.now()}
  update({...s,trips:s.trips.map(trip=>trip.id===t.id?t:trip)})
 }
 const beginLongPress=(event:React.PointerEvent,dayId:string,itemId:string)=>{
  if(readOnly||event.pointerType==='mouse'&&event.button!==0)return
  dragPointer.current=event.pointerId
  window.clearTimeout(dragTimer.current)
  dragTimer.current=window.setTimeout(()=>{
   setDraggingItem(itemId)
   try{(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)}catch{}
   if('vibrate' in navigator)navigator.vibrate?.(25)
  },380)
 }
 const moveLongPress=(event:React.PointerEvent,dayId:string)=>{
  if(!draggingItem)return
  event.preventDefault()
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-itinerary-item]')
  const targetId=target?.dataset.itineraryItem
  if(targetId&&targetId!==draggingItem)reorderItems(dayId,draggingItem,targetId)
  const edge=70
  if(event.clientY<edge)window.scrollBy({top:-12,behavior:'auto'})
  else if(event.clientY>window.innerHeight-edge)window.scrollBy({top:12,behavior:'auto'})
 }
 const endLongPress=()=>{
  window.clearTimeout(dragTimer.current)
  dragTimer.current=undefined
  if(draggingItem)setTimeout(()=>setDraggingItem(null),40)
 }
 const sortDayByTime=(dayId:string)=>{
  if(!active)return
  const t={...active,days:active.days.map(day=>day.id===dayId?{...day,items:sortItemsByTime(day.items)}:day),updated:Date.now()}
  update({...s,trips:s.trips.map(trip=>trip.id===t.id?t:trip)})
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
 const createShortReadonlyLink=async()=>{
  if(!active)throw new Error('找不到旅行資料')
  if(shortShareUrl)return shortShareUrl
  setShareBusy(true)
  setShareMessage('正在建立短網址…')
  try{
   const response=await fetch('/api/share',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({trip:compactReadonlyTrip(active,shareScope),expiresInDays:shareExpiryDays,scope:shareScope,password:sharePassword.trim()||undefined})
   })
   const payload=await response.json().catch(()=>({}))
   if(!response.ok)throw new Error(payload.error||'短網址建立失敗')
   const url=`${location.origin}/share/${payload.code}`
   const info:LiveShareInfo={
    code:String(payload.code),url,editToken:String(payload.editToken||''),
    scope:shareScope,expiresInDays:shareExpiryDays,password:sharePassword.trim(),
    updatedAt:Number(payload.updatedAt)||active.updated||Date.now()
   }
   if(info.editToken){writeLiveShare(active.id,info);setLiveShare(info)}
   setShortShareUrl(url)
   setShareMessage(`Live Share 已建立：${url}`)
   return url
  }catch(error:any){
   const fallback=legacyReadonlyShareUrl(active)
   setShareMessage(`短網址服務尚未設定完成，暫時改用舊版唯讀連結。${error?.message?`（${error.message}）`:''}`)
   return fallback
  }finally{
   setShareBusy(false)
  }
 }
 const syncLiveShare=async(trip:Trip,info:LiveShareInfo)=>{
  if(!info.editToken)return
  const response=await fetch(`/api/share/${encodeURIComponent(info.code)}`,{
   method:'PUT',
   headers:{'content-type':'application/json','x-share-edit-token':info.editToken},
   body:JSON.stringify({
    trip:compactReadonlyTrip(trip,info.scope),
    scope:info.scope,
    password:info.password||undefined
   })
  })
  if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||'同步失敗')
  const payload=await response.json()
  const next={...info,updatedAt:Number(payload.updatedAt)||Date.now()}
  writeLiveShare(trip.id,next)
  setLiveShare(next)
 }
 useEffect(()=>{
  if(readOnly||!active||!liveShare||active.id!==s.active)return
  window.clearTimeout(liveSyncTimer.current)
  liveSyncTimer.current=window.setTimeout(()=>{
   syncLiveShare(active,liveShare).catch(()=>{})
  },1400)
  return()=>window.clearTimeout(liveSyncTimer.current)
 },[active?.updated,liveShare?.code,readOnly])
 const updateLiveShareNow=async()=>{
  if(!active||!liveShare)return
  setShareBusy(true);setShareMessage('正在同步最新旅行資料…')
  try{await syncLiveShare(active,liveShare);setShareMessage('分享連結已同步到最新內容。')}
  catch(error:any){setShareMessage(error?.message||'同步失敗')}
  finally{setShareBusy(false)}
 }
 const copyReadonlyLink=async()=>{
  try{
   const url=await createShortReadonlyLink()
   await navigator.clipboard.writeText(url)
   setShareMessage(`唯讀連結已複製：${url}`)
  }catch(error:any){
   setShareMessage(error?.message||'複製連結失敗')
  }
 }
 const shareReadonlyLink=async()=>{
  if(!active)return
  const url=await createShortReadonlyLink()
  try{
   if(navigator.share)await navigator.share({title:active.name,text:`查看「${active.name}」完整旅行行程（唯讀）`,url})
   else{await navigator.clipboard.writeText(url);setShareMessage('裝置不支援系統分享，短網址已複製。')}
  }catch(error:any){
   if(error?.name!=='AbortError'){await navigator.clipboard.writeText(url);setShareMessage('LINE 分享未完成，短網址已自動複製，可直接貼到聊天室。')}
  }
 }
 const buildTripPdf=async(options:PdfOptions,mode:PdfMode)=>{
  if(!active)throw new Error('找不到旅行資料')
  const theme=themes.find(item=>item.id===active.theme)||themes[0]
  const colors=theme.colors
  const wallet=active.wallet||defaultWallet()
  const flights=active.days.flatMap(day=>day.items.map(item=>({day,item}))).filter(entry=>entry.item.type==='flight')
  const allChecks=active.days.flatMap(day=>day.items.flatMap(item=>(item.checks||[]).map(check=>({day,item,check}))))
  const expenseTotal=wallet.expenses.reduce((sum,expense)=>sum+Number(expense.amount||0),0)
  const section=(title:string,body:string)=>`<section class="pdf-section"><h2>${escapeHtml(title)}</h2>${body}</section>`
  const itemCard=(item:Item)=>`<article class="pdf-app-card ${escapeHtml(item.type)}">
   <div class="pdf-app-time"><b>${escapeHtml(item.start||'--:--')}</b><span>～</span><b>${escapeHtml(item.end||'--:--')}</b></div>
   <div class="pdf-app-body"><small>${escapeHtml(typeName[item.type])}</small><h3>${escapeHtml(item.title)}</h3>
   ${(item.from||item.to)?`<p class="pdf-route">${escapeHtml(item.from||'')} → ${escapeHtml(item.to||'')}</p>`:''}
   ${item.address?`<p>📍 ${escapeHtml(item.address)}</p>`:''}
   ${options.notes&&item.note?`<p class="pdf-note">${escapeHtml(item.note)}</p>`:''}
   ${options.notes&&item.checks?.length?`<div class="pdf-checks">${item.checks.map(check=>`<span>${check.done?'☑':'☐'} ${escapeHtml(check.text)}</span>`).join('')}</div>`:''}
   </div></article>`
  const cover=options.cover?`<section class="pdf-cover">
   <div class="pdf-cover-mark">TRAVEL PLANNER ULTIMATE</div>
   <div class="pdf-cover-emoji">🧳</div><h1>${escapeHtml(active.name)}</h1>
   <h3>${escapeHtml(active.destination)}</h3><p>${escapeHtml(active.start)} ～ ${escapeHtml(active.end)}</p>
   <div class="pdf-theme-dots">${colors.map(color=>`<i style="background:${color}"></i>`).join('')}</div>
  </section>`:''
  const tripInfo=options.tripInfo?section('旅行資訊',`<div class="pdf-info-grid">
   <div><small>目的地</small><b>${escapeHtml(active.destination)}</b></div>
   <div><small>旅行日期</small><b>${escapeHtml(active.start)} ～ ${escapeHtml(active.end)}</b></div>
   <div><small>幣別</small><b>${escapeHtml(active.currency)}</b></div>
   <div><small>語言</small><b>${escapeHtml(active.language)}</b></div>
   <div><small>行程天數</small><b>${active.days.length} Days</b></div>
   <div><small>主題</small><b>${escapeHtml(theme.name)}</b></div>
  </div>`):''
  const flightHtml=options.flights&&flights.length?section('航班資訊',flights.map(({day,item})=>`<article class="pdf-flight-card">
   <div><small>${escapeHtml(day.date)}</small><h3>✈️ ${escapeHtml(item.flightNo||item.title)}</h3></div>
   <div class="pdf-flight-route"><b>${escapeHtml(item.from||'出發地')}</b><span>${escapeHtml(item.start)} → ${escapeHtml(item.end)}</span><b>${escapeHtml(item.to||'抵達地')}</b></div>
   <p>${[item.departureTerminal&&`出發航廈：${item.departureTerminal}`,item.arrivalTerminal&&`抵達航廈：${item.arrivalTerminal}`,item.baggageBelt&&`行李轉盤：${item.baggageBelt}`].filter(Boolean).map(escapeHtml).join('・')}</p>
  </article>`).join('')):''
  const itinerary=options.itinerary?active.days.map((day,index)=>section(`Day ${index+1}・${day.date}・${day.title}`,
   `<div class="pdf-day-list">${day.items.length?day.items.map(itemCard).join(''):'<p class="pdf-empty">本日尚無行程</p>'}</div>`)).join(''):''
  const notes=options.notes&&allChecks.length?section('待辦與提醒',allChecks.map(({day,item,check})=>`<div class="pdf-todo"><span>${check.done?'☑':'☐'}</span><div><b>${escapeHtml(check.text)}</b><small>${escapeHtml(day.date)}・${escapeHtml(item.title)}</small></div></div>`).join('')):''
  const budget=options.budget?section('旅行預算',`<div class="pdf-budget-grid">
   <div><small>總預算</small><b>NT$ ${wallet.budgetTwd.toLocaleString()}</b></div>
   <div><small>目前花費</small><b>NT$ ${expenseTotal.toLocaleString()}</b></div>
   <div><small>剩餘預算</small><b>NT$ ${Math.max(0,wallet.budgetTwd-expenseTotal).toLocaleString()}</b></div>
   <div><small>旅伴人數</small><b>${wallet.travelers.length} 人</b></div>
  </div>`):''
  const expenses=options.expenses&&wallet.expenses.length?section('錢包與分帳',wallet.expenses.map(expense=>`<article class="pdf-expense">
   <div><small>${escapeHtml(expense.date||'')}</small><h3>${escapeHtml(expense.title||expense.category||'消費')}</h3><p>付款：${escapeHtml(wallet.travelers.find(t=>t.id===expense.payerId)?.name||'未指定')}</p></div>
   <b>${escapeHtml(expense.currency)} ${Number(expense.amount||0).toLocaleString()}</b>
  </article>`).join('')):''
  const host=document.createElement('div')
  host.className=`trip-pdf-document pdf-${mode}`
  host.style.setProperty('--pdf-primary',colors[0])
  host.style.setProperty('--pdf-secondary',colors[1])
  host.style.setProperty('--pdf-accent',colors[2])
  host.innerHTML=cover+tripInfo+flightHtml+itinerary+notes+budget+expenses+
   `<footer>由 Travel Planner Ultimate v3.4.0 製作・${new Date().toLocaleDateString('zh-TW')}</footer>`
  document.body.appendChild(host)
  try{
   const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')])
   const canvas=await html2canvas(host,{scale:mode==='app'?2:1.6,useCORS:true,backgroundColor:'#ffffff',logging:false})
   const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
   const pageWidth=210,pageHeight=297
   const imageWidth=pageWidth
   const imageHeight=canvas.height*imageWidth/canvas.width
   const image=canvas.toDataURL('image/jpeg',0.94)
   let offset=0
   pdf.addImage(image,'JPEG',0,offset,imageWidth,imageHeight)
   let remaining=imageHeight-pageHeight
   while(remaining>0){
    offset=remaining-imageHeight
    pdf.addPage()
    pdf.addImage(image,'JPEG',0,offset,imageWidth,imageHeight)
    remaining-=pageHeight
   }
   return pdf.output('blob')
  }finally{host.remove()}
 }
 const exportTripPdf=async(action:'share'|'download')=>{
  if(!active)return
  setPdfBusy(true)
  try{
   const blob=await buildTripPdf(pdfOptions,pdfMode)
   const safeName=active.name.replace(/[\\/:*?"<>|]/g,'_')
   const file=new File([blob],`${safeName}-旅行手冊.pdf`,{type:'application/pdf'})
   if(action==='share'&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
    await navigator.share({title:`${active.name}旅行手冊`,text:'旅行手冊 PDF',files:[file]})
   }else{
    const url=URL.createObjectURL(blob)
    const anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;anchor.click()
    setTimeout(()=>URL.revokeObjectURL(url),5000)
   }
  }catch(error:any){
   if(error?.name!=='AbortError')alert(`PDF 匯出失敗：${error?.message||'請稍後再試'}`)
  }finally{setPdfBusy(false)}
 }
 const exportTripBackup=()=>{
  if(!active)return
  const blob=new Blob([JSON.stringify(active,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`${active.name.replace(/[\\/:*?"<>|]/g,'_')}.travel.json`;anchor.click()
  setTimeout(()=>URL.revokeObjectURL(url),3000)
 }
 const share=()=>{setShareMessage('');setShareOpen(true)}
 const legacy=()=>{try{const old=JSON.parse(localStorage.getItem(oldKey)||'null');if(!old?.trips?.length)return alert('找不到舊版資料');const trips=old.trips.map((o:any)=>{const t=makeTrip({name:o.tripName,destination:o.destination,start:o.start,end:o.end});t.id=String(o.tripId||id());t.currency=o.currency||t.currency;t.language=o.langName||t.language;t.days=(o.days||[]).map((d:any)=>({id:String(d.id||id()),date:d.date,title:d.title,items:(d.items||[]).map((i:any)=>({id:String(i.id||id()),type:i.type==='transport'?'transport':'place',start:i.startTime||'',end:i.endTime||'',title:i.place||'',note:i.note||''}))}));return t});update({version:2,active:trips[0].id,trips});setTab(trips[0].days[0]?.id||null);alert(`已匯入 ${trips.length} 個旅行`)}catch{alert('匯入失敗')}}

 if(shortShareCode&&!remoteShared){
  return <div className="shared-loading-screen">
   <section className="card shared-loading-card">
    <span className="shared-loading-icon">{shareLoadError?'⚠️':'🧳'}</span>
    <small>TRAVEL PLANNER SHARE</small>
    <h1>{shareLoadError?'無法開啟分享行程':'正在載入唯讀旅行'}</h1>
    <p>{shareLoadError||`分享代碼：${shortShareCode}`}</p>
    {shareNeedsPassword&&<label className="share-unlock-field">分享密碼<input type="password" inputMode="numeric" value={shareAccessPassword} onChange={event=>setShareAccessPassword(event.target.value)} placeholder="輸入分享者設定的密碼"/></label>}
    {shareLoadError&&<button className="btn primary" onClick={()=>setShareLoadNonce(value=>value+1)}>{shareNeedsPassword?'解鎖行程':'重新載入'}</button>}
   </section>
  </div>
 }

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
 const nextFlightCountdown=nextFlight?flightCountdown(nextFlight):null

  const itinerary=<>
   <nav className="day-tabs" aria-label="每日行程分頁">{active.days.map((d,i)=><button key={d.id} className={current?.id===d.id?'active':''} onClick={()=>setTab(d.id)}><small>{d.date.slice(5)}</small><b>Day {i+1}</b></button>)}</nav>
   {current&&<section className="card day single-day"><div className="day-head"><div><small>{new Date(current.date+'T12:00:00').toLocaleDateString('zh-TW',{weekday:'long'})}</small><h2>{current.title}・{current.date.slice(5)}</h2></div>{!readOnly&&<div className="day-head-actions"><button className="icon sort-time-button" title="依時間重新排序" onClick={()=>sortDayByTime(current.id)}>↕</button><button className="icon" onClick={()=>setItemEditor({dayId:current.id})}><Plus/></button></div>}</div>
    <div className="day-summary"><span>📌 {current.items.length} 個安排</span><span>🚉 {transportCount} 段交通</span><span>⏱ {totalDuration} 分鐘通勤</span></div>
    <div className="timeline">{current.items.length?current.items.map((i,itemIndex)=><React.Fragment key={i.id}><article data-itinerary-item={i.id} className={`item ${i.type} ${draggingItem===i.id?'is-dragging':''}`} onPointerDown={event=>beginLongPress(event,current.id,i.id)} onPointerMove={event=>moveLongPress(event,current.id)} onPointerUp={endLongPress} onPointerCancel={endLongPress} onPointerLeave={()=>{if(!draggingItem)window.clearTimeout(dragTimer.current)}}><div className="time">{i.start}<span>～</span>{i.end}</div><div className="body"><div className="item-head"><div><small>{typeName[i.type].toUpperCase()}</small><h3>{i.title}</h3></div>{!readOnly&&<button className="mini-more" aria-label="更多功能" onClick={()=>setSmartMenu({dayId:current.id,item:i,index:itemIndex,total:current.items.length})}><MoreHorizontal size={18}/></button>}</div>{i.type==='transport'&&<TransportDetails item={i}/>}
{i.type==='flight'&&<FlightCardDetails item={i} onRefresh={()=>refreshSavedFlight(current.id,i)} refreshing={refreshingFlight===i.id}/>} {(i.type==='place'||i.type==='meal'||i.type==='hotel')?<PlaceCardDetails item={i}/>:<>{i.address&&<p className="item-address"><MapPin size={14}/>{i.address}</p>}{i.openingHours&&<p className="item-hours"><Clock3 size={14}/>{i.openingHours}</p>}{i.rating!=null&&<p className="item-rating"><Star size={14}/> {i.rating}（{i.userRatingCount||0}）{i.openNow===true?'・營業中':i.openNow===false?'・目前休息':''}</p>}</>}{i.type==='flight'?(i.note||i.checks?.length)?<section className={`flight-notes-panel ${flightNotesCollapsed[i.id]?'collapsed':''}`}>
     <button type="button" className="flight-notes-toggle" onClick={()=>toggleFlightNotes(i.id)} aria-expanded={!flightNotesCollapsed[i.id]}>
      <span><StickyNote size={17}/><b>航班便條與待辦</b>{i.checks?.length?<em>{i.checks.filter(c=>!c.done).length} 項未完成</em>:i.note?<em>有便條</em>:null}</span>
      <span className="flight-collapse-icon">{flightNotesCollapsed[i.id]?'⌄':'⌃'}</span>
     </button>
     {!flightNotesCollapsed[i.id]&&<div className="flight-notes-content">
      {i.note&&i.note.trim()!==i.address?.trim()&&<p className="flight-note-text">{i.note}</p>}
      {i.checks&&i.checks.length>0&&<div className="checks flight-check-list">{i.checks.map(c=><label key={c.id}><input disabled={readOnly} type="checkbox" checked={c.done} onChange={()=>toggle(current.id,i.id,c.id)}/><span>{c.text}</span></label>)}</div>}
     </div>}
    </section>:null:<>{i.note&&i.type!=='note'&&i.note.trim()!==i.address?.trim()&&<p>{i.note}</p>}{i.checks&&i.checks.length>0&&<div className="checks"><div className="note-heading"><StickyNote size={17}/>便條待辦</div>{i.checks.map(c=><label key={c.id}><input disabled={readOnly} type="checkbox" checked={c.done} onChange={()=>toggle(current.id,i.id,c.id)}/><span>{c.text}</span></label>)}</div>}</>}
    </div>{showConnectors&&<ItineraryConnector current={i} next={current.items[itemIndex+1]}/>}</article></React.Fragment>):<p className="empty">這一天還沒有行程，按右上角＋加入。</p>}</div>
    <div className="day-pager"><button className="btn" disabled={idx<=0} onClick={()=>setTab(active.days[idx-1]?.id)}><ChevronLeft size={18}/>前一天</button><span>{idx+1} / {active.days.length}</span><button className="btn" disabled={idx>=active.days.length-1} onClick={()=>setTab(active.days[idx+1]?.id)}>後一天<ChevronRight size={18}/></button></div>
   </section>}
  </>

  return <div className={`app theme-${active.theme}`}>
   {readOnly&&shareUpdateAvailable&&<div className="live-update-banner"><span>📢 分享行程已有更新</span><button onClick={applySharedUpdate}>更新內容</button></div>}
   {readOnly&&<button className="shared-refresh-button" onClick={()=>setShareLoadNonce(value=>value+1)} title="重新整理最新內容">↻</button>}
   <header className="top"><button className="icon" onClick={()=>update({...s,active:null})}><ArrowLeft/></button><div><small>{readOnly?'親友唯讀行程':'旅行控制中心'}</small><h1>{active.name}</h1></div>{!readOnly&&<button className="icon" onClick={()=>setForm(active)}><Palette size={18}/></button>}</header>
   <main className="content trip page-with-nav">
    {page==='home'&&<>
     <section className="cover home-theme-weather" style={active.cover?{backgroundImage:`url(${active.cover})`}:{}}>
 <div className="cover-trip-info"><span>{active.country}</span><h2>{active.destination}</h2><p>{active.start} ～ {active.end}</p><b>{active.currency}・{active.language}</b></div>
 <Weather trip={active} compact/>
</section>
     <section className="control-grid">
      <article className="card control-card hero-control"><small>NEXT TRIP</small><h3>{daysUntil>0?`距離出發還有 ${daysUntil} 天`:daysUntil===0?'今天出發':'旅程進行中／已完成'}</h3><div className="progress"><i style={{width:`${Math.min(100,Math.max(4,completion))}%`}}/></div><span>旅行進度 {completion}%・共 {active.days.length} Days</span></article>
      <article className="card control-card today-card"><CalendarDays size={25}/><small>TODAY PLAN</small><h3>{todayDay?`Day ${todayIndex+1}・${todayDay.date.slice(5)}`:'尚未建立日期'}</h3><span>{todayDay?.items.length||0} 個安排</span><button className="inline-link" onClick={()=>{setTab(todayDay?.id||active.days[0]?.id);setPage('itinerary')}}>查看今日行程 →</button></article>
      <article className={`card control-card flight-home-card ${nextFlightCountdown?.urgent?'urgent':''}`}><Plane size={25}/><small>最近航班</small><h3>{nextFlight?.flightNo||'尚未加入航班'}</h3><span>{nextFlight?`${nextFlight.start} → ${nextFlight.end}・${flightStatusLabel(nextFlight.flightStatus)}`:'可查詢或手動建立航班卡'}</span>{nextFlightCountdown&&<b className="home-flight-countdown">{nextFlightCountdown.label}</b>}<button className="inline-link" onClick={()=>setFlightOpen(true)}>開啟航班中心 →</button></article>
      <article className="card control-card"><WalletCards size={25}/><small>旅行錢包</small><h3>{active.currency}</h3><span>即時匯率、預算與旅伴分帳</span><button className="inline-link" onClick={()=>setPage('wallet')}>開啟旅行錢包 →</button></article>
     </section>

     {!readOnly&&<div className="quick"><button className="btn primary" onClick={share}><Share2 size={18}/>分享行程</button><button className="btn yellow" onClick={()=>setPdfOpen(true)}><FileDown size={18}/>匯出 PDF</button></div>}
    </>}
    {page==='itinerary'&&itinerary}
    {page==='explore'&&<ExploreCenter trip={active} onAdd={addToCurrentDay} onFavorite={addFavorite} onRemoveFavorite={removeFavorite}/>}
    {page==='wallet'&&<WalletCenter trip={active} onChange={updateWallet} readOnly={readOnly}/>}
    {page==='memories'&&<MemoriesCenter trip={active} readOnly={readOnly} onToggle={toggleCompleted} onSaveMemory={saveDayMemory}/>}
    {page==='translate'&&<TranslateCenter trip={active}/>}
    {page==='more'&&<><article className="card connector-setting">
 <div><small>ITINERARY STYLE</small><h3>行程連接小插畫</h3><p>在每個行程之間顯示飛機、餐盤、地鐵等小插畫。</p></div>
 <button className={showConnectors?'toggle-switch active':'toggle-switch'} onClick={()=>{const next=!showConnectors;setShowConnectors(next);localStorage.setItem('travel-planner-show-connectors',String(next))}} aria-label="切換行程小插畫"><i/></button>
</article><section className="tools-grid"><button className="card tool-card" onClick={()=>setForm(active)}><Palette/><b>主題風格</b><span>20 種官方主題</span></button><button className="card tool-card" onClick={()=>setPdfOpen(true)}><FileDown/><b>旅行手冊</b><span>自選內容・App 樣式 PDF</span></button><button className="card tool-card" onClick={()=>setPage('memories')}><span className="tool-emoji">🌍</span><b>旅行足跡</b><span>路線、打卡、統計與回憶日記</span></button><button className="card tool-card" onClick={()=>setFlightOpen(true)}><Plane/><b>航班中心</b><span>查詢或手動建立航班</span></button><button className="card tool-card" onClick={()=>setTransitOpen(true)}><Compass/><b>交通中心</b><span>建立地鐵、公車與步行路線</span></button><button className="card tool-card" onClick={()=>setWeatherOpen(true)}><CloudSun/><b>天氣中心</b><span>七天天氣與手動更新</span></button></section></>}
   </main>
   {shareOpen&&<ModalShell title="分享旅行" onClose={()=>setShareOpen(false)}>
    <section className="share-center">
     <article className="share-intro"><Share2 size={28}/><div><h3>{active.name}</h3><p>建立短網址後，親友只能查看，不能修改你的行程。</p></div></article>
     <label className="share-expiry">分享有效期限<select value={shareExpiryDays} onChange={event=>{setShareExpiryDays(Number(event.target.value));setShortShareUrl('')}}><option value={7}>7 天</option><option value={30}>30 天</option><option value={90}>90 天</option><option value={365}>1 年</option></select></label>
     <fieldset className="share-scope-picker"><legend>親友可以查看的內容</legend>
      <label><input type="radio" name="shareScope" checked={shareScope==='itinerary'} onChange={()=>setShareScope('itinerary')}/><span><b>僅行程</b><small>每日安排、航班、交通與便條</small></span></label>
      <label><input type="radio" name="shareScope" checked={shareScope==='budget'} onChange={()=>setShareScope('budget')}/><span><b>行程＋預算</b><small>包含總預算、旅伴與手續費，不顯示消費明細</small></span></label>
      <label><input type="radio" name="shareScope" checked={shareScope==='wallet'} onChange={()=>setShareScope('wallet')}/><span><b>行程＋完整錢包分帳</b><small>包含每筆支出、付款人、參與者與結算結果</small></span></label>
     </fieldset>
     <label className="share-password-field">分享密碼（選填）<input type="password" inputMode="numeric" maxLength={12} value={sharePassword} onChange={event=>setSharePassword(event.target.value)} placeholder="留空代表不需要密碼"/><small>設定後，親友需輸入密碼才能查看。</small></label>
     {shortShareUrl&&<div className="short-share-preview"><small>唯讀短網址</small><strong>{shortShareUrl}</strong><span>{shareScope==='wallet'?'包含完整錢包與分帳':shareScope==='budget'?'包含預算摘要':'僅包含行程'}・接收者只能觀看。</span></div>}
     {liveShare&&<div className="live-share-status"><span>● LIVE</span><div><b>此連結會自動同步</b><small>最後同步：{new Date(liveShare.updatedAt).toLocaleString('zh-TW')}</small></div><button className="btn" disabled={shareBusy} onClick={updateLiveShareNow}>立即同步</button></div>}
     <button className="share-choice primary" disabled={shareBusy} onClick={shareReadonlyLink}><span>🔗</span><div><b>分享到 LINE／其他 App</b><small>傳送精簡的唯讀連結，對方可完整觀看但不能修改。</small></div></button>
     <button className="share-choice" disabled={shareBusy} onClick={copyReadonlyLink}><span>📋</span><div><b>複製唯讀連結</b><small>LINE 分享中斷時，可直接貼到好友聊天室。</small></div></button>
     <button className="share-choice yellow" onClick={()=>setPdfOpen(true)}><span>📄</span><div><b>PDF 匯出中心</b><small>自由選擇行程、航班、待辦、預算或分帳，並套用 App 主題樣式。</small></div></button>
     <button className="share-choice" onClick={exportTripBackup}><span>📦</span><div><b>匯出旅行備份檔</b><small>保留可再次匯入的完整旅行資料。</small></div></button>
     <button className="share-choice" onClick={()=>setPdfOpen(true)}><span>🖨️</span><div><b>列印旅行手冊</b><small>先選擇內容與樣式，再產生可列印 PDF。</small></div></button>
     {shareMessage&&<p className="share-message">{shareMessage}</p>}
    </section>
   </ModalShell>}
   {pdfOpen&&<ModalShell title="PDF 匯出中心" onClose={()=>!pdfBusy&&setPdfOpen(false)}>
    <section className="pdf-export-center">
     <article className="pdf-export-intro"><span>📖</span><div><h3>{active.name}</h3><p>選擇要放進旅行手冊的內容；預算與分帳預設不匯出。</p></div></article>
     <fieldset className="pdf-option-grid"><legend>匯出內容</legend>
      {([
       ['cover','封面','旅行名稱、目的地與主題色'],
       ['tripInfo','旅行資訊','日期、幣別、語言與天數'],
       ['flights','航班資訊','航班路線、時間、航廈與行李'],
       ['itinerary','每日行程','所有 Day 與 App 卡片式行程'],
       ['notes','便條與待辦','便條內容與待辦勾選狀態'],
       ['budget','預算摘要','總預算、花費與剩餘金額'],
       ['expenses','錢包與分帳','每筆支出與付款人']
      ] as [keyof PdfOptions,string,string][]).map(([key,title,desc])=><label key={key}>
       <input type="checkbox" checked={pdfOptions[key]} onChange={event=>setPdfOptions({...pdfOptions,[key]:event.target.checked})}/>
       <span><b>{title}</b><small>{desc}</small></span>
      </label>)}
     </fieldset>
     <fieldset className="pdf-style-picker"><legend>PDF 樣式</legend>
      <label className={pdfMode==='app'?'selected':''}><input type="radio" checked={pdfMode==='app'} onChange={()=>setPdfMode('app')}/><span>📱</span><div><b>App 手帳樣式</b><small>保留主題色、粗框、卡片與 Timeline 感</small></div></label>
      <label className={pdfMode==='a4'?'selected':''}><input type="radio" checked={pdfMode==='a4'} onChange={()=>setPdfMode('a4')}/><span>📄</span><div><b>A4 列印樣式</b><small>欄位較寬，適合紙本閱讀與裝訂</small></div></label>
     </fieldset>
     <div className="pdf-export-actions">
      <button className="btn primary" disabled={pdfBusy||!Object.values(pdfOptions).some(Boolean)} onClick={()=>exportTripPdf('download')}>{pdfBusy?'正在製作…':'儲存 PDF'}</button>
      <button className="btn yellow" disabled={pdfBusy||!Object.values(pdfOptions).some(Boolean)} onClick={()=>exportTripPdf('share')}>分享 PDF</button>
     </div>
    </section>
   </ModalShell>}
   {weatherOpen&&<ModalShell title="天氣中心" onClose={()=>setWeatherOpen(false)}><Weather trip={active}/></ModalShell>}
   {flightOpen&&<ModalShell title="航班中心" onClose={()=>setFlightOpen(false)}><FlightCenter trip={active} onAdd={x=>{addToCurrentDay(x);setFlightOpen(false)}}/></ModalShell>}
   {transitOpen&&<ModalShell title="智慧交通中心" onClose={()=>setTransitOpen(false)}><TransitCenter trip={active} onAdd={x=>{addToCurrentDay(x);setTransitOpen(false)}}/></ModalShell>}
   {smartMenu&&<SmartItemMenu item={smartMenu.item} index={smartMenu.index} total={smartMenu.total} isFavorite={(active.favorites||[]).some(f=>(smartMenu.item.placeSource&&f.placeSource===smartMenu.item.placeSource)||(f.title===smartMenu.item.title&&f.address===smartMenu.item.address))} onClose={()=>setSmartMenu(null)} onEdit={()=>{setItemEditor({dayId:smartMenu.dayId,item:smartMenu.item});setSmartMenu(null)}} onCopy={()=>{itemAction(smartMenu.dayId,smartMenu.item.id,'copy');setSmartMenu(null)}} onUp={()=>{itemAction(smartMenu.dayId,smartMenu.item.id,'up');setSmartMenu(null)}} onDown={()=>{itemAction(smartMenu.dayId,smartMenu.item.id,'down');setSmartMenu(null)}} onDelete={()=>{itemAction(smartMenu.dayId,smartMenu.item.id,'delete');setSmartMenu(null)}} onFavorite={()=>{toggleFavorite(smartMenu.item);setSmartMenu(null)}} onRefreshFlight={()=>{const x=smartMenu;setSmartMenu(null);refreshSavedFlight(x.dayId,x.item)}}/>}
   <BottomNav page={page} onChange={setPage}/>
   {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
   {itemEditor&&<ItemForm trip={active} initial={itemEditor.item} onSave={saveItem} onClose={()=>setItemEditor(null)}/>}
  </div>
 }

 return <div className="app theme-summer"><header className="dash-head"><span className="stamp">ULTIMATE 3.5.0</span><h1>我的旅行手帳</h1><p>把每一次出發，收進自己的旅行書櫃。</p></header><main className="content"><div className="section"><div><small>MY JOURNEYS</small><h2>旅行書櫃</h2></div><button className="btn primary" onClick={()=>setForm(true)}><Plus size={18}/>新增旅行</button></div>
 {s.trips.length?<div className="grid">{s.trips.map(t=><article className={`trip-card theme-${t.theme}`} key={t.id}><button className="trip-cover" style={t.cover?{backgroundImage:`url(${t.cover})`}:{}} onClick={()=>{update({...s,active:t.id});setTab(t.days[0]?.id||null);setPage('home')}}><div><small>{t.country}</small><b>{t.destination}</b><span>{t.start} ～ {t.end}</span></div></button><div className="trip-info"><div><h3>{t.name}</h3><p>{t.currency}・{t.language}</p><small className="theme-name">{themes.find(x=>x.id===t.theme)?.name}</small></div><div className="icons"><button onClick={()=>setForm(t)}><Pencil size={17}/></button><button onClick={()=>duplicate(t)}><Copy size={17}/></button><button onClick={()=>remove(t)}><Trash2 size={17}/></button></div></div></article>)}</div>:<section className="card empty-home"><div>🧳</div><h2>建立第一本旅行手帳</h2><p>釜山、日本、泰國或任何目的地，都能建立獨立行程。</p><button className="btn primary" onClick={()=>setForm(true)}><Plus/>新增旅行</button><button className="btn" onClick={legacy}><Upload size={17}/>匯入舊版</button></section>}</main>
 {form&&<Form trip={form===true?undefined:form} onSave={saveTrip} onClose={()=>setForm(null)}/>}
 </div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))
