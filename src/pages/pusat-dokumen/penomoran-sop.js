/* ======================================================
   SMART OFFICE
   PUSAT DOKUMEN — PENOMORAN SOP
====================================================== */

/* ======================================================
   IMPORT CORE
====================================================== */
import {
    smartofficeGetSession
} from "../../core/session.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading,
    smartofficeForceHideGlobalLoading
} from "../../components/loading/loading.js";


/* ======================================================
   SERVICE PENOMORAN SOP
====================================================== */
import {
    smartofficeGetAllSOP,
    smartofficeGetSOPMaster,
    smartofficePreviewNomorSOP,
    smartofficeAddSOPDraft,
    smartofficeBukaLockSOP,
    smartofficeHapusSOP
} from "../../services/penomoran-sop.service.js";


/* ======================================================
   GLOBAL STATE SOP
====================================================== */
let smartofficeSOPAllData = [];
let smartofficeSOPViewData = [];

let smartofficeSOPMaster = null;

let smartofficeSOPLoaded = false;
let smartofficeSOPIsEdit = false;

let smartofficeSOPEditRowIndex = null;
let smartofficeSOPEditNomorUrut = null;

let smartofficeSOPActiveYear = "";

let smartofficeSOPSearchHandler = null;
let smartofficeSOPTahunHandler = null;
let smartofficeSOPKlasterHandler = null;
let smartofficeSOPResetHandler = null;
let smartofficeSOPTambahHandler = null;
let smartofficeSOPFormCloseHandler = null;
let smartofficeSOPFormOverlayHandler = null;

let smartofficeSOPEventsBound = false;


/* ======================================================
   LOADING SOP
====================================================== */
function smartofficeShowLoadingSOP(
    show
){

    const list =
        document.getElementById(
            "smartofficePenomoranSOPList"
        );
    if(
        !list
    ){
        return;
    }

    if(show){
        list.innerHTML = `
            <div class="smartoffice-loading">
                <div class="smartoffice-loading-spinner"></div>

                <div class="smartoffice-loading-text">
                    Memuat data SOP...
                </div>
            </div>
        `;
    }
}


/* ======================================================
   INIT PENOMORAN SOP
====================================================== */
export async function smartofficeInitPenomoranSOP(){

    console.log(
        "SMART OFFICE — INIT PENOMORAN SOP"
    );

    /* ==================================================
       BIND EVENT
       HANYA SEKALI
    ================================================== */
    if(
        !smartofficeSOPEventsBound
    ){
        smartofficeSOPBindEvents();
        smartofficeSOPEventsBound =
            true;
    }

    /* ==================================================
       LOAD MASTER
    ================================================== */
    await smartofficeSOPLoadMaster();

    /* ==================================================
       RENDER FILTER
    ================================================== */
    smartofficeSOPRenderTahun();
    smartofficeSOPRenderKlaster();

    /* ==================================================
       EMPTY STATE
    ================================================== */
    if(
        !smartofficeSOPLoaded
    ){
        smartofficeSOPRenderEmptyState();
    }
}


/* ======================================================
   LOAD DATA SOP
====================================================== */
export async function smartofficeLoadPenomoranSOP(){

    try{
        smartofficeShowLoadingSOP(
            true
        );

        const data =
            await smartofficeGetAllSOP();

        smartofficeSOPAllData =
            Array.isArray(data)
                ? data
                : [];

        smartofficeSOPLoaded =
            true;

        console.log(
            "DATA SOP:",
            smartofficeSOPAllData.length
        );

        smartofficeSOPRenderTahun();
        smartofficeSOPRenderKlaster();
        smartofficeSOPApplyFilter();
    }
    catch(error){
        console.error(
            "LOAD SOP ERROR:",
            error
        );

        smartofficeSOPRenderError(
            error.message ||
            "Gagal memuat data SOP."
        );
    }
}


/* ======================================================
   LOAD MASTER SOP
====================================================== */
async function smartofficeSOPLoadMaster(){

    if(
        smartofficeSOPMaster
    ){
        return smartofficeSOPMaster;
    }

    try{
        const master =
            await smartofficeGetSOPMaster();

        smartofficeSOPMaster =
            master || {};

        console.log(
            "MASTER SOP:",
            smartofficeSOPMaster
        );

        return smartofficeSOPMaster;
    }catch(error){
        console.error(
            "LOAD MASTER SOP ERROR:",
            error
        );

        smartofficeSOPMaster = {};

        return {};
    }
}


/* ======================================================
   BIND EVENTS
====================================================== */
function smartofficeSOPBindEvents(){

    const search =
        document.getElementById(
            "smartofficePenomoranSOPFilterSearch"
        );

    const tahun =
        document.getElementById(
            "smartofficePenomoranSOPFilterTahun"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPFilterKlaster"
        );

    const reset =
        document.getElementById(
            "smartofficePenomoranSOPResetButton"
        );

    const tambah =
        document.getElementById(
            "smartofficePenomoranSOPTambahButton"
        );

    const close =
        document.getElementById(
            "smartofficePenomoranSOPFormClose"
        );

    const overlay =
        document.getElementById(
            "smartofficePenomoranSOPFormOverlay"
        );

    /* ==================================================
       SEARCH
    ================================================== */
    if(search){
        smartofficeSOPSearchHandler =
            smartofficeSOPDebounce(
                function(){
                    smartofficeSOPApplyFilter();
                },
                300
            );
        search.addEventListener(
            "input",
            smartofficeSOPSearchHandler
        );
    }

    /* ==================================================
       TAHUN
    ================================================== */
    if(tahun){
        smartofficeSOPTahunHandler =
            function(){
                smartofficeSOPActiveYear =
                    tahun.value || "";

                smartofficeSOPApplyFilter();
            };
        tahun.addEventListener(
            "change",
            smartofficeSOPTahunHandler
        );
    }

    /* ==================================================
       KLASTER
    ================================================== */
    if(klaster){
        smartofficeSOPKlasterHandler =
            function(){
                smartofficeSOPApplyFilter();
            };
        klaster.addEventListener(
            "change",
            smartofficeSOPKlasterHandler
        );
    }

    /* ==================================================
       RESET
    ================================================== */
    if(reset){
        smartofficeSOPResetHandler =
            function(){
                smartofficeSOPResetFilter();
            };
        reset.addEventListener(
            "click",
            smartofficeSOPResetHandler
        );
    }

    /* ==================================================
       TAMBAH SOP
    ================================================== */
    if(tambah){
        smartofficeSOPTambahHandler =
            function(){
                smartofficeOpenAddSOP();
            };

        tambah.addEventListener(
            "click",
            smartofficeSOPTambahHandler
        );
    }

    /* ==================================================
       CLOSE FORM
    ================================================== */
    if(close){
        smartofficeSOPFormCloseHandler =
            function(){
                smartofficeCloseSOPForm();
            };
        close.addEventListener(
            "click",
            smartofficeSOPFormCloseHandler
        );
    }

    /* ==================================================
       OVERLAY
    ================================================== */
    if(overlay){
        smartofficeSOPFormOverlayHandler =
            function(){
                smartofficeCloseSOPForm();
            };
        overlay.addEventListener(
            "click",
            smartofficeSOPFormOverlayHandler
        );
    }
}


/* ======================================================
   RENDER TAHUN
====================================================== */
function smartofficeSOPRenderTahun(){

    const select =
        document.getElementById(
            "smartofficePenomoranSOPFilterTahun"
        );
    if(!select){
        return;
    }

    const currentValue =
        select.value ||
        smartofficeSOPActiveYear ||
        "";

    const tahunSet =
        new Set();

    smartofficeSOPAllData.forEach(
        row => {
            const tahun =
                smartofficeSOPGetYear(
                    row.tanggalSOP
                );
            if(tahun){
                tahunSet.add(tahun);
            }
        }
    );

    const tahunList =
        Array.from(
            tahunSet
        ).sort(
            (a,b) =>
                Number(b) -
                Number(a)
        );

    select.innerHTML = `
        <option value="">
            Pilih tahun
        </option>
    `;

    tahunList.forEach(
        tahun => {
            const option =
                document.createElement(
                    "option"
                );

            option.value = tahun;
            option.textContent = tahun;
            select.appendChild(
                option
            );
        }
    );

    if(
        currentValue &&
        tahunList.includes(
            String(currentValue)
        )
    ){
        select.value =
            String(currentValue);
    }else{
        select.value = "";
    }
}


/* ======================================================
   RENDER KLASTER
====================================================== */
function smartofficeSOPRenderKlaster(){

    const select =
        document.getElementById(
            "smartofficePenomoranSOPFilterKlaster"
        );
    if(!select){
        return;
    }

    const currentValue =
        select.value || "";

    const source =
        smartofficeSOPMaster?.klaster?.length
            ? smartofficeSOPMaster.klaster
            : smartofficeSOPAllData.map(
                row => row.klaster
            );

    const klasterList =
        Array.from(
            new Set(
                source
                    .map(
                        value =>
                            String(
                                value || ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ).sort(
            (a,b) =>
                a.localeCompare(
                    b,
                    "id",
                    {
                        numeric: true
                    }
                )
        );

    select.innerHTML = `
        <option value="">
            Semua
        </option>
    `;

    klasterList.forEach(
        klaster => {
            const option =
                document.createElement(
                    "option"
                );

            option.value = klaster;
            option.textContent = klaster;
            select.appendChild(
                option
            );
        }
    );

    if(
        currentValue &&
        klasterList.includes(
            currentValue
        )
    ){
        select.value =
            currentValue;
    }
}


/* ======================================================
   APPLY FILTER SOP

   FILTER:
   - NOMOR SOP / JUDUL
   - TAHUN
   - KLASTER
====================================================== */
function smartofficeSOPApplyFilter(){

    const search =
        (
            document.getElementById(
                "smartofficePenomoranSOPFilterSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();

    const tahun =
        document.getElementById(
            "smartofficePenomoranSOPFilterTahun"
        )?.value || "";

    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPFilterKlaster"
        )?.value || "";

    smartofficeSOPActiveYear =
        tahun;

    smartofficeSOPViewData =
        smartofficeSOPAllData.filter(
            row => {

                /* ======================================
                   SEARCH NOMOR / JUDUL
                ====================================== */
                if(search){
                    const nomor =
                        String(
                            row.nomorSOP || ""
                        )
                        .toLowerCase();

                    const judul =
                        String(
                            row.judul || ""
                        )
                        .toLowerCase();

                    if(
                        !nomor.includes(search) &&
                        !judul.includes(search)
                    ){
                        return false;
                    }
                }

                /* ======================================
                   TAHUN
                   DIAMBIL DARI TANGGAL SOP
                ====================================== */
                if(tahun){
                    const rowTahun =
                        smartofficeSOPGetYear(
                            row.tanggalSOP
                        );
                    if(
                        rowTahun !==
                        String(tahun)
                    ){
                        return false;
                    }
                }

                /* ======================================
                   KLASTER
                ====================================== */
                if(klaster){
                    if(
                        String(
                            row.klaster || ""
                        ).trim() !==
                        String(
                            klaster
                        ).trim()
                    ){
                        return false;
                    }
                }

                return true;
            }
        );

    smartofficeSOPSortData();
    smartofficeSOPRenderList();
}


/* ======================================================
   SORT SOP

   TERBARU DULU BERDASARKAN TANGGAL SOP
====================================================== */
function smartofficeSOPSortData(){

    smartofficeSOPViewData.sort(
        function(a,b){
            const dateA =
                smartofficeSOPParseDate(
                    a.tanggalSOP
                );

            const dateB =
                smartofficeSOPParseDate(
                    b.tanggalSOP
                );

            return (
                dateB -
                dateA
            );
        }
    );
}


/* ======================================================
   RENDER PENOMORAN SOP
   SAMA DENGAN LAYOUT PENOMORAN SK
====================================================== */
function smartofficeSOPRenderList(){

    const list =
        document.getElementById(
            "smartofficePenomoranSOPList"
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
        !smartofficeSOPViewData.length
    ){
        list.innerHTML = `
            <div class="smartoffice-empty">
                <div class="smartoffice-empty-title">
                    Belum ada SOP
                </div>

                <div class="smartoffice-empty-text">
                    Data Standar Operasional Prosedur belum tersedia.
                </div>
            </div>
        `;

        return;
    }

    /* =========================
       NAMA KLASTER
       SAMA DENGAN SK
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
        smartofficeSOPViewData
            .map(
                function(item){
                    const klaster =
                        item.klaster ||
                        "-";

                    const nama =
                        namaKlaster[klaster] ||
                        "";

                    return `
                        <div
                            class="
                                smartoffice-penomoransk-item
                                smartoffice-penomoransk-${
                                    klaster
                                        .toLowerCase()
                                        .replace("-", "")
                                }
                            "
                        >
                            <!-- =========================
                                 HEADER
                            ========================= -->
                            <div
                                class="
                                    smartoffice-penomoransk-item-header
                                "
                            >
                                <div
                                    class="
                                        smartoffice-penomoransk-item-title-wrap
                                    "
                                >
                                    <!-- ICON -->
                                    <div
                                        class="
                                            smartoffice-penomoransk-item-icon
                                        "
                                    >
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

                                    <!-- NOMOR + TANGGAL -->
                                    <div
                                        class="
                                            smartoffice-penomoransk-item-title-content
                                        "
                                    >
                                        <div
                                            class="
                                                smartoffice-penomoransk-item-nomor
                                            "
                                        >
                                            ${
                                                smartofficeSOPEscape(
                                                    item.nomorSOP || "-"
                                                )
                                            }
                                        </div>

                                        <div
                                            class="
                                                smartoffice-penomoransk-item-tanggal
                                            "
                                        >
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
                                            ${
                                                smartofficeFormatTanggalSOP(
                                                    item.tanggalSOP
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>

                                <!-- STATUS SOP -->
                                <div
                                    class="
                                        smartoffice-penomoransk-item-status
                                    "
                                >
                                    <span
                                        class="
                                            smartoffice-penomoransk-status-dot
                                        "
                                    ></span>
                                    ${
                                        smartofficeSOPEscape(
                                            item.statusSOP || "-"
                                        )
                                    }
                                </div>
                            </div>

                            <!-- =========================
                                 JUDUL SOP
                            ========================= -->
                            <div
                                class="
                                    smartoffice-penomoransk-item-tentang
                                "
                            >
                                <div
                                    class="
                                        smartoffice-penomoransk-item-label
                                    "
                                >
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
                                    JUDUL SOP
                                </div>

                                <div
                                    class="
                                        smartoffice-penomoransk-item-value
                                    "
                                >
                                    ${
                                        smartofficeSOPEscape(
                                            item.judul || "-"
                                        )
                                    }
                                </div>
                            </div>

                            <!-- =========================
                                 INFORMASI BAWAH
                            ========================= -->
                            <div
                                class="
                                    smartoffice-penomoransk-item-info
                                "
                            >
                                <!-- KLASTER -->
                                <div
                                    class="
                                        smartoffice-penomoransk-item-info-box
                                    "
                                >
                                    <div
                                        class="
                                            smartoffice-penomoransk-item-label
                                        "
                                    >
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

                                    <div
                                        class="
                                            smartoffice-penomoransk-item-klaster-value
                                        "
                                    >
                                        ${
                                            smartofficeSOPEscape(
                                                klaster
                                            )
                                        }

                                        ${
                                            nama
                                                ? ` • ${
                                                    smartofficeSOPEscape(
                                                        nama
                                                    )
                                                }`
                                                : ""
                                        }
                                    </div>
                                </div>

                                <!-- REVISI -->
                                <div
                                    class="
                                        smartoffice-penomoransk-item-info-box
                                    "
                                >
                                    <div
                                        class="
                                            smartoffice-penomoransk-item-label
                                        "
                                    >
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
                                        REVISI
                                    </div>

                                    <div
                                        class="
                                            smartoffice-penomoransk-item-klasifikasi-value
                                        "
                                    >
                                        ${
                                            smartofficeSOPEscape(
                                                item.revisi ?? "-"
                                            )
                                        }
                                    </div>
                                </div>

                                <!-- ACTION -->
                                <div
                                    class="
                                        smartoffice-penomoransk-item-action-wrap
                                    "
                                >
                                    <button
                                        type="button"
                                        class="
                                            smartoffice-penomoransk-item-action
                                        "
                                        data-sop-file="${
                                            smartofficeSOPEscapeAttribute(
                                                item.file || ""
                                            )
                                        }"
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

                                        <span>
                                            Lihat SOP
                                        </span>

                                        <span
                                            class="
                                                smartoffice-penomoransk-action-arrow
                                            "
                                        >
                                            ›
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        class="
                                            smartoffice-penomoransk-item-more
                                        "
                                        data-row-index="${
                                            item.rowIndex
                                        }"
                                        data-nomor-sop="${
                                            smartofficeSOPEscapeAttribute(
                                                item.nomorSOP || ""
                                            )
                                        }"
                                        aria-label="Aksi SOP"
                                        title="Aksi SOP"
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

    smartofficeInitPenomoranSOPAction();
}


/* ======================================================
   FORMAT TANGGAL SOP
====================================================== */
function smartofficeFormatTanggalSOP(
    tanggal
){
    if(
        !tanggal
    ){
        return "-";
    }

    const text =
        String(
            tanggal
        ).trim();

    /* YYYY-MM-DD */
    const iso =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );
    if(iso){
        return `${iso[3]}-${iso[2]}-${iso[1]}`;
    }

    /* DD-MM-YYYY */
    const dmy =
        text.match(
            /^(\d{2})-(\d{2})-(\d{4})/
        );
    if(dmy){
        return text;
    }

    return text;
}


/* ======================================================
   AKSI PENOMORAN SOP
   SAMA DENGAN PENOMORAN SK
====================================================== */
function smartofficeInitPenomoranSOPAction(){

    const list =
        document.getElementById(
            "smartofficePenomoranSOPList"
        );
    if(
        !list
    ){
        return;
    }

    /* ==================================================
       ROLE USER
    ================================================== */
    const sessionData =
        typeof smartofficeGetSession === "function"
            ? smartofficeGetSession()
            : null;

    const userRole =
        String(
            sessionData?.role || ""
        )
        .trim()
        .toUpperCase();

    /* ==================================================
       LIHAT SOP
    ================================================== */
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
                            button.dataset.sopFile || "";
                        if(
                            !file
                        ){
                            smartofficeShowToast(
                                "File SOP belum tersedia.",
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

            }
        );

    /* ==================================================
       MENU MORE / TITIK 3
    ================================================== */
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

                        const nomorSOP =
                            button.dataset.nomorSop || "";

                        smartofficeShowSOPActionSheet(
                            rowIndex,
                            nomorSOP
                        );
                    }
                );
            }
        );
}


/* ======================================================
   BOTTOM SHEET AKSI SOP
   ID SOP = NOMOR SOP
====================================================== */
function smartofficeShowSOPActionSheet(
    rowIndex,
    nomorSOP
){
    smartofficeCloseSOPActionSheet();

    /* ==================================================
       AMBIL DATA SOP
    ================================================== */
    const rowData =
        smartofficeSOPAllData.find(
            function(item){

                return String(
                    item.rowIndex
                ) ===
                String(
                    rowIndex
                );
            }
        );

    if(
        !rowData
    ){
        smartofficeShowToast(
            "Data SOP tidak ditemukan.",
            "error"
        );

        return;
    }

    const status =
        String(
            rowData.status || ""
        )
        .trim()
        .toUpperCase();

    const isLocked =
        status === "LOCK";

    /* ==================================================
       BUAT SHEET
    ================================================== */
    const sheet =
        document.createElement(
            "div"
        );
    sheet.id =
        "smartofficePenomoranSOPActionSheet";

    sheet.className =
        "smartoffice-penomoransk-action-sheet";

    sheet.innerHTML = `
        <div
            class="
                smartoffice-penomoransk-action-overlay
            "
        ></div>

        <div
            class="
                smartoffice-penomoransk-action-panel
            "
        >
            <div
                class="
                    smartoffice-penomoransk-action-handle
                "
            ></div>

            <div
                class="
                    smartoffice-penomoransk-action-title
                "
            >
                Aksi SOP
            </div>

            <div
                class="
                    smartoffice-penomoransk-action-number
                "
            >
                ${smartofficeSOPEscape(
                    nomorSOP || "-"
                )}
            </div>

            ${
                isLocked
                ? `
                    <!-- =========================
                         BUKA KUNCI
                    ========================== -->
                    <button
                        type="button"
                        class="
                            smartoffice-penomoransk-action-option
                        "
                        data-action="unlock"
                    >
                        <span
                            class="
                                smartoffice-penomoransk-action-option-icon
                            "
                        >
                            🔓
                        </span>

                        <span
                            class="
                                smartoffice-penomoransk-action-option-content
                            "
                        >
                            <strong>
                                Buka Kunci
                            </strong>

                            <small>
                                Izinkan perubahan data SOP
                            </small>
                        </span>
                    </button>
                `

                : `
                    <!-- =========================
                         UBAH SOP
                    ========================== -->
                    <button
                        type="button"
                        class="
                            smartoffice-penomoransk-action-option
                        "
                        data-action="edit"
                    >
                        <span
                            class="
                                smartoffice-penomoransk-action-option-icon
                            "
                        >
                            ✎
                        </span>

                        <span
                            class="
                                smartoffice-penomoransk-action-option-content
                            "
                        >
                            <strong>
                                Ubah SOP
                            </strong>

                            <small>
                                Edit data Standar Operasional Prosedur
                            </small>
                        </span>
                    </button>

                    <!-- =========================
                         HAPUS SOP
                    ========================== -->
                    <button
                        type="button"
                        class="
                            smartoffice-penomoransk-action-option
                        "
                        data-action="delete"
                    >
                        <span
                            class="
                                smartoffice-penomoransk-action-option-icon
                            "
                        >
                            🗑️
                        </span>

                        <span
                            class="
                                smartoffice-penomoransk-action-option-content
                            "
                        >
                            <strong>
                                Hapus SOP
                            </strong>

                            <small>
                                Hapus data dan file SOP
                            </small>
                        </span>
                    </button>
                `
            }

            <!-- =========================
                 BATAL
            ========================== -->
            <button
                type="button"
                class="
                    smartoffice-penomoransk-action-cancel
                "
            >
                Batal
            </button>
        </div>
    `;

    document.body.appendChild(
        sheet
    );

    /* ==================================================
       ANIMASI OPEN
    ================================================== */
    requestAnimationFrame(
        function(){
            sheet.classList.add(
                "active"
            );
        }
    );

    /* ==================================================
       OVERLAY
    ================================================== */
    const overlay =
        sheet.querySelector(
            ".smartoffice-penomoransk-action-overlay"
        );
    if(
        overlay
    ){
        overlay.addEventListener(
            "click",
            smartofficeCloseSOPActionSheet
        );
    }

    /* ==================================================
       BATAL
    ================================================== */
    const cancel =
        sheet.querySelector(
            ".smartoffice-penomoransk-action-cancel"
        );
    if(
        cancel
    ){
        cancel.addEventListener(
            "click",
            smartofficeCloseSOPActionSheet
        );
    }

    /* ==================================================
       ACTION
    ================================================== */
    sheet
        .querySelectorAll(
            ".smartoffice-penomoransk-action-option"
        )
        .forEach(
            function(button){
                button.addEventListener(
                    "click",
                    async function(){
                        const action =
                            button.dataset.action;

                        /* =========================
                           BUKA KUNCI
                        ========================= */
                        if(
                            action ===
                            "unlock"
                        ){
                            button.disabled =
                                true;

                            smartofficeCloseSOPActionSheet();
                            smartofficeShowGlobalLoading(
                                "Membuka kunci SOP..."
                            );

                            try{
                                await smartofficeBukaLockSOP(
                                    nomorSOP
                                );

                                await smartofficeLoadPenomoranSOP();

                                smartofficeShowToast(
                                    "SOP berhasil dibuka.",
                                    "success"
                                );
                            }
                            catch(error){
                                console.error(
                                    "Buka Lock SOP Error:",
                                    error
                                );

                                smartofficeShowToast(
                                    error.message ||
                                    "Gagal membuka kunci SOP.",
                                    "error"
                                );
                            }
                            finally{
                                smartofficeHideGlobalLoading();
                            }

                            return;
                        }

                        /* =========================
                           UBAH SOP
                        ========================= */
                        if(
                            action ===
                            "edit"
                        ){
                            smartofficeCloseSOPActionSheet();

                            /* =====================
                               DOUBLE CHECK LOCK
                            ===================== */
                            const latestRow =
                                smartofficeSOPAllData.find(
                                    function(item){

                                        return String(
                                            item.rowIndex
                                        ) ===
                                        String(
                                            rowIndex
                                        );
                                    }
                                );

                            const latestStatus =
                                String(
                                    latestRow?.status || ""
                                )
                                .trim()
                                .toUpperCase();

                            if(
                                latestStatus ===
                                "LOCK"
                            ){
                                smartofficeShowToast(
                                    "SOP masih terkunci. Buka Kunci terlebih dahulu.",
                                    "error"
                                );

                                return;
                            }

                            smartofficeOpenEditSOP(
                                rowIndex
                            );

                            return;
                        }

                        /* =========================
                           HAPUS SOP
                        ========================= */
                        if(
                            action ===
                            "delete"
                        ){
                            smartofficeCloseSOPActionSheet();

                            await smartofficeSOPHapus(
                                nomorSOP
                            );

                            return;
                        }
                    }
                );
            }
        );
}


/* ======================================================
   TUTUP BOTTOM SHEET SOP
====================================================== */
function smartofficeCloseSOPActionSheet(){

    const sheet =
        document.getElementById(
            "smartofficePenomoranSOPActionSheet"
        );
    if(
        !sheet
    ){
        return;
    }

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


/* ======================================================
   OPEN ADD SOP
====================================================== */
function smartofficeOpenAddSOP(){
    smartofficeSOPIsEdit = false;
    smartofficeSOPEditRowIndex = null;
    smartofficeSOPEditNomorUrut = null;

    const modal =
        document.getElementById(
            "smartofficePenomoranSOPFormModal"
        );

    const title =
        document.getElementById(
            "smartofficePenomoranSOPFormTitle"
        );

    const body =
        document.getElementById(
            "smartofficePenomoranSOPFormBody"
        );

    if(!modal || !body){
        return;
    }

    if(title){

        title.textContent =
            "Tambah SOP";
    }

    smartofficeRenderSOPForm();

    modal.classList.add(
        "is-open"
    );

    document.body.classList.add(
        "smartoffice-modal-open"
    );
}


/* ======================================================
   OPEN EDIT SOP
====================================================== */
function smartofficeOpenEditSOP(
    rowIndex
){
    const item =
        smartofficeSOPAllData.find(
            row =>
                Number(row.rowIndex) ===
                Number(rowIndex)
        );
    if(!item){
        smartofficeShowToast(
            "Data SOP tidak ditemukan.",
            "error"
        );

        return;
    }

    if(
        String(
            item.status || ""
        ).toUpperCase() ===
        "LOCK"
    ){
        smartofficeShowToast(
            "SOP masih terkunci.",
            "warning"
        );

        return;
    }

    smartofficeSOPIsEdit = true;
    smartofficeSOPEditRowIndex =
        Number(
            item.rowIndex
        );

    const nomor =
        String(
            item.nomorSOP || ""
        );

    smartofficeSOPEditNomorUrut =
        nomor.split("/")[0] || "";

    const modal =
        document.getElementById(
            "smartofficePenomoranSOPFormModal"
        );

    const title =
        document.getElementById(
            "smartofficePenomoranSOPFormTitle"
        );
    if(title){

        title.textContent =
            "Edit SOP";
    }

    smartofficeRenderSOPForm(
        item
    );

    modal?.classList.add(
        "is-open"
    );

    document.body.classList.add(
        "smartoffice-modal-open"
    );
}


/* ======================================================
   RENDER FORM SOP
====================================================== */
function smartofficeRenderSOPForm(
    item = null
){
    const body =
        document.getElementById(
            "smartofficePenomoranSOPFormBody"
        );
    if(!body){
        return;
    }

    const tanggal =
        item
            ? smartofficeSOPToInputDate(
                item.tanggalSOP
            )
            : "";

    body.innerHTML = `
        <form
            id="smartofficePenomoranSOPForm"
            class="smartoffice-penomoransk-form"
        >
            <input
                type="hidden"
                id="smartofficePenomoranSOPRowIndex"
                value="${
                    item?.rowIndex || ""
                }"
            >

            <!-- NOMOR SOP -->
            <div class="smartoffice-form-group">
                <label>
                    Nomor SOP
                </label>

                <input
                    type="text"
                    id="smartofficePenomoranSOPNomor"
                    value="${smartofficeSOPEscapeAttribute(
                        item?.nomorSOP || ""
                    )}"
                    readonly
                >
            </div>

            <!-- TANGGAL SOP -->
            <div class="smartoffice-form-group">
                <label>
                    Tanggal SOP
                </label>

                <input
                    type="date"
                    id="smartofficePenomoranSOPTanggal"
                    value="${tanggal}"
                    required
                >
            </div>

            <!-- JUDUL -->
            <div class="smartoffice-form-group">
                <label>
                    Judul SOP
                </label>

                <input
                    type="text"
                    id="smartofficePenomoranSOPJudul"
                    value="${smartofficeSOPEscapeAttribute(
                        item?.judul || ""
                    )}"
                    placeholder="Masukkan judul SOP"
                    required
                >
            </div>

            <!-- KLASTER -->
            <div class="smartoffice-form-group">
                <label>
                    Klaster
                </label>

                <select
                    id="smartofficePenomoranSOPKlaster"
                    required
                >
                    <option value="">
                        -- Pilih Klaster --
                    </option>
                </select>
            </div>

            <!-- REVISI -->
            <div class="smartoffice-form-group">
                <label>
                    Revisi Ke
                </label>

                <select
                    id="smartofficePenomoranSOPRevisi"
                >
                    <option value="">
                        -- Pilih Revisi --
                    </option>
                </select>
            </div>

            <!-- STATUS SOP -->
            <div class="smartoffice-form-group">
                <label>
                    Status SOP
                </label>

                <select
                    id="smartofficePenomoranSOPStatus"
                    required
                >
                    <option value="">
                        -- Pilih Status SOP --
                    </option>
                </select>
            </div>

            <!-- FILE -->
            <div class="smartoffice-form-group">
                <label>
                    File SOP
                </label>

                <input
                    type="file"
                    id="smartofficePenomoranSOPFile"
                    accept=".pdf,.doc,.docx"
                >
                ${
                    item?.file
                        ? `
                            <div
                                class="smartoffice-sop-current-file"
                            >
                                File saat ini:
                                <a
                                    href="${smartofficeSOPEscapeAttribute(
                                        item.file
                                    )}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Lihat File
                                </a>
                            </div>
                        `
                        : ""
                }
            </div>

            <!-- ACTION -->
            <div
                class="smartoffice-penomoransk-form-actions"
            >
                <button
                    type="button"
                    id="smartofficePenomoranSOPCancelButton"
                    class="smartoffice-secondary-button"
                >
                    Batal
                </button>

                <button
                    type="submit"
                    id="smartofficePenomoranSOPSaveButton"
                    class="smartoffice-primary-button"
                >
                    Simpan
                </button>
            </div>
        </form>
    `;

    smartofficeSOPRenderFormMaster(
        item
    );

    const form =
        document.getElementById(
            "smartofficePenomoranSOPForm"
        );

    form?.addEventListener(
        "submit",
        function(event){
            event.preventDefault();
            smartofficeSubmitSOP();
        }
    );

    document
        .getElementById(
            "smartofficePenomoranSOPCancelButton"
        )
        ?.addEventListener(
            "click",
            smartofficeCloseSOPForm
        );

    const tanggalInput =
        document.getElementById(
            "smartofficePenomoranSOPTanggal"
        );

    const klasterInput =
        document.getElementById(
            "smartofficePenomoranSOPKlaster"
        );

    tanggalInput?.addEventListener(
        "change",
        smartofficeSOPUpdateNomor
    );

    klasterInput?.addEventListener(
        "change",
        smartofficeSOPUpdateNomor
    );
}


/* ======================================================
   FORM MASTER
====================================================== */
function smartofficeSOPRenderFormMaster(
    item = null
){
    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPKlaster"
        );

    const revisi =
        document.getElementById(
            "smartofficePenomoranSOPRevisi"
        );

    const status =
        document.getElementById(
            "smartofficePenomoranSOPStatus"
        );

    const master =
        smartofficeSOPMaster || {};

    smartofficeSOPFillSelect(
        klaster,
        master.klaster || [],
        "-- Pilih Klaster --"
    );

    smartofficeSOPFillSelect(
        revisi,
        master.revisi || [],
        "-- Pilih Revisi --"
    );

    smartofficeSOPFillSelect(
        status,
        master.statusSOP || [],
        "-- Pilih Status SOP --"
    );

    if(item){
        smartofficeSOPSetSelect(
            klaster,
            item.klaster
        );

        smartofficeSOPSetSelect(
            revisi,
            item.revisi
        );

        smartofficeSOPSetSelect(
            status,
            item.statusSOP
        );
    }

    smartofficeSOPUpdateNomor();
}


/* ======================================================
   UPDATE NOMOR SOP
====================================================== */
async function smartofficeSOPUpdateNomor(){

    const nomor =
        document.getElementById(
            "smartofficePenomoranSOPNomor"
        );

    const tanggal =
        document.getElementById(
            "smartofficePenomoranSOPTanggal"
        )?.value || "";


    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPKlaster"
        )?.value || "";

    if(!nomor){
        return;
    }

    if(
        !tanggal ||
        !klaster
    ){
        nomor.value = "";

        return;
    }

    /* ==================================================
       MODE EDIT
       PERTAHANKAN NOMOR URUT
    ================================================== */
    if(
        smartofficeSOPIsEdit &&
        smartofficeSOPEditNomorUrut
    ){
        const year =
            new Date(
                tanggal
            ).getFullYear();

        nomor.value =
            `${smartofficeSOPEditNomorUrut}/${klaster}/${year}`;

        return;
    }

    /* ==================================================
       MODE TAMBAH
       AMBIL PREVIEW DARI GAS
    ================================================== */
    nomor.value =
        "Membuat nomor...";

    try{
        const result =
            await smartofficePreviewNomorSOP(
                klaster,
                tanggal
            );
        nomor.value =
            result || "-";
    }catch(error){
        console.error(
            "PREVIEW NOMOR SOP ERROR:",
            error
        );

        nomor.value =
            "-";
    }
}


/* ======================================================
   SUBMIT SOP
====================================================== */
async function smartofficeSubmitSOP(){

    const tanggal =
        document.getElementById(
            "smartofficePenomoranSOPTanggal"
        )?.value || "";

    const nomor =
        document.getElementById(
            "smartofficePenomoranSOPNomor"
        )?.value || "";

    const judul =
        document.getElementById(
            "smartofficePenomoranSOPJudul"
        )?.value || "";

    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPKlaster"
        )?.value || "";

    const revisi =
        document.getElementById(
            "smartofficePenomoranSOPRevisi"
        )?.value || "";

    const statusSOP =
        document.getElementById(
            "smartofficePenomoranSOPStatus"
        )?.value || "";

    const fileInput =
        document.getElementById(
            "smartofficePenomoranSOPFile"
        );

    /* ==================================================
       VALIDASI
    ================================================== */
    if(
        !nomor ||
        !tanggal ||
        !judul ||
        !klaster ||
        !statusSOP
    ){
        smartofficeShowToast(
            "Nomor, tanggal, judul, klaster, dan status SOP wajib diisi.",
            "warning"
        );

        return;
    }

    const saveButton =
        document.getElementById(
            "smartofficePenomoranSOPSaveButton"
        );
    if(saveButton){
        saveButton.disabled = true;
        saveButton.textContent =
            "Menyimpan...";
    }

    try{
        smartofficeShowGlobalLoading(
            smartofficeSOPIsEdit
                ? "Menyimpan perubahan SOP..."
                : "Menyimpan SOP..."
        );

        let filePayload =
            null;

        if(
            fileInput &&
            fileInput.files &&
            fileInput.files.length > 0
        ){
            const file =
                fileInput.files[0];
            if(
                file.size >
                3 * 1024 * 1024
            ){
                throw new Error(
                    "Ukuran file maksimal 3 MB."
                );
            }

            filePayload =
                await smartofficeSOPReadFile(
                    file
                );
        }

        const payload = {
            rowIndex:
                smartofficeSOPEditRowIndex ||
                null,
            nomorSOP:
                nomor,
            tanggal:
                tanggal,
            judul:
                judul,
            klaster:
                klaster,
            revisi:
                revisi,
            statusSOP:
                statusSOP,
            file:
                filePayload
        };

        await smartofficeAddSOPDraft(
            payload
        );

        smartofficeShowToast(
            smartofficeSOPIsEdit
                ? "SOP berhasil diperbarui."
                : "SOP berhasil ditambahkan.",
            "success"
        );

        smartofficeCloseSOPForm();
        await smartofficeLoadPenomoranSOP();
    }catch(error){
        console.error(
            "SAVE SOP ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal menyimpan SOP.",
            "error"
        );
    }finally{
        smartofficeHideGlobalLoading();

        if(saveButton){
            saveButton.disabled = false;
            saveButton.textContent =
                "Simpan";
        }
    }
}


/* ======================================================
   BUKA LOCK SOP
   ID = NOMOR SOP
====================================================== */
async function smartofficeSOPBukaLock(
    nomorSOP
){
    nomorSOP =
        String(
            nomorSOP || ""
        ).trim();
    if(
        !nomorSOP
    ){
        smartofficeShowToast(
            "Nomor SOP tidak ditemukan.",
            "error"
        );

        return;
    }

    try{
        smartofficeShowGlobalLoading(
            "Membuka kunci SOP..."
        );

        await smartofficeBukaLockSOP(
            nomorSOP
        );

        smartofficeShowToast(
            "SOP berhasil dibuka.",
            "success"
        );

        await smartofficeLoadPenomoranSOP();
    }
    catch(error){
        console.error(
            "BUKA LOCK SOP ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal membuka kunci SOP.",
            "error"
        );
    }
    finally{
        smartofficeHideGlobalLoading();
    }
}


/* ======================================================
   HAPUS SOP
   ID = NOMOR SOP
====================================================== */
async function smartofficeSOPHapus(
    nomorSOP
){
    nomorSOP =
        String(
            nomorSOP || ""
        ).trim();
    if(
        !nomorSOP
    ){
        smartofficeShowToast(
            "Nomor SOP tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       AMBIL DATA SOP DARI ARRAY
       BERDASARKAN NOMOR SOP
    ================================================== */
    const item =
        smartofficeSOPAllData.find(
            row =>
                String(
                    row.nomorSOP || ""
                ).trim() ===
                nomorSOP
        );
    if(
        !item
    ){
        smartofficeShowToast(
            "Data SOP tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       SOP LOCK TIDAK BOLEH DIHAPUS
    ================================================== */
    if(
        String(
            item.status || ""
        )
        .trim()
        .toUpperCase() ===
        "LOCK"
    ){
        smartofficeShowToast(
            "SOP yang terkunci tidak dapat dihapus.",
            "warning"
        );

        return;
    }

    /* ==================================================
       KONFIRMASI
    ================================================== */
    const yakin =
        window.confirm(
            `Hapus SOP "${nomorSOP}"?`
        );
    if(
        !yakin
    ){
        return;
    }

    try{
        smartofficeShowGlobalLoading(
            "Menghapus SOP..."
        );

        await smartofficeHapusSOP(
            nomorSOP
        );

        smartofficeShowToast(
            "SOP berhasil dihapus.",
            "success"
        );

        await smartofficeLoadPenomoranSOP();
    }
    catch(error){
        console.error(
            "HAPUS SOP ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal menghapus SOP.",
            "error"
        );
    }
    finally{
        smartofficeHideGlobalLoading();
    }
}


/* ======================================================
   RESET FILTER
====================================================== */
function smartofficeSOPResetFilter(){

    const search =
        document.getElementById(
            "smartofficePenomoranSOPFilterSearch"
        );

    const tahun =
        document.getElementById(
            "smartofficePenomoranSOPFilterTahun"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPFilterKlaster"
        );

    if(search){
        search.value = "";
    }

    if(tahun){
        tahun.value = "";
    }

    if(klaster){
        klaster.value = "";
    }

    smartofficeSOPActiveYear =
        "";

    smartofficeSOPApplyFilter();
}


/* ======================================================
   EMPTY STATE
====================================================== */
function smartofficeSOPRenderEmptyState(){

    const container =
        document.getElementById(
            "smartofficePenomoranSOPList"
        );
    if(!container){
        return;
    }

    container.innerHTML = `
        <div class="smartoffice-empty-state">
            <div class="smartoffice-empty-state-icon">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M6 3h12v18H6z"/>
                    <path d="M9 8h6"/>
                    <path d="M9 12h6"/>
                    <path d="M9 16h4"/>
                </svg>
            </div>

            <div class="smartoffice-empty-state-title">
                Data SOP
            </div>

            <div class="smartoffice-empty-state-text">
                Silakan pilih tahun atau gunakan filter
                untuk melihat data SOP.
            </div>
        </div>
    `;
}


/* ======================================================
   ERROR STATE
====================================================== */
function smartofficeSOPRenderError(
    message
){
    const container =
        document.getElementById(
            "smartofficePenomoranSOPList"
        );
    if(!container){
        return;
    }

    container.innerHTML = `
        <div class="smartoffice-empty-state">
            <div class="smartoffice-empty-state-title">
                Gagal memuat data SOP
            </div>

            <div class="smartoffice-empty-state-text">
                ${smartofficeSOPEscape(
                    message
                )}
            </div>
        </div>
    `;
}


/* ======================================================
   CLOSE FORM
====================================================== */
function smartofficeCloseSOPForm(){

    const modal =
        document.getElementById(
            "smartofficePenomoranSOPFormModal"
        );

    modal?.classList.remove(
        "is-open"
    );

    document.body.classList.remove(
        "smartoffice-modal-open"
    );

    smartofficeSOPIsEdit =
        false;
    smartofficeSOPEditRowIndex =
        null;
    smartofficeSOPEditNomorUrut =
        null;
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export function smartofficeDestroyPenomoranSOP(){

    const search =
        document.getElementById(
            "smartofficePenomoranSOPFilterSearch"
        );

    const tahun =
        document.getElementById(
            "smartofficePenomoranSOPFilterTahun"
        );

    const klaster =
        document.getElementById(
            "smartofficePenomoranSOPFilterKlaster"
        );

    const reset =
        document.getElementById(
            "smartofficePenomoranSOPResetButton"
        );

    const tambah =
        document.getElementById(
            "smartofficePenomoranSOPTambahButton"
        );

    const close =
        document.getElementById(
            "smartofficePenomoranSOPFormClose"
        );

    const overlay =
        document.getElementById(
            "smartofficePenomoranSOPFormOverlay"
        );

    if(
        search &&
        smartofficeSOPSearchHandler
    ){
        search.removeEventListener(
            "input",
            smartofficeSOPSearchHandler
        );
    }

    if(
        tahun &&
        smartofficeSOPTahunHandler
    ){
        tahun.removeEventListener(
            "change",
            smartofficeSOPTahunHandler
        );
    }

    if(
        klaster &&
        smartofficeSOPKlasterHandler
    ){
        klaster.removeEventListener(
            "change",
            smartofficeSOPKlasterHandler
        );
    }

    if(
        reset &&
        smartofficeSOPResetHandler
    ){
        reset.removeEventListener(
            "click",
            smartofficeSOPResetHandler
        );
    }

    if(
        tambah &&
        smartofficeSOPTambahHandler
    ){
        tambah.removeEventListener(
            "click",
            smartofficeSOPTambahHandler
        );
    }

    if(
        close &&
        smartofficeSOPFormCloseHandler
    ){
        close.removeEventListener(
            "click",
            smartofficeSOPFormCloseHandler
        );
    }

    if(
        overlay &&
        smartofficeSOPFormOverlayHandler
    ){
        overlay.removeEventListener(
            "click",
            smartofficeSOPFormOverlayHandler
        );
    }

    smartofficeCloseSOPForm();
    smartofficeSOPSearchHandler = null;
    smartofficeSOPTahunHandler = null;
    smartofficeSOPKlasterHandler = null;
    smartofficeSOPResetHandler = null;
    smartofficeSOPTambahHandler = null;
    smartofficeSOPFormCloseHandler = null;
    smartofficeSOPFormOverlayHandler = null;
    smartofficeSOPEventsBound =
    false;
    smartofficeSOPViewData = [];
    smartofficeSOPLoaded = false;
    smartofficeForceHideGlobalLoading();
}


/* ======================================================
   READ FILE
====================================================== */
function smartofficeSOPReadFile(
    file
){
    return new Promise(
        function(resolve, reject){
            const reader =
                new FileReader();

            reader.onload =
                function(event){
                    resolve({
                        name:
                            file.name,
                        type:
                            file.type,
                        data:
                            String(
                                event.target.result
                            )
                            .split(",")[1]
                    });
                };

            reader.onerror =
                function(){
                    reject(
                        new Error(
                            "Gagal membaca file SOP."
                        )
                    );
                };

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* ======================================================
   GET YEAR
====================================================== */
function smartofficeSOPGetYear(
    value
){
    if(!value){
        return "";
    }

    const text =
        String(
            value
        ).trim();

    /* YYYY-MM-DD */
    const matchISO =
        text.match(
            /^(\d{4})[-/]\d{1,2}[-/]\d{1,2}/
        );
    if(matchISO){
        return matchISO[1];
    }

    /* DD-MM-YYYY / DD/MM/YYYY */
    const matchDMY =
        text.match(
            /^\d{1,2}[-/]\d{1,2}[-/](\d{4})/
        );

    if(matchDMY){
        return matchDMY[1];
    }

    const date =
        new Date(
            text
        );

    if(
        !Number.isNaN(
            date.getTime()
        )
    ){
        return String(
            date.getFullYear()
        );
    }

    return "";
}


/* ======================================================
   PARSE DATE
====================================================== */
function smartofficeSOPParseDate(
    value
){
    if(!value){
        return 0;
    }

    const text =
        String(
            value
        ).trim();

    let match =
        text.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
        );
    if(match){
        return new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
        ).getTime();
    }

    const date =
        new Date(
            text
        );

    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();
}


/* ======================================================
   DATE → INPUT DATE
====================================================== */
function smartofficeSOPToInputDate(
    value
){
    if(!value){
        return "";
    }

    const text =
        String(
            value
        ).trim();
    if(
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ){

        return text;
    }

    const match =
        text.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
        );
    if(match){
        return `${match[3]}-${String(
            match[2]
        ).padStart(2,"0")}-${String(
            match[1]
        ).padStart(2,"0")}`;
    }

    const date =
        new Date(
            text
        );

    if(
        Number.isNaN(
            date.getTime()
        )
    ){
        return "";
    }

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2,"0"),
        String(
            date.getDate()
        ).padStart(2,"0")
    ].join("-");
}


/* ======================================================
   FILL SELECT
====================================================== */
function smartofficeSOPFillSelect(
    select,
    values,
    placeholder
){
    if(!select){
        return;
    }

    select.innerHTML =
        `<option value="">${smartofficeSOPEscape(
            placeholder
        )}</option>`;

    const list =
        Array.isArray(values)
            ? values
            : [];

    list.forEach(
        value => {
            const text =
                String(
                    value ?? ""
                ).trim();
            if(!text){
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                text;

            option.textContent =
                text;

            select.appendChild(
                option
            );
        }
    );
}


/* ======================================================
   SET SELECT
====================================================== */
function smartofficeSOPSetSelect(
    select,
    value
){
    if(!select){
        return;
    }

    const target =
        String(
            value ?? ""
        ).trim();

    const option =
        Array.from(
            select.options
        ).find(
            option =>
                String(
                    option.value
                ).trim() ===
                target
        );
    if(option){
        option.selected =
            true;
    }
}


/* ======================================================
   ESCAPE HTML
====================================================== */
function smartofficeSOPEscape(
    value
){
    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


/* ======================================================
   ESCAPE ATTRIBUTE
====================================================== */
function smartofficeSOPEscapeAttribute(
    value
){
    return smartofficeSOPEscape(
        value
    );
}


/* ======================================================
   DEBOUNCE
====================================================== */
function smartofficeSOPDebounce(
    callback,
    delay
){
    let timer = null;

    return function(){
        clearTimeout(
            timer
        );

        timer =
            setTimeout(
                () => {
                    callback.apply(
                        this,
                        arguments
                    );
                },
                delay
            );
    };
}