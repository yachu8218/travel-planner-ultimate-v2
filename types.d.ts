interface Env{TRIP_SHARES:KVNamespace}
type UpdateRequest={trip:unknown;scope?:string;password?:string}
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
const hash=async(value:string)=>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
}
const load=async(env:Env,code:string)=>{const value=await env.TRIP_SHARES.get(code);return value?JSON.parse(value):null}
export const onRequestGet:PagesFunction<Env>=async({request,env,params})=>{
 if(!env.TRIP_SHARES)return new Response(JSON.stringify({error:'分享服務尚未設定'}),{status:503,headers})
 const code=String(params.code||'').toUpperCase()
 if(!/^[A-Z2-9]{6}$/.test(code))return new Response(JSON.stringify({error:'分享代碼格式不正確'}),{status:400,headers})
 const record=await load(env,code)
 if(!record)return new Response(JSON.stringify({error:'分享連結不存在或已過期'}),{status:404,headers})
 if(record.passwordHash){
  const supplied=request.headers.get('x-share-password')||''
  if(!supplied||await hash(supplied)!==record.passwordHash)return new Response(JSON.stringify({error:'此分享需要正確密碼',passwordRequired:true}),{status:401,headers})
 }
 return new Response(JSON.stringify({trip:record.trip,scope:record.scope||'itinerary',updatedAt:record.updatedAt||record.createdAt,expiresAt:record.expiresAt}),{status:200,headers})
}
export const onRequestPut:PagesFunction<Env>=async({request,env,params})=>{
 if(!env.TRIP_SHARES)return new Response(JSON.stringify({error:'分享服務尚未設定'}),{status:503,headers})
 const code=String(params.code||'').toUpperCase()
 const record=await load(env,code)
 if(!record)return new Response(JSON.stringify({error:'分享連結不存在或已過期'}),{status:404,headers})
 const editToken=request.headers.get('x-share-edit-token')||''
 if(!editToken||await hash(editToken)!==record.editTokenHash)return new Response(JSON.stringify({error:'沒有更新此分享的權限'}),{status:403,headers})
 try{
  const body=await request.json() as UpdateRequest
  if(!body?.trip||typeof body.trip!=='object')return new Response(JSON.stringify({error:'缺少旅行資料'}),{status:400,headers})
  const encoded=JSON.stringify(body.trip)
  if(encoded.length>700000)return new Response(JSON.stringify({error:'行程資料過大'}),{status:413,headers})
  const password=String(body.password||'').trim()
  const scope=['itinerary','budget','wallet'].includes(String(body.scope))?String(body.scope):record.scope
  const trip=body.trip as any
  const updatedAt=Date.now()
  const next={...record,trip:body.trip,scope,
   passwordHash:password?await hash(password):'',
   title:String(trip?.name||record.title).slice(0,100),
   destination:String(trip?.destination||record.destination).slice(0,100),
   start:String(trip?.start||record.start),end:String(trip?.end||record.end),updatedAt}
  const ttl=Math.max(60,Math.floor((Number(record.expiresAt)-Date.now())/1000))
  await env.TRIP_SHARES.put(code,JSON.stringify(next),{expirationTtl:ttl})
  return new Response(JSON.stringify({updatedAt}),{status:200,headers})
 }catch(error:any){
  return new Response(JSON.stringify({error:error?.message||'同步失敗'}),{status:500,headers})
 }
}