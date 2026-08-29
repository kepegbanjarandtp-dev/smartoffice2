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
    smartofficeBukaLockSuratMasuk
} from "../../services/buku-surat.service.js";


/* ======================================================
   GLOBAL STATE SURAT MASUK
====================================================== */
let suratMasukAllData = [];
let suratMasukViewData = [];
let suratMasukLoaded = false;


/* ======================================================
   LIFECYCLE
====================================================== */

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

    /* LOAD DATA SURAT MASUK */
    await smartofficeLoadDataSuratMasuk();

    /* INIT TAB */
    smartofficeInitBukuSuratTab();

    /* INIT REFRESH */
    smartofficeInitBukuSuratRefreshButton();

    /* INIT AKSES TOMBOL TAMBAH SURAT */
    smartofficeInitAksesSuratMasuk();
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){
    suratMasukAllData = [];
    suratMasukViewData = [];
    suratMasukLoaded = false;
}


/* ======================================================
   LOAD DATA
====================================================== */

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

    if(
        tabSuratMasuk
    ){

        tabSuratMasuk.addEventListener(
            "click",
            function(){

                tabSuratMasuk.classList.add(
                    "active"
                );

                if(
                    tabSuratKeluar
                ){
                    tabSuratKeluar.classList.remove(
                        "active"
                    );
                }


                if(
                    suratMasukContent
                ){
                    suratMasukContent.style.display =
                        "";
                }


                if(
                    suratKeluarContent
                ){
                    suratKeluarContent.style.display =
                        "none";
                }

            }
        );

    }


    /* ==================================================
       SURAT KELUAR
    ================================================== */

    if(
        tabSuratKeluar
    ){

        tabSuratKeluar.addEventListener(
            "click",
            function(){

                tabSuratKeluar.classList.add(
                    "active"
                );

                if(
                    tabSuratMasuk
                ){
                    tabSuratMasuk.classList.remove(
                        "active"
                    );
                }


                if(
                    suratKeluarContent
                ){
                    suratKeluarContent.style.display =
                        "";
                }


                if(
                    suratMasukContent
                ){
                    suratMasukContent.style.display =
                        "none";
                }

            }
        );

    }

}


/* ======================================================
   AKSES TOMBOL TAMBAH SURAT MASUK
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
            "KAPUS"
        ].includes(
            role
        );


    /* TOMBOL TAMBAH */

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
        button.dataset.ready
    ){
        return;
    }


    button.addEventListener(
        "click",
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

        }
    );


    button.dataset.ready =
        "1";

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
       PILIH TANGGAL → BULAN DIKOSONGKAN
    ================================================== */

    if(
        tanggal &&
        !tanggal.dataset.ready
    ){

        tanggal.addEventListener(
            "change",
            function(){

                if(
                    bulan
                ){
                    bulan.value = "";
                }

                applyFilterMasuk();

            }
        );

        tanggal.dataset.ready =
            "1";

    }


    /* ==================================================
       EVENT BULAN
       PILIH BULAN → TANGGAL DIKOSONGKAN
    ================================================== */

    if(
        bulan &&
        !bulan.dataset.ready
    ){

        bulan.addEventListener(
            "change",
            function(){

                if(
                    bulan.value &&
                    tanggal
                ){
                    tanggal.value = "";
                }

                applyFilterMasuk();

            }
        );

        bulan.dataset.ready =
            "1";

    }


    /* ==================================================
       EVENT SEARCH
    ================================================== */

    if(
        search &&
        !search.dataset.ready
    ){

        search.addEventListener(
            "input",
            applyFilterMasuk
        );

        search.dataset.ready =
            "1";

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
            "KAPUS"
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
                canManage &&
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

    const yakin =
        confirm(
            "Buka lock Surat Masuk ini?\n\n" +
            "Status surat akan dikembalikan menjadi DRAFT."
        );


    if(
        !yakin
    ){
        return;
    }


    smartofficeShowGlobalLoading(
        "Membuka lock Surat Masuk..."
    );


    try{

        await smartofficeBukaLockSuratMasuk(
            rowIndex
        );


        smartofficeShowToast(
            "Surat Masuk berhasil dibuka menjadi DRAFT.",
            "success"
        );


        await smartofficeLoadDataSuratMasuk();

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