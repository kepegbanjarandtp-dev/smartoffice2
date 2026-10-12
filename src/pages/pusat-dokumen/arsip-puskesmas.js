/* ==========================================================
   SMART OFFICE — ARSIP PUSKESMAS
   Frontend module terpisah dari Penomoran SK/SOP.
   Adapter backend disiapkan melalui:
   window.smartofficeArsipPuskesmasAdapter
   Kontrak adapter:
     list({ kategori, forceRefresh }) -> Promise<Array>
     save(payload) -> Promise<void>
   payload save: { kategori, tahunDokumen, namaArsip, keterangan, statusArsip, file }
   file: { name, mimeType, base64 } atau null
========================================================== */

import "./arsip-puskesmas.css";

const CATEGORIES = [
  { id:"profil-identitas", name:"Profil & Identitas Puskesmas", description:"Profil, struktur organisasi, SK pendirian, data dasar", icon:"building", tone:"blue" },
  { id:"regulasi-pedoman", name:"Regulasi & Pedoman", description:"Peraturan, kebijakan, pedoman dan surat edaran", icon:"gavel", tone:"pink" },
  { id:"mutu-akreditasi", name:"Mutu & Akreditasi", description:"Dokumen mutu, instrumen, eviden, hasil survei", icon:"shield", tone:"green" },
  { id:"laporan-penting", name:"Laporan Penting", description:"Laporan tahunan, profil kesehatan, laporan kinerja dan evaluasi", icon:"report", tone:"yellow" },
  { id:"perencanaan", name:"Perencanaan", description:"RUK, RPK, rencana kegiatan, dan dokumen perencanaan", icon:"calendar", tone:"purple" },
  { id:"kerja-sama", name:"Kerja Sama", description:"MoU, PKS, jejaring, dan dokumen kerja sama", icon:"handshake", tone:"teal" },
  { id:"kedaruratan", name:"Dokumen Kedaruratan", description:"Dokumen yang harus mudah diakses saat situasi darurat", icon:"alert", tone:"red" },
  { id:"lainnya", name:"Lainnya", description:"Arsip penting lainnya", icon:"archive", tone:"blue" },
  { id:"kedaluwarsa", name:"Dokumen Kedaluwarsa", description:"Dokumen lama yang tidak aktif", icon:"trash", tone:"gray" }
];

const ICONS = {
  building:'<rect x="4" y="9" width="16" height="12" rx="1"/><path d="M9 9V4h6v5M12 12v6M9 15h6M2 21h20"/>',
  gavel:'<path d="m14 6 4 4M12 8l4-4 4 4-4 4M4 20l9-9M3 21h10M6 6l4 4"/>',
  shield:'<path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
  report:'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h7"/>',
  handshake:'<path d="m3 12 4-4 4 2 3-2 7 4-5 6-4-2-3 2zM7 8 5 6l-3 3M17 8l2-2 3 3M9 13l3 3M12 11l4 4"/>',
  alert:'<path d="M12 3 22 21H2zM12 9v5M12 17h.01"/>',
  archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M9 13h6"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  file:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  filter:'<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
  sort:'<path d="M4 6h16M4 12h11M4 18h6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-1"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>'
};
const svg = (name, cls="") => `<svg class="arp-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.file}</svg>`;
const esc = (value="") => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state = { root:null, category:null, records:[], allCounts:{}, query:"", sort:"newest", status:"", year:"", cache:new Map(), handlers:[], busy:false };

export async function smartofficeInitArsipPuskesmas() {
  const root = document.getElementById("smartofficeArsipPuskesmasContent");
  if (!root) {
    console.warn("Arsip Puskesmas: elemen #smartofficeArsipPuskesmasContent belum ada di HTML.");
    return;
  }
  state.root = root;
  root.innerHTML = renderHome();
  bindRoot();
  // Kategori sengaja tidak memicu pembacaan dokumen. Angka akan diisi setelah
  // adapter mendukung ringkasan count; tidak mengarang jumlah dari mockup.
  await loadCategoryCounts();
}

export function smartofficeDestroyArsipPuskesmas() {
  if (state.root) state.handlers.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
  state.handlers = [];
  state.root = null;
  state.category = null;
  state.records = [];
  state.query = "";
}

function bind(el, event, fn) {
  if (!el) return;
  el.addEventListener(event, fn);
  state.handlers.push([el,event,fn]);
}
function bindRoot() {
  const root = state.root;
  bind(root, "click", onClick);
  bind(root, "input", onInput);
  bind(root, "change", onChange);
  bind(root, "submit", onSubmit);
}
function adapter() { return window.smartofficeArsipPuskesmasAdapter || null; }

function renderHome() {
  return `
  <section class="arp-shell">
    <div class="arp-banner">
      <div class="arp-banner-mark">${svg("archive")}</div>
      <div class="arp-banner-copy"><h2>Arsip Puskesmas</h2><p>Dokumen penting dan arsip bersama<br class="arp-desktop-break"> untuk mendukung operasional Puskesmas.</p></div>
      <div class="arp-folder-art" aria-hidden="true"><span>▤</span><span>▤</span><span>▰</span></div>
      <div class="arp-slogan">“Dokumen<br> Tertata,<br> Layanan<br> Lebih Bermakna”</div>
    </div>
    <div class="arp-toolbar">
      <label class="arp-search">${svg("search")}<input data-arp-search type="search" placeholder="Cari kategori atau nama dokumen..." autocomplete="off" aria-label="Cari kategori atau nama dokumen"></label>
      <button class="arp-tool-btn" type="button" data-arp-sort>${svg("sort")}<span>Urutkan</span></button>
      <button class="arp-tool-btn" type="button" data-arp-filter>${svg("filter")}<span>Filter</span></button>
    </div>
    <div class="arp-category-grid" data-arp-category-grid>${CATEGORIES.map(renderCategory).join("")}</div>
    <div class="arp-modal-host" data-arp-modal-host></div>
  </section>`;
}
function renderCategory(c) {
  const count = state.allCounts[c.id];
  return `<button type="button" class="arp-category-card" data-arp-category="${c.id}" aria-label="Buka kategori ${esc(c.name)}">
    <div class="arp-card-heading"><span class="arp-category-icon arp-tone-${c.tone}">${svg(c.icon)}</span><span class="arp-category-title">${esc(c.name)}</span></div>
    <p class="arp-category-description">${esc(c.description)}</p>
    <span class="arp-card-footer">${svg("file")}<span>${Number.isFinite(count) ? `${count} dokumen` : "Lihat dokumen"}</span>${svg("chevron","arp-card-chevron")}</span>
  </button>`;
}
async function loadCategoryCounts() {
  const api = adapter();
  if (!api || typeof api.counts !== "function") return;
  try {
    const counts = await api.counts();
    if (counts && typeof counts === "object") state.allCounts = counts;
    if (state.root && !state.category) {
      const grid = state.root.querySelector("[data-arp-category-grid]");
      if (grid) grid.innerHTML = CATEGORIES.filter(c => categoryMatches(c, state.query)).map(renderCategory).join("");
    }
  } catch (err) { console.error("Arsip: gagal memuat ringkasan kategori", err); }
}
function categoryMatches(c, query) {
  if (!query) return true;
  const q = query.toLocaleLowerCase("id-ID");
  return `${c.name} ${c.description}`.toLocaleLowerCase("id-ID").includes(q);
}
function onInput(e) {
  if (e.target.matches("[data-arp-search]")) {
    state.query = e.target.value.trim();
    if (state.category) renderRecords();
    else {
      const grid = state.root.querySelector("[data-arp-category-grid]");
      if (grid) grid.innerHTML = CATEGORIES.filter(c => categoryMatches(c,state.query)).map(renderCategory).join("");
    }
  }
}
function onChange(e) {
  if (e.target.matches("[data-arp-status]")) { state.status=e.target.value; renderRecords(); }
  if (e.target.matches("[data-arp-year]")) { state.year=e.target.value; renderRecords(); }
  if (e.target.matches("[data-arp-sort-select]")) { state.sort=e.target.value; renderRecords(); }
}
async function onClick(e) {
  const target = e.target.closest("button");
  if (!target || !state.root.contains(target)) return;
  if (target.matches("[data-arp-category]")) { await openCategory(target.dataset.arpCategory); return; }
  if (target.matches("[data-arp-back]")) { state.category=null; state.records=[]; state.status=""; state.year=""; state.query=""; state.root.innerHTML=renderHome(); await loadCategoryCounts(); return; }
  if (target.matches("[data-arp-refresh]")) { state.cache.delete(state.category); await loadCategory(state.category,true); return; }
  if (target.matches("[data-arp-add]")) { showForm(); return; }
  if (target.matches("[data-arp-close-modal]")) { closeModal(); return; }
  if (target.matches("[data-arp-sort]")) { showSort(); return; }
  if (target.matches("[data-arp-filter]")) { showFilter(); return; }
  if (target.matches("[data-arp-open-file]")) {
    const record=state.records.find(x=>String(x.idArsip||x.id||"")===target.dataset.arpOpenFile);
    if (record && record.fileUrl) window.open(record.fileUrl,"_blank","noopener,noreferrer");
    else alert("Tautan file belum tersedia pada data arsip ini.");
    return;
  }
  if (target.matches("[data-arp-clear-filter]")) { state.status=""; state.year=""; renderRecords(); return; }
}
async function openCategory(id) {
  state.category=CATEGORIES.find(c=>c.id===id) || null;
  if (!state.category) return;
  state.query=""; state.status=""; state.year="";
  await loadCategory(id,false);
}
async function loadCategory(id, forceRefresh) {
  if (!state.category || state.category.id!==id) return;
  const host=state.root.querySelector(".arp-shell");
  if (!host) return;
  if (!forceRefresh && state.cache.has(id)) state.records=state.cache.get(id);
  else {
    const api=adapter();
    if (!api || typeof api.list!=="function") {
      state.records=[];
      renderRecords("Backend arsip belum dihubungkan. Siapkan adapter Firestore/GAS terlebih dahulu; nama aksi dan koleksi tidak diasumsikan oleh modul ini.");
      return;
    }
    state.busy=true;
    renderRecords("Memuat arsip...");
    try {
      const result=await api.list({kategori:id,forceRefresh:Boolean(forceRefresh)});
      state.records=Array.isArray(result)?result:[];
      state.cache.set(id,state.records);
    } catch(err) {
      console.error("Arsip: gagal memuat kategori",err);
      state.records=[];
      renderRecords(err?.message || "Gagal memuat data arsip. Silakan coba lagi.");
      return;
    } finally { state.busy=false; }
  }
  renderRecords();
}
function renderRecords(message="") {
  if (!state.root || !state.category) return;
  const filtered=state.records.filter(r=>{
    const q=state.query.toLocaleLowerCase("id-ID");
    const hay=`${r.namaArsip||r.nama||""} ${r.keterangan||""} ${r.tahunDokumen||r.tahun||""}`.toLocaleLowerCase("id-ID");
    const status=String(r.statusArsip||r.status||"Aktif");
    const year=String(r.tahunDokumen||r.tahun||"");
    const isExpired=state.category.id==="kedaluwarsa";
    return (!q || hay.includes(q)) && (!state.status || status===state.status) && (!state.year || year===state.year) && (!isExpired || /kedaluwarsa|tidak aktif|nonaktif/i.test(status));
  });
  filtered.sort((a,b)=>{
    if(state.sort==="name") return String(a.namaArsip||a.nama||"").localeCompare(String(b.namaArsip||b.nama||""),"id");
    if(state.sort==="oldest") return String(a.tahunDokumen||a.tahun||"").localeCompare(String(b.tahunDokumen||b.tahun||""));
    return String(b.tahunDokumen||b.tahun||"").localeCompare(String(a.tahunDokumen||a.tahun||""));
  });
  const years=[...new Set(state.records.map(r=>String(r.tahunDokumen||r.tahun||"")).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
  state.root.innerHTML=`<section class="arp-shell">
    <div class="arp-detail-header"><button type="button" class="arp-back-btn" data-arp-back>${svg("back")}<span>Kategori</span></button><div class="arp-detail-title"><span class="arp-category-icon arp-tone-${state.category.tone}">${svg(state.category.icon)}</span><div><h2>${esc(state.category.name)}</h2><p>${esc(state.category.description)}</p></div></div><button type="button" class="arp-tool-btn arp-refresh-btn" data-arp-refresh>${svg("refresh")}<span>Refresh</span></button></div>
    <div class="arp-toolbar arp-detail-toolbar"><label class="arp-search">${svg("search")}<input data-arp-search type="search" value="${esc(state.query)}" placeholder="Cari nama dokumen..." aria-label="Cari nama dokumen"></label><button class="arp-tool-btn" type="button" data-arp-sort>${svg("sort")}<span>Urutkan</span></button><button class="arp-tool-btn" type="button" data-arp-filter>${svg("filter")}<span>Filter</span></button><button class="arp-primary-btn" type="button" data-arp-add>${svg("plus")}<span>Tambah Arsip</span></button></div>
    <div class="arp-result-meta"><strong>${filtered.length} dokumen</strong><span>${esc(state.category.name)}</span></div>
    ${message?`<div class="arp-notice">${esc(message)}</div>`:""}
    <div class="arp-record-list">${filtered.length?filtered.map(renderRecord).join(""):(!message?`<div class="arp-empty">${svg("file")}<h3>Belum ada arsip</h3><p>Dokumen dalam kategori ini akan tampil di sini.</p><button class="arp-primary-btn" type="button" data-arp-add>${svg("plus")} Tambah Arsip</button></div>`:"")}</div>
    <div class="arp-modal-host" data-arp-modal-host></div>
  </section>`;
}
function renderRecord(r) {
  const id=String(r.idArsip||r.id||"");
  const name=r.namaArsip||r.nama||"Dokumen tanpa nama";
  const year=r.tahunDokumen||r.tahun||"—";
  const status=r.statusArsip||r.status||"Aktif";
  return `<article class="arp-record-card"><span class="arp-record-file">${svg("file")}</span><div class="arp-record-main"><h3>${esc(name)}</h3><p>${esc(r.keterangan||"Tidak ada keterangan")}</p><div class="arp-record-meta"><span>Tahun ${esc(year)}</span><span class="arp-status arp-status-${statusSlug(status)}">${esc(status)}</span></div></div><button type="button" class="arp-open-file" data-arp-open-file="${esc(id)}" ${r.fileUrl?"":"disabled"} aria-label="Buka dokumen">${svg("chevron")}</button></article>`;
}
function statusSlug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"aktif";}
function showSort() {
  showModal(`<div class="arp-modal-head"><h3>Urutkan Arsip</h3><button type="button" data-arp-close-modal aria-label="Tutup">${svg("close")}</button></div><label class="arp-field"><span>Urutan</span><select data-arp-sort-select><option value="newest" ${state.sort==="newest"?"selected":""}>Tahun terbaru</option><option value="oldest" ${state.sort==="oldest"?"selected":""}>Tahun terlama</option><option value="name" ${state.sort==="name"?"selected":""}>Nama dokumen A–Z</option></select></label><div class="arp-modal-actions"><button type="button" class="arp-primary-btn" data-arp-close-modal>Terapkan</button></div>`);
}
function showFilter() {
  const years=[...new Set(state.records.map(r=>String(r.tahunDokumen||r.tahun||"")).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
  showModal(`<div class="arp-modal-head"><h3>Filter Arsip</h3><button type="button" data-arp-close-modal aria-label="Tutup">${svg("close")}</button></div><label class="arp-field"><span>Tahun Dokumen</span><select data-arp-year><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}" ${state.year===y?"selected":""}>${esc(y)}</option>`).join("")}</select></label><label class="arp-field"><span>Status Arsip</span><select data-arp-status><option value="">Semua status</option>${["Aktif","Diarsipkan","Kedaluwarsa"].map(s=>`<option ${state.status===s?"selected":""}>${s}</option>`).join("")}</select></label><div class="arp-modal-actions"><button type="button" class="arp-secondary-btn" data-arp-clear-filter>Reset filter</button><button type="button" class="arp-primary-btn" data-arp-close-modal>Terapkan</button></div>`);
}
function showForm() {
  const years=Array.from({length:12},(_,i)=>new Date().getFullYear()-i);
  showModal(`<form data-arp-form><div class="arp-modal-head"><h3>Tambah Arsip</h3><button type="button" data-arp-close-modal aria-label="Tutup">${svg("close")}</button></div>
    <label class="arp-field"><span>Kategori</span><input value="${esc(state.category.name)}" readonly></label>
    <label class="arp-field"><span>Tahun Dokumen <b>*</b></span><select name="tahunDokumen" required><option value="">Pilih tahun</option>${years.map(y=>`<option value="${y}">${y}</option>`).join("")}</select></label>
    <label class="arp-field"><span>Nama Arsip <b>*</b></span><input name="namaArsip" maxlength="180" required placeholder="Masukkan nama dokumen"></label>
    <label class="arp-field"><span>Keterangan</span><textarea name="keterangan" rows="3" maxlength="1000" placeholder="Keterangan tambahan (opsional)"></textarea></label>
    <label class="arp-field"><span>Status Arsip</span><select name="statusArsip"><option>Aktif</option><option>Diarsipkan</option><option>Kedaluwarsa</option></select></label>
    <label class="arp-field"><span>File Dokumen <b>*</b></span><span class="arp-upload-box">${svg("upload")}<span>Pilih PDF, Word, Excel, atau gambar</span><input type="file" name="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"></span><small class="arp-help">Batas ukuran dan jenis file final mengikuti validasi backend.</small></label>
    <div class="arp-modal-actions"><button type="button" class="arp-secondary-btn" data-arp-close-modal>Batal</button><button type="submit" class="arp-primary-btn">Simpan Arsip</button></div></form>`);
}
function showModal(html) {
  const host=state.root.querySelector("[data-arp-modal-host]");
  if (!host) return;
  host.innerHTML=`<div class="arp-modal-backdrop"><div class="arp-modal" role="dialog" aria-modal="true">${html}</div></div>`;
}
function closeModal(){const host=state.root?.querySelector("[data-arp-modal-host]");if(host)host.innerHTML="";}
async function onSubmit(e) {
  if (!e.target.matches("[data-arp-form]")) return;
  e.preventDefault();
  const api=adapter();
  if (!api || typeof api.save!=="function") { alert("Backend penyimpanan arsip belum dihubungkan."); return; }
  const form=e.target;
  const file=form.elements.file.files[0];
  if (!file) { form.elements.file.focus(); return; }
  const submit=form.querySelector('[type="submit"]');
  submit.disabled=true; submit.textContent="Menyimpan...";
  try {
    const base64=await fileToBase64(file);
    await api.save({
      kategori:state.category.id,
      tahunDokumen:form.elements.tahunDokumen.value,
      namaArsip:form.elements.namaArsip.value.trim(),
      keterangan:form.elements.keterangan.value.trim(),
      statusArsip:form.elements.statusArsip.value,
      file:{name:file.name,mimeType:file.type || "application/octet-stream",base64}
    });
    closeModal();
    state.cache.delete(state.category.id);
    await loadCategory(state.category.id,true);
  } catch(err) {
    console.error("Arsip: gagal menyimpan",err);
    alert(err?.message || "Gagal menyimpan arsip. Data belum dapat dipastikan tersimpan.");
  } finally { if (submit) { submit.disabled=false; submit.textContent="Simpan Arsip"; } }
}
function fileToBase64(file) {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");
    reader.onerror=()=>reject(new Error("File tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}
