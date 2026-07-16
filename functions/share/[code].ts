interface Env{
 TRIP_SHARES:KVNamespace
}
const esc=(value:string)=>value.replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]||char))
export const onRequestGet:PagesFunction<Env>=async({request,env,params})=>{
 const code=String(params.code||'').toUpperCase()
 const origin=new URL(request.url).origin
 let title='唯讀旅行行程'
 let description='使用 Travel Planner Ultimate 查看完整旅行行程。'
 if(env.TRIP_SHARES){
  const value=await env.TRIP_SHARES.get(code)
  if(value){
   try{
    const record=JSON.parse(value)
    title=String(record.title||title)
    description=[record.destination,record.start&&record.end?`${record.start}～${record.end}`:''].filter(Boolean).join('｜')||description
   }catch{}
  }
 }
 const destination=`/?shareId=${encodeURIComponent(code)}`
 const html=`<!doctype html><html lang="zh-Hant"><head>
 <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>${esc(title)}｜Travel Planner</title>
 <meta name="description" content="${esc(description)}">
 <meta property="og:type" content="website">
 <meta property="og:title" content="${esc(title)}">
 <meta property="og:description" content="${esc(description)}">
 <meta property="og:url" content="${esc(request.url)}">
 <meta name="twitter:card" content="summary">
 <style>body{font-family:-apple-system,BlinkMacSystemFont,"PingFang TC",sans-serif;background:#fff8e8;color:#27302e;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:420px;margin:20px;padding:26px;border:3px solid #27302e;border-radius:16px;background:#fff;box-shadow:7px 7px 0 #27302e;text-align:center}a{display:inline-block;margin-top:14px;padding:11px 18px;border:2px solid #27302e;border-radius:10px;background:#ffd86b;color:#27302e;font-weight:800;text-decoration:none}</style>
 </head><body><main class="card"><div style="font-size:44px">🧳</div><h1>${esc(title)}</h1><p>${esc(description)}</p><p>正在開啟唯讀行程…</p><a href="${destination}">查看行程</a></main>
 <script>location.replace(${JSON.stringify(destination)})</script></body></html>`
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60'}})
}
