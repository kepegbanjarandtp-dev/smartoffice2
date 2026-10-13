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

import {
  smartofficeGetSession
} from '../../core/session.js';

import {
    smartofficeGetArsipPuskesmas,
    smartofficeSimpanArsipPuskesmas,
    smartofficeUpdateStatusArsipPuskesmas
} from "../../services/arsip-puskesmas-service.js";


/* ==========================================================
   ADAPTER BACKEND ARSIP PUSKESMAS
   Menyesuaikan kontrak yang dipakai modul V1
========================================================== */
window.smartofficeArsipPuskesmasAdapter = {

    async list({
        kategori = "",
        forceRefresh = false
    } = {}) {

        const response =
            await smartofficeGetArsipPuskesmas(kategori);

        if (!response?.success) {
            throw new Error(
                response?.message ||
                "Gagal mengambil data Arsip Puskesmas."
            );
        }

        const result = response.data;

        const records = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
                ? result.data
                : [];

        return records;
    },

    async save(payload = {}) {
        const file = payload.file
            ? {
                name: payload.file.name,
                type: payload.file.mimeType ||
                      payload.file.type ||
                      "application/octet-stream",
                data: payload.file.base64
            }
            : null;

        const response =
            await smartofficeSimpanArsipPuskesmas({
                idArsip: payload.idArsip || "",
                kategori: payload.kategori,
                tahunDokumen: payload.tahunDokumen,
                namaArsip: payload.namaArsip,
                keterangan: payload.keterangan,
                statusArsip: payload.statusArsip || "Aktif",
                diperbaruiOleh: payload.diperbaruiOleh || "",
                file
            });
        if (!response?.success) {
            throw new Error(
                response?.message ||
                "Gagal menyimpan Arsip Puskesmas."
            );
        }
    }
};



/* ==========================================================
   MASTER KATEGORI ARSIP PUSKESMAS

   id          : Identitas unik kategori untuk backend dan filter.
   name        : Nama kategori yang ditampilkan di antarmuka.
   description : Penjelasan singkat isi kategori.
   icon        : Nama ikon yang digunakan pada kartu kategori.
   tone        : Tema warna kartu kategori.
========================================================== */
const CATEGORIES = [

    /* ------------------------------------------------------
       1. PROFIL DAN IDENTITAS PUSKESMAS
       Profil, struktur organisasi, dan dokumen pendirian.
    ------------------------------------------------------ */
    {
        id: "profil-identitas",
        name: "Profil & Identitas Puskesmas",
        description:
            "Profil, struktur organisasi, SK pendirian, data dasar",
        icon: "building",
        tone: "blue"
    },

    /* ------------------------------------------------------
       2. REGULASI DAN PEDOMAN
       Peraturan, kebijakan, pedoman, dan surat edaran.
    ------------------------------------------------------ */
    {
        id: "regulasi-pedoman",
        name: "Regulasi & Pedoman",
        description:
            "Peraturan, kebijakan, pedoman, surat edaran, surat keputusan",
        icon: "gavel",
        tone: "pink"
    },

    /* ------------------------------------------------------
       3. MUTU DAN AKREDITASI
       Dokumen mutu, instrumen, eviden, dan hasil survei.
    ------------------------------------------------------ */
    {
        id: "mutu-akreditasi",
        name: "Mutu & Akreditasi",
        description:
            "Dokumen mutu, instrumen, eviden, hasil survei",
        icon: "shield",
        tone: "green"
    },

    /* ------------------------------------------------------
       4. LAPORAN PENTING
       Laporan tahunan, kinerja, dan evaluasi.
    ------------------------------------------------------ */
    {
        id: "laporan-penting",
        name: "Laporan Penting",
        description:
            "Laporan tahunan, profil kesehatan, laporan kinerja dan evaluasi",
        icon: "report",
        tone: "yellow"
    },

    /* ------------------------------------------------------
       5. PERENCANAAN
       Dokumen perencanaan dan rencana kegiatan Puskesmas.
    ------------------------------------------------------ */
    {
        id: "perencanaan",
        name: "Perencanaan",
        description:
            "RUK, RPK, rencana kegiatan, dan dokumen perencanaan",
        icon: "calendar",
        tone: "purple"
    },

    /* ------------------------------------------------------
       6. KERJA SAMA
       MoU, PKS, jejaring, dan dokumen kerja sama.
    ------------------------------------------------------ */
    {
        id: "kerja-sama",
        name: "Kerja Sama",
        description:
            "MoU, PKS, jejaring, dan dokumen kerja sama",
        icon: "handshake",
        tone: "teal"
    },

    /* ------------------------------------------------------
       7. DOKUMEN KEDARURATAN
       Dokumen yang perlu mudah diakses saat keadaan darurat.
    ------------------------------------------------------ */
    {
        id: "kedaruratan",
        name: "Dokumen Kedaruratan",
        description:
            "Dokumen yang harus mudah diakses saat situasi darurat",
        icon: "alert",
        tone: "red"
    },

    /* ------------------------------------------------------
       8. LAINNYA
       Arsip penting yang tidak masuk kategori sebelumnya.
    ------------------------------------------------------ */
    {
        id: "lainnya",
        name: "Lainnya",
        description:
            "Arsip penting lainnya",
        icon: "archive",
        tone: "blue"
    },

    /* ------------------------------------------------------
       9. DOKUMEN KEDALUWARSA
       Dokumen lama yang sudah tidak aktif.
    ------------------------------------------------------ */
    {
        id: "kedaluwarsa",
        name: "Dokumen Kedaluwarsa",
        description:
            "Dokumen lama yang tidak aktif",
        icon: "trash",
        tone: "gray"
    }

];


/* ==========================================================
   MASTER IKON ARSIP PUSKESMAS

   Setiap ikon berisi elemen SVG tanpa tag pembungkus <svg>.
   Ikon dirender melalui helper svg() di bawah.
========================================================== */
const ICONS = {

    /* Identitas dan kategori arsip */
    // Gedung: Profil dan identitas Puskesmas.
    building:
        '<rect x="4" y="9" width="16" height="12" rx="1"/>' +
        '<path d="M9 9V4h6v5M12 12v6M9 15h6M2 21h20"/>',

    // Palu: Regulasi, peraturan, dan pedoman.
    gavel:
        '<path d="m14 6 4 4M12 8l4-4 4 4-4 4M4 20l9-9M3 21h10M6 6l4 4"/>',

    // Perisai: Mutu, keamanan, dan akreditasi.
    shield:
        '<path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>' +
        '<path d="m8 12 3 3 5-6"/>',

    // Dokumen laporan: Laporan penting dan evaluasi.
    report:
        '<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/>',

    // Kalender: Perencanaan dan jadwal kegiatan.
    calendar:
        '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
        '<path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h7"/>',

    // Jabat tangan: Kerja sama dan kemitraan.
    handshake:
        '<path d="m3 12 4-4 4 2 3-2 7 4-5 6-4-2-3 2zM7 8 5 6l-3 3M17 8l2-2 3 3M9 13l3 3M12 11l4 4"/>',

    // Tanda peringatan: Dokumen kedaruratan.
    alert:
        '<path d="M12 3 22 21H2zM12 9v5M12 17h.01"/>',

    // Kotak arsip: Kategori arsip lainnya.
    archive:
        '<rect x="3" y="4" width="18" height="5" rx="1"/>' +
        '<path d="M5 9v11h14V9M9 13h6"/>',

    // Tempat sampah: Dokumen kedaluwarsa.
    trash:
        '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',

    // Dokumen umum: Ikon cadangan jika nama ikon tidak ditemukan.
    file:
        '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',

    /* Ikon navigasi dan interaksi */
    // Kaca pembesar: Pencarian arsip.
    search:
        '<circle cx="10.5" cy="10.5" r="6.5"/>' +
        '<path d="m16 16 5 5"/>',

    // Corong: Filter data.
    filter:
        '<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',

    // Garis horizontal: Pengurutan data.
    sort:
        '<path d="M4 6h16M4 12h11M4 18h6"/>',

    // Panah kiri: Kembali ke halaman sebelumnya.
    back:
        '<path d="m15 18-6-6 6-6"/>',

    // Tanda tambah: Menambah arsip.
    plus:
        '<path d="M12 5v14M5 12h14"/>',
    
    // Refresh: ikon putar ulang yang sederhana dan simetris.
    refresh:
        '<path d="M20 11a8 8 0 0 0-14.9-3L3 11"/>' +
        '<path d="M3 4v7h7"/>' +
        '<path d="M4 13a8 8 0 0 0 14.9 3L21 13"/>' +
        '<path d="M21 20v-7h-7"/>',

    // Chevron kanan: Navigasi atau membuka detail.
    chevron:
        '<path d="m9 18 6-6-6-6"/>',

    // Silang: Menutup modal atau panel.
    close:
        '<path d="m6 6 12 12M18 6 6 18"/>',

    // Panah ke atas: Mengunggah dokumen.
    upload:
        '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>'
};


/* ==========================================================
   HELPER RENDER IKON SVG

   name : Kunci ikon pada objek ICONS.
   cls  : Kelas CSS tambahan, opsional.
========================================================== */
const svg = (
    name,
    cls = ""
) => {
    const iconContent =
        ICONS[name] || ICONS.file;

    return `
        <svg
            class="arp-icon ${cls}"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            ${iconContent}
        </svg>
    `;
};

/* ==========================================================
   HELPER ESCAPE HTML

   Mengubah karakter khusus menjadi entitas HTML agar nilai
   data aman saat dimasukkan ke dalam template HTML.
========================================================== */
const esc = (
    value = ""
) => {

    const htmlEntities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => htmlEntities[character]
        );
};


/* ==========================================================
   STATE MODUL ARSIP PUSKESMAS

   root     : Elemen utama halaman.
   category : Kategori arsip yang sedang dibuka.
   records  : Data arsip kategori aktif.
   allCounts: Jumlah arsip per kategori.
   query    : Kata kunci pencarian.
   sort     : Urutan data, default terbaru.
   status   : Filter status arsip.
   year     : Filter tahun dokumen.
   cache    : Cache data per kategori.
   handlers : Referensi event handler untuk pengelolaan event.
   busy     : Penanda proses yang sedang berlangsung.
========================================================== */
const state = {

    // Elemen root halaman arsip.
    root: null,

    // Kategori yang sedang dipilih.
    category: null,

    // Daftar arsip untuk kategori aktif.
    records: [],

    // Rekap jumlah arsip setiap kategori.
    allCounts: {},

    // Kata kunci pencarian.
    query: "",

    // Urutan data: newest atau opsi lain yang tersedia.
    sort: "newest",

    // Filter berdasarkan status arsip.
    status: "",

    // Filter berdasarkan tahun dokumen.
    year: "",

    // Penyimpanan sementara data per kategori.
    cache: new Map(),

    // Daftar event handler yang dikelola modul.
    handlers: [],

    // Penanda proses loading atau penyimpanan.
    busy: false
};


/* ==========================================================
   SESSION DAN HAK AKSES ARSIP
========================================================== */

function getArsipCurrentUser() {
    const session = smartofficeGetSession() || {};

    return {
        nip: String(session.nip || "").trim(),
        role: String(session.role || "")
            .trim()
            .toUpperCase()
    };
}

function canEditArsip(record) {
    const user = getArsipCurrentUser();

    if (
        record.isLock === true ||
        record.isLock === "TRUE" ||
        record.isLock === "Ya" ||
        record.IS_LOCK === true ||
        record.IS_LOCK === "TRUE"
    ) {
        return false;
    }

    const pembuat = String(
        record.dibuatOleh ||
        record.dibuatOle ||
        record.Dibuat_Oleh ||
        record.Dibuat_Ole ||
        ""
    ).trim();

    return Boolean(
        user.nip &&
        (
            user.nip === pembuat ||
            ["PJ", "ADMIN"].includes(user.role)
        )
    );
}

function isSuperAdminArsip() {
    return getArsipCurrentUser().role === "SUPERADMIN";
}


/* ==========================================================
   INISIALISASI MODUL ARSIP PUSKESMAS

   Fungsi ini dijalankan ketika halaman Arsip Puskesmas dibuka.

   Alur:
   1. Mencari elemen root pada HTML.
   2. Menyimpan root ke state modul.
   3. Menampilkan halaman utama kategori.
   4. Memasang event handler.
   5. Memuat ringkasan jumlah arsip kategori.
========================================================== */
export async function smartofficeInitArsipPuskesmas() {

    /* ======================================================
       1. AMBIL ELEMEN ROOT
    ====================================================== */
    const root =
        document.getElementById(
            "smartofficeArsipPuskesmasContent"
        );

    /* ======================================================
       2. VALIDASI ELEMEN ROOT
       Hentikan proses jika elemen HTML belum tersedia.
    ====================================================== */
    if (!root) {
        console.warn(
            "Arsip Puskesmas: elemen " +
            "#smartofficeArsipPuskesmasContent " +
            "belum ada di HTML."
        );

        return;
    }

    /* ======================================================
       3. SIMPAN ROOT KE STATE
       Digunakan oleh fungsi render dan event handler.
    ====================================================== */
    state.root = root;

    /* ======================================================
       4. RENDER HALAMAN UTAMA
       Menampilkan kartu kategori arsip.
    ====================================================== */
    root.innerHTML =
        renderHome();

    /* ======================================================
       5. PASANG EVENT HANDLER
       Mengaktifkan interaksi pada halaman utama.
    ====================================================== */
    bindRoot();

    /* ======================================================
       6. MUAT RINGKASAN JUMLAH ARSIP KATEGORI

       Pemanggilan ini tidak boleh memuat seluruh isi dokumen.
       Angka kategori hanya ditampilkan jika tersedia dari
       sumber data yang benar, bukan dari angka mockup.
    ====================================================== */
    await loadCategoryCounts();
}


/* ==========================================================
   DESTROY MODUL ARSIP PUSKESMAS

   Membersihkan referensi dan event listener ketika modul
   ditinggalkan atau diinisialisasi ulang.

   Tujuan:
   - Mencegah event listener menumpuk.
   - Menghindari referensi DOM lama tetap tersimpan.
   - Mengosongkan state tampilan kategori dan pencarian.
========================================================== */
export function smartofficeDestroyArsipPuskesmas() {

    /* ======================================================
       1. LEPAS EVENT LISTENER
       Hanya dilakukan jika root modul pernah diinisialisasi.
    ====================================================== */
    if (state.root) {
        state.handlers.forEach(
            ([element, eventName, handler]) => {
                element.removeEventListener(
                    eventName,
                    handler
                );
            }
        );
    }

    /* ======================================================
       2. BERSIHKAN DAFTAR HANDLER
       Mencegah referensi handler lama tetap tersimpan.
    ====================================================== */
    state.handlers = [];

    /* ======================================================
       3. RESET REFERENSI ROOT DAN KATEGORI AKTIF
    ====================================================== */
    state.root = null;
    state.category = null;

    /* ======================================================
       4. RESET DATA DAN PENCARIAN
    ====================================================== */
    state.records = [];
    state.query = "";
}


/* ==========================================================
   HELPER BIND EVENT

   Memasang event listener pada elemen dan menyimpan
   referensinya ke state.handlers agar dapat dilepas kembali
   saat modul dihancurkan.
========================================================== */
function bind(
    el,
    event,
    fn
) {
    // Lewati jika elemen tidak ditemukan.
    if (!el) return;

    // Pasang event listener.
    el.addEventListener(
        event,
        fn
    );

    // Simpan referensi untuk proses cleanup.
    state.handlers.push([
        el,
        event,
        fn
    ]);
}


/* ==========================================================
   BIND EVENT ROOT

   Memasang event delegation pada elemen utama modul.

   click  : Interaksi tombol dan elemen yang diklik.
   input  : Perubahan input secara langsung.
   change : Perubahan pilihan atau nilai form.
   submit : Pengiriman form.
========================================================== */
function bindRoot() {

    const root =
        state.root;

    // Event klik.
    bind(
        root,
        "click",
        onClick
    );

    // Event input.
    bind(
        root,
        "input",
        onInput
    );

    // Event perubahan nilai.
    bind(
        root,
        "change",
        onChange
    );

    // Event pengiriman form.
    bind(
        root,
        "submit",
        onSubmit
    );
}


/* ==========================================================
   HELPER ADAPTER BACKEND

   Mengambil adapter Arsip Puskesmas dari window.

   Adapter menyediakan operasi:
   - list() : mengambil daftar arsip.
   - save() : menyimpan atau memperbarui arsip.

   Mengembalikan null jika adapter belum tersedia.
========================================================== */
function adapter() {
    return window.smartofficeArsipPuskesmasAdapter || null;
}



/* ==========================================================
   RENDER HALAMAN UTAMA ARSIP PUSKESMAS

   Menampilkan:
   1. Banner judul dan deskripsi.
   2. Kolom pencarian.
   3. Tombol pengurutan dan filter.
   4. Grid kategori arsip.
   5. Wadah modal untuk interaksi lanjutan.

   Catatan:
   - renderCategory() merender setiap kartu kategori.
   - svg() menghasilkan ikon SVG.
========================================================== */
function renderHome() {

    return `
        <section class="arp-shell">

            <!-- ==========================================
                 BANNER UTAMA
                 Judul, deskripsi, ilustrasi, dan slogan.
            =========================================== -->
            <div class="arp-banner">
                <!-- Ikon arsip -->
                <div class="arp-banner-mark">
                    ${svg("archive")}
                </div>

                <!-- Judul dan deskripsi modul -->
                <div class="arp-banner-copy">
                    <h2>
                        Arsip Puskesmas
                    </h2>

                    <p>
                        Dokumen penting dan arsip bersama
                        <br class="arp-desktop-break">
                        untuk mendukung operasional Puskesmas.
                    </p>
                </div>

                <!-- Ilustrasi folder dekoratif -->
                <div
                    class="arp-folder-art"
                    aria-hidden="true"
                >
                    <span>▤</span>
                    <span>▤</span>
                    <span>▰</span>
                </div>

                <!-- Slogan modul -->
                <div class="arp-slogan">
                    “Dokumen<br>
                    Tertata,<br>
                    Layanan<br>
                    Lebih Bermakna”
                </div>
            </div>

            <!-- ==========================================
                 TOOLBAR
                 Pencarian, pengurutan, dan filter.
            =========================================== -->
            <div class="arp-toolbar">
                <!-- Pencarian kategori atau nama dokumen -->
                <label class="arp-search">
                    ${svg("search")}
                    <input
                        data-arp-search
                        type="search"
                        placeholder="Cari kategori atau nama dokumen..."
                        autocomplete="off"
                        aria-label="Cari kategori atau nama dokumen"
                    >
                </label>

                <!-- Tombol pengurutan -->
                <button
                    class="arp-tool-btn"
                    type="button"
                    data-arp-sort
                >
                    ${svg("sort")}
                    <span>
                        Urutkan
                    </span>
                </button>

                <!-- Tombol filter -->
                <button
                    class="arp-tool-btn"
                    type="button"
                    data-arp-filter
                >
                    ${svg("filter")}

                    <span>
                        Filter
                    </span>
                </button>
            </div>

            <!-- ==========================================
                 GRID KATEGORI ARSIP

                 Setiap kategori dirender melalui
                 fungsi renderCategory().
            =========================================== -->
            <div
                class="arp-category-grid"
                data-arp-category-grid
            >
                ${CATEGORIES.map(renderCategory).join("")}
            </div>

            <!-- ==========================================
                 MODAL HOST

                 Wadah untuk modal atau dialog dinamis.
            =========================================== -->
            <div
                class="arp-modal-host"
                data-arp-modal-host
            ></div>
        </section>
    `;
}



/* ==========================================================
   RENDER KARTU KATEGORI ARSIP

   Parameter:
   c = objek kategori dari array CATEGORIES.

   Menampilkan:
   1. Ikon dan nama kategori.
   2. Deskripsi kategori.
   3. Jumlah dokumen jika tersedia.
   4. Petunjuk untuk membuka kategori.

   Catatan:
   Jumlah dokumen diambil dari state.allCounts.
   Jika jumlah belum tersedia, tampilkan "Lihat dokumen".
========================================================== */
function renderCategory(c) {

    /* ======================================================
       AMBIL JUMLAH DOKUMEN KATEGORI
    ====================================================== */
    const count =
        state.allCounts[c.id];

    /* ======================================================
       RENDER KARTU KATEGORI
    ====================================================== */
    return `
        <button
            type="button"
            class="arp-category-card"
            data-arp-category="${c.id}"
            aria-label="Buka kategori ${esc(c.name)}"
        >
            <!-- ==========================================
                 HEADER KARTU
                 Ikon dan nama kategori.
            =========================================== -->
            <div class="arp-card-heading">
                <!-- Ikon kategori dengan tema warna -->
                <span
                    class="arp-category-icon arp-tone-${c.tone}"
                >
                    ${svg(c.icon)}
                </span>

                <!-- Nama kategori -->
                <span class="arp-category-title">
                    ${esc(c.name)}
                </span>
            </div>

            <!-- ==========================================
                 DESKRIPSI KATEGORI
            =========================================== -->
            <p class="arp-category-description">
                ${esc(c.description)}
            </p>

            <!-- ==========================================
                 FOOTER KARTU
                 Menampilkan jumlah dokumen dan ikon navigasi.
            =========================================== -->
            <span class="arp-card-footer">
                <!-- Ikon dokumen -->
                ${svg("file")}

                <!-- Jumlah dokumen atau petunjuk navigasi -->
                <span>
                    ${
                        Number.isFinite(count)
                            ? `${count} dokumen`
                            : "Lihat dokumen"
                    }
                </span>

                <!-- Ikon panah menuju halaman kategori -->
                ${svg(
                    "chevron",
                    "arp-card-chevron"
                )}
            </span>
        </button>
    `;
}



/* ==========================================================
   MEMUAT RINGKASAN JUMLAH ARSIP PER KATEGORI

   Alur:
   1. Memeriksa ketersediaan adapter.
   2. Mengambil ringkasan jumlah dokumen jika didukung.
   3. Memperbarui state.allCounts.
   4. Merender ulang kartu kategori jika halaman utama aktif.

   Catatan:
   Fungsi ini tidak memuat seluruh isi dokumen.
========================================================== */
async function loadCategoryCounts() {

    /* ======================================================
       1. AMBIL ADAPTER BACKEND
    ====================================================== */
    const api =
        adapter();

    /* ======================================================
       2. PERIKSA DUKUNGAN FUNGSI COUNTS

       Jika adapter belum tersedia atau belum memiliki
       fungsi counts(), hentikan proses tanpa error.
    ====================================================== */
    if (
        !api ||
        typeof api.counts !== "function"
    ) {
        return;
    }

    /* ======================================================
       3. AMBIL RINGKASAN JUMLAH DOKUMEN
    ====================================================== */
    try {
        const counts =
            await api.counts();

        /* ==================================================
           4. PERBARUI STATE JUMLAH ARSIP

           Format yang diharapkan:
           {
               "profil-identitas": 10,
               "regulasi-pedoman": 5
           }
        ================================================== */
        if (
            counts &&
            typeof counts === "object"
        ) {
            state.allCounts =
                counts;
        }

        /* ==================================================
           5. RENDER ULANG GRID KATEGORI

           Hanya dilakukan jika:
           - Root halaman masih tersedia.
           - Pengguna belum membuka kategori tertentu.
        ================================================== */
        if (
            state.root &&
            !state.category
        ) {
            const grid =
                state.root.querySelector(
                    "[data-arp-category-grid]"
                );

            // Pastikan elemen grid masih tersedia.
            if (grid) {
                const filteredCategories =
                    CATEGORIES.filter(
                        category =>
                            categoryMatches(
                                category,
                                state.query
                            )
                    );

                // Render ulang kartu beserta jumlah dokumen.
                grid.innerHTML =
                    filteredCategories
                        .map(renderCategory)
                        .join("");
            }
        }

    } catch (err) {

        /* ==================================================
           6. TANGANI KEGAGALAN PEMUATAN RINGKASAN
        ================================================== */
        console.error(
            "Arsip: gagal memuat ringkasan kategori",
            err
        );
    }
}


/* ==========================================================
   FILTER PENCARIAN KATEGORI

   Parameter:
   c     : Objek kategori dari CATEGORIES.
   query : Kata kunci pencarian dari pengguna.

   Pencarian mencakup:
   - Nama kategori.
   - Deskripsi kategori.

   Pencarian tidak membedakan huruf besar dan kecil,
   dengan aturan pelokalan bahasa Indonesia.
========================================================== */
function categoryMatches(
    c,
    query
) {
    /* ======================================================
       1. JIKA KATA KUNCI KOSONG
       Semua kategori dinyatakan cocok.
    ====================================================== */
    if (!query) {
        return true;
    }

    /* ======================================================
       2. NORMALISASI KATA KUNCI
       Mengubah kata kunci menjadi huruf kecil.
    ====================================================== */
    const q =
        query.toLocaleLowerCase("id-ID");

    /* ======================================================
       3. GABUNGKAN NAMA DAN DESKRIPSI KATEGORI
       Kemudian cari kata kunci pada teks tersebut.
    ====================================================== */
    const searchableText =
        `${c.name} ${c.description}`
            .toLocaleLowerCase("id-ID");

    /* ======================================================
       4. KEMBALIKAN HASIL PENCARIAN
       true  = kategori cocok.
       false = kategori tidak cocok.
    ====================================================== */
    return searchableText.includes(q);
}


/* ==========================================================
   EVENT INPUT

   Menangani perubahan input pencarian secara langsung.

   Jika kategori belum dibuka:
   - Filter kartu kategori berdasarkan nama/deskripsi.

   Jika kategori sedang dibuka:
   - Perbarui tampilan daftar arsip melalui renderRecords().
========================================================== */
function onInput(e) {

    /* ======================================================
       1. TANGANI INPUT PENCARIAN
    ====================================================== */
    if (
        e.target.matches("[data-arp-search]")
    ) {
        // Simpan kata kunci tanpa spasi di awal/akhir.
        state.query =
            e.target.value.trim();

        /* ==================================================
           2. JIKA KATEGORI SEDANG DIBUKA
           Render ulang daftar arsip.
        ================================================== */
        if (state.category) {
            renderRecords();

        } else {

            /* ==============================================
               3. JIKA MASIH DI HALAMAN KATEGORI
               Filter dan render ulang kartu kategori.
            ============================================== */
            const grid =
                state.root.querySelector(
                    "[data-arp-category-grid]"
                );

            if (grid) {
                const filteredCategories =
                    CATEGORIES.filter(
                        category =>
                            categoryMatches(
                                category,
                                state.query
                            )
                    );

                grid.innerHTML =
                    filteredCategories
                        .map(renderCategory)
                        .join("");
            }
        }
    }
}


/* ==========================================================
   EVENT CHANGE

   Menangani perubahan nilai pada kontrol filter dan urutan.

   data-arp-status       : Filter status arsip.
   data-arp-year         : Filter tahun dokumen.
   data-arp-sort-select  : Pilihan urutan daftar arsip.

   Setiap perubahan memperbarui state lalu merender ulang
   daftar arsip menggunakan renderRecords().
========================================================== */
function onChange(e) {

    /* ======================================================
       1. FILTER STATUS ARSIP
    ====================================================== */
    if (
        e.target.matches("[data-arp-status]")
    ) {
        state.status =
            e.target.value;

        renderRecords();
    }

    /* ======================================================
       2. FILTER TAHUN DOKUMEN
    ====================================================== */
    if (
        e.target.matches("[data-arp-year]")
    ) {
        state.year =
            e.target.value;

        renderRecords();
    }

    /* ======================================================
       3. URUTAN DAFTAR ARSIP
    ====================================================== */
    if (
        e.target.matches("[data-arp-sort-select]")
    ) {
        state.sort =
            e.target.value;

        renderRecords();
    }
}


/* ==========================================================
   EVENT CLICK — ARSIP PUSKESMAS

   Menangani interaksi tombol melalui event delegation
   pada elemen root modul.

   Fitur:
   - Membuka kategori arsip.
   - Kembali ke halaman kategori.
   - Memuat ulang data.
   - Membuka form tambah arsip.
   - Membuka dan menutup modal.
   - Mengatur pengurutan dan filter.
   - Membuka file arsip.
   - Menghapus filter aktif.
========================================================== */
async function onClick(e) {

    /* ======================================================
       1. IDENTIFIKASI TOMBOL YANG DIKLIK
    ====================================================== */
    const target = e.target.closest("button");

    if (
        !target ||
        !state.root.contains(target)
    ) {
        return;
    }

    /* ======================================================
       2. BUKA KATEGORI ARSIP
    ====================================================== */
    if (target.matches("[data-arp-category]")) {
        await openCategory(target.dataset.arpCategory);
        return;
    }

    /* ======================================================
       3. KEMBALI KE HALAMAN UTAMA KATEGORI
    ====================================================== */
    if (target.matches("[data-arp-back]")) {
        state.category = null;
        state.records = [];

        state.status = "";
        state.year = "";
        state.query = "";

        state.root.innerHTML = renderHome();

        await loadCategoryCounts();
        return;
    }

    /* ======================================================
       4. REFRESH DATA KATEGORI AKTIF
    ====================================================== */
    if (target.matches("[data-arp-refresh]")) {
        const categoryId = state.category?.id;

        if (!categoryId) return;

        state.cache.delete(categoryId);
        await loadCategory(categoryId, true);
        return;
    }

    /* ======================================================
       5. BUKA FORM TAMBAH ARSIP
    ====================================================== */
    if (target.matches("[data-arp-add]")) {
        showForm();
        return;
    }

    /* ======================================================
       6. TUTUP MODAL
    ====================================================== */
    if (target.matches("[data-arp-close-modal]")) {
        closeModal();
        return;
    }

    /* ======================================================
       7. PENGURUTAN
    ====================================================== */
    if (target.matches("[data-arp-sort]")) {
        showSort();
        return;
    }

    /* ======================================================
       8. FILTER
    ====================================================== */
    if (target.matches("[data-arp-filter]")) {
        showFilter();
        return;
    }

    /* ======================================================
       9. MENU AKSI KARTU ARSIP
    ====================================================== */
    if (target.matches("[data-arp-menu]")) {
        const id = target.dataset.arpMenu;

        const menu = state.root.querySelector(
            `[data-arp-actions="${CSS.escape(id)}"]`
        );

        if (menu) {
            const isOpen = menu.hidden === false;

            // Tutup semua menu aksi lainnya.
            state.root
                .querySelectorAll("[data-arp-actions]")
                .forEach(item => {
                    item.hidden = true;
                });

            // Buka atau tutup menu yang dipilih.
            menu.hidden = isOpen;
        }

        return;
    }

    /* ======================================================
       10. EDIT ARSIP
       Hak akses: pemilik arsip, PJ, atau ADMIN.
       Fungsi canEditArsip() harus sudah tersedia.
    ====================================================== */
    if (target.matches("[data-arp-edit]")) {
        const id = target.dataset.arpEdit;

        const record = state.records.find(item =>
            String(
                item.idArsip ||
                item.ID_Arsip ||
                item.id ||
                ""
            ) === String(id)
        );

        if (!record) {
            alert("Data arsip tidak ditemukan.");
            return;
        }

        if (typeof canEditArsip !== "function") {
            console.error("Fungsi canEditArsip() belum tersedia.");
            alert("Pemeriksaan hak akses edit belum tersedia.");
            return;
        }

        if (!canEditArsip(record)) {
            alert(
                "Anda tidak memiliki izin untuk mengubah arsip ini."
            );
            return;
        }

        showForm(record);
        return;
    }

    /* ======================================================
       11. BUKA / TUTUP LOCK ARSIP
       Hak akses: SUPERADMIN saja.

       Memerlukan:
       api.setLock(idArsip, statusLock)
       Status lock: true = terkunci, false = terbuka.
    ====================================================== */
    if (target.matches("[data-arp-lock]")) {
        const id = target.dataset.arpLock;

        const record = state.records.find(item =>
            String(
                item.idArsip ||
                item.ID_Arsip ||
                item.id ||
                ""
            ) === String(id)
        );

        if (!record) {
            alert("Data arsip tidak ditemukan.");
            return;
        }

        const user = getArsipCurrentUser();

        if (
            String(user?.role || "").toUpperCase() !==
            "SUPERADMIN"
        ) {
            alert("Hanya SUPERADMIN yang dapat membuka atau menutup lock.");
            return;
        }

        if (
            !window.smartofficeArsipPuskesmasAdapter ||
            typeof window.smartofficeArsipPuskesmasAdapter.setLock !== "function"
        ) {
            alert(
                "Fitur lock belum terhubung ke service dan backend GAS."
            );
            return;
        }

        const isLocked = [
            true,
            1,
            "1",
            "true",
            "ya",
            "terkunci"
        ].includes(
            String(
                record.isLock ??
                record.IS_LOCK ??
                record.is_locked ??
                false
            ).toLowerCase() === "false"
                ? false
                : String(
                    record.isLock ??
                    record.IS_LOCK ??
                    record.is_locked ??
                    false
                ).toLowerCase()
        );

        const nextLock = !isLocked;

        const actionText = nextLock
            ? "mengunci"
            : "membuka lock";

        if (!confirm(`Yakin ingin ${actionText} arsip ini?`)) {
            return;
        }

        try {
            target.disabled = true;

            await window.smartofficeArsipPuskesmasAdapter.setLock({
                idArsip: id,
                isLock: nextLock,
                diperbaruiOleh: user?.nip || ""
            });

            const categoryId = state.category?.id;

            if (categoryId) {
                state.cache.delete(categoryId);
                await loadCategory(categoryId, true);
            }

            alert(
                nextLock
                    ? "Arsip berhasil dikunci."
                    : "Lock arsip berhasil dibuka."
            );

        } catch (error) {
            console.error("Gagal mengubah lock arsip:", error);

            alert(
                error?.message ||
                "Gagal mengubah lock arsip. Silakan coba kembali."
            );

        } finally {
            target.disabled = false;
        }

        return;
    }

    /* ======================================================
       12. HAPUS ARSIP
       Hak akses: SUPERADMIN saja.

       Memerlukan:
       api.remove(idArsip)
    ====================================================== */
    if (target.matches("[data-arp-delete]")) {
        const id = target.dataset.arpDelete;

        const record = state.records.find(item =>
            String(
                item.idArsip ||
                item.ID_Arsip ||
                item.id ||
                ""
            ) === String(id)
        );

        if (!record) {
            alert("Data arsip tidak ditemukan.");
            return;
        }

        const user = getArsipCurrentUser();

        if (
            String(user?.role || "").toUpperCase() !==
            "SUPERADMIN"
        ) {
            alert("Hanya SUPERADMIN yang dapat menghapus arsip.");
            return;
        }

        if (
            !window.smartofficeArsipPuskesmasAdapter ||
            typeof window.smartofficeArsipPuskesmasAdapter.remove !== "function"
        ) {
            alert(
                "Fitur hapus belum terhubung ke service dan backend GAS."
            );
            return;
        }

        const namaArsip =
            record.namaArsip ||
            record.Nama_Arsip ||
            "arsip ini";

        if (
            !confirm(
                `Yakin ingin menghapus "${namaArsip}"?\n\nTindakan ini dapat menghapus data arsip dan file terkait sesuai implementasi backend.`
            )
        ) {
            return;
        }

        try {
            target.disabled = true;

            await window.smartofficeArsipPuskesmasAdapter.remove({
                idArsip: id,
                diperbaruiOleh: user?.nip || ""
            });

            const categoryId = state.category?.id;

            if (categoryId) {
                state.cache.delete(categoryId);
                await loadCategory(categoryId, true);
            }

            alert("Arsip berhasil dihapus.");

        } catch (error) {
            console.error("Gagal menghapus arsip:", error);

            alert(
                error?.message ||
                "Gagal menghapus arsip. Silakan coba kembali."
            );

        } finally {
            target.disabled = false;
        }

        return;
    }

    /* ======================================================
       13. BUKA FILE ARSIP
    ====================================================== */
    if (target.matches("[data-arp-open-file]")) {
        const record = state.records.find(item =>
            String(
                item.idArsip ||
                item.ID_Arsip ||
                item.id ||
                ""
            ) === String(target.dataset.arpOpenFile)
        );

        const fileUrl =
            record?.fileUrl ||
            record?.File_URL ||
            record?.fileURL ||
            record?.fileUrlDrive ||
            "";

        if (fileUrl) {
            window.open(
                fileUrl,
                "_blank",
                "noopener,noreferrer"
            );
        } else {
            alert(
                "Tautan file belum tersedia pada data arsip ini."
            );
        }

        return;
    }

    /* ======================================================
       14. HAPUS FILTER AKTIF
    ====================================================== */
    if (target.matches("[data-arp-clear-filter]")) {
        state.status = "";
        state.year = "";

        renderRecords();
        return;
    }
}


/* ==========================================================
   BUKA KATEGORI ARSIP

   Parameter:
   id = ID kategori yang dipilih.

   Alur:
   1. Cari kategori berdasarkan ID.
   2. Reset pencarian dan filter.
   3. Muat data kategori, menggunakan cache jika tersedia.
========================================================== */
async function openCategory(id) {

    /* ======================================================
       1. TENTUKAN KATEGORI AKTIF
    ====================================================== */
    state.category =
        CATEGORIES.find(
            category => category.id === id
        ) || null;

    // Hentikan proses jika kategori tidak ditemukan.
    if (!state.category) {
        return;
    }

    /* ======================================================
       2. RESET PENCARIAN DAN FILTER
    ====================================================== */
    state.query = "";
    state.status = "";
    state.year = "";

    /* ======================================================
       3. MUAT DATA KATEGORI
       Gunakan cache jika tersedia dan masih diizinkan.
    ====================================================== */
    await loadCategory(
        id,
        false
    );
}


/* ==========================================================
   MEMUAT DATA ARSIP KATEGORI

   Parameter:
   id          = ID kategori yang dimuat.
   forceRefresh = true untuk melewati cache.

   Adapter yang digunakan:
   window.smartofficeArsipPuskesmasAdapter.list()

   Kontrak list():
   list({ kategori, forceRefresh }) -> Promise<Array>
========================================================== */
async function loadCategory(
    id,
    forceRefresh
) {

    /* ======================================================
       1. VALIDASI KATEGORI AKTIF
       Hindari memuat kategori yang berbeda dari pilihan aktif.
    ====================================================== */
    if (
        !state.category ||
        state.category.id !== id
    ) {
        return;
    }

    /* ======================================================
       2. AMBIL CONTAINER HALAMAN KATEGORI
    ====================================================== */
    const host =
        state.root.querySelector(
            ".arp-shell"
        );

    // Hentikan proses jika container tidak tersedia.
    if (!host) {
        return;
    }

    /* ======================================================
       3. PERIKSA CACHE

       Jika forceRefresh false dan cache tersedia,
       gunakan data cache tanpa memanggil backend.
    ====================================================== */
    if (
        !forceRefresh &&
        state.cache.has(id)
    ) {
        state.records =
            state.cache.get(id);

    } else {
        /* ==================================================
           4. VALIDASI ADAPTER BACKEND
        ================================================== */
        const api =
            adapter();
        if (
            !api ||
            typeof api.list !== "function"
        ) {
            state.records = [];
            renderRecords(
                "Backend arsip belum dihubungkan. " +
                "Siapkan adapter Firestore/GAS terlebih dahulu; " +
                "nama aksi dan koleksi tidak diasumsikan " +
                "oleh modul ini."
            );

            return;
        }

        /* ==================================================
           5. TAMPILKAN STATUS LOADING
        ================================================== */
        state.busy = true;

        renderRecords(
            "Memuat arsip..."
        );

        /* ==================================================
           6. AMBIL DATA DARI ADAPTER
        ================================================== */
        try {
            const result =
                await api.list({
                    kategori: id,
                    forceRefresh:
                        Boolean(forceRefresh)
                });

            /* ==============================================
               7. SIMPAN DATA DAN PERBARUI CACHE

               Hanya array yang diterima sebagai daftar arsip.
            ============================================== */
            state.records =
                Array.isArray(result)
                    ? result
                    : [];

            state.cache.set(
                id,
                state.records
            );

        } catch (err) {
            /* ==============================================
               8. TANGANI KEGAGALAN PEMUATAN
            ============================================== */
            console.error(
                "Arsip: gagal memuat kategori",
                err
            );

            state.records = [];
            renderRecords(
                err?.message ||
                "Gagal memuat data arsip. Silakan coba lagi."
            );

            return;

        } finally {
            /* ==============================================
               9. AKHIRI STATUS LOADING
            ============================================== */
            state.busy = false;
        }
    }

    /* ======================================================
       10. RENDER DAFTAR ARSIP

       Data berasal dari cache atau hasil pemanggilan adapter.
    ====================================================== */
    renderRecords();
}


/* ==========================================================
   RENDER DAFTAR ARSIP

   Parameter:
   message = Pesan loading, informasi, atau error (opsional).

   Fitur:
   - Pencarian nama, keterangan, dan tahun dokumen.
   - Filter status dan tahun.
   - Filter khusus kategori kedaluwarsa.
   - Pengurutan nama, tahun terbaru, dan tahun terlama.
   - Tampilan jumlah hasil dan daftar dokumen.
   - Tampilan pesan atau kondisi data kosong.
========================================================== */
function renderRecords(message = "") {

    /* ======================================================
       1. VALIDASI ROOT DAN KATEGORI AKTIF
    ====================================================== */
    if (
        !state.root ||
        !state.category
    ) {
        return;
    }

    /* ======================================================
       2. FILTER DATA ARSIP

       Pencarian dilakukan secara lokal terhadap data
       yang sudah tersedia di state.records.
    ====================================================== */
    const filtered =
        state.records.filter(record => {

            // Normalisasi kata kunci pencarian.
            const query =
                state.query.toLocaleLowerCase("id-ID");

            // Gabungkan nama, keterangan, dan tahun.
            const searchableText =
                `${record.namaArsip || record.nama || ""} ` +
                `${record.keterangan || ""} ` +
                `${record.tahunDokumen || record.tahun || ""}`
                    .toLocaleLowerCase("id-ID");

            // Ambil status arsip, default Aktif.
            const status =
                String(
                    record.statusArsip ||
                    record.status ||
                    "Aktif"
                );

            // Ambil tahun dokumen.
            const year =
                String(
                    record.tahunDokumen ||
                    record.tahun ||
                    ""
                );

            // Periksa apakah kategori khusus kedaluwarsa.
            const isExpiredCategory =
                state.category.id === "kedaluwarsa";

            // Periksa kecocokan seluruh kriteria filter.
            return (
                // Pencarian teks.
                (
                    !query ||
                    searchableText.includes(query)
                ) &&

                // Filter status.
                (
                    !state.status ||
                    status === state.status
                ) &&

                // Filter tahun.
                (
                    !state.year ||
                    year === state.year
                ) &&

                // Kategori kedaluwarsa hanya menampilkan
                // dokumen dengan status yang sesuai.
                (
                    !isExpiredCategory ||
                    /kedaluwarsa|tidak aktif|nonaktif/i.test(status)
                )
            );
        });

    /* ======================================================
       3. URUTKAN DATA ARSIP
    ====================================================== */
    filtered.sort(
        (a, b) => {

            // Urutkan berdasarkan nama A-Z.
            if (state.sort === "name") {
                return String(
                    a.namaArsip || a.nama || ""
                ).localeCompare(
                    String(b.namaArsip || b.nama || ""),
                    "id"
                );
            }

            // Urutkan berdasarkan tahun terlama.
            if (state.sort === "oldest") {
                return String(
                    a.tahunDokumen || a.tahun || ""
                ).localeCompare(
                    String(b.tahunDokumen || b.tahun || "")
                );
            }

            // Default: tahun terbaru terlebih dahulu.
            return String(
                b.tahunDokumen || b.tahun || ""
            ).localeCompare(
                String(a.tahunDokumen || a.tahun || "")
            );
        }
    );

    /* ======================================================
       4. SIAPKAN PILIHAN TAHUN

       Mengambil tahun unik dari seluruh data kategori,
       bukan hanya data hasil filter.
    ====================================================== */
    const years = [
        ...new Set(
            state.records
                .map(
                    record =>
                        String(
                            record.tahunDokumen ||
                            record.tahun ||
                            ""
                        )
                )
                .filter(
                    year => /^\d{4}$/.test(year)
                )
        )
    ].sort().reverse();

    /* ======================================================
       5. RENDER HALAMAN DETAIL KATEGORI
    ====================================================== */
    state.root.innerHTML = `
        <section class="arp-shell">

            <!-- ==========================================
                 HEADER DETAIL KATEGORI
            =========================================== -->
            <div class="arp-detail-header">
                <!-- Tombol kembali ke daftar kategori -->
                <button
                    type="button"
                    class="arp-back-btn"
                    data-arp-back
                >
                    ${svg("back")}

                    <span>
                        Kategori
                    </span>
                </button>

                <!-- Identitas kategori aktif -->
                <div class="arp-detail-title">
                    <span
                        class="arp-category-icon arp-tone-${state.category.tone}"
                    >
                        ${svg(state.category.icon)}
                    </span>

                    <div>
                        <h2>
                            ${esc(state.category.name)}
                        </h2>

                        <p>
                            ${esc(state.category.description)}
                        </p>
                    </div>
                </div>

                <!-- Tombol refresh data -->
                <button
                    type="button"
                    class="arp-tool-btn arp-refresh-btn"
                    data-arp-refresh
                >
                    ${svg("refresh")}

                    <span>
                        Refresh
                    </span>
                </button>
            </div>

            
            <!-- ==========================================
                 CARD PENGELOLAAN DOKUMEN
            =========================================== -->
            <section class="arp-control-card">

                <div class="arp-control-heading">
                    <div>
                        <span class="arp-control-eyebrow">
                            PENGELOLAAN DOKUMEN
                        </span>

                        <h3>Temukan arsip dengan cepat</h3>

                        <p>
                            Gunakan pencarian, urutan, atau filter
                            untuk menemukan dokumen.
                        </p>
                    </div>

                    <span class="arp-control-count">
                        ${filtered.length} dokumen
                    </span>
                </div>

                <div class="arp-toolbar arp-detail-toolbar">
                    <label class="arp-search">
                        ${svg("search")}

                        <input
                            data-arp-search
                            type="search"
                            value="${esc(state.query)}"
                            placeholder="Cari nama dokumen..."
                            aria-label="Cari nama dokumen"
                        >
                    </label>

                    <button
                        class="arp-tool-btn"
                        type="button"
                        data-arp-sort
                    >
                        ${svg("sort")}
                        <span>Urutkan</span>
                    </button>

                    <button
                        class="arp-tool-btn"
                        type="button"
                        data-arp-filter
                    >
                        ${svg("filter")}
                        <span>Filter</span>
                    </button>

                    <button
                        class="arp-primary-btn"
                        type="button"
                        data-arp-add
                    >
                        ${svg("plus")}
                        <span>Tambah Arsip</span>
                    </button>
                </div>
            </section>

            <!-- LABEL DAFTAR ARSIP -->
            <div class="arp-result-meta">
                <strong>DAFTAR ARSIP</strong>
            </div>          

            <!-- ==========================================
                 PESAN INFORMASI / ERROR / LOADING
            =========================================== -->
            ${
                message
                    ? `
                        <div class="arp-notice">
                            ${esc(message)}
                        </div>
                    `
                    : ""
            }

            <!-- ==========================================
                 DAFTAR ARSIP ATAU KONDISI KOSONG
            =========================================== -->
            <div class="arp-record-list">
                ${
                    filtered.length
                        // Render seluruh kartu arsip.
                        ? filtered
                            .map(renderRecord)
                            .join("")

                        // Tampilkan kondisi kosong jika tidak
                        // ada pesan loading atau error.
                        : (
                            !message
                                ? `
                                    <div class="arp-empty">
                                        ${svg("file")}

                                        <h3>
                                            Belum ada arsip
                                        </h3>

                                        <p>
                                            Dokumen dalam kategori ini
                                            akan tampil di sini.
                                        </p>

                                        <button
                                            class="arp-primary-btn"
                                            type="button"
                                            data-arp-add
                                        >
                                            ${svg("plus")}
                                            Tambah Arsip
                                        </button>
                                    </div>
                                `
                                : ""
                        )
                }
            </div>

            <!-- ==========================================
                 WADAH MODAL DINAMIS
            =========================================== -->
            <div
                class="arp-modal-host"
                data-arp-modal-host
            ></div>
        </section>
    `;
}


/* ==========================================================
   RENDER KARTU DOKUMEN

   Parameter:
   r = Objek data arsip.

   Menampilkan:
   - Nama dokumen.
   - Keterangan.
   - Tahun dokumen.
   - Status arsip.
   - Tombol membuka file.
========================================================== */
/* ==========================================================
   RENDER KARTU ARSIP — PREMIUM
========================================================== */
function renderRecord(r) {
    const id = String(
        r.idArsip ||
        r.ID_Arsip ||
        r.id ||
        ""
    );

    const name = r.namaArsip || r.Nama_Arsip || "Dokumen tanpa nama";
    const year = r.tahunDokumen || r.Tahun_Dokumen || "—";
    const status = r.statusArsip || r.Status_Arsip || "Aktif";

    const locked =
        r.isLock === true ||
        r.isLock === "TRUE" ||
        r.isLock === "Ya" ||
        r.IS_LOCK === true ||
        r.IS_LOCK === "TRUE";

    const canEdit = canEditArsip(r);
    const isSuper = isSuperAdminArsip();

    return `
        <article class="arp-record-card ${locked ? "arp-record-locked" : ""}">

            <div class="arp-record-top">
                <span class="arp-record-file">
                    ${svg("file")}
                </span>

                <div class="arp-record-badges">
                    <span class="arp-status arp-status-${statusSlug(status)}">
                        ${esc(status)}
                    </span>

                    ${
                        locked
                            ? `<span class="arp-lock-badge">🔒 Terkunci</span>`
                            : ""
                    }
                </div>
            </div>

            <div class="arp-record-main">
                <h3>${esc(name)}</h3>

                <p>${esc(r.keterangan || r.Keterangan || "Tidak ada keterangan")}</p>

                <div class="arp-record-meta">
                    <span>${svg("file")} Tahun ${esc(year)}</span>

                    <span class="arp-record-id">
                        ${esc(id)}
                    </span>
                </div>
            </div>

            <div class="arp-record-actions">
                <button
                    type="button"
                    class="arp-open-file"
                    data-arp-open-file="${esc(id)}"
                    ${!(r.fileUrl || r.File_URL || r.fileURL) ? "disabled" : ""}
                >
                    ${svg("file")}
                    <span>Buka dokumen</span>
                </button>

                ${
                    canEdit || isSuper
                        ? `
                            <div class="arp-action-menu">
                                <button
                                    type="button"
                                    class="arp-action-trigger"
                                    data-arp-toggle-menu="${esc(id)}"
                                    aria-label="Menu tindakan arsip"
                                    aria-expanded="false"
                                >⋯</button>

                                <div
                                    class="arp-action-dropdown"
                                    data-arp-menu="${esc(id)}"
                                    hidden
                                >
                                    ${
                                        canEdit
                                            ? `
                                                <button
                                                    type="button"
                                                    data-arp-edit="${esc(id)}"
                                                >✎ Edit arsip</button>
                                            `
                                            : ""
                                    }

                                    ${
                                        isSuper
                                            ? `
                                                <button
                                                    type="button"
                                                    data-arp-lock="${esc(id)}"
                                                    data-lock-value="${locked ? "false" : "true"}"
                                                >
                                                    ${locked ? "🔓 Buka kunci" : "🔒 Kunci arsip"}
                                                </button>

                                                <button
                                                    type="button"
                                                    class="arp-danger-action"
                                                    data-arp-delete="${esc(id)}"
                                                >Hapus arsip</button>
                                            `
                                            : ""
                                    }
                                </div>
                            </div>
                        `
                        : ""
                }
            </div>
        </article>
    `;
}


/* ==========================================================
   HELPER STATUS SLUG

   Mengubah status arsip menjadi format yang sesuai
   untuk digunakan sebagai suffix class CSS.

   Contoh:
   "Aktif"       -> "aktif"
   "Diarsipkan"  -> "diarsipkan"
   "Kedaluwarsa" -> "kedaluwarsa"
========================================================== */
function statusSlug(s) {
    return String(s)
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        ) || "aktif";
}


/* ==========================================================
   MODAL PENGURUTAN ARSIP

   Pilihan:
   - Tahun terbaru.
   - Tahun terlama.
   - Nama dokumen A–Z.

   Nilai pilihan disesuaikan dengan state.sort.
========================================================== */
function showSort() {
    showModal(`
        <!-- Header modal -->
        <div class="arp-modal-head">

            <h3>
                Urutkan Arsip
            </h3>

            <button
                type="button"
                data-arp-close-modal
                aria-label="Tutup"
            >
                ${svg("close")}
            </button>
        </div>

        <!-- Pilihan pengurutan -->
        <label class="arp-field">
            <span>
                Urutan
            </span>

            <select data-arp-sort-select>

                <option
                    value="newest"
                    ${state.sort === "newest" ? "selected" : ""}
                >
                    Tahun terbaru
                </option>

                <option
                    value="oldest"
                    ${state.sort === "oldest" ? "selected" : ""}
                >
                    Tahun terlama
                </option>

                <option
                    value="name"
                    ${state.sort === "name" ? "selected" : ""}
                >
                    Nama dokumen A–Z
                </option>
            </select>
        </label>

        <!-- Tombol tindakan modal -->
        <div class="arp-modal-actions">
            <button
                type="button"
                class="arp-primary-btn"
                data-arp-close-modal
            >
                Terapkan
            </button>
        </div>
    `);
}


/* ==========================================================
   MODAL FILTER ARSIP

   Filter:
   - Tahun dokumen.
   - Status arsip.

   Daftar tahun diambil dari data kategori yang sedang
   tersedia di state.records, tanpa meminta data tambahan.
========================================================== */
function showFilter() {

    /* ======================================================
       1. SIAPKAN DAFTAR TAHUN
       Hanya menerima tahun dengan format empat digit.
    ====================================================== */
    const years = [
        ...new Set(
            state.records
                .map(
                    record =>
                        String(
                            record.tahunDokumen ||
                            record.tahun ||
                            ""
                        )
                )
                .filter(
                    year => /^\d{4}$/.test(year)
                )
        )
    ].sort().reverse();

    /* ======================================================
       2. TAMPILKAN MODAL FILTER
    ====================================================== */
    showModal(`
        <!-- Header modal -->
        <div class="arp-modal-head">
            <h3>
                Filter Arsip
            </h3>

            <button
                type="button"
                data-arp-close-modal
                aria-label="Tutup"
            >
                ${svg("close")}
            </button>
        </div>

        <!-- ==============================================
             FILTER TAHUN DOKUMEN
        =============================================== -->
        <label class="arp-field">
            <span>
                Tahun Dokumen
            </span>

            <select data-arp-year>
                <option value="">
                    Semua tahun
                </option>

                ${
                    years.map(
                        year => `
                            <option
                                value="${esc(year)}"
                                ${state.year === year ? "selected" : ""}
                            >
                                ${esc(year)}
                            </option>
                        `
                    ).join("")
                }
            </select>
        </label>

        <!-- ==============================================
             FILTER STATUS ARSIP
        =============================================== -->
        <label class="arp-field">
            <span>
                Status Arsip
            </span>

            <select data-arp-status>
                <option value="">
                    Semua status
                </option>

                ${
                    ["Aktif", "Diarsipkan", "Kedaluwarsa"]
                        .map(
                            status => `
                                <option
                                    value="${status}"
                                    ${state.status === status ? "selected" : ""}
                                >
                                    ${status}
                                </option>
                            `
                        ).join("")
                }
            </select>
        </label>

        <!-- ==============================================
             TOMBOL TINDAKAN FILTER
        =============================================== -->
        <div class="arp-modal-actions">
            <!-- Menghapus filter status dan tahun -->
            <button
                type="button"
                class="arp-secondary-btn"
                data-arp-clear-filter
            >
                Reset filter
            </button>

            <!-- Menutup modal setelah pilihan diterapkan -->
            <button
                type="button"
                class="arp-primary-btn"
                data-arp-close-modal
            >
                Terapkan
            </button>
        </div>
    `);
}


/* ==========================================================
   FORM TAMBAH ARSIP PUSKESMAS

   Fitur:
   - Menampilkan kategori aktif.
   - Memilih tahun dokumen.
   - Mengisi nama arsip dan keterangan.
   - Memilih status arsip.
   - Mengunggah file dokumen.

   Catatan:
   Form dikirim melalui event handler onSubmit().
========================================================== */
function showForm(record = null) {
    const editing = Boolean(record);
    const locked =
        record?.isLock === true ||
        record?.isLock === "TRUE" ||
        record?.IS_LOCK === true ||
        record?.IS_LOCK === "TRUE";

    if (editing && (!canEditArsip(record) || locked)) {
        alert("Arsip terkunci atau Anda tidak memiliki izin edit.");
        return;
    }

    const years = Array.from(
        { length: 12 },
        (_, i) => new Date().getFullYear() - i
    );

    const id = String(
        record?.idArsip || record?.ID_Arsip || record?.id || ""
    );

    const tahun = String(
        record?.tahunDokumen || record?.Tahun_Dokumen || ""
    );

    const nama = record?.namaArsip || record?.Nama_Arsip || "";
    const keterangan = record?.keterangan || record?.Keterangan || "";
    const status = record?.statusArsip || record?.Status_Arsip || "Aktif";

    showModal(`
        <form data-arp-form data-arp-mode="${editing ? "edit" : "add"}">
            <div class="arp-modal-head">
                <h3>${editing ? "Edit Arsip" : "Tambah Arsip"}</h3>
                <button type="button" data-arp-close-modal aria-label="Tutup">
                    ${svg("close")}
                </button>
            </div>

            ${editing ? `
                <input type="hidden" name="idArsip" value="${esc(id)}">
            ` : ""}

            <label class="arp-field">
                <span>Kategori</span>
                <input value="${esc(state.category.name)}" readonly>
            </label>

            <label class="arp-field">
                <span>Tahun Dokumen <b>*</b></span>
                <select name="tahunDokumen" required>
                    <option value="">Pilih tahun</option>
                    ${years.map(y => `
                        <option value="${y}" ${String(y) === tahun ? "selected" : ""}>
                            ${y}
                        </option>
                    `).join("")}
                    ${
                        tahun && !years.some(y => String(y) === tahun)
                            ? `<option value="${esc(tahun)}" selected>${esc(tahun)}</option>`
                            : ""
                    }
                </select>
            </label>

            <label class="arp-field">
                <span>Nama Arsip <b>*</b></span>
                <input
                    name="namaArsip"
                    maxlength="180"
                    required
                    value="${esc(nama)}"
                    placeholder="Masukkan nama dokumen"
                >
            </label>

            <label class="arp-field">
                <span>Keterangan</span>
                <textarea
                    name="keterangan"
                    rows="3"
                    maxlength="1000"
                    placeholder="Keterangan tambahan (opsional)"
                >${esc(keterangan)}</textarea>
            </label>

            <label class="arp-field">
                <span>Status Arsip</span>
                <select name="statusArsip">
                    ${["Aktif", "Diarsipkan", "Kedaluwarsa"].map(s => `
                        <option value="${s}" ${status === s ? "selected" : ""}>
                            ${s}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label class="arp-field">
                <span>File Dokumen ${editing ? "(opsional jika tidak diganti)" : "<b>*</b>"}</span>
                <span class="arp-upload-box">
                    ${svg("upload")}
                    <span>${editing ? "Pilih file baru jika ingin mengganti" : "Pilih PDF, Word, Excel, atau gambar"}</span>
                    <input
                        type="file"
                        name="file"
                        ${editing ? "" : "required"}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    >
                </span>
                ${editing ? `
                    <small class="arp-help">
                        File lama tetap digunakan jika tidak memilih file baru.
                    </small>
                ` : ""}
            </label>

            <div class="arp-modal-actions">
                <button type="button" class="arp-secondary-btn" data-arp-close-modal>
                    Batal
                </button>
                <button type="submit" class="arp-primary-btn">
                    ${editing ? "Simpan Perubahan" : "Simpan Arsip"}
                </button>
            </div>
        </form>
    `);
}


/* ==========================================================
   TAMPILKAN MODAL ARSIP PUSKESMAS
========================================================== */
function showModal(html) {

  // Ambil elemen tempat modal ditampilkan.
  const host = state.root.querySelector(
    "[data-arp-modal-host]"
  );

  // Hentikan jika elemen modal tidak ditemukan.
  if (!host) return;

  // Render backdrop dan konten dialog modal.
  host.innerHTML = `
    <div class="arp-modal-backdrop">
      <div
        class="arp-modal"
        role="dialog"
        aria-modal="true"
      >
        ${html}
      </div>
    </div>
  `;
}


/* ==========================================================
   TUTUP MODAL ARSIP PUSKESMAS
========================================================== */
function closeModal() {

  // Cari tempat modal jika root masih tersedia.
  const host = state.root?.querySelector(
    "[data-arp-modal-host]"
  );

  // Kosongkan konten modal.
  if (host) {
    host.innerHTML = "";
  }
}


/* ==========================================================
   SIMPAN ARSIP PUSKESMAS
   Alur:
   1. Validasi form.
   2. Ubah file menjadi Base64.
   3. Kirim data ke adapter/backend GAS.
   4. Tutup modal dan muat ulang data.
========================================================== */
async function onSubmit(e) {
    if (!e.target.matches("[data-arp-form]")) return;

    e.preventDefault();

    if (state.busy) return;

    const api = adapter();
    if (!api || typeof api.save !== "function") {
        alert("Backend penyimpanan arsip belum dihubungkan.");
        return;
    }

    const form = e.target;
    const editing = form.dataset.arpMode === "edit";
    const file = form.elements.file.files[0] || null;
    const user = getArsipCurrentUser();

    if (!user.nip) {
        alert("NIP pengguna tidak ditemukan pada session Smart Office.");
        return;
    }

    if (!editing && !file) {
        alert("File dokumen wajib diunggah.");
        form.elements.file.focus();
        return;
    }

    const idArsip = editing
        ? String(form.elements.idArsip.value || "")
        : "";

    if (editing) {
        const record = state.records.find(item =>
            String(item.idArsip || item.ID_Arsip || item.id || "") === idArsip
        );

        if (!record || !canEditArsip(record)) {
            alert("Anda tidak memiliki izin mengedit arsip ini.");
            return;
        }
    }

    const submit = form.querySelector('[type="submit"]');

    if (submit) {
        submit.disabled = true;
        submit.textContent = "Menyimpan...";
    }

    state.busy = true;

    try {
        const filePayload = file
            ? {
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                base64: await fileToBase64(file)
            }
            : null;

        await api.save({
            idArsip,
            kategori: state.category.id,
            tahunDokumen: form.elements.tahunDokumen.value,
            namaArsip: form.elements.namaArsip.value.trim(),
            keterangan: form.elements.keterangan.value.trim(),
            statusArsip: form.elements.statusArsip.value,
            diperbaruiOleh: user.nip,
            file: filePayload
        });

        closeModal();
        state.cache.delete(state.category.id);
        await loadCategory(state.category.id, true);

    } catch (err) {
        console.error("Arsip: gagal menyimpan", err);
        alert(err?.message || "Gagal menyimpan arsip.");
    } finally {
        state.busy = false;

        if (submit) {
            submit.disabled = false;
            submit.textContent = editing
                ? "Simpan Perubahan"
                : "Simpan Arsip";
        }
    }
}


/* ==========================================================
   KONVERSI FILE KE BASE64
   Digunakan sebelum file dikirim ke backend GAS.
========================================================== */
function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    // Buat reader untuk membaca file dari input pengguna.
    const reader = new FileReader();

    // Jika berhasil dibaca, ambil bagian Base64 saja.
    // Format hasil readAsDataURL:
    // data:application/pdf;base64,JVBERi0x...
    reader.onload = () => {
      const result = String(reader.result);

      // Hilangkan prefix MIME dan sisakan data Base64.
      const base64 = result.split(",")[1] || "";

      resolve(base64);
    };

    // Jika pembacaan gagal, kembalikan pesan kesalahan.
    reader.onerror = () => {
      reject(new Error("File tidak dapat dibaca."));
    };

    // Baca file sebagai Data URL.
    reader.readAsDataURL(file);
  });
}

