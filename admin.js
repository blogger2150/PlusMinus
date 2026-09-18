let sites=[];let filter="all";
const $=id=>document.getElementById(id);
const els={
  login:$('login'),app:$('app'),loginForm:$('loginForm'),email:$('loginEmail'),password:$('loginPassword'),loginError:$('loginError'),logout:$('logout'),
  sites:$('sites'),pending:$('pendingCount'),approved:$('approvedCount'),rejected:$('rejectedCount'),add:$('addBtn'),modal:$('modal'),close:$('close'),form:$('siteForm'),url:$('url'),name:$('name'),preview:$('preview'),previewTitle:$('previewTitle'),previewDesc:$('previewDesc'),submit:$('submitSite'),error:$('formError')
};
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[c]))}
function statusCounts(){const c={pending:0,approved:0,rejected:0};sites.forEach(s=>{if(c[s.status]!==undefined)c[s.status]++});return c}
function render(){
  const c=statusCounts();els.pending.textContent=c.pending;els.approved.textContent=c.approved;els.rejected.textContent=c.rejected;
  const visible=sites.filter(s=>filter==="all"||s.status===filter);
  els.sites.innerHTML=visible.length?visible.map(s=>`<div class="site"><div class="siteinfo"><h3>${esc(s.title||s.name||s.domain)} <span class="badge">${esc(s.status)}</span></h3><p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.domain)}</a>${s.description?` · ${esc(s.description)}`:""}${s.rejection_reason?` · <strong>Reason:</strong> ${esc(s.rejection_reason)}`:""}</p></div><div class="actions">${s.status!=="approved"?`<button type="button" data-action="approve" data-id="${esc(s.id)}">Approve</button>`:""}${s.status!=="rejected"?`<button type="button" data-action="reject" data-id="${esc(s.id)}">Disapprove</button>`:""}${s.status!=="pending"?`<button type="button" data-action="pending" data-id="${esc(s.id)}">Re-review</button>`:""}</div></div>`).join(""):"<div class='empty'>No websites in this view.</div>";
}
async function load(){
  const {data,error}=await pmSupabase.from("sites").select("*").order("created_at",{ascending:false});
  if(error)throw error;sites=data||[];render();
}
async function setStatus(id,status,reason=null){
  const payload={status,rejection_reason:status==="rejected"?reason:null,updated_at:new Date().toISOString()};
  const {error}=await pmSupabase.from("sites").update(payload).eq("id",id);
  if(error)throw error;await load();
}
async function reject(id){
  const r=prompt("Reason for disapproval:","Does not meet current quality requirements");
  if(r===null)return;await setStatus(id,"rejected",r.trim()||"Does not meet current quality requirements");
}
function openModal(){els.modal.classList.remove("hidden");document.body.classList.add("modal-open");els.error.textContent="";els.preview.classList.add("hidden");setTimeout(()=>els.url.focus(),0)}
function closeModal(){els.modal.classList.add("hidden");document.body.classList.remove("modal-open")}
async function login(e){
  e.preventDefault();els.loginError.textContent="";
  const {error}=await pmSupabase.auth.signInWithPassword({email:els.email.value.trim(),password:els.password.value});
  if(error){els.loginError.textContent=error.message;return} await showApp();
}
async function showApp(){const {data:{session}}=await pmSupabase.auth.getSession();if(session){els.login.classList.add("hidden");els.app.classList.remove("hidden");try{await load()}catch(e){els.loginError.textContent=e.message}}else{els.login.classList.remove("hidden");els.app.classList.add("hidden")}}

// Submit first. Metadata fetching is deliberately background-only so a slow/blocked site
// can never stop an article from entering the pending review queue.
async function submitSite(e){
  e.preventDefault();
  els.error.textContent="";
  const rawUrl=els.url.value.trim();
  let parsed;
  try{parsed=new URL(rawUrl)}catch(err){els.error.textContent="Please enter a valid http or https URL.";return}
  if(!/^https?:$/.test(parsed.protocol)){els.error.textContent="Please enter a valid http or https URL.";return}

  els.submit.disabled=true;
  els.submit.textContent="Submitting…";
  const domain=pmMeta.getDomain(rawUrl)||parsed.hostname.replace(/^www\./i,"");
  const displayName=els.name.value.trim();
  const fallbackTitle=displayName||domain||rawUrl;
  const initialKeywords=pmMeta.tokenize(`${displayName} ${domain}`);

  try{
    const {data,error}=await pmSupabase.from("sites").insert({
      name:displayName||fallbackTitle,
      url:rawUrl,
      domain,
      title:fallbackTitle,
      description:"",
      keywords:initialKeywords,
      status:"pending",
      rejection_reason:"",
      relevance_score:0,
      admin_priority:0
    }).select("id,url").single();
    if(error)throw error;

    els.form.reset();els.preview.classList.add("hidden");closeModal();
    await load();

    // Best-effort enrichment. It is never awaited by the submit flow.
    enrichInBackground(data.id,rawUrl);
  }catch(err){
    els.error.textContent=err.message||"Could not submit this article";
  }finally{
    els.submit.disabled=false;els.submit.textContent="Submit for Review";
  }
}

async function enrichInBackground(id,url){
  try{
    const m=await pmMeta.fetchMeta(url);
    const title=pmMeta.cleanText(m.title||"");
    const description=pmMeta.cleanText(m.description||"");
    if(!title&&!description)return;
    const keywords=pmMeta.tokenize(`${title} ${description}`);
    const {error}=await pmSupabase.from("sites").update({title:title||undefined,description,keywords,updated_at:new Date().toISOString()}).eq("id",id);
    if(!error)await load();
  }catch(_e){
    // Metadata is optional. The submitted record remains pending even if the source blocks us.
  }
}

els.loginForm.addEventListener("submit",login);
els.logout.addEventListener("click",async()=>{await pmSupabase.auth.signOut();showApp()});
els.add.addEventListener("click",openModal);
els.close.addEventListener("click",closeModal);
els.modal.addEventListener("click",e=>{if(e.target===els.modal)closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
els.form.addEventListener("submit",submitSite);
// No automatic metadata request on blur. Submitting must never wait for the source website.
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render()}));
els.sites.addEventListener("click",async e=>{const b=e.target.closest("button[data-action]");if(!b)return;e.preventDefault();b.disabled=true;try{if(b.dataset.action==="approve")await setStatus(b.dataset.id,"approved");else if(b.dataset.action==="reject")await reject(b.dataset.id);else await setStatus(b.dataset.id,"pending")}catch(err){alert(err.message||"Database update failed")}finally{b.disabled=false}});
pmSupabase.auth.onAuthStateChange(()=>showApp());
showApp();
