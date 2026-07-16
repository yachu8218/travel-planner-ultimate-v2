interface Env{TRIP_SHARES:KVNamespace}
type ShareRequest={trip:unknown;expiresInDays?:number;scope?:string;password?:string}
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const randomString=(length:number)=>Array.from(crypto.getRandomValues(new Uint8Array(length)),v=>chars[v%chars.length]).join('')
const hash=async(value:string)=>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
}
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
 if(!env.TRIP_SHARES)return new Response(JSON.stringify({error:'尚未綁定 TRIP_SHARES KV'}),{status:503,headers})
 try{
  const body=await request.json() as ShareRequest
  if(!body?.trip||typeof body.trip!=='object')return new Response(JSON.stringify({error:'缺少旅行資料'}),{status:400,headers})
  const encoded=JSON.stringify(body.trip)
  if(encoded.length>700000)return new Response(JSON.stringify({error:'行程資料過大，請先移除大型圖片'}),{status:413,headers})
  const days=Math.min(365,Math.max(1,Number(body.expiresInDays)||30))
  const password=String(body.password||'').trim()
  if(password&&password.length<4)return new Response(JSON.stringify({error:'分享密碼至少需要 4 個字元'}),{status:400,headers})
  const scope=['itinerary','budget','wallet'].includes(String(body.scope))?String(body.scope):'itinerary'
  let code=''
  for(let attempt=0;attempt<8;attempt++){const candidate=randomString(6);if(!await env.TRIP_SHARES.get(candidate)){code=candidate;break}}
  if(!code)return new Response(JSON.stringify({error:'無法建立分享代碼'}),{status:503,headers})
  const editToken=randomString(24)
  const updatedAt=Date.now()
  const trip=body.trip as any
  const record={
   trip:body.trip,title:String(trip?.name||'旅行行程').slice(0,100),
   destination:String(trip?.destination||'').slice(0,100),
   start:String(trip?.start||''),end:String(trip?.end||''),
   scope,passwordHash:password?await hash(password):'',
   editTokenHash:await hash(editToken),createdAt:updatedAt,updatedAt,
   expiresAt:updatedAt+days*86400000
  }
  await env.TRIP_SHARES.put(code,JSON.stringify(record),{expirationTtl:days*86400})
  return new Response(JSON.stringify({code,editToken,updatedAt,expiresAt:record.expiresAt}),{status:201,headers})
 }catch(error:any){
  return new Response(JSON.stringify({error:error?.message||'建立分享連結失敗'}),{status:500,headers})
 }
}