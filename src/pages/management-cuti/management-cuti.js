/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeClearSession,
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
}
from "../../components/toast/toast.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeShowLoading
} from "../../components/loading/loading.js";

/* ======================================================
   CUTI
====================================================== */
import {
    smartofficeGetApprovalBadge
} from "../cuti/cuti.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetRekapPegawai,
    smartofficeGetAllRiwayatCuti,
    smartofficeGetKapus
} from "../../services/management-cuti.service.js";

/* ======================================================
   UTILS
====================================================== */
import {
    formatTanggalIndonesia
} from "../../utils/date.js";

import {
  smartofficeGetDriveFileId
} from "../../utils/drive.js";

import {
    smartofficeExportRiwayatCutiPdf
} from "../../utils/print.js";


/* ================================================================================
   GLOBAL STATE
================================================================================ */
let smartofficeManagementRekapData = [];
let smartofficeManagementRiwayatData = [];


/* ================================================================================
   LOAD PAGE
================================================================================ */
export async function smartofficeLoadPage(){

    /* =========================
       CHECK LOGIN SESSION
    ========================= */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* =========================
       GET SESSION
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
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "management-cuti"
    );

    /* =========================
       DEFAULT TAB
    ========================= */
    smartofficeSwitchManagementCutiTab(
        "rekap"
    );

    /* =========================
       INIT EVENT
    ========================= */
    smartofficeInitManagementSearch();

    /* =========================
        LOAD DATA
    ========================= */
    await Promise.all([
        smartofficeLoadRekapPegawai(),
        smartofficeLoadAllRiwayatCuti()
    ]);

    /* =========================
    LOAD FILTER PEGAWAI
    SETELAH DATA REKAP SIAP
    ========================= */
    smartofficeLoadPegawaiFilter();
}

/* ================================================================================
   DESTROY PAGE
================================================================================ */
export async function smartofficeDestroyPage(){

    /* RESET CACHE */
    smartofficeManagementRekapData = [];
    smartofficeManagementRiwayatData = [];
}


/* ================================================================================
   TAB
================================================================================ */

/* ======================================================
   SWITCH TAB MANAGEMENT CUTI
====================================================== */
export function smartofficeSwitchManagementCutiTab(
    tab
){

    /* CONTENT */
    const rekapContent =
        document.getElementById(
            "smartofficeManagementRekapContent"
        );

    const riwayatContent =
        document.getElementById(
            "smartofficeManagementRiwayatContent"
        );

    /* BUTTON */
    const rekapButton =
        document.getElementById(
            "smartofficeTabRekapCuti"
        );

    const riwayatButton =
        document.getElementById(
            "smartofficeTabRiwayatManagement"
        );

    /* VALIDASI */
    if(
        !rekapContent ||
        !riwayatContent ||
        !rekapButton ||
        !riwayatButton
    ){
        return;
    }

    /* RESET ACTIVE */
    rekapButton.classList.remove(
        "active"
    );

    riwayatButton.classList.remove(
        "active"
    );

    /* =========================
       TAB REKAP
    ========================= */
    if(
        tab === "rekap"
    ){
        rekapContent.style.display =
            "block";

        riwayatContent.style.display =
            "none";

        rekapButton.classList.add(
            "active"
        );
    }

    /* =========================
       TAB RIWAYAT
    ========================= */
    else{
        rekapContent.style.display = "none";
        riwayatContent.style.display = "block";

        riwayatButton.classList.add("active");
    }
}

window.smartofficeSwitchManagementCutiTab =
    smartofficeSwitchManagementCutiTab;


/* ================================================================================
   LOAD REKAP PEGAWAI
================================================================================ */
export async function smartofficeLoadRekapPegawai(){

    console.log(
        document.getElementById(
            "smartofficeManagementTotalPegawai"
        )
    );

    console.log(
        document.getElementById(
            "smartofficeManagementRekapList"
        )
    );

    /* =========================
       LOADING MINI STAT
    ========================= */
    document.getElementById(
        "smartofficeManagementTotalPegawai"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    /* =========================
       SHOW LOADING
    ========================= */
    smartofficeShowLoading(
        "smartofficeManagementRekapList",
        "Memuat data pegawai..."
    );

    /* Beri kesempatan browser render spinner */
    await new Promise(resolve =>
        requestAnimationFrame(resolve)
    );

    try{

        /* =========================
           LOAD DATA
        ========================= */
        const data =
            await smartofficeGetRekapPegawai();

        /* =========================
           SAVE CACHE
        ========================= */
        smartofficeManagementRekapData =
            data || [];

        /* =========================
           RENDER CARD
        ========================= */
        smartofficeRenderRekapPegawai(
            smartofficeManagementRekapData
        );

        /* =========================
           UPDATE MINI STAT
        ========================= */
        document.getElementById(
            "smartofficeManagementTotalPegawai"
        ).innerText =
            smartofficeManagementRekapData.length;

    }
    catch(error){
        console.error(error);

        smartofficeShowToast(
            "Gagal memuat rekap pegawai",
            "error"
        );
    }
}


/* ================================================================================
   RENDER REKAP PEGAWAI
================================================================================ */
function smartofficeRenderRekapPegawai(
    data = smartofficeManagementRekapData
){

    /* CONTAINER */
    const container =
        document.getElementById(
            "smartofficeManagementRekapList"
        );

    if(
        !container
    ){
        return;
    }

    /* EMPTY DATA */
    if(
        !data ||
        data.length === 0
    ){
        container.innerHTML = `
            <div class="smartoffice-empty-state">
                <h3>
                    Data tidak ditemukan
                </h3>
            </div>
        `;

        return;
    }

    /* HTML */
    const html = [];

    /* LOOP DATA */
    data.forEach(function(item){

        /* LABEL IDENTITAS */
        const identitasLabel =
            item.statusKepegawaian === "BLUD"
                ? "NRP"
                : "NIP";

        html.push(`

            <div
                class="smartoffice-management-card"
                data-nip="${item.nip}"
            >

                <!-- AVATAR -->
                <div class="smartoffice-management-avatar">
                    ${
                        item.nama
                        ? item.nama.trim().charAt(0).toUpperCase()
                        : "-"
                    }
                </div>

                <!-- CONTENT -->
                <div class="smartoffice-management-card-content">

                    <h3>
                        ${item.nama}
                    </h3>

                    <small>
                        ${identitasLabel} :
                        ${item.nip}
                    </small>

                    <p class="smartoffice-management-jabatan">
                        ${item.jabatan}
                    </p>

                    <div class="smartoffice-management-divider"></div>

                    <!-- SUMMARY -->
                    <div class="smartoffice-management-summary">

                        <div class="smartoffice-management-summary-item">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 2v4"/>
                                <path d="M16 2v4"/>
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M3 10h18"/>
                            </svg>

                            <strong>
                                ${item.totalCuti || 0}
                            </strong>

                            <span>
                                Jumlah Cuti Tahunan
                            </span>
                        </div>

                        <div class="smartoffice-management-summary-item">
                            <svg viewBox="0 0 24 24">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>

                             <strong>
                                ${item.cutiTerpakai || 0}
                            </strong>

                            <span>
                                Cuti Tahunan Terpakai
                            </span>
                        </div>

                        <div class="smartoffice-management-summary-item">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2v20"/>
                                <path d="M5 9l7-7 7 7"/>
                            </svg>

                            <strong>
                                ${item.sisaCuti || 0}
                            </strong>

                            <span>
                                Sisa Cuti Tahunan
                            </span>
                        </div>
                    </div>
                </div>

                <!-- STATUS -->
                <div
                    class="
                        smartoffice-management-status-badge
                        ${String(item.statusKepegawaian || "")
                            .toLowerCase()
                            .replaceAll(" ","-")}
                    "
                >
                    ${item.statusKepegawaian}
                </div>

            </div>

        `);
    });

    /* RENDER */
    container.innerHTML =
        html.join("");

    /* EVENT */
    container
        .querySelectorAll(
            ".smartoffice-management-card"
        )
        .forEach(function(card){

            card.addEventListener(
                "click",
                function(){
                    smartofficeOpenRiwayatPegawai(
                        card.dataset.nip
                    );
                }
            );
        });
}


/* ================================================================================
   LOAD SEMUA RIWAYAT CUTI
================================================================================ */
export async function smartofficeLoadAllRiwayatCuti(){

    /* =========================
       LOADING MINI STAT
    ========================= */
    document.getElementById(
        "smartofficeManagementMenunggu"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    document.getElementById(
        "smartofficeManagementDisetujui"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    /* =========================
       SHOW LOADING
    ========================= */
    smartofficeShowLoading(
        "smartofficeManagementRiwayatList",
        "Memuat riwayat cuti..."
    );

    /* Beri kesempatan browser render spinner */
    await new Promise(resolve =>
        requestAnimationFrame(resolve)
    );

    try{

        /* =========================
           LOAD DATA
        ========================= */
        const data =
            await smartofficeGetAllRiwayatCuti();

        /* =========================
           SAVE CACHE
        ========================= */
        smartofficeManagementRiwayatData =
            data || [];

        window.smartofficeManagementRiwayatFilteredData =
            [
                ...smartofficeManagementRiwayatData
            ];

        /* =========================
           RENDER LIST
        ========================= */
        smartofficeRenderManagementRiwayat(
            smartofficeManagementRiwayatData
        );

        /* =========================
           LOAD FILTER
        ========================= */
        //smartofficeLoadPegawaiFilter();
        smartofficeLoadTahunFilter();
        smartofficeSetDefaultManagementBulan();

        /* DEFAULT FILTER */
        smartofficeFilterManagementRiwayat();

        /* =========================
           HITUNG MENUNGGU
        ========================= */
        const menunggu =
            smartofficeManagementRiwayatData.filter(
                item =>

                    item.status ===
                    "MENUNGGU_APPROVAL_1"

                    ||

                    item.status ===
                    "MENUNGGU_APPROVAL_2"

            ).length;

        /* =========================
           HITUNG DISETUJUI
        ========================= */
        const disetujui =
            smartofficeManagementRiwayatData.filter(
                item =>
                    item.status ===
                    "DISETUJUI"
            ).length;

        /* =========================
           UPDATE MINI STAT
        ========================= */
        document.getElementById(
            "smartofficeManagementMenunggu"
        ).innerText =
            menunggu;

        document.getElementById(
            "smartofficeManagementDisetujui"
        ).innerText =
            disetujui;

    }
    catch(error){
        console.error(error);

        smartofficeShowToast(
            "Gagal memuat riwayat cuti",
            "error"
        );
    }
}


/* ================================================================================
   RENDER RIWAYAT MANAGEMENT CUTI
================================================================================ */
function smartofficeRenderManagementRiwayat(
    data = smartofficeManagementRiwayatData
){

    /* CONTAINER */
    const container =
        document.getElementById(
            "smartofficeManagementRiwayatList"
        );

    /* VALIDASI */
    if(
        !container
    ){
        return;
    }

    /* EMPTY DATA */
    if(
        !data ||
        data.length === 0
    ){
        container.innerHTML = `
            <div class="smartoffice-empty-state">
                <div class="smartoffice-empty-icon">
                    📭
                </div>

                <h3>
                    Data tidak ditemukan
                </h3>

                <p>
                    Tidak ada riwayat cuti sesuai filter yang dipilih
                </p>
            </div>
        `;

        return;
    }

    /* HTML */
    const html = [];

    /* LOOP DATA */
    data.forEach(function(item){

        /* STATUS */
        let statusClass =
            "waiting";

        let statusText =
            "Menunggu";

        if(
            item.status ===
            "DISETUJUI"
        ){
            statusClass =
                "approved";

            statusText =
                "Disetujui";
        }

        if(
            item.status ===
            "DITOLAK"
        ){
            statusClass =
                "rejected";

            statusText =
                "Ditolak";
        }

        /* TANGGAL */
        const startDate =
            new Date(
                item.tanggalAwal
            );

        const day =
            startDate.getDate();

        const month =
            startDate
                .toLocaleString(
                    "id-ID",
                    {
                        month:"short"
                    }
                )
                .toUpperCase();

        /* IDENTITAS */
        const identitasLabel =
            item.statusKepegawaian ===
            "BLUD"

            ?

            "NRP"

            :

            "NIP";

        /* PERIODE */
        const periodeCuti =

            item.tanggalAwal ===
            item.tanggalAkhir

            ?

            formatTanggalIndonesia(
                item.tanggalAwal
            )

            :

            `${formatTanggalIndonesia(
                item.tanggalAwal
            )} - ${formatTanggalIndonesia(
                item.tanggalAkhir
            )}`;

        html.push(`

            <div
                class="smartoffice-management-riwayat-card"
                onclick='
                    smartofficeOpenManagementCutiDetail(
                        ${JSON.stringify(item)}
                    )
                '
            >
                <div class="smartoffice-riwayat-date">
                    <small>
                        ${month}
                    </small>

                    <strong>
                        ${day}
                    </strong>
                </div>

                <div class="smartoffice-management-riwayat-content">
                    <h3>
                        ${item.jenisCuti}
                    </h3>

                    <p>
                        ${item.nama}
                    </p>

                    <small>
                        ${identitasLabel} :
                        ${item.nip}
                    </small>

                    <small
                        class="
                            smartoffice-management-status-badge
                            smartoffice-management-riwayat-status-kepegawaian
                        "
                    >
                        ${item.statusKepegawaian}
                    </small>

                    <div class="smartoffice-management-divider"></div>

                    <div class="smartoffice-management-riwayat-summary">
                        <div class="smartoffice-management-riwayat-summary-item">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 2v4"/>
                                <path d="M16 2v4"/>
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <path d="M3 10h18"/>
                            </svg>
                            
                            <div>
                              <span>
                                Tanggal Cuti
                              </span>

                              <strong>
                                ${periodeCuti}
                              </strong>   
                            </div>                         
                        </div>

                        <div class="smartoffice-management-riwayat-summary-item">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2v20"/>
                                <path d="M5 9l7-7 7 7"/>
                            </svg>

                            <div>    
                              <span>
                                Ajuan Cuti
                              </span>

                              <strong>
                                ${item.jumlahCuti}
                                Hari
                              </strong>
                            </div>                           
                        </div>
                    </div>
                </div>

                <div class="smartoffice-riwayat-cuti-right">
                    <span
                        class="
                            smartoffice-riwayat-status
                            ${statusClass}
                        "
                    >
                        ${statusText}
                    </span>

                    <div class="smartoffice-riwayat-arrow">
                        <svg viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>
            </div>
        `);
    });

    container.innerHTML =
        html.join("");
}


/* ================================================================================
   LOAD DROPDOWN PEGAWAI
================================================================================ */
function smartofficeLoadPegawaiFilter(){

    /* DROPDOWN */
    const select =
        document.getElementById(
            "smartofficeManagementFilterPegawai"
        );

    /* VALIDASI */
    if(
        !select
    ){
        return;
    }

    /* RESET */
    select.innerHTML = `
        <option value="">
            Semua Pegawai
        </option>
    `;

    /* ======================================================
       SUMBER DATA PEGAWAI
       Gunakan DATA REKAP PEGAWAI
       agar pegawai tanpa riwayat tetap muncul
    ====================================================== */

    const uniquePegawai = [
        ...new Map(
            smartofficeManagementRekapData.map(
                item => [
                    item.nip,
                    item
                ]
            )
        ).values()
    ];

    /* LOOP */
    uniquePegawai.forEach(
        function(item){

            select.innerHTML += `
                <option value="${item.nip}">
                    ${item.nama}
                </option>
            `;
        }
    );
}


/* ================================================================================
   LOAD FILTER TAHUN
================================================================================ */
function smartofficeLoadTahunFilter(){

    /* DROPDOWN */
    const select =
        document.getElementById(
            "smartofficeManagementFilterTahun"
        );

    /* VALIDASI */
    if(
        !select
    ){
        return;
    }

    /* RESET */
    select.innerHTML = `
        <option value="">
            Semua Tahun
        </option>
    `;

    /* AMBIL TAHUN */
    const tahunList = [
        ...new Set(
            smartofficeManagementRiwayatData.map(
                item =>
                    new Date(
                        item.tanggalAwal
                    ).getFullYear()
            )
        )
    ];

    /* URUTKAN */
    tahunList
        .sort(function(a,b){
            return b - a;
        })
        .forEach(function(tahun){
            select.innerHTML += `
                <option value="${tahun}">
                    ${tahun}
                </option>
            `;
        });

    /* DEFAULT TAHUN TERBARU */
    if(
        tahunList.length > 0
    ){
        select.value =
            tahunList[0];
    }
}

/* ======================================================
   SET DEFAULT FILTER BULAN BERJALAN
====================================================== */
function smartofficeSetDefaultManagementBulan(){

    const select =
        document.getElementById(
            "smartofficeManagementFilterBulan"
        );

    if(!select){
        return;
    }

    /* BULAN BERJALAN
       Januari = 0
       Februari = 1
       dst.
    */
    const bulanSekarang =
        new Date().getMonth();

    select.value =
        String(bulanSekarang);
}


/* ================================================================================
   SEARCH REKAP PEGAWAI
================================================================================ */

/* ======================================================
   INIT SEARCH
====================================================== */
export function smartofficeInitManagementSearch(){

    /* SEARCH */
    document
        .getElementById(
            "smartofficeManagementSearchPegawai"
        )
        ?.addEventListener(
            "input",
            smartofficeFilterRekapPegawai
        );

    /* FILTER STATUS */
    document
        .getElementById(
            "smartofficeManagementFilterStatusPegawai"
        )
        ?.addEventListener(
            "change",
            smartofficeFilterRekapPegawai
        );
}


/* ================================================================================
   FILTER REKAP PEGAWAI
================================================================================ */
export function smartofficeFilterRekapPegawai(){

    /* SEARCH */
    const keyword =
        document
            .getElementById(
                "smartofficeManagementSearchPegawai"
            )
            ?.value
            .toLowerCase()
            .trim() || "";

    /* STATUS */
    const statusKepegawaian =
        document
            .getElementById(
                "smartofficeManagementFilterStatusPegawai"
            )
            ?.value || "";

    /* COPY CACHE */
    let filteredData =
        [...smartofficeManagementRekapData];

    /* =========================
       FILTER SEARCH
    ========================= */
    if(keyword){
        filteredData =
            filteredData.filter(
                function(item){
                    return (
                        item.nama
                            ?.toLowerCase()
                            .includes(
                                keyword
                            )
                        ||
                        item.nip
                            ?.toLowerCase()
                            .includes(
                                keyword
                            )
                    );
                }
            );
    }

    /* =========================
       FILTER STATUS
    ========================= */
    if(statusKepegawaian){
        filteredData =
            filteredData.filter(
                function(item){
                    return (
                        String(
                            item.statusKepegawaian || ""
                        )
                        .trim()
                        .toUpperCase()

                        ===

                        String(
                            statusKepegawaian
                        )
                        .trim()
                        .toUpperCase()
                    );
                }
            );
    }

    /* RENDER */
    smartofficeRenderRekapPegawai(
        filteredData
    );
}


/* ================================================================================
   FILTER RIWAYAT MANAGEMENT CUTI
================================================================================ */

/* ======================================================
   FILTER DATA RIWAYAT
====================================================== */
export function smartofficeFilterManagementRiwayat(){

    /* =========================
       FILTER DATA
    ========================= */
    const filteredData =
        smartofficeGetFilteredRiwayatData();

    /* =========================
       SAVE CACHE FILTER
    ========================= */
    window.smartofficeManagementRiwayatFilteredData =
        filteredData;

    /* =========================
       RENDER
    ========================= */
    smartofficeRenderManagementRiwayat(
        filteredData
    );
}

window.smartofficeFilterManagementRiwayat =
    smartofficeFilterManagementRiwayat;


/* ================================================================================
   HELPER FILTER RIWAYAT MANAGEMENT CUTI
================================================================================ */
function smartofficeGetFilteredRiwayatData(){

    /* FILTER PEGAWAI */
    const nipPegawai =
        document
            .getElementById(
                "smartofficeManagementFilterPegawai"
            )
            ?.value || "";

    /* FILTER STATUS */
    const status =
        document
            .getElementById(
                "smartofficeManagementFilterStatus"
            )
            ?.value || "";

    /* FILTER BULAN */
    const bulan =
        document
            .getElementById(
                "smartofficeManagementFilterBulan"
            )
            ?.value ?? "";

    /* FILTER TAHUN */
    const tahun =
        document
            .getElementById(
                "smartofficeManagementFilterTahun"
            )
            ?.value || "";

    /* COPY CACHE */
    let filteredData =
        [...smartofficeManagementRiwayatData];

    /* =========================
       FILTER PEGAWAI
    ========================= */
    if(nipPegawai){
        filteredData =
            filteredData.filter(
                item =>
                    item.nip ===
                    nipPegawai
            );
    }

    /* =========================
       FILTER STATUS
    ========================= */
    if(status){
        if(
            status ===
            "MENUNGGU"
        ){
            filteredData =
                filteredData.filter(
                    item =>
                        item.status ===
                        "MENUNGGU_APPROVAL_1"

                        ||

                        item.status ===
                        "MENUNGGU_APPROVAL_2"
                );
        }
        else{
            filteredData =
                filteredData.filter(
                    item =>
                        item.status ===
                        status
                );
        }
    }

    /* =========================
       FILTER BULAN
    ========================= */
    if(
        bulan !== ""
    ){
        filteredData =
            filteredData.filter(
                item =>
                    new Date(
                        item.tanggalAwal
                    ).getMonth()

                    ===

                    Number(
                        bulan
                    )
            );
    }

    /* =========================
       FILTER TAHUN
    ========================= */
    if(tahun){
        filteredData =
            filteredData.filter(
                item =>
                    new Date(
                        item.tanggalAwal
                    ).getFullYear()

                    ===

                    Number(
                        tahun
                    )
            );
    }

    return filteredData;
}


/* ================================================================================
   RESET FILTER RIWAYAT
================================================================================ */

/* ======================================================
   RESET FILTER RIWAYAT
====================================================== */
export function smartofficeResetManagementRiwayat(){

    /* RESET PEGAWAI */
    document
        .getElementById(
            "smartofficeManagementFilterPegawai"
        )
        .value = "";

    /* RESET STATUS */
    document
        .getElementById(
            "smartofficeManagementFilterStatus"
        )
        .value = "";

    /* RESET BULAN → BULAN BERJALAN */
    smartofficeSetDefaultManagementBulan();

    /* RESET TAHUN */
    smartofficeLoadTahunFilter();

    /* FILTER ULANG */
    smartofficeFilterManagementRiwayat();
}

window.smartofficeResetManagementRiwayat =
    smartofficeResetManagementRiwayat;


/* ================================================================================
   BUKA RIWAYAT PEGAWAI
================================================================================ */

/* ======================================================
   OPEN RIWAYAT PEGAWAI
====================================================== */
export function smartofficeOpenRiwayatPegawai(
    nip
){

    /* PINDAH TAB */
    smartofficeSwitchManagementCutiTab(
        "riwayat"
    );

    /* SCROLL */
    setTimeout(
        function(){
            document
                .getElementById(
                    "smartofficeManagementRiwayatContent"
                )
                ?.scrollIntoView({
                    behavior: "smooth"
                });
        },
        200
    );

    /* RESET STATUS */
    document
        .getElementById(
            "smartofficeManagementFilterStatus"
        )
        .value = "";

    /* RESET BULAN */
    document
        .getElementById(
            "smartofficeManagementFilterBulan"
        )
        .value = "";

    /* RESET TAHUN */
    document
        .getElementById(
            "smartofficeManagementFilterTahun"
        )
        .value = "";

    /* SET PEGAWAI */
    document
        .getElementById(
            "smartofficeManagementFilterPegawai"
        )
        .value = nip;

    /* FILTER */
    smartofficeFilterManagementRiwayat();
}


/* ======================================================
   OPEN DETAIL MANAGEMENT CUTI
====================================================== */

/* =========================
   OPEN DETAIL

   FUNCTION:
   Menampilkan detail
   pengajuan cuti pegawai
   dalam modal.
========================= */
function smartofficeOpenManagementCutiDetail(
  item
){

  /* MODAL */
  const modal =
    document.getElementById(
      'smartofficeManagementCutiDetailModal'
    );

  /* BODY */
  const body =
    document.getElementById(
      'smartofficeManagementCutiDetailBody'
    );

  /* SHOW MODAL */
  modal.style.display =
    'flex';

  setTimeout(function(){

    modal.classList.add(
      'show'
    );

  },10);

  /* STATUS */
  let statusText =
    'Menunggu';

  let statusClass =
    'waiting';

  if(
    item.status ===
    'DISETUJUI'
  ){
    statusText =
      'Disetujui';

    statusClass =
      'approved';
  }

  if(
    item.status ===
    'DITOLAK'
  ){
    statusText =
      'Ditolak';

    statusClass =
      'rejected';
  }

  /* RESET SCROLL */
  body.scrollTop = 0;

  /* NIP/NRP */
  const identitasLabel =
    item.statusKepegawaian === 'BLUD'
      ? 'NRP'
      : 'NIP';

  /* PERIODE CUTI */
  const periodeCuti =
    item.tanggalAwal === item.tanggalAkhir
      ? formatTanggalIndonesia(
          item.tanggalAwal
        )
      : `${formatTanggalIndonesia(
          item.tanggalAwal
        )} - ${formatTanggalIndonesia(
          item.tanggalAkhir
        )}`;

  /* RENDER */
  body.innerHTML = `

    <!-- =========================
         PROFILE
    ========================= -->
    <div class="smartoffice-management-cuti-modal-profile">

        <div class="smartoffice-management-cuti-modal-profile-info">
            <h4>
                ${item.nama || '-'}
            </h4>

            <small>
                ${identitasLabel} :
                ${item.nip || '-'}
            </small>

            <span class="
                smartoffice-management-cuti-modal-status
                ${statusClass}
            ">
                ${statusText}
            </span>
        </div>
    </div>

    <!-- =========================
         DETAIL GRID
    ========================= -->
    <div class="smartoffice-cuti-riwayat-modal-grid">

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>ID Cuti</label>
            <span>${item.idCuti || '-'}</span>
        </div>

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>Jenis Cuti</label>
            <span>${item.jenisCuti || '-'}</span>
        </div>

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>Tanggal Permohonan</label>
            <span>${formatTanggalIndonesia(item.tanggalSurat)}</span>
        </div>

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>Tanggal Cuti</label>
            <span>${periodeCuti}</span>
        </div>

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>Jumlah Hari</label>
            <span>${item.jumlahCuti || 0} Hari</span>
        </div>

        <div class="smartoffice-cuti-riwayat-modal-item">
            <label>Sisa Cuti</label>
            <span>${item.sisaCuti || 0} Hari</span>
        </div>
    </div>
    
    <!-- =========================
         KEPERLUAN
    ========================= -->
    <div class="
        smartoffice-cuti-riwayat-modal-item
        full-width
        ">
        <label>Keperluan</label>
        <span>
        ${item.keperluan || '-'}
        </span>
    </div>

    <!-- =========================
         ALAMAT CUTI
    ========================= -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">
      <label>Alamat Selama Menjalani Cuti</label>
      <span>
        ${item.alamatSaatCuti || '-'}
      </span>
    </div>

    <!-- =========================
         LAMPIRAN CUTI
    ========================= -->
    <div class="
      smartoffice-cuti-riwayat-modal-lampiran
    ">
      <div class="
        smartoffice-cuti-riwayat-modal-lampiran-title
      ">
        Lampiran
      </div>

      <div class="
        smartoffice-cuti-riwayat-modal-file-card
      ">
        <div class="
          smartoffice-cuti-riwayat-modal-file-icon
        ">
          📄
        </div>

        <div class="
          smartoffice-cuti-riwayat-modal-file-info
        ">
          <div class="
            smartoffice-cuti-riwayat-modal-file-name
          ">
            ${
              item.lampiran
              ?
              `
              <button
                class="
                  smartoffice-cuti-riwayat-modal-dokumen-link
                "
                onclick="
                  smartofficeOpenPreviewDokumen(
                    '${smartofficeGetDriveFileId(item.lampiran)}',
                    'Lampiran Cuti'
                  )
                "
              >
                <svg
                  style="
                    flex-shrink:0;
                  "
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>

                <span>
                  Lihat Lampiran
                </span>

              </button>
              `
              :
              'Tidak ada lampiran'
            }
          </div>
        </div>
      </div>
    </div>

    <!-- =========================
         DELEGASI
    ========================= -->
    <div class="
      smartoffice-cuti-riwayat-modal-grid
    ">
      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          Delegasi
        </label>

        <span>
          ${item.delegasi || '-'}
        </span>
      </div>

      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          NIP/NRP Delegasi
        </label>

        <span>
          ${item.nipDelegasi || '-'}
        </span>
      </div>
    </div>

    <!-- =========================
         TUGAS
    ========================= -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">
      <label>
        Tugas Delegasi
      </label>

      <span>
        ${item.tugasDelegasi || '-'}
      </span>
    </div>

    <!-- =========================
         PDF SURAT CUTI
    ========================= -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">
      <label>
        File PDF Surat Cuti
      </label>

      <span>
        ${
          item.pdfUrl

          ?

          `
          <button
            class="
              smartoffice-pdf-link
            "
            onclick="
              smartofficeOpenPreviewDokumen(
                '${smartofficeGetDriveFileId(item.pdfUrl)}',
                'Surat Cuti.pdf'
              )
            "
          >
            <svg
              style="
                flex-shrink:0;
              "
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>

            <span>
              Lihat PDF
            </span>
          </button>
          `

          :

          'PDF belum tersedia'

        }
      </span>
    </div>

    <!-- =========================
         APPROVAL
    ========================= -->
    <!-- APPROVAL 1 -->
    <div class="
        smartoffice-cuti-riwayat-modal-item
        full-width
    ">
        <label>Approval 1 - PJKM</label>

        <div class="
          smartoffice-cuti-riwayat-modal-approval-box
        ">

        <div>
          <small>Nama</small>
          <strong>${item.approval1 || '-'}</strong>
        </div>

        <div>
          <small>Status</small>
          ${smartofficeGetApprovalBadge(item.approval1Status)}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>${item.approval1Tanggal || '-'}</strong>
        </div>

        <div>
          <small>Catatan</small>
          <strong>${item.approval1Catatan || '-'}</strong>
        </div>

        </div>
    </div>

    <!-- APPROVAL 2 -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">
      <label>
        Approval 2 - Kepala Puskesmas
      </label>

      <div class="
        smartoffice-cuti-riwayat-modal-approval-box
      ">

        <div>
          <small>Nama</small>
          <strong>
            ${item.approval2 || '-'}
          </strong>
        </div>

        <div>
          <small>Status</small>
          ${smartofficeGetApprovalBadge(item.approval2Status)}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>
            ${item.approval2Tanggal || '-'}
          </strong>
        </div>
      </div>
    </div>
  `;
}


/* ================================================================================
   CLOSE DETAIL MANAGEMENT CUTI
================================================================================ */
export function smartofficeCloseManagementCutiDetail(){

    /* MODAL */
    const modal =
        document.getElementById(
            "smartofficeManagementCutiDetailModal"
        );

    if(!modal){
        return;
    }

    /* HIDE ANIMATION */
    modal.classList.remove(
        "show"
    );

    /* HIDE MODAL */
    setTimeout(function(){
        modal.style.display =
            "none";
    },200);
}

window.smartofficeOpenManagementCutiDetail =
    smartofficeOpenManagementCutiDetail;

window.smartofficeCloseManagementCutiDetail =
    smartofficeCloseManagementCutiDetail;