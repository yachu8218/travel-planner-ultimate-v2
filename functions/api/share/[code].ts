interface Env{
 TRIP_SHARES:KVNamespace
}
const headers={
 'content-type':'application/json; charset=utf-8',
 'cache-control':'public, max-age=60'
}
export const onRequestGet:PagesFunction<Env>=async({env,params})=>{
 if(!env.TRIP_SHARES)return new Response(JSON.stringify({error:'分享服務尚未設定'}),{status:503,headers})
 const code=String(params.code||'').toUpperCase()
 if(!/^[A-Z2-9]{6}$/.test(code))return new Response(JSON.stringify({error:'分享代碼格式不正確'}),{status:400,headers})
 const value=await env.TRIP_SHARES.get(code)
 if(!value)return new Response(JSON.stringify({error:'分享連結不存在或已過期'}),{status:404,headers})
 try{
  const record=JSON.parse(value)
  return new Response(JSON.stringify({trip:record.trip,expiresAt:record.expiresAt}),{status:200,headers})
 }catch{
  return new Response(JSON.stringify({error:'分享資料格式錯誤'}),{status:500,headers})
 }
}
