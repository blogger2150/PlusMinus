const STORAGE_KEY = "pm_sites_v3";
const LEGACY_KEYS = ["pm_sites_v2","pm_sites_v1"];

const defaultSites = [
  { id: crypto.randomUUID(), name: "PlusMinus Example", domain: "plusminus.example", category: "Technology", status: "pending", reason: "" },
  { id: crypto.randomUUID(), name: "Sample News", domain: "sample-news.example", category: "News", status: "rejected", reason: "Incomplete website information" }
];

const els = {
  sites: document.getElementById("sites"),
  pending: document.getElementById("pendingCount"),
  approved: document.getElementById("approvedCount"),
  rejected: document.getElementById("rejectedCount"),
  add: document.getElementById("addBtn"),
  modal: document.getElementById("modal"),
  close: document.getElementById("close"),
  form: document.getElementById("siteForm"),
  name: document.getElementById("name"),
  domain: document.getElementById("domain"),
  category: document.getElementById("category")
};

function normalizeSites(list) {
  return (Array.isArray(list) ? list : []).map((site, i) => ({
    id: site.id || `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    name: String(site.name || "").trim(),
    domain: String(site.domain || "").trim(),
    category: String(site.category || "General"),
    status: ["pending","approved","rejected"].includes(String(site.status).toLowerCase())
      ? String(site.status).toLowerCase() : "pending",
    reason: String(site.reason || "")
  })).filter(site => site.name || site.domain);
}

function loadSites() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(current)) return normalizeSites(current);

    for (const key of LEGACY_KEYS) {
      const legacy = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(legacy)) return normalizeSites(legacy);
    }
  } catch (e) {}
  return normalizeSites(defaultSites);
}

let sites = loadSites();
localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
let filter = "all";

let filter = "all";

function save() {
  sites = normalizeSites(sites);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

function render() {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  sites.forEach(site => counts[site.status]++);

  els.pending.textContent = counts.pending;
  els.approved.textContent = counts.approved;
  els.rejected.textContent = counts.rejected;

  const visible = sites.filter(site => filter === "all" || site.status === filter);
  els.sites.innerHTML = visible.length
    ? visible.map(site => {
        const index = sites.indexOf(site);
        return `<div class="site">
          <div class="siteinfo">
            <h3>${escapeHtml(site.name)} <span class="badge">${escapeHtml(site.status)}</span></h3>
            <p>${escapeHtml(site.domain)} · ${escapeHtml(site.category)}${site.reason ? " · " + escapeHtml(site.reason) : ""}</p>
          </div>
          <div class="actions">
            ${site.status !== "approved" ? `<button class="approve" data-action="approve" data-index="${index}">Approve</button>` : ""}
            ${site.status !== "rejected" ? `<button data-action="reject" data-index="${index}">Reject</button>` : ""}
            ${site.status !== "pending" ? `<button data-action="pending" data-index="${index}">Re-review</button>` : ""}
          </div>
        </div>`;
      }).join("")
    : `<div class="empty">No websites in this view.</div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function setStatus(index, status) {
  if (!sites[index]) return;
  sites[index].status = status;
  if (status !== "rejected") sites[index].reason = "";
  save();
  render();
}

function rejectSite(index) {
  const reason = window.prompt(
    "Reason for rejection (e.g. thin content, broken links, incomplete pages):",
    "Incomplete website information"
  );
  if (reason === null) return;
  sites[index].status = "rejected";
  sites[index].reason = reason.trim() || "Does not meet current quality requirements";
  save();
  render();
}

function openModal() {
  els.modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  window.setTimeout(() => els.name.focus(), 0);
}

function closeModal() {
  els.modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

els.add.addEventListener("click", openModal);
els.close.addEventListener("click", closeModal);

// Close by tapping the backdrop, but never when tapping inside the card.
els.modal.addEventListener("click", event => {
  if (event.target === els.modal) closeModal();
});

// Mobile-friendly keyboard escape.
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    filter = button.dataset.filter;
    render();
  });
});

els.sites.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const index = Number(button.dataset.index);
  if (button.dataset.action === "reject") rejectSite(index);
  else setStatus(index, button.dataset.action);
});

els.form.addEventListener("submit", event => {
  event.preventDefault();
  const domain = els.domain.value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  sites.unshift({
    name: els.name.value.trim(),
    domain,
    category: els.category.value,
    status: "pending"
  });
  save();
  els.form.reset();
  closeModal();
  render();
});

render();

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    try { sites = normalizeSites(JSON.parse(event.newValue)); render(); } catch (e) {}
  }
});
