/* ======================================================
   SMART OFFICE — PENGELOLAAN SPD BLUD
   VITE / SPA / PWA

   Keterangan:
   - Modul pengelolaan SPD BLUD.
   - Menggunakan lifecycle halaman SPA.
   - Renderer mandiri, tidak bergantung pada
     smartspd-blud.js.
====================================================== */

/* ======================================================
   IMPORT — SESSION DAN AUTENTIKASI
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";


/* ======================================================
   IMPORT — NAVIGASI DAN NOTIFIKASI
====================================================== */
// Navigasi antarhalaman pada aplikasi SPA.
import {
    smartofficeNavigate
} from "../../core/router.js";

// Menampilkan notifikasi kepada pengguna.
import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

// Menampilkan navbar mobile Smart Office.
import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

/* ======================================================
   IMPORT — DATA SPD DARI FIRESTORE
====================================================== */
// Mengambil seluruh data SPD untuk ditampilkan
// pada halaman Pengelolaan SPD BLUD.
import {
    smartofficeGetAllSPDFromFirestore
} from "../../services/smartspd-blud-firestore.service.js";

/* ======================================================
   IMPORT — AKSI PENGELOLAAN SPD DAN SPJ
====================================================== */
// Nama fungsi diberi alias Service untuk menghindari
// bentrok dengan fungsi lokal pada modul ini.
import {
    smartofficeUnlockSPD as smartofficeUnlockSPDService,
    smartofficeVerifySPJ as smartofficeVerifySPJService
} from "../../services/smartspd-blud.service.js";


/* ======================================================
   STATE — VARIABEL GLOBAL MODUL
====================================================== */
// Menyimpan seluruh data SPD yang berhasil dimuat.
let smartofficePengelolaanSPDData = [];

// Penanda instance halaman untuk mencegah proses
// lama berjalan setelah halaman SPA berganti.
let smartofficePengelolaanSPDInstance = 0;

// Menyimpan daftar event listener yang dipasang
// agar dapat dilepas saat halaman dihancurkan.
let smartofficePengelolaanSPDHandlers = [];

// Menyimpan data SPD yang sedang dipilih.
let smartofficePengelolaanSPDActiveItem = null;

// Menyimpan referensi modal atau menu aksi yang aktif.
let smartofficePengelolaanSPDModal = null;


/* ======================================================
   LIFECYCLE — SIKLUS HIDUP HALAMAN
====================================================== */
/**
 * Memuat halaman Pengelolaan SPD BLUD.
 *
 * Urutan proses:
 * 1. Membuat instance halaman baru.
 * 2. Membersihkan event listener sebelumnya.
 * 3. Memeriksa sesi pengguna.
 * 4. Menampilkan navbar.
 * 5. Memasang event listener.
 * 6. Membuka tab Overview SPD.
 * 7. Memuat data SPD dari Firestore.
 */
export async function smartofficeLoadPage() {

    // Buat penanda untuk instance halaman yang aktif.
    const instance = ++smartofficePengelolaanSPDInstance;

    // Bersihkan event listener dari proses sebelumnya.
    smartofficePengelolaanSPDCleanupHandlers();

    /* --------------------------------------------------
       1. PERIKSA STATUS LOGIN
    -------------------------------------------------- */
    // Jika sesi tidak valid, arahkan pengguna ke halaman login.
    if (!smartofficeCheckSession()) {
        await smartofficeNavigate("login");
        return;
    }

    // Ambil informasi sesi pengguna yang sedang aktif.
    const session = smartofficeGetSession();

    // Jika data sesi tidak tersedia, lakukan logout.
    if (!session) {
        await smartofficeLogout();
        return;
    }


    /* --------------------------------------------------
       2. INISIALISASI HALAMAN
    -------------------------------------------------- */
    // Tampilkan navbar mobile dengan menu SPD aktif.
    smartofficeRenderMobileNavbar(session.role, "spd");

    // Pasang seluruh event listener halaman.
    smartofficeInitPengelolaanSPDEvents(instance);

    // Buka tab Overview SPD sebagai tampilan awal.
    smartofficeSwitchPengelolaanSPDTab("overview");

    // Ambil dan tampilkan data SPD.
    await smartofficeLoadPengelolaanSPDData(instance);
}


/**
 * Membersihkan halaman sebelum navigasi ke halaman lain.
 */
export async function smartofficeDestroyPage() {

    // Batalkan validitas instance halaman sebelumnya.
    smartofficePengelolaanSPDInstance++;

    // Lepaskan semua event listener yang terdaftar.
    smartofficePengelolaanSPDCleanupHandlers();

    // Tutup modal atau menu yang masih terbuka.
    smartofficePengelolaanSPDCloseModal();

    // Kosongkan data SPD dari memori modul.
    smartofficePengelolaanSPDData = [];

    // Hapus referensi SPD yang sedang dipilih.
    smartofficePengelolaanSPDActiveItem = null;
}


/* ======================================================
   EVENT LISTENER — PENGELOLAAN LISTENER
====================================================== */
/**
 * Melepaskan semua event listener yang sebelumnya dipasang.
 *
 * Fungsi ini dipanggil saat halaman dimuat ulang
 * atau saat pengguna meninggalkan halaman.
 */
function smartofficePengelolaanSPDCleanupHandlers() {

    smartofficePengelolaanSPDHandlers.forEach(
        ({ element, type, handler }) => {

            element.removeEventListener(type, handler);
        }
    );

    // Kosongkan daftar setelah semua listener dilepas.
    smartofficePengelolaanSPDHandlers = [];
}


/**
 * Memasang event listener dan menyimpannya dalam daftar.
 *
 * Dengan cara ini, listener dapat dilepas kembali
 * melalui smartofficePengelolaanSPDCleanupHandlers().
 */
function smartofficePengelolaanSPDAddHandler(
    element,
    type,
    handler
) {
    // Jangan memasang listener jika elemennya tidak tersedia.
    if (!element) {
        return;
    }

    // Pasang event listener pada elemen.
    element.addEventListener(type, handler);

    // Simpan referensi untuk proses pembersihan.
    smartofficePengelolaanSPDHandlers.push({
        element,
        type,
        handler
    });
}


/* ======================================================
   EVENTS — INISIALISASI EVENT HALAMAN
====================================================== */
/**
 * Mendaftarkan event untuk navigasi, tab, filter,
 * reset filter, dan tombol aksi pada daftar SPD.
 *
 * Parameter instance digunakan untuk memastikan
 * proses hanya berjalan pada instance halaman aktif.
 */
function smartofficeInitPengelolaanSPDEvents(instance) {

    /* --------------------------------------------------
       1. TOMBOL KEMBALI KE DASHBOARD
    -------------------------------------------------- */
    smartofficePengelolaanSPDAddHandler(
        document.querySelector('[data-action="back-dashboard"]'),
        "click",
        async () => {

            // Pastikan halaman belum digantikan instance baru.
            if (instance === smartofficePengelolaanSPDInstance) {
                await smartofficeNavigate("dashboard");
            }
        }
    );

    /* --------------------------------------------------
       2. TOMBOL REFRESH DATA SPD
    -------------------------------------------------- */
    smartofficePengelolaanSPDAddHandler(
        document.getElementById(
            "smartofficePengelolaanSPDRefreshButton"
        ),
        "click",
        async () => {

            // Muat ulang data menggunakan instance aktif.
            await smartofficeLoadPengelolaanSPDData(instance);
        }
    );

    /* --------------------------------------------------
       3. NAVIGASI TAB OVERVIEW SPD
    -------------------------------------------------- */
    smartofficePengelolaanSPDAddHandler(
        document.getElementById(
            "smartofficeTabOverviewPengelolaanSPD"
        ),
        "click",
        () => {

            smartofficeSwitchPengelolaanSPDTab("overview");
        }
    );

    /* --------------------------------------------------
       4. NAVIGASI TAB REKAP SPD
    -------------------------------------------------- */
    smartofficePengelolaanSPDAddHandler(
        document.getElementById(
            "smartofficeTabRekapPengelolaanSPD"
        ),
        "click",
        () => {

            smartofficeSwitchPengelolaanSPDTab("rekap");
        }
    );

    /* --------------------------------------------------
       5. DAFTAR INPUT FILTER
    -------------------------------------------------- */
    const filterIds = [
        "smartofficePengelolaanSPDSearch",
        "smartofficePengelolaanSPDMonth",
        "smartofficePengelolaanSPDYear",
        "smartofficePengelolaanSPDStatus",
        "smartofficePengelolaanSPDSPJ"
    ];

    // Pasang listener input dan change untuk setiap filter.
    filterIds.forEach(id => {
        const element = document.getElementById(id);

        // Jalankan filter ketika nilai input berubah.
        smartofficePengelolaanSPDAddHandler(
            element,
            "input",
            smartofficeApplyPengelolaanSPDFilters
        );

        // Jalankan filter ketika pilihan dropdown berubah.
        smartofficePengelolaanSPDAddHandler(
            element,
            "change",
            smartofficeApplyPengelolaanSPDFilters
        );
    });

    /* --------------------------------------------------
       6. TOMBOL RESET FILTER
    -------------------------------------------------- */
    smartofficePengelolaanSPDAddHandler(
        document.getElementById(
            "smartofficePengelolaanSPDReset"
        ),
        "click",
        () => {

            // Kosongkan seluruh input dan pilihan filter.
            filterIds.forEach(id => {

                const element = document.getElementById(id);

                if (element) {
                    element.value = "";
                }
            });

            // Tampilkan kembali data tanpa filter.
            smartofficeApplyPengelolaanSPDFilters();
        }
    );

    /* --------------------------------------------------
       7. EVENT DELEGATION PADA DAFTAR SPD
    -------------------------------------------------- */
    const list = document.getElementById(
        "smartofficePengelolaanSPDList"
    );

    // Satu listener menangani tombol aksi pada seluruh kartu.
    // Cara ini menghindari pemasangan listener pada setiap tombol.
    smartofficePengelolaanSPDAddHandler(
        list,
        "click",
        event => {

            // Cari tombol aksi terdekat dari elemen yang diklik.
            const button = event.target.closest(
                "[data-pengelolaan-action]"
            );

            // Abaikan klik di luar tombol aksi atau di luar daftar.
            if (!button || !list.contains(button)) {
                return;
            }

            // Cegah perilaku default dan propagasi klik.
            event.preventDefault();
            event.stopPropagation();

            /* ------------------------------------------
               CARI DATA SPD BERDASARKAN ID
            ------------------------------------------ */
            const id = button.dataset.idSpd || "";
            const item = smartofficePengelolaanSPDData.find(
                row => row.idSPD === id
            );

            // Beri notifikasi jika data tidak ditemukan.
            if (!item) {
                smartofficeShowToast(
                    "Data SPD tidak ditemukan. Muat ulang halaman.",
                    "error"
                );

                return;
            }

            /* ------------------------------------------
               JALANKAN AKSI YANG DIPILIH
            ------------------------------------------ */
            smartofficePengelolaanSPDHandleAction(
                button.dataset.pengelolaanAction,
                item
            );
        }
    );
}


/* ======================================================
   TAB — PERPINDAHAN OVERVIEW DAN REKAP SPD
====================================================== */
/**
 * Mengaktifkan tab yang dipilih dan menyembunyikan
 * konten tab lainnya.
 *
 * Tab yang tersedia:
 * - overview: Ringkasan dan statistik SPD.
 * - rekap: Daftar SPD dan fitur pengelolaan.
 */
function smartofficeSwitchPengelolaanSPDTab(tab) {

    // Konfigurasi tombol dan konten masing-masing tab.
    const config = {
        overview: {
            button: "smartofficeTabOverviewPengelolaanSPD",
            content: "smartofficePengelolaanSPDOverviewContent"
        },

        rekap: {
            button: "smartofficeTabRekapPengelolaanSPD",
            content: "smartofficePengelolaanSPDRekapContent"
        }
    };

    // Hentikan proses jika nama tab tidak dikenal.
    if (!config[tab]) {
        return;
    }

    /* --------------------------------------------------
       PERBARUI TOMBOL DAN KONTEN TAB
    -------------------------------------------------- */
    Object.entries(config).forEach(([key, entry]) => {

        const button = document.getElementById(entry.button);
        const content = document.getElementById(entry.content);

        // Tandai tombol tab yang sedang aktif.
        if (button) {
            button.classList.toggle(
                "active",
                key === tab
            );

            button.setAttribute(
                "aria-selected",
                key === tab ? "true" : "false"
            );
        }

        // Tampilkan konten tab aktif dan sembunyikan lainnya.
        if (content) {
            content.style.display =
                key === tab ? "block" : "none";
        }
    });
}


/* ======================================================
   DATA — MEMUAT DATA SPD DARI FIRESTORE
====================================================== */
/**
 * Mengambil data SPD dari Firestore, menormalisasi data,
 * mengisi filter, dan merender halaman.
 *
 * @param {number} instance - Penanda instance halaman aktif.
 */
async function smartofficeLoadPengelolaanSPDData(instance) {

    // Ambil elemen daftar SPD.
    const list = document.getElementById(
        "smartofficePengelolaanSPDList"
    );

    /* --------------------------------------------------
       1. TAMPILKAN INDIKATOR LOADING
    -------------------------------------------------- */
    // Tampilkan skeleton ketika data sedang dimuat.
    if (list) {
        list.innerHTML = `
            <div class="smartoffice-approval-skeleton-card">
                Memuat data SPD...
            </div>
        `;
    }

    /* --------------------------------------------------
       2. AMBIL DATA DARI FIRESTORE
    -------------------------------------------------- */
    try {
        const result = await smartofficeGetAllSPDFromFirestore();

        // Abaikan hasil jika halaman sudah berganti instance.
        if (instance !== smartofficePengelolaanSPDInstance) {
            return;
        }

        /* --------------------------------------------------
           3. NORMALISASI SELURUH DATA SPD
        -------------------------------------------------- */
        // Pastikan hasil berupa array sebelum diproses.
        smartofficePengelolaanSPDData = Array.isArray(result)
            ? result.map(smartofficeNormalizePengelolaanSPD)
            : [];

        /* --------------------------------------------------
           4. PERBARUI TAMPILAN HALAMAN
        -------------------------------------------------- */
        // Isi pilihan bulan dan tahun berdasarkan data SPD.
        smartofficePopulatePengelolaanSPDFilters();

        // Tampilkan ringkasan pada tab Overview SPD.
        smartofficeRenderPengelolaanSPDOverview();

        // Terapkan filter dan tampilkan daftar SPD.
        smartofficeApplyPengelolaanSPDFilters();

    } catch (error) {
        /* --------------------------------------------------
           5. TANGANI KEGAGALAN MEMUAT DATA
        -------------------------------------------------- */
        console.error(
            "PENGELOLAAN SPD LOAD ERROR:",
            error
        );

        // Tampilkan pesan kesalahan khusus Pengelolaan SPD.
        if (list) {
            list.innerHTML = `
                <div class="smartoffice-pengelolaan-spd-error">
                    <strong>Gagal memuat data SPD</strong>
                    <span>
                        Periksa koneksi, lalu tekan tombol
                        muat ulang.
                    </span>
                </div>
            `;
        }

        // Tampilkan notifikasi kegagalan kepada pengguna.
        smartofficeShowToast(
            error?.message || "Gagal memuat data SPD.",
            "error"
        );
    }
}


/* ======================================================
   DATA — NORMALISASI DATA SPD
====================================================== */
/**
 * Menyeragamkan nama properti data SPD dari Firestore.
 *
 * Beberapa field memiliki lebih dari satu kemungkinan
 * nama karena format data dapat berbeda.
 *
 * @param {Object} raw - Data SPD asli dari Firestore.
 * @returns {Object} Data SPD dengan properti seragam.
 */
function smartofficeNormalizePengelolaanSPD(raw) {

    // Pastikan data yang diterima berupa objek.
    const data = raw && typeof raw === "object"
        ? raw
        : {};

    /* --------------------------------------------------
       HELPER — MENGAMBIL NILAI FIELD
    -------------------------------------------------- */
    /**
     * Mencari nilai pertama yang tidak kosong
     * dari daftar nama field yang diberikan.
     */
    const get = (...keys) => {
        for (const key of keys) {
            const value = data[key];

            // Lewati nilai null, undefined, atau kosong.
            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }
        }

        // Kembalikan string kosong jika tidak ditemukan.
        return "";
    };

    /* --------------------------------------------------
       NORMALISASI — IDENTITAS SPD
    -------------------------------------------------- */
    return {

        // Identitas utama SPD.
        idSPD: String(
            get("ID SPD", "idSPD", "id")
        ).trim(),

        // Nama dan identitas pegawai.
        nama: String(
            get("Nama", "NAMA")
        ).trim(),

        nip: String(
            get("NIP / NRP", "NIP/NRP", "NIP")
        ).trim(),

        /* --------------------------------------------------
           NORMALISASI — INFORMASI PERJALANAN
        -------------------------------------------------- */
        kegiatan: String(
            get("Kegiatan", "KEGIATAN")
        ).trim(),

        lokasi: String(
            get("Lokasi", "LOKASI")
        ).trim(),

        tanggalBerangkat: String(
            get("Tanggal Berangkat", "TANGGAL_BERANGKAT")
        ).trim(),

        tanggalPulang: String(
            get("Tanggal Pulang", "TANGGAL_PULANG")
        ).trim(),

        tanggalDibuat: String(
            get("Tanggal SPD Dibuat", "TANGGAL_SPD_DIBUAT")
        ).trim(),

        jumlahHari: String(
            get("Jumlah Hari", "JUMLAH_HARI")
        ).trim(),

        /* --------------------------------------------------
           NORMALISASI — STATUS SPD DAN SPJ
        -------------------------------------------------- */
        // Status SPD dibuat menjadi huruf kapital.
        statusSPD: String(
            get("STATUS_SPD", "Status SPD", "STATUS") ||
            "BELUM DITETAPKAN"
        ).trim().toUpperCase(),

        // Status SPJ dibuat menjadi huruf kapital.
        statusSPJ: String(
            get("STATUS_SPJ", "Status SPJ") ||
            "BELUM ADA"
        ).trim().toUpperCase(),

        // Status lock SPD.
        lockSPD: String(
            get("LOCK_SPD", "Lock SPD")
        ).trim().toUpperCase(),

        /* --------------------------------------------------
           NORMALISASI — VERIFIKASI SPJ
        -------------------------------------------------- */
        // Catatan revisi dari petugas pemeriksa SPJ.
        catatanRevisiSPJ: String(
            get("CATATAN_REVISI_SPJ", "Catatan Revisi SPJ")
        ).trim(),

        // Waktu pembaruan status SPJ.
        tglUpdateSPJ: String(
            get("TGL_UPDATE_SPJ", "Tanggal Update SPJ")
        ).trim(),

        /* --------------------------------------------------
           NORMALISASI — DOKUMEN DAN PEMBAYARAN
        -------------------------------------------------- */
        // Tautan PDF SPD.
        linkPdf: String(
            get(
                "LINK_PDF_SPD",
                "Link PDF SPD",
                "PDF_URL",
                "LINK_PDF"
            )
        ).trim(),

        // Tautan bukti pembayaran.
        buktiPembayaran: String(
            get(
                "LINK_BUKTI_PEMBAYARAN",
                "BUKTI_PEMBAYARAN_URL",
                "LINK_PEMBAYARAN",
                "Bukti Pembayaran",
                "Link Bukti Pembayaran"
            )
        ).trim(),

        // Nilai biaya atau jumlah uang.
        // Nilai asli dipertahankan, tidak dikonversi ke string.
        jumlahUang: get(
            "JUMLAH UANG",
            "Jumlah Uang",
            "TOTAL_BIAYA"
        ),

        /* --------------------------------------------------
           DATA ASLI
        -------------------------------------------------- */
        // Simpan objek asli untuk field lain yang mungkin
        // diperlukan pada proses render atau detail SPD.
        raw: data
    };
}


/* ======================================================
   OVERVIEW SPD
   Menampilkan ringkasan statistik dan status SPD
====================================================== */
function smartofficeRenderPengelolaanSPDOverview() {

    const container = document.getElementById(
        "smartofficePengelolaanSPDOverviewContent"
    );

    if (!container) return;

    /* ==================================================
       1. AMBIL DATA SPD
    ================================================== */
    const rows = smartofficePengelolaanSPDData;
    const total = rows.length;
    const bulanIni = new Date();

    /* ==================================================
       2. HITUNG SPD BULAN INI
       Berdasarkan tanggal berangkat
    ================================================== */
    const bulanAktif = rows.filter(item => {
        const d = smartofficeParseDate(
            item.tanggalBerangkat
        );

        return d &&
            d.getFullYear() === bulanIni.getFullYear() &&
            d.getMonth() === bulanIni.getMonth();

    }).length;

    /* ==================================================
       3. HITUNG STATUS SPJ
    ================================================== */
    const spjRevisi = rows.filter(
        item => item.statusSPJ === "REVISI"
    ).length;

    const spjSelesai = rows.filter(
        item => item.statusSPJ === "SELESAI"
    ).length;

    const spjBelum = rows.filter(
        item => !["REVISI", "SELESAI"].includes(item.statusSPJ)
    ).length;


    /* ==================================================
       4. HITUNG STATUS SPD
    ================================================== */
    const locked = rows.filter(
        item => item.lockSPD === "TERKUNCI"
    ).length;

    const statusCount = status => {
        return rows.filter(
            item => item.statusSPD === status
        ).length;
    };

    /* ==================================================
       5. RENDER KONTEN OVERVIEW
    ================================================== */
    container.innerHTML = `
        <div class="smartoffice-pengelolaan-spd-overview">

            <!-- KARTU STATISTIK -->
            <div class="smartoffice-pengelolaan-spd-stat-grid">

                ${smartofficeOverviewStat(
                    "Total SPD",
                    total,
                    "Seluruh data SPD",
                    "file-text"
                )}

                ${smartofficeOverviewStat(
                    "SPD Bulan Ini",
                    bulanAktif,
                    "Berdasarkan tanggal berangkat",
                    "calendar-days"
                )}

                ${smartofficeOverviewStat(
                    "Menunggu SPJ",
                    spjBelum,
                    "Belum selesai diverifikasi",
                    "clock-3"
                )}

                ${smartofficeOverviewStat(
                    "SPJ Selesai",
                    spjSelesai,
                    "Sudah diverifikasi selesai",
                    "circle-check"
                )}

            </div>

            <!-- KARTU PEMANTAUAN SPD -->
            <div class="smartoffice-pengelolaan-spd-overview-monitor-card">

                <!-- HEADER KARTU -->
                <div class="smartoffice-pengelolaan-spd-overview-monitor-header">
                    <div>
                        <strong>Pemantauan SPD</strong>
                        <span>
                            Ringkasan status seluruh perjalanan dinas
                        </span>
                    </div>
                </div>

                <!-- ISI KARTU -->
                <div class="smartoffice-pengelolaan-spd-overview-monitor-body">

                    <!-- RINGKASAN STATUS SPJ -->
                    <div class="smartoffice-pengelolaan-spd-status-list">

                        ${smartofficeStatusLine(
                            "Menunggu / lainnya",
                            spjBelum,
                            total
                        )}

                        ${smartofficeStatusLine(
                            "SPJ Revisi",
                            spjRevisi,
                            total
                        )}

                        ${smartofficeStatusLine(
                            "SPJ Selesai",
                            spjSelesai,
                            total
                        )}

                    </div>

                    <!-- RINGKASAN STATUS SPD -->
                    <div class="smartoffice-pengelolaan-spd-summary">

                        <div>
                            <span>SPD terkunci</span>
                            <strong>${locked}</strong>
                        </div>

                        <div>
                            <span>SPD berstatus selesai</span>
                            <strong>${statusCount("SELESAI")}</strong>
                        </div>

                        <div>
                            <span>SPD berstatus revisi</span>
                            <strong>${statusCount("REVISI")}</strong>
                        </div>

                    </div>
                </div>

                <!-- FOOTER KARTU -->
                <div class="smartoffice-pengelolaan-spd-overview-monitor-footer">
                    <button
                        type="button"
                        class="smartoffice-pengelolaan-spd-overview-link"
                        data-overview-action="rekap"
                    >
                        Lihat Rekap SPD
                        <span aria-hidden="true">→</span>
                    </button>
                </div>

            </div>
        </div>
    `;

    /* ==================================================
       6. EVENT TOMBOL LIHAT REKAP SPD
    ================================================== */
    const rekapButton = container.querySelector(
        '[data-overview-action="rekap"]'
    );

    smartofficePengelolaanSPDAddHandler(
        rekapButton,
        "click",
        () => {
            smartofficeSwitchPengelolaanSPDTab("rekap");
        }
    );
}


/* ======================================================
   KOMPONEN KARTU STATISTIK OVERVIEW
====================================================== */
function smartofficeOverviewStat(
    label,
    value,
    description,
    icon
) {
    return `
        <div class="smartoffice-pengelolaan-spd-stat">
            <!-- LABEL DAN IKON -->
            <div class="smartoffice-pengelolaan-spd-stat-top">
                <span>
                    ${smartofficeEscapeHTML(label)}
                </span>

                <span
                    class="smartoffice-pengelolaan-spd-stat-icon"
                    aria-hidden="true"
                >
                    ${smartofficeIcon(icon)}
                </span>
            </div>

            <!-- NILAI STATISTIK -->
            <strong>${value}</strong>

            <!-- KETERANGAN STATISTIK -->
            <small>
                ${smartofficeEscapeHTML(description)}
            </small>
        </div>
    `;
}


/* ======================================================
   KOMPONEN BARIS STATUS DAN PROGRESS
====================================================== */
function smartofficeStatusLine(
    label,
    count,
    total
) {
    /* Hitung persentase status */
    const percent = total
        ? Math.round(count / total * 100)
        : 0;

    /* Render baris status */
    return `
        <div class="smartoffice-pengelolaan-spd-status-row">
            <!-- LABEL DAN JUMLAH -->
            <div>
                <span>
                    ${smartofficeEscapeHTML(label)}
                </span>

                <strong>${count}</strong>
            </div>

            <!-- BAR PROGRESS -->
            <div class="smartoffice-pengelolaan-spd-progress">
                <span style="width:${percent}%"></span>
            </div>
        </div>
    `;
}

/* ======================================================
   REKAP CARDS — RENDER DAFTAR SPD
   Menggunakan class kartu Riwayat SPD SmartSPD BLUD
====================================================== */
function smartofficeRenderPengelolaanSPDList(data) {

    const list = document.getElementById(
        "smartofficePengelolaanSPDList"
    );

    if (!list) return;

    /* ==================================================
       1. EMPTY STATE
    ================================================== */
    if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = `
            <div class="smartoffice-pengelolaan-spd-empty">
                <div class="smartoffice-pengelolaan-spd-empty-icon">
                    ${smartofficeIcon("file-search")}
                </div>
                <strong>Belum ada data SPD</strong>
                <span>
                    Data yang sesuai dengan filter akan tampil di sini.
                </span>
            </div>
        `;

        return;
    }

    /* ==================================================
       2. RENDER KARTU SPD
    ================================================== */
    list.innerHTML = data.map((item, index) => {

        /* ----------------------------------------------
           DATA PENGIKUT
        ---------------------------------------------- */
        const pengikut = [1, 2, 3, 4]
            .map(n => item.raw?.[`Nama Pengikut ${n}`])
            .filter(value => value && String(value).trim())
            .map(value => String(value));

        /* ----------------------------------------------
           STATUS SPD
        ---------------------------------------------- */
        const statusSPD = String(
            item.statusSPD || "BELUM DITETAPKAN"
        ).trim().toUpperCase();

        let statusClass = "default";

        if (
            statusSPD === "MENUNGGU REVIEW" ||
            statusSPD === "MENUNGGU PERSETUJUAN"
        ) {
            statusClass = "waiting";
        } else if (
            statusSPD === "DISETUJUI" ||
            statusSPD === "SELESAI"
        ) {
            statusClass = "approved";
        } else if (
            statusSPD === "DITOLAK"
        ) {
            statusClass = "rejected";
        } else if (
            statusSPD === "REVISI"
        ) {
            statusClass = "revision";
        }

        /* ----------------------------------------------
           STATUS SPJ
        ---------------------------------------------- */
        const statusSPJ = String(
            item.statusSPJ || "BELUM ADA"
        ).trim().toUpperCase();

        let statusSPJClass = "default";

        if (
            statusSPJ === "BELUM ADA" ||
            statusSPJ === "BELUM"
        ) {
            statusSPJClass = "belum";
        } else if (
            statusSPJ === "REVISI" ||
            statusSPJ === "PERLU REVISI"
        ) {
            statusSPJClass = "revisi";
        } else if (
            statusSPJ === "SELESAI" ||
            statusSPJ === "SUDAH SELESAI"
        ) {
            statusSPJClass = "selesai";
        } else if (
            statusSPJ === "DIPROSES" ||
            statusSPJ === "PROSES"
        ) {
            statusSPJClass = "proses";
        }

        /* ----------------------------------------------
           STATUS LOCK SPD
        ---------------------------------------------- */
        const terkunci = item.lockSPD === "TERKUNCI";

        const lockLabel = terkunci
            ? "Terkunci"
            : "Terbuka";

        const lockClass = terkunci
            ? "is-locked"
            : "is-unlocked";

        /* ----------------------------------------------
           DATA UTAMA
        ---------------------------------------------- */
        const id = String(item.idSPD || "");

        const idEscaped = smartofficeEscapeHTML(id);

        const nama = smartofficeEscapeHTML(
            item.nama || "-"
        );

        const nip = smartofficeEscapeHTML(
            item.nip || "-"
        );

        const kegiatan = smartofficeEscapeHTML(
            item.kegiatan || "-"
        );

        const lokasi = smartofficeEscapeHTML(
            item.lokasi || "-"
        );

        const tanggalBerangkat = smartofficeEscapeHTML(
            smartofficeFormatDate(item.tanggalBerangkat)
        );

        const tanggalPulang = smartofficeEscapeHTML(
            smartofficeFormatDate(item.tanggalPulang)
        );

        const jumlahHari = smartofficeEscapeHTML(
            item.jumlahHari || "-"
        );

        /* ----------------------------------------------
           LINK DOKUMEN
        ---------------------------------------------- */
        const safePdf = item.linkPdf
            ? smartofficeSafeHttpURL(item.linkPdf)
            : "";

        const safeBukti = item.buktiPembayaran
            ? smartofficeSafeHttpURL(item.buktiPembayaran)
            : "";

        /* ==================================================
           3. TEMPLATE KARTU
        ================================================== */
        return `
            <article
                class="smartoffice-pengelolaan-spd-card"
                data-spd-id="${idEscaped}"
                data-id-spd="${idEscaped}"
            >
                <!-- ======================================
                     HEADER KARTU
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-header">
                    <div class="smartoffice-pengelolaan-spd-card-header-left">
                        <!-- IKON DOKUMEN -->
                        <div class="smartoffice-pengelolaan-spd-card-icon">
                            ${smartofficeIcon("file-text")}
                        </div>

                        <!-- IDENTITAS SPD -->
                        <div class="smartoffice-pengelolaan-spd-card-heading">
                            <strong>
                                ${idEscaped || "ID SPD belum tersedia"}
                            </strong>

                            <span>
                                SPD PERJALANAN DINAS
                            </span>
                        </div>
                    </div>

                    <!-- STATUS SPD -->
                    <span class="
                        smartoffice-pengelolaan-spd-card-status
                        smartoffice-pengelolaan-spd-card-status-${statusClass}
                    ">
                        ${smartofficeEscapeHTML(statusSPD)}
                    </span>
                </div>

                <!-- ======================================
                     IDENTITAS PEGAWAI
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-person">
                    <strong>${nama}</strong>
                    <span>${nip}</span>
                </div>

                <!-- ======================================
                     KEGIATAN
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-section">
                    <span class="smartoffice-pengelolaan-spd-card-label">
                        KEGIATAN
                    </span>
                    <strong>${kegiatan}</strong>
                </div>

                <!-- ======================================
                     INFORMASI PERJALANAN
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-info-grid">
                    <div class="smartoffice-pengelolaan-spd-card-info-box">
                        <span>BERANGKAT</span>
                        <strong>${tanggalBerangkat}</strong>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-card-info-box">
                        <span>PULANG</span>
                        <strong>${tanggalPulang}</strong>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-card-info-box">
                        <span>DURASI</span>
                        <strong>${jumlahHari} hari</strong>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-card-info-box">
                        <span>STATUS LOCK</span>
                        <strong>${lockLabel}</strong>
                    </div>
                </div>

                <!-- ======================================
                     LOKASI
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-location">
                    <span>LOKASI</span>
                    <strong>${lokasi}</strong>
                </div>

                <!-- ======================================
                     DAFTAR PENGIKUT
                ======================================= -->
                ${
                    pengikut.length
                        ? `
                            <div class="smartoffice-pengelolaan-spd-card-followers">
                                <div class="smartoffice-pengelolaan-spd-card-label">
                                    PENGIKUT
                                </div>

                                <div class="smartoffice-pengelolaan-spd-card-followers-list">
                                    ${
                                        pengikut.map((namaPengikut, i) => `
                                            <div class="smartoffice-pengelolaan-spd-card-follower">
                                                <span class="smartoffice-pengelolaan-spd-card-follower-number">
                                                    ${i + 1}
                                                </span>
                                                <strong class="smartoffice-pengelolaan-spd-card-follower-name">
                                                    ${smartofficeEscapeHTML(namaPengikut)}
                                                </strong>
                                            </div>
                                        `).join("")
                                    }
                                </div>
                            </div>
                        `
                        : ""
                }

                <!-- ======================================
                     STATUS SPJ
                ======================================= -->
                <div class="smartoffice-pengelolaan-spd-card-spj">
                    <div class="smartoffice-pengelolaan-spd-card-spj-label">
                        <span>STATUS SPJ</span>
                        <strong class="
                            smartoffice-pengelolaan-spd-card-spj-status
                            smartoffice-pengelolaan-spd-card-spj-status-${statusSPJClass}
                        ">
                            ${smartofficeEscapeHTML(statusSPJ)}
                        </strong>
                    </div>
                </div>

                <!-- ======================================
                     CATATAN REVISI SPJ
                ======================================= -->
                ${
                    item.catatanRevisiSPJ
                        ? `
                            <div class="smartoffice-pengelolaan-spd-revision">
                                <strong>Catatan revisi SPJ</strong>
                                <p>
                                    ${smartofficeEscapeHTML(item.catatanRevisiSPJ)}
                                </p>
                            </div>
                        `
                        : ""
                }

                <!-- ======================================
                   FOOTER DAN ACTION SMARTSPD BLUD
                ====================================== -->
                <div class="smartoffice-pengelolaan-spd-card-footer">

                    <!-- TOMBOL DETAIL SPD -->
                    <button
                        type="button"
                        class="smartoffice-pengelolaan-spd-card-detail"
                        data-pengelolaan-action="detail"
                        data-id-spd="${idEscaped}"
                    >
                        ${smartofficeIcon("eye")}
                        <span>Detail SPD</span>
                    </button>

                    <!-- MENU TIGA TITIK -->
                    <button
                        type="button"
                        class="smartoffice-pengelolaan-spd-card-more"
                        data-pengelolaan-action="toggle-menu"
                        data-id-spd="${idEscaped}"
                        aria-label="Menu SPD"
                        aria-haspopup="menu"
                    >
                        ${smartofficeIcon("ellipsis")}
                    </button>

                </div>
            </article>
        `;
    }).join("");
}

/* ======================================================
   FILTERS — PENGELOLAAN SPD
====================================================== */

/* ======================================================
   1. INIT FILTERS
   Listener dikelola oleh smartofficeInitPengelolaanSPDEvents()
====================================================== */
function smartofficeInitPengelolaanSPDFilters() {
    // Listener dipasang terpusat oleh fungsi event halaman.
}

/* ======================================================
   2. TERAPKAN FILTER SPD
====================================================== */
function smartofficeApplyPengelolaanSPDFilters() {

    /* ----------------------------------------------
       AMBIL NILAI FILTER
    ---------------------------------------------- */
    const value = id => {
        return document.getElementById(id)?.value || "";
    };

    const keyword = value(
        "smartofficePengelolaanSPDSearch"
    ).trim().toLowerCase();

    const month = value(
        "smartofficePengelolaanSPDMonth"
    );

    const year = value(
        "smartofficePengelolaanSPDYear"
    );

    const status = value(
        "smartofficePengelolaanSPDStatus"
    ).toUpperCase();

    const spj = value(
        "smartofficePengelolaanSPDSPJ"
    ).toUpperCase();

    /* ----------------------------------------------
       FILTER DATA SPD
    ---------------------------------------------- */
    const filtered = smartofficePengelolaanSPDData.filter(item => {

        // Data yang digunakan untuk pencarian
        const searchable = [
            item.idSPD,
            item.nama,
            item.nip,
            item.kegiatan,
            item.lokasi
        ]
            .join(" ")
            .toLowerCase();

        // Filter pencarian
        if (
            keyword &&
            !searchable.includes(keyword)
        ) {
            return false;
        }

        // Ambil tanggal keberangkatan
        const date = smartofficeParseDate(
            item.tanggalBerangkat
        );

        // Filter tahun
        if (
            date &&
            year &&
            String(date.getFullYear()) !== year
        ) {
            return false;
        }

        // Filter bulan
        if (
            date &&
            month &&
            String(date.getMonth() + 1) !== String(Number(month))
        ) {
            return false;
        }

        // Filter status SPD
        if (
            status &&
            item.statusSPD !== status
        ) {
            return false;
        }

        // Filter status SPJ
        if (
            spj &&
            item.statusSPJ !== spj
        ) {
            return false;
        }

        return true;
    });

    /* ----------------------------------------------
       RENDER HASIL FILTER
    ---------------------------------------------- */
    smartofficeRenderPengelolaanSPDList(filtered);

}

/* ======================================================
   3. ISI DROPDOWN BULAN DAN TAHUN
   Pilihan dibuat berdasarkan data SPD yang tersedia
====================================================== */
function smartofficePopulatePengelolaanSPDFilters() {

    /* ----------------------------------------------
       AMBIL ELEMEN DROPDOWN
    ---------------------------------------------- */
    const monthSelect = document.getElementById(
        "smartofficePengelolaanSPDMonth"
    );

    const yearSelect = document.getElementById(
        "smartofficePengelolaanSPDYear"
    );

    /* ----------------------------------------------
       SIMPAN PILIHAN SEBELUM DIPERBARUI
    ---------------------------------------------- */
    const selectedMonth = monthSelect?.value || "";
    const selectedYear = yearSelect?.value || "";

    /* ----------------------------------------------
       KUMPULKAN TANGGAL SPD
    ---------------------------------------------- */
    const dates = smartofficePengelolaanSPDData
        .map(item => {
            return smartofficeParseDate(
                item.tanggalBerangkat
            );
        })
        .filter(Boolean);

    /* ----------------------------------------------
       BUAT DAFTAR BULAN DAN TAHUN UNIK
    ---------------------------------------------- */
    const months = [
        ...new Set(
            dates.map(date => date.getMonth() + 1)
        )
    ].sort((a, b) => a - b);

    const years = [
        ...new Set(
            dates.map(date => date.getFullYear())
        )
    ].sort((a, b) => b - a);

    /* ----------------------------------------------
       NAMA BULAN
    ---------------------------------------------- */
    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    /* ==================================================
       4. DROPDOWN BULAN
    ================================================== */
    if (monthSelect) {
        monthSelect.innerHTML =
            '<option value="">Semua Bulan</option>' +

            months.map(month => {
                return `
                    <option value="${month}">
                        ${monthNames[month - 1]}
                    </option>
                `;
            }).join("");

        // Pertahankan pilihan jika masih tersedia
        monthSelect.value = months.includes(
            Number(selectedMonth)
        )
            ? selectedMonth
            : "";
    }

    /* ==================================================
       5. DROPDOWN TAHUN
    ================================================== */
    if (yearSelect) {
        yearSelect.innerHTML =
            '<option value="">Semua Tahun</option>' +

            years.map(year => {
                return `
                    <option value="${year}">
                        ${year}
                    </option>
                `;
            }).join("");

        // Pertahankan pilihan jika masih tersedia
        yearSelect.value = years.includes(
            Number(selectedYear)
        )
            ? selectedYear
            : "";
    }
}

/* ======================================================
   ACTIONS — PENGELOLAAN SPD
====================================================== */

/* ======================================================
   1. HANDLER AKSI SPD
   Mengarahkan aksi ke fungsi masing-masing
====================================================== */
async function smartofficePengelolaanSPDHandleAction(
    action,
    item
) {

    // Buka menu tindakan
    if (action === "toggle-menu") {
        smartofficePengelolaanSPDShowActionMenu(item);
        return;
    }

    // Tampilkan detail SPD
    if (action === "detail") {
        smartofficePengelolaanSPDShowDetail(item);
        return;
    }

    // Buka lock SPD
    if (action === "unlock") {
        await smartofficePengelolaanSPDUnlock(item);
        return;
    }

    // Verifikasi SPJ
    if (action === "verify-spj") {
        smartofficePengelolaanSPDVerifySPJ(item);
        return;
    }

    // Tampilkan bukti pembayaran
    if (action === "payment") {
        smartofficePengelolaanSPDShowPayment(item);
        return;
    }
}

/* ======================================================
   TAMPILKAN MENU AKSI SPD
   POLA POSISI DAN STRUKTUR MENGIKUTI SMARTSPD BLUD
====================================================== */
function smartofficePengelolaanSPDShowActionMenu(item) {
    if (!item) return;

    smartofficePengelolaanSPDCloseActionMenu();

    const session = smartofficeGetSession();

    if (!session) return;

    const role = String(session.role || "")
        .trim()
        .toUpperCase();

    const allowed = [
        "ADMIN",
        "PJ",
        "SUPERADMIN"
    ].includes(role);

    const lockSPD = String(
        item.raw?.["LOCK_SPD"] || item.lockSPD || ""
    )
        .trim()
        .toUpperCase();

    const isLocked = lockSPD === "TERKUNCI";

    const menuItems = [
        {
            action: "detail",
            icon: smartofficeIcon("eye"),
            label: "Detail SPD"
        }
    ];

    if (allowed && isLocked) {
        menuItems.push({
            action: "unlock",
            icon: smartofficeIcon("lock-open"),
            label: "Buka Lock SPD"
        });
    }

    if (allowed) {
        menuItems.push({
            action: "verify-spj",
            icon: smartofficeIcon("clipboard-check"),
            label: "Verifikasi SPJ"
        });
    }

    menuItems.push({
        action: "payment",
        icon: smartofficeIcon("receipt"),
        label: "Bukti Pembayaran"
    });

    /* ----------------------------------------------
       BUAT MENU
    ---------------------------------------------- */
    const menu = document.createElement("div");

    menu.className =
        "smartoffice-pengelolaan-spd-action-menu";

    menu.setAttribute("role", "menu");
    menu.dataset.idSpd = String(item.idSPD || "");

    menu.innerHTML = menuItems.map(menuItem => `
        <button
            type="button"
            class="smartoffice-pengelolaan-spd-action-menu-item"
            role="menuitem"
            data-menu-action="${menuItem.action}"
        >
            <span class="smartoffice-pengelolaan-spd-action-menu-icon">
                ${menuItem.icon}
            </span>

            <span>${smartofficeEscapeHTML(menuItem.label)}</span>
        </button>
    `).join("");

    document.body.appendChild(menu);
    smartofficePengelolaanSPDModal = menu;

    /* ----------------------------------------------
       POSISI MENU — MENGIKUTI SMARTSPD BLUD
    ---------------------------------------------- */
    const button = document.querySelector(
        `.smartoffice-pengelolaan-spd-card[data-spd-id="${CSS.escape(String(item.idSPD || ""))}"] [data-pengelolaan-action="toggle-menu"]`
    );

    if (button) {
        const buttonRect = button.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const margin = 8;

        let top = buttonRect.bottom + margin;
        let left = buttonRect.right - menuRect.width;

        if (left + menuRect.width > window.innerWidth - margin) {
            left = window.innerWidth - menuRect.width - margin;
        }

        if (left < margin) {
            left = margin;
        }

        if (top + menuRect.height > window.innerHeight - margin) {
            top = buttonRect.top - menuRect.height - margin;
        }

        if (top < margin) {
            top = margin;
        }

        menu.style.position = "fixed";
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        menu.style.zIndex = "9999";
    }

    /* ----------------------------------------------
       EVENT AKSI
    ---------------------------------------------- */
    menu.addEventListener("click", event => {
        const actionButton = event.target.closest(
            "[data-menu-action]"
        );

        if (!actionButton) return;

        event.preventDefault();
        event.stopPropagation();

        const action = actionButton.dataset.menuAction;

        smartofficePengelolaanSPDCloseActionMenu();
        smartofficePengelolaanSPDHandleAction(
            action,
            item
        );
    });

    /* ----------------------------------------------
       TUTUP SAAT KLIK DI LUAR
    ---------------------------------------------- */
    const outside = event => {
        const clickedMenu = menu.contains(event.target);

        const clickedToggle = event.target.closest(
            '[data-pengelolaan-action="toggle-menu"]'
        );

        if (!clickedMenu && !clickedToggle) {
            smartofficePengelolaanSPDCloseActionMenu();

            document.removeEventListener(
                "click",
                outside,
                true
            );
        }
    };

    setTimeout(() => {
        document.addEventListener("click", outside, true);
    }, 0);
}


/* ======================================================
   TUTUP MENU AKSI SPD
====================================================== */
function smartofficePengelolaanSPDCloseActionMenu() {
    const menu = smartofficePengelolaanSPDModal;

    if (
        menu?.classList.contains(
            "smartoffice-pengelolaan-spd-action-menu"
        )
    ) {
        menu.remove();
        smartofficePengelolaanSPDModal = null;
    }
}


/* ======================================================
   BUKA LOCK SPD
====================================================== */
async function smartofficePengelolaanSPDUnlock(item) {
    const session = smartofficeGetSession();
    const role = String(session?.role || "")
        .trim()
        .toUpperCase();

    // Validasi hak akses
    if (
        !session ||
        !["ADMIN", "PJ", "SUPERADMIN"].includes(role)
    ) {
        smartofficeShowToast(
            "Anda tidak memiliki hak membuka lock SPD.",
            "error"
        );
        return;
    }

    // Konten konfirmasi
    const content = `
        <div
            class="smartoffice-pengelolaan-spd-modal-backdrop"
            data-modal-dismiss
        >
            <section
                class="smartoffice-pengelolaan-spd-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pengelolaanSpdModalTitle"
            >
                <div class="smartoffice-pengelolaan-spd-modal-icon">
                    ${smartofficeIcon("lock-open")}
                </div>

                <h3 id="pengelolaanSpdModalTitle">
                    Buka Lock SPD
                </h3>

                <p>
                    Anda akan membuka lock untuk SPD
                    <strong>
                        ${smartofficeEscapeHTML(item.idSPD)}
                    </strong>.
                    Petugas utama dapat mengedit SPD kembali.
                </p>

                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    <button
                        type="button"
                        class="secondary"
                        data-modal-cancel
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        class="primary"
                        data-modal-confirm
                    >
                        Buka Lock
                    </button>
                </div>
            </section>
        </div>
    `;

    const root = smartofficePengelolaanSPDOpenModal(content);

    // Tombol batal
    root
        .querySelector("[data-modal-cancel]")
        ?.addEventListener(
            "click",
            smartofficePengelolaanSPDCloseModal
        );

    // Tutup modal ketika backdrop diklik
    root
        .querySelector("[data-modal-dismiss]")
        ?.addEventListener("click", event => {
            if (event.target === event.currentTarget) {
                smartofficePengelolaanSPDCloseModal();
            }
        });

    // Proses membuka lock
    root
        .querySelector("[data-modal-confirm]")
        ?.addEventListener("click", async event => {
            const button = event.currentTarget;

            button.disabled = true;
            button.textContent = "Memproses...";

            try {
                const result = await smartofficeUnlockSPDService({
                    idSPD: item.idSPD,
                    role,
                    reviewer: session.nama || "",
                    reviewerNip: session.nip || ""
                });

                if (!result || result.success !== true) {
                    throw new Error(
                        result?.message ||
                        "Gagal membuka lock SPD."
                    );
                }

                smartofficePengelolaanSPDCloseModal();
                smartofficeShowToast(
                    result.message || "Lock SPD berhasil dibuka.",
                    "success"
                );

                await smartofficeLoadPengelolaanSPDData(
                    smartofficePengelolaanSPDInstance
                );
            } catch (error) {
                console.error(
                    "PENGELOLAAN SPD UNLOCK:",
                    error
                );

                smartofficeShowToast(
                    error?.message || "Gagal membuka lock SPD.",
                    "error"
                );

                button.disabled = false;
                button.textContent = "Buka Lock";
            }
        });
}


/* ======================================================
   VERIFIKASI SPJ
====================================================== */
function smartofficePengelolaanSPDVerifySPJ(item) {
    const session = smartofficeGetSession();
    const role = String(session?.role || "")
        .trim()
        .toUpperCase();

    // Validasi hak akses
    if (
        !session ||
        !["ADMIN", "PJ", "SUPERADMIN"].includes(role)
    ) {
        smartofficeShowToast(
            "Anda tidak memiliki hak verifikasi SPJ.",
            "error"
        );
        return;
    }

    // Konten modal verifikasi
    const content = `
        <div
            class="smartoffice-pengelolaan-spd-modal-backdrop"
            data-modal-dismiss
        >
            <section
                class="smartoffice-pengelolaan-spd-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pengelolaanSpdModalTitle"
            >
                <div class="smartoffice-pengelolaan-spd-modal-icon">
                    ${smartofficeIcon("clipboard-check")}
                </div>

                <h3 id="pengelolaanSpdModalTitle">
                    Verifikasi SPJ
                </h3>

                <p>
                    SPD
                    <strong>
                        ${smartofficeEscapeHTML(item.idSPD)}
                    </strong>
                    · ${smartofficeEscapeHTML(item.nama)}
                </p>

                <label for="pengelolaanSpdStatusSPJ">
                    Keputusan verifikasi
                </label>

                <select id="pengelolaanSpdStatusSPJ">
                    <option value="REVISI">
                        REVISI — perlu perbaikan
                    </option>

                    <option value="SELESAI">
                        SELESAI — SPJ lengkap
                    </option>
                </select>

                <label for="pengelolaanSpdCatatanSPJ">
                    Catatan revisi
                    <span>(wajib jika memilih REVISI)</span>
                </label>

                <textarea
                    id="pengelolaanSpdCatatanSPJ"
                    rows="3"
                    placeholder="Tuliskan alasan revisi secara jelas"
                ></textarea>

                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    <button
                        type="button"
                        class="secondary"
                        data-modal-cancel
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        class="primary"
                        data-modal-confirm
                    >
                        Simpan Verifikasi
                    </button>
                </div>
            </section>
        </div>
    `;

    const root = smartofficePengelolaanSPDOpenModal(content);

    const statusSelect = root.querySelector(
        "#pengelolaanSpdStatusSPJ"
    );

    const notes = root.querySelector(
        "#pengelolaanSpdCatatanSPJ"
    );

    // Catatan hanya aktif jika status REVISI
    const updateNotes = () => {
        notes.disabled = statusSelect.value !== "REVISI";

        if (notes.disabled) {
            notes.value = "";
        }
    };

    statusSelect.addEventListener("change", updateNotes);
    updateNotes();

    // Tombol batal
    root
        .querySelector("[data-modal-cancel]")
        ?.addEventListener(
            "click",
            smartofficePengelolaanSPDCloseModal
        );

    // Tutup modal ketika backdrop diklik
    root
        .querySelector("[data-modal-dismiss]")
        ?.addEventListener("click", event => {
            if (event.target === event.currentTarget) {
                smartofficePengelolaanSPDCloseModal();
            }
        });

    // Simpan hasil verifikasi
    root
        .querySelector("[data-modal-confirm]")
        ?.addEventListener("click", async event => {
            const button = event.currentTarget;
            const status = statusSelect.value;
            const catatan = notes.value.trim();

            // Catatan wajib untuk revisi
            if (status === "REVISI" && !catatan) {
                smartofficeShowToast(
                    "Alasan revisi SPJ wajib diisi.",
                    "error"
                );

                notes.focus();
                return;
            }

            button.disabled = true;
            button.textContent = "Menyimpan...";

            try {
                const result = await smartofficeVerifySPJService({
                    idSPD: item.idSPD,
                    status,
                    catatan,
                    role,
                    reviewer: session.nama || "",
                    reviewerNip: session.nip || ""
                });

                if (!result || result.success !== true) {
                    throw new Error(
                        result?.message || "Verifikasi SPJ gagal."
                    );
                }

                smartofficePengelolaanSPDCloseModal();
                smartofficeShowToast(
                    result.message ||
                    "Status SPJ berhasil diperbarui.",
                    "success"
                );

                await smartofficeLoadPengelolaanSPDData(
                    smartofficePengelolaanSPDInstance
                );
            } catch (error) {
                console.error(
                    "PENGELOLAAN SPD VERIFY SPJ:",
                    error
                );

                smartofficeShowToast(
                    error?.message || "Verifikasi SPJ gagal.",
                    "error"
                );

                button.disabled = false;
                button.textContent = "Simpan Verifikasi";
            }
        });
}


/* ======================================================
   DETAIL / PAYMENT
====================================================== */

/* ======================================================
   DETAIL SPD — MENGIKUTI SMARTSPD BLUD
====================================================== */

function smartofficePengelolaanSPDShowDetail(item) {
    if (!item) return;

    const raw = item.raw && typeof item.raw === "object"
        ? item.raw
        : {};

    // Ambil data dari item terlebih dahulu, lalu raw.
    const get = (key, fallback = "—") => {
        const value = raw[key];

        return value === null ||
            value === undefined ||
            String(value).trim() === ""
            ? fallback
            : String(value).trim();
    };

    const first = (...values) => {
        const value = values.find(v =>
            v !== null &&
            v !== undefined &&
            String(v).trim() !== ""
        );

        return value === undefined ? "—" : String(value).trim();
    };

    const idSPD = first(item.idSPD, get("ID SPD", ""));
    const nama = first(item.nama, get("Nama", ""));
    const nip = first(item.nip, get("NIP / NRP", ""));
    const kegiatan = first(item.kegiatan, get("Kegiatan", ""));
    const lokasi = first(item.lokasi, get("Lokasi", ""));
    const tanggalBerangkat = first(
        item.tanggalBerangkat,
        get("Tanggal Berangkat", "")
    );
    const tanggalPulang = first(
        item.tanggalPulang,
        get("Tanggal Pulang", "")
    );
    const jumlahHari = first(
        item.jumlahHari,
        get("Jumlah Hari", "")
    );
    const statusSPD = first(
        item.statusSPD,
        get("STATUS_SPD", "")
    );
    const statusSPJ = first(
        item.statusSPJ,
        get("STATUS_SPJ", "BELUM ADA")
    );
    const lockSPD = get("LOCK_SPD", first(item.lockSPD, "TERBUKA"));

    const linkPDF = first(
        item.linkPdf,
        get("LINK_PDF_SPD", "")
    );

    const lampiranAjuan = get("LAMPIRAN_AJUAN_URL", "");
    const buktiTransfer = first(
        item.buktiPembayaran,
        get("BUKTI_TRANSFER_URL", "")
    );

    // Escape menggunakan helper yang sudah tersedia di Pengelolaan SPD.
    const escape = value =>
        smartofficeEscapeHTML(value ?? "");

    const valueHtml = (label, value) => `
        <div class="smartoffice-pengelolaan-spd-detail-view-field">
            <span>${escape(label)}</span>
            <strong>${escape(value || "—")}</strong>
        </div>
    `;

    const linkHtml = (label, url, text) => {
        const safeUrl = smartofficeSafeHttpURL(url);

        if (!safeUrl) {
            return valueHtml(label, "—");
        }

        return `
            <div class="smartoffice-pengelolaan-spd-detail-view-field">
                <span>${escape(label)}</span>
                <a
                    class="smartoffice-pengelolaan-spd-detail-view-link"
                    href="${escape(safeUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >${escape(text)}</a>
            </div>
        `;
    };

    // Status badge SPD
    const normalizedStatus = statusSPD.toUpperCase();

    const statusSPDClass = {
        "MENUNGGU REVIEW": "waiting",
        "DISETUJUI": "approved",
        "DITOLAK": "rejected",
        "REVISI": "revision"
    }[normalizedStatus] || "default";

    // Status badge SPJ
    const normalizedSPJ = statusSPJ.toUpperCase();

    let statusSPJClass = "belum";

    if (normalizedSPJ === "DIPROSES") {
        statusSPJClass = "proses";
    } else if (
        normalizedSPJ === "REVISI" ||
        normalizedSPJ === "PERLU REVISI"
    ) {
        statusSPJClass = "revisi";
    } else if (
        normalizedSPJ === "SELESAI" ||
        normalizedSPJ === "SUDAH SELESAI"
    ) {
        statusSPJClass = "selesai";
    }

    const lockClass = lockSPD.toUpperCase() === "TERKUNCI"
        ? "locked"
        : "open";

    // Identifikasi pengikut
    const followers = [];

    for (let i = 1; i <= 4; i++) {
        const follower = {
            nomor: i,
            nama: get(`Nama Pengikut ${i}`, ""),
            nip: get(`NIP/NRP Pengikut ${i}`, ""),
            tanggalLahir: get(`Tgl Lahir ${i}`, ""),
            noWA: get(`No_WA Pengikut ${i}`, "")
        };

        if (
            follower.nama ||
            follower.nip ||
            follower.tanggalLahir ||
            follower.noWA
        ) {
            followers.push(follower);
        }
    }

    const followersHtml = followers.length
        ? followers.map(follower => `
            <div class="smartoffice-pengelolaan-spd-detail-view-follower">
                <div class="smartoffice-pengelolaan-spd-detail-view-follower-number">
                    ${follower.nomor}
                </div>

                <div class="smartoffice-pengelolaan-spd-detail-view-follower-info">
                    <strong>${escape(follower.nama || "—")}</strong>
                    <span>NIP/NRP: ${escape(follower.nip || "—")}</span>
                    <span>Tgl Lahir: ${escape(follower.tanggalLahir || "—")}</span>
                    <span>No. WA: ${escape(follower.noWA || "—")}</span>
                </div>
            </div>
        `).join("")
        : `<div class="smartoffice-pengelolaan-spd-detail-view-empty">Tidak ada pengikut.</div>`;

    // Jadwal perjalanan
    const schedules = [];

    for (let i = 1; i <= 3; i++) {
        const berangkat = get(`Berangkat Hari ${i}`, "");
        const pulang = get(`Pulang Hari ${i}`, "");
        const lokasiHari = i === 1
            ? get("Lokasi", "")
            : get(`Lokasi Hari ${i}`, "");
        const tiba = i === 1
            ? ""
            : get(`Tiba Hari ${i}`, "");

        if (berangkat || pulang || lokasiHari || tiba) {
            schedules.push({
                hari: i,
                berangkat: berangkat || "—",
                pulang: pulang || "—",
                lokasi: lokasiHari || "—",
                tiba: tiba || "—"
            });
        }
    }

    const scheduleHtml = schedules.length
        ? schedules.map(schedule => `
            <div class="smartoffice-pengelolaan-spd-detail-view-schedule">
                <div class="smartoffice-pengelolaan-spd-detail-view-schedule-title">
                    HARI ${schedule.hari}
                </div>

                <div class="smartoffice-pengelolaan-spd-detail-view-schedule-grid">
                    ${valueHtml("Berangkat", schedule.berangkat)}
                    ${valueHtml("Pulang", schedule.pulang)}
                    ${valueHtml("Lokasi", schedule.lokasi)}
                    ${
                        schedule.hari > 1
                            ? valueHtml("Tiba", schedule.tiba)
                            : ""
                    }
                </div>
            </div>
        `).join("")
        : `<div class="smartoffice-pengelolaan-spd-detail-view-empty">Jadwal perjalanan belum tersedia.</div>`;

    // Hindari modal detail ganda.
    document.getElementById("smartofficeSPDDetailModal")?.remove();

    const modal = document.createElement("div");
    modal.id = "smartofficeSPDDetailModal";
    modal.className = "smartoffice-pengelolaan-spd-detail-view-modal";

    modal.innerHTML = `
        <div
            class="smartoffice-pengelolaan-spd-detail-view-backdrop"
            data-detail-close="true"
        ></div>

        <div
            class="smartoffice-pengelolaan-spd-detail-view-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smartofficeSPDDetailTitle"
        >
            <div class="smartoffice-pengelolaan-spd-detail-view-header">
                <div>
                    <span class="smartoffice-pengelolaan-spd-detail-view-eyebrow">
                        DETAIL SPD
                    </span>

                    <h2 id="smartofficeSPDDetailTitle">
                        ${escape(idSPD)}
                    </h2>

                    <p>SPD Perjalanan Dinas</p>
                </div>

                <button
                    type="button"
                    class="smartoffice-pengelolaan-spd-detail-view-close"
                    data-detail-close="true"
                    aria-label="Tutup"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="19"
                        height="19"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M18 6 6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="smartoffice-pengelolaan-spd-detail-view-status-row">
                <span class="smartoffice-pengelolaan-spd-detail-view-status smartoffice-pengelolaan-spd-detail-view-status-${statusSPDClass}">
                    ${escape(statusSPD)}
                </span>

                <span class="smartoffice-pengelolaan-spd-detail-view-lock smartoffice-pengelolaan-spd-detail-view-lock-${lockClass}">
                    LOCK: ${escape(lockSPD)}
                </span>
            </div>

            <div class="smartoffice-pengelolaan-spd-detail-view-body">

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>IDENTITAS PEGAWAI</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Nama", nama)}
                        ${valueHtml("NIP / NRP", nip)}
                        ${valueHtml("Pangkat & Golongan", get("Pangkat & Golongan"))}
                        ${valueHtml("Jabatan", get("Jabatan"))}
                        ${valueHtml("Email", get("Email"))}
                        ${valueHtml("No. WA", get("No_WA"))}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>DETAIL PERJALANAN</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Alat Angkut", get("Alat Angkut"))}
                        ${valueHtml("Kegiatan", kegiatan)}
                        ${valueHtml("Lokasi", lokasi)}
                        ${valueHtml("Tanggal SPD Dibuat", get("Tanggal SPD Dibuat"))}
                        ${valueHtml("Tanggal Berangkat", tanggalBerangkat)}
                        ${valueHtml("Tanggal Pulang", tanggalPulang)}
                        ${valueHtml("Jumlah Hari", jumlahHari)}
                        ${valueHtml("Tipe Perjalanan", get("Tipe Keberangkatan"))}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>JADWAL PERJALANAN</span>
                    </div>

                    ${scheduleHtml}
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>PENGIKUT</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-followers">
                        ${followersHtml}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>REVIEW SPD</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Reviewer", get("REVIEWER"))}
                        ${valueHtml("NIP Reviewer", get("REVIEWER_NIP"))}
                        ${valueHtml("Tanggal Review", get("TGL_REVIEW_SPD"))}
                        ${valueHtml("Tanggal Persetujuan", get("TGL_APPROVE_SPD"))}
                        ${valueHtml("Tanggal Revisi", get("TGL_REVISI_SPD"))}
                        ${valueHtml("Total Revisi", get("TOTAL_REVISI_SPD", "0"))}
                        ${valueHtml("Catatan Revisi", get("CATATAN_REVISI_SPD"))}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>DOKUMEN SPD</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${linkHtml("Lampiran Ajuan", lampiranAjuan, "Buka Lampiran")}
                        ${linkHtml("PDF SPD", linkPDF, "Buka PDF SPD")}
                        ${valueHtml("PDF Generated", get("PDF_GENERATED", "FALSE"))}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>SPJ</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Status SPJ", statusSPJ)}
                        ${valueHtml("Jumlah Uang", get("JUMLAH UANG"))}
                        ${valueHtml("Catatan Revisi SPJ", get("CATATAN_REVISI_SPJ"))}
                        ${valueHtml("Tanggal Update SPJ", get("TGL_UPDATE_SPJ"))}
                        ${valueHtml("Reminder SPJ", get("REMINDER_SPJ"))}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>PEMBAYARAN</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Tanggal Transfer", get("TGL_TRANSFER"))}
                        ${linkHtml("Bukti Pembayaran", buktiTransfer, "Buka Bukti Pembayaran")}
                    </div>
                </section>

                <section class="smartoffice-pengelolaan-spd-detail-view-section">
                    <div class="smartoffice-pengelolaan-spd-detail-view-section-title">
                        <span>INFORMASI SISTEM</span>
                    </div>

                    <div class="smartoffice-pengelolaan-spd-detail-view-grid">
                        ${valueHtml("Status Data", get("STATUS_DATA"))}
                        ${valueHtml("Lock SPD", lockSPD)}
                        ${valueHtml("Terakhir Diperbarui", get("LAST_UPDATE"))}
                    </div>
                </section>

            </div>

            <div class="smartoffice-pengelolaan-spd-detail-view-footer">
                <button
                    type="button"
                    class="smartoffice-pengelolaan-spd-detail-view-close"
                    data-detail-close="true"
                >
                    Tutup
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Tutup melalui tombol atau backdrop.
    modal.addEventListener("click", event => {
        if (event.target.closest("[data-detail-close='true']")) {
            modal.remove();
        }
    });

    // Tutup menggunakan Escape.
    const closeOnEscape = event => {
        if (
            event.key === "Escape" &&
            document.getElementById("smartofficeSPDDetailModal") === modal
        ) {
            modal.remove();
            document.removeEventListener("keydown", closeOnEscape);
        }
    };

    document.addEventListener("keydown", closeOnEscape);

    modal.querySelector(".smartoffice-pengelolaan-spd-detail-view-close")?.focus();
}



/* ======================================================
   MODAL INPUT PEMBAYARAN SPD BLUD
====================================================== */
function smartofficePengelolaanSPDShowPayment(item) {
    if (!item?.idSPD) {
        smartofficeShowToast("ID SPD tidak ditemukan.", "error");
        return;
    }

    const raw = item.raw || {};
    const escape = value => smartofficeEscapeHTML(String(value ?? ""));

    const uang = Number(
        item.jumlahUang ?? raw["JUMLAH UANG"] ?? 0
    );

    const jumlahPetugas = Number(
        item.jumlahPetugasDibayarkan ??
        raw["JUMLAH PETUGAS DIBAYARKAN"] ?? 0
    );

    const total = uang * jumlahPetugas;

    const tanggalTransfer = String(
        item.tglTransfer ?? raw["TGL_TRANSFER"] ?? ""
    ).slice(0, 10);

    const buktiTransfer =
        item.buktiTransfer ||
        raw["BUKTI_TRANSFER_URL"] ||
        "";

    const content = `
        <div class="smartoffice-pengelolaan-spd-modal-backdrop"
             data-modal-dismiss>
            <section class="smartoffice-pengelolaan-spd-modal wide"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="pengelolaanSpdPaymentTitle">

                <h3 id="pengelolaanSpdPaymentTitle">
                    Input Pembayaran
                </h3>

                <p class="smartoffice-pengelolaan-spd-modal-subtitle">
                    ${escape(item.idSPD)} · ${escape(item.nama || "")}
                </p>

                <label for="pengelolaanSpdPaymentUang">
                    Jumlah Uang per Orang (Rp)
                </label>
                <input id="pengelolaanSpdPaymentUang"
                       type="number" min="1" step="1"
                       value="${uang || ""}"
                       placeholder="Contoh: 170000"
                       required>

                <label for="pengelolaanSpdPaymentPetugas">
                    Jumlah Petugas Dibayarkan
                </label>
                <input id="pengelolaanSpdPaymentPetugas"
                       type="number" min="1" step="1"
                       value="${jumlahPetugas || ""}"
                       placeholder="Masukkan jumlah petugas"
                       required>

                <div class="smartoffice-pengelolaan-spd-payment-total">
                    <span>Total Pembayaran</span>
                    <strong id="pengelolaanSpdPaymentTotal">
                        Rp${total.toLocaleString("id-ID")}
                    </strong>
                </div>

                <label for="pengelolaanSpdPaymentTanggal">
                    Tanggal Bayar / Transfer
                </label>
                <input id="pengelolaanSpdPaymentTanggal"
                       type="date"
                       value="${escape(tanggalTransfer)}"
                       required>

                <label for="pengelolaanSpdPaymentBukti">
                    Bukti Transfer
                </label>
                <input id="pengelolaanSpdPaymentBukti"
                       type="file"
                       accept=".pdf,.jpg,.jpeg,.png"
                       required>

                ${buktiTransfer ? `
                    <p class="smartoffice-pengelolaan-spd-payment-existing">
                        Bukti transfer sebelumnya sudah tersedia.
                        Pilih file baru hanya jika ingin menggantinya.
                    </p>
                ` : ""}

                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    <button type="button" class="secondary"
                            data-modal-cancel>
                        Batal
                    </button>
                    <button type="button" class="primary"
                            data-payment-save>
                        Simpan Pembayaran
                    </button>
                </div>
            </section>
        </div>
    `;

    const root = smartofficePengelolaanSPDOpenModal(content);

    const uangInput = root.querySelector("#pengelolaanSpdPaymentUang");
    const petugasInput = root.querySelector("#pengelolaanSpdPaymentPetugas");
    const totalOutput = root.querySelector("#pengelolaanSpdPaymentTotal");
    const fileInput = root.querySelector("#pengelolaanSpdPaymentBukti");

    function updateTotal() {
        const jumlahUang = Number(uangInput.value) || 0;
        const jumlahOrang = Number(petugasInput.value) || 0;

        totalOutput.textContent =
            "Rp" + (jumlahUang * jumlahOrang).toLocaleString("id-ID");
    }

    uangInput.addEventListener("input", updateTotal);
    petugasInput.addEventListener("input", updateTotal);

    root.querySelector("[data-modal-cancel]")
        ?.addEventListener("click", smartofficePengelolaanSPDCloseModal);

    root.querySelector("[data-modal-dismiss]")
        ?.addEventListener("click", event => {
            if (event.target === event.currentTarget) {
                smartofficePengelolaanSPDCloseModal();
            }
        });

    root.querySelector("[data-payment-save]")
        ?.addEventListener("click", async event => {
            const button = event.currentTarget;
            const jumlahUang = Number(uangInput.value);
            const jumlahPetugasDibayarkan = Number(petugasInput.value);
            const tglTransfer = root.querySelector(
                "#pengelolaanSpdPaymentTanggal"
            ).value;
            const file = fileInput.files[0];

            if (!Number.isFinite(jumlahUang) || jumlahUang <= 0) {
                smartofficeShowToast(
                    "Jumlah uang per orang harus lebih dari nol.",
                    "error"
                );
                uangInput.focus();
                return;
            }

            if (!Number.isInteger(jumlahPetugasDibayarkan) ||
                jumlahPetugasDibayarkan <= 0) {
                smartofficeShowToast(
                    "Jumlah petugas dibayarkan harus diisi.",
                    "error"
                );
                petugasInput.focus();
                return;
            }

            if (!tglTransfer) {
                smartofficeShowToast(
                    "Tanggal transfer wajib diisi.",
                    "error"
                );
                return;
            }

            if (!file && !buktiTransfer) {
                smartofficeShowToast(
                    "Silakan pilih file bukti transfer.",
                    "error"
                );
                fileInput.focus();
                return;
            }

            if (file && ![
                "application/pdf",
                "image/jpeg",
                "image/png"
            ].includes(file.type)) {
                smartofficeShowToast(
                    "File harus berupa PDF, JPG, atau PNG.",
                    "error"
                );
                return;
            }

            // Batas ukuran file 10 MB.
            if (file && file.size > 10 * 1024 * 1024) {
                smartofficeShowToast(
                    "Ukuran file maksimal 10 MB.",
                    "error"
                );
                return;
            }

            /*
             * Integrasi penyimpanan:
             * Upload file ke Drive, lalu simpan:
             * JUMLAH UANG, TGL_TRANSFER,
             * BUKTI_TRANSFER_URL, kolom BM dan BN.
             *
             * Belum memanggil backend karena nama fungsi
             * penyimpanan pembayaran perlu dicocokkan
             * dengan service GAS yang aktif.
             */
            smartofficeShowToast(
                "Modal siap. Integrasi penyimpanan GAS perlu disambungkan.",
                "warning"
            );
        });
}



/* ======================================================
   MODAL HELPERS
====================================================== */

/* ======================================================
   BUKA MODAL
====================================================== */
function smartofficePengelolaanSPDOpenModal(html) {
    // Tutup modal sebelumnya jika masih terbuka
    smartofficePengelolaanSPDCloseModal();

    // Buat elemen pembungkus modal
    const wrapper = document.createElement("div");

    wrapper.className =
        "smartoffice-pengelolaan-spd-modal-root";

    wrapper.innerHTML = html;

    // Tambahkan modal ke halaman
    document.body.appendChild(wrapper);

    smartofficePengelolaanSPDModal = wrapper;

    // Fokuskan elemen interaktif pertama
    const firstButton = wrapper.querySelector(
        "button, select, textarea"
    );

    firstButton?.focus();

    // Tutup modal menggunakan tombol Escape
    const esc = event => {
        if (event.key === "Escape") {
            smartofficePengelolaanSPDCloseModal();

            document.removeEventListener(
                "keydown",
                esc
            );
        }
    };

    document.addEventListener("keydown", esc);

    return wrapper;
}


/* ======================================================
   TUTUP MODAL
====================================================== */
function smartofficePengelolaanSPDCloseModal() {
    if (smartofficePengelolaanSPDModal) {
        smartofficePengelolaanSPDModal.remove();
        smartofficePengelolaanSPDModal = null;
    }
}


/* ======================================================
   HELPERS
====================================================== */

/* ======================================================
   PARSE TANGGAL
   Mendukung ISO, dd/mm/yyyy, dan tanggal Indonesia
====================================================== */

function smartofficeParseDate(value) {
    const text = String(value || "").trim();

    if (!text) {
        return null;
    }

    // ISO yyyy-mm-dd dan ISO timestamp
    let match = text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

    if (match) {
        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // Format dd/mm/yyyy
    match = text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (match) {
        const date = new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // Tanggal Indonesia, contoh: 7 Oktober 2026
    const months = {
        januari: 0,
        februari: 1,
        maret: 2,
        april: 3,
        mei: 4,
        juni: 5,
        juli: 6,
        agustus: 7,
        september: 8,
        oktober: 9,
        november: 10,
        desember: 11
    };

    match = text
        .toLowerCase()
        .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);

    if (match && months[match[2]] !== undefined) {
        const date = new Date(
            Number(match[3]),
            months[match[2]],
            Number(match[1])
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    return null;
}


/* ======================================================
   FORMAT TANGGAL
====================================================== */
function smartofficeFormatDate(value) {
    const date = smartofficeParseDate(value);

    if (!date) {
        return value || "—";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}


/* ======================================================
   ESCAPE HTML
====================================================== */
function smartofficeEscapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ======================================================
   VALIDASI URL HTTP / HTTPS
====================================================== */
function smartofficeSafeHttpURL(value) {
    try {
        const url = new URL(String(value || ""));

        return ["https:", "http:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}


/* ======================================================
   SLUG
====================================================== */
function smartofficeSlug(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}


/* ======================================================
   ICON SVG
====================================================== */
function smartofficeIcon(name) {
    const paths = {
        "file-text": `
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M8 13h8"/>
            <path d="M8 17h6"/>
        `,

        "calendar-days": `
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
        `,

        "calendar-check": `
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18M9 15l2 2 4-4"/>
        `,

        "calendar-range": `
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18M7 14h3M7 17h7"/>
        `,

        "clock-3": `
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
        `,

        "circle-check": `
            <circle cx="12" cy="12" r="10"/>
            <path d="m8 12 3 3 5-6"/>
        `,

        "file-search": `
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8"/>
            <path d="M14 2v6h6"/>
            <circle cx="16" cy="16" r="3"/>
            <path d="m18.5 18.5 2 2"/>
        `,

        "ellipsis": `
            <circle cx="5" cy="12" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
        `,

        "eye": `
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
            <circle cx="12" cy="12" r="3"/>
        `,

        "lock-open": `
            <rect x="3" y="10" width="18" height="12" rx="2"/>
            <path d="M7 10V6a5 5 0 0 1 9.5-2"/>
        `,

        "clipboard-check": `
            <rect x="4" y="4" width="16" height="18" rx="2"/>
            <path d="M9 4V2h6v2M8 13l2 2 5-5"/>
        `,

        "receipt": `
            <path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2z"/>
            <path d="M8 9h8M8 13h8M8 17h4"/>
        `
    };

    return `
        <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            ${paths[name] || ""}
        </svg>
    `;
}
