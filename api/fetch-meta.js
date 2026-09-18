export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const raw=String(req.query?.url||"").trim();
  let u;
  try{u=new URL(raw)}catch(e){return res.status(400).json({error:"Enter a valid article URL"})}
  if(!/^https?:$/.test(u.protocol)) return res.status(400).json({error:"Only http and https URLs are supported"});
  const host=u.hostname.toLowerCase();
  if(host==="localhost"||host==="127.0.0.1"||host==="0.0.0.0"||host==="::1"||/^10\./.test(host)||/^192\.168\./.test(host)||/^169\.254\./.test(host)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return res.status(400).json({error:"Private/local addresses are not allowed"});
  try{
    const r=await fetch(u.toString(),{headers:{"user-agent":"PlusMinusBot/1.0 (+https://plusminus-22.vercel.app)"},redirect:"follow"});
    if(!r.ok) return res.status(502).json({error:`Source returned ${r.status}`});
    const html=(await r.text()).slice(0,2000000);
    const get=(re)=>{const m=html.match(re);return m?m[1].replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim():""};
    const title=get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)||get(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const description=get(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i);
    return res.status(200).json({url:u.toString(),domain:u.hostname.replace(/^www\./i,""),title,description});
  }catch(e){return res.status(502).json({error:"Could not fetch that URL"})}
}
