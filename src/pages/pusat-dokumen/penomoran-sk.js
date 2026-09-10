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
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";

import {
    smartofficeGetAllSK,
    smartofficeGetSKMaster,
    smartofficePreviewNomorSK,
    smartofficeAddSKDraft
} from "../../services/penomoran-sk.service.js";

import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";


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

/* ======================================================
   STATE FORM SK
====================================================== */
let smartofficeSKMaster =
    {
        klasifikasi: [],
        klaster: [],
        statusSK: []
    };
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
====================================================== */
async function smartofficeInitPenomoranSK(){
    const list =
        document.getElementById(
            "smartofficePenomoranSKList"
        );
    if(
        !list
    ){
        return;
    }

    await smartofficeLoadDataPenomoranSK();
}


/* ======================================================
   LOAD DATA PENOMORAN SK
====================================================== */
async function smartofficeLoadDataPenomoranSK(){

    try{
        const res =
            await smartofficeGetAllSK();

        smartofficeSKAllData =
            res || [];

        smartofficeSKViewData =
            [
                ...smartofficeSKAllData
            ];

        smartofficeInitFilterSK();

        smartofficeSKLoaded =
            true;

        smartofficeRenderPenomoranSK();
    }
    catch(error){
        console.error(
            "Load Data Penomoran SK Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat data Surat Keputusan",
            "error"
        );
    }
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
                                        <span class="smartoffice-penomoransk-action-arrow">
                                            ›
                                        </span>
                                    </button>

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
    if(
        !list
    ){
        return;
    }

    /* =========================
       LIHAT SK
    ========================= */
    list
        .querySelectorAll(
            ".smartoffice-penomoransk-item-action"
        )
        .forEach(function(button){
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

                    window.open(
                        file,
                        "_blank"
                    );
                }
            );
        });

    /* =========================
       MENU AKSI
    ========================= */
    list
        .querySelectorAll(
            ".smartoffice-penomoransk-item-more"
        )
        .forEach(function(button){

            button.addEventListener(
                "click",
                function(){
                    const rowIndex =
                        button.dataset.rowIndex;

                    const nomorSK =
                        button.dataset.nomorSk || "";

                    smartofficeShowSKActionSheet(
                        rowIndex,
                        nomorSK
                    );
                }
            );
        });
}


/* ======================================================
   BOTTOM SHEET AKSI SK
====================================================== */
function smartofficeShowSKActionSheet(
    rowIndex,
    nomorSK
){
    smartofficeCloseSKActionSheet();

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

    requestAnimationFrame(function(){
        sheet.classList.add(
            "active"
        );
    });

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
                function(){
                    const action =
                        button.dataset.action;

                    const row =
                        button.dataset.rowIndex;

                    smartofficeCloseSKActionSheet();

                    if(
                        action === "unlock"
                    ){
                        smartofficeShowToast(
                            "Fitur Buka Kunci siap digunakan.",
                            "info"
                        );
                    }

                    if(
                        action === "edit"
                    ){
                        smartofficeShowToast(
                            "Fitur Ubah SK siap digunakan.",
                            "info"
                        );
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
    if(
        !smartofficeSKAllData.length
    ){
        return;
    }

    /* =========================
       NOMOR SK
    ========================= */
    const nomorList =
        [
            ...new Set(
                smartofficeSKAllData
                    .map(function(row){
                        return row.nomorSK;
                    })
                    .filter(Boolean)
            )
        ];

    /* =========================
       TAHUN SK
    ========================= */
    const tahunList =
        [
            ...new Set(
                smartofficeSKAllData
                    .map(function(row){
                        if(
                            !row.tanggalSK
                        ){
                            return "";
                        }

                        return String(
                            row.tanggalSK
                        ).substring(0,4);

                    })
                    .filter(Boolean)
            )
        ]
        .sort(function(a,b){
            return b - a;
        });

    /* =========================
       KLASTER
    ========================= */
    const klasterList =
        [
            ...new Set(
                smartofficeSKAllData
                    .map(function(row){
                        return row.klaster;
                    })
                    .filter(Boolean)
            )
        ];

    /* =========================
       ISI SELECT
    ========================= */
    smartofficeFillSKSelect(
        "smartofficePenomoranSKFilterNomor",
        nomorList,
        "Semua"
    );

    smartofficeFillSKSelect(
        "smartofficePenomoranSKFilterTahun",
        tahunList,
        "Semua"
    );

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


/* =========================
   APPLY FILTER SK
========================= */
function smartofficeApplyFilterSK(){
    const nomor =
        document.getElementById(
            "smartofficePenomoranSKFilterNomor"
        )?.value || "";

    const tahun =
        document.getElementById(
            "smartofficePenomoranSKFilterTahun"
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
            .toLowerCase()
            .trim() || "";

    smartofficeSKViewData =
        smartofficeSKAllData.filter(
            function(row){

                /* =========================
                   NOMOR SK
                ========================= */
                if(
                    nomor &&
                    row.nomorSK !== nomor
                ){
                    return false;
                }

                /* =========================
                   TAHUN
                ========================= */
                if(
                    tahun
                ){
                    const tahunSK =
                        row.tanggalSK
                            ? String(
                                row.tanggalSK
                            ).substring(0,4)
                            : "";

                    if(
                        tahunSK !== tahun
                    ){
                        return false;
                    }
                }

                /* =========================
                   KLASTER
                ========================= */
                if(
                    klaster &&
                    row.klaster !== klaster
                ){
                    return false;
                }

                /* =========================
                   STATUS SK
                ========================= */
                if(
                    status &&
                    row.statusSK !== status
                ){
                    return false;
                }

                /* =========================
                   CARI TENTANG
                ========================= */
                if(
                    search &&
                    !String(
                        row.tentang || ""
                    )
                    .toLowerCase()
                    .includes(search)
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

    if(search){
        search.value = "";
    }

    if(nomor){
        nomor.value = "";
    }

    if(tahun){
        tahun.value = "";
    }

    if(klaster){
        klaster.value = "";
    }

    if(status){
        status.value = "";
    }

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
    ================================================== */
    smartofficePenomoranSKTahunHandler =
        smartofficeApplyFilterSK;
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
}


/* ======================================================
   EVENT TAMBAH SK
====================================================== */
function smartofficeInitTambahSKEvent(){
    const button =
        document.getElementById(
            "smartofficePenomoranSKTambahButton"
        );
    if(!button){
        return;
    }

    button.addEventListener(
        "click",
        smartofficeOpenTambahSK
    );
}


/* ======================================================
   BUKA MODAL TAMBAH SK
====================================================== */
async function smartofficeOpenTambahSK(){

    smartofficeSKFormMode =
        "add";

    smartofficeSKEditRowIndex =
        null;

    smartofficeSKEditNomorUrut =
        null;

    /* =========================
       RENDER FORM
    ========================= */
    const body =
        document.getElementById(
            "smartofficePenomoranSKFormBody"
        );

    if(!body){
        return;
    }

    body.innerHTML = `
        <form
            id="smartofficePenomoranSKForm"
            class="smartoffice-penomoransk-form"
        >
            <!-- =========================
                BARIS 1
                PREVIEW NOMOR + KODE
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
                    —
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
                >
            </div>

            <!-- ========================= 
                BARIS 2 
                KLASIFIKASI FULL WIDTH 
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
                            Pilih klasifikasi
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

                <!-- VALUE KLASIFIKASI -->
                <input
                    type="hidden"
                    id="smartofficeSKKlasifikasi"
                    required
                >
            </div>

            <!-- =========================
                BARIS 3
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
                BARIS 4
                TENTANG FULL WIDTH
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
                ></textarea>
            </div>

            <!-- =========================
                BARIS 5
                UPLOAD FULL WIDTH
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
                            PDF • DOC • DOCX • Maksimal 5 Mb
                        </small>
                    </div>
                    <div
                        class="smartoffice-penomoransk-upload-file"
                        id="smartofficePenomoranSKUploadFileName"
                    >
                        Belum ada file dipilih
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
                Simpan SK
            </button>
        </form>
    `;

    /* =========================
       BUKA MODAL DULU
       CONTEK BUKU SURAT
    ========================= */
    const modal =
        document.getElementById(
            "smartofficePenomoranSKFormModal"
        );
    if(modal){
        modal.style.display =
            "flex";
    }

    /* =========================
       INIT FORM EVENT
    ========================= */
    smartofficeInitSKFormEvent();
    smartofficeInitUploadSKEvent();

    /* =========================
       LOAD MASTER
    ========================= */
    await smartofficeLoadSKMaster();  
}


/* ======================================================
   MASTER DATA SK
====================================================== */
async function smartofficeLoadSKMaster(){

    try{
        const master =
            await smartofficeGetSKMaster();

        smartofficeSKMaster =
            master || {};

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
       UPLOAD FILE PDF
    ================================================== */
    if(
        fileInput &&
        fileInput.files &&
        fileInput.files[0]
    ){
        const file =
            fileInput.files[0];
        if(
            file.type !==
            "application/pdf"
        ){
            smartofficeShowToast(
                "File SK harus berformat PDF.",
                "error"
            );

            return;
        }

        try{
            const base64 =
                await smartofficeConvertFileToBase64(
                    file
                );

            filePayload = {
                name:
                    file.name,
                type:
                    file.type,
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

        smartofficeShowToast(
            "Surat Keputusan berhasil disimpan.",
            "success"
        );

        smartofficeCloseSKForm();
        await smartofficeLoadDataPenomoranSK();
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
                "Simpan SK";
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
       FILTER PENOMORAN SK
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
       RESET HANDLER FILTER
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

    /* ==================================================
       CLOSE ACTION MODAL
    ================================================== */
    smartofficeCloseSKActionSheet();

    /* ==================================================
       RESET DATA PENOMORAN SK
    ================================================== */
    smartofficeSKAllData =
        [];

    smartofficeSKViewData =
        [];

    smartofficeSKLoaded =
        false;
}