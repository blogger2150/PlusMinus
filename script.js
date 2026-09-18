let currentTab="all";

const ANALYTICS_SESSION_KEY="plusminus_analytics_session";

function getAnalyticsSession(){
  try{
    let id=localStorage.getItem(ANALYTICS_SESSION_KEY);
    if(!id){
      id=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));
      localStorage.setItem(ANALYTICS_SESSION_KEY,id);
    }
    return id;
  }catch(e){
    return "anonymous-"+Date.now();
  }
}

function getDeviceType(){
  const ua=navigator.userAgent||"";
  if(/tablet|ipad/i.test(ua))return "Tablet";
  if(/mobile|android|iphone|ipod/i.test(ua))return "Mobile";
  return "Desktop";
}

function getDeviceManufacturer(){
  const ua=navigator.userAgent||"";

  if(/samsung/i.test(ua))return "Samsung";
  if(/xiaomi|redmi|mi /i.test(ua))return "Xiaomi";
  if(/oneplus/i.test(ua))return "OnePlus";
  if(/oppo/i.test(ua))return "OPPO";
  if(/realme/i.test(ua))return "realme";
  if(/vivo/i.test(ua))return "vivo";
  if(/pixel/i.test(ua))return "Google";
  if(/huawei/i.test(ua))return "Huawei";
  if(/motorola|moto /i.test(ua))return "Motorola";
  if(/nothing/i.test(ua))return "Nothing";
  if(/iphone|ipad|ipod/i.test(ua))return "Apple";

  return "Unknown";
}

function getDeviceModel(){
  const ua=navigator.userAgent||"";

  if(/iPhone/i.test(ua))return "iPhone";
  if(/iPad/i.test(ua))return "iPad";

  const androidMatch=ua.match(
    /Android[^;)]*;\s*(?:[a-z]{2}-[A-Z]{2};\s*)?([^;)]+?)(?:\s+Build[\/;]|[;)])/i
  );

  if(androidMatch){
    const model=androidMatch[1].trim();

    if(
      model &&
      !/wv|mobile|build|linux|android/i.test(model)
    ){
      return model;
    }
  }

  if(/Android/i.test(ua))return "Android device";
  if(/Windows/i.test(ua))return "Windows PC";
  if(/Macintosh/i.test(ua))return "Mac";
  if(/Linux/i.test(ua))return "Linux PC";

  return "Unknown";
}

function getBrowser(){
  const ua=navigator.userAgent||"";

  if(/edg/i.test(ua))return "Edge";
  if(/opr|opera/i.test(ua))return "Opera";
  if(/chrome|crios/i.test(ua)&&!/edg/i.test(ua))return "Chrome";
  if(/firefox|fxios/i.test(ua))return "Firefox";
  if(/safari/i.test(ua)&&!/chrome|crios/i.test(ua))return "Safari";

  return "Other";
}

function getOS(){
  const ua=navigator.userAgent||"";

  if(/android/i.test(ua))return "Android";
  if(/iphone|ipad|ipod/i.test(ua))return "iOS";
  if(/windows/i.test(ua))return "Windows";
  if(/mac os/i.test(ua))return "macOS";
  if(/linux/i.test(ua))return "Linux";

  return "Other";
}

async function logSearch(query,resultType="web"){
  try{
    const clean=query.trim();
    if(!clean)return;

    await pmSupabase.from("search_logs").insert({
      query:clean,
      device_type:getDeviceType(),
      device_manufacturer:getDeviceManufacturer(),
      device_model:getDeviceModel(),
      browser:getBrowser(),
      operating_system:getOS(),
      result_type:resultType,
      session_id:getAnalyticsSession(),
      result_clicked:false
    });
  }catch(e){
    // Analytics must NEVER stop or break the search.
    console.warn("Analytics logging failed:",e);
  }
}

async function logResultClick(){
  try{
    const session=getAnalyticsSession();

    const {error}=await pmSupabase
      .from("search_logs")
      .update({result_clicked:true})
      .eq("session_id",session)
      .eq("result_clicked",false)
      .order("searched_at",{ascending:false})
      .limit(1);

    if(error)console.warn("Click analytics failed:",error);
  }catch(e){
    console.warn("Click analytics failed:",e);
  }
}

function esc(v){
  return String(v??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "'":"&#39;",
    '"':"&quot;"
  }[c]));
}

function words(q){
  return [...new Set(
    q.toLowerCase()
      .replace(/[^a-z0-9\s-]/g," ")
      .split(/\s+/)
      .filter(w=>w.length>1)
  )];
}

function score(item,q){
  const ws=words(q);
  if(!ws.length)return 0;

  const title=String(item.title||"").toLowerCase();
  const desc=String(item.description||"").toLowerCase();
  const keys=(item.keywords||[]).join(" ").toLowerCase();
  const domain=String(item.domain||"").toLowerCase();
  const phrase=q.toLowerCase().trim();

  let s=0;

  if(title.includes(phrase))s+=60;
  if(desc.includes(phrase))s+=25;
  if(keys.includes(phrase))s+=20;

  ws.forEach(w=>{
    if(title.includes(w))s+=20;
    if(desc.includes(w))s+=8;
    if(keys.includes(w))s+=12;
    if(domain.includes(w))s+=5;
  });

  s+=Number(item.admin_priority||0);

  return s;
}

async function getResults(q){
  if(currentTab!=="all")return [];

  const {data,error}=await pmSupabase
    .from("sites")
    .select("id,url,domain,title,description,keywords,admin_priority,published_at,created_at")
    .eq("status","approved");

  if(error)throw error;

  return (data||[])
    .map(x=>({...x,_score:score(x,q)}))
    .filter(x=>x._score>0)
    .sort(
      (a,b)=>
        b._score-a._score||
        new Date(b.published_at||b.created_at)-
        new Date(a.published_at||a.created_at)
    );
}

async function render(q){
  const meta=document.getElementById("meta");
  const list=document.getElementById("list");

  meta.textContent=
    `Searching “${q}” · ${currentTab[0].toUpperCase()+currentTab.slice(1)}`;

  list.innerHTML="<div class='empty'>Searching…</div>";

  try{
    if(currentTab!=="all"){
      list.innerHTML=
        "<div class='empty'>This result type will be connected to its real source in the next indexing stage.</div>";
      return;
    }

    const results=await getResults(q);

    list.innerHTML=results.length
      ?results.map(x=>`
        <article class="result">
          <div class="domain">${esc(x.domain)}</div>
          <h2>
            <a
              href="${esc(x.url)}"
              target="_blank"
              rel="noopener"
              data-result-click="true"
            >${esc(x.title||x.domain)}</a>
          </h2>
          <p>${esc(x.description||"")}</p>
        </article>
      `).join("")
      :"<div class='empty'>No approved results matched this search.</div>";

  }catch(e){
    list.innerHTML=`<div class='empty'>Search error: ${esc(e.message)}</div>`;
  }
}

function search(q){
  q=q.trim();
  if(!q)return;

  document.querySelector(".hero").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("rq").value=q;

  // Analytics never blocks the search.
  logSearch(q,currentTab==="all"?"web":currentTab);

  render(q);
}

document.getElementById("searchForm").addEventListener("submit",e=>{
  e.preventDefault();
  search(document.getElementById("q").value);
});

document.getElementById("resultForm").addEventListener("submit",e=>{
  e.preventDefault();
  search(document.getElementById("rq").value);
});

document.querySelectorAll("[data-q]").forEach(b=>
  b.addEventListener("click",()=>search(b.dataset.q))
);

document.querySelectorAll(".tab").forEach(b=>
  b.addEventListener("click",()=>{
    currentTab=b.dataset.tab;

    document.querySelectorAll(".tab")
      .forEach(x=>x.classList.remove("active"));

    b.classList.add("active");

    const q=document.getElementById("rq").value.trim();

    if(q){
      logSearch(q,currentTab==="all"?"web":currentTab);
      render(q);
    }
  })
);

document.addEventListener("click",e=>{
  const link=e.target.closest("[data-result-click='true']");

  if(link){
    logResultClick();
  }
});
