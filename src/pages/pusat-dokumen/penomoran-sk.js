/* ======================================================
   PUSAT DOKUMEN
   PENOMORAN SK
====================================================== */

/* ======================================================
   IMPORT CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";

import {
    smartofficeApi
} from "../../core/api.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeOpenPreviewDokumen
} from "../../components/preview/preview.js";

import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading,
    smartofficeForceHideGlobalLoading
} from "../../components/loading/loading.js";

import {
    smartofficeGetAllSK,
    smartofficeGetSKMaster,
    smartofficePreviewNomorSK,
    smartofficeAddSKDraft,
    smartofficeBukaLockSK,
    smartofficeHapusSK
} from "../../services/penomoran-sk.service.js";

import {
    smartofficeGetSKByTahunFirestore,
    smartofficeClearSKFirestoreCache
} from "../../services/penomoran-sk-firestore.service.js";

import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";

import {
    smartofficeGetDriveFileId
} from "../../utils/drive.js";



/* ======================================================
   STATE
====================================================== */
let smartofficePusatDokumenDestroyed = false;

/* ======================================================
   STATE PENOMORAN SK
====================================================== */
let smartofficeSKAllData = [];
let smartofficeSKViewData = [];
let smartofficeSKLoaded = false;

/* ======================================================
   FILTER HANDLER
====================================================== */
let smartofficePenomoranSKSearchHandler = null;
let smartofficePenomoranSKNomorHandler = null;
let smartofficePenomoranSKTahunHandler = null;
let smartofficePenomoranSKKlasterHandler = null;
let smartofficePenomoranSKStatusHandler = null;
let smartofficePenomoranSKKlasifikasiOutsideClickHandler = null;
let smartofficePenomoranSKRefreshHandler = null;

/* ======================================================
   STATE FORM SK
====================================================== */
let smartofficeSKMaster =
    {
        klasifikasi: [],
        klaster: [],
        statusSK: []
    };
let smartofficeSKMasterLoaded =
    false;
let smartofficeSKFormMode =
    "add";
let smartofficeSKEditRowIndex =
    null;
let smartofficeSKEditNomorUrut =
    null;


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       RESET
    ========================= */
    smartofficePusatDokumenDestroyed =
        false;

    /* =========================
       CHECK SESSION
    ========================= */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* =========================
       SESSION
    ========================= */
    const sessionData =
        smartofficeGetSession();
    if(
        !sessionData
    ){
        await smartofficeLogout();
        return;
    }

    /* =========================
       NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "pusat-dokumen"
    );

    /* =========================
       INIT TAB
    ========================= */
    smartofficeInitPusatDokumenTab();

    /* =========================
       INIT FILTER SK
    ========================= */
    smartofficeInitFilterSKEvent();

    /* =========================
       INIT TAMBAH SK
    ========================= */
    smartofficeInitTambahSKEvent();

    /* =========================
       INIT PENOMORAN SK
    ========================= */
    await smartofficeInitPenomoranSK();
}


/* ======================================================
   INIT TAB PUSAT DOKUMEN
====================================================== */
function smartofficeInitPusatDokumenTab(){
    const tabButtons =
        document.querySelectorAll(
            ".smartoffice-tab-button"
        );
    if(
        !tabButtons.length
    ){
        return;
    }

    /* =========================
       TAB DATA
    ========================= */
    const tabData = {
        "penomoran-sk": {
            title:
                "Penomoran SK",

            description:
                "Pengelolaan dan penomoran Surat Keputusan"
        },

        "penomoran-sop": {
            title:
                "Penomoran SOP",

            description:
                "Pengelolaan dan penomoran Standar Operasional Prosedur"
        },

        "template-dokumen": {
            title:
                "Template Dokumen",

            description:
                "Pusat template dokumen yang dapat digunakan"
        },

        "arsip-puskesmas": {
            title:
                "Arsip Puskesmas",

            description:
                "Pusat penyimpanan dan pengelolaan arsip Puskesmas"
        }
    };

    /* =========================
       TAB CLICK
    ========================= */
    tabButtons.forEach(
        function(button){
            button.addEventListener(
                "click",
                function(){
                    if(
                        smartofficePusatDokumenDestroyed
                    ){
                        return;
                    }

                    const tab =
                        button.dataset.tab;
                    if(
                        !tab ||
                        !tabData[tab]
                    ){
                        return;
                    }

                    /* =========================
                       ACTIVE TAB
                    ========================= */
                    tabButtons.forEach(
                        function(item){
                            item.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    /* =========================
                       UPDATE INFO
                    ========================= */
                    const info =
                        document.getElementById(
                            "smartofficePusatDokumenTabInfo"
                        );
                    if(
                        info
                    ){
                        const title =
                            info.querySelector(
                                ".smartoffice-pusatdokumen-tab-info-title"
                            );

                        const description =
                            info.querySelector(
                                ".smartoffice-pusatdokumen-tab-info-description"
                            );
                        if(
                            title
                        ){
                            title.textContent =
                                tabData[tab].title;
                        }

                        if(
                            description
                        ){
                            description.textContent =
                                tabData[tab].description;
                        }
                    }

                    /* =========================
                       LOAD TAB
                    ========================= */
                    if(
                        tab === "penomoran-sk"
                    ){
                        smartofficeInitPenomoranSK();
                    }
                }
            );
        }
    );
}


/* ======================================================
   INIT PENOMORAN SK
   DATA TIDAK DI-LOAD SAAT HALAMAN DIBUKA
====================================================== */
function smartofficeInitPenomoranSK(){

    const list =
        document.getElementById(
            "smartofficePenomoranSKList"
        );
    if(
        !list
    ){
        return;
    }

    /* =========================
       REFRESH BUTTON
    ========================= */
    const refreshButton =
        document.getElementById(
            "smartofficePenomoranSKRefreshButton"
        );
    if(
        refreshButton &&
        !refreshButton.dataset.ready
    ){
        smartofficePenomoranSKRefreshHandler =
            async function(){

                /* =========================
                PASTIKAN TAB SK AKTIF
                ========================= */
                const activeTab =
                    document.querySelector(
                        ".smartoffice-tab-button.active"
                    )?.dataset.tab || "";
                if(
                    activeTab !==
                    "penomoran-sk"
                ){
                    return;
                }

                /* =========================
                TAHUN AKTIF
                ========================= */
                const tahun =
                    document.getElementById(
                        "smartofficePenomoranSKFilterTahun"
                    )?.value || "";
                if(
                    !tahun
                ){
                    smartofficeShowToast(
                        "Pilih tahun terlebih dahulu.",
                        "error"
                    );

                    return;
                }

                /* =========================
                REFRESH CACHE
                ========================= */
                smartofficeShowGlobalLoading(
                    "Memperbarui data Surat Keputusan..."
                );

                try{
                    await smartofficeRefreshSKAfterMutation();

                    smartofficeShowToast(
                        "Data Surat Keputusan berhasil diperbarui.",
                        "success"
                    );
                }
                catch(error){
                    console.error(
                        "Refresh SK Error:",
                        error
                    );

                    smartofficeShowToast(
                        error.message ||
                        "Gagal memperbarui data Surat Keputusan.",
                        "error"
                    );
                }
                finally{
                    smartofficeHideGlobalLoading();
                }
            };
        refreshButton.addEventListener(
            "click",
            smartofficePenomoranSKRefreshHandler
        );

        refreshButton.dataset.ready =
            "1";
    }

    /* =========================
       INIT FILTER
       TAHUN + KLASTER
    ========================= */
    smartofficeInitFilterSK();

    /* =========================
       RESET DATA
    ========================= */
    smartofficeSKAllData = [];
    smartofficeSKViewData = [];
    smartofficeSKLoaded =
        false;

    /* =========================
       KOSONGKAN LIST
    ========================= */
    list.innerHTML = `
        <div class="smartoffice-empty">
            <div class="smartoffice-empty-title">
                Pilih Tahun
            </div>

            <div class="smartoffice-empty-text">
                Pilih tahun terlebih dahulu untuk menampilkan Surat Keputusan.
            </div>
        </div>
    `;
}


/* ======================================================
   LOAD DATA PENOMORAN SK
   READ FIRESTORE BERDASARKAN TAHUN
   CACHE PER TAHUN
====================================================== */
async function smartofficeLoadDataPenomoranSK(
    tahun
){
    try{
        /* =========================
           CEK PAGE
        ========================= */
        if(
            smartofficePusatDokumenDestroyed
        ){
            return;
        }

        /* =========================
           VALIDASI TAHUN
        ========================= */
        const tahunValue =
            String(
                tahun || ""
            ).trim();

        if(
            !/^\d{4}$/.test(
                tahunValue
            )
        ){
            return;
        }

        /* =========================
           READ FIRESTORE
           SERVICE HANDLE CACHE
        ========================= */
        const res =
            await smartofficeGetSKByTahunFirestore(
                tahunValue
            );

        /* =========================
           PAGE SUDAH DI-DESTROY
        ========================= */
        if(
            smartofficePusatDokumenDestroyed
        ){
            return;
        }

        /* =========================
           SIMPAN DATA TAHUN
        ========================= */
        smartofficeSKAllData =
            res || [];

        smartofficeSKViewData =
            [
                ...smartofficeSKAllData
            ];

        /* =========================
           ISI DROPDOWN NOMOR SK
           BERDASARKAN TAHUN TERPILIH
        ========================= */
        const nomorList =
            [
                ...new Set(
                    smartofficeSKAllData
                        .map(
                            function(row){
                                return row.nomorSK;
                            }
                        )
                        .filter(Boolean)
                )
            ]
            .sort(
                function(a,b){
                    return String(a)
                        .localeCompare(
                            String(b),
                            undefined,
                            {
                                numeric: true
                            }
                        );
                }
            );

        smartofficeFillSKSelect(
            "smartofficePenomoranSKFilterNomor",
            nomorList,
            "Semua"
        );

        /* =========================
           STATUS LOAD
        ========================= */
        smartofficeSKLoaded =
            true;

        /* =========================
           RENDER DATA TAHUN
        ========================= */
        if(
            smartofficePusatDokumenDestroyed
        ){
            return;
        }

        smartofficeRenderPenomoranSK();
    }
    catch(error){
        /* =========================
           JANGAN PROSES ERROR
           KALAU PAGE SUDAH DESTROY
        ========================= */
        if(
            smartofficePusatDokumenDestroyed
        ){
            return;
        }

        console.error(
            "Load Data Penomoran SK Firestore Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat data Surat Keputusan",
            "error"
        );
    }
}


/* ======================================================
   REFRESH CACHE SK SETELAH MUTASI
   TAMBAH / EDIT / BUKA LOCK / HAPUS
====================================================== */
async function smartofficeRefreshSKAfterMutation(){

    if(
        smartofficePusatDokumenDestroyed
    ){
        return;
    }

    const tahun =
        document.getElementById(
            "smartofficePenomoranSKFilterTahun"
        )?.value || "";
    if(
        !tahun
    ){
        return;
    }

    /* =========================
       SIMPAN FILTER AKTIF
    ========================= */
    const search =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        )?.value || "";

    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        )?.value || "";

    const klaster =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        )?.value || "";

    const status =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        )?.value || "";

    /* =========================
       HAPUS CACHE TAHUN AKTIF
    ========================= */
    smartofficeClearSKFirestoreCache(
        tahun
    );

    /* =========================
       LOAD ULANG TAHUN AKTIF
    ========================= */
    await smartofficeLoadDataPenomoranSK(
        tahun
    );
    if(
        smartofficePusatDokumenDestroyed
    ){
        return;
    }

    /* =========================
       KEMBALIKAN FILTER
    ========================= */
    const searchElement =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        );

    const nomorElement =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        );

    const klasterElement =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        );

    const statusElement =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        );

    if(searchElement){
        searchElement.value =
            search;
    }

    if(nomorElement){
        nomorElement.value =
            nomor;
    }

    if(klasterElement){
        klasterElement.value =
            klaster;
    }

    if(statusElement){
        statusElement.value =
            status;
    }

    /* =========================
       TERAPKAN KEMBALI FILTER
    ========================= */
    smartofficeApplyFilterSK();
}


/* ======================================================
   RENDER PENOMORAN SK
====================================================== */
function smartofficeRenderPenomoranSK(){
    const list =
        document.getElementById(
            "smartofficePenomoranSKList"
        );
    if(
        !list
    ){
        return;
    }

    /* =========================
       DATA KOSONG
    ========================= */
    if(
        !smartofficeSKViewData.length
    ){
        list.innerHTML = `
            <div class="smartoffice-empty">
                <div class="smartoffice-empty-title">
                    Belum ada Surat Keputusan
                </div>

                <div class="smartoffice-empty-text">
                    Data Surat Keputusan belum tersedia.
                </div>
            </div>
        `;

        return;
    }

    /* =========================
       NAMA KLASTER
    ========================= */
    const namaKlaster = {
        "KL-1":
            "Manajemen",

        "KL-2":
            "Ibu dan Anak",

        "KL-3":
            "Usia Dewasa dan Lanjut Usia",

        "KL-4":
            "Penanggulangan Penyakit Menular",

        "KL-5":
            "Lintas Klaster"
    };

    /* =========================
       RENDER LIST
    ========================= */
    list.innerHTML =
        smartofficeSKViewData
            .map(
                function(item){
                    const klaster =
                        item.klaster || "-";

                    const nama =
                        namaKlaster[klaster] || "";

                    const lockStatus =
                        String(
                            item.status || ""
                        )
                        .trim()
                        .toUpperCase();

                    const lockStatusText =
                        lockStatus === "LOCK"
                            ? "LOCK"
                            : lockStatus === "DRAFT"
                                ? "DRAFT"
                                : "-";

                    const lockStatusBackground =
                        lockStatus === "LOCK"
                            ? "#fff7ed"
                            : lockStatus === "DRAFT"
                                ? "#eff6ff"
                                : "#f8fafc";

                    const lockStatusBorder =
                        lockStatus === "LOCK"
                            ? "#fed7aa"
                            : lockStatus === "DRAFT"
                                ? "#bfdbfe"
                                : "#e2e8f0";

                    const lockStatusColor =
                        lockStatus === "LOCK"
                            ? "#c2410c"
                            : lockStatus === "DRAFT"
                                ? "#2563eb"
                                : "#64748b";

                    const lockStatusDot =
                        lockStatus === "LOCK"
                            ? "#f97316"
                            : lockStatus === "DRAFT"
                                ? "#3b82f6"
                                : "#94a3b8";

                    return `
                        <div class="smartoffice-penomoransk-item smartoffice-penomoransk-${klaster.toLowerCase().replace("-", "")}">

                            <!-- =========================
                                 HEADER
                            ========================= -->
                            <div class="smartoffice-penomoransk-item-header">
                                <div class="smartoffice-penomoransk-item-title-wrap">
                                    <div class="smartoffice-penomoransk-item-icon">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M6 2h9l3 3v17H6z"/>
                                            <path d="M14 2v4h4"/>
                                            <path d="M9 12h6"/>
                                            <path d="M9 16h6"/>
                                        </svg>
                                    </div>

                                    <div class="smartoffice-penomoransk-item-title-content">
                                        <div class="smartoffice-penomoransk-item-nomor">
                                            ${item.nomorSK || "-"}
                                        </div>

                                        <div class="smartoffice-penomoransk-item-tanggal">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.8"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            >
                                                <rect
                                                    x="3"
                                                    y="4"
                                                    width="18"
                                                    height="17"
                                                    rx="2"
                                                />
                                                <path d="M16 2v4"/>
                                                <path d="M8 2v4"/>
                                                <path d="M3 10h18"/>
                                            </svg>
                                            ${smartofficeFormatTanggalSK(item.tanggalSK)}
                                        </div>
                                    </div>
                                </div>

                                <!-- STATUS -->
                                <div class="smartoffice-penomoransk-item-status">
                                    <span class="smartoffice-penomoransk-status-dot"></span>
                                    ${item.statusSK || "-"}
                                </div>
                            </div>

                            <!-- =========================
                                 TENTANG
                            ========================= -->
                            <div class="smartoffice-penomoransk-item-tentang">
                                <div class="smartoffice-penomoransk-item-label">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M6 2h9l3 3v17H6z"/>
                                        <path d="M14 2v4h4"/>
                                        <path d="M9 12h6"/>
                                        <path d="M9 16h6"/>
                                    </svg>
                                    TENTANG
                                </div>

                                <div class="smartoffice-penomoransk-item-value">
                                    ${item.tentang || "-"}
                                </div>
                            </div>

                            <!-- ======================================================
                                INFORMASI BAWAH
                            ====================================================== -->
                            <div class="smartoffice-penomoransk-item-info">
                                <!-- KLASTER -->
                                <div class="smartoffice-penomoransk-item-info-box">
                                    <div class="smartoffice-penomoransk-item-label">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                            />
                                            <path d="M8 12h8"/>
                                            <path d="M12 8v8"/>
                                        </svg>
                                        KLASTER
                                    </div>

                                    <div class="smartoffice-penomoransk-item-klaster-value">
                                        ${klaster}
                                        ${nama ? ` • ${nama}` : ""}
                                    </div>
                                </div>

                                <!-- KLASIFIKASI -->
                                <div class="smartoffice-penomoransk-item-info-box">
                                    <div class="smartoffice-penomoransk-item-label">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M6 2h9l3 3v17H6z"/>
                                            <path d="M14 2v4h4"/>
                                            <path d="M9 12h6"/>
                                        </svg>
                                        KLASIFIKASI
                                    </div>

                                    <div class="smartoffice-penomoransk-item-klasifikasi-value">
                                        ${item.klasifikasi || "-"}
                                    </div>
                                </div>

                                <!-- ACTION -->
                                <div class="smartoffice-penomoransk-item-action-wrap">

                                <!-- STATUS LOCK / DRAFT -->
                                    <div
                                        class="smartoffice-penomoransk-item-status"
                                        style="
                                            background:${lockStatusBackground};
                                            border-color:${lockStatusBorder};
                                            color:${lockStatusColor};
                                        "
                                    >
                                        <span
                                            class="smartoffice-penomoransk-status-dot"
                                            style="
                                                background:${lockStatusDot};
                                            "
                                        ></span>
                                        ${lockStatusText}
                                    </div>

                                    <!-- LIHAT SK -->
                                    <button
                                        type="button"
                                        class="smartoffice-penomoransk-item-action"
                                        data-sk-file="${item.file || ""}"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path d="M4 4h16v16H4z"/>
                                            <path d="M8 8h8"/>
                                            <path d="M8 12h8"/>
                                            <path d="M8 16h5"/>
                                        </svg>
                                        <span>Lihat SK</span>
                                        <span
                                            class="smartoffice-penomoransk-action-arrow"
                                        >
                                            ›
                                        </span>
                                    </button>

                                    <!-- MORE -->
                                    <button
                                        type="button"
                                        class="smartoffice-penomoransk-item-more"
                                        data-row-index="${item.rowIndex}"
                                        data-nomor-sk="${item.nomorSK || ""}"
                                        aria-label="Aksi SK"
                                        title="Aksi SK"
                                    >
                                        ⋮
                                    </button>
                                </div>
                            </div>                         
                        </div>
                    `;
                }
            )
            .join("");

    smartofficeInitPenomoranSKAction();
}


/* ======================================================
   FORMAT TANGGAL SK
====================================================== */
function smartofficeFormatTanggalSK(tanggal){
    if(!tanggal){
        return "-";
    }

    const parts =
        String(tanggal).split("-");

    if(parts.length !== 3){
        return tanggal;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


/* ======================================================
   AKSI PENOMORAN SK
====================================================== */
function smartofficeInitPenomoranSKAction(){

    const list =
        document.getElementById(
            "smartofficePenomoranSKList"
        );
    if(!list){
        return;
    }

    /* ==================================================
       ROLE USER
    ================================================== */
    const sessionData =
        smartofficeGetSession();

    const userRole =
        String(
            sessionData?.role || ""
        )
        .trim()
        .toUpperCase();

    /* =========================
       LIHAT SK
    ========================= */
    list
        .querySelectorAll(
            ".smartoffice-penomoransk-item-action"
        )
        .forEach(
            function(button){
                button.addEventListener(
                    "click",
                    function(){
                        const file =
                            button.dataset.skFile;
                        if(
                            !file
                        ){
                            smartofficeShowToast(
                                "File SK belum tersedia.",
                                "error"
                            );

                            return;
                        }

                        /* =========================
                        AMBIL FILE ID DRIVE
                        ========================= */
                        const fileId =
                            smartofficeGetDriveFileId(
                                file
                            );
                        if(
                            !fileId
                        ){
                            smartofficeShowToast(
                                "File SK tidak dapat dibuka.",
                                "error"
                            );

                            return;
                        }

                        /* =========================
                        OPEN PREVIEW MODAL
                        ========================= */
                        smartofficeOpenPreviewDokumen(
                            fileId,
                            "Surat Keputusan"
                        );
                    }
                );
            }
        );

    /* =========================
       MENU MORE / TITIK 3
    ========================= */
    list
        .querySelectorAll(
            ".smartoffice-penomoransk-item-more"
        )
        .forEach(
            function(button){
                button.addEventListener(
                    "click",
                    function(){
                        /* =========================
                           CEK AKSES
                        ========================= */
                        if(
                            userRole !==
                            "SUPERADMIN"
                        ){
                            smartofficeShowToast(
                                "Anda tidak punya akses.",
                                "error"
                            );

                            return;
                        }

                        const rowIndex =
                            button.dataset.rowIndex;

                        const nomorSK =
                            button.dataset.nomorSk ||
                            "";

                        smartofficeShowSKActionSheet(
                            rowIndex,
                            nomorSK
                        );
                    }
                );
            }
        );
}


/* ======================================================
   BOTTOM SHEET AKSI SK
====================================================== */
function smartofficeShowSKActionSheet(
    rowIndex,
    nomorSK
){

    smartofficeCloseSKActionSheet();

    /* =========================
       AMBIL DATA SK
    ========================= */
    const rowData =
        smartofficeSKAllData.find(
            function(item){
                return String(item.rowIndex) ===
                       String(rowIndex);
            }
        );

    const status =
        String(
            rowData?.status || ""
        )
        .trim()
        .toUpperCase();

    const isLocked =
        status === "LOCK";

    /* =========================
       BUAT SHEET
    ========================= */
    const sheet =
        document.createElement("div");

    sheet.id =
        "smartofficePenomoranSKActionSheet";

    sheet.className =
        "smartoffice-penomoransk-action-sheet";

    sheet.innerHTML = `
        <div
            class="smartoffice-penomoransk-action-overlay"
        ></div>

        <div
            class="smartoffice-penomoransk-action-panel"
        >
            <div
                class="smartoffice-penomoransk-action-handle"
            ></div>

            <div
                class="smartoffice-penomoransk-action-title"
            >
                Aksi Surat Keputusan
            </div>

            <div
                class="smartoffice-penomoransk-action-number"
            >
                ${nomorSK || "-"}
            </div>

            ${
                isLocked
                ? `
                    <!-- BUKA KUNCI -->
                    <button
                        type="button"
                        class="smartoffice-penomoransk-action-option"
                        data-action="unlock"
                        data-row-index="${rowIndex}"
                    >
                        <span
                            class="smartoffice-penomoransk-action-option-icon"
                        >
                            🔓
                        </span>

                        <span
                            class="smartoffice-penomoransk-action-option-content"
                        >
                            <strong>Buka Kunci</strong>
                            <small>
                                Izinkan perubahan data SK
                            </small>
                        </span>
                    </button>
                `
                : `
                    <!-- UBAH -->
                    <button
                        type="button"
                        class="smartoffice-penomoransk-action-option"
                        data-action="edit"
                        data-row-index="${rowIndex}"
                    >
                        <span
                            class="smartoffice-penomoransk-action-option-icon"
                        >
                            ✎
                        </span>

                        <span
                            class="smartoffice-penomoransk-action-option-content"
                        >
                            <strong>Ubah SK</strong>
                            <small>
                                Edit data Surat Keputusan
                            </small>
                        </span>
                    </button>

                    <!-- HAPUS -->
                    <button
                        type="button"
                        class="smartoffice-penomoransk-action-option"
                        data-action="delete"
                        data-row-index="${rowIndex}"
                    >
                        <span
                            class="smartoffice-penomoransk-action-option-icon"
                        >
                            🗑
                        </span>

                        <span
                            class="smartoffice-penomoransk-action-option-content"
                        >
                            <strong>Hapus SK</strong>
                            <small>
                                Hapus Surat Keputusan
                            </small>
                        </span>
                    </button>
                `
            }

            <!-- TUTUP -->
            <button
                type="button"
                class="smartoffice-penomoransk-action-cancel"
            >
                Batal
            </button>
        </div>
    `;

    document.body.appendChild(
        sheet
    );

    requestAnimationFrame(
        function(){
            sheet.classList.add(
                "active"
            );
        }
    );

    /* =========================
       OVERLAY
    ========================= */
    const overlay =
        sheet.querySelector(
            ".smartoffice-penomoransk-action-overlay"
        );

    if(overlay){

        overlay.addEventListener(
            "click",
            smartofficeCloseSKActionSheet
        );

    }

    /* =========================
       BATAL
    ========================= */
    const cancel =
        sheet.querySelector(
            ".smartoffice-penomoransk-action-cancel"
        );

    if(cancel){

        cancel.addEventListener(
            "click",
            smartofficeCloseSKActionSheet
        );

    }

    /* =========================
       ACTION
    ========================= */
    sheet
        .querySelectorAll(
            ".smartoffice-penomoransk-action-option"
        )
        .forEach(function(button){
            button.addEventListener(
                "click",
                async function(){

                    const action =
                        button.dataset.action;

                    const row =
                        button.dataset.rowIndex;

                    /* =====================
                       BUKA KUNCI
                    ===================== */
                    if(
                        action === "unlock"
                    ){
                        button.disabled =
                            true;

                        /* =====================
                           TUTUP SHEET
                           LANGSUNG
                        ===================== */
                        smartofficeCloseSKActionSheet();

                        /*
                         * closeSKActionSheet()
                         * memakai animasi.
                         * Jadi hapus DOM langsung
                         * supaya toast tidak tertutup overlay.
                         */
                        if(
                            sheet.parentNode
                        ){
                            sheet.parentNode.removeChild(
                                sheet
                            );
                        }

                        /* =====================
                           GLOBAL LOADING
                        ===================== */
                        smartofficeShowGlobalLoading(
                            "Membuka Dokumen..."
                        );

                        try{
                            /* =================
                            API
                            ================= */
                            await smartofficeBukaLockSK(
                                row
                            );

                            /* =================
                            REFRESH CACHE
                            ================= */
                            await smartofficeRefreshSKAfterMutation();

                            /* =================
                            SUCCESS
                            ================= */
                            smartofficeShowToast(
                                "Surat Keputusan berhasil dibuka.",
                                "success"
                            );
                        }
                        catch(error){
                            console.error(
                                "Buka Lock SK Error:",
                                error
                            );

                            smartofficeShowToast(
                                error.message ||
                                "Gagal membuka kunci Surat Keputusan.",
                                "error"
                            );
                        }
                        finally{
                            /* =================
                            HIDE GLOBAL LOADING
                            ================= */
                            smartofficeHideGlobalLoading();
                        }

                        return;
                    }

                    /* =====================
                       UBAH SK
                    ===================== */
                    if(
                        action === "edit"
                    ){
                        /*
                         * Double check dari
                         * data lokal.
                         */
                        const latestRow =
                            smartofficeSKAllData.find(
                                function(item){
                                    return String(item.rowIndex) ===
                                           String(row);
                                }
                            );

                        const latestStatus =
                            String(
                                latestRow?.status || ""
                            )
                            .trim()
                            .toUpperCase();
                        if(
                            latestStatus === "LOCK"
                        ){
                            smartofficeCloseSKActionSheet();
                            smartofficeShowToast(
                                "SK masih terkunci. Buka Kunci terlebih dahulu.",
                                "error"
                            );

                            return;
                        }

                        smartofficeCloseSKActionSheet();
                        smartofficeOpenTambahSK(
                            row
                        );
                    }

                    /* =====================
                       HAPUS SK
                    ===================== */
                    if(
                        action === "delete"
                    ){
                        /* =====================
                        CEK ROLE
                        ===================== */
                        const sessionData =
                            smartofficeGetSession();

                        const role =
                            String(
                                sessionData?.role || ""
                            )
                            .trim()
                            .toUpperCase();

                        if(
                            role !== "SUPERADMIN"
                        ){
                            smartofficeCloseSKActionSheet();
                            smartofficeShowToast(
                                "Anda tidak punya akses.",
                                "error"
                            );

                            return;
                        }

                        /* =====================
                        CEK STATUS TERBARU
                        ===================== */
                        const latestRow =
                            smartofficeSKAllData.find(
                                function(item){
                                    return String(item.rowIndex) ===
                                        String(row);
                                }
                            );

                        const latestStatus =
                            String(
                                latestRow?.status || ""
                            )
                            .trim()
                            .toUpperCase();
                        if(
                            latestStatus === "LOCK"
                        ){
                            smartofficeCloseSKActionSheet();
                            smartofficeShowToast(
                                "SK masih terkunci. Buka Kunci terlebih dahulu.",
                                "error"
                            );

                            return;
                        }

                        /* =====================
                        KONFIRMASI
                        ===================== */
                        const nomor =
                            latestRow?.nomorSK ||
                            nomorSK ||
                            "";

                        const confirmed =
                            window.confirm(
                                `Hapus Surat Keputusan?\n\n${nomor}\n\nData yang dihapus tidak dapat dikembalikan.`
                            );
                        if(
                            !confirmed
                        ){
                            return;
                        }

                        /* =====================
                        TUTUP SHEET
                        ===================== */
                        smartofficeCloseSKActionSheet();

                        if(
                            sheet.parentNode
                        ){
                            sheet.parentNode.removeChild(
                                sheet
                            );
                        }

                        /* =====================
                           GLOBAL LOADING
                        ===================== */
                        smartofficeShowGlobalLoading(
                            "Menghapus Surat Keputusan..."
                        );

                        try{
                            await smartofficeHapusSK(
                                row
                            );

                            await smartofficeRefreshSKAfterMutation();

                            smartofficeShowToast(
                                "Surat Keputusan berhasil dihapus.",
                                "success"
                            );
                        }
                        catch(error){
                            console.error(
                                "Hapus SK Error:",
                                error
                            );

                            smartofficeShowToast(
                                error.message ||
                                "Gagal menghapus Surat Keputusan.",
                                "error"
                            );
                        }
                        finally{
                            smartofficeHideGlobalLoading();
                        }

                        return;
                    }
                }
            );
        });
}


/* ======================================================
   TUTUP BOTTOM SHEET
====================================================== */
function smartofficeCloseSKActionSheet(){
    const sheet =
        document.getElementById(
            "smartofficePenomoranSKActionSheet"
        );
    if(
        sheet
    ){
        sheet.classList.remove(
            "active"
        );

        setTimeout(
            function(){
                if(
                    sheet.parentNode
                ){
                    sheet.parentNode.removeChild(
                        sheet
                    );
                }
            },
            220
        );
    }
}


/* ======================================================
   FILTER PENOMORAN SK
====================================================== */

/* =========================
   INIT FILTER SK
========================= */
function smartofficeInitFilterSK(){

    /* =========================
       TAHUN
       Tidak tergantung data SK
    ========================= */
    const currentYear =
        new Date().getFullYear();

    const tahunList = [];

    for(
        let year = currentYear;
        year >= 2026;
        year--
    ){
        tahunList.push(
            String(year)
        );
    }

    /* =========================
       KLASTER
       STATIC
    ========================= */
    const klasterList = [
        "KL-1",
        "KL-2",
        "KL-3",
        "KL-4",
        "KL-5"
    ];

    /* =========================
       NOMOR SK
       BELUM ADA DATA
       DIISI SETELAH TAHUN DIPILIH
    ========================= */
    smartofficeFillSKSelect(
        "smartofficePenomoranSKFilterNomor",
        [],
        "Pilih tahun terlebih dahulu"
    );

    /* =========================
       TAHUN
    ========================= */
    smartofficeFillSKSelect(
        "smartofficePenomoranSKFilterTahun",
        tahunList,
        "Pilih tahun"
    );

    /* =========================
       KLASTER
    ========================= */
    smartofficeFillSKSelect(
        "smartofficePenomoranSKFilterKlaster",
        klasterList,
        "Semua"
    );
}


/* =========================
   FILL SELECT SK
========================= */
function smartofficeFillSKSelect(
    elementId,
    data,
    defaultText
){
    const select =
        document.getElementById(
            elementId
        );

    if(!select){
        return;
    }

    select.innerHTML =
        `<option value="">${defaultText}</option>`;

    data.forEach(function(value){
        const option =
            document.createElement(
                "option"
            );

        option.value =
            value;

        option.textContent =
            value;

        select.appendChild(
            option
        );
    });
}


/* ======================================================
   APPLY FILTER SK
   FILTER LOKAL DARI CACHE TAHUN TERPILIH
====================================================== */
function smartofficeApplyFilterSK(){

    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        )?.value || "";

    const klaster =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        )?.value || "";

    const status =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        )?.value || "";

    const search =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        )?.value
            ?.trim()
            .toLowerCase() || "";

    /* =========================
       JIKA BELUM ADA TAHUN
    ========================= */
    if(
        !smartofficeSKLoaded
    ){
        smartofficeSKViewData = [];
        smartofficeRenderPenomoranSK();

        return;
    }

    /* =========================
       FILTER DARI CACHE TAHUN
    ========================= */
    smartofficeSKViewData =
        smartofficeSKAllData.filter(
            function(row){

                /* =========================
                   SEARCH
                   NOMOR SK + TENTANG
                ========================= */
                if(
                    search
                ){
                    const text =
                        `
                        ${row.nomorSK || ""}
                        ${row.tentang || ""}
                        `
                        .toLowerCase();

                    if(
                        !text.includes(
                            search
                        )
                    ){
                        return false;
                    }
                }

                /* =========================
                   NOMOR SK
                ========================= */
                if(
                    nomor &&
                    String(
                        row.nomorSK || ""
                    ) !==
                    String(
                        nomor
                    )
                ){
                    return false;
                }

                /* =========================
                   KLASTER
                ========================= */
                if(
                    klaster &&
                    String(
                        row.klaster || ""
                    ) !==
                    String(
                        klaster
                    )
                ){
                    return false;
                }

                /* =========================
                   STATUS SK
                ========================= */
                if(
                    status &&
                    String(
                        row.statusSK || ""
                    )
                    .trim()
                    .toUpperCase() !==
                    String(
                        status
                    )
                    .trim()
                    .toUpperCase()
                ){
                    return false;
                }

                return true;
            }
        );

    smartofficeRenderPenomoranSK();
}


/* =========================
   RESET FILTER SK
   TAHUN TETAP
========================= */
function smartofficeResetFilterSK(){

    const search =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        );

    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        );

    const status =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        );

    /* =========================
       RESET FILTER
       TAHUN TIDAK DIUBAH
    ========================= */
    if(search){
        search.value = "";
    }

    if(nomor){
        nomor.value = "";
    }

    if(klaster){
        klaster.value = "";
    }

    if(status){
        status.value = "";
    }

    /* =========================
       TAMPILKAN SEMUA DATA
       DARI CACHE TAHUN
    ========================= */
    smartofficeSKViewData =
        [
            ...smartofficeSKAllData
        ];

    smartofficeRenderPenomoranSK();
}


/* ======================================================
   EVENT FILTER SK
====================================================== */
function smartofficeInitFilterSKEvent(){

    const search =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        );

    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        );

    const tahun =
        document.getElementById(
            "smartofficePenomoranSKFilterTahun"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        );

    const status =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        );

    const reset =
        document.querySelector(
            ".smartoffice-penomoransk-filter-button"
        );

    /* ==================================================
       SEARCH
    ================================================== */
    smartofficePenomoranSKSearchHandler =
        smartofficeApplyFilterSK;
    if(search){
        search.addEventListener(
            "input",
            smartofficePenomoranSKSearchHandler
        );
    }

    /* ==================================================
       NOMOR SK
    ================================================== */
    smartofficePenomoranSKNomorHandler =
        smartofficeApplyFilterSK;
    if(nomor){
        nomor.addEventListener(
            "change",
            smartofficePenomoranSKNomorHandler
        );
    }

    /* ==================================================
       TAHUN
       TAHUN = PEMICU LOAD FIRESTORE
    ================================================== */
    smartofficePenomoranSKTahunHandler =
        async function(){

            if(
                smartofficePusatDokumenDestroyed
            ){
                return;
            }

            const tahunValue =
                tahun?.value || "";

            /* =========================
            BELUM PILIH TAHUN
            ========================= */
            if(
                !tahunValue
            ){
                smartofficeSKAllData = [];
                smartofficeSKViewData = [];
                smartofficeSKLoaded =
                    false;

                const list =
                    document.getElementById(
                        "smartofficePenomoranSKList"
                    );
                if(list){
                    list.innerHTML = `
                        <div class="smartoffice-empty">
                            <div class="smartoffice-empty-title">
                                Pilih Tahun
                            </div>

                            <div class="smartoffice-empty-text">
                                Pilih tahun terlebih dahulu untuk menampilkan Surat Keputusan.
                            </div>
                        </div>
                    `;
                }

                return;
            }

            /* =========================
            LOAD TAHUN
            SERVICE HANDLE CACHE
            ========================= */
            await smartofficeLoadDataPenomoranSK(
                tahunValue
            );

            /* =========================
            TERAPKAN FILTER LAIN
            DARI CACHE TAHUN
            ========================= */
            if(
                smartofficePusatDokumenDestroyed
            ){
                return;
            }

            smartofficeApplyFilterSK();
        };
    if(tahun){
        tahun.addEventListener(
            "change",
            smartofficePenomoranSKTahunHandler
        );
    }

    /* ==================================================
       KLASTER
    ================================================== */
    smartofficePenomoranSKKlasterHandler =
        smartofficeApplyFilterSK;
    if(klaster){
        klaster.addEventListener(
            "change",
            smartofficePenomoranSKKlasterHandler
        );
    }

    /* ==================================================
       STATUS SK
    ================================================== */
    smartofficePenomoranSKStatusHandler =
        smartofficeApplyFilterSK;
    if(status){
        status.addEventListener(
            "change",
            smartofficePenomoranSKStatusHandler
        );
    }

    /* ==================================================
       RESET
    ================================================== */
    if(reset){
        reset.onclick =
            function(){
                smartofficeResetFilterSK();
            };
    }
}


/* ======================================================
   EVENT TAMBAH SK
   KHUSUS SUPERADMIN
====================================================== */
function smartofficeInitTambahSKEvent(){

    const button =
        document.getElementById(
            "smartofficePenomoranSKTambahButton"
        );
    if(!button){
        return;
    }

    /* =========================
       CEGAH EVENT DOBEL
    ========================= */
    if(
        button.dataset.roleReady === "1"
    ){
        return;
    }

    button.addEventListener(
        "click",
        function(){

            /* =========================
               AMBIL ROLE SESSION
            ========================= */
            const sessionData =
                smartofficeGetSession();

            const role =
                String(
                    sessionData?.role || ""
                )
                .trim()
                .toUpperCase();

            /* =========================
               CEK AKSES
            ========================= */
            if(
                role !==
                "SUPERADMIN"
            ){
                smartofficeShowToast(
                    "Anda tidak punya akses.",
                    "error"
                );

                return;
            }

            /* =========================
               SUPERADMIN
            ========================= */
            smartofficeOpenTambahSK();
        }
    );

    button.dataset.roleReady =
        "1";
}


/* ======================================================
   BUKA MODAL TAMBAH / EDIT SK
====================================================== */
async function smartofficeOpenTambahSK(
    editRowIndex = null
){
    /* =========================
       MODE
    ========================= */
    if(
        editRowIndex !== null &&
        editRowIndex !== undefined
    ){
        const row =
            smartofficeSKAllData.find(
                function(item){
                    return String(item.rowIndex) ===
                           String(editRowIndex);
                }
            );

        const status =
            String(
                row?.status || ""
            )
            .trim()
            .toUpperCase();

        /* =========================
           LOCK = TIDAK BOLEH EDIT
        ========================= */
        if(
            status === "LOCK"
        ){
            smartofficeShowToast(
                "SK masih terkunci. Buka Kunci terlebih dahulu.",
                "error"
            );

            return;
        }
    }

    const isEdit =
        editRowIndex !== null &&
        editRowIndex !== undefined &&
        String(editRowIndex).trim() !== "";

    /* ==================================================
       CARI DATA EDIT
    ================================================== */
    let row = null;

    if(isEdit){
        row =
            smartofficeSKAllData.find(
                function(item){
                    return String(
                        item.rowIndex
                    ) ===
                    String(
                        editRowIndex
                    );
                }
            );

        if(!row){
            smartofficeShowToast(
                "Data SK tidak ditemukan.",
                "error"
            );

            return;
        }
    }

    /* ==================================================
       SET MODE
    ================================================== */
    smartofficeSKFormMode =
        isEdit
            ? "edit"
            : "add";

    smartofficeSKEditRowIndex =
        isEdit
            ? Number(editRowIndex)
            : null;

    if(isEdit){
        const parts =
            String(
                row.nomorSK || ""
            ).split("/");

        smartofficeSKEditNomorUrut =
            parts[1] || "";
    }
    else{
        smartofficeSKEditNomorUrut =
            null;
    }

    /* ==================================================
       BODY FORM
    ================================================== */
    const body =
        document.getElementById(
            "smartofficePenomoranSKFormBody"
        );
    if(!body){
        return;
    }

    /* ==================================================
       RENDER FORM
    ================================================== */
    body.innerHTML = `
        <form
            id="smartofficePenomoranSKForm"
            class="smartoffice-penomoransk-form"
        >
            <!-- =========================
                BARIS 1
            ========================== -->
            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-preview"
            >
                <label>
                    Preview Nomor SK
                </label>

                <div
                    class="smartoffice-penomoransk-preview-value"
                    id="smartofficePenomoranSKPreviewNomor"
                >
                    ${
                        isEdit
                            ? row.nomorSK || "—"
                            : "—"
                    }
                </div>
            </div>

            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-kode"
            >
                <label>
                    Kode
                </label>

                <input
                    type="text"
                    id="smartofficeSKKode"
                    readonly
                    placeholder="Otomatis"
                    value="${
                        isEdit
                            ? row.kode || ""
                            : ""
                    }"
                >
            </div>

            <!-- =========================
                KLASIFIKASI
            ========================== -->
            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-klasifikasi"
            >
                <label>
                    Klasifikasi
                </label>

                <div
                    id="smartofficeSKKlasifikasiDropdown"
                    class="smartoffice-penomoransk-custom-select"
                >
                    <button
                        type="button"
                        id="smartofficeSKKlasifikasiButton"
                        class="smartoffice-penomoransk-custom-select-button"
                    >
                        <span
                            id="smartofficeSKKlasifikasiText"
                        >
                            ${
                                isEdit
                                    ? row.klasifikasi || "Pilih klasifikasi"
                                    : "Pilih klasifikasi"
                            }
                        </span>

                        <span
                            class="smartoffice-penomoransk-custom-select-arrow"
                        >
                            ▾
                        </span>
                    </button>

                    <div
                        id="smartofficeSKKlasifikasiOptions"
                        class="smartoffice-penomoransk-custom-select-options"
                    ></div>
                </div>

                <input
                    type="hidden"
                    id="smartofficeSKKlasifikasi"
                    value="${
                        isEdit
                            ? row.klasifikasi || ""
                            : ""
                    }"
                    required
                >
            </div>

            <!-- =========================
                TANGGAL + KLASTER + STATUS
            ========================== -->
            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-tanggal"
            >
                <label>
                    Tanggal SK
                </label>

                <input
                    type="date"
                    id="smartofficeSKTanggal"
                    value="${
                        isEdit
                            ? row.tanggalSK || ""
                            : ""
                    }"
                    required
                >
            </div>

            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-klaster"
            >
                <label>
                    Klaster
                </label>

                <select
                    id="smartofficeSKKlaster"
                    required
                >
                    <option value="">
                        Pilih klaster
                    </option>
                </select>
            </div>

            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-status"
            >
                <label>
                    Status SK
                </label>

                <select
                    id="smartofficeSKStatusSK"
                    required
                >
                    <option value="">
                        Pilih status
                    </option>
                </select>
            </div>

            <!-- =========================
                TENTANG
            ========================== -->
            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-tentang"
            >
                <label>
                    Tentang
                </label>

                <textarea
                    id="smartofficeSKTentang"
                    rows="4"
                    placeholder="Isi tentang Surat Keputusan"
                    required
                >${
                    isEdit
                        ? row.tentang || ""
                        : ""
                }</textarea>
            </div>

            <!-- =========================
                FILE
            ========================== -->
            <div
                class="smartoffice-penomoransk-form-field smartoffice-penomoransk-field-file"
            >
                <label>
                    File SK
                </label>

                <div
                    class="smartoffice-penomoransk-upload-box"
                    id="smartofficePenomoranSKUploadBox"
                >
                    <input
                        type="file"
                        id="smartofficePenomoranSKFile"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        hidden
                    >

                    <div
                        class="smartoffice-penomoransk-upload-icon"
                    >
                        ↑
                    </div>

                    <div
                        class="smartoffice-penomoransk-upload-content"
                    >
                        <strong>
                            Pilih File SK
                        </strong>

                        <span>
                            Klik untuk memilih file atau tarik file ke area ini
                        </span>

                        <small>
                            PDF • DOC • DOCX • Maksimal 3 Mb
                        </small>
                    </div>

                    <div
                        class="smartoffice-penomoransk-upload-file"
                        id="smartofficePenomoranSKUploadFileName"
                    >
                        ${
                            isEdit && row.file
                                ? "File SK tersimpan • pilih file baru untuk mengganti"
                                : "Belum ada file dipilih"
                        }
                    </div>
                </div>
            </div>

            <!-- =========================
                SIMPAN
            ========================== -->
            <button
                type="submit"
                class="smartoffice-penomoransk-form-submit"
                id="smartofficePenomoranSKSubmit"
            >
                ${
                    isEdit
                        ? "Simpan Perubahan"
                        : "Simpan SK"
                }
            </button>
        </form>
    `;

    /* ==================================================
       MODAL
    ================================================== */
    const modal =
        document.getElementById(
            "smartofficePenomoranSKFormModal"
        );
    if(modal){
        modal.style.display =
            "flex";
    }

    /* ==================================================
       JUDUL HEADER
       SETELAH FORM DI-RENDER
    ================================================== */
    const title =
        document.querySelector(
            ".smartoffice-penomoransk-form-title"
        );
    if(title){
        title.textContent =
            isEdit
                ? "Edit Surat Keputusan"
                : "Tambah Surat Keputusan";
    }

    /* ==================================================
       INIT EVENT
    ================================================== */
    smartofficeInitSKFormEvent();
    smartofficeInitUploadSKEvent();

    /* ==================================================
       LOAD MASTER
       HANYA SETELAH FORM SUDAH TAMPIL
    ================================================== */
    try{
        await smartofficeLoadSKMaster();
        smartofficeRenderSKMaster();

        /* =========================
           RESTORE NILAI
           MODE EDIT
        ========================= */
        if(isEdit && row){
            const klasifikasi =
                document.getElementById(
                    "smartofficeSKKlasifikasi"
                );

            const klasifikasiText =
                document.getElementById(
                    "smartofficeSKKlasifikasiText"
                );

            const klaster =
                document.getElementById(
                    "smartofficeSKKlaster"
                );

            const status =
                document.getElementById(
                    "smartofficeSKStatusSK"
                );

            if(klasifikasi){
                klasifikasi.value =
                    row.klasifikasi || "";
            }

            if(klasifikasiText){
                klasifikasiText.textContent =
                    row.klasifikasi ||
                    "Pilih klasifikasi";
            }

            if(klaster){
                klaster.value =
                    row.klaster || "";
            }

            if(status){
                status.value =
                    row.statusSK || "";
            }

            /* =========================
               KLASIFIKASI ACTIVE
            ========================= */
            const options =
                document.getElementById(
                    "smartofficeSKKlasifikasiOptions"
                );

            if(options){
                options
                    .querySelectorAll(
                        ".smartoffice-penomoransk-custom-select-option"
                    )
                    .forEach(
                        function(option){
                            option.classList.remove(
                                "active"
                            );

                            if(
                                String(
                                    option.dataset.value || ""
                                ) ===
                                String(
                                    row.klasifikasi || ""
                                )
                            ){
                                option.classList.add(
                                    "active"
                                );
                            }
                        }
                    );
            }
        }
    }
    catch(error){
        console.error(
            "Load Master SK Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat master Surat Keputusan.",
            "error"
        );
    }
}


/* ======================================================
   MASTER DATA SK
====================================================== */
async function smartofficeLoadSKMaster(){

    /* =========================
       CACHE
    ========================= */
    if(
        smartofficeSKMasterLoaded
    ){
        smartofficeRenderSKMaster();
        return;
    }

    try{
        const master =
            await smartofficeGetSKMaster();

        smartofficeSKMaster =
            master || {};

        smartofficeSKMasterLoaded =
            true;

        smartofficeRenderSKMaster();
    }
    catch(error){
        console.error(
            "Load Master SK Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat master Surat Keputusan.",
            "error"
        );
    }
}


/* ======================================================
   RENDER MASTER SK
====================================================== */
function smartofficeRenderSKMaster(){

    const klasifikasiDropdown =
        document.getElementById(
            "smartofficeSKKlasifikasiDropdown"
        );

    const klasifikasiButton =
        document.getElementById(
            "smartofficeSKKlasifikasiButton"
        );

    const klasifikasiText =
        document.getElementById(
            "smartofficeSKKlasifikasiText"
        );

    const klasifikasiOptions =
        document.getElementById(
            "smartofficeSKKlasifikasiOptions"
        );

    const klasifikasi =
        document.getElementById(
            "smartofficeSKKlasifikasi"
        );

    const klaster =
        document.getElementById(
            "smartofficeSKKlaster"
        );

    const status =
        document.getElementById(
            "smartofficeSKStatusSK"
        );

    /* =========================
       KLASIFIKASI
    ========================= */
    if(
        klasifikasiDropdown &&
        klasifikasiButton &&
        klasifikasiText &&
        klasifikasiOptions &&
        klasifikasi
    ){
        klasifikasiOptions.innerHTML = "";
        klasifikasiText.textContent =
            "Pilih klasifikasi";
        klasifikasi.value = "";
        (
            smartofficeSKMaster.klasifikasi ||
            []
        ).forEach(function(item){
            const option =
                document.createElement(
                    "div"
                );

            option.className =
                "smartoffice-penomoransk-custom-select-option";

            option.textContent =
                item;

            option.dataset.value =
                item;

            option.onclick =
                function(){
                    klasifikasi.value =
                        item;

                    klasifikasiText.textContent =
                        item;

                    klasifikasiOptions
                        .classList
                        .remove("show");

                    klasifikasiOptions
                        .querySelectorAll(
                            ".smartoffice-penomoransk-custom-select-option"
                        )
                        .forEach(function(itemOption){
                            itemOption.classList.remove(
                                "active"
                            );
                        });

                    option.classList.add(
                        "active"
                    );

                    const kode =
                        smartofficeSKMaster
                            .map?.[item] || "";

                    const kodeField =
                        document.getElementById(
                            "smartofficeSKKode"
                        );
                    if(kodeField){
                        kodeField.value =
                            kode;
                    }

                    if(
                        typeof smartofficeUpdatePreviewNomorSK ===
                        "function"
                    ){
                        smartofficeUpdatePreviewNomorSK();
                    }
                };

            klasifikasiOptions.appendChild(
                option
            );
        });

        klasifikasiButton.onclick =
            function(event){
                event.stopPropagation();
                klasifikasiOptions
                    .classList
                    .toggle("show");
            };

        if(
            smartofficePenomoranSKKlasifikasiOutsideClickHandler
        ){
            document.removeEventListener(
                "click",
                smartofficePenomoranSKKlasifikasiOutsideClickHandler
            );
        }

        smartofficePenomoranSKKlasifikasiOutsideClickHandler =
            function(event){
                if(
                    !klasifikasiDropdown.contains(
                        event.target
                    )
                ){
                    klasifikasiOptions
                        .classList
                        .remove("show");
                }
            };

        document.addEventListener(
            "click",
            smartofficePenomoranSKKlasifikasiOutsideClickHandler
        );
    }

    /* =========================
       KLASTER
    ========================= */
    if(klaster){
        klaster.innerHTML = `
            <option value="">
                Pilih klaster
            </option>
        `;
        (
            smartofficeSKMaster.klaster ||
            []
        ).forEach(function(item){
            const option =
                document.createElement(
                    "option"
                );
            option.value =
                item;

            option.textContent =
                item;

            klaster.appendChild(
                option
            );
        });
    }

    /* =========================
       STATUS SK
    ========================= */
    if(status){
        status.innerHTML = `
            <option value="">
                Pilih status
            </option>
        `;
        (
            smartofficeSKMaster.statusSK ||
            []
        ).forEach(function(item){
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item;

            option.textContent =
                item;

            status.appendChild(
                option
            );
        });
    }
}


/* ======================================================
   EVENT FORM SK
====================================================== */
function smartofficeInitSKFormEvent(){

    const form =
        document.getElementById(
            "smartofficePenomoranSKForm"
        );

    const klaster =
        document.getElementById(
            "smartofficeSKKlaster"
        );

    const tanggal =
        document.getElementById(
            "smartofficeSKTanggal"
        );

    const close =
        document.getElementById(
            "smartofficePenomoranSKFormClose"
        );

    const overlay =
        document.getElementById(
            "smartofficePenomoranSKFormOverlay"
        );

    /* =========================
       KLASTER
    ========================= */
    if(klaster){
        klaster.addEventListener(
            "change",
            smartofficeUpdatePreviewNomorSK
        );
    }

    /* =========================
       TANGGAL SK
    ========================= */
    if(tanggal){
        tanggal.addEventListener(
            "change",
            smartofficeUpdatePreviewNomorSK
        );
    }

    /* =========================
       SUBMIT
    ========================= */
    if(form){
        form.addEventListener(
            "submit",
            smartofficeSubmitSK
        );
    }

    /* =========================
       CLOSE
    ========================= */
    if(close){
        close.onclick =
            smartofficeCloseSKForm;
    }

    /* =========================
       OVERLAY
    ========================= */
    if(overlay){
        overlay.onclick =
            smartofficeCloseSKForm;
    }
}


/* ======================================================
   PREVIEW NOMOR SK
====================================================== */
async function smartofficeUpdatePreviewNomorSK(){

    const kode =
        document.getElementById(
            "smartofficeSKKode"
        )?.value || "";

    const klaster =
        document.getElementById(
            "smartofficeSKKlaster"
        )?.value || "";

    const tanggalSK =
        document.getElementById(
            "smartofficeSKTanggal"
        )?.value || "";

    const preview =
        document.getElementById(
            "smartofficePenomoranSKPreviewNomor"
        );
    if(!preview){
        return;
    }

    /* ==================================================
       MODE EDIT
       TIDAK REQUEST GAS
    ================================================== */
    if(
        smartofficeSKFormMode ===
        "edit"
    ){
        const row =
            smartofficeSKAllData.find(
                function(item){
                    return String(
                        item.rowIndex
                    ) ===
                    String(
                        smartofficeSKEditRowIndex
                    );
                }
            );

        if(!row){
            preview.textContent =
                "—";

            return;
        }

        const nomorLama =
            String(
                row.nomorSK || ""
            );

        const parts =
            nomorLama.split("/");

        const nomorUrut =
            parts[1] || "";

        const tahun =
            parts[4] || "";

        if(
            !kode ||
            !klaster ||
            !nomorUrut ||
            !tahun
        ){
            preview.textContent =
                nomorLama || "—";

            return;
        }

        /* =========================
           SESUAI BACKEND EDIT
        ========================= */
        preview.textContent =
            `${kode}/${nomorUrut}/${klaster}/PKMNAMBO/${tahun}`;

        return;
    }

    /* ==================================================
       MODE TAMBAH
       TETAP PAKAI PREVIEW GAS
    ================================================== */
    if(
        !kode ||
        !klaster ||
        !tanggalSK
    ){
        preview.textContent =
            "—";

        return;
    }

    preview.textContent =
        "Menentukan nomor...";

    try{
        const nomor =
            await smartofficePreviewNomorSK(
                kode,
                klaster,
                tanggalSK
            );

        preview.textContent =
            nomor || "—";
    }
    catch(error){
        console.error(
            "Preview Nomor SK Error:",
            error
        );

        preview.textContent =
            "—";
    }
}


/* ======================================================
   SUBMIT SK
====================================================== */
async function smartofficeSubmitSK(
    event
){
    event.preventDefault();

    const isEditMode =
        smartofficeSKFormMode === "edit";

    const kode =
        document.getElementById(
            "smartofficeSKKode"
        )?.value || "";

    const klasifikasi =
        document.getElementById(
            "smartofficeSKKlasifikasi"
        )?.value || "";

    const tanggalSK =
        document.getElementById(
            "smartofficeSKTanggal"
        )?.value || "";

    const tentang =
        document.getElementById(
            "smartofficeSKTentang"
        )?.value
            .trim() || "";

    const klaster =
        document.getElementById(
            "smartofficeSKKlaster"
        )?.value || "";

    const statusSK =
        document.getElementById(
            "smartofficeSKStatusSK"
        )?.value || "";

    const fileInput =
        document.getElementById(
            "smartofficePenomoranSKFile"
        );
    if(
        !kode ||
        !klasifikasi ||
        !tanggalSK ||
        !tentang ||
        !klaster ||
        !statusSK
    ){
        smartofficeShowToast(
            "Lengkapi data Surat Keputusan.",
            "error"
        );

        return;
    }

    let filePayload =
        null;

    /* ==================================================
    UPLOAD FILE SK
    PDF / DOC / DOCX
    MAKSIMAL 3 MB
    ================================================== */
    if(
        fileInput &&
        fileInput.files &&
        fileInput.files[0]
    ){
        const file =
            fileInput.files[0];

        /* =========================
        UKURAN FILE
        ========================= */
        const maxSize =
            3 * 1024 * 1024;
        if(
            file.size >
            maxSize
        ){
            smartofficeShowToast(
                "Ukuran file SK maksimal 3 MB.",
                "error"
            );

            return;
        }

        /* =========================
        FORMAT FILE
        ========================= */
        const fileName =
            String(
                file.name || ""
            ).toLowerCase();

        const extension =
            fileName.includes(".")
                ? fileName
                    .split(".")
                    .pop()
                : "";

        const allowedExtensions = [
            "pdf",
            "doc",
            "docx"
        ];

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        const validType =
            allowedTypes.includes(
                file.type
            );

        const validExtension =
            allowedExtensions.includes(
                extension
            );
        if(
            !validType &&
            !validExtension
        ){
            smartofficeShowToast(
                "File SK harus berformat PDF, DOC, atau DOCX.",
                "error"
            );

            return;
        }

        /* =========================
        CONVERT BASE64
        ========================= */
        try{
            const base64 =
                await smartofficeConvertFileToBase64(
                    file
                );

            filePayload = {
                name:
                    file.name,

                type:
                    file.type ||
                    (
                        extension === "pdf"
                            ? "application/pdf"
                            : extension === "doc"
                                ? "application/msword"
                                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ),
                data:
                    base64
            };
        }
        catch(error){
            console.error(
                "Read File SK Error:",
                error
            );

            smartofficeShowToast(
                "Gagal membaca file SK.",
                "error"
            );

            return;
        }
    }

    const submit =
        document.getElementById(
            "smartofficePenomoranSKSubmit"
        );
    if(submit){
        submit.disabled =
            true;
        submit.textContent =
            "Menyimpan...";
    }

    try{
        smartofficeShowGlobalLoading();

        const result =
            await smartofficeAddSKDraft({
                rowIndex:
                    smartofficeSKEditRowIndex || "",
                kode,
                klasifikasi,
                tanggalSK,
                tentang,
                klaster,
                statusSK,
                file:
                    filePayload
            });

        console.log(
            "SK Saved:",
            result
        );

        await smartofficeRefreshSKAfterMutation();

        smartofficeShowToast(
            "Surat Keputusan berhasil disimpan.",
            "success"
        );

        smartofficeCloseSKForm();
    }
    catch(error){
        console.error(
            "Save SK Error:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal menyimpan Surat Keputusan.",
            "error"
        );
    }
    finally{
        smartofficeHideGlobalLoading();

        if(submit){
            submit.disabled =
                false;

            submit.textContent =
                isEditMode
                    ? "Simpan Perubahan"
                    : "Simpan SK";
        }
    }
}


/* ======================================================
   TUTUP FORM SK
====================================================== */
function smartofficeCloseSKForm(){
    const modal =
        document.getElementById(
            "smartofficePenomoranSKFormModal"
        );

    if(!modal){
        return;
    }

    /* =========================
       TUTUP MODAL
    ========================= */
    modal.classList.remove(
        "active"
    );

    modal.style.display =
        "none";

    /* =========================
       RESET FORM STATE
    ========================= */
    smartofficeSKFormMode =
        "add";

    smartofficeSKEditRowIndex =
        null;

    smartofficeSKEditNomorUrut =
        null;
}


/* ======================================================
   INIT UPLOAD FILE SK
====================================================== */
function smartofficeInitUploadSKEvent(){

    const uploadBox =
        document.getElementById(
            "smartofficePenomoranSKUploadBox"
        );

    const fileInput =
        document.getElementById(
            "smartofficePenomoranSKFile"
        );

    const fileName =
        document.getElementById(
            "smartofficePenomoranSKUploadFileName"
        );
    if(
        !uploadBox ||
        !fileInput ||
        !fileName
    ){
        return;
    }

    uploadBox.onclick =
        function(){
            fileInput.click();
        };

    fileInput.onchange =
        function(){
            const file =
                fileInput.files?.[0];

            if(!file){
                fileName.textContent =
                    "Belum ada file dipilih";

                fileName.classList.remove(
                    "show"
                );

                return;
            }

            fileName.textContent =
                file.name;

            fileName.classList.add(
                "show"
            );
        };

    uploadBox.ondragover =
        function(event){
            event.preventDefault();
            uploadBox.classList.add(
                "dragover"
            );
        };

    uploadBox.ondragleave =
        function(){
            uploadBox.classList.remove(
                "dragover"
            );
        };

    uploadBox.ondrop =
        function(event){
            event.preventDefault();
            uploadBox.classList.remove(
                "dragover"
            );

            const files =
                event.dataTransfer.files;

            if(!files.length){
                return;
            }

            fileInput.files =
                files;

            fileInput.dispatchEvent(
                new Event("change")
            );
        };
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export function smartofficeDestroyPage(){

    /* ==================================================
       FLAG DESTROY
    ================================================== */
    smartofficePusatDokumenDestroyed =
        true;

    /* ==================================================
       FILTER ELEMENT
    ================================================== */
    const search =
        document.getElementById(
            "smartofficePenomoranSKFilterSearch"
        );

    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        );

    const tahun =
        document.getElementById(
            "smartofficePenomoranSKFilterTahun"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSKFilterKlaster"
        );

    const status =
        document.getElementById(
            "smartofficePenomoranSKFilterStatus"
        );

    const refreshButton =
        document.getElementById(
            "smartofficePenomoranSKRefreshButton"
        );

    /* ==================================================
       REMOVE REFRESH BUTTON
    ================================================== */
    if(
        refreshButton &&
        smartofficePenomoranSKRefreshHandler
    ){
        refreshButton.removeEventListener(
            "click",
            smartofficePenomoranSKRefreshHandler
        );
    }

    smartofficePenomoranSKRefreshHandler =
        null;

    /* ==================================================
       REMOVE FILTER SEARCH
    ================================================== */
    if(
        search &&
        smartofficePenomoranSKSearchHandler
    ){
        search.removeEventListener(
            "input",
            smartofficePenomoranSKSearchHandler
        );
    }

    /* ==================================================
       REMOVE FILTER NOMOR
    ================================================== */
    if(
        nomor &&
        smartofficePenomoranSKNomorHandler
    ){
        nomor.removeEventListener(
            "change",
            smartofficePenomoranSKNomorHandler
        );
    }

    /* ==================================================
       REMOVE FILTER TAHUN
    ================================================== */
    if(
        tahun &&
        smartofficePenomoranSKTahunHandler
    ){
        tahun.removeEventListener(
            "change",
            smartofficePenomoranSKTahunHandler
        );
    }

    /* ==================================================
       REMOVE FILTER KLASTER
    ================================================== */
    if(
        klaster &&
        smartofficePenomoranSKKlasterHandler
    ){
        klaster.removeEventListener(
            "change",
            smartofficePenomoranSKKlasterHandler
        );
    }

    /* ==================================================
       REMOVE FILTER STATUS
    ================================================== */
    if(
        status &&
        smartofficePenomoranSKStatusHandler
    ){
        status.removeEventListener(
            "change",
            smartofficePenomoranSKStatusHandler
        );
    }

    /* ==================================================
       REMOVE KLASIFIKASI OUTSIDE CLICK
    ================================================== */
    if(
        smartofficePenomoranSKKlasifikasiOutsideClickHandler
    ){
        document.removeEventListener(
            "click",
            smartofficePenomoranSKKlasifikasiOutsideClickHandler
        );
    }

    /* ==================================================
       RESET HANDLER
    ================================================== */
    smartofficePenomoranSKSearchHandler =
        null;

    smartofficePenomoranSKNomorHandler =
        null;

    smartofficePenomoranSKTahunHandler =
        null;

    smartofficePenomoranSKKlasterHandler =
        null;

    smartofficePenomoranSKStatusHandler =
        null;

    smartofficePenomoranSKKlasifikasiOutsideClickHandler =
        null;

    /* ==================================================
       CLOSE ACTION SHEET
    ================================================== */
    smartofficeCloseSKActionSheet();

    /* ==================================================
       CLOSE FORM
    ================================================== */
    smartofficeCloseSKForm();

    /* ==================================================
       FORCE HIDE GLOBAL LOADING
    ================================================== */
    smartofficeForceHideGlobalLoading();

    /* ==================================================
       RESET DATA SK
    ================================================== */
    smartofficeSKAllData =
        [];

    smartofficeSKViewData =
        [];

    smartofficeSKLoaded =
        false;

    /* ==================================================
       RESET MASTER SK
    ================================================== */
    smartofficeSKMaster =
        {
            klasifikasi: [],
            klaster: [],
            statusSK: []
        };

    smartofficeSKMasterLoaded =
        false;

    /* ==================================================
       RESET FORM STATE
    ================================================== */
    smartofficeSKFormMode =
        "add";

    smartofficeSKEditRowIndex =
        null;

    smartofficeSKEditNomorUrut =
        null;
}