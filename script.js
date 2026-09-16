const PM_SITES_KEY = "pm_sites_v2";

const prototypeResults = [
  {domain:"plusminus.example",title:"Understanding the basics of search",desc:"Prototype result for testing the PlusMinus search experience.",tags:["technology","science"],type:"all"},
  {domain:"independent.example",title:"Useful information without the noise",desc:"Controlled result that will later come from approved websites.",tags:["india","science"],type:"all"},
  {domain:"openweb.example",title:"A cleaner way to discover websites",desc:"PlusMinus is designed around relevance, quality and transparent ranking.",tags:["technology","india"],type:"all"}
];

function getApprovedSites(){
  try{
    const sites=JSON.parse(localStorage.getItem(PM_SITES_KEY)||"[]");
    return Array.isArray(sites)?sites.filter(s=>s&&s.status==="approved"):[];
  }catch(e){return []}
}

function siteToResult(s){
  return {domain:s.domain||"",title:s.name||s.domain||"Approved website",desc:`Approved PlusMinus website · ${s.category||"General"}`,tags:[String(s.category||"general").toLowerCase()],type:"all",approved:true};
}

let currentTab="all";

function runSearch(q){
  q=q.trim();
  if(!q)return;
  document.querySelector(".hero").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("rq").value=q;
  renderResults(q);
}

function renderResults(q){
  const words=q.toLowerCase().split(/\s+/).filter(Boolean);
  const approved=getApprovedSites().map(siteToResult);
  const all=[...approved,...prototypeResults];
  let matches=all.filter(x=>{
    const hay=(x.domain+" "+x.title+" "+x.desc+" "+x.tags.join(" ")).toLowerCase();
    return words.some(w=>hay.includes(w));
  });
  if(!matches.length) matches=all;

  if(currentTab!=="all"){
    // Prototype category tabs are functional and show an appropriate state.
    const tabMatches=matches.filter(x=>x.tags.includes(currentTab)||x.type===currentTab);
    if(tabMatches.length) matches=tabMatches;
  }

  document.getElementById("meta").textContent=`Results for “${q}” · ${currentTab[0].toUpperCase()+currentTab.slice(1)}`;
  document.getElementById("list").innerHTML=matches.map(x=>`<article class="result"><div class="domain">${escapeHtml(x.domain)}</div><h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.desc)}</p></article>`).join("");
}

function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

const searchForm=document.getElementById("searchForm");
const resultForm=document.getElementById("resultForm");
if(searchForm)searchForm.addEventListener("submit",e=>{e.preventDefault();runSearch(document.getElementById("q").value)});
if(resultForm)resultForm.addEventListener("submit",e=>{e.preventDefault();runSearch(document.getElementById("rq").value)});
document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>runSearch(b.dataset.q)));

document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
  currentTab=tab.dataset.tab;
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  tab.classList.add("active");
  const q=document.getElementById("rq").value.trim();
  if(q)renderResults(q);
}));
