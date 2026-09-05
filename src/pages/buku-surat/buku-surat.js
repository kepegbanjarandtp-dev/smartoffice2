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
    smartofficeHideGlobalLoading,
    smartofficeShowLoading
} from "../../components/loading/loading.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetAllSuratMasuk,
    smartofficeBukaLockSuratMasuk,
    smartofficeGetMasterSurat,
    smartofficePreviewNomorAgendaMasuk,
    smartofficeSaveSuratMasuk,
    smartofficeGetAllSuratKeluar,
    smartofficeSaveSuratKeluar,
    smartofficeBukaLockSuratKeluar
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
let smartofficeSuratMasukEditRowIndex = null;

let smartofficeBukuSuratTanggalHandler = null;
let smartofficeBukuSuratBulanHandler = null;
let smartofficeBukuSuratSearchHandler = null;

let smartofficeSuratMasukDisposisiSelected = [];


/* =====================================================
   GLOBAL STATE SURAT KELUAR
===================================================== */
let suratKeluarAllData = [];
let suratKeluarViewData = [];

let suratKeluarLoaded = false;

let masterSurat = {};

let isSubmitting = false;

let smartofficeSuratKeluarTanggalHandler = null;
let smartofficeSuratKeluarBulanHandler = null;
let smartofficeSuratKeluarSearchHandler = null;
let smartofficeSuratKeluarStatusHandler = null;
let smartofficeSuratKeluarKlasifikasiOutsideClickHandler = null;


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

    /* ==================================================
       INIT TAB TERLEBIH DAHULU
    ================================================== */
    smartofficeInitBukuSuratTab();

    /* ==================================================
       INIT REFRESH
    ================================================== */
    smartofficeInitBukuSuratRefreshButton();

    /* ==================================================
       INIT AKSES
    ================================================== */
    smartofficeInitAksesSuratMasuk();

    /* ==================================================
       LOAD DATA SURAT MASUK + SURAT KELUAR
    ================================================== */
    await Promise.all([
        smartofficeLoadDataSuratMasuk(),
        loadDataSuratKeluar()
    ]);
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

    /* ==================================================
       FILTER SURAT MASUK
    ================================================== */
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
       FILTER SURAT KELUAR
    ================================================== */
    const tanggalKeluar =
        document.getElementById(
            "smartofficeSuratKeluarFilterTanggal"
        );

    const bulanKeluar =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        );

    const searchKeluar =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        );

    const statusKeluar =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
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
       REMOVE FILTER SURAT MASUK
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
       REMOVE FILTER SURAT KELUAR
    ================================================== */
    if(
        tanggalKeluar &&
        smartofficeSuratKeluarTanggalHandler
    ){
        tanggalKeluar.removeEventListener(
            "change",
            smartofficeSuratKeluarTanggalHandler
        );
    }

    if(
        bulanKeluar &&
        smartofficeSuratKeluarBulanHandler
    ){
        bulanKeluar.removeEventListener(
            "change",
            smartofficeSuratKeluarBulanHandler
        );
    }

    if(
        searchKeluar &&
        smartofficeSuratKeluarSearchHandler
    ){
        searchKeluar.removeEventListener(
            "input",
            smartofficeSuratKeluarSearchHandler
        );
    }

    if(
        statusKeluar &&
        smartofficeSuratKeluarStatusHandler
    ){
        statusKeluar.removeEventListener(
            "change",
            smartofficeSuratKeluarStatusHandler
        );
    }

    /* ==================================================
       REMOVE KLASIFIKASI OUTSIDE CLICK
    ================================================== */
    if(
        smartofficeSuratKeluarKlasifikasiOutsideClickHandler
    ){

        document.removeEventListener(
            "click",
            smartofficeSuratKeluarKlasifikasiOutsideClickHandler
        );

    }

    /* ==================================================
       RESET HANDLER SURAT MASUK
    ================================================== */
    smartofficeBukuSuratTabMasukHandler =
        null;
    smartofficeBukuSuratTabKeluarHandler =
        null;
    smartofficeBukuSuratRefreshHandler =
        null;
    smartofficeBukuSuratTanggalHandler =
        null;
    smartofficeBukuSuratBulanHandler =
        null;
    smartofficeBukuSuratSearchHandler =
        null;
    smartofficeBukuSuratTambahHandler =
        null;

    /* ==================================================
       RESET HANDLER SURAT KELUAR
    ================================================== */
    smartofficeSuratKeluarTanggalHandler =
        null;
    smartofficeSuratKeluarBulanHandler =
        null;
    smartofficeSuratKeluarSearchHandler =
        null;
    smartofficeSuratKeluarStatusHandler =
        null;
    smartofficeSuratKeluarKlasifikasiOutsideClickHandler =
    null;

    /* ==================================================
       RESET DATA SURAT MASUK
    ================================================== */
    suratMasukAllData = [];
    suratMasukViewData = [];
    suratMasukLoaded = false;

    /* ==================================================
       RESET DATA SURAT KELUAR
    ================================================== */
    suratKeluarAllData = [];
    suratKeluarViewData = [];
    suratKeluarLoaded = false;

    /* ==================================================
       RESET MASTER
    ================================================== */
    masterSurat = {};
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
        /* =========================
           LOADING CARD CONTENT
        ========================= */
        const container =
            document.getElementById(
                "smartofficeSuratMasukList"
            );

        if(container){
            container.innerHTML = `
                <div class="
                    smartoffice-loading
                ">
                    <div class="
                        smartoffice-loading-spinner
                    "></div>

                    <div class="
                        smartoffice-loading-text
                    ">
                        Memuat data Surat Masuk...
                    </div>
                </div>
            `;
        }

        /* =========================
           SELESAI LOADING CARD CONTENT
        ========================= */
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

    const title =
        document.querySelector(
            ".smartoffice-suratmasuk-form-title"
        );

    if(title){
        title.textContent =
            isEdit
                ? "Edit Surat Masuk"
                : "Tambah Surat Masuk";
    }

    /* ===============================
       ROW INDEX EDIT
    =============================== */
    smartofficeSuratMasukEditRowIndex =
        data?.rowIndex || null;

    /* ==================================================
       CLOSE MODAL
    ================================================== */
    const closeButton =
        document.getElementById(
            "smartofficeSuratMasukFormClose"
        );

    if(closeButton){
        closeButton.onclick =
            function(){
                smartofficeCloseFormSuratMasuk();
            };
    }

    /* ===============================
       FORMAT TANGGAL INPUT DATE
    =============================== */
    const tanggalTerima =
        parseTanggalMasuk(
            data?.tglTerima
        );

    const tanggalSurat =
        parseTanggalMasuk(
            data?.tglSurat
        );

    const tglTerimaInput =
        tanggalTerima
            ? [
                tanggalTerima.getFullYear(),
                String(
                    tanggalTerima.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    tanggalTerima.getDate()
                ).padStart(2, "0")
            ].join("-")
            : "";

    const tglSuratInput =
        tanggalSurat
            ? [
                tanggalSurat.getFullYear(),
                String(
                    tanggalSurat.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    tanggalSurat.getDate()
                ).padStart(2, "0")
            ].join("-")
            : "";

    body.innerHTML = `
        <form
            id="smartofficeSuratMasukForm"
            class="smartoffice-suratmasuk-form"
        >
            <input
                type="hidden"
                id="rowIndexMasuk"
                value=""
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
                    value="${tglTerimaInput || ""}"
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
                    value="${tglSuratInput || ""}"
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

            <!-- ==================================================
               UPLOAD DOKUMEN
               MAKSIMAL 5 MB
               FILE SAAT INI HANYA SAAT EDIT
            ================================================== -->
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
                .split(";")
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

        submitButton.innerHTML = `
            <span class="smartoffice-btn-spinner"></span>
            <span>Menyimpan...</span>
        `;
    }

    try{
        /* ==================================================
           DATA FORM
        ================================================== */
        const payload = {

            /* TAMBAH = null
            EDIT = data.rowIndex */

            rowIndex:
                smartofficeSuratMasukEditRowIndex ||
                null,

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
                    .join(";")
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
            /* MAX 2 MB */
            if(
                file.size >
                2 * 1024 * 1024
            ){
                throw new Error(
                    "Ukuran dokumen maksimal 2 MB."
                );
            }

            /* FILE → BASE64
               PAKAI UTILS/File.js */
            const base64 =
                await smartofficeConvertFileToBase64(
                    file
                );

            payload.base64 =
                base64;

            payload.fileName =
                file.name;

            payload.fileType =
                file.type;
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


/* =====================================================
   HELPER RESET UI SUBMIT SURAT MASUK
===================================================== */
function resetSubmitMasukUI() {

    isSubmittingMasuk = false;

    document
        .getElementById("btnLoadingMasuk")
        ?.classList.add("hidden");

    document
        .getElementById("btnSimpanMasuk")
        ?.classList.remove("hidden");
}


/* =====================================================
   HELPER NOTIF SURAT MASUK
===================================================== */
function showInlineSuratMasuk() {

  const el = document.getElementById("inlineSuratMasuk");

  if (!el) return;
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.add("hidden");
  }, 1500);
}

function hideInlineSuratMasuk() {
  document.getElementById("inlineSuratMasuk")
    ?.classList.add("hidden");
}


/* =====================================================
   OPEN EDIT MODAL SURAT MASUK
===================================================== */
export async function openEditModalMasuk(rowIndex) {

    /* ===============================
       RESET UI
    =============================== */
    hideInlineSuratMasuk();
    resetSubmitMasukUI();

    /* ===============================
       CARI DATA
    =============================== */
    const item =
        suratMasukAllData.find(
            d =>
                String(d.rowIndex) ===
                String(rowIndex)
        );

    if(!item){
        console.error(
            "Data Surat Masuk tidak ditemukan:",
            rowIndex
        );
        smartofficeShowToast(
            "Data Surat Masuk tidak ditemukan",
            "error"
        );

        return;
    }

    /* ===============================
       RENDER FORM MODE EDIT
    =============================== */
    await smartofficeRenderFormSuratMasuk(
        item
    );

    /* ===============================
       BUKA MODAL
    =============================== */
    const modal =
        document.getElementById(
            "smartofficeSuratMasukFormModal"
        );

    if(modal){
        modal.style.display =
            "flex";
    }

    /* ===============================
       RESET FILE INPUT
    =============================== */
    const fileInput =
        document.getElementById(
            "smartofficeSuratMasukFile"
        );

    if(fileInput){
        fileInput.value = "";
    }
}



/* =====================================================================================================
   SURAT KELUAR
===================================================================================================== */
/* =====================================================
   LOAD DATA SURAT KELUAR
===================================================== */
async function loadDataSuratKeluar(){

    const list =
        document.getElementById(
            "smartofficeSuratKeluarList"
        );

    try{
        /* =========================
           LOADING CARD CONTENT
        ========================= */
        if(list){
            list.innerHTML = `
                <div class="
                    smartoffice-loading
                ">
                    <div class="
                        smartoffice-loading-spinner
                    "></div>

                    <div class="
                        smartoffice-loading-text
                    ">
                        Memuat data Surat Keluar...
                    </div>
                </div>
            `;
        }

        /* AMBIL DATA */
        const res =
            await smartofficeGetAllSuratKeluar();

        suratKeluarAllData =
            Array.isArray(res)
                ? res
                : [];

        /* DATA UNTUK TAMPILAN */
        suratKeluarViewData =
            [...suratKeluarAllData];

        /* RESET STATE */
        resetSuratKeluarViewState();

        /* INIT FILTER */
        initSuratKeluarFilter();

        /* INIT BULAN */
        initBulanSuratKeluar();

        /* KODE SURAT */
        initAutoKodeSurat();

        /* RENDER HASIL AWAL */
        applyFilterSuratKeluar();        

        suratKeluarLoaded = true;

    }catch(error){
        console.error(
            "Load Data Surat Keluar Error:",
            error
        );

        if(list){
            list.innerHTML = `
                <div class="smartoffice-suratkeluar-empty">
                    Gagal memuat data Surat Keluar.
                </div>
            `;
        }

        smartofficeShowToast(
            "Gagal memuat data Surat Keluar",
            "error"
        );
    }
}


/* =====================================================
   MASTER DATA (KODE SURAT, DROPDOWN)
===================================================== */
async function loadMaster(callback){

    try{
        const res =
            await smartofficeGetMasterSurat();

        masterSurat =
            res || {};

        masterSurat.kodeMap =
            {};

        if(
            Array.isArray(
                masterSurat.klasifikasi
            )
        ){
            masterSurat.klasifikasi.forEach(
                k => {
                    masterSurat.kodeMap[
                        k.klasifikasi
                    ] = k.kode;
                }
            );
        }

        renderMasterDropdown();

        if(
            typeof callback === "function"
        ){
            callback();
        }

    }catch(error){
        console.error(
            "Load Master Surat Error:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat master surat.",
            "error"
        );
    }
}


/* ======================================================
   RESET VIEW STATE SURAT KELUAR
====================================================== */
function resetSuratKeluarViewState(){

    /* RESET TANGGAL */
    const tanggal =
        document.getElementById(
            "smartofficeSuratKeluarFilterTanggal"
        );

    if(tanggal){
        tanggal.value = "";
    }

    /* RESET BULAN */
    const bulan =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        );

    if(bulan){
        bulan.value = "";
    }

    /* RESET SEARCH */
    const search =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        );

    if(search){
        search.value = "";
    }

    /* RESET STATUS */
    const status =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
        );

    if(status){
        status.value = "";
    }

    /* RESET DATA VIEW */
    suratKeluarViewData =
        [
            ...suratKeluarAllData
        ];
}


/* ======================================================
   INIT FILTER SURAT KELUAR
====================================================== */
function initSuratKeluarFilter(){

    const tanggal =
        document.getElementById(
            "smartofficeSuratKeluarFilterTanggal"
        );

    const search =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        );

    const bulan =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        );

    const status =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
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
                ).padStart(
                    2,
                    "0"
                )
            }-${
                String(
                    today.getDate()
                ).padStart(
                    2,
                    "0"
                )
            }`;
    }

    /* ==================================================
       EVENT TANGGAL
    ================================================== */
    if(tanggal){
        smartofficeSuratKeluarTanggalHandler =
            function(){

                if(bulan){
                    bulan.value = "";
                }
                applyFilterSuratKeluar();
            };

        tanggal.addEventListener(
            "change",
            smartofficeSuratKeluarTanggalHandler
        );
    }

    /* ==================================================
       EVENT BULAN
    ================================================== */
    if(bulan){
        smartofficeSuratKeluarBulanHandler =
            function(){
                if(
                    bulan.value &&
                    tanggal
                ){
                    tanggal.value = "";
                }
                applyFilterSuratKeluar();
            };

        bulan.addEventListener(
            "change",
            smartofficeSuratKeluarBulanHandler
        );
    }

    /* ==================================================
       EVENT SEARCH
    ================================================== */
    if(search){
        smartofficeSuratKeluarSearchHandler =
            function(){
                applyFilterSuratKeluar();
            };

        search.addEventListener(
            "input",
            smartofficeSuratKeluarSearchHandler
        );
    }

    /* ==================================================
       EVENT STATUS
    ================================================== */
    if(status){
        smartofficeSuratKeluarStatusHandler =
            function(){
                applyFilterSuratKeluar();
            };

        status.addEventListener(
            "change",
            smartofficeSuratKeluarStatusHandler
        );
    }
}


/* ======================================================
   INIT DROPDOWN BULAN SURAT KELUAR
   AMBIL DARI TANGGAL SURAT
====================================================== */
function initBulanSuratKeluar(){

    const select =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        );
    if(!select){
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
        !suratKeluarAllData ||
        !suratKeluarAllData.length
    ){
        return;
    }

    /* ==================================================
       KUMPULKAN BULAN UNIK
    ================================================== */
    const bulanSet =
        new Set();

    suratKeluarAllData.forEach(
        function(row){
            if(!row.tanggal){
                return;
            }

            /*
              FORMAT BACKEND:
              dd-MM-yyyy
            */
            const parts =
                String(
                    row.tanggal
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
   INIT AUTO KODE SURAT
====================================================== */
function initAutoKodeSurat(){

    const klasifikasi =
        document.getElementById("klasifikasi");

    if(!klasifikasi || klasifikasi.dataset.kodeReady){
        return;
    }

    klasifikasi.addEventListener("change", function(){
        const selected =
            this.value;

        const kode =
            masterSurat?.kodeMap?.[selected] || "";

        const kodeField =
            document.getElementById("kodeSurat");

        if(kodeField){
            kodeField.value = kode;
        }
    });

    klasifikasi.dataset.kodeReady = "1";
}


/* ======================================================
   APPLY FILTER SURAT KELUAR
====================================================== */
function applyFilterSuratKeluar(){

    const search =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        )?.value
        ?.trim()
        .toLowerCase() || "";

    const bulan =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        )?.value || "";

    const tanggal =
        document.getElementById(
            "smartofficeSuratKeluarFilterTanggal"
        )?.value || "";

    const status =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
        )?.value || "";

    suratKeluarViewData =
        suratKeluarAllData.filter(item => {

            /* SEARCH */
            if(search){
                const text = `
                    ${item.nomor || ""}
                    ${item.tujuan || ""}
                    ${item.perihal || ""}
                `.toLowerCase();

                if(!text.includes(search)){
                    return false;
                }
            }

            /* STATUS */
            if(status){
                const itemStatus =
                    item.status || "DRAFT";

                if(itemStatus !== status){
                    return false;
                }
            }

            /* TANGGAL */
            if(tanggal){
                const [dd,mm,yyyy] =
                    (item.tanggal || "").split("-");

                if(dd && mm && yyyy){
                    const itemTanggal =
                        `${yyyy}-${mm}-${dd}`;

                    if(itemTanggal !== tanggal){
                        return false;
                    }

                }else{
                    return false;
                }
            }

            /* BULAN */
            if(bulan){

                const [dd,mm,yyyy] =
                    (item.tanggal || "").split("-");

                const itemBulan =
                    `${yyyy}-${mm}`;

                if(itemBulan !== bulan){
                    return false;
                }
            }

            return true;
        });

    renderSuratKeluar();
}


/* ======================================================
   RESET FILTER SURAT KELUAR
====================================================== */
function resetFilterSuratKeluar(){

    const search =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        );

    const bulan =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        );

    const tanggal =
        document.getElementById(
            "smartofficeSuratKeluarFilterTanggal"
        );

    const status =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
        );

    if(search){
        search.value = "";
    }

    if(bulan){
        bulan.value = "";
    }

    if(tanggal){
        tanggal.value = "";
    }

    if(status){
        status.value = "";
    }

    suratKeluarViewData =
        [...suratKeluarAllData];

    renderSuratKeluar();
}


/* ======================================================
   RENDER CARD SURAT KELUAR
====================================================== */
function renderSuratKeluar(){

    const list =
        document.getElementById(
            "smartofficeSuratKeluarList"
        );

    if(!list){
        return;
    }

    if(!suratKeluarViewData.length){

        list.innerHTML = `
            <div class="smartoffice-suratkeluar-empty">
                <div class="smartoffice-suratkeluar-empty-icon">
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
                        <path d="M9 11h6"/>
                        <path d="M9 15h4"/>
                    </svg>
                </div>

                <div class="smartoffice-suratkeluar-empty-title">
                    Tidak Ada Surat Keluar
                </div>

                <div class="smartoffice-suratkeluar-empty-text">
                    Data surat keluar tidak ditemukan.
                </div>
            </div>
        `;

        return;
    }

    list.innerHTML =
        suratKeluarViewData.map(item => {

            const status =
                (item.status || "DRAFT").toUpperCase();

            const isLock =
                status === "LOCK";

            const statusClass =
                isLock
                    ? "smartoffice-suratkeluar-status-lock"
                    : "smartoffice-suratkeluar-status-draft";

            const statusText =
                isLock
                    ? "Terkunci"
                    : "Draft";

            return `

                <div class="smartoffice-suratkeluar-card">

                    <!-- ==================================
                         HEADER
                    ================================== -->
                    <div class="smartoffice-suratkeluar-card-header">
                        <div class="smartoffice-suratkeluar-card-title-wrap">
                            <div
                                class="smartoffice-suratkeluar-card-icon"
                                style="
                                    color:#2563eb;
                                    background:#eff6ff;
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
                                    <path d="M9 11h6"/>
                                    <path d="M9 15h6"/>
                                </svg>
                            </div>

                            <div class="smartoffice-suratkeluar-card-title-content">
                                <div class="smartoffice-suratkeluar-card-number">
                                    ${item.nomor || "-"}
                                </div>

                                <div class="smartoffice-suratkeluar-card-date">
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
                                        <path d="M8 14h.01"/>
                                        <path d="M12 14h.01"/>
                                        <path d="M16 14h.01"/>
                                    </svg>
                                    ${item.tanggal || "-"}
                                </div>
                            </div>
                        </div>

                        <div class="
                            smartoffice-suratkeluar-card-status
                            ${statusClass}
                        ">
                            <span class="smartoffice-suratkeluar-status-dot"></span>
                            ${statusText}
                        </div>
                    </div>

                    <!-- ==================================
                         INFORMASI SURAT
                    ================================== -->
                    <div class="smartoffice-suratkeluar-card-info">
                        <div class="smartoffice-suratkeluar-card-grid">

                            <!-- TUJUAN -->
                            <div class="smartoffice-suratkeluar-card-row">
                                <div
                                    class="smartoffice-suratkeluar-card-label"
                                    style="display:flex;align-items:center;gap:6px;"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="13"
                                        height="13"
                                        fill="none"
                                        stroke="#7c3aed"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>

                                    TUJUAN
                                </div>

                                <div class="smartoffice-suratkeluar-card-value">
                                    ${item.tujuan || "-"}
                                </div>
                            </div>

                            <!-- SIFAT -->
                            <div class="smartoffice-suratkeluar-card-row">
                                <div
                                    class="smartoffice-suratkeluar-card-label"
                                    style="display:flex;align-items:center;gap:6px;"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="13"
                                        height="13"
                                        fill="none"
                                        stroke="#2563eb"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M6 2h9l3 3v17H6z"/>
                                        <path d="M14 2v4h4"/>
                                        <path d="M9 12h6"/>
                                        <path d="M9 16h4"/>
                                    </svg>
                                    SIFAT SURAT
                                </div>

                                <div class="smartoffice-suratkeluar-card-value">
                                    ${item.sifat || "-"}
                                </div>
                            </div>
                        </div>

                        <!-- KLASIFIKASI -->
                        <div class="smartoffice-suratkeluar-card-full">
                            <div
                                class="smartoffice-suratkeluar-card-label"
                                style="display:flex;align-items:center;gap:6px;"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    width="13"
                                    height="13"
                                    fill="none"
                                    stroke="#16a34a"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M20.59 13.41 11 3.82V3H4v7h.82l9.59 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83z"/>
                                    <circle cx="7.5" cy="6.5" r="1"/>
                                </svg>
                                KLASIFIKASI
                            </div>

                            <div class="smartoffice-suratkeluar-card-value">
                                ${item.klasifikasi || "-"}
                            </div>
                        </div>

                        <!-- PERIHAL -->
                        <div class="smartoffice-suratkeluar-card-perihal">
                            <div
                                class="smartoffice-suratkeluar-card-label"
                                style="display:flex;align-items:center;gap:6px;"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    width="13"
                                    height="13"
                                    fill="none"
                                    stroke="#ea580c"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M6 2h9l3 3v17H6z"/>
                                    <path d="M14 2v4h4"/>
                                    <path d="M9 12h6"/>
                                    <path d="M9 16h6"/>
                                </svg>
                                PERIHAL
                            </div>

                            <div class="smartoffice-suratkeluar-card-value">
                                ${item.perihal || "-"}
                            </div>
                        </div>
                    </div>

                    <!-- ==================================
                         ACTION
                    ================================== -->
                    <div class="smartoffice-suratkeluar-card-footer">
                        <button
                            type="button"
                            class="
                                smartoffice-suratkeluar-card-action
                                smartoffice-suratkeluar-action-view
                            "
                            onclick="
                                smartofficeOpenSuratKeluar(
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
                                <path d="M4 4h16v16H4z"/>
                                <path d="M8 8h8"/>
                                <path d="M8 12h8"/>
                                <path d="M8 16h5"/>
                            </svg>
                            <span>Lihat Surat</span>
                        </button>

                        ${
                            !isLock
                            ?
                            `
                            <button
                                type="button"
                                class="
                                    smartoffice-suratkeluar-card-action
                                    smartoffice-suratkeluar-action-edit
                                "
                                onclick="
                                    openEditModalByRowIndex(
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
                                    <path d="M12 20h9"/>
                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>
                                </svg>
                                <span>Ubah Surat</span>
                            </button>
                            `
                            :
                            `
                            <button
                                type="button"
                                class="
                                    smartoffice-suratkeluar-card-action
                                    smartoffice-suratkeluar-action-lock
                                "
                                onclick="
                                    smartofficeBukaLockSuratKeluar(
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
                                        y="10"
                                        width="14"
                                        height="10"
                                        rx="2"
                                    />
                                    <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                                </svg>
                                <span>Buka Lock</span>
                            </button>
                            `
                        }
                    </div>
                </div>
            `;
        }).join("");
}


/* ======================================================
   RENDER FORM SURAT KELUAR
====================================================== */
function smartofficeRenderFormSuratKeluar(data = null){

    const body =
        document.getElementById(
            "smartofficeSuratKeluarFormBody"
        );

    if(!body){
        return;
    }

    const isEdit = !!data;

    const tanggalSurat =
        parseTanggalMasuk(
            data?.tanggal
        );

    const tglSuratInput =
        tanggalSurat
            ? [
                tanggalSurat.getFullYear(),
                String(
                    tanggalSurat.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    tanggalSurat.getDate()
                ).padStart(2, "0")
            ].join("-")
            : "";

    body.innerHTML = `
        <form id="smartofficeSuratKeluarForm">

            <!-- ROW INDEX -->
            <input
                type="hidden"
                id="smartofficeSuratKeluarRowIndex"
                value="${data?.rowIndex || ""}"
            >

            <!-- NOMOR & TANGGAL -->
            <div class="smartoffice-suratkeluar-form-grid">
                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Nomor Surat
                    </label>

                    <input
                        type="text"
                        id="smartofficeSuratKeluarNomorSurat"
                        value="${data?.nomor || ""}"
                        readonly
                    >
                </div>

                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Tanggal Surat
                    </label>

                    <input
                        type="date"
                        id="smartofficeSuratKeluarTglSurat"
                        value="${tglSuratInput}"
                        readonly
                    >
                </div>

                <!-- KLASIFIKASI & KODE SURAT -->
                <div class="smartoffice-suratkeluar-form-classification-row">

                    <!-- KLASIFIKASI -->
                    <div class="smartoffice-suratkeluar-form-group">
                        <label>Klasifikasi Surat</label>
                        <div
                            id="smartofficeSuratKeluarKlasifikasiDropdown"
                            class="smartoffice-suratkeluar-custom-select"
                        >
                            <button
                                type="button"
                                id="smartofficeSuratKeluarKlasifikasiButton"
                                class="smartoffice-suratkeluar-custom-select-button"
                            >
                                <span id="smartofficeSuratKeluarKlasifikasiText">
                                    -- Pilih Klasifikasi --
                                </span>

                                <span class="smartoffice-suratkeluar-custom-select-arrow">
                                    ▾
                                </span>
                            </button>

                            <div
                                id="smartofficeSuratKeluarKlasifikasiOptions"
                                class="smartoffice-suratkeluar-custom-select-options"
                            ></div>
                        </div>

                        <input
                            type="hidden"
                            id="smartofficeSuratKeluarKlasifikasi"
                            value="${data?.klasifikasi || ""}"
                        >
                    </div>

                    <!-- KODE SURAT -->
                    <div class="smartoffice-suratkeluar-form-group">
                        <label>Kode Surat</label>
                        <input
                            type="text"
                            id="smartofficeSuratKeluarKodeSurat"
                            value="${data?.kode || ""}"
                            readonly
                        >
                    </div>
                </div>

                <!-- SIFAT -->
                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Sifat Surat
                    </label>

                    <select
                        id="smartofficeSuratKeluarSifat"
                    >
                        <option value="">
                            -- Pilih --
                        </option>

                        <option value="Biasa">
                            Biasa
                        </option>

                        <option value="Penting">
                            Penting
                        </option>

                        <option value="Rahasia">
                            Rahasia
                        </option>
                    </select>
                </div>

                <!-- TUJUAN -->
                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Tujuan / Penerima
                    </label>

                    <select
                        id="smartofficeSuratKeluarTujuan"
                    >
                        <option value="">
                            -- Pilih --
                        </option>
                    </select>
                </div>

                <!-- PERIHAL -->
                <div class="smartoffice-suratkeluar-form-group smartoffice-suratkeluar-form-full">
                    <label>
                        Perihal
                    </label>

                    <input
                        type="text"
                        id="smartofficeSuratKeluarPerihal"
                        value="${data?.perihal || ""}"
                    >
                </div>

                <!-- PENANDATANGAN -->
                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Pejabat Penandatangan
                    </label>

                    <select
                        id="smartofficeSuratKeluarPenandatangan"
                    >
                        <option value="">
                            -- Pilih --
                        </option>
                    </select>
                </div>

                <!-- KETERANGAN -->
                <div class="smartoffice-suratkeluar-form-group">
                    <label>
                        Keterangan
                    </label>

                    <textarea
                        id="smartofficeSuratKeluarKeterangan"
                        rows="2"
                    >${data?.keterangan || ""}</textarea>
                </div>

                <!-- FILE -->
                <div class="smartoffice-suratkeluar-form-group smartoffice-suratkeluar-form-full">
                    <label>Upload File Surat</label>
                    <div
                        id="smartofficeSuratKeluarUploadBox"
                        class="smartoffice-suratkeluar-upload-box"
                    >
                        <input
                            type="file"
                            id="smartofficeSuratKeluarFile"
                            accept=".pdf,.jpg,.jpeg,.png"
                            hidden
                        >

                        <div
                            id="smartofficeSuratKeluarUploadEmpty"
                            class="smartoffice-suratkeluar-upload-empty"
                        >
                            <div class="smartoffice-suratkeluar-upload-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 16V4"/>
                                    <path d="M7 9l5-5 5 5"/>
                                    <path d="M5 20h14"/>
                                </svg>
                            </div>

                            <div class="smartoffice-suratkeluar-upload-title">
                                Pilih File Surat
                            </div>

                            <div class="smartoffice-suratkeluar-upload-text">
                                PDF, JPG atau PNG · Maksimal 2 MB
                            </div>

                            <button
                                type="button"
                                id="smartofficeSuratKeluarUploadButton"
                                class="smartoffice-suratkeluar-upload-button"
                            >
                                Pilih File
                            </button>
                        </div>

                        <!-- FILE TERPILIH -->
                        <div
                            id="smartofficeSuratKeluarUploadSelected"
                            class="smartoffice-suratkeluar-upload-selected"
                            style="display:none;"
                        >
                            <div class="smartoffice-suratkeluar-file-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6 2h9l3 3v17H6z"/>
                                    <path d="M14 2v4h4"/>
                                    <path d="M9 12h6"/>
                                    <path d="M9 16h5"/>
                                </svg>
                            </div>

                            <div class="smartoffice-suratkeluar-file-info">
                                <div
                                    id="smartofficeSuratKeluarFileName"
                                    class="smartoffice-suratkeluar-file-name"
                                >
                                    -
                                </div>

                                <div
                                    id="smartofficeSuratKeluarFileSize"
                                    class="smartoffice-suratkeluar-file-size"
                                >
                                    -
                                </div>

                            </div>

                            <button
                                type="button"
                                id="smartofficeSuratKeluarFileRemove"
                                class="smartoffice-suratkeluar-file-remove"
                                title="Hapus file"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ACTION -->
            <div class="smartoffice-suratkeluar-form-actions">
                <button
                    type="button"
                    id="smartofficeSuratKeluarFormCancel"
                    class="smartoffice-suratkeluar-form-button smartoffice-suratkeluar-form-cancel"
                >
                    Batal
                </button>

                <button
                    type="submit"
                    id="smartofficeSuratKeluarFormSubmit"
                    class="smartoffice-suratkeluar-form-button smartoffice-suratkeluar-form-submit"
                >
                    Simpan
                </button>
            </div>
        </form>
    `;

    /* ==================================================
       MASTER DROPDOWN
    ================================================== */
    smartofficeRenderMasterSuratKeluar();

    /* ==================================================
       BATAL
    ================================================== */
    const cancel =
        document.getElementById(
            "smartofficeSuratKeluarFormCancel"
        );

    if(cancel){
        cancel.onclick = function(){
            smartofficeCloseFormSuratKeluar();
        };
    }

    /* ==================================================
       CLOSE MODAL
    ================================================== */
    const closeButton =
        document.getElementById(
            "smartofficeSuratKeluarFormClose"
        );

    if(closeButton){

        closeButton.onclick =
            function(){
                smartofficeCloseFormSuratKeluar();
            };
    }

    /* ==================================================
       SUBMIT
    ================================================== */
    const form =
        document.getElementById(
            "smartofficeSuratKeluarForm"
        );

    if(form){
        form.onsubmit =
            function(event){
                event.preventDefault();
                smartofficeSubmitSuratKeluar(
                    event
                );
            };
    }

    /* ==================================================
       UPLOAD FILE SURAT
    ================================================== */
    const fileInput =
        document.getElementById(
            "smartofficeSuratKeluarFile"
        );

    const uploadButton =
        document.getElementById(
            "smartofficeSuratKeluarUploadButton"
        );

    const uploadEmpty =
        document.getElementById(
            "smartofficeSuratKeluarUploadEmpty"
        );

    const uploadSelected =
        document.getElementById(
            "smartofficeSuratKeluarUploadSelected"
        );

    const fileName =
        document.getElementById(
            "smartofficeSuratKeluarFileName"
        );

    const fileSize =
        document.getElementById(
            "smartofficeSuratKeluarFileSize"
        );

    const fileRemove =
        document.getElementById(
            "smartofficeSuratKeluarFileRemove"
        );

    /* ==================================================
    BUKA FILE PICKER
    ================================================== */
    if(uploadButton && fileInput){
        uploadButton.onclick =
            function(event){
                event.stopPropagation();
                fileInput.click();
            };
    }

    /* ==================================================
    PILIH FILE
    ================================================== */
    if(fileInput){
        fileInput.onchange =
            function(){
                const file =
                    this.files?.[0];

                if(!file){
                    return;
                }

                /* BATAS 2 MB */
                const maxSize =
                    2 * 1024 * 1024;

                if(file.size > maxSize){
                    smartofficeShowToast(
                        "Ukuran file maksimal 2 MB",
                        "error"
                    );

                    this.value = "";

                    return;
                }

                /* FORMAT FILE */
                const allowedTypes = [
                    "application/pdf",
                    "image/jpeg",
                    "image/png"
                ];

                if(
                    !allowedTypes.includes(
                        file.type
                    )
                ){
                    smartofficeShowToast(
                        "Format file harus PDF, JPG atau PNG",
                        "error"
                    );

                    this.value = "";
                    return;
                }

                /* TAMPILKAN FILE */
                if(fileName){
                    fileName.textContent =
                        file.name;
                }

                if(fileSize){
                    fileSize.textContent =
                        formatFileSizeSuratKeluar(
                            file.size
                        );
                }

                if(uploadEmpty){
                    uploadEmpty.style.display =
                        "none";
                }

                if(uploadSelected){
                    uploadSelected.style.display =
                        "flex";
                }
            };
    }

    /* ==================================================
    HAPUS FILE
    ================================================== */
    if(fileRemove){
        fileRemove.onclick =
            function(){
                if(fileInput){
                    fileInput.value = "";
                }

                if(uploadSelected){
                    uploadSelected.style.display =
                        "none";
                }

                if(uploadEmpty){
                    uploadEmpty.style.display =
                        "flex";
                }
            };
    }
}


/* ======================================================
   FORMAT UKURAN FILE SURAT KELUAR
====================================================== */
function formatFileSizeSuratKeluar(bytes){

    if(bytes < 1024){
        return bytes + " B";
    }

    if(bytes < 1024 * 1024){
        return (
            (bytes / 1024).toFixed(1) +
            " KB"
        );
    }

    return (
        (bytes / (1024 * 1024)).toFixed(2) +
        " MB"
    );
}


/* ======================================================
   CLOSE FORM SURAT KELUAR
====================================================== */
function smartofficeCloseFormSuratKeluar(){

    const modal =
        document.getElementById(
            "smartofficeSuratKeluarFormModal"
        );

    if(modal){
        modal.classList.remove("show");
    }
}


/* ======================================================
   RENDER MASTER SURAT KELUAR
====================================================== */
function smartofficeRenderMasterSuratKeluar(){

    /* ==================================================
       KLASIFIKASI
    ================================================== */
    const klasifikasiOptions =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasiOptions"
        );

    const klasifikasiButton =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasiButton"
        );

    const klasifikasiText =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasiText"
        );

    const klasifikasiHidden =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasi"
        );

    const kodeField =
        document.getElementById(
            "smartofficeSuratKeluarKodeSurat"
        );

    /* ==================================================
       RENDER PILIHAN KLASIFIKASI
    ================================================== */
    if(
        klasifikasiOptions &&
        masterSurat &&
        Array.isArray(masterSurat.klasifikasi)
    ){
        klasifikasiOptions.innerHTML = "";

        masterSurat.klasifikasi.forEach(item => {
            const option =
                document.createElement("div");

            option.className =
                "smartoffice-suratkeluar-custom-select-option";

            /*
             * TAMPILKAN KLASIFIKASI SAJA
             *
             * Contoh:
             * 800.1.4.1 - Usulan Tugas Belajar
             *
             * BUKAN:
             * 800.1.4.1 - 800.1.4.1 - Usulan Tugas Belajar
             */
            option.textContent =
                item.klasifikasi || "";

            option.dataset.value =
                item.klasifikasi || "";

            option.dataset.kode =
                item.kode || "";

            /* ==================================================
               KETIKA KLASIFIKASI DIPILIH
            ================================================== */
            option.onclick = function(){
                const value =
                    this.dataset.value || "";

                const kode =
                    this.dataset.kode || "";

                /*
                 * SIMPAN KLASIFIKASI
                 */
                if(klasifikasiHidden){
                    klasifikasiHidden.value =
                        value;
                }

                /*
                 * TAMPILKAN KLASIFIKASI
                 */
                if(klasifikasiText){
                    klasifikasiText.textContent =
                        value ||
                        "-- Pilih Klasifikasi --";
                }

                /*
                 * OTOMATIS ISI KODE SURAT
                 */
                if(kodeField){
                    kodeField.value =
                        kode;
                }

                /*
                 * TUTUP DROPDOWN
                 */
                klasifikasiOptions.classList.remove(
                    "show"
                );

                /*
                 * HAPUS ACTIVE DARI PILIHAN LAIN
                 */
                klasifikasiOptions
                    .querySelectorAll(".active")
                    .forEach(el => {
                        el.classList.remove(
                            "active"
                        );
                    });

                /*
                 * ACTIVE PADA PILIHAN TERPILIH
                 */
                this.classList.add(
                    "active"
                );
            };

            klasifikasiOptions.appendChild(
                option
            );
        });
    }

    /* ==================================================
       BUKA / TUTUP DROPDOWN
    ================================================== */
    if(klasifikasiButton){
        klasifikasiButton.onclick =
            function(event){
                event.stopPropagation();
                if(!klasifikasiOptions){
                    return;
                }

                klasifikasiOptions.classList.toggle(
                    "show"
                );
            };
    }

    /* ==================================================
       TUTUP DROPDOWN JIKA KLIK DI LUAR
    ================================================== */
    /*
     * Hapus handler sebelumnya terlebih dahulu
     * supaya tidak menumpuk setiap render form.
     */
    if(
        smartofficeSuratKeluarKlasifikasiOutsideClickHandler
    ){
        document.removeEventListener(
            "click",
            smartofficeSuratKeluarKlasifikasiOutsideClickHandler
        );
    }

    smartofficeSuratKeluarKlasifikasiOutsideClickHandler =
        function(event){
            const dropdown =
                document.getElementById(
                    "smartofficeSuratKeluarKlasifikasiDropdown"
                );

            if(
                dropdown &&
                !dropdown.contains(event.target)
            ){
                const options =
                    document.getElementById(
                        "smartofficeSuratKeluarKlasifikasiOptions"
                    );

                if(options){
                    options.classList.remove(
                        "show"
                    );
                }
            }
        };

    document.addEventListener(
        "click",
        smartofficeSuratKeluarKlasifikasiOutsideClickHandler
    );

    /* ==================================================
       TUJUAN
    ================================================== */
    const tujuan =
        document.getElementById(
            "smartofficeSuratKeluarTujuan"
        );

    if(tujuan){
        tujuan.innerHTML = `
            <option value="">
                -- Pilih --
            </option>
        `;

        if(
            masterSurat &&
            Array.isArray(masterSurat.tujuan)
        ){
            masterSurat.tujuan.forEach(item => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item;

                option.textContent =
                    item;

                tujuan.appendChild(
                    option
                );
            });
        }
    }

    /* ==================================================
       PENANDATANGAN
    ================================================== */
    const penandatangan =
        document.getElementById(
            "smartofficeSuratKeluarPenandatangan"
        );

    if(penandatangan){
        penandatangan.innerHTML = `
            <option value="">
                -- Pilih --
            </option>
        `;

        if(
            masterSurat &&
            Array.isArray(masterSurat.penandatangan)
        ){
            masterSurat.penandatangan.forEach(item => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item;

                option.textContent =
                    item;

                penandatangan.appendChild(
                    option
                );
            });
        }
    }
}


/* ======================================================
   SET SELECT VALUE
====================================================== */
function smartofficeSetSelectValue(id, value){

    const select =
        document.getElementById(id);

    if(!select || !value){
        return;
    }

    const option =
        Array.from(select.options)
            .find(
                item =>
                    item.value.trim() ===
                    String(value).trim()
            );
    if(option){
        option.selected = true;
    }
}


/* ======================================================
   OPEN EDIT MODAL SURAT KELUAR
====================================================== */
async function openEditModalByRowIndex(rowIndex){

    /* CARI DATA */
    const item =
        suratKeluarAllData.find(
            data =>
                Number(data.rowIndex) ===
                Number(rowIndex)
        );

    if(!item){

        smartofficeShowToast(
            "Data Surat Keluar tidak ditemukan",
            "error"
        );

        return;
    }


    /* ==================================================
       BUKA MODAL TERLEBIH DAHULU
    ================================================== */

    smartofficeRenderFormSuratKeluar(item);

    const modal =
        document.getElementById(
            "smartofficeSuratKeluarFormModal"
        );

    if(modal){
        modal.classList.add("show");
    }


    /* ==================================================
       LOAD MASTER JIKA BELUM ADA
    ================================================== */

    if(
        !masterSurat ||
        !Array.isArray(masterSurat.klasifikasi)
    ){

        try{

            masterSurat =
                await smartofficeGetMasterSurat();

        }catch(error){

            console.error(
                "Gagal memuat master Surat Keluar:",
                error
            );

            smartofficeShowToast(
                "Master Surat Keluar gagal dimuat",
                "error"
            );

            return;
        }
    }


    /* ==================================================
       RENDER MASTER
    ================================================== */

    smartofficeRenderMasterSuratKeluar();


    /* ==================================================
       ISI NILAI KLASIFIKASI
    ================================================== */

    const klasifikasiHidden =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasi"
        );

    const klasifikasiText =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasiText"
        );

    const kodeField =
        document.getElementById(
            "smartofficeSuratKeluarKodeSurat"
        );


    const klasifikasiMaster =
        masterSurat?.klasifikasi?.find(
            option =>
                String(
                    option.klasifikasi || ""
                ).trim() ===
                String(
                    item.klasifikasi || ""
                ).trim()
        );


    if(klasifikasiHidden){

        klasifikasiHidden.value =
            item.klasifikasi || "";

    }


    if(klasifikasiText){

        klasifikasiText.textContent =
            item.klasifikasi ||
            "-- Pilih Klasifikasi --";

    }


    if(kodeField){

        kodeField.value =
            item.kode ||
            klasifikasiMaster?.kode ||
            "";

    }


    /* ==================================================
       ISI SELECT BIASA
    ================================================== */

    smartofficeSetSelectValue(
        "smartofficeSuratKeluarSifat",
        item.sifat
    );

    smartofficeSetSelectValue(
        "smartofficeSuratKeluarTujuan",
        item.tujuan
    );

    smartofficeSetSelectValue(
        "smartofficeSuratKeluarPenandatangan",
        item.penandatangan
    );
}


/* ======================================================
   BUKA LOCK SURAT KELUAR
====================================================== */
async function smartofficeBukaLockSuratKeluarUI(
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
            "smartofficeSuratKeluarFilterTanggal"
        )?.value || "";

    const filterSearch =
        document.getElementById(
            "smartofficeSuratKeluarFilterSearch"
        )?.value || "";

    const filterBulan =
        document.getElementById(
            "smartofficeSuratKeluarFilterBulan"
        )?.value || "";

    const filterStatus =
        document.getElementById(
            "smartofficeSuratKeluarFilterStatus"
        )?.value || "";

    /* ==================================================
       BUKA MODAL KONFIRMASI
    ================================================== */
    smartofficeOpenBukaLockSuratKeluarModal(
        rowIndex,
        filterTanggal,
        filterSearch,
        filterBulan,
        filterStatus,
        sessionData
    );
}


/* ======================================================
   MODAL KONFIRMASI BUKA LOCK
====================================================== */
function smartofficeOpenBukaLockSuratKeluarModal(
    rowIndex,
    filterTanggal,
    filterSearch,
    filterBulan,
    filterStatus,
    sessionData
){
    const modal =
        document.getElementById(
            "smartofficeSuratKeluarLockModal"
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

    modal.dataset.filterStatus =
        filterStatus;

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
function smartofficeCloseBukaLockSuratKeluarModal(){

    const modal =
        document.getElementById(
            "smartofficeSuratKeluarLockModal"
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
async function smartofficeConfirmBukaLockSuratKeluar(){ 
 
    const modal = 
        document.getElementById( 
            "smartofficeSuratKeluarLockModal" 
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
 
    const filterStatus = 
        modal.dataset.filterStatus || ""; 
 
    const nip = 
        modal.dataset.nip || ""; 
 
    const role = 
        modal.dataset.role || ""; 
 
    /* ================================================== 
       GLOBAL LOADING 
    ================================================== */ 
    smartofficeShowGlobalLoading( 
        "Membuka lock Surat Keluar..." 
    ); 
 
    try{ 
        /* ================================================== 
           BUKA LOCK DI BACKEND 
        ================================================== */ 
        await smartofficeBukaLockSuratKeluar( 
            rowIndex, 
            nip, 
            role 
        ); 
 
        /* ================================================== 
           TUTUP MODAL SETELAH BERHASIL 
        ================================================== */ 
        smartofficeCloseBukaLockSuratKeluarModal(); 
 
        /* ================================================== 
           RELOAD DATA 
        ================================================== */ 
        await loadDataSuratKeluar(); 
 
        /* ================================================== 
           KEMBALIKAN FILTER 
        ================================================== */ 
        const tanggal = 
            document.getElementById( 
                "smartofficeSuratKeluarFilterTanggal" 
            ); 
 
        const search = 
            document.getElementById( 
                "smartofficeSuratKeluarFilterSearch" 
            ); 
 
        const bulan = 
            document.getElementById( 
                "smartofficeSuratKeluarFilterBulan" 
            ); 
 
        const status = 
            document.getElementById( 
                "smartofficeSuratKeluarFilterStatus" 
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
 
        if(status){ 
            status.value = 
                filterStatus; 
        } 
 
        /* ================================================== 
           TERAPKAN FILTER 
        ================================================== */ 
        applyFilterSuratKeluar(); 
 
        /* ================================================== 
           TOAST SUKSES 
        ================================================== */ 
        smartofficeShowToast( 
            "Surat Keluar berhasil dibuka menjadi DRAFT.", 
            "success" 
        ); 
    } 
    catch(error){ 
        console.error( 
            "Buka Lock Surat Keluar Error:", 
            error 
        ); 
 
        smartofficeShowToast( 
            error.message || 
            "Gagal membuka lock Surat Keluar.", 
            "error" 
        ); 
    } 
    finally{ 
        smartofficeHideGlobalLoading(); 
    } 
}


/* ======================================================
   SUBMIT SURAT KELUAR
====================================================== */
async function smartofficeSubmitSuratKeluar(
    event
){

    event.preventDefault();


    /* ==================================================
       AMBIL ELEMENT
    ================================================== */

    const rowIndex =
        document.getElementById(
            "smartofficeSuratKeluarRowIndex"
        )?.value || "";

    const kode =
        document.getElementById(
            "smartofficeSuratKeluarKodeSurat"
        )?.value.trim() || "";

    const klasifikasi =
        document.getElementById(
            "smartofficeSuratKeluarKlasifikasi"
        )?.value.trim() || "";

    const sifat =
        document.getElementById(
            "smartofficeSuratKeluarSifat"
        )?.value.trim() || "";

    const tujuan =
        document.getElementById(
            "smartofficeSuratKeluarTujuan"
        )?.value.trim() || "";

    const perihal =
        document.getElementById(
            "smartofficeSuratKeluarPerihal"
        )?.value.trim() || "";

    const penandatangan =
        document.getElementById(
            "smartofficeSuratKeluarPenandatangan"
        )?.value.trim() || "";

    const keterangan =
        document.getElementById(
            "smartofficeSuratKeluarKeterangan"
        )?.value.trim() || "";

    const fileInput =
        document.getElementById(
            "smartofficeSuratKeluarFile"
        );


    /* ==================================================
       VALIDASI
    ================================================== */

    const requiredFields = [
        {
            value:kode,
            label:"Kode Surat"
        },
        {
            value:klasifikasi,
            label:"Klasifikasi Surat"
        },
        {
            value:sifat,
            label:"Sifat Surat"
        },
        {
            value:tujuan,
            label:"Tujuan / Penerima"
        },
        {
            value:perihal,
            label:"Perihal"
        },
        {
            value:penandatangan,
            label:"Pejabat Penandatangan"
        }
    ];


    const emptyFields =
        requiredFields.filter(
            field => !field.value
        );


    if(emptyFields.length){

        smartofficeShowToast(
            "Data wajib diisi: " +
            emptyFields
                .map(field => field.label)
                .join(", "),
            "error"
        );

        return;
    }


    /* ==================================================
       CEK FILE
    ================================================== */

    const file =
        fileInput?.files?.[0] || null;


    if(file){

        /* MAKSIMAL 2 MB */
        if(
            file.size >
            2 * 1024 * 1024
        ){

            smartofficeShowToast(
                "Ukuran file maksimal 2 MB.",
                "error"
            );

            return;
        }

    }


    /* ==================================================
       TOMBOL SIMPAN
    ================================================== */

    const submitButton =
        document.getElementById(
            "smartofficeSuratKeluarFormSubmit"
        );

    const cancelButton =
        document.getElementById(
            "smartofficeSuratKeluarFormCancel"
        );


    if(submitButton){

        submitButton.disabled = true;

        submitButton.innerHTML = `
            <span class="smartoffice-btn-spinner"></span>
            <span>Menyimpan...</span>
        `;

    }


    if(cancelButton){

        cancelButton.disabled = true;

    }


    /* ==================================================
       PAYLOAD
    ================================================== */

    const payload = {

        rowIndex:rowIndex,

        kode:kode,

        klasifikasi:klasifikasi,

        sifat:sifat,

        tujuan:tujuan,

        perihal:perihal,

        penandatangan:penandatangan,

        keterangan:keterangan

    };


    try{

        /* ==================================================
           FILE
        ================================================== */

        if(file){

            const base64 =
                await new Promise(
                    (resolve,reject) => {

                        const reader =
                            new FileReader();

                        reader.onload =
                            function(){

                                const result =
                                    reader.result;

                                resolve(
                                    String(result)
                                        .split(",")[1]
                                );

                            };

                        reader.onerror =
                            reject;

                        reader.readAsDataURL(
                            file
                        );

                    }
                );


            payload.base64 =
                base64;

            payload.fileName =
                file.name;

            payload.fileType =
                file.type;

        }


        /* ==================================================
           SIMPAN KE SERVER
        ================================================== */

        await smartofficeSaveSuratKeluar(
            payload
        );


        /* ==================================================
           TUTUP MODAL
        ================================================== */

        smartofficeCloseFormSuratKeluar();


        /* ==================================================
           RELOAD DATA
        ================================================== */

        await loadDataSuratKeluar();


        /* ==================================================
           TOAST
        ================================================== */

        smartofficeShowToast(
            "Surat Keluar berhasil disimpan.",
            "success"
        );

    }
    catch(error){

        console.error(
            "Submit Surat Keluar Error:",
            error
        );


        smartofficeShowToast(
            error.message ||
            "Gagal menyimpan Surat Keluar.",
            "error"
        );


        /* KEMBALIKAN TOMBOL */

        if(submitButton){

            submitButton.disabled = false;

            submitButton.innerHTML =
                "Simpan";

        }


        if(cancelButton){

            cancelButton.disabled = false;

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

window.openEditModalMasuk =
    openEditModalMasuk;

window.openEditModalByRowIndex =
    openEditModalByRowIndex;

window.smartofficeBukaLockSuratKeluar =
    smartofficeBukaLockSuratKeluarUI;

window.smartofficeOpenBukaLockSuratKeluarModal =
    smartofficeOpenBukaLockSuratKeluarModal;

window.smartofficeCloseBukaLockSuratKeluarModal =
    smartofficeCloseBukaLockSuratKeluarModal;

window.smartofficeConfirmBukaLockSuratKeluar =
    smartofficeConfirmBukaLockSuratKeluar;