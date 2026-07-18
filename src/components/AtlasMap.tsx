import {useEffect, useMemo, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const validCoord=(p:AtlasMapPoint)=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180
const safe=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[char]||char))

function markerIcon(point:AtlasMapPoint,position:number,total:number,selected:boolean,hidden:boolean){
 const role=position===0?'start':position===total-1&&total>1?'end':'stop'
 const label=role==='start'?'起':role==='end'?'終':String(point.index+1)
 return L.divIcon({
  className:'atlas-marker-shell',
  html:`<div class="atlas-marker ${role} ${point.completed?'completed':''} ${selected?'selected':''} ${hidden?'hidden':''}"><span>${label}</span></div>`,
  iconSize:[38,46],iconAnchor:[19,43],popupAnchor:[0,-42]
 })
}

export default function AtlasMap({points,selectedId,replayIndex,onSelect}:Props){
 const hostRef=useRef<HTMLDivElement|null>(null)
 const mapRef=useRef<L.Map|null>(null)
 const layerRef=useRef<L.LayerGroup|null>(null)
 const markersRef=useRef(new Map<string,L.Marker>())
 const [locating,setLocating]=useState(false)
 const cleanPoints=useMemo(()=>points.filter(validCoord),[points])

 useEffect(()=>{
  if(!hostRef.current||mapRef.current)return
  const map=L.map(hostRef.current,{zoomControl:true,attributionControl:true,scrollWheelZoom:false,minZoom:2,maxZoom:19})
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map)
  map.setView([23.7,120.9],6)
  mapRef.current=map
  const resize=()=>map.invalidateSize(false)
  const timer=window.setTimeout(resize,120)
  window.addEventListener('resize',resize)
  return()=>{window.clearTimeout(timer);window.removeEventListener('resize',resize);map.remove();mapRef.current=null}
 },[])

 useEffect(()=>{
  const map=mapRef.current
  if(!map)return
  layerRef.current?.remove()
  const group=L.layerGroup().addTo(map)
  layerRef.current=group
  markersRef.current.clear()
  const visible=cleanPoints.filter(point=>replayIndex<0||point.index<=replayIndex)
  if(visible.length>1){
   L.polyline(visible.map(point=>[point.lat,point.lon] as [number,number]),{color:'#a45a7a',weight:4,opacity:.86,lineCap:'round',lineJoin:'round'}).addTo(group)
  }
  cleanPoints.forEach((point,position)=>{
   const hidden=replayIndex>=0&&point.index>replayIndex
   const marker=L.marker([point.lat,point.lon],{icon:markerIcon(point,position,cleanPoints.length,selectedId===point.id,hidden),opacity:hidden?.28:1})
    .addTo(group)
    .bindPopup(`<div class="atlas-popup"><b>${safe(point.title)}</b><small>${safe(point.date)}・${safe(point.time||'未設定時間')}</small>${point.address?`<span>${safe(point.address)}</span>`:''}</div>`)
   marker.on('click',()=>onSelect(point.id))
   markersRef.current.set(point.id,marker)
  })
  if(cleanPoints.length===1)map.setView([cleanPoints[0].lat,cleanPoints[0].lon],15)
  else if(cleanPoints.length>1)map.fitBounds(L.latLngBounds(cleanPoints.map(point=>[point.lat,point.lon] as [number,number])),{padding:[32,32],maxZoom:15,animate:false})
  window.setTimeout(()=>map.invalidateSize(false),80)
 },[cleanPoints,replayIndex,selectedId,onSelect])

 useEffect(()=>{
  if(!selectedId)return
  const map=mapRef.current
  const marker=markersRef.current.get(selectedId)
  if(!map||!marker)return
  map.flyTo(marker.getLatLng(),Math.max(map.getZoom(),15),{duration:.5})
  marker.openPopup()
 },[selectedId])

 const locateMe=()=>{
  const map=mapRef.current
  if(!map||!navigator.geolocation)return
  setLocating(true)
  navigator.geolocation.getCurrentPosition(position=>{
   const latlng:L.LatLngExpression=[position.coords.latitude,position.coords.longitude]
   const layer=layerRef.current||L.layerGroup().addTo(map)
   L.circleMarker(latlng,{radius:9,color:'#1f5fad',weight:3,fillColor:'#64a7ff',fillOpacity:.95}).addTo(layer).bindPopup('目前位置').openPopup()
   map.setView(latlng,15)
   setLocating(false)
  },()=>{setLocating(false);window.alert('無法取得目前位置，請確認瀏覽器已允許定位權限。')},{enableHighAccuracy:true,timeout:10000,maximumAge:30000})
 }

 return <div className="atlas-map-wrap">
  <div ref={hostRef} className="atlas-map" aria-label="旅行回憶地圖"/>
  <button type="button" className="atlas-locate" onClick={locateMe} disabled={locating}>{locating?'定位中…':'◎ 我的定位'}</button>
 </div>
}
