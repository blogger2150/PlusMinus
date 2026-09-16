const data = [
  {domain:"plusminus.example",title:"Understanding the basics of search",desc:"Prototype result for testing the PlusMinus search experience.",tags:["technology","science"]},
  {domain:"independent.example",title:"Useful information without the noise",desc:"Controlled result that will later come from approved websites.",tags:["india","science"]},
  {domain:"openweb.example",title:"A cleaner way to discover websites",desc:"PlusMinus is designed around relevance, quality and transparent ranking.",tags:["technology","india"]}
];

const tabContent = {
  news: q => `<div class="type-card"><span class="type-icon">N</span><div><h3>News results</h3><p>News search for “${escapeHtml(q)}” is ready for the future news index.</p></div></div>`,
  images: q => `<div class="image-grid"><div class="visual-card">IMAGE 01</div><div class="visual-card">IMAGE 02</div><div class="visual-card">IMAGE 03</div></div><p class="prototype-note">Image search prototype for “${escapeHtml(q)}”.</p>`,
  videos: q => `<div class="video-grid"><div class="video-card"><span>▶</span><div><b>Video result</b><small>Prototype · ${escapeHtml(q)}</small></div></div><div class="video-card"><span>▶</span><div><b>More video results</b><small>Prototype index</small></div></div></div>`,
  maps: q => `<div class="map-card"><div class="map-grid"></div><div><h3>Map results</h3><p>Location results for “${escapeHtml(q)}” will appear here when Maps indexing is connected.</p></div></div>`
};

let currentQuery = "";
let currentTab = "all";

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c]));
}

function renderResults() {
  const q = currentQuery.trim();
  document.getElementById("meta").textContent = `${currentTab === "all" ? "Prototype" : currentTab[0].toUpperCase()+currentTab.slice(1)+" prototype"} results for “${q}”`;

  if (currentTab !== "all") {
    document.getElementById("list").innerHTML = tabContent[currentTab](q);
    return;
  }

  const words = q.toLowerCase().split(/\s+/);
  const matches = data.filter(x => words.some(a =>
    (x.domain+" "+x.title+" "+x.desc+" "+x.tags.join(" ")).toLowerCase().includes(a)
  ));
  const results = matches.length ? matches : data;
  document.getElementById("list").innerHTML = results.map(x =>
    `<article class="result"><div class="domain">${escapeHtml(x.domain)}</div>
     <h2>${escapeHtml(x.title)}</h2><p>${escapeHtml(x.desc)}</p></article>`
  ).join("");
}

function search(q) {
  q = q.trim();
  if (!q) return;
  currentQuery = q;
  document.getElementById("hero").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("rq").value = q;
  currentTab = "all";
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === "all"));
  renderResults();
}

document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault(); search(document.getElementById("q").value);
});
document.getElementById("resultForm").addEventListener("submit", e => {
  e.preventDefault(); search(document.getElementById("rq").value);
});
document.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => search(b.dataset.q)));
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
  currentTab = b.dataset.tab;
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === b));
  renderResults();
}));
