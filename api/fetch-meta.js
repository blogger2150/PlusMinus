export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const raw=String(req.query?.url||"").trim();
  let u;
  try{u=new URL(raw)}catch(e){return res.status(400).json({error:"Enter a valid article URL"})}
  if(!/^https?:$/.test(u.protocol)) return res.status(400).json({error:"Only http and https URLs are supported"});
  const host=u.hostname.toLowerCase();
  if(host==="localhost"||host==="127.0.0.1"||host==="0.0.0.0"||host==="::1"||/^10\./.test(host)||/^192\.168\./.test(host)||/^169\.254\./.test(host)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return res.status(400).json({error:"Private/local addresses are not allowed"});
  const domain=u.hostname.replace(/^www\./i,"");
  const fallback=(error)=>({fallback:true,url:u.toString(),domain,title:"",description:"",error});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch(u.toString(),{signal:controller.signal,headers:{"user-agent":"Mozilla/5.0 (compatible; PlusMinusBot/1.1; +https://plusminus-22.vercel.app)"},redirect:"follow"});
    if(!r.ok)return res.status(200).json(fallback(`Source returned ${r.status}`));
    const html=(await r.text()).slice(0,3000000);
    const decode=v=>String(v||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/gi,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    const get=re=>{const m=html.match(re);return m?decode(m[1]):""};
    const meta=name=>get(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`,'i'))||get(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,'i'));
    const title=meta("og:title")||meta("twitter:title")||get(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const description=meta("og:description")||meta("twitter:description")||meta("description");
    return res.status(200).json({url:u.toString(),domain,title,description,fallback:false});
  }catch(e){
    return res.status(200).json(fallback(e.name==="AbortError"?"Metadata request timed out":"Could not fetch article metadata"));
  }finally{clearTimeout(timeout)}
}
