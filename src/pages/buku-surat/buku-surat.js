/* ======================================================
   IMPORT
====================================================== */

/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";

import {
    smartofficeNavigate
} from "../../core/router.js";

/* ======================================================
   COMPONENT
====================================================== */
import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

/* ======================================================
   LOADING
====================================================== */
import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetAllSuratMasuk,
    smartofficeBukaLockSuratMasuk,
    smartofficeGetMasterSurat,
    smartofficePreviewNomorAgendaMasuk,
    smartofficeSaveSuratMasuk
} from "../../services/buku-surat.service.js";

/* ======================================================
   UTILS
====================================================== */
import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";


/* ======================================================
   GLOBAL STATE SURAT MASUK
====================================================== */
let suratMasukAllData = [];
let suratMasukViewData = [];
let suratMasukLoaded = false;
let isSubmittingMasuk = false;

let smartofficeBukuSuratTabMasukHandler = null;
let smartofficeBukuSuratTabKeluarHandler = null;
let smartofficeBukuSuratRefreshHandler = null;
let smartofficeBukuSuratTambahHandler = null;

let smartofficeBukuSuratTanggalHandler = null;
let smartofficeBukuSuratBulanHandler = null;
let smartofficeBukuSuratSearchHandler = null;

let smartofficeSuratMasukDisposisiSelected = [];
/*let smartofficeSuratMasukEditRowIndex = null;*/


/* ============================================================================
   LIFECYCLE
============================================================================ */

/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* CHECK LOGIN SESSION */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* GET SESSION */
    const sessionData =
        smartofficeGetSession();

    /* SESSION NOT FOUND */
    if(
        !sessionData
    ){
        await smartofficeLogout();
        return;
    }

    /* MOBILE NAVBAR */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "buku-surat"
    );

    /* LOAD DATA */
    await smartofficeLoadDataSuratMasuk();

    /* INIT TAB */
    smartofficeInitBukuSuratTab();

    /* INIT REFRESH */
    smartofficeInitBukuSuratRefreshButton();

    /* INIT AKSES */
    smartofficeInitAksesSuratMasuk();
}

/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    const tabSuratMasuk =
        document.getElementById(
            "smartofficeTabSuratMasuk"
        );

    const tabSuratKeluar =
        document.getElementById(
            "smartofficeTabSuratKeluar"
        );

    const refreshButton =
        document.getElementById(
            "smartofficeBukuSuratRefreshButton"
        );

    const tanggal =
        document.getElementById(
            "smartofficeSuratMasukFilterTanggal"
        );

    const bulan =
        document.getElementById(
            "smartofficeSuratMasukFilterBulan"
        );

    const search =
        document.getElementById(
            "smartofficeSuratMasukFilterSearch"
        );

    /* ==================================================
       REMOVE TAB
    ================================================== */
    if(
        tabSuratMasuk &&
        smartofficeBukuSuratTabMasukHandler
    ){
        tabSuratMasuk.removeEventListener(
            "click",
            smartofficeBukuSuratTabMasukHandler
        );
    }

    if(
        tabSuratKeluar &&
        smartofficeBukuSuratTabKeluarHandler
    ){
        tabSuratKeluar.removeEventListener(
            "click",
            smartofficeBukuSuratTabKeluarHandler
        );
    }

    /* ==================================================
       REMOVE REFRESH
    ================================================== */
    if(
        refreshButton &&
        smartofficeBukuSuratRefreshHandler
    ){
        refreshButton.removeEventListener(
            "click",
            smartofficeBukuSuratRefreshHandler
        );
    }

    /* ==================================================
       REMOVE TOMBOL TAMBAH
    ================================================== */
    const tambahButton =
        document.getElementById(
            "smartofficeSuratMasukTambahButton"
        );
    if(
        tambahButton &&
        smartofficeBukuSuratTambahHandler
    ){
        tambahButton.removeEventListener(
            "click",
            smartofficeBukuSuratTambahHandler
        );
    }

    /* ==================================================
       REMOVE FILTER
    ================================================== */
    if(
        tanggal &&
        smartofficeBukuSuratTanggalHandler
    ){
        tanggal.removeEventListener(
            "change",
            smartofficeBukuSuratTanggalHandler
        );
    }

    if(
        bulan &&
        smartofficeBukuSuratBulanHandler
    ){
        bulan.removeEventListener(
            "change",
            smartofficeBukuSuratBulanHandler
        );
    }

    if(
        search &&
        smartofficeBukuSuratSearchHandler
    ){
        search.removeEventListener(
            "input",
            smartofficeBukuSuratSearchHandler
        );
    }

    /* ==================================================
       RESET HANDLER
    ================================================== */
    smartofficeBukuSuratTabMasukHandler = null;
    smartofficeBukuSuratTabKeluarHandler = null;
    smartofficeBukuSuratRefreshHandler = null;
    smartofficeBukuSuratTanggalHandler = null;
    smartofficeBukuSuratBulanHandler = null;
    smartofficeBukuSuratSearchHandler = null;
    smartofficeBukuSuratTambahHandler = null;

    /* ==================================================
       RESET DATA
    ================================================== */
    suratMasukAllData = [];
    suratMasukViewData = [];
    suratMasukLoaded = false;
}

/* ======================================================
   INIT TAB BUKU SURAT
====================================================== */
function smartofficeInitBukuSuratTab(){

    const tabSuratMasuk =
        document.getElementById(
            "smartofficeTabSuratMasuk"
        );

    const tabSuratKeluar =
        document.getElementById(
            "smartofficeTabSuratKeluar"
        );

    const suratMasukContent =
        document.getElementById(
            "smartofficeSuratMasukContent"
        );

    const suratKeluarContent =
        document.getElementById(
            "smartofficeSuratKeluarContent"
        );

    /* ==================================================
       SURAT MASUK
    ================================================== */
    if(tabSuratMasuk){
        smartofficeBukuSuratTabMasukHandler =
            function(){
                tabSuratMasuk.classList.add(
                    "active"
                );

                if(tabSuratKeluar){
                    tabSuratKeluar.classList.remove(
                        "active"
                    );
                }

                if(suratMasukContent){
                    suratMasukContent.style.display =
                        "";
                }

                if(suratKeluarContent){
                    suratKeluarContent.style.display =
                        "none";
                }
            };

        tabSuratMasuk.addEventListener(
            "click",
            smartofficeBukuSuratTabMasukHandler
        );
    }

    /* ==================================================
       SURAT KELUAR
    ================================================== */
    if(tabSuratKeluar){
        smartofficeBukuSuratTabKeluarHandler =
            function(){
                tabSuratKeluar.classList.add(
                    "active"
                );

                if(tabSuratMasuk){
                    tabSuratMasuk.classList.remove(
                        "active"
                    );
                }

                if(suratKeluarContent){

                    suratKeluarContent.style.display =
                        "";
                }

                if(suratMasukContent){
                    suratMasukContent.style.display =
                        "none";
                }
            };

        tabSuratKeluar.addEventListener(
            "click",
            smartofficeBukuSuratTabKeluarHandler
        );
    }
}


/* ============================================================================
   SURAT MASUK
============================================================================ */

/* ======================================================
   LOAD DATA SURAT MASUK
====================================================== */
async function smartofficeLoadDataSuratMasuk(){
    try{
        const res =
            await smartofficeGetAllSuratMasuk();

        suratMasukAllData =
            res || [];

        suratMasukViewData =
            [
                ...suratMasukAllData
            ];

        /* RESET VIEW STATE */
        resetSuratMasukViewState();

        /* INIT FILTER */
        initFilterSuratMasuk();

        /* INIT BULAN */
        initBulanAgendaMasuk();

        /* RENDER HASIL AWAL */
        applyFilterMasuk();

        suratMasukLoaded =
            true;
    }
    catch(error){
        console.error(
            "Load Data Surat Masuk Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat data Surat Masuk",
            "error"
        );
    }
}

/* ======================================================
   AKSES SURAT MASUK
====================================================== */
function smartofficeInitAksesSuratMasuk(){

    const sessionData =
        smartofficeGetSession();

    const role =
        String(
            sessionData?.role || "USER"
        )
        .trim()
        .toUpperCase();

    const canManage =
        [
            "ADMIN",
            "PJ",
            "KAPUS",
            "SUPERADMIN"
        ].includes(
            role
        );

    /* ==================================================
       TOMBOL TAMBAH
    ================================================== */   
    const tambahButton =
        document.getElementById(
            "smartofficeSuratMasukTambahButton"
        );
    if(
        tambahButton
    ){
        tambahButton.style.display =
            canManage
                ? ""
                : "none";

        /* HINDARI EVENT DOBEL */
        if(
            tambahButton
        ){
            tambahButton.style.display =
                canManage
                    ? ""
                    : "none";

            /* REMOVE HANDLER LAMA JIKA ADA */
            if(
                smartofficeBukuSuratTambahHandler
            ){
                tambahButton.removeEventListener(
                    "click",
                    smartofficeBukuSuratTambahHandler
                );
            }

            /* BUAT HANDLER BARU */
            smartofficeBukuSuratTambahHandler =
                function(){
                    smartofficeRenderFormSuratMasuk();

                    const modal =
                        document.getElementById(
                            "smartofficeSuratMasukFormModal"
                        );

                    if(modal){
                        modal.style.display =
                            "flex";
                    }
                };

            tambahButton.addEventListener(
                "click",
                smartofficeBukuSuratTambahHandler
            );
        }
    }
}

/* ======================================================
   RESET VIEW STATE SURAT MASUK
====================================================== */
function resetSuratMasukViewState(){

    /* RESET TANGGAL */
    const tanggal =
        document.getElementById(
            "smartofficeSuratMasukFilterTanggal"
        );
    if(
        tanggal
    ){
        tanggal.value = "";
    }

    /* RESET SEARCH */
    const search =
        document.getElementById(
            "smartofficeSuratMasukFilterSearch"
        );
    if(
        search
    ){
        search.value = "";
    }

    /* RESET DATA VIEW */
    suratMasukViewData =
        [
            ...suratMasukAllData
        ];
}

/* ======================================================
   INIT REFRESH BUTTON BUKU SURAT
====================================================== */
function smartofficeInitBukuSuratRefreshButton(){

    const button =
        document.getElementById(
            "smartofficeBukuSuratRefreshButton"
        );
    if(
        !button ||
        smartofficeBukuSuratRefreshHandler
    ){
        return;
    }

    smartofficeBukuSuratRefreshHandler =
        async function(){
            if(
                button.disabled
            ){
                return;
            }

            button.disabled =
                true;

            try{
                await smartofficeLoadDataSuratMasuk();
            }
            catch(error){
                console.error(
                    "Refresh Buku Surat Error:",
                    error
                );
            }

            button.disabled =
                false;
        };

    button.addEventListener(
        "click",
        smartofficeBukuSuratRefreshHandler
    );
}

/* ======================================================
   FILTER UTAMA SURAT MASUK
====================================================== */
function applyFilterMasuk(){

    const tanggal =
        document.getElementById(
            "smartofficeSuratMasukFilterTanggal"
        )?.value;

    const search =
        document.getElementById(
            "smartofficeSuratMasukFilterSearch"
        )?.value
            .toLowerCase()
            .trim();

    const bulan =
        document.getElementById(
            "smartofficeSuratMasukFilterBulan"
        )?.value;

    suratMasukViewData =
        suratMasukAllData.filter(
            r => {

                /* =========================
                   FILTER BULAN
                ========================== */
                if(
                    bulan
                ){
                    if(
                        !r.tglTerima
                    ){
                        return false;
                    }

                    const d =
                        new Date(
                            parseTanggalMasuk(
                                r.tglTerima
                            )
                        );

                    if(
                        isNaN(d)
                    ){
                        return false;
                    }

                    const key =
                        `${d.getFullYear()}-${String(
                            d.getMonth() + 1
                        ).padStart(2, "0")}`;

                    if(
                        key !== bulan
                    ){
                        return false;
                    }
                }

                /* =========================
                   FILTER TANGGAL
                ========================== */
                if(
                    tanggal
                ){
                    const d =
                        new Date(
                            parseTanggalMasuk(
                                r.tglTerima
                            )
                        );

                    const target =
                        new Date(
                            tanggal
                        );
                    if(
                        isNaN(d) ||
                        d.toDateString()
                            !== target.toDateString()
                    ){
                        return false;
                    }
                }

                /* =========================
                   SEARCH
                ========================== */
                if(
                    search &&
                    !`${r.nomorSurat || ""} ${
                        r.pengirim || ""
                    } ${
                        r.perihal || ""
                    }`
                        .toLowerCase()
                        .includes(search)
                ){
                    return false;
                }

                return true;
            }
        );

    smartofficeRenderSuratMasuk(
        suratMasukViewData
    );
}

/* ======================================================
   INIT FILTER SURAT MASUK
====================================================== */
function initFilterSuratMasuk(){

    const tanggal =
        document.getElementById(
            "smartofficeSuratMasukFilterTanggal"
        );

    const search =
        document.getElementById(
            "smartofficeSuratMasukFilterSearch"
        );

    const bulan =
        document.getElementById(
            "smartofficeSuratMasukFilterBulan"
        );

    /* ==================================================
       DEFAULT TANGGAL HARI INI
    ================================================== */
    if(
        tanggal &&
        !tanggal.value
    ){
        const today =
            new Date();

        tanggal.value =
            `${today.getFullYear()}-${
                String(
                    today.getMonth() + 1
                ).padStart(2, "0")
            }-${
                String(
                    today.getDate()
                ).padStart(2, "0")
            }`;
    }

    /* ==================================================
       EVENT TANGGAL
    ================================================== */
    if(tanggal){
        smartofficeBukuSuratTanggalHandler =
            function(){
                if(bulan){
                    bulan.value =
                        "";
                }

                applyFilterMasuk();
            };

        tanggal.addEventListener(
            "change",
            smartofficeBukuSuratTanggalHandler
        );
    }

    /* ==================================================
       EVENT BULAN
    ================================================== */
    if(bulan){
        smartofficeBukuSuratBulanHandler =
            function(){
                if(
                    bulan.value &&
                    tanggal
                ){
                    tanggal.value =
                        "";
                }

                applyFilterMasuk();
            };

        bulan.addEventListener(
            "change",
            smartofficeBukuSuratBulanHandler
        );
    }

    /* ==================================================
       EVENT SEARCH
    ================================================== */
    if(search){
        smartofficeBukuSuratSearchHandler =
            function(){
                applyFilterMasuk();
            };

        search.addEventListener(
            "input",
            smartofficeBukuSuratSearchHandler
        );
    }
}

/* ======================================================
   INIT DROPDOWN BULAN AGENDA SURAT MASUK
   AMBIL DARI TANGGAL TERIMA
====================================================== */
function initBulanAgendaMasuk(){

    const select =
        document.getElementById(
            "smartofficeSuratMasukFilterBulan"
        );
    if(
        !select
    ){
        return;
    }

    /* ==================================================
       RESET OPTION
    ================================================== */
    select.innerHTML =
        `
        <option value="">
            Pilih Bulan
        </option>
        `;

    if(
        !suratMasukAllData ||
        !suratMasukAllData.length
    ){
        return;
    }

    /* ==================================================
       KUMPULKAN BULAN UNIK
    ================================================== */
    const bulanSet =
        new Set();

    suratMasukAllData.forEach(
        function(row){
            if(
                !row.tglTerima
            ){
                return;
            }

            /*
              FORMAT BACKEND:
              dd-MM-yyyy
            */
            const parts =
                String(
                    row.tglTerima
                ).split("-");
            if(
                parts.length !== 3
            ){
                return;
            }

            const year =
                Number(
                    parts[2]
                );

            const month =
                Number(
                    parts[1]
                );
            if(
                !year ||
                !month ||
                month < 1 ||
                month > 12
            ){
                return;
            }

            const key =
                `${year}-${String(
                    month
                ).padStart(
                    2,
                    "0"
                )}`;

            bulanSet.add(
                key
            );
        }
    );

    /* ==================================================
       RENDER BULAN
    ================================================== */
    [
        ...bulanSet
    ]
    .sort()
    .forEach(
        function(bulan){
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                bulan;

            option.textContent =
                formatBulanIndonesia(
                    bulan
                );

            select.appendChild(
                option
            );
        }
    );
}

/* ======================================================
   PARSE TANGGAL SURAT MASUK
   FORMAT BACKEND: dd-MM-yyyy
====================================================== */
function parseTanggalMasuk(value){
    if(!value){
        return null;
    }

    const parts =
        String(value).split("-");
    if(parts.length !== 3){
        return null;
    }

    const day =
        Number(parts[0]);

    const month =
        Number(parts[1]) - 1;

    const year =
        Number(parts[2]);

    const date =
        new Date(
            year,
            month,
            day
        );
    if(
        isNaN(date.getTime())
    ){
        return null;
    }

    return date;
}

/* ======================================================
   FORMAT BULAN INDONESIA (CLIENT)
   input : "yyyy-MM"
   output: "Januari 2026"
====================================================== */
function formatBulanIndonesia(bulan){
    if(
        !bulan
    ){
        return "";
    }

    const [
        y,
        m
    ] =
        bulan.split("-");

    const d =
        new Date(
            Number(y),
            Number(m) - 1,
            1
        );

    return d.toLocaleString(
        "id-ID",
        {
            month: "long",
            year: "numeric"
        }
    );
}

/* ======================================================
   RENDER SURAT MASUK
   SMART OFFICE — CARD LIST
====================================================== */
function smartofficeRenderSuratMasuk(
    data
){

    /* ==================================================
       CONTAINER
    ================================================== */
    const container =
        document.getElementById(
            "smartofficeSuratMasukList"
        );
    if(
        !container
    ){
        return;
    }

    /* ======================================================
       ROLE USER
    ====================================================== */
    const sessionData =
        smartofficeGetSession();

    const role =
        sessionData?.role || "USER";

    const canManage =
        [
            "ADMIN",
            "PJ",
            "KAPUS",
            "SUPERADMIN"
        ].includes(role);

    /* ==================================================
       EMPTY STATE
    ================================================== */
    if(
        !Array.isArray(data) ||
        data.length === 0
    ){
        container.innerHTML =
        `
        <div
            class="
                smartoffice-suratmasuk-empty
            "
        >
            <div
                class="
                    smartoffice-suratmasuk-empty-icon
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
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                    />

                    <polyline
                        points="
                            3 7
                            12 13
                            21 7
                        "
                    />
                </svg>
            </div>

            <strong>
                Tidak ada surat masuk
            </strong>

            <span>
                Belum terdapat surat masuk
                yang sesuai dengan filter.
            </span>
        </div>
        `;

        return;
    }

    /* ==================================================
       HTML
    ================================================== */
    let html = "";

    /* ==================================================
       LOOP DATA
    ================================================== */
    data.forEach(
        function(item){

            /* ==========================================
               STATUS
            ========================================== */
            const status =
                item.status ||
                "DRAFT";

            let statusClass =
                "draft";

            let statusText =
                "Draft";
            if(
                status === "LOCK"
            ){
                statusClass =
                    "locked";

                statusText =
                    "Terkunci";
            }

            /* ======================================================
               ACTION
            ====================================================== */
            let actionHtml = "";

            /* FILE */
            if(
                item.file
            ){
                actionHtml += `
                    <button
                        type="button"
                        class="
                            smartoffice-suratmasuk-action
                        "
                        onclick="
                            window.open(
                                '${item.file}',
                                '_blank'
                            )
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
                            <path
                                d="
                                    M3 6
                                    a2 2 0 0 1 2-2
                                    h5
                                    l2 2
                                    h7
                                    a2 2 0 0 1 2 2
                                    v10
                                    a2 2 0 0 1-2 2
                                    H5
                                    a2 2 0 0 1-2-2
                                    Z
                                "
                            />

                            <path
                                d="
                                    M3 10
                                    h18
                                "
                            />
                        </svg>

                        <span>
                            Lihat Surat
                        </span>
                    </button>
                `;
            }

            /* EDIT DRAFT */
            if(
                canManage &&
                status !== "LOCK"
            ){
                actionHtml += `
                    <button
                        type="button"
                        class="
                            smartoffice-suratmasuk-action
                            edit
                        "
                        onclick="
                            openEditModalMasuk(
                                ${item.rowIndex}
                            )
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
                            <path
                                d="
                                    M14 2H6
                                    a2 2 0 0 0-2 2v16
                                    a2 2 0 0 0 2 2h12
                                    a2 2 0 0 0 2-2V8z
                                "
                            />

                            <polyline
                                points="
                                    14 2
                                    14 8
                                    20 8
                                "
                            />

                            <path
                                d="
                                    M12 18h-1l-1-1
                                    6-6 2 2-6 6z
                                "
                            />
                        </svg>

                        <span>
                            Ubah Surat
                        </span>
                    </button>
                `;
            }

            /* BUKA LOCK */
            if(
                role === "SUPERADMIN" &&
                status === "LOCK"
            ){
                actionHtml += `
                    <button
                        type="button"
                        class="
                            smartoffice-suratmasuk-action
                            unlock
                        "
                        onclick="
                            smartofficeBukaLockSuratMasukUI(
                                ${item.rowIndex}
                            )
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
                                x="5"
                                y="11"
                                width="14"
                                height="10"
                                rx="2"
                            />

                            <path
                                d="
                                    M8 11V7
                                    a4 4 0 0 1 8 0
                                    v1
                                "
                            />
                        </svg>

                        <span>
                            Buka Lock
                        </span>

                    </button>
                `;
            }

            /* ==========================================
               RENDER CARD
            ========================================== */
            html +=
            `
            <article
                class="
                    smartoffice-suratmasuk-card
                    ${statusClass}
                "
            >

                <!-- ==================================
                    TOP
                ================================== -->
                <div
                    class="
                        smartoffice-suratmasuk-top
                    "
                >
                    <!-- ICON -->
                    <div
                        class="
                            smartoffice-suratmasuk-icon
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
                                y="5"
                                width="18"
                                height="14"
                                rx="2"
                            />

                            <polyline
                                points="
                                    3 7
                                    12 13
                                    21 7
                                "
                            />
                        </svg>
                    </div>

                    <!-- DOCUMENT -->
                    <div
                        class="
                            smartoffice-suratmasuk-document
                        "
                    >
                        <!-- NOMOR AGENDA -->
                        <strong
                            class="
                                smartoffice-suratmasuk-name
                            "
                        >
                            ${item.nomorAgenda || "-"}
                        </strong>

                        <!-- TANGGAL TERIMA -->
                        <span
                            class="
                                smartoffice-suratmasuk-file
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

                                <line
                                    x1="8"
                                    y1="2"
                                    x2="8"
                                    y2="6"
                                />

                                <line
                                    x1="16"
                                    y1="2"
                                    x2="16"
                                    y2="6"
                                />

                                <line
                                    x1="3"
                                    y1="10"
                                    x2="21"
                                    y2="10"
                                />
                            </svg>
                            ${item.tglTerima || "-"}
                        </span>
                    </div>

                    <!-- STATUS -->
                    <div
                        class="
                            smartoffice-suratmasuk-status
                            ${statusClass}
                        "
                    >
                        <div
                            class="
                                smartoffice-suratmasuk-status-title
                            "
                        >
                            <span
                                class="
                                    smartoffice-suratmasuk-status-dot
                                "
                            ></span>

                            <strong>
                                ${statusText}
                            </strong>
                        </div>
                    </div>
                </div>

                <!-- ==================================
                    INFORMATION
                ================================== -->
                <div
                    class="
                        smartoffice-suratmasuk-information
                    "
                >                                  
                    <!-- NOMOR SURAT -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Nomor Surat
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                            "
                        >
                            ${item.nomorSurat || "-"}
                        </strong>
                    </div>

                    <!-- TANGGAL SURAT -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Tanggal Surat
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                            "
                        >
                            ${item.tglSurat || "-"}
                        </strong>
                    </div>

                    <!-- PENGIRIM -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Pengirim
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                            "
                        >
                            ${item.pengirim || "-"}
                        </strong>
                    </div>

                    <!-- SIFAT -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Sifat Surat
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                            "
                        >
                            ${item.sifat || "-"}
                        </strong>
                    </div>

                    <!-- PERIHAL -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                            full
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Perihal
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                                note
                            "
                        >
                            ${item.perihal || "-"}
                        </strong>
                    </div>

                    <!-- DISPOSISI -->
                    <div
                        class="
                            smartoffice-suratmasuk-meta
                            smartoffice-suratmasuk-disposisi
                            full
                        "
                    >
                        <span
                            class="
                                smartoffice-suratmasuk-meta-label
                            "
                        >
                            Disposisi
                        </span>

                        <strong
                            class="
                                smartoffice-suratmasuk-meta-value
                                note
                            "
                        >
                            ${item.disposisi || "-"}
                        </strong>
                    </div>
                </div>

                <!-- ==================================
                    ACTION
                ================================== -->
                ${
                    actionHtml
                    ?
                    `
                    <div
                        class="
                            smartoffice-suratmasuk-actions
                        "
                    >
                        ${actionHtml}
                    </div>
                    `
                    :
                    ""
                }
            </article>
            `;
        }
    );

    /* ==================================================
       RENDER LIST
    ================================================== */
    container.innerHTML =
    `
    <div
        class="
            smartoffice-suratmasuk-list
        "
    >
        ${html}
    </div>
    `;
}

/* ======================================================
   BUKA LOCK SURAT MASUK
====================================================== */
async function smartofficeBukaLockSuratMasukUI(
    rowIndex
){
    const sessionData =
        smartofficeGetSession();

    if(!sessionData){
        smartofficeShowToast(
            "Session pengguna tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       SIMPAN FILTER AKTIF
    ================================================== */
    const filterTanggal =
        document.getElementById(
            "smartofficeSuratMasukFilterTanggal"
        )?.value || "";

    const filterSearch =
        document.getElementById(
            "smartofficeSuratMasukFilterSearch"
        )?.value || "";

    const filterBulan =
        document.getElementById(
            "smartofficeSuratMasukFilterBulan"
        )?.value || "";

    /* ==================================================
       BUKA MODAL KONFIRMASI
    ================================================== */
    smartofficeOpenBukaLockSuratMasukModal(
        rowIndex,
        filterTanggal,
        filterSearch,
        filterBulan,
        sessionData
    );
}

/* ======================================================
   MODAL KONFIRMASI BUKA LOCK
====================================================== */
function smartofficeOpenBukaLockSuratMasukModal(
    rowIndex,
    filterTanggal,
    filterSearch,
    filterBulan,
    sessionData
){
    const modal =
        document.getElementById(
            "smartofficeSuratMasukLockModal"
        );

    if(!modal){
        return;
    }

    modal.dataset.rowIndex =
        rowIndex;

    modal.dataset.filterTanggal =
        filterTanggal;

    modal.dataset.filterSearch =
        filterSearch;

    modal.dataset.filterBulan =
        filterBulan;

    modal.dataset.nip =
        sessionData.nip || "";

    modal.dataset.role =
        sessionData.role || "";

    modal.classList.add(
        "is-visible"
    );
}

/* ======================================================
   TUTUP MODAL
====================================================== */
function smartofficeCloseBukaLockSuratMasukModal(){
    const modal =
        document.getElementById(
            "smartofficeSuratMasukLockModal"
        );

    if(modal){
        modal.classList.remove(
            "is-visible"
        );
    }
}

/* ======================================================
   KONFIRMASI BUKA LOCK
====================================================== */
async function smartofficeConfirmBukaLockSuratMasuk(){
    const modal =
        document.getElementById(
            "smartofficeSuratMasukLockModal"
        );
    if(!modal){
        return;
    }

    const rowIndex =
        Number(
            modal.dataset.rowIndex
        );

    const filterTanggal =
        modal.dataset.filterTanggal || "";

    const filterSearch =
        modal.dataset.filterSearch || "";

    const filterBulan =
        modal.dataset.filterBulan || "";

    const nip =
        modal.dataset.nip || "";

    const role =
        modal.dataset.role || "";

    smartofficeCloseBukaLockSuratMasukModal();
    smartofficeShowGlobalLoading(
        "Membuka lock Surat Masuk..."
    );

    try{
        await smartofficeBukaLockSuratMasuk(
            rowIndex,
            nip,
            role
        );

        /* ==================================================
           RELOAD DATA
        ================================================== */
        await smartofficeLoadDataSuratMasuk();

        /* ==================================================
           KEMBALIKAN FILTER
        ================================================== */
        const tanggal =
            document.getElementById(
                "smartofficeSuratMasukFilterTanggal"
            );

        const search =
            document.getElementById(
                "smartofficeSuratMasukFilterSearch"
            );

        const bulan =
            document.getElementById(
                "smartofficeSuratMasukFilterBulan"
            );

        if(tanggal){
            tanggal.value =
                filterTanggal;
        }

        if(search){
            search.value =
                filterSearch;
        }

        if(bulan){
            bulan.value =
                filterBulan;
        }

        /* TERAPKAN FILTER */
        applyFilterMasuk();

        /* TOAST SUKSES */
        smartofficeShowToast(
            "Surat Masuk berhasil dibuka menjadi DRAFT.",
            "success"
        );
    }
    catch(error){
        console.error(
            "Buka Lock Surat Masuk Error:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal membuka lock Surat Masuk.",
            "error"
        );
    }
    finally{
        smartofficeHideGlobalLoading();
    }
}

/* ======================================================
   TUTUP FORM SURAT MASUK
====================================================== */
function smartofficeCloseFormSuratMasuk(){
    const modal =
        document.getElementById(
            "smartofficeSuratMasukFormModal"
        );
    if(modal){
        modal.style.display =
            "none";
    }
}

/* ======================================================
   RENDER FORM SURAT MASUK
====================================================== */
async function smartofficeRenderFormSuratMasuk(
    data = null
){
    const body =
        document.getElementById(
            "smartofficeSuratMasukFormBody"
        );
    if(!body){
        return;
    }

    const isEdit =
        !!data;

    body.innerHTML = `
        <form
            id="smartofficeSuratMasukForm"
            class="smartoffice-suratmasuk-form"
        >
            <!-- ROW 1 -->
            <div
                class="smartoffice-suratmasuk-form-group"
            >
                <label>
                    Nomor Agenda
                </label>

                <input
                    type="text"
                    id="smartofficeSuratMasukNomorAgenda"
                    readonly
                    placeholder="Otomatis"
                    value="${data?.nomorAgenda || ""}"
                >
            </div>

            <div
                class="smartoffice-suratmasuk-form-group"
            >
                <label>
                    Tanggal Terima
                </label>

                <input
                    type="date"
                    id="smartofficeSuratMasukTglTerima"
                    value="${data?.tglTerima || ""}"
                    required
                >
            </div>

            <!-- ROW 2 -->
            <div
                class="smartoffice-suratmasuk-form-group"
            >
                <label>
                    Nomor Surat
                </label>

                <input
                    type="text"
                    id="smartofficeSuratMasukNomorSurat"
                    value="${data?.nomorSurat || ""}"
                    required
                >
            </div>

            <div
                class="smartoffice-suratmasuk-form-group"
            >
                <label>
                    Tanggal Surat
                </label>

                <input
                    type="date"
                    id="smartofficeSuratMasukTglSurat"
                    value="${data?.tglSurat || ""}"
                    required
                >
            </div>

            <!-- PENGIRIM -->
            <div
                class="
                    smartoffice-suratmasuk-form-group
                    sender
                "
            >
                <label>
                    Pengirim
                </label>

                <input
                    type="text"
                    id="smartofficeSuratMasukPengirim"
                    value="${data?.pengirim || ""}"
                    required
                >
            </div>

            <!-- ROW -->
            <div
                class="
                    smartoffice-suratmasuk-form-group
                    sifat
                "
            >
                <label>
                    Sifat Surat
                </label>

                <select
                    id="smartofficeSuratMasukSifat"
                    required
                >
                    <option value="">
                        Pilih Sifat Surat
                    </option>

                    <option
                        value="Segera"
                        ${
                            data?.sifat === "Segera"
                                ? "selected"
                                : ""
                        }
                    >
                        Segera
                    </option>

                    <option
                        value="Penting"
                        ${
                            data?.sifat === "Penting"
                                ? "selected"
                                : ""
                        }
                    >
                        Penting
                    </option>

                    <option
                        value="Biasa"
                        ${
                            data?.sifat === "Biasa"
                                ? "selected"
                                : ""
                        }
                    >
                        Biasa
                    </option>
                </select>
            </div>

            <!-- DISPOSISI -->
            <div
                class="
                    smartoffice-suratmasuk-form-group
                    full
                "
            >
                <label>
                    Disposisi Ke
                </label>

                <div
                    id="smartofficeSuratMasukDisposisi"
                    class="smartoffice-disposisi-select"
                >
                    <!-- SELECTED -->
                    <div
                        class="smartoffice-disposisi-selected"
                        tabindex="0"
                    >
                        <div
                            class="smartoffice-disposisi-values"
                        >
                            <span
                                class="smartoffice-disposisi-placeholder"
                            >
                                Pilih Disposisi
                            </span>
                        </div>

                        <svg
                            class="smartoffice-disposisi-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>

                    <!-- DROPDOWN -->
                    <div
                        class="smartoffice-disposisi-dropdown"
                    >
                        <!-- SEARCH -->
                        <div
                            class="smartoffice-disposisi-search"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                />

                                <path
                                    d="m20 20-4-4"
                                />
                            </svg>

                            <input
                                type="text"
                                class="smartoffice-disposisi-search-input"
                                placeholder="Cari nama..."
                                autocomplete="off"
                            >
                        </div>

                        <!-- OPTIONS -->
                        <div
                            class="smartoffice-disposisi-options"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- PERIHAL -->
            <div
                class="
                    smartoffice-suratmasuk-form-group
                    full
                "
            >
                <label>
                    Perihal
                </label>

                <textarea
                    id="smartofficeSuratMasukPerihal"
                    rows="3"
                    required
                >${data?.perihal || ""}</textarea>

            </div>

            /* ==================================================
               UPLOAD DOKUMEN
               MAKSIMAL 5 MB
               FILE SAAT INI HANYA SAAT EDIT
            ================================================== */
            <div
                class="
                    smartoffice-suratmasuk-form-group
                    full
                "
            >
                <label>
                    Upload Dokumen
                </label>

                <div
                    class="smartoffice-suratmasuk-upload"
                    id="smartofficeSuratMasukUpload"
                >
                    <!-- ===============================
                        AREA PILIH FILE
                    ================================ -->
                    <label
                        class="
                            smartoffice-suratmasuk-upload-box
                        "
                    >
                        <input
                            type="file"
                            id="smartofficeSuratMasukFile"
                            class="
                                smartoffice-suratmasuk-upload-input
                            "
                            accept=".pdf,.doc,.docx"
                        >

                        <div
                            class="
                                smartoffice-suratmasuk-upload-content
                            "
                        >
                            <div
                                class="
                                    smartoffice-suratmasuk-upload-icon
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
                                    <path
                                        d="M12 16V4"
                                    />

                                    <path
                                        d="M7 9l5-5 5 5"
                                    />

                                    <path
                                        d="M5 20h14"
                                    />
                                </svg>
                            </div>

                            <span
                                class="
                                    smartoffice-suratmasuk-upload-title
                                "
                            >
                                Pilih dokumen
                            </span>

                            <span
                                class="
                                    smartoffice-suratmasuk-upload-info
                                "
                            >
                                PDF, DOC, DOCX • Maks. 5 MB
                            </span>
                        </div>
                    </label>

                    <!-- ===============================
                        FILE TERPILIH
                        AKAN DIISI OLEH JS
                    ================================ -->
                    <div
                        id="smartofficeSuratMasukUploadSelected"
                        class="
                            smartoffice-suratmasuk-upload-selected
                        "
                        style="display:none;"
                    >
                        <div
                            class="
                                smartoffice-suratmasuk-upload-file-icon
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
                                <path
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                />

                                <polyline
                                    points="14 2 14 8 20 8"
                                />
                            </svg>
                        </div>

                        <div
                            class="
                                smartoffice-suratmasuk-upload-file-info
                            "
                        >
                            <span
                                id="smartofficeSuratMasukUploadFileName"
                                class="
                                    smartoffice-suratmasuk-upload-file-name
                                "
                            ></span>

                            <span
                                id="smartofficeSuratMasukUploadFileSize"
                                class="
                                    smartoffice-suratmasuk-upload-file-size
                                "
                            ></span>
                        </div>

                        <button
                            type="button"
                            id="smartofficeSuratMasukUploadRemove"
                            class="
                                smartoffice-suratmasuk-upload-remove
                            "
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M18 6L6 18"
                                />

                                <path
                                    d="M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- ===============================
                        FILE LAMA
                        KHUSUS MODE EDIT
                    ================================ -->
                    ${
                        isEdit && data?.file
                            ? `
                                <div
                                    class="
                                        smartoffice-suratmasuk-form-current-file
                                    "
                                >
                                    <span>
                                        File saat ini:
                                    </span>

                                    <button
                                        type="button"
                                        onclick="
                                            smartofficeOpenFileSuratMasuk(
                                                '${data.file}'
                                            )
                                        "
                                    >
                                        Lihat Dokumen
                                    </button>

                                </div>
                            `
                            : ""
                    }
                </div>
            </div>

            <!-- ACTION -->
            <div
                class="
                    smartoffice-suratmasuk-form-actions
                "
            >
                <button
                    type="button"
                    id="smartofficeSuratMasukFormCancel"
                    class="
                        smartoffice-suratmasuk-form-button
                        cancel
                    "
                >
                    Batal
                </button>

                <button
                    type="submit"
                    id="smartofficeSuratMasukFormSubmit"
                    class="
                        smartoffice-suratmasuk-form-button
                        save
                    "
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="
                                M19 21H5
                                a2 2 0 0 1-2-2V5
                                a2 2 0 0 1 2-2h11
                                l5 5v11
                                a2 2 0 0 1-2 2z
                            "
                        />

                        <polyline
                            points="17 21 17 13 7 13 7 21"
                        />

                        <polyline
                            points="7 3 7 8 15 8"
                        />
                    </svg>

                    <span>
                        ${
                            isEdit
                                ? "Simpan Perubahan"
                                : "Simpan"
                        }
                    </span>
                </button>
            </div>
        </form>
    `;

    /* ==================================================
       LOAD DISPOSISI
    ================================================== */
    renderDisposisiDropdown(
        data
    );

    /* ==================================================
    LOAD NOMOR AGENDA
    ================================================== */
    if(!isEdit){
        try{
            const nomorAgenda =
                await smartofficePreviewNomorAgendaMasuk();

            const input =
                document.getElementById(
                    "smartofficeSuratMasukNomorAgenda"
                );

            if(input){
                input.value =
                    nomorAgenda || "";
            }
        }
        catch(error){
            console.error(
                "Preview Nomor Agenda Error:",
                error
            );
        }
    }

    /* ==================================================
       INIT UPLOAD DOKUMEN
    ================================================== */
    smartofficeInitUploadSuratMasuk();

    /* ==================================================
       TOMBOL BATAL
    ================================================== */
    const cancelButton =
        document.getElementById(
            "smartofficeSuratMasukFormCancel"
        );
    if(cancelButton){
        cancelButton.addEventListener(
            "click",
            smartofficeCloseFormSuratMasuk
        );
    }

    /* ==================================================
       SUBMIT FORM
    ================================================== */
    const form =
        document.getElementById(
            "smartofficeSuratMasukForm"
        );
    if(
        form &&
        !form.dataset.submitReady
    ){
        form.addEventListener(
            "submit",
            function(event){
                event.preventDefault();
                smartofficeSubmitSuratMasuk();
            }
        );

        form.dataset.submitReady =
            "1";
    }
}

/* =====================================================
   DISPOSISI SURAT MASUK
   CUSTOM MULTI SELECT
===================================================== */
async function renderDisposisiDropdown(
    data = null
){
    const container =
        document.getElementById(
            "smartofficeSuratMasukDisposisi"
        );

    /* ==================================================
       VALIDASI CONTAINER
    ================================================== */
    if(!container){
        return;
    }

    /* ==================================================
       CEGAH KLIK DALAM DROPDOWN MENUTUP DROPDOWN
    ================================================== */
    if(
        !container.dataset.clickReady
    ){
        container.addEventListener(
            "click",
            function(event){
                event.stopPropagation();
            }
        );

        container.dataset.clickReady = "1";
    }

    const values =
        container.querySelector(
            ".smartoffice-disposisi-values"
        );

    const options =
        container.querySelector(
            ".smartoffice-disposisi-options"
        );

    const selectedArea =
        container.querySelector(
            ".smartoffice-disposisi-selected"
        );

    const searchInput =
        container.querySelector(
            ".smartoffice-disposisi-search-input"
        );
    if(
        !values ||
        !options ||
        !selectedArea
    ){
        return;
    }

    /* ==================================================
       RESTORE DATA EDIT
    ================================================== */
    smartofficeSuratMasukDisposisiSelected =
        data?.disposisi
            ? String(data.disposisi)
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean)
            : [];

    /* ==================================================
       LOADING
    ================================================== */
    options.innerHTML = `
        <div
            class="smartoffice-disposisi-empty"
        >
            Memuat daftar disposisi...
        </div>
    `;

    try{
        const result =
            await smartofficeGetMasterSurat();

        const tujuan =
            Array.isArray(
                result?.tujuan
            )
                ? result.tujuan
                : [];

        /* ==================================================
           RENDER OPTIONS
        ================================================== */
        function renderOptions(
            keyword = ""
        ){
            const search =
                String(
                    keyword || ""
                )
                .trim()
                .toLowerCase();

            const filtered =
                tujuan.filter(
                    nama =>
                        String(
                            nama || ""
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )
                );
            if(
                !filtered.length
            ){
                options.innerHTML = `
                    <div
                        class="
                            smartoffice-disposisi-empty
                        "
                    >
                        Tidak ada nama ditemukan
                    </div>
                `;
                return;
            }

            options.innerHTML =
                filtered.map(
                    nama => {
                        const value =
                            String(
                                nama || ""
                            ).trim();

                        const selected =
                            smartofficeSuratMasukDisposisiSelected
                                .includes(
                                    value
                                );
                        return `
                            <div
                                class="
                                    smartoffice-disposisi-option
                                    ${selected ? "selected" : ""}
                                "
                                data-value="${value.replace(/"/g, "&quot;")}"
                            >
                                <span
                                    class="
                                        smartoffice-disposisi-check
                                    "
                                >
                                    ${
                                        selected
                                            ? `
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2.5"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <polyline
                                                        points="20 6 9 17 4 12"
                                                    />
                                                </svg>
                                            `
                                            : ""
                                    }
                                </span>

                                <span
                                    class="
                                        smartoffice-disposisi-option-name
                                    "
                                >
                                    ${value}
                                </span>
                            </div>
                        `;
                    }
                )
                .join("");

            /* ==================================================
               CLICK OPTION
            ================================================== */
            options
                .querySelectorAll(
                    ".smartoffice-disposisi-option"
                )
                .forEach(
                    option => {
                        option.addEventListener(
                            "click",
                            function(){
                                const value =
                                    this.dataset.value;

                                const index =
                                    smartofficeSuratMasukDisposisiSelected
                                        .indexOf(
                                            value
                                        );
                                if(
                                    index === -1
                                ){
                                    smartofficeSuratMasukDisposisiSelected
                                        .push(
                                            value
                                        );
                                }
                                else{
                                    smartofficeSuratMasukDisposisiSelected
                                        .splice(
                                            index,
                                            1
                                        );
                                }

                                renderSelected();
                                renderOptions(
                                    searchInput?.value || ""
                                );
                            }
                        );
                    }
                );
        }

        /* ==================================================
           RENDER SELECTED CHIP
        ================================================== */
        function renderSelected(){
            values.innerHTML = "";

            if(
                !smartofficeSuratMasukDisposisiSelected.length
            ){
                values.innerHTML = `
                    <span
                        class="
                            smartoffice-disposisi-placeholder
                        "
                    >
                        Pilih Disposisi
                    </span>
                `;

                return;
            }

            smartofficeSuratMasukDisposisiSelected
                .forEach(
                    value => {
                        const chip =
                            document.createElement(
                                "span"
                            );

                        chip.className =
                            "smartoffice-disposisi-chip";

                        chip.innerHTML = `
                            <span>
                                ${value}
                            </span>

                            <button
                                type="button"
                                class="
                                    smartoffice-disposisi-chip-remove
                                "
                                aria-label="Hapus ${value}"
                            >
                                ×
                            </button>
                        `;

                        chip
                            .querySelector(
                                ".smartoffice-disposisi-chip-remove"
                            )
                            .addEventListener(
                                "click",
                                function(event){
                                    event.stopPropagation();

                                    const index =
                                        smartofficeSuratMasukDisposisiSelected
                                            .indexOf(
                                                value
                                            );
                                    if(
                                        index !== -1
                                    ){
                                        smartofficeSuratMasukDisposisiSelected
                                            .splice(
                                                index,
                                                1
                                            );
                                    }

                                    renderSelected();
                                    renderOptions(
                                        searchInput?.value || ""
                                    );
                                }
                            );

                        values.appendChild(
                            chip
                        );
                    }
                );
        }
        document.addEventListener(
            "click",
            function(){
                container.classList.remove(
                    "open"
                );

                container.classList.remove(
                    "drop-up"
                );
            }
        );

        /* ==================================================
           OPEN / CLOSE DROPDOWN
        ================================================== */
        selectedArea.addEventListener(
            "click",
            function(event){
                event.stopPropagation();
                const isOpen =
                    container.classList.contains(
                        "open"
                    );

                /* ==========================================
                TUTUP
                ========================================== */
                if(isOpen){
                    container.classList.remove(
                        "open"
                    );

                    container.classList.remove(
                        "drop-up"
                    );

                    return;
                }

                /* ==========================================
                BUKA
                ========================================== */
                container.classList.add(
                    "open"
                );

                /* ==========================================
                CEK RUANG DI BAWAH
                ========================================== */
                setTimeout(
                    function(){
                        const rect =
                            container.getBoundingClientRect();

                        const dropdown =
                            container.querySelector(
                                ".smartoffice-disposisi-dropdown"
                            );
                        if(!dropdown){
                            return;
                        }

                        const dropdownHeight =
                            Math.min(
                                dropdown.scrollHeight,
                                270
                            );

                        const spaceBelow =
                            window.innerHeight -
                            rect.bottom;

                        const spaceAbove =
                            rect.top;

                        /* ======================================
                        JIKA BAWAH TIDAK CUKUP
                        BUKA KE ATAS
                        ====================================== */
                        if(
                            spaceBelow <
                                dropdownHeight
                            &&
                            spaceAbove >
                                spaceBelow
                        ){
                            container.classList.add(
                                "drop-up"
                            );
                        }
                        else{
                            container.classList.remove(
                                "drop-up"
                            );
                        }

                        searchInput?.focus();
                    },
                    0
                );
            }
        );

        /* ==================================================
           SEARCH
        ================================================== */
        if(
            searchInput
        ){
            searchInput.addEventListener(
                "input",
                function(){
                    renderOptions(
                        this.value
                    );
                }
            );
        }

        /* ==================================================
           FIRST RENDER
        ================================================== */
        renderSelected();
        renderOptions();
    }
    catch(error){
        console.error(
            "Render Disposisi Error:",
            error
        );

        options.innerHTML = `
            <div
                class="
                    smartoffice-disposisi-empty
                "
            >
                Gagal memuat disposisi
            </div>
        `;
    }
}

/* ======================================================
   INIT UPLOAD SURAT MASUK
   MAKSIMAL 5 MB
====================================================== */
function smartofficeInitUploadSuratMasuk(){
    const input =
        document.getElementById(
            "smartofficeSuratMasukFile"
        );

    const selected =
        document.getElementById(
            "smartofficeSuratMasukUploadSelected"
        );

    const fileName =
        document.getElementById(
            "smartofficeSuratMasukUploadFileName"
        );

    const fileSize =
        document.getElementById(
            "smartofficeSuratMasukUploadFileSize"
        );

    const removeButton =
        document.getElementById(
            "smartofficeSuratMasukUploadRemove"
        );
    if(
        !input ||
        !selected ||
        !fileName ||
        !fileSize ||
        !removeButton
    ){
        return;
    }

    /* ==================================================
       PILIH FILE
    ================================================== */
    input.addEventListener(
        "change",
        function(){
            const file =
                this.files?.[0];
            if(!file){
                return;
            }

            /* MAKSIMAL 5 MB */
            const maxSize =
                5 * 1024 * 1024;
            if(
                file.size >
                maxSize
            ){
                smartofficeShowToast(
                    "Ukuran dokumen maksimal 5 MB",
                    "error"
                );

                this.value = "";
                selected.style.display =
                    "none";

                return;
            }

            /* NAMA FILE */
            fileName.textContent =
                file.name;

            /* UKURAN FILE */
            fileSize.textContent =
                smartofficeFormatFileSize(
                    file.size
                );

            selected.style.display =
                "flex";
        }
    );

    /* ==================================================
       HAPUS FILE TERPILIH
    ================================================== */
    removeButton.addEventListener(
        "click",
        function(){
            input.value = "";
            selected.style.display =
                "none";
        }
    );
}

/* ======================================================
   FORMAT UKURAN FILE
====================================================== */
function smartofficeFormatFileSize(
    bytes
){
    if(
        bytes < 1024
    ){
        return `${bytes} B`;
    }

    if(
        bytes < 1024 * 1024
    ){
        return (
            bytes / 1024
        ).toFixed(1)
        + " KB";
    }

    return (
        bytes /
        (1024 * 1024)
    ).toFixed(1)
    + " MB";
}

/* ======================================================
   VALIDASI SURAT MASUK
====================================================== */
function smartofficeValidateSuratMasuk(){
    const fields = [
        {
            id: "smartofficeSuratMasukTanggalTerima",
            label: "Tanggal Terima"
        },
        {
            id: "smartofficeSuratMasukNomorSurat",
            label: "Nomor Surat"
        },
        {
            id: "smartofficeSuratMasukTanggalSurat",
            label: "Tanggal Surat"
        },
        {
            id: "smartofficeSuratMasukPengirim",
            label: "Pengirim"
        },
        {
            id: "smartofficeSuratMasukPerihal",
            label: "Perihal"
        },
        {
            id: "smartofficeSuratMasukSifat",
            label: "Sifat Surat"
        }
    ];

    const errors = [];
    fields.forEach(
        field => {
            const element =
                document.getElementById(
                    field.id
                );

            if(!element){
                return;
            }

            element.classList.remove(
                "smartoffice-input-error"
            );

            if(
                !String(
                    element.value || ""
                ).trim()
            ){
                errors.push(
                    field.label
                );

                element.classList.add(
                    "smartoffice-input-error"
                );
            }
        }
    );

    /* ==================================================
       VALIDASI DISPOSISI
    ================================================== */
    if(
        !smartofficeSuratMasukDisposisiSelected.length
    ){
        errors.push(
            "Disposisi Ke"
        );
    }

    if(
        errors.length
    ){
        if(
            typeof smartofficeShowToast ===
            "function"
        ){
            smartofficeShowToast(
                "Data wajib diisi: " +
                errors.join(", "),
                "error"
            );
        }
        else{
            alert(
                "Data wajib diisi:\n\n" +
                errors.join("\n")
            );
        }

        return false;
    }

    return true;
}

/* ======================================================
   SUBMIT SURAT MASUK
====================================================== */
export async function smartofficeSubmitSuratMasuk(){
    if(isSubmittingMasuk){
        return;
    }

    /* ==================================================
       VALIDASI
    ================================================== */
    const requiredFields = [
        {
            id: "smartofficeSuratMasukTglTerima",
            label: "Tanggal Terima"
        },
        {
            id: "smartofficeSuratMasukNomorSurat",
            label: "Nomor Surat"
        },
        {
            id: "smartofficeSuratMasukTglSurat",
            label: "Tanggal Surat"
        },
        {
            id: "smartofficeSuratMasukPengirim",
            label: "Pengirim"
        },
        {
            id: "smartofficeSuratMasukSifat",
            label: "Sifat Surat"
        },
        {
            id: "smartofficeSuratMasukPerihal",
            label: "Perihal"
        }
    ];

    const errors = [];
    requiredFields.forEach(
        field => {
            const element =
                document.getElementById(
                    field.id
                );
            if(!element){
                return;
            }

            element.classList.remove(
                "smartoffice-input-error"
            );

            if(
                !String(
                    element.value || ""
                ).trim()
            ){
                errors.push(
                    field.label
                );

                element.classList.add(
                    "smartoffice-input-error"
                );
            }
        }
    );

    /* ==================================================
       VALIDASI DISPOSISI
    ================================================== */
    if(
        !smartofficeSuratMasukDisposisiSelected ||
        !smartofficeSuratMasukDisposisiSelected.length
    ){
        errors.push(
            "Disposisi Ke"
        );
    }

    if(errors.length){
        alert(
            "Data berikut wajib diisi:\n\n" +
            errors.join("\n")
        );

        return;
    }

    /* ==================================================
       LOCK SUBMIT
    ================================================== */
    isSubmittingMasuk = true;

    const submitButton =
        document.getElementById(
            "smartofficeSuratMasukFormSubmit"
        );

    if(submitButton){
        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.innerHTML;

        submitButton.innerHTML =
            "Menyimpan...";
    }

    try{
        /* ==================================================
           DATA FORM
        ================================================== */
        const payload = {
            /* TAMBAH = null
               EDIT = data.rowIndex */
            /*rowIndex:
                smartofficeSuratMasukEditRowIndex ||
                null,*/

            tglTerima:
                document.getElementById(
                    "smartofficeSuratMasukTglTerima"
                )?.value || "",
            nomorSurat:
                document.getElementById(
                    "smartofficeSuratMasukNomorSurat"
                )?.value || "",
            tglSurat:
                document.getElementById(
                    "smartofficeSuratMasukTglSurat"
                )?.value || "",
            pengirim:
                document.getElementById(
                    "smartofficeSuratMasukPengirim"
                )?.value || "",
            perihal:
                document.getElementById(
                    "smartofficeSuratMasukPerihal"
                )?.value || "",
            sifat:
                document.getElementById(
                    "smartofficeSuratMasukSifat"
                )?.value || "",

            /* MULTI DISPOSISI
               DISIMPAN DALAM SATU KOLOM */
            disposisi:
                smartofficeSuratMasukDisposisiSelected
                    .join(", ")
        };

        /* ==================================================
           FILE
        ================================================== */
        const fileInput =
            document.getElementById(
                "smartofficeSuratMasukFile"
            );

        const file =
            fileInput?.files?.[0];

        if(file){
            /* MAX 5 MB */
            if(
                file.size >
                5 * 1024 * 1024
            ){
                throw new Error(
                    "Ukuran dokumen maksimal 5 MB."
                );
            }

            /* FILE → BASE64
               PAKAI UTILS/File.js */
            const base64 =
                await smartofficeConvertFileToBase64(
                    file
                );

            payload.file = {
                name:
                    file.name,
                type:
                    file.type,
                data:
                    base64
            };
        }

        /* ==================================================
           KIRIM KE GAS
        ================================================== */
        await smartofficeSaveSuratMasuk(
            payload
        );

        /* ==================================================
           BERHASIL
        ================================================== */
        if(
            typeof smartofficeShowToast ===
            "function"
        ){
            smartofficeShowToast(
                "Surat Masuk berhasil disimpan.",
                "success"
            );
        }
        else{
            alert(
                "Surat Masuk berhasil disimpan."
            );
        }

        /* ==================================================
           RESET
        ================================================== */
        smartofficeSuratMasukDisposisiSelected =
            [];

        /*smartofficeSuratMasukEditRowIndex =
            null;*/

        /* ==================================================
           TUTUP MODAL
        ================================================== */
        smartofficeCloseFormSuratMasuk();

        /* ==================================================
           LOAD ULANG
        ================================================== */
        await smartofficeLoadDataSuratMasuk();
    }
    catch(error){
        console.error(
            "Gagal menyimpan Surat Masuk:",
            error
        );

        if(
            typeof smartofficeShowToast ===
            "function"
        ){
            smartofficeShowToast(
                error.message ||
                "Gagal menyimpan Surat Masuk.",
                "error"
            );
        }
        else{
            alert(
                error.message ||
                "Gagal menyimpan Surat Masuk."
            );
        }
    }
    finally{
        isSubmittingMasuk =
            false;

        if(submitButton){
            submitButton.disabled =
                false;
            if(
                submitButton.dataset.originalText
            ){
                submitButton.innerHTML =
                    submitButton.dataset.originalText;
            }
        }
    }
}

/* ======================================================
   EXPOSE ACTION KE WINDOW
====================================================== */
window.smartofficeBukaLockSuratMasukUI =
    smartofficeBukaLockSuratMasukUI;

window.smartofficeCloseBukaLockSuratMasukModal =
    smartofficeCloseBukaLockSuratMasukModal;

window.smartofficeConfirmBukaLockSuratMasuk =
    smartofficeConfirmBukaLockSuratMasuk;

window.smartofficeCloseFormSuratMasuk =
    smartofficeCloseFormSuratMasuk;