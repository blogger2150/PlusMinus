let currentTab="all";
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function words(q){return [...new Set(q.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w=>w.length>1))]}
function score(item,q){
  const ws=words(q);if(!ws.length)return 0;
  const title=String(item.title||"").toLowerCase(),desc=String(item.description||"").toLowerCase(),keys=(item.keywords||[]).join(" ").toLowerCase(),domain=String(item.domain||"").toLowerCase();
  const phrase=q.toLowerCase().trim();let s=0;
  if(title.includes(phrase))s+=60;if(desc.includes(phrase))s+=25;if(keys.includes(phrase))s+=20;
  ws.forEach(w=>{if(title.includes(w))s+=20;if(desc.includes(w))s+=8;if(keys.includes(w))s+=12;if(domain.includes(w))s+=5});
  s+=Number(item.admin_priority||0);return s;
}
async function getResults(q){
  if(currentTab!=="all")return [];
  const {data,error}=await pmSupabase.from("sites").select("id,url,domain,title,description,keywords,admin_priority,published_at,created_at").eq("status","approved");
  if(error)throw error;
  return (data||[]).map(x=>({...x,_score:score(x,q)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score||new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at));
}
async function render(q){
  const meta=document.getElementById("meta"),list=document.getElementById("list");meta.textContent=`Searching “${q}” · ${currentTab[0].toUpperCase()+currentTab.slice(1)}`;list.innerHTML="<div class='empty'>Searching…</div>";
  try{
    if(currentTab!=="all"){list.innerHTML="<div class='empty'>This result type will be connected to its real source in the next indexing stage.</div>";return}
    const results=await getResults(q);
    list.innerHTML=results.length?results.map(x=>`<article class="result"><div class="domain">${esc(x.domain)}</div><h2><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title||x.domain)}</a></h2><p>${esc(x.description||"")}</p></article>`).join(""):"<div class='empty'>No approved results matched this search.</div>";
  }catch(e){list.innerHTML=`<div class='empty'>Search error: ${esc(e.message)}</div>`}
}
function search(q){q=q.trim();if(!q)return;document.querySelector(".hero").classList.add("hidden");document.getElementById("results").classList.remove("hidden");document.getElementById("rq").value=q;render(q)}
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();search(document.getElementById("q").value)});
document.getElementById("resultForm").addEventListener("submit",e=>{e.preventDefault();search(document.getElementById("rq").value)});
document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>search(b.dataset.q)));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{currentTab=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");const q=document.getElementById("rq").value.trim();if(q)render(q)}));
