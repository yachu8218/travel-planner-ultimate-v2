import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './AtlasMap.css'

export type AtlasMapPoint={
 id:string
 title:string
 address?:string
 date:string
 time?:string
 lat:number
 lon:number
 index:number
 completed?:boolean
}

type Props={
 points:AtlasMapPoint[]
 selectedId:string|null
 replayIndex:number
 onSelect:(id:string)=>void
}

type ScreenPoint=AtlasMapPoint&{x:number;y:number;hidden:boolean;role:'start'|'stop'|'end'}

const validCoord=(p:AtlasMapPoint)=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180

export default function AtlasMap({points,selectedId,replayIndex,onSelect}:Props){
 const hostRef=useRef<HTMLDivElement|null>(null)
 const mapRef=useRef<L.Map|null>(null)
 const [screenPoints,setScreenPoints]=useState<ScreenPoint[]>([])
 const [locating,setLocating]=useState(false)
 const cleanPoints=useMemo(()=>points.filter(validCoord),[points])

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

 return <div className="atlas-clean-shell">
  <div ref={hostRef} className="atlas-clean-map" aria-label="旅行回憶地圖"/>
  <div className="atlas-clean-overlay" aria-hidden="true">
   {screenPoints.map(point=>{
    const label=point.role==='start'?'起':point.role==='end'?'終':String(point.index+1)
    return <button
     key={point.id}
     type="button"
     className={`atlas-clean-pin atlas-clean-${point.role} ${point.completed?'is-complete':''} ${selectedId===point.id?'is-selected':''}`}
     style={{left:point.x,top:point.y,opacity:point.hidden?.22:1}}
     onClick={()=>onSelect(point.id)}
     aria-label={`${label} ${point.title}`}
     aria-hidden={false}
    ><span>{label}</span><em>{point.title}</em></button>
   })}
  </div>
  <button type="button" className="atlas-clean-locate" onClick={locateMe} disabled={locating}>{locating?'定位中…':'◎ 我的定位'}</button>
 </div>
}
