import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './AtlasMap.css'

export type AtlasPointCategory='food'|'cafe'|'attraction'|'shopping'|'hotel'|'airport'|'station'|'transport'|'other'

export type AtlasMapPoint={
 id:string
 title:string
 address?:string
 note?:string
 date:string
 time?:string
 lat:number
 lon:number
 index:number
 completed?:boolean
 rating?:number
 category?:AtlasPointCategory
 categoryLabel?:string
}

type Props={
 points:AtlasMapPoint[]
 selectedId:string|null
 replayIndex:number
 onSelect:(id:string)=>void
}

type ScreenPoint=AtlasMapPoint&{x:number;y:number;hidden:boolean;role:'start'|'stop'|'end'}

const validCoord=(p:AtlasMapPoint)=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180

const categoryVisual:Record<AtlasPointCategory,{emoji:string;label:string}>={
 food:{emoji:'🍜',label:'美食'},
 cafe:{emoji:'☕',label:'咖啡'},
 attraction:{emoji:'🏛️',label:'景點'},
 shopping:{emoji:'🛍️',label:'購物'},
 hotel:{emoji:'🏨',label:'住宿'},
 airport:{emoji:'✈️',label:'機場'},
 station:{emoji:'🚉',label:'車站'},
 transport:{emoji:'🚇',label:'交通'},
 other:{emoji:'📍',label:'地點'}
}

export default function AtlasMap({points,selectedId,replayIndex,onSelect}:Props){
 const hostRef=useRef<HTMLDivElement|null>(null)
 const mapRef=useRef<L.Map|null>(null)
 const [screenPoints,setScreenPoints]=useState<ScreenPoint[]>([])
 const [locating,setLocating]=useState(false)
 const cleanPoints=useMemo(()=>points.filter(validCoord),[points])
 const selectedPoint=screenPoints.find(point=>point.id===selectedId&&!point.hidden)

 const syncOverlay=useCallback(()=>{
  const map=mapRef.current
  if(!map)return
  setScreenPoints(cleanPoints.map((point,position)=>{
   const pixel=map.latLngToContainerPoint([point.lat,point.lon])
   return {
    ...point,
    x:pixel.x,
    y:pixel.y,
    hidden:replayIndex>=0&&point.index>replayIndex,
    role:position===0?'start':position===cleanPoints.length-1&&cleanPoints.length>1?'end':'stop'
   }
  }))
 },[cleanPoints,replayIndex])

 useEffect(()=>{
  if(!hostRef.current||mapRef.current)return
  const map=L.map(hostRef.current,{
   zoomControl:true,
   attributionControl:true,
   scrollWheelZoom:false,
   minZoom:2,
   maxZoom:19,
   zoomAnimation:true,
   fadeAnimation:false,
   markerZoomAnimation:false
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
   maxZoom:19,
   attribution:'© OpenStreetMap contributors',
   crossOrigin:true
  }).addTo(map)
  map.setView([23.7,120.9],6)
  mapRef.current=map
  const refresh=()=>{map.invalidateSize(false);syncOverlay()}
  map.on('move zoom resize viewreset',syncOverlay)
  const timer=window.setTimeout(refresh,180)
  window.addEventListener('resize',refresh)
  return()=>{
   window.clearTimeout(timer)
   window.removeEventListener('resize',refresh)
   map.off('move zoom resize viewreset',syncOverlay)
   map.remove()
   mapRef.current=null
  }
 },[syncOverlay])

 useEffect(()=>{
  const map=mapRef.current
  if(!map)return
  if(cleanPoints.length===1)map.setView([cleanPoints[0].lat,cleanPoints[0].lon],15,{animate:false})
  else if(cleanPoints.length>1){
   map.fitBounds(L.latLngBounds(cleanPoints.map(point=>[point.lat,point.lon] as [number,number])),{
    padding:[44,44],maxZoom:15,animate:false
   })
  }
  window.setTimeout(()=>{map.invalidateSize(false);syncOverlay()},100)
 },[cleanPoints,syncOverlay])

 useEffect(()=>{
  if(!selectedId)return
  const point=cleanPoints.find(item=>item.id===selectedId)
  const map=mapRef.current
  if(!point||!map)return
  map.flyTo([point.lat,point.lon],Math.max(map.getZoom(),15),{duration:.45})
 },[selectedId,cleanPoints])

 const locateMe=()=>{
  const map=mapRef.current
  if(!map||!navigator.geolocation)return
  setLocating(true)
  navigator.geolocation.getCurrentPosition(position=>{
   map.flyTo([position.coords.latitude,position.coords.longitude],15,{duration:.45})
   setLocating(false)
  },()=>{
   setLocating(false)
   window.alert('無法取得目前位置，請確認瀏覽器已允許定位權限。')
  },{enableHighAccuracy:true,timeout:10000,maximumAge:30000})
 }

 const visiblePoints=screenPoints.filter(point=>!point.hidden)
 const route=visiblePoints.map(point=>`${point.x},${point.y}`).join(' ')

 return <div className="atlas-clean-shell">
  <div ref={hostRef} className="atlas-clean-map" aria-label="旅行回憶地圖"/>
  <div className="atlas-clean-overlay">
   {visiblePoints.length>1&&<svg className="atlas-route-layer" aria-hidden="true">
    <polyline className="atlas-route-shadow" points={route}/>
    <polyline className="atlas-route-line" points={route}/>
   </svg>}
   {screenPoints.map(point=>{
    const visual=categoryVisual[point.category||'other']
    const roleLabel=point.role==='start'?'起點':point.role==='end'?'終點':''
    return <button
     key={point.id}
     type="button"
     className={`atlas-clean-pin atlas-clean-${point.role} atlas-category-${point.category||'other'} ${point.completed?'is-complete':''} ${selectedId===point.id?'is-selected':''}`}
     style={{left:point.x,top:point.y,opacity:point.hidden?.22:1}}
     onClick={()=>onSelect(point.id)}
     aria-label={`${roleLabel||visual.label} ${point.title}`}
    ><span className="atlas-pin-icon" aria-hidden="true">{visual.emoji}</span><em>{point.title}</em>{roleLabel&&<i>{roleLabel}</i>}</button>
   })}
   {selectedPoint&&(()=>{
    const visual=categoryVisual[selectedPoint.category||'other']
    const placeRight=selectedPoint.x<210
    const placeBelow=selectedPoint.y<170
    return <article
     className={`atlas-popup ${placeRight?'place-right':'place-left'} ${placeBelow?'place-below':'place-above'}`}
     style={{left:selectedPoint.x,top:selectedPoint.y}}
     role="dialog"
     aria-label={`${selectedPoint.title} 景點資訊`}
    >
     <button className="atlas-popup-close" type="button" onClick={()=>onSelect(selectedPoint.id)} aria-label="關閉資訊">×</button>
     <small>{visual.emoji} {selectedPoint.categoryLabel||visual.label}</small>
     <h4>{selectedPoint.title}</h4>
     <div className="atlas-popup-meta"><b>{selectedPoint.date}</b>{selectedPoint.time&&<span>{selectedPoint.time}</span>}{selectedPoint.rating!=null&&<span>⭐ {selectedPoint.rating}</span>}</div>
     {selectedPoint.address&&<p className="atlas-popup-address">📍 {selectedPoint.address}</p>}
     {selectedPoint.note&&<p className="atlas-popup-note">📝 {selectedPoint.note}</p>}
    </article>
   })()}
  </div>
  <button type="button" className="atlas-clean-locate" onClick={locateMe} disabled={locating}>{locating?'定位中…':'◎ 我的定位'}</button>
 </div>
}
