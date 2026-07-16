interface Env{
 TRIP_SHARES:KVNamespace
}
type ShareRequest={
 trip:unknown
 expiresInDays?:number
}
const headers={
 'content-type':'application/json; charset=utf-8',
 'cache-control':'no-store'
}
const allowedChars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const createCode=()=>{
 const bytes=crypto.getRandomValues(new Uint8Array(6))
 return Array.from(bytes,value=>allowedChars[value%allowedChars.length]).join('')
}
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 if(!env.TRIP_SHARES)return new Response(JSON.stringify({error:'尚未綁定 TRIP_SHARES KV'}),{status:503,headers})
 try{
  const body=await request.json() as ShareRequest
  if(!body?.trip||typeof body.trip!=='object')return new Response(JSON.stringify({error:'缺少旅行資料'}),{status:400,headers})
  const encoded=JSON.stringify(body.trip)
  if(encoded.length>700_000)return new Response(JSON.stringify({error:'行程資料過大，請先移除大型圖片後再分享'}),{status:413,headers})
  const days=Math.min(365,Math.max(1,Number(body.expiresInDays)||30))
  const createdAt=Date.now()
  const expiresAt=createdAt+days*86400000
  let code=''
  for(let attempt=0;attempt<6;attempt++){
   const candidate=createCode()
   if(!await env.TRIP_SHARES.get(candidate)){code=candidate;break}
  }
  if(!code)return new Response(JSON.stringify({error:'無法建立分享代碼，請稍後再試'}),{status:503,headers})
  const trip=body.trip as any
  await env.TRIP_SHARES.put(code,JSON.stringify({
   trip:body.trip,
   title:String(trip?.name||'旅行行程').slice(0,100),
   destination:String(trip?.destination||'').slice(0,100),
   start:String(trip?.start||''),
   end:String(trip?.end||''),
   createdAt,
   expiresAt
  }),{expirationTtl:days*86400})
  return new Response(JSON.stringify({code,expiresAt}),{status:201,headers})
 }catch(error:any){
  return new Response(JSON.stringify({error:error?.message||'建立分享連結失敗'}),{status:500,headers})
 }
}
export const onRequestOptions:PagesFunction=async()=>new Response(null,{status:204,headers:{
 'access-control-allow-origin':'*',
 'access-control-allow-methods':'POST,OPTIONS',
 'access-control-allow-headers':'content-type'
}})
