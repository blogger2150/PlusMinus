function cleanText(v){return String(v||"").replace(/\s+/g," ").trim()}
function getDomain(url){try{return new URL(url).hostname.replace(/^www\./i,"")}catch(e){return ""}}
function tokenize(text){
  const stop=new Set("the a an and or of to in on for from with by is are was were be this that as at it its into about after before over under new latest how why what when where who their our your more less than also india news today official".split(/\s+/));
  return [...new Set(cleanText(text).toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w=>w.length>2&&!stop.has(w)))].slice(0,80);
}
async function fetchMeta(url){
  const r=await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`);
  let data={};
  try{data=await r.json()}catch(e){}
  if(!r.ok && !data.fallback){throw new Error(data.error||`Could not read article metadata (${r.status})`)}
  return data;
}
window.pmMeta={cleanText,getDomain,tokenize,fetchMeta};
