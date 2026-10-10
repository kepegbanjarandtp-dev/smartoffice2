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

        // Tampilkan pesan kesalahan pada area daftar SPD.
        if (list) {
            list.innerHTML = `
                <div class="smartoffice-spd-riwayat-empty">
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
            <div class="smartoffice-spd-riwayat-card">

                <!-- HEADER KARTU -->
                <div class="smartoffice-spd-riwayat-header">
                    <div>
                        <strong>Pemantauan SPD</strong>
                        <span>
                            Ringkasan status seluruh perjalanan dinas
                        </span>
                    </div>
                </div>

                <!-- ISI KARTU -->
                <div class="smartoffice-spd-riwayat-body">

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
                <div class="smartoffice-spd-riwayat-footer">
                    <button
                        type="button"
                        class="smartoffice-pengelolaan-spd-link"
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
            <div class="smartoffice-spd-riwayat-empty">
                <div class="smartoffice-spd-riwayat-empty-icon">
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
                class="smartoffice-spd-riwayat-card smartoffice-pengelolaan-spd-card"
                data-spd-id="${idEscaped}"
                data-id-spd="${idEscaped}"
            >
                <!-- ======================================
                     HEADER KARTU
                ======================================= -->
                <div class="smartoffice-spd-riwayat-header">
                    <div class="smartoffice-spd-riwayat-header-left">
                        <!-- IKON DOKUMEN -->
                        <div class="smartoffice-spd-riwayat-icon">
                            ${smartofficeIcon("file-text")}
                        </div>

                        <!-- IDENTITAS SPD -->
                        <div class="smartoffice-spd-riwayat-heading">
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
                        smartoffice-spd-riwayat-status
                        smartoffice-spd-riwayat-status-${statusClass}
                    ">
                        ${smartofficeEscapeHTML(statusSPD)}
                    </span>
                </div>

                <!-- ======================================
                     IDENTITAS PEGAWAI
                ======================================= -->
                <div class="smartoffice-spd-riwayat-person">
                    <strong>${nama}</strong>
                    <span>${nip}</span>
                </div>

                <!-- ======================================
                     KEGIATAN
                ======================================= -->
                <div class="smartoffice-spd-riwayat-section">
                    <span class="smartoffice-spd-riwayat-label">
                        KEGIATAN
                    </span>
                    <strong>${kegiatan}</strong>
                </div>

                <!-- ======================================
                     INFORMASI PERJALANAN
                ======================================= -->
                <div class="smartoffice-spd-riwayat-info-grid">
                    <div class="smartoffice-spd-riwayat-info-box">
                        <span>BERANGKAT</span>
                        <strong>${tanggalBerangkat}</strong>
                    </div>

                    <div class="smartoffice-spd-riwayat-info-box">
                        <span>PULANG</span>
                        <strong>${tanggalPulang}</strong>
                    </div>

                    <div class="smartoffice-spd-riwayat-info-box">
                        <span>DURASI</span>
                        <strong>${jumlahHari} hari</strong>
                    </div>

                    <div class="smartoffice-spd-riwayat-info-box">
                        <span>STATUS LOCK</span>
                        <strong>${lockLabel}</strong>
                    </div>
                </div>

                <!-- ======================================
                     LOKASI
                ======================================= -->
                <div class="smartoffice-spd-riwayat-location">
                    <span>LOKASI</span>
                    <strong>${lokasi}</strong>
                </div>

                <!-- ======================================
                     DAFTAR PENGIKUT
                ======================================= -->
                ${
                    pengikut.length
                        ? `
                            <div class="smartoffice-spd-riwayat-followers">
                                <div class="smartoffice-spd-riwayat-label">
                                    PENGIKUT
                                </div>

                                <div class="smartoffice-spd-riwayat-followers-list">
                                    ${
                                        pengikut.map((namaPengikut, i) => `
                                            <div class="smartoffice-spd-riwayat-follower">
                                                <span class="smartoffice-spd-riwayat-follower-number">
                                                    ${i + 1}
                                                </span>
                                                <strong class="smartoffice-spd-riwayat-follower-name">
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
                <div class="smartoffice-spd-riwayat-spj">
                    <div class="smartoffice-spd-riwayat-spj-label">
                        <span>STATUS SPJ</span>
                        <strong class="
                            smartoffice-spd-riwayat-spj-status
                            smartoffice-spd-riwayat-spj-status-${statusSPJClass}
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
                <div class="smartoffice-spd-riwayat-footer">

                    <!-- TOMBOL DETAIL SPD -->
                    <button
                        type="button"
                        class="smartoffice-spd-riwayat-detail"
                        data-pengelolaan-action="detail"
                        data-id-spd="${idEscaped}"
                    >
                        ${smartofficeIcon("eye")}
                        <span>Detail SPD</span>
                    </button>

                    <!-- MENU TIGA TITIK -->
                    <button
                        type="button"
                        class="smartoffice-spd-riwayat-more"
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
   2. TAMPILKAN MENU AKSI SPD
====================================================== */
function smartofficePengelolaanSPDShowActionMenu(item) {

    /* ----------------------------------------------
       TUTUP MENU SEBELUMNYA
    ---------------------------------------------- */
    smartofficePengelolaanSPDCloseActionMenu();

    /* ----------------------------------------------
       PERIKSA ROLE PENGGUNA
    ---------------------------------------------- */
    const session = smartofficeGetSession();

    const role = String(
        session?.role || ""
    ).trim().toUpperCase();

    const allowed = [
        "ADMIN",
        "PJ",
        "SUPERADMIN"
    ].includes(role);

    /* ----------------------------------------------
       PERIKSA STATUS LOCK SPD
    ---------------------------------------------- */
    const isLocked = item.lockSPD === "TERKUNCI";

    /* ----------------------------------------------
       BUAT ELEMEN MENU
    ---------------------------------------------- */
    const menu = document.createElement("div");
    menu.className = "smartoffice-pengelolaan-spd-action-menu";
    menu.setAttribute("role", "menu");

    /* ----------------------------------------------
       ISI MENU BERDASARKAN HAK AKSES
    ---------------------------------------------- */
    menu.innerHTML = `

        <!-- DETAIL SPD -->
        <button
            type="button"
            role="menuitem"
            data-menu-action="detail"
        >
            ${smartofficeIcon("eye")}
            Detail SPD
        </button>

        <!-- BUKA LOCK SPD -->
        ${
            allowed && isLocked
                ? `
                    <button
                        type="button"
                        role="menuitem"
                        data-menu-action="unlock"
                    >
                        ${smartofficeIcon("lock-open")}
                        Buka Lock SPD
                    </button>
                `
                : ""
        }

        <!-- VERIFIKASI SPJ -->
        ${
            allowed
                ? `
                    <button
                        type="button"
                        role="menuitem"
                        data-menu-action="verify-spj"
                    >
                        ${smartofficeIcon("clipboard-check")}
                        Verifikasi SPJ
                    </button>
                `
                : ""
        }

        <!-- BUKTI PEMBAYARAN -->
        <button
            type="button"
            role="menuitem"
            data-menu-action="payment"
        >
            ${smartofficeIcon("receipt")}
            Bukti Pembayaran
        </button>
    `;

    /* ==================================================
       3. PASANG MENU KE HALAMAN
    ================================================== */
    document.body.appendChild(menu);
    smartofficePengelolaanSPDModal = menu;

    /* ==================================================
       4. TENTUKAN POSISI MENU
    ================================================== */
    const button = document.querySelector(
        `.smartoffice-pengelolaan-spd-card[data-spd-id="${CSS.escape(item.idSPD)}"] [data-pengelolaan-action="toggle-menu"]`
    );

    const rect = button?.getBoundingClientRect();

    if (rect) {
        menu.style.position = "fixed";
        menu.style.top = `${
            Math.min(
                rect.bottom + 6,
                window.innerHeight - menu.offsetHeight - 12
            )
        }px`;

        menu.style.left = `${
            Math.max(
                12,
                Math.min(
                    rect.right - menu.offsetWidth,
                    window.innerWidth - menu.offsetWidth - 12
                )
            )
        }px`;

        menu.style.zIndex = "9999";
    }

    /* ==================================================
       5. EVENT KLIK MENU
    ================================================== */
    menu.addEventListener("click", event => {

        const actionButton = event.target.closest(
            "[data-menu-action]"
        );

        if (!actionButton) return;

        // Ambil jenis aksi yang dipilih
        const action = actionButton.dataset.menuAction;

        // Tutup menu sebelum menjalankan aksi
        smartofficePengelolaanSPDCloseActionMenu();

        // Jalankan aksi SPD
        smartofficePengelolaanSPDHandleAction(
            action,
            item
        );
    });

    /* ==================================================
       6. TUTUP MENU SAAT KLIK DI LUAR
    ================================================== */
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

    // Pasang listener setelah event klik pembuka selesai
    setTimeout(() => {
        document.addEventListener(
            "click",
            outside,
            true
        );
    }, 0);
}

/* ======================================================
   7. TUTUP MENU AKSI SPD
====================================================== */
function smartofficePengelolaanSPDCloseActionMenu() {

    const menu = smartofficePengelolaanSPDModal;

    // Pastikan elemen yang ditutup adalah menu aksi
    if (
        menu?.classList.contains(
            "smartoffice-pengelolaan-spd-action-menu"
        )
    ) {
        menu.remove();
        smartofficePengelolaanSPDModal = null;
    }
}

async function smartofficePengelolaanSPDUnlock(item) {
    const session = smartofficeGetSession();
    const role = String(session?.role || "").trim().toUpperCase();
    if (!session || !["ADMIN", "PJ", "SUPERADMIN"].includes(role)) {
        smartofficeShowToast("Anda tidak memiliki hak membuka lock SPD.", "error");
        return;
    }
    const content = `
        <div class="smartoffice-pengelolaan-spd-modal-backdrop" data-modal-dismiss>
            <section class="smartoffice-pengelolaan-spd-modal" role="dialog" aria-modal="true" aria-labelledby="pengelolaanSpdModalTitle">
                <div class="smartoffice-pengelolaan-spd-modal-icon">${smartofficeIcon("lock-open")}</div>
                <h3 id="pengelolaanSpdModalTitle">Buka Lock SPD</h3>
                <p>Anda akan membuka lock untuk SPD <strong>${smartofficeEscapeHTML(item.idSPD)}</strong>. Petugas utama dapat mengedit SPD kembali.</p>
                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    <button type="button" class="secondary" data-modal-cancel>Batal</button>
                    <button type="button" class="primary" data-modal-confirm>Buka Lock</button>
                </div>
            </section>
        </div>`;
    const root = smartofficePengelolaanSPDOpenModal(content);
    root.querySelector("[data-modal-cancel]")?.addEventListener("click", smartofficePengelolaanSPDCloseModal);
    root.querySelector("[data-modal-dismiss]")?.addEventListener("click", event => {
        if (event.target === event.currentTarget) smartofficePengelolaanSPDCloseModal();
    });
    root.querySelector("[data-modal-confirm]")?.addEventListener("click", async event => {
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
            if (!result || result.success !== true) throw new Error(result?.message || "Gagal membuka lock SPD.");
            smartofficePengelolaanSPDCloseModal();
            smartofficeShowToast(result.message || "Lock SPD berhasil dibuka.", "success");
            await smartofficeLoadPengelolaanSPDData(smartofficePengelolaanSPDInstance);
        } catch (error) {
            console.error("PENGELOLAAN SPD UNLOCK:", error);
            smartofficeShowToast(error?.message || "Gagal membuka lock SPD.", "error");
            button.disabled = false;
            button.textContent = "Buka Lock";
        }
    });
}

function smartofficePengelolaanSPDVerifySPJ(item) {
    const session = smartofficeGetSession();
    const role = String(session?.role || "").trim().toUpperCase();
    if (!session || !["ADMIN", "PJ", "SUPERADMIN"].includes(role)) {
        smartofficeShowToast("Anda tidak memiliki hak verifikasi SPJ.", "error");
        return;
    }
    const content = `
        <div class="smartoffice-pengelolaan-spd-modal-backdrop" data-modal-dismiss>
            <section class="smartoffice-pengelolaan-spd-modal" role="dialog" aria-modal="true" aria-labelledby="pengelolaanSpdModalTitle">
                <div class="smartoffice-pengelolaan-spd-modal-icon">${smartofficeIcon("clipboard-check")}</div>
                <h3 id="pengelolaanSpdModalTitle">Verifikasi SPJ</h3>
                <p>SPD <strong>${smartofficeEscapeHTML(item.idSPD)}</strong> · ${smartofficeEscapeHTML(item.nama)}</p>
                <label for="pengelolaanSpdStatusSPJ">Keputusan verifikasi</label>
                <select id="pengelolaanSpdStatusSPJ">
                    <option value="REVISI">REVISI — perlu perbaikan</option>
                    <option value="SELESAI">SELESAI — SPJ lengkap</option>
                </select>
                <label for="pengelolaanSpdCatatanSPJ">Catatan revisi <span>(wajib jika memilih REVISI)</span></label>
                <textarea id="pengelolaanSpdCatatanSPJ" rows="3" placeholder="Tuliskan alasan revisi secara jelas"></textarea>
                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    <button type="button" class="secondary" data-modal-cancel>Batal</button>
                    <button type="button" class="primary" data-modal-confirm>Simpan Verifikasi</button>
                </div>
            </section>
        </div>`;
    const root = smartofficePengelolaanSPDOpenModal(content);
    const statusSelect = root.querySelector("#pengelolaanSpdStatusSPJ");
    const notes = root.querySelector("#pengelolaanSpdCatatanSPJ");
    const updateNotes = () => {
        notes.disabled = statusSelect.value !== "REVISI";
        if (notes.disabled) notes.value = "";
    };
    statusSelect.addEventListener("change", updateNotes);
    updateNotes();

    root.querySelector("[data-modal-cancel]")?.addEventListener("click", smartofficePengelolaanSPDCloseModal);
    root.querySelector("[data-modal-dismiss]")?.addEventListener("click", event => {
        if (event.target === event.currentTarget) smartofficePengelolaanSPDCloseModal();
    });
    root.querySelector("[data-modal-confirm]")?.addEventListener("click", async event => {
        const button = event.currentTarget;
        const status = statusSelect.value;
        const catatan = notes.value.trim();
        if (status === "REVISI" && !catatan) {
            smartofficeShowToast("Alasan revisi SPJ wajib diisi.", "error");
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
            if (!result || result.success !== true) throw new Error(result?.message || "Verifikasi SPJ gagal.");
            smartofficePengelolaanSPDCloseModal();
            smartofficeShowToast(result.message || "Status SPJ berhasil diperbarui.", "success");
            await smartofficeLoadPengelolaanSPDData(smartofficePengelolaanSPDInstance);
        } catch (error) {
            console.error("PENGELOLAAN SPD VERIFY SPJ:", error);
            smartofficeShowToast(error?.message || "Verifikasi SPJ gagal.", "error");
            button.disabled = false;
            button.textContent = "Simpan Verifikasi";
        }
    });
}

/* ========================= DETAIL / PAYMENT ========================= */

function smartofficePengelolaanSPDShowDetail(item) {
    const raw = item.raw || {};
    const fields = [
        ["ID SPD", item.idSPD], ["Nama", item.nama], ["NIP / NRP", item.nip],
        ["Kegiatan", item.kegiatan], ["Lokasi", item.lokasi],
        ["Tanggal Berangkat", item.tanggalBerangkat], ["Tanggal Pulang", item.tanggalPulang],
        ["Jumlah Hari", item.jumlahHari], ["Status SPD", item.statusSPD],
        ["Status SPJ", item.statusSPJ], ["Lock SPD", item.lockSPD || "—"],
        ["Catatan Revisi SPJ", item.catatanRevisiSPJ || "—"]
    ];
    const details = fields.map(([label, value]) => `
        <div class="smartoffice-pengelolaan-spd-detail-row">
            <span>${smartofficeEscapeHTML(label)}</span><strong>${smartofficeEscapeHTML(value || "—")}</strong>
        </div>`).join("");
    const content = `
        <div class="smartoffice-pengelolaan-spd-modal-backdrop" data-modal-dismiss>
            <section class="smartoffice-pengelolaan-spd-modal wide" role="dialog" aria-modal="true" aria-labelledby="pengelolaanSpdModalTitle">
                <h3 id="pengelolaanSpdModalTitle">Detail SPD</h3>
                <p class="smartoffice-pengelolaan-spd-modal-subtitle">${smartofficeEscapeHTML(item.idSPD)} · ${smartofficeEscapeHTML(item.nama)}</p>
                <div class="smartoffice-pengelolaan-spd-detail-grid">${details}</div>
                <div class="smartoffice-pengelolaan-spd-modal-actions">
                    ${item.linkPdf ? `<a class="primary" href="${smartofficeEscapeHTML(smartofficeSafeHttpURL(item.linkPdf))}" target="_blank" rel="noopener noreferrer">Buka PDF SPD</a>` : ""}
                    <button type="button" class="secondary" data-modal-cancel>Tutup</button>
                </div>
            </section>
        </div>`;
    const root = smartofficePengelolaanSPDOpenModal(content);
    root.querySelector("[data-modal-cancel]")?.addEventListener("click", smartofficePengelolaanSPDCloseModal);
    root.querySelector("[data-modal-dismiss]")?.addEventListener("click", event => {
        if (event.target === event.currentTarget) smartofficePengelolaanSPDCloseModal();
    });
}

function smartofficePengelolaanSPDShowPayment(item) {
    if (item.buktiPembayaran) {
        const url = smartofficeSafeHttpURL(item.buktiPembayaran);
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
            return;
        }
    }
    smartofficeShowToast(
        "Link bukti pembayaran belum tersedia pada field data SPD yang dikenali. Periksa nama field bukti pembayaran di Firestore.",
        "warning"
    );
}

/* ========================= MODAL HELPERS ========================= */

function smartofficePengelolaanSPDOpenModal(html) {
    smartofficePengelolaanSPDCloseModal();
    const wrapper = document.createElement("div");
    wrapper.className = "smartoffice-pengelolaan-spd-modal-root";
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    smartofficePengelolaanSPDModal = wrapper;
    const firstButton = wrapper.querySelector("button, select, textarea");
    firstButton?.focus();
    const esc = event => {
        if (event.key === "Escape") {
            smartofficePengelolaanSPDCloseModal();
            document.removeEventListener("keydown", esc);
        }
    };
    document.addEventListener("keydown", esc);
    return wrapper;
}

function smartofficePengelolaanSPDCloseModal() {
    if (smartofficePengelolaanSPDModal) {
        smartofficePengelolaanSPDModal.remove();
        smartofficePengelolaanSPDModal = null;
    }
}

/* ========================= HELPERS ========================= */

function smartofficeParseDate(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    // ISO yyyy-mm-dd and ISO timestamp
    let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return Number.isNaN(date.getTime()) ? null : date;
    }
    // dd/mm/yyyy
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        return Number.isNaN(date.getTime()) ? null : date;
    }
    // Indonesian written dates, e.g. "7 Oktober 2026"
    const months = {
        januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
        juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    };
    match = text.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (match && months[match[2]] !== undefined) {
        const date = new Date(Number(match[3]), months[match[2]], Number(match[1]));
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
}

function smartofficeFormatDate(value) {
    const date = smartofficeParseDate(value);
    if (!date) return value || "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit", month: "short", year: "numeric"
    }).format(date);
}

function smartofficeEscapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function smartofficeSafeHttpURL(value) {
    try {
        const url = new URL(String(value || ""));
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function smartofficeSlug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function smartofficeIcon(name) {
    const paths = {
        "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>',
        "calendar-days": '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        "calendar-check": '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 15l2 2 4-4"/>',
        "calendar-range": '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M7 14h3M7 17h7"/>',
        "clock-3": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
        "file-search": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8"/><path d="M14 2v6h6"/><circle cx="16" cy="16" r="3"/><path d="m18.5 18.5 2 2"/>',
        "ellipsis": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
        "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
        "lock-open": '<rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V6a5 5 0 0 1 9.5-2"/>',
        "clipboard-check": '<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4V2h6v2M8 13l2 2 5-5"/>',
        "receipt": '<path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2z"/><path d="M8 9h8M8 13h8M8 17h4"/>'
    };
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}
