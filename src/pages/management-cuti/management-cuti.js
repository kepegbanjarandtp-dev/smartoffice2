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
   SERVICE
====================================================== */
import {
    smartofficeGetRekapPegawai,
    smartofficeGetAllRiwayatCuti
} from "../../services/management-cuti.service.js";

/* ======================================================
   UTILS
====================================================== */
import {
    formatTanggalIndonesia
} from "../../utils/date.js";


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
    //smartofficeInitManagementSearch();

    /* =========================
       LOAD DATA
    ========================= */
    await Promise.all([
        smartofficeLoadRekapPegawai(),
        smartofficeLoadAllRiwayatCuti()
    ]);

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
        rekapContent.style.display =
            "none";

        riwayatContent.style.display =
            "block";

        rekapButton.classList.add(
            "active"
        );
    }
}


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
                        ? item.nama
                            .trim()
                            .charAt(0)
                            .toUpperCase()
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

                    <p>
                        Cuti Tahunan :
                        ${item.totalCuti || 0}
                        Hari
                    </p>

                    <p>
                        Terpakai :
                        ${item.cutiTerpakai || 0}
                        Hari
                    </p>

                    <p>
                        Sisa Cuti :
                        ${item.sisaCuti || 0}
                        Hari
                    </p>
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
        smartofficeLoadPegawaiFilter();
        smartofficeLoadTahunFilter();

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
                class="smartoffice-management-card"
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

                <div class="smartoffice-management-card-content">
                    <h3>
                        ${item.jenisCuti}
                    </h3>

                    <p class="smartoffice-management-pegawai-nama">
                        ${item.nama}
                    </p>

                    <small>
                        ${identitasLabel} :
                        ${item.nip}
                    </small>

                    <div class="smartoffice-management-riwayat-info">
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

                        <p>
                            ${periodeCuti}
                        </p>

                        <p>
                            ${item.jumlahCuti}
                            Hari
                        </p>
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

    /* CEGAH DUPLIKAT */
    const uniquePegawai = [
        ...new Map(
            smartofficeManagementRiwayatData.map(
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

    /* RESET BULAN */
    document
        .getElementById(
            "smartofficeManagementFilterBulan"
        )
        .value = "";

    /* RESET TAHUN */
    smartofficeLoadTahunFilter();

    /* FILTER ULANG */
    smartofficeFilterManagementRiwayat();
}


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