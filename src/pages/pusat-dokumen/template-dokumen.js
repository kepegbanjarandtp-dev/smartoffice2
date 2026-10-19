
/* ==========================================================
   SMART OFFICE — TEMPLATE DOKUMEN
   File: template-dokumen.js
   CSS terpisah: template-dokumen.css

   Adapter data yang dibutuhkan:
   window.smartofficeTemplateDokumenAdapter.list()
   Mengembalikan Array data template.

   Setiap record idealnya berisi:
   idTemplate, kategori, namaTemplate, keterangan,
   namaFile, fileIdDrive, fileUrl, mimeType, status
========================================================== */
import "./template-dokumen.css";

import {
    smartofficeGetSession
} from "../../core/session.js";

import {
    smartofficeOpenPreviewDokumen
} from "../../components/preview/preview.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeGetTemplateDokumen,
    smartofficeSimpanTemplateDokumen,
    smartofficeUpdateStatusTemplateDokumen,
    smartofficeHapusTemplateDokumen,
    smartofficeSetLockTemplateDokumen
} from "../../services/template-dokumen.service.js";


/* ==========================================================
   MASTER 9 KATEGORI
========================================================== */
const SMARTOFFICE_TEMPLATE_KATEGORI = [
    "Surat",
    "Kepegawaian",
    "Pelayanan Kesehatan",
    "Keuangan",
    "Perencanaan & Pelaporan",
    "Administrasi & Umum",
    "Mutu & Akreditasi",
    "BOK",
    "Lainnya"
];


/* ==========================================================
   STATE
========================================================== */
let smartofficeTemplateData = [];
let smartofficeTemplateCacheLoaded = false;
let smartofficeTemplateHandlers = [];
let smartofficeTemplateInitialized = false;
let smartofficeTemplateLoading = false;


/* ==========================================================
   SESSION USER TEMPLATE DOKUMEN
========================================================== */
function getTemplateCurrentUser() {
    const session =
        typeof smartofficeGetSession === "function"
            ? smartofficeGetSession()
            : (
                window.smartofficeCurrentUser ||
                window.currentUser ||
                {}
            );

    return {
        nip: String(session?.nip || session?.NIP || "").trim(),
        role: String(session?.role || "USER")
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_")
    };
}

function canEditTemplate(record) {
    const user = getTemplateCurrentUser();

    if (!record || !user.nip) {
        return false;
    }

    const pembuat = String(
        record.dibuatOleh ||
        record.DIBUAT_OLEH ||
        ""
    ).trim();

    const isPembuat = user.nip === pembuat;

    const isPJ = [
        "PJ",
        "PENANGGUNG_JAWAB",
        "PENANGGUNGJAWAB"
    ].includes(user.role);

    const isAdmin = user.role === "ADMIN";

    const isSuperAdmin = [
        "SUPERADMIN",
        "SUPER_ADMIN"
    ].includes(user.role);

    return isPembuat || isPJ || isAdmin || isSuperAdmin;
}

function canDeleteTemplate() {
    return ["SUPERADMIN", "SUPER_ADMIN"].includes(getTemplateCurrentUser().role);
}

/* ==========================================================
   MODAL KONFIRMASI PREMIUM — LOCK / UNLOCK TEMPLATE
   Menggantikan confirm() bawaan browser.
========================================================== */
function smartofficeTemplateConfirmLock({ namaTemplate, isLock }) {
    return new Promise(resolve => {
        const existing = document.getElementById("smartofficeTemplateConfirmModal");
        existing?.remove();

        const action = isLock ? "mengunci" : "membuka kunci";
        const title = isLock ? "Kunci Template?" : "Buka Kunci Template?";
        const buttonLabel = isLock ? "Ya, Kunci Template" : "Ya, Buka Kunci";
        const description = isLock
            ? "Template akan dikunci. Metadata dan file tidak dapat diedit sampai SUPERADMIN membuka kuncinya kembali."
            : "Template akan dibuka kuncinya sehingga dapat diedit kembali sesuai hak akses pengguna.";

        const backdrop = document.createElement("div");
        backdrop.id = "smartofficeTemplateConfirmModal";
        backdrop.className = "smartoffice-template-confirm-backdrop";
        backdrop.innerHTML = `
            <section class="smartoffice-template-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="smartofficeTemplateConfirmTitle">
                <div class="smartoffice-template-confirm-header">
                    <div class="smartoffice-template-confirm-icon ${isLock ? "lock" : "unlock"}" aria-hidden="true">${isLock ? "🔒" : "🔓"}</div>
                    <div class="smartoffice-template-confirm-heading">
                        <h3 id="smartofficeTemplateConfirmTitle">${title}</h3>
                        <p>Konfirmasi keamanan dokumen</p>
                    </div>
                    <button type="button" class="smartoffice-template-confirm-close" data-confirm-cancel aria-label="Tutup">×</button>
                </div>
                <div class="smartoffice-template-confirm-content">
                    <p class="smartoffice-template-confirm-question">Yakin ingin ${action} template ini?</p>
                    <div class="smartoffice-template-confirm-name">${smartofficeTemplateEscape(namaTemplate)}</div>
                    <p class="smartoffice-template-confirm-description">${description}</p>
                </div>
                <div class="smartoffice-template-confirm-actions">
                    <button type="button" class="smartoffice-template-confirm-cancel" data-confirm-cancel>Batal</button>
                    <button type="button" class="smartoffice-template-confirm-submit ${isLock ? "danger" : "primary"}" data-confirm-submit>${buttonLabel}</button>
                </div>
            </section>
        `;

        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            document.removeEventListener("keydown", onKeydown);
            backdrop.remove();
            document.body.classList.remove("smartoffice-template-modal-open");
            resolve(value);
        };
        const onKeydown = event => {
            if (event.key === "Escape") finish(false);
        };

        backdrop.addEventListener("click", event => {
            if (event.target === backdrop || event.target.closest("[data-confirm-cancel]")) finish(false);
            if (event.target.closest("[data-confirm-submit]")) finish(true);
        });
        document.addEventListener("keydown", onKeydown);
        document.body.appendChild(backdrop);
        document.body.classList.add("smartoffice-template-modal-open");
        backdrop.querySelector("[data-confirm-submit]")?.focus();
    });
}

/* ==========================================================
   HELPER STATUS LOCK TEMPLATE
   Membaca IS_LOCK dari data backend dalam beberapa format.
========================================================== */
function isTemplateLocked(record) {
    const value = record?.isLock ?? record?.IS_LOCK ?? record?.is_lock ?? false;
    return value === true || ["TRUE", "1", "YA", "LOCKED", "TERKUNCI"].includes(
        String(value).trim().toUpperCase()
    );
}


/* ==========================================================
   HELPER
========================================================== */
function smartofficeTemplateEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function smartofficeTemplateNormalize(value) {
    return String(value ?? "").trim().toLowerCase();
}

function smartofficeTemplateGet(record, keys) {
    for (const key of keys) {
        if (record?.[key] !== undefined && record[key] !== null) {
            const value = String(record[key]).trim();
            if (value) return value;
        }
    }
    return "";
}

function smartofficeTemplateKategori(record) {
    return smartofficeTemplateGet(record, [
        "kategori", "Kategori", "KATEGORI"
    ]) || "Lainnya";
}

function smartofficeTemplateNama(record) {
    return smartofficeTemplateGet(record, [
        "namaTemplate", "NAMA_TEMPLATE",
        "nama_template", "namaFile", "NAMA_FILE"
    ]) || "Template tanpa nama";
}

function smartofficeTemplateStatus(record) {
    return smartofficeTemplateGet(record, [
        "status", "STATUS", "statusTemplate", "STATUS_TEMPLATE"
    ]) || "Aktif";
}

function smartofficeTemplateFileUrl(record) {
    return smartofficeTemplateGet(record, [
        "fileUrl", "FILE_URL", "fileURL",
        "fileUrlDrive", "FILE_URL_DRIVE"
    ]);
}

function smartofficeTemplateFileId(record) {
    return smartofficeTemplateGet(record, [
        "fileIdDrive", "FILE_ID_DRIVE",
        "fileId", "FILE_ID", "idFile"
    ]);
}

function smartofficeTemplateIcon(record) {
    const mime = smartofficeTemplateNormalize(
        smartofficeTemplateGet(record, ["mimeType", "MIME_TYPE"])
    );
    const name = smartofficeTemplateNama(record).toLowerCase();

    if (mime.includes("pdf") || name.endsWith(".pdf")) return "file-pdf";
    if (mime.includes("word") || /\.(doc|docx)$/.test(name)) return "file-text";
    if (mime.includes("sheet") || /\.(xls|xlsx|csv)$/.test(name)) return "file-spreadsheet";
    return "file";
}


/* ==========================================================
   INIT HALAMAN
   Panggil ketika tab Template Dokumen dibuka.
========================================================== */
export async function smartofficeInitTemplateDokumen() {
    const root = document.getElementById("smartofficeTemplateDokumenContent");

    if (!root) {
        console.warn(
            "[Template Dokumen] Container #smartofficeTemplateDokumenContent belum tersedia."
        );
        return;
    }

    if (smartofficeTemplateInitialized) {
        smartofficeRenderTemplateList();
        return;
    }

    smartofficeTemplateInitialized = true;
    smartofficeRenderTemplateShell(root);
    smartofficeInitTemplateEvents(root);
    await smartofficeLoadTemplateDokumen();
}


/* ==========================================================
   STRUKTUR HALAMAN TEMPLATE DOKUMEN
   Banner mengikuti desain Arsip Puskesmas.
========================================================== */
function smartofficeRenderTemplateShell(root) {
    root.innerHTML = `
        <section class="smartoffice-template">

            <!-- BANNER INFORMASI TEMPLATE DOKUMEN -->
            <div class="smartoffice-template-banner">

                <div class="smartoffice-template-banner-mark">
                    <svg
                        class="smartoffice-template-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20z"/>
                        <path d="M14 3.5v5h4"/>
                        <path d="M9 13h6"/>
                        <path d="M9 16.5h6"/>
                    </svg>
                </div>

                <div class="smartoffice-template-banner-copy">
                    <h2>Template Dokumen</h2>
                    <p>
                        Pusat template dokumen untuk mendukung
                        administrasi dan operasional Puskesmas.
                    </p>
                </div>

                <div
                    class="smartoffice-template-folder-art"
                    aria-hidden="true"
                >
                    <span>▤</span>
                    <span>▤</span>
                    <span>▰</span>
                </div>

                <div class="smartoffice-template-slogan">
                    Dokumen<br>
                    Tertata,<br>
                    Administrasi<br>
                    Lebih Mudah
                </div>

            </div>

            <!-- TOOLBAR PENCARIAN DAN FILTER -->
            <div class="smartoffice-template-toolbar">

                <div class="smartoffice-template-search-group">

                    <label
                        class="smartoffice-template-search-label"
                        for="smartofficeTemplateSearch"
                    >
                        Cari Template Dokumen
                    </label>

                    <div class="smartoffice-template-search">
                        <svg
                            class="smartoffice-template-search-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7"></circle>
                            <path d="m20 20-4-4"></path>
                        </svg>

                        <input
                            id="smartofficeTemplateSearch"
                            type="search"
                            placeholder="Cari nama template atau keterangan..."
                            autocomplete="off"
                            aria-label="Cari template dokumen"
                        >
                    </div>

                </div>

                <div class="smartoffice-template-filters">

                    <label class="smartoffice-template-field">
                        <span>Kategori</span>
                        <select id="smartofficeTemplateKategori">
                            <option value="">Semua kategori</option>
                            ${SMARTOFFICE_TEMPLATE_KATEGORI.map(kategori => `
                                <option value="${smartofficeTemplateEscape(kategori)}">
                                    ${smartofficeTemplateEscape(kategori)}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label class="smartoffice-template-field">
                        <span>Status</span>
                        <select id="smartofficeTemplateStatus">
                            <option value="">Semua status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                        </select>
                    </label>

                </div>

                <div class="smartoffice-template-filter-actions">
                    <button
                        type="button"
                        id="smartofficeTemplateReset"
                        class="smartoffice-template-button secondary"
                    >Reset filter</button>

                    <button
                        type="button"
                        id="smartofficeTemplateRefresh"
                        class="smartoffice-template-button primary"
                    >↻ Muat ulang</button>
                </div>

            </div>

            <!-- CARD DAFTAR TEMPLATE -->
            <div class="smartoffice-template-list-card">

                <!-- RINGKASAN DAFTAR TEMPLATE -->
                <div class="smartoffice-template-summary">
                    <div>
                        <h3>Daftar Template</h3>
                        <p id="smartofficeTemplateResultCount">
                            Memuat daftar template...
                        </p>
                    </div>

                    <button
                        type="button"
                        id="smartofficeTemplateAdd"
                        class="smartoffice-template-button primary smartoffice-template-add-button"
                    >＋ Tambah Template</button>
                </div>

                <!-- Daftar dokumen tetap menggunakan elemen yang sudah ada -->
                <div
                    id="smartofficeTemplateList"
                    class="smartoffice-template-grid"
                    aria-live="polite"
                ></div>

            </div>

            <!-- DAFTAR KARTU TEMPLATE -->
            <div
                id="smartofficeTemplateList"
                class="smartoffice-template-grid"
                aria-live="polite"
            ></div>

            <!-- MODAL -->
            <div
                id="smartofficeTemplateModal"
                class="smartoffice-template-modal"
                aria-hidden="true"
            ></div>

        </section>
    `;
}


/* ==========================================================
   EVENT FILTER
========================================================== */
function smartofficeInitTemplateEvents(root) {
    const search = root.querySelector("#smartofficeTemplateSearch");
    const kategori = root.querySelector("#smartofficeTemplateKategori");
    const status = root.querySelector("#smartofficeTemplateStatus");
    const reset = root.querySelector("#smartofficeTemplateReset");
    const refresh = root.querySelector("#smartofficeTemplateRefresh");
    const add = root.querySelector("#smartofficeTemplateAdd");

    const onSearch = () => smartofficeRenderTemplateList();
    const onKategori = () => smartofficeRenderTemplateList();
    const onStatus = () => smartofficeRenderTemplateList();

    const onReset = () => {
        search.value = "";
        kategori.value = "";
        status.value = "";
        smartofficeRenderTemplateList();
    };

    const onRefresh = () => smartofficeLoadTemplateDokumen(true);
    const onAdd = () => {
        window.smartofficeTemplateEditRecord = null;
        smartofficeTemplateOpenForm(root);
    };

    search.addEventListener("input", onSearch);
    kategori.addEventListener("change", onKategori);
    status.addEventListener("change", onStatus);
    reset.addEventListener("click", onReset);
    refresh.addEventListener("click", onRefresh);
    add?.addEventListener("click", onAdd);

    smartofficeTemplateHandlers = [
        [search, "input", onSearch],
        [kategori, "change", onKategori],
        [status, "change", onStatus],
        [reset, "click", onReset],
        [refresh, "click", onRefresh],
        ...(add ? [[add, "click", onAdd]] : [])
    ];
}


/* ==========================================================
   AMBIL DATA DARI ADAPTER
   Backend belum dianggap tersedia sampai adapter terhubung.
========================================================== */
export async function smartofficeLoadTemplateDokumen(forceRefresh = false) {
    const root = document.getElementById("smartofficeTemplateDokumenContent");
    const list = root?.querySelector("#smartofficeTemplateList");
    const count = root?.querySelector("#smartofficeTemplateResultCount");

    if (!root || !list || smartofficeTemplateLoading) return;

    // Gunakan cache jika data sudah pernah berhasil dimuat.
    if (!forceRefresh && smartofficeTemplateCacheLoaded) {
        smartofficeRenderTemplateList();
        return;
    }

    // Adapter global tetap didukung jika aplikasi sudah memasangnya.
    // Jika belum, gunakan service GAS bawaan modul ini.
    const adapter = window.smartofficeTemplateDokumenAdapter || {
        list: () => smartofficeGetTemplateDokumen()
    };

    if (!adapter || typeof adapter.list !== "function") {
        list.innerHTML = `
            <div class="smartoffice-template-state">
                <div class="smartoffice-template-state-icon">⌁</div>
                <h4>Data template belum terhubung</h4>
                <p>
                    Tampilan dan filter sudah siap. Hubungkan adapter
                    Template Dokumen ke fungsi backend yang tersedia
                    agar daftar file dapat ditampilkan.
                </p>
            </div>
        `;
        if (count) count.textContent = "Koneksi data belum tersedia";
        return;
    }

    smartofficeTemplateLoading = true;
    list.innerHTML = `
        <div class="smartoffice-template-state">
            <div class="smartoffice-template-spinner"></div>
            <p>Memuat template dokumen...</p>
        </div>
    `;

    try {
        const response = await adapter.list({ forceRefresh });

        if (Array.isArray(response)) {
            smartofficeTemplateData = response;
        } else if (Array.isArray(response?.data)) {
            smartofficeTemplateData = response.data;
        } else {
            throw new Error("Format data template dari backend tidak sesuai.");
        }

        smartofficeTemplateCacheLoaded = true;
        smartofficeRenderTemplateList();
    } catch (error) {
        console.error("[Template Dokumen] Gagal memuat data:", error);

        list.innerHTML = `
            <div class="smartoffice-template-state error">
                <h4>Gagal memuat template</h4>
                <p>${smartofficeTemplateEscape(error.message || "Terjadi kesalahan saat mengambil data.")}</p>
            </div>
        `;
        if (count) count.textContent = "Data gagal dimuat";

        smartofficeShowToast?.(
            error.message || "Gagal memuat Template Dokumen.",
            "error"
        );
    } finally {
        smartofficeTemplateLoading = false;
    }
}


/* ==========================================================
   FILTER + RENDER KARTU
========================================================== */
function smartofficeRenderTemplateList() {
    const root = document.getElementById("smartofficeTemplateDokumenContent");
    if (!root) return;

    const search = root.querySelector("#smartofficeTemplateSearch");
    const kategori = root.querySelector("#smartofficeTemplateKategori");
    const status = root.querySelector("#smartofficeTemplateStatus");
    const list = root.querySelector("#smartofficeTemplateList");
    const count = root.querySelector("#smartofficeTemplateResultCount");

    if (!search || !kategori || !status || !list) return;

    const keyword = smartofficeTemplateNormalize(search.value);
    const selectedKategori = kategori.value;
    const selectedStatus = status.value;

    const filtered = smartofficeTemplateData.filter(record => {
        const searchable = [
            smartofficeTemplateNama(record),
            smartofficeTemplateKategori(record),
            smartofficeTemplateGet(record, [
                "keterangan", "KETERANGAN", "deskripsi", "DESKRIPSI"
            ]),
            smartofficeTemplateGet(record, ["namaFile", "NAMA_FILE"])
        ].join(" ").toLowerCase();

        const matchSearch = !keyword || searchable.includes(keyword);
        const matchKategori = !selectedKategori ||
            smartofficeTemplateKategori(record) === selectedKategori;
        const matchStatus = !selectedStatus ||
            smartofficeTemplateNormalize(smartofficeTemplateStatus(record)) ===
            smartofficeTemplateNormalize(selectedStatus);

        return matchSearch && matchKategori && matchStatus;
    });

    if (count) {
        count.textContent = `${filtered.length} template ditemukan`;
    }

    if (!filtered.length) {
        list.innerHTML = `
            <div class="smartoffice-template-state">
                <div class="smartoffice-template-state-icon">⌕</div>
                <h4>Template tidak ditemukan</h4>
                <p>Coba ubah kata kunci atau reset filter.</p>
            </div>
        `;
        return;
    }

    const currentUser = getTemplateCurrentUser();
    const role = currentUser.role;
    const nipLogin = currentUser.nip;

    list.innerHTML = filtered.map((record, index) => {
        const nama = smartofficeTemplateNama(record);
        const kat = smartofficeTemplateKategori(record);
        const statusRecord = smartofficeTemplateStatus(record);
        const keterangan = smartofficeTemplateGet(record, [
            "keterangan", "KETERANGAN", "deskripsi", "DESKRIPSI"
        ]) || "Tidak ada keterangan.";
        const fileName = smartofficeTemplateGet(record, [
            "namaFile", "NAMA_FILE", "namaFileDrive", "NAMA_FILE_DRIVE"
        ]);
        const fileUrl = smartofficeTemplateFileUrl(record);
        const fileId = smartofficeTemplateFileId(record);

        const uploader = String(
            record.dibuatOleh || record.DIBUAT_OLEH || ""
        ).trim();

        const locked = isTemplateLocked(record);
        const canManage = canEditTemplate(record) || canDeleteTemplate();
        const canEdit = canEditTemplate(record) && !locked;
        const canDelete = canDeleteTemplate() && !locked;
        const canLock = canDeleteTemplate();

        return `            
            <article class="smartoffice-template-card ${locked ? "is-locked" : ""}">

                <!-- HEADER: IKON DAN STATUS -->
                <div class="smartoffice-template-card-top">
                    
                    <div class="smartoffice-template-file-icon">
                        ${(() => {
                            const iconType = smartofficeTemplateIcon(record);

                            if (iconType === "file-pdf") {
                                return `
                                    <svg viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M11 4h18l10 10v29H11z"
                                            fill="#fff0f0" stroke="#dc2626" stroke-width="2"/>
                                        <path d="M29 4v11h10"
                                            fill="none" stroke="#dc2626" stroke-width="2"/>
                                        <rect x="5" y="25" width="38" height="13" rx="3"
                                            fill="#dc2626"/>
                                        <text x="24" y="34.5" text-anchor="middle"
                                            font-size="10" font-weight="800" fill="#fff">PDF</text>
                                    </svg>`;
                            }

                            if (iconType === "file-spreadsheet") {
                                return `
                                    <svg viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M11 4h18l10 10v29H11z"
                                            fill="#e9f9ef" stroke="#16834a" stroke-width="2"/>
                                        <path d="M29 4v11h10"
                                            fill="none" stroke="#16834a" stroke-width="2"/>
                                        <rect x="5" y="25" width="38" height="13" rx="3"
                                            fill="#16834a"/>
                                        <text x="24" y="34.5" text-anchor="middle"
                                            font-size="10" font-weight="800" fill="#fff">XLS</text>
                                    </svg>`;
                            }

                            return `
                                <svg viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M11 4h18l10 10v29H11z"
                                        fill="#eaf2ff" stroke="#2463b7" stroke-width="2"/>
                                    <path d="M29 4v11h10"
                                        fill="none" stroke="#2463b7" stroke-width="2"/>
                                    <rect x="5" y="25" width="38" height="13" rx="3"
                                        fill="#2463b7"/>
                                    <text x="24" y="34.5" text-anchor="middle"
                                        font-size="10" font-weight="800" fill="#fff">DOC</text>
                                </svg>`;
                        })()}
                    </div>

                    <div class="smartoffice-template-card-badges">
                        <span class="smartoffice-template-status ${
                            smartofficeTemplateNormalize(statusRecord) === "aktif"
                                ? "active"
                                : "inactive"
                        }">
                            <span class="smartoffice-template-status-dot" aria-hidden="true"></span>
                            ${smartofficeTemplateEscape(statusRecord)}
                        </span>
                        ${locked
                            ? '<span class="smartoffice-template-lock-badge"><span aria-hidden="true">🔒</span> Terkunci</span>'
                            : '<span class="smartoffice-template-lock-badge unlocked"><span aria-hidden="true">🔓</span> Tidak Terkunci</span>'}
                    </div>
                </div>

                <!-- ISI CARD -->
                <div class="smartoffice-template-card-body">
                    <span class="smartoffice-template-category">
                        Kategori: ${smartofficeTemplateEscape(kat)}
                    </span>

                    <h4>${smartofficeTemplateEscape(nama)}</h4>
                    <p>${smartofficeTemplateEscape(keterangan)}</p>
                    ${fileName ? `
                        <div
                            class="smartoffice-template-filename"
                            title="${smartofficeTemplateEscape(fileName)}"
                        >
                            <span
                                class="smartoffice-template-filename-icon"
                                aria-hidden="true"
                            >▤</span>
                            <small>${smartofficeTemplateEscape(fileName)}</small>
                        </div>
                    ` : ""}
                </div>

                <!-- AKSI CARD -->
                <div class="smartoffice-template-card-actions">
                    <button
                        type="button"
                        class="smartoffice-template-button secondary"
                        data-template-preview="${index}"
                        ${(!fileId && !fileUrl) ? "disabled" : ""}
                    >Pratinjau</button>

                    <button
                        type="button"
                        class="smartoffice-template-button primary"
                        data-template-download="${index}"
                        ${!fileUrl ? "disabled" : ""}
                    >Unduh</button>

                    ${canManage ? `
                        <div class="smartoffice-template-more">
                            <button
                                type="button"
                                class="smartoffice-template-button secondary smartoffice-template-more-trigger"
                                data-template-more="${index}"
                                aria-expanded="false"
                                aria-label="Menu tindakan template"
                                title="Menu tindakan"
                            >⋮</button>

                            <div
                                class="smartoffice-template-more-menu"
                                data-template-menu="${index}"
                                hidden
                            >
                                ${canEdit
                                    ? `<button type="button" data-template-edit="${index}">Edit</button>`
                                    : ""}
                                ${canLock
                                    ? `<button type="button" data-template-lock="${index}" data-lock-next="${locked ? "false" : "true"}">${locked ? "🔓 Unlock" : "🔒 Lock"}</button>`
                                    : ""}
                                ${canDelete
                                    ? `<button type="button" class="danger" data-template-delete="${index}">Hapus</button>`
                                    : ""}
                                ${locked && !canLock
                                    ? '<span class="smartoffice-template-menu-note">Terkunci oleh SUPERADMIN</span>'
                                    : ""}
                            </div>
                        </div>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");

    // EVENT PREVIEW
    list.querySelectorAll("[data-template-preview]").forEach(button => {
        button.addEventListener("click", () => {
            const record = filtered[Number(button.dataset.templatePreview)];
            smartofficeTemplatePreview(record);
        });
    });

    // EVENT UNDUH
    list.querySelectorAll("[data-template-download]").forEach(button => {
        button.addEventListener("click", () => {
            const record = filtered[Number(button.dataset.templateDownload)];
            const url = smartofficeTemplateFileUrl(record);
            if (url) {
                const link = document.createElement("a");
                link.href = url;
                link.download = "";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        });
    });

    /* ==========================================================
       EVENT MENU MORE TEMPLATE
    ========================================================== */
    list.querySelectorAll("[data-template-more]").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            const index = button.dataset.templateMore;
            const menu = list.querySelector(`[data-template-menu="${index}"]`);
            const willOpen = menu?.hidden !== false;

            list.querySelectorAll("[data-template-menu]").forEach(item => {
                item.hidden = true;
            });
            list.querySelectorAll("[data-template-more]").forEach(item => {
                item.setAttribute("aria-expanded", "false");
            });

            if (menu && willOpen) {
                menu.hidden = false;
                button.setAttribute("aria-expanded", "true");
            }
        });
    });

    /* Tutup menu More saat klik di luar menu. */
    list.addEventListener("click", event => {
        if (!event.target.closest(".smartoffice-template-more")) {
            list.querySelectorAll("[data-template-menu]").forEach(item => { item.hidden = true; });
            list.querySelectorAll("[data-template-more]").forEach(item => item.setAttribute("aria-expanded", "false"));
        }
    });

    /* ==========================================================
       EVENT LOCK / UNLOCK TEMPLATE — SUPERADMIN
    ========================================================== */
    list.querySelectorAll("[data-template-lock]").forEach(button => {
        button.addEventListener("click", async () => {
            const record = filtered[Number(button.dataset.templateLock)];
            const user = getTemplateCurrentUser();
            const nextLock = button.dataset.lockNext === "true";
            const idTemplate = smartofficeTemplateGet(record, ["idTemplate", "ID_TEMPLATE"]);

            if (!record || !canDeleteTemplate()) {
                smartofficeShowToast?.("Hanya SUPERADMIN yang dapat Lock/Unlock template.", "error");
                return;
            }
            if (!user.nip) {
                smartofficeShowToast?.("NIP pengguna tidak ditemukan. Silakan login ulang.", "error");
                return;
            }
            if (!idTemplate) {
                smartofficeShowToast?.("ID template tidak ditemukan.", "error");
                return;
            }

            const confirmed = await smartofficeTemplateConfirmLock({
                namaTemplate: smartofficeTemplateNama(record),
                isLock: nextLock
            });
            if (!confirmed) return;

            try {
                button.disabled = true;
                await smartofficeSetLockTemplateDokumen({
                    idTemplate,
                    isLock: nextLock,
                    diperbaruiOleh: user.nip
                });
                smartofficeShowToast?.(nextLock ? "Template berhasil dikunci." : "Template berhasil dibuka.", "success");
                await smartofficeLoadTemplateDokumen(true);
            } catch (error) {
                console.error("[Template Dokumen] Gagal Lock/Unlock:", error);
                smartofficeShowToast?.(error?.message || "Gagal mengubah Lock Template Dokumen.", "error");
                button.disabled = false;
            }
        });
    });

    /* ==========================================================
       EVENT TOMBOL HAPUS TEMPLATE
    ========================================================== */
    list.querySelectorAll("[data-template-delete]").forEach(button => {
        button.addEventListener("click", async () => {
            const record = filtered[Number(button.dataset.templateDelete)];

            if (!record || !canDeleteTemplate()) {
                alert("Hanya SUPERADMIN yang dapat menghapus template.");
                return;
            }

            const idTemplate = smartofficeTemplateGet(record, [
                "idTemplate",
                "ID_TEMPLATE"
            ]);

            const namaTemplate = smartofficeTemplateNama(record);

            if (!idTemplate) {
                alert("ID template tidak ditemukan.");
                return;
            }

            const yakin = confirm(
                `Yakin ingin menghapus template "${namaTemplate}"?\n\nFile dan data template akan dihapus.`
            );

            if (!yakin) return;

            try {
                button.disabled = true;
                button.textContent = "Menghapus...";

                await smartofficeHapusTemplateDokumen({
                    idTemplate: idTemplate,
                    diperbaruiOleh: getTemplateCurrentUser().nip
                });

                alert("Template berhasil dihapus.");

                await smartofficeLoadTemplateDokumen(true);

            } catch (error) {
                console.error(
                    "[Template Dokumen] Gagal menghapus:",
                    error
                );

                alert(error.message || "Gagal menghapus template.");

                button.disabled = false;
                button.textContent = "Hapus";
            }
        });
    });

    /* ==========================================================
       EVENT TOMBOL EDIT TEMPLATE
    ========================================================== */
    list.querySelectorAll("[data-template-edit]").forEach(button => {
        button.addEventListener("click", () => {
            const record = filtered[Number(button.dataset.templateEdit)];

            const root = document.getElementById(
                "smartofficeTemplateDokumenContent"
            );

            if (root && record) {
                smartofficeTemplateEdit(root, record);
            }
        });
    });
}


/* ==========================================================
   FORM TAMBAH TEMPLATE
========================================================== */
function smartofficeTemplateOpenForm(root) {
    const modal = root.querySelector("#smartofficeTemplateModal");
    if (!modal) return;

    modal.innerHTML = `
        <div class="smartoffice-template-modal-backdrop" data-template-modal-close>
            <section class="smartoffice-template-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="smartofficeTemplateFormTitle">
                <div class="smartoffice-template-modal-header">
                    <div>
                        <h3 id="smartofficeTemplateFormTitle">
                            ${window.smartofficeTemplateEditRecord ? "Edit Template Dokumen" : "Tambah Template Dokumen"}
                        </h3>
                        <p>${window.smartofficeTemplateEditRecord ? "Perbarui informasi template. File boleh dikosongkan jika tidak diganti." : "Lengkapi informasi dan unggah file template."}</p>
                    </div>
                    <button type="button" class="smartoffice-template-modal-x" data-template-modal-close aria-label="Tutup">×</button>
                </div>

                <form id="smartofficeTemplateForm" class="smartoffice-template-form">
                    <label class="smartoffice-template-field">
                        <span>Kategori <b>*</b></span>
                        <select name="kategori" required>
                            <option value="">Pilih kategori</option>
                            ${SMARTOFFICE_TEMPLATE_KATEGORI.map(kategori => `
                                <option value="${smartofficeTemplateEscape(kategori)}">${smartofficeTemplateEscape(kategori)}</option>
                            `).join("")}
                        </select>
                    </label>

                    <label class="smartoffice-template-field">
                        <span>Nama Template <b>*</b></span>
                        <input name="namaTemplate" type="text" maxlength="180" required placeholder="Contoh: Format Surat Tugas">
                    </label>

                    <label class="smartoffice-template-field">
                        <span>Keterangan</span>
                        <textarea name="keterangan" rows="3" maxlength="1000" placeholder="Penjelasan singkat template (opsional)"></textarea>
                    </label>

                    <label class="smartoffice-template-field">
                        <span>File Template ${window.smartofficeTemplateEditRecord ? "(opsional saat edit)" : "<b>*</b>"}</span>
                        <input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.rtf,.txt">
                        <small>
                            Saat Edit, file boleh dikosongkan jika dokumen tidak diganti.
                            Saat Tambah, file wajib dipilih.
                        </small>
                    </label>

                    <label class="smartoffice-template-field">
                        <span>Status</span>
                        <select name="status">
                            <option value="Aktif" selected>Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                        </select>
                    </label>

                    <div class="smartoffice-template-modal-actions">
                        <button type="button" class="smartoffice-template-button secondary" data-template-modal-close>Batal</button>
                        <button type="submit" id="smartofficeTemplateSave" class="smartoffice-template-button primary">Simpan Template</button>
                    </div>
                </form>
            </section>
        </div>
    `;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("smartoffice-template-modal-open");

    const close = () => smartofficeTemplateCloseForm(root);
    modal.querySelectorAll("[data-template-modal-close]").forEach(element => {
        element.addEventListener("click", event => {
            if (event.target === element || element.tagName === "BUTTON") close();
        });
    });

    const form = modal.querySelector("#smartofficeTemplateForm");
    form.addEventListener("submit", event => smartofficeTemplateSubmitForm(event, root));
    modal.querySelector('[name="kategori"]')?.focus();
}

/* ==========================================================
   EDIT TEMPLATE DOKUMEN
========================================================== */
function smartofficeTemplateEdit(root, record) {
    if (record && isTemplateLocked(record)) {
        smartofficeShowToast?.("Template sedang terkunci. Hubungi SUPERADMIN untuk membukanya.", "warning");
        return;
    }

    if (!record || !canEditTemplate(record)) {
        alert("Anda tidak memiliki hak untuk mengedit template ini.");
        return;
    }

    window.smartofficeTemplateEditRecord = record;

    smartofficeTemplateOpenForm(root);

    const modal = root.querySelector("#smartofficeTemplateModal");
    const form = modal?.querySelector("#smartofficeTemplateForm");

    if (!form) return;

    form.querySelector('[name="kategori"]').value =
        smartofficeTemplateGet(record, ["kategori", "KATEGORI"]) || "";

    form.querySelector('[name="namaTemplate"]').value =
        smartofficeTemplateNama(record) || "";

    form.querySelector('[name="keterangan"]').value =
        smartofficeTemplateGet(record, [
            "keterangan", "KETERANGAN", "deskripsi", "DESKRIPSI"
        ]) || "";

    form.querySelector('[name="status"]').value =
        smartofficeTemplateStatus(record) || "Aktif";

    const saveButton = form.querySelector("#smartofficeTemplateSave");
    if (saveButton) saveButton.textContent = "Simpan Perubahan";
}

function smartofficeTemplateCloseForm(root) {
    const modal = root?.querySelector("#smartofficeTemplateModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = "";
    window.smartofficeTemplateEditRecord = null;
    document.body.classList.remove("smartoffice-template-modal-open");
}

function smartofficeTemplateReadFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            const comma = result.indexOf(",");
            if (comma < 0) {
                reject(new Error("File tidak dapat dibaca sebagai Base64."));
                return;
            }
            resolve({
                name: file.name,
                type: file.type || "application/octet-stream",
                data: result.slice(comma + 1)
            });
        };
        reader.onerror = () => reject(new Error("Gagal membaca file yang dipilih."));
        reader.readAsDataURL(file);
    });
}

async function smartofficeTemplateSubmitForm(event, root) {
    event.preventDefault();

    const form = event.currentTarget;
    const saveButton = form.querySelector("#smartofficeTemplateSave");
    const formData = new FormData(form);
    const fileInput = form.querySelector('[name="file"]');
    const file = fileInput?.files?.[0];
    const editRecord = window.smartofficeTemplateEditRecord || null;
    const isEdit = Boolean(editRecord);
    const user = getTemplateCurrentUser();

    if (isEdit && isTemplateLocked(editRecord)) {
        smartofficeShowToast?.("Template sedang terkunci. Edit tidak diizinkan.", "warning");
        return;
    }

    if (!isEdit && !file) {
        smartofficeShowToast?.("Pilih file template terlebih dahulu.", "warning");
        fileInput?.focus();
        return;
    }

    // Hindari permintaan Base64 terlalu besar yang rawan melewati batas payload GAS.
    const maxBytes = 8 * 1024 * 1024;
    if (file && file.size > maxBytes) {
        smartofficeShowToast?.("Ukuran file melebihi 8 MB. Silakan gunakan file yang lebih kecil.", "warning");
        return;
    }

    const payload = {
        idTemplate: isEdit ? smartofficeTemplateGet(editRecord, ["idTemplate", "ID_TEMPLATE"]) : "",
        kategori: String(formData.get("kategori") || "").trim(),
        namaTemplate: String(formData.get("namaTemplate") || "").trim(),
        keterangan: String(formData.get("keterangan") || "").trim(),
        status: String(formData.get("status") || "Aktif"),
        dibuatOleh: isEdit
            ? smartofficeTemplateGet(editRecord, ["dibuatOleh", "DIBUAT_OLEH"])
            : user.nip,
        diperbaruiOleh: user.nip,
        file: null
    };

    if (!payload.kategori || !payload.namaTemplate) {
        smartofficeShowToast?.("Kategori dan nama template wajib diisi.", "warning");
        return;
    }
    if (isEdit && !payload.idTemplate) {
        smartofficeShowToast?.("ID template tidak ditemukan untuk proses edit.", "error");
        return;
    }
    if (!payload.diperbaruiOleh) {
        smartofficeShowToast?.("NIP pengguna tidak ditemukan. Silakan login ulang.", "error");
        return;
    }

    try {
        saveButton.disabled = true;
        saveButton.textContent = isEdit ? "Menyimpan perubahan..." : "Menyimpan...";
        if (file) payload.file = await smartofficeTemplateReadFile(file);

        await smartofficeSimpanTemplateDokumen(payload);
        smartofficeTemplateCloseForm(root);
        smartofficeShowToast?.(isEdit ? "Template berhasil diperbarui." : "Template berhasil ditambahkan.", "success");
        await smartofficeLoadTemplateDokumen(true);
    } catch (error) {
        console.error("[Template Dokumen] Gagal menyimpan:", error);
        smartofficeShowToast?.(error?.message || "Gagal menyimpan template.", "error");
    } finally {
        if (saveButton?.isConnected) {
            saveButton.disabled = false;
            saveButton.textContent = isEdit ? "Simpan Perubahan" : "Simpan Template";
        }
    }
}


/* ==========================================================
   PREVIEW — GUNAKAN KOMPONEN GLOBAL SMART OFFICE
========================================================== */
function smartofficeTemplatePreview(record) {
    const fileId = smartofficeTemplateFileId(record);
    const url = smartofficeTemplateFileUrl(record);
    const nama = smartofficeTemplateNama(record);

    if (fileId) {
        smartofficeOpenPreviewDokumen(fileId, nama);
        return;
    }

    if (url) {
        smartofficeShowToast?.(
            "ID file Drive belum tersedia. Membuka tautan dokumen.",
            "info"
        );
        window.open(url, "_blank", "noopener,noreferrer");
        return;
    }

    smartofficeShowToast?.("File template belum tersedia.", "warning");
}


/* ==========================================================
   DESTROY
   Panggil saat keluar dari halaman Pusat Dokumen.
========================================================== */
export function smartofficeDestroyTemplateDokumen() {
    smartofficeTemplateHandlers.forEach(([element, eventName, handler]) => {
        element?.removeEventListener(eventName, handler);
    });

    smartofficeTemplateHandlers = [];
    smartofficeTemplateInitialized = false;
    smartofficeTemplateLoading = false;
}
