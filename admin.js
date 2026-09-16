const STORAGE_KEY = "pm_sites_v2";

const defaultSites = [
  { name:"PlusMinus Example", domain:"plusminus.example", category:"Technology", status:"pending" },
  { name:"Independent Web", domain:"independent.example", category:"General", status:"approved" },
  { name:"Sample News", domain:"sample-news.example", category:"News", status:"rejected", reason:"Incomplete website information" }
];

const $ = id => document.getElementById(id);
const els = {
  sites:$("sites"), pending:$("pendingCount"), approved:$("approvedCount"), rejected:$("rejectedCount"),
  add:$("addBtn"), modal:$("modal"), close:$("close"), form:$("siteForm"),
  name:$("name"), domain:$("domain"), category:$("category"),
  rejectModal:$("rejectModal"), rejectClose:$("rejectClose"), rejectCancel:$("rejectCancel"),
  rejectConfirm:$("rejectConfirm"), rejectReason:$("rejectReason")
};

let stored = localStorage.getItem(STORAGE_KEY);
let sites = stored ? JSON.parse(stored) : defaultSites.map(x => ({...x}));
let filter = "all";
let rejectIndex = null;

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(sites)); }

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function render(){
  const counts={pending:0,approved:0,rejected:0};
  sites.forEach(s=>{ if(counts[s.status] !== undefined) counts[s.status]++; });
  els.pending.textContent=counts.pending; els.approved.textContent=counts.approved; els.rejected.textContent=counts.rejected;

  const visible=sites.filter(s=>filter==="all" || s.status===filter);
  els.sites.innerHTML=visible.length ? visible.map(site=>{
    const index=sites.indexOf(site);
    const reason=site.reason ? `<div class="reason"><b>Reason:</b> ${escapeHtml(site.reason)}</div>` : "";
    return `<div class="site">
      <div class="siteinfo"><h3>${escapeHtml(site.name)} <span class="badge ${site.status}">${escapeHtml(site.status)}</span></h3>
      <p>${escapeHtml(site.domain)} · ${escapeHtml(site.category)}</p>${reason}</div>
      <div class="actions">
        ${site.status!=="approved" ? `<button class="approve" data-action="approve" data-index="${index}">Approve</button>` : ""}
        ${site.status!=="rejected" ? `<button data-action="reject" data-index="${index}">Reject</button>` : ""}
        ${site.status!=="pending" ? `<button data-action="pending" data-index="${index}">Re-review</button>` : ""}
      </div>
    </div>`;
  }).join("") : `<div class="empty">No websites in this view.</div>`;
}

function showModal(modal){
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
}
function hideModal(modal){
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  if(els.modal.classList.contains("hidden") && els.rejectModal.classList.contains("hidden"))
    document.body.classList.remove("modal-open");
}
function openAdd(){ showModal(els.modal); setTimeout(()=>els.name.focus(),50); }
function closeAdd(){ hideModal(els.modal); }
function openReject(index){
  rejectIndex=index; els.rejectReason.value="";
  showModal(els.rejectModal); setTimeout(()=>els.rejectReason.focus(),50);
}
function closeReject(){ rejectIndex=null; hideModal(els.rejectModal); }

els.add.addEventListener("click",openAdd);
els.close.addEventListener("click",closeAdd);
els.rejectClose.addEventListener("click",closeReject);
els.rejectCancel.addEventListener("click",closeReject);

[els.modal,els.rejectModal].forEach(modal=>modal.addEventListener("click",e=>{
  if(e.target===modal) e.currentTarget===els.modal ? closeAdd() : closeReject();
}));

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(!els.rejectModal.classList.contains("hidden")) closeReject();
    else if(!els.modal.classList.contains("hidden")) closeAdd();
  }
});

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active"); filter=btn.dataset.filter; render();
}));

els.sites.addEventListener("click",e=>{
  const btn=e.target.closest("button[data-action]"); if(!btn)return;
  const index=Number(btn.dataset.index), action=btn.dataset.action;
  if(action==="reject") openReject(index);
  else {
    sites[index].status=action;
    if(action!=="rejected") delete sites[index].reason;
    save(); render();
  }
});

els.rejectConfirm.addEventListener("click",()=>{
  if(rejectIndex===null)return;
  sites[rejectIndex].status="rejected";
  sites[rejectIndex].reason=els.rejectReason.value.trim() || "Does not meet current quality requirements";
  save(); closeReject(); render();
});

els.form.addEventListener("submit",e=>{
  e.preventDefault();
  const domain=els.domain.value.trim().replace(/^https?:\/\//i,"").replace(/\/.*$/,"");
  sites.unshift({name:els.name.value.trim(),domain,category:els.category.value,status:"pending"});
  save(); els.form.reset(); closeAdd();
  filter="pending";
  document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter==="pending"));
  render();
});

render();
