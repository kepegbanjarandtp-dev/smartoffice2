/* ================================================================================
   IMPORT
================================================================================ */

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
  smartofficeOpenPreviewDokumen,
  smartofficeClosePreviewDokumen,
  smartofficeZoomIn,
  smartofficeZoomOut
} from "../../components/preview/preview.js";

import {
    smartofficeShowLoading
} from "../../components/loading/loading.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetPegawaiByNip,
    smartofficeSearchPegawai,
    smartofficeGetJumlahCuti,
    smartofficeGetRiwayatCuti,
    smartofficeSubmitCuti
} from "../../services/cuti.service.js";

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
    smartofficeConvertFileToBase64
} from "../../utils/file.js";




/* ================================================================================
   GLOBAL STATE
================================================================================ */
let smartofficePegawaiCache = [];
let smartofficeSubmitting = false;
let smartofficeLampiranFile = null;

/* ======================================================
   MEMORY
====================================================== */
let smartofficeRiwayatCutiCache = null;



/* ================================================================================
   LIFECYCLE
================================================================================ */

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

    /* LOAD DATA PEGAWAI & CACHE PEGAWAI */
    await Promise.all([
        smartofficeLoadPegawai(sessionData.nip),
        smartofficeLoadPegawaiCache()
    ]);

    /* VALIDASI HARI MINGGU */
    smartofficeValidateSunday(
        "smartofficeCutiTanggalSurat",
        "Tanggal surat tidak boleh hari Minggu"
    );

    smartofficeValidateSunday(
        "smartofficeCutiTanggalAwal",
        "Tanggal awal cuti tidak boleh hari Minggu"
    );

    smartofficeValidateSunday(
        "smartofficeCutiTanggalAkhir",
        "Tanggal akhir cuti tidak boleh hari Minggu"
    );    

    /* INIT COMPONENT */
    smartofficeInitAutoHitungCuti();
    smartofficeInitUploadLampiran();
    smartofficeInitSubmitButton();
    smartofficeInitTab();
    smartofficeInitRefreshButton();

    /* DEFAULT TAB */
    smartofficeSwitchCutiTab(
        "form"
    );

    /* MOBILE NAVBAR */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "cuti"
    );
}

/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    /* RESET CACHE */
    smartofficePegawaiCache = [];
    smartofficeRiwayatCutiCache = null;

    /* RESET SUBMIT LOCK */
    smartofficeSubmitting = false;

    /* FILE */
    smartofficeLampiranFile = null;

    /* AUTO HITUNG CUTI */
    const jumlahHariInput =
        document.getElementById(
            "smartofficeCutiJumlahHari"
        );
    if(
        jumlahHariInput
    ){
        jumlahHariInput.value = "";
    }
}



/* ================================================================================
   LOAD DATA
================================================================================ */

/* ======================================================
   LOAD DATA PEGAWAI
====================================================== */
export async function smartofficeLoadPegawai(
    nip
){
    /* INFO LOADING TEXT */
    document.getElementById(
        "smartofficeCutiInfoText"
    ).innerText =
        "Memuat data pegawai...";

    /* LOADING CLASS */
    document.getElementById(
        "smartofficeCutiInfoBox"
    ).classList.add(
        "smartoffice-cuti-info-loading"
    );

    try{
        /* GET DATA PEGAWAI */
        const data =
            await smartofficeGetPegawaiByNip(
                nip
            );

        /* VALIDASI DATA */
        if(
            !data
        ){
            smartofficeShowToast(
                "Data pegawai tidak ditemukan",
                "error"
            );
            return;
        }

        /* IDENTITAS */
        document.getElementById(
            "smartofficeCutiNama"
        ).value =
            data.nama || "";

        document.getElementById(
            "smartofficeCutiNip"
        ).value =
            data.nip || "";

        document.getElementById(
            "smartofficeCutiPangkat"
        ).value =
            data.pangkat || "";

        document.getElementById(
            "smartofficeCutiJabatan"
        ).value =
            data.jabatan || "";

        /* STATUS KEPEGAWAIAN */
        document.getElementById(
            "smartofficeCutiStatusKepegawaian"
        ).value =
            data.statusKepegawaian || "";

        /* FORMAT TMT */
        let tmtDisplay = "";

        if(
            data.tmtAwal
        ){
            const parts =
                String(
                    data.tmtAwal
                ).split("/");

            tmtDisplay =
                `${parts[1]}/${parts[0]}/${parts[2]}`;
        }

        document.getElementById(
            "smartofficeCutiTmtAwal"
        ).value =
            tmtDisplay;

        document.getElementById(
            "smartofficeCutiNoWa"
        ).value =
            data.noWa || "";

        document.getElementById(
            "smartofficeCutiSisaCuti"
        ).dataset.original =
            data.sisaCuti || 0;

        document.getElementById(
            "smartofficeCutiMasaKerja"
        ).value =
            smartofficeGetMasaKerja(
                data.tmtAwal
            );

        /* MINI STATS */
        const sisaElement =
            document.getElementById(
                "smartofficeStatSisaCuti"
            );

        sisaElement.innerText =
            data.sisaCuti || 0;

        sisaElement.classList.remove(
            "smartoffice-skeleton-text"
        );

        const menungguElement =
            document.getElementById(
                "smartofficeStatMenungguCuti"
            );

        menungguElement.innerText =
            data.totalMenunggu || 0;

        menungguElement.classList.remove(
            "smartoffice-skeleton-text"
        );

        const disetujuiElement =
            document.getElementById(
                "smartofficeStatDisetujuiCuti"
            );

        disetujuiElement.innerText =
            data.totalDisetujui || 0;

        disetujuiElement.classList.remove(
            "smartoffice-skeleton-text"
        );

        /* LOAD JENIS CUTI */
        smartofficeLoadJenisCuti();

        /* SET SISA CUTI */
        const sisaField =
            document.getElementById(
                "smartofficeCutiSisaCuti"
            );

        sisaField.value =
            data.sisaCuti || "0";

        /* UPDATE INFO */
        document.getElementById(
            "smartofficeCutiInfoText"
        ).innerText =
            "Identitas pegawai terisi otomatis dari database";

        document.getElementById(
            "smartofficeCutiInfoBox"
        ).classList.remove(
            "smartoffice-cuti-info-loading"
        );
    }
    catch(error){
        document.getElementById(
            "smartofficeCutiInfoBox"
        ).classList.remove(
            "smartoffice-cuti-info-loading"
        );

        smartofficeShowToast(
            "Gagal memuat data pegawai",
            "error"
        );
        console.error(error);
    }
}

/* ======================================================
   LOAD CACHE PEGAWAI
====================================================== */
export async function smartofficeLoadPegawaiCache(){
    try{
        /* GET DATA PEGAWAI */
        const result =
            await smartofficeSearchPegawai(
                ""
            );

        console.log(
            "CACHE PEGAWAI:",
            result
        );

        /* SAVE CACHE */
        smartofficePegawaiCache =
            result || [];

        /* INIT AUTOCOMPLETE */
        smartofficeInitCutiDelegasiAutocomplete();

    }
    catch(error){
        console.error(error);

        smartofficeShowToast(
            "Gagal memuat data pegawai.",
            "error"
        );
    }
}


/* ======================================================
   LOAD JENIS CUTI
====================================================== */
export function smartofficeLoadJenisCuti(){

    /* STATUS KEPEGAWAIAN */
    const statusKepegawaian =
        document.getElementById(
            "smartofficeCutiStatusKepegawaian"
        )
        .value
        .toUpperCase()
        .trim();

    /* SELECT ELEMENT */
    const selectJenis =
        document.getElementById(
            "smartofficeCutiJenis"
        );

    /* VALIDASI ELEMENT */
    if(
        !selectJenis
    ){
        return;
    }

    /* ARRAY OPTION */
    let options = [];

    /* PNS */
    if(
        statusKepegawaian ===
        "PNS"
    ){
        options = [
            "CUTI TAHUNAN",
            "CUTI BESAR",
            "CUTI SAKIT",
            "CUTI MELAHIRKAN",
            "CUTI ALASAN PENTING",
            "CTLN"
        ];
    }

    /* BLUD */
    else if(
        statusKepegawaian ===
        "BLUD"
    ){
        options = [
            "CUTI TAHUNAN",
            "CUTI SAKIT",
            "CUTI MELAHIRKAN",
            "CUTI ALASAN PENTING"
        ];
    }

    /* PPPK */
    else if(
        statusKepegawaian ===
        "PPPK"

        ||

        statusKepegawaian ===
        "PPPK PARUH WAKTU"
    ){
        options = [
            "CUTI TAHUNAN",
            "CUTI SAKIT",
            "CUTI MELAHIRKAN"
        ];
    }

    /* DEFAULT */
    else{
        options = [
            "CUTI TAHUNAN",
            "CUTI SAKIT"
        ];
    }

    /* RESET OPTION */
    let html = `
    <option value="">
        Pilih Jenis Cuti
    </option>
    `;

    /* RENDER OPTION */
    options.forEach(item=>{
        html += `
        <option value="${item}">
            ${item}
        </option>`;
    });

    selectJenis.innerHTML = html;
}



/* ================================================================================
   LOAD RIWAYAT CUTI
================================================================================ */

/* ======================================================
   LOAD DATA RIWAYAT CUTI
====================================================== */
export async function smartofficeLoadRiwayatCuti(
    nip
){

    /* =========================
       SHOW LOADING
    ========================= */
    smartofficeShowLoading(
        "smartofficeRiwayatCutiList",
        "Memuat riwayat cuti..."
    );

    /* Beri kesempatan browser me-render spinner */
    await new Promise(resolve =>
        requestAnimationFrame(resolve)
    );

    try{
        /* =========================
           LOAD DATA
        ========================= */
        const data =
            await smartofficeGetRiwayatCuti(
                nip
            );

        /* =========================
           SIMPAN KE CACHE
        ========================= */
        smartofficeRiwayatCutiCache =
            data || [];

        /* =========================
           RENDER DATA
        ========================= */
        smartofficeRenderRiwayatCuti();

    }
    catch(error){
        console.error(error);

        smartofficeShowToast(
            "Gagal memuat riwayat cuti",
            "error"
        );

        /* Kosongkan loading bila gagal */
        document.getElementById(
            "smartofficeRiwayatCutiList"
        ).innerHTML = "";
    }
}

/* ======================================================
   RENDER RIWAYAT CUTI
====================================================== */
function smartofficeRenderRiwayatCuti(){

    /* DATA */
    const data =
        smartofficeRiwayatCutiCache;

    /* CONTAINER */
    const container =
        document.getElementById(
            "smartofficeRiwayatCutiList"
        );

    /* VALIDASI CONTAINER */
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
                    Belum ada riwayat cuti
                </p>

            </div>
        `;

        return;

    }

    /* HTML */
    const html = [];

    data.forEach(function(item){

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
                class="smartoffice-riwayat-cuti-card"
                onclick='smartofficeOpenRiwayatCutiDetail(${JSON.stringify(item)})'
            >

                <div class="smartoffice-riwayat-date">

                    <small>
                        ${month}
                    </small>

                    <strong>
                        ${day}
                    </strong>

                </div>

                <div class="smartoffice-riwayat-cuti-content">

                    <h3>
                        ${item.jenisCuti}
                    </h3>

                    <small>

                        <svg viewBox="0 0 24 24">
                            <path d="
                                M8 2v3
                                M16 2v3
                                M4 7h16
                                M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z
                            "/>
                        </svg>

                        ${item.jumlahCuti} Hari

                    </small>

                    <p>

                        <svg viewBox="0 0 24 24">
                            <path d="
                                M12 8v5
                                l3 2
                                M12 22
                                a10 10 0 100-20
                                10 10 0 000 20z
                            "/>
                        </svg>

                        ${periodeCuti}

                    </p>

                </div>

                <div class="smartoffice-riwayat-cuti-right">

                    <span class="
                        smartoffice-riwayat-status
                        ${statusClass}
                    ">
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
   AUTO HITUNG CUTI
================================================================================ */

/* ======================================================
   INIT AUTO HITUNG CUTI
====================================================== */
export function smartofficeInitAutoHitungCuti(){

    document.addEventListener(
        "change",

        async function(event){

            /* HANYA JIKA TANGGAL BERUBAH */
            if(
                event.target.id !==
                "smartofficeCutiTanggalSurat"

                &&

                event.target.id !==
                "smartofficeCutiTanggalAwal"

                &&

                event.target.id !==
                "smartofficeCutiTanggalAkhir"

                &&

                event.target.id !==
                "smartofficeCutiJenis"
            ){
                return;
            }

            /* TANGGAL SURAT BERUBAH */
            if(
                event.target.id ===
                "smartofficeCutiTanggalSurat"
            ){
                smartofficeResetTanggalAwal();

                const tanggalAwal =
                    document.getElementById(
                        "smartofficeCutiTanggalAwal"
                    );

                if(
                    tanggalAwal &&
                    tanggalAwal.value
                ){
                    tanggalAwal.dispatchEvent(
                        new Event("change")
                    );
                }

                return;
            }

            /* FIELD */
            const tanggalAwal =
                document.getElementById(
                    "smartofficeCutiTanggalAwal"
                );

            const tanggalAkhir =
                document.getElementById(
                    "smartofficeCutiTanggalAkhir"
                );

            const jumlahField =
                document.getElementById(
                    "smartofficeCutiJumlah"
                );

            /* TANGGAL AWAL BERUBAH */
            if(
                event.target.id ===
                "smartofficeCutiTanggalAwal"
            ){
                const suratInput =
                    document.getElementById(
                        "smartofficeCutiTanggalSurat"
                    );
                if(
                    suratInput &&
                    suratInput.value &&
                    tanggalAwal.value
                ){
                    const suratDate =
                        new Date(
                            suratInput.value
                        );

                    const startDate =
                        new Date(
                            tanggalAwal.value
                        );
                    if(
                        suratDate > startDate
                    ){
                        smartofficeShowToast(
                            "Tanggal surat permohonan tidak boleh melebihi tanggal awal cuti.",
                            "error"
                        );
                        smartofficeResetTanggalAwal();
                        suratInput.focus();
                        return;
                    }
                }
                smartofficeResetTanggalAkhir();
                return;
            }

            /* VALIDASI ELEMENT */
            if(
                !tanggalAwal ||
                !tanggalAkhir ||
                !jumlahField
            ){
                return;
            }

            /* VALIDASI EMPTY */
            if(
                !tanggalAwal.value ||
                !tanggalAkhir.value
            ){
                jumlahField.value = "";
                return;
            }

            /* DATE OBJECT */
            const startDate =
                new Date(
                    tanggalAwal.value
                );

            const endDate =
                new Date(
                    tanggalAkhir.value
                );

            /* VALIDASI RANGE */
            if(
                endDate < startDate
            ){
                smartofficeShowToast(
                    "Tanggal akhir tidak valid",
                    "error"
                );
                smartofficeResetTanggalAkhir();
                tanggalAkhir.focus();
                return;
            }

            /* VALIDASI TANGGAL SURAT */
            const suratInput =
                document.getElementById(
                    "smartofficeCutiTanggalSurat"
                );
            if(
                suratInput &&
                suratInput.value
            ){
                const suratDate =
                    new Date(
                        suratInput.value
                    );
                if(
                    suratDate > startDate ||
                    suratDate > endDate
                ){
                    smartofficeShowToast(
                        "Tanggal surat permohonan tidak boleh melebihi tanggal awal maupun tanggal akhir cuti.",
                        "error"
                    );                  
                    smartofficeResetTanggalAwal();
                    suratInput.focus();
                    return;
                }
            }

            /* VALIDASI MINGGU */
            if(
                startDate.getDay() === 0
            ){
                smartofficeShowToast(
                    "Tanggal awal tidak boleh hari Minggu",
                    "error"
                );
                smartofficeResetTanggalAkhir();
                tanggalAwal.focus();
                return;
            }

            if(
                endDate.getDay() === 0
            ){
                smartofficeShowToast(
                    "Tanggal akhir tidak boleh hari Minggu",
                    "error"
                );
                smartofficeResetTanggalAkhir();
                tanggalAkhir.focus();
                return;
            }

            /* LOADING */
            jumlahField.placeholder =
                "Menghitung...";

            try{
                const response =
                    await smartofficeGetJumlahCuti(
                        tanggalAwal.value,
                        tanggalAkhir.value
                    );

                /* VALIDASI */
                if(
                    !response.success
                ){
                    jumlahField.value = "";
                    return;
                }

                const jumlahHari =
                    response.jumlahHari;

                /* VALIDASI HASIL */
                if(
                    jumlahHari <= 0
                ){
                    smartofficeShowToast(
                        "Jumlah cuti tidak valid",
                        "error"
                    );
                    jumlahField.value = "";
                    return;
                }

                /* FIELD SISA */
                const sisaField =
                    document.getElementById(
                        "smartofficeCutiSisaCuti"
                    );

                /* JENIS CUTI */
                const jenisCuti =
                    document.getElementById(
                        "smartofficeCutiJenis"
                    )?.value || "";

                /* CUTI TAHUNAN */
                if(
                    jenisCuti ===
                    "CUTI TAHUNAN"
                ){
                    const sisaAwal =
                        Number(
                            sisaField.dataset.original || 0
                        );
                    if(
                        jumlahHari > sisaAwal
                    ){
                        smartofficeShowToast(
                            "Jumlah cuti melebihi sisa cuti tahunan.",
                            "error"
                        );
                        jumlahField.value = 0;
                        sisaField.value =
                            sisaAwal;
                        return;
                    }

                    const sisaSetelahCuti =
                        sisaAwal -
                        jumlahHari;

                    sisaField.value =
                        sisaSetelahCuti;
                }

                /* SELAIN CUTI TAHUNAN */
                else{
                    sisaField.value =
                        sisaField.dataset.original || 0;
                }

                /* SET JUMLAH */
                jumlahField.value =
                    jumlahHari;
            }
            catch(error){
                console.error(
                    error
                );
                jumlahField.value = "";

                smartofficeShowToast(
                    "Gagal menghitung jumlah cuti",
                    "error"
                );
            }
        }
    );
}

/* ======================================================
   RESET TANGGAL AWAL
====================================================== */
export function smartofficeResetTanggalAwal(){

    const tanggalAwal =
        document.getElementById(
            "smartofficeCutiTanggalAwal"
        );

    const tanggalAkhir =
        document.getElementById(
            "smartofficeCutiTanggalAkhir"
        );

    const jumlahField =
        document.getElementById(
            "smartofficeCutiJumlah"
        );

    const sisaField =
        document.getElementById(
            "smartofficeCutiSisaCuti"
        );

    if(tanggalAwal){
        tanggalAwal.value = "";
    }

    if(tanggalAkhir){
        tanggalAkhir.value = "";
    }

    if(jumlahField){
        jumlahField.value = "";
    }

    if(sisaField){
        sisaField.value =
            sisaField.dataset.original || 0;
    }
}

/* ======================================================
   RESET TANGGAL AKHIR
====================================================== */
export function smartofficeResetTanggalAkhir(){

    const tanggalAkhir =
        document.getElementById(
            "smartofficeCutiTanggalAkhir"
        );

    const jumlahField =
        document.getElementById(
            "smartofficeCutiJumlah"
        );

    const sisaField =
        document.getElementById(
            "smartofficeCutiSisaCuti"
        );

    if(tanggalAkhir){
        tanggalAkhir.value = "";
    }

    if(jumlahField){
        jumlahField.value = "";
    }

    if(sisaField){
        sisaField.value =
            sisaField.dataset.original || 0;
    }
}


/* ======================================================
   RESET PERHITUNGAN CUTI
====================================================== */
export function smartofficeResetPerhitunganCuti(){

    const jumlahField =
        document.getElementById(
            "smartofficeCutiJumlah"
        );

    const sisaField =
        document.getElementById(
            "smartofficeCutiSisaCuti"
        );

    if(jumlahField){
        jumlahField.value = "";
    }

    if(sisaField){
        sisaField.value =
            sisaField.dataset.original || 0;
    }
}



/* ================================================================================
   VALIDASI
================================================================================ */

/* ======================================================
   VALIDASI HARI MINGGU
====================================================== */
export function smartofficeValidateSunday(
    inputId,
    message
){

    /* INPUT ELEMENT */
    const input =
        document.getElementById(
            inputId
        );

    /* VALIDASI ELEMENT */
    if(
        !input
    ){
        return;
    }

    /* CHANGE EVENT */
    input.addEventListener(
        "change",

        function(){

            /* EMPTY VALUE */
            if(
                !input.value
            ){
                return;
            }

            /* DATE OBJECT */
            const selectedDate =
                new Date(
                    input.value +
                    "T00:00:00"
                );

            /* HARI MINGGU */
            if(
                selectedDate.getDay() === 0
            ){
                smartofficeShowToast(
                    message,
                    "error"
                );

                /* RESET VALUE */
                input.value =
                    "";
            }
        }
    );
}


/* ======================================================
   HITUNG MASA KERJA
====================================================== */
export function smartofficeGetMasaKerja(
    tmtAwal
){
    if(
        !tmtAwal
    ){
        return "-";
    }

    /* FORMAT MM/dd/yyyy */
    const parts =
        String(
            tmtAwal
        ).split("/");

    if(
        parts.length !== 3
    ){
        return "-";
    }

    const startDate =
        new Date(
            parts[2],
            parts[0] - 1,
            parts[1]
        );

    const today =
        new Date();

    let tahun =
        today.getFullYear()
        -
        startDate.getFullYear();

    let bulan =
        today.getMonth()
        -
        startDate.getMonth();

    if(
        today.getDate()
        <
        startDate.getDate()
    ){
        bulan--;
    }

    if(
        bulan < 0
    ){
        tahun--;
        bulan += 12;
    }
    return `
        ${tahun} Tahun
        ${bulan} Bulan
    `
    .replace(/\s+/g, " ")
    .trim();
}

/* ================================================================================
   AUTOCOMPLETE
================================================================================ */

/* ======================================================
   INIT AUTOCOMPLETE DELEGASI
====================================================== */
export function smartofficeInitCutiDelegasiAutocomplete(){

    /* INPUT ELEMENT */
    const input =
        document.getElementById(
            "smartofficeCutiDelegasi"
        );

    /* RESULT CONTAINER */
    const resultBox =
        document.getElementById(
            "smartofficeCutiDelegasiAutocomplete"
        );

    const nipField =
        document.getElementById(
            "smartofficeCutiDelegasiNip"
        );    

    /* VALIDASI ELEMENT */
    if(
        !input ||
        !resultBox
    ){
        return;
    }

    /* INPUT LISTENER */
    input.oninput =
    
        function(){
            /* KEYWORD */
            const keyword =
                input.value
                    .trim()
                    .toLowerCase();

            /* RESET RESULT */
            resultBox.innerHTML =
                "";

            /* EMPTY KEYWORD */
            if(
                keyword.length < 1
            ){
                nipField.value =
                    "";
                return;
            }

            /* =========================
              NIP PEGAWAI LOGIN
            ========================= */
            const sessionData =
                smartofficeGetSession();

            const currentNip =
                String(
                    sessionData?.nip || ""
                ).trim();


            /* =========================
              FILTER DATA DELEGASI
            ========================= */
            const filtered =
                smartofficePegawaiCache.filter(
                    function(item){

                        const itemNip =
                            String(
                                item.nip || ""
                            ).trim();

                        /* EXCLUDE DIRI SENDIRI */
                        if(
                            itemNip === currentNip
                        ){
                            return false;
                        }

                        /* FILTER NAMA / NIP */
                        return (
                            String(
                                item.nama || ""
                            )
                            .toLowerCase()
                            .includes(
                                keyword
                            )

                            ||

                            itemNip.includes(
                                keyword
                            )
                        );
                    }
                );

            /* EMPTY RESULT */
            if(
                filtered.length === 0
            ){
                resultBox.innerHTML = `
                    <div class="
                        smartoffice-cuti-autocomplete-empty
                    ">
                        Pegawai tidak ditemukan
                    </div>
                `;
                return;
            }

            /* RENDER RESULT */
            filtered
              .slice(0,10)
              .forEach(
                function(item){
                    const option =
                        document.createElement(
                            "div"
                        );
                    option.className =
                        "smartoffice-cuti-autocomplete-item";

                    option.innerHTML = `
                        <strong>
                            ${item.nama}
                        </strong>

                        <span>
                            ${item.nip}
                        </span>
                    `;

                    option.addEventListener(
                        "click",

                        function(){
                            smartofficeSelectDelegasi(
                                item.nama,
                                item.nip
                            );
                        }
                    );
                    resultBox.appendChild(
                        option
                    );
                }
            );
    };
}

/* ======================================================
   SELECT DELEGASI
====================================================== */
export function smartofficeSelectDelegasi(
    nama,
    nip
){

    /* SET NAMA */
    document.getElementById(
        "smartofficeCutiDelegasi"
    ).value =
        nama;

    /* SET NIP */
    document.getElementById(
        "smartofficeCutiDelegasiNip"
    ).value =
        nip;

    /* CLEAR AUTOCOMPLETE */
    document.getElementById(
        "smartofficeCutiDelegasiAutocomplete"
    ).innerHTML =
        "";
}


/* ======================================================
   FILTER RIWAYAT CUTI
====================================================== */
export function smartofficeFilterRiwayatCuti(
  status,
  element = null
){

  /* BUTTON */
  const buttons =
    document.querySelectorAll(
      '.smartoffice-riwayat-filter-item'
    );

  /* REMOVE ACTIVE */
  buttons.forEach(function(btn){

    btn.classList.remove(
      'active'
    );

  });

  /* ACTIVE CURRENT */
  if(element){

    element.classList.add(
      'active'
    );
  }

  /* CONTAINER */
  const container =
    document.getElementById(
      'smartofficeRiwayatCutiList'
    );

  /* FILTER DATA */
  let filteredData =
    smartofficeRiwayatCutiCache;

  if(
    status !== 'SEMUA'
  ){

    filteredData =
      smartofficeRiwayatCutiCache.filter(
        function(item){

          /* MENUNGGU */
          if(
            status === 'MENUNGGU'
          ){

            return (
              item.status ===
                'MENUNGGU_APPROVAL_1'
              ||
              item.status ===
                'MENUNGGU_APPROVAL_2'
            );
          }

          /* STATUS LAIN */
          return (
            item.status === status
          );

        }
      );
  }

  /* EMPTY */
  if(
    filteredData.length === 0
  ){

    container.innerHTML = `

      <div class="
        smartoffice-empty-state
      ">

        <div class="
          smartoffice-empty-icon
        ">
          📭
        </div>

        <h3>
          Data tidak ditemukan
        </h3>

        <p>
          Belum ada riwayat cuti
          dengan status ini
        </p>

      </div>
    `;

    return;
  }

  /* HTML */
  let html = '';

  filteredData.forEach(
    function(item){

      let statusClass =
        'waiting';

      let statusText =
        'Menunggu';

      if(
        item.status === 'DISETUJUI'
      ){

        statusClass =
          'approved';

        statusText =
          'Disetujui';
      }

      if(
        item.status === 'DITOLAK'
      ){

        statusClass =
          'rejected';

        statusText =
          'Ditolak';
      }

      const startDate =
        new Date(
          item.tanggalAwal
        );

      const day =
        startDate.getDate();

      const month =
        startDate
          .toLocaleString(
            'id-ID',
            {
              month : 'short'
            }
          )
          .toUpperCase();

      html += `
        <div class="
          smartoffice-riwayat-cuti-card
        "

        onclick='
          smartofficeOpenRiwayatCutiDetail(
            ${JSON.stringify(item)}
          )
        '
        >

          <div class="
            smartoffice-riwayat-date
          ">
            <small>
              ${month}
            </small>

            <strong>
              ${day}
            </strong>
          </div>

          <div class="
            smartoffice-riwayat-cuti-content
          ">
            <h3>
              ${item.jenisCuti}
            </h3>

            <small>
              ${item.jumlahCuti} Hari
            </small>

            <p>
              ${formatTanggalIndonesia(
                item.tanggalAwal
              )}
              -
              ${formatTanggalIndonesia(
                item.tanggalAkhir
              )}
            </p>
          </div>

          <div class="
            smartoffice-riwayat-cuti-right
          ">

            <span class="
              smartoffice-riwayat-status
              ${statusClass}
            ">
              ${statusText}
            </span>

            <div class="
              smartoffice-riwayat-arrow
            ">
              <svg viewBox="0 0 24 24">
                <path d="
                  M9 18l6-6-6-6
                "/>
              </svg>
            </div>
          </div>
        </div>
      `;
    }
  );

  container.innerHTML =
    html;
}

window.smartofficeFilterRiwayatCuti =
  smartofficeFilterRiwayatCuti;


/* ================================================================================
   TAB
================================================================================ */

/* ======================================================
   INIT TAB
====================================================== */
function smartofficeInitTab(){

  const formButton =
    document.getElementById(
      "smartofficeTabFormCuti"
    );

  const riwayatButton =
    document.getElementById(
      "smartofficeTabRiwayatCuti"
    );

  if(formButton){
    formButton.onclick =
      function(){
        smartofficeSwitchCutiTab(
          "form"
        );
      };
  }

  if(riwayatButton){
    riwayatButton.onclick =
      function(){
        smartofficeSwitchCutiTab(
          "riwayat"
        );
      };
  }
}

/* ======================================================
   SWITCH TAB CUTI
====================================================== */
export async function smartofficeSwitchCutiTab(
    tab
){

    /* CONTENT */
    const formContent =
        document.getElementById(
            "smartofficeFormCutiContent"
        );

    const riwayatContent =
        document.getElementById(
            "smartofficeRiwayatCutiContent"
        );

    /* BUTTON */
    const formButton =
        document.getElementById(
            "smartofficeTabFormCuti"
        );

    const riwayatButton =
        document.getElementById(
            "smartofficeTabRiwayatCuti"
        );
    if(
        !formContent ||
        !riwayatContent ||
        !formButton ||
        !riwayatButton
    ){
        return;
    }

    /* RESET ACTIVE */
    formButton.classList.remove(
        "active"
    );
    riwayatButton.classList.remove(
        "active"
    );

    /* FORM */
    if(
        tab === "form"
    ){
        formContent.style.display =
            "block";

        riwayatContent.style.display =
            "none";

        formButton.classList.add(
            "active"
        );
    }

    /* RIWAYAT */
    else{

        riwayatContent.style.display =
            "block";

        formContent.style.display =
            "none";

        riwayatButton.classList.add(
            "active"
        );

        /* BELUM ADA CACHE */
        if(
            smartofficeRiwayatCutiCache === null
        ){

            const session =
                smartofficeGetSession();

            if(session){

                await smartofficeLoadRiwayatCuti(
                    session.nip
                );

            }

        }

        /* SUDAH ADA CACHE */
        else{

            smartofficeRenderRiwayatCuti();

        }

    }
}



/* ================================================================================
   UPLOAD
================================================================================ */

/* ======================================================
   INIT UPLOAD LAMPIRAN
====================================================== */
export function smartofficeInitUploadLampiran(){

    /* FILE INPUT */
    const input =
        document.getElementById(
            "smartofficeCutiLampiran"
        );

    /* FILE NAME */
    const fileNameElement =
        document.getElementById(
            "smartofficeCutiFileName"
        );

    /* VALIDASI ELEMENT */
    if(
        !input ||
        !fileNameElement
    ){
        return;
    }

    /* CHANGE EVENT */
    input.onchange =
        function(){

            /* FILE */
            const file =
                input.files?.[0] || null;

            /* SAVE FILE */
            smartofficeLampiranFile =
                file;

            /* UPDATE TEXT */
            if(
                file
            ){
                fileNameElement.innerText =
                    file.name;
            }
            else{
                fileNameElement.innerText =
                    "Belum ada file dipilih";
            }
        };
}



/* ================================================================================
   SUBMIT
================================================================================ */

/* ======================================================
   INIT BUTTON SUBMIT
====================================================== */
export function smartofficeInitSubmitButton(){

    /* BUTTON */
    const submitButton =
        document.getElementById(
            "smartofficeCutiSubmitButton"
        );

    /* VALIDASI */
    if(
        !submitButton
    ){
        return;
    }

    /* CLICK EVENT */
    submitButton.onclick =
        function(){

            smartofficeSubmitCutiForm();

        };
}


/* ======================================================
   SUBMIT FORM CUTI
====================================================== */
export async function smartofficeSubmitCutiForm(){

  /* PREVENT DOUBLE SUBMIT */
  if(smartofficeSubmitting){
    return;
  }

  /* SESSION DATA */
  const sessionData =
    smartofficeGetSession();

  /* FILE INPUT */
  const fileInput =
    document.getElementById(
         "smartofficeCutiLampiran"
    );

  if(
    !fileInput
  ){
    return;
  }

  /* JENIS CUTI */
  const jenisCuti =
    document.getElementById(
      'smartofficeCutiJenis'
    )
    .value
    .toUpperCase()
    .trim();

  /* TANGGAL SURAT */
  const tanggalSurat =
    document.getElementById(
      'smartofficeCutiTanggalSurat'
    ).value;

  /* VALIDASI HARI MINGGU */
  if(tanggalSurat){
    const suratDate =
      new Date(
        tanggalSurat + 'T00:00:00'
      );

    /* HARI MINGGU */
    if(suratDate.getDay() === 0){
      smartofficeShowToast(
        'Tanggal surat tidak boleh hari Minggu',
        'error'
      );
      return;
    }
  }

  /* TANGGAL AWAL CUTI */
  const tanggalAwalCuti =
    document.getElementById(
      'smartofficeCutiTanggalAwal'
    ).value;

  /* VALIDASI TANGGAL SURAT */
  if(
    tanggalSurat &&
    tanggalAwalCuti
  ){
    const suratDate =
      new Date(
        tanggalSurat + 'T00:00:00'
      );

    const awalCutiDate =
      new Date(
        tanggalAwalCuti + 'T00:00:00'
      );

    /* SURAT > AWAL CUTI */
    if(suratDate > awalCutiDate){
      smartofficeShowToast(
        'Tanggal surat tidak boleh melebihi tanggal awal cuti',
        'error'
      );
      return;
    }
  }

  /* =========================
    VALIDASI MASA KERJA
  ========================= */
  if(
    jenisCuti ===
    'CUTI TAHUNAN'
  ){

    /* TMT */
    const tmtValue =
      document.getElementById(
        'smartofficeCutiTmtAwal'
      ).value;

    if(tmtValue){

      /* FORMAT MM/dd/yyyy */
      const parts =
        String(tmtValue)
          .split('/');
    if(
    parts.length !== 3
){
    return;
}

      const tmtDate =
        new Date(
          parts[2],
          parts[0] - 1,
          parts[1]
        );

      const today =
        new Date();

      /* SELISIH */
      const selisihTahun =
        (
          today - tmtDate
        )
        /
        (
          1000 * 60 * 60 * 24 * 365
        );

      /* VALIDASI */
      if(
        selisihTahun < 1
      ){
        smartofficeShowToast(
          'Cuti tahunan hanya dapat diajukan setelah masa kerja 1 tahun.',
          'error'
        );
        return;
      }
    }
  }

  /* =========================
    VALIDASI LAMPIRAN WAJIB
  ========================= */
  if(
    jenisCuti ===
    'CUTI SAKIT'

    ||

    jenisCuti ===
    'CUTI ALASAN PENTING'
  ){
    if(
      fileInput.files.length === 0
    ){
      smartofficeShowToast(
        'Lampiran wajib diunggah untuk jenis cuti tersebut.',
        'error'
      );
      return;
    }
  }

  const alamatSaatCutiElement =
    document.getElementById(
      'smartofficeCutiAlamatSaatCuti'
    );

  /* VALIDASI FIELD WAJIB */
  const requiredFields = [
    {
      value :
        document.getElementById(
          'smartofficeCutiTanggalSurat'
        ).value,
      message :
        'Tanggal surat wajib diisi.'
    },

    {
      value : jenisCuti,
      message :
        'Jenis cuti wajib dipilih.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiTanggalAwal'
        ).value,
      message :
        'Tanggal awal cuti wajib diisi.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiTanggalAkhir'
        ).value,
      message :
        'Tanggal akhir cuti wajib diisi.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiKeperluan'
        ).value,
      message :
        'Keperluan wajib diisi.'
    },

    {
      value :
        alamatSaatCutiElement
        ? alamatSaatCutiElement.value
        : '',
      message :
        'Alamat saat cuti wajib diisi.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiDelegasi'
        ).value,
      message :
        'Penerima delegasi wajib diisi.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiDelegasiNip'
        ).value,
      message :
        'NIP delegasi wajib diisi.'
    },

    {
      value :
        document.getElementById(
          'smartofficeCutiTugasDelegasi'
        ).value,
      message :
        'Tugas delegasi wajib diisi.'
    }
  ];

  /* CHECK REQUIRED FIELD */
  for(
    let i = 0;
    i < requiredFields.length;
    i++
  ){
    if(
      !requiredFields[i]
        .value
        .toString()
        .trim()
    ){
      smartofficeShowToast(
        requiredFields[i].message,
        'error'
      );
      return;
    }
  }

  /* CONVERT FILE BASE64 */
  let base64File = '';
  let fileName = '';
  let fileType = '';

  if(fileInput.files.length > 0){
    const file =
      fileInput.files[0];

    fileName =
      file.name;

    fileType =
      file.type;

    base64File =
      await smartofficeConvertFileToBase64(
        file
      );
  }

  /* FORM DATA */
  const formData = {

    /* IDENTITAS */
    nama :
      document.getElementById(
        'smartofficeCutiNama'
      ).value,

    nip :
      document.getElementById(
        'smartofficeCutiNip'
      ).value,

    pangkat :
      document.getElementById(
        'smartofficeCutiPangkat'
      ).value,

    jabatan :
      document.getElementById(
        'smartofficeCutiJabatan'
      ).value,

    statusKepegawaian :
      document.getElementById(
        'smartofficeCutiStatusKepegawaian'
      ).value,

    tmtAwal :
      document.getElementById(
        'smartofficeCutiTmtAwal'
      ).value,

    masaKerja :
      document.getElementById(
        'smartofficeCutiMasaKerja'
      ).value,

    /* KONTAK */
    email :
      sessionData.email,

    noWa :
      sessionData.noWa,

    /* CUTI */
    tanggalSurat :
      document.getElementById(
        'smartofficeCutiTanggalSurat'
      ).value,

    jenisCuti :
      jenisCuti,

    tanggalAwalCuti :
      document.getElementById(
        'smartofficeCutiTanggalAwal'
      ).value,

    tanggalAkhirCuti :
      document.getElementById(
        'smartofficeCutiTanggalAkhir'
      ).value,

    sisaCuti :
      document.getElementById(
        'smartofficeCutiSisaCuti'
      ).value,

    keperluan :
      document.getElementById(
        'smartofficeCutiKeperluan'
      ).value,

    alamatSaatCuti :
      alamatSaatCutiElement
      ? alamatSaatCutiElement.value
      : '',

    /* FILE */
    base64File :
      base64File,

    fileName :
      fileName,

    fileType :
      fileType,

    /* DELEGASI */
    penerimaDelegasi :
      document.getElementById(
        'smartofficeCutiDelegasi'
      ).value,

    nipDelegasi :
      document.getElementById(
        'smartofficeCutiDelegasiNip'
      ).value,

    tugasDelegasi :
      document.getElementById(
        'smartofficeCutiTugasDelegasi'
      ).value,

    /* APPROVAL */
    approval1Nama : '',
    approval1Nip : '',

    approval2Nama : '',
    approval2Nip : ''
  };

  /* SUBMIT BUTTON */
  const submitButton =
    document.getElementById(
        "smartofficeCutiSubmitButton"
    );

  if(
    !submitButton
  ){
    return;
  }

  /* LOCK SUBMIT */
  smartofficeSubmitting =
    true;

  /* BUTTON LOADING */
  submitButton.disabled =
    true;

  submitButton.innerHTML = `
    <div class="
      smartoffice-cuti-form-button-loading
    ">
      <div class="
        smartoffice-cuti-form-button-spinner
      "></div>

      <span>
        Mengajukan...
      </span>
    </div>
  `;

  /* KIRIM KE SHEET */
  try{

      /* KIRIM KE SHEET */
      const response =
          await smartofficeSubmitCuti(
              formData
          );


      /* RESET LOCK */
      smartofficeSubmitting =
          false;

      /* RESET BUTTON */
      submitButton.disabled =
          false;

      submitButton.innerHTML =
          "Ajukan Cuti";


      /* =========================
        SUCCESS
      ========================= */

      if(
          response.success
      ){

          /* =========================
            RESET FORM
          ========================= */
          smartofficeResetCutiForm();

          /* =========================
            TOAST SEGERA
          ========================= */
          smartofficeShowToast(
              "Pengajuan berhasil: " +
              (response.data.idCuti || ""),
              "success"
          );

          /* =========================
            PINDAH TAB
          ========================= */
          setTimeout(function(){
              smartofficeSwitchCutiTab(
                  "riwayat"
              );
          },700);

          /* =========================
            RELOAD DATA
            BERJALAN DI BELAKANG
          ========================= */
          Promise.allSettled([
              smartofficeLoadRiwayatCuti(
                  formData.nip
              ),

              smartofficeLoadPegawai(
                  formData.nip
              )
          ]).then(function(){

              /* =========================
                FILTER SETELAH DATA SELESAI
              ========================= */
              smartofficeFilterRiwayatCuti(
                  "SEMUA"
              );

          }).catch(function(error){

              console.error(
                  "Gagal refresh data setelah submit:",
                  error
              );
          });
      }

      /* =========================
        FAILED
      ========================= */
      else{
          smartofficeShowToast(
              response.message,
              "error"
          );
      }
  }
  catch(error){

      /* RESET LOCK */
      smartofficeSubmitting =
          false;

      /* RESET BUTTON */
      submitButton.disabled =
          false;

      submitButton.innerHTML =
          "Ajukan Cuti";

      /* TOAST */
      smartofficeShowToast(
          error.message,
          "error"
      );

  }
}



/* ================================================================================
   RESET FORM CUTI
================================================================================ */
export function smartofficeResetCutiForm(){

  const ids = [
    'smartofficeCutiTanggalSurat',
    'smartofficeCutiJenis',
    'smartofficeCutiTanggalAwal',
    'smartofficeCutiTanggalAkhir',
    'smartofficeCutiJumlah',
    'smartofficeCutiSisaCuti',
    'smartofficeCutiKeperluan',
    'smartofficeCutiAlamatSaatCuti',
    'smartofficeCutiDelegasi',
    'smartofficeCutiDelegasiNip',
    'smartofficeCutiTugasDelegasi',
    'smartofficeCutiLampiran'
  ];

  ids.forEach(function(id){
    const element =
      document.getElementById(id);

    if(element){
      element.value = '';
    }
  });

  const fileName =
    document.getElementById(
      'smartofficeCutiFileName'
    );

  if(fileName){
    fileName.innerText =
      'Belum ada file dipilih';
  }

  const autocomplete =
    document.getElementById(
      'smartofficeCutiDelegasiAutocomplete'
    );

  if(autocomplete){
    autocomplete.innerHTML = '';
  }

  smartofficeLampiranFile = null;
}



/* ================================================================================
   REFRESH 
================================================================================ */

/* ======================================================
   REFRESH BUTTON
====================================================== */
function smartofficeInitRefreshButton(){

  const refreshButton =
    document.getElementById(
      "smartofficeRefreshButton"
    );

  if(refreshButton){
    refreshButton.onclick =
      function(){
        smartofficeRefreshCuti();
      };
  }
}

/* ======================================================
   REFRESH CUTI
====================================================== */
export async function smartofficeRefreshCuti(){

    console.log("REFRESH DIKLIK");

    const sessionData =
        smartofficeGetSession();

    const sisaCuti =
        document.getElementById(
            "smartofficeStatSisaCuti"
        );

    const menungguCuti =
        document.getElementById(
            "smartofficeStatMenungguCuti"
        );

    const disetujuiCuti =
        document.getElementById(
            "smartofficeStatDisetujuiCuti"
        );

    const riwayatList =
        document.getElementById(
            "smartofficeRiwayatCutiList"
        );

    /* MINI STAT LOADING */
    if(sisaCuti){
        sisaCuti.innerHTML =
            '<span class="smartoffice-mini-loader"></span>';
    }

    if(menungguCuti){
        menungguCuti.innerHTML =
            '<span class="smartoffice-mini-loader"></span>';
    }

    if(disetujuiCuti){
        disetujuiCuti.innerHTML =
            '<span class="smartoffice-mini-loader"></span>';
    }

    /* RIWAYAT LOADING */
    if(riwayatList){

        riwayatList.innerHTML = `
            <div class="smartoffice-dokumen-loading">
                <div class="smartoffice-dokumen-spinner"></div>
                <p>Memuat riwayat...</p>
            </div>
        `;

    }

    /* RESET CACHE */
    smartofficeRiwayatCutiCache =
        null;

    /* RELOAD DATA PEGAWAI & RIWAYAT CUTI*/
    await Promise.all([
        smartofficeLoadPegawai(sessionData.nip),
        smartofficeLoadRiwayatCuti(sessionData.nip)
    ]);

    smartofficeShowToast(
        "Data berhasil diperbarui",
        "success"
    );

}



/* ================================================================================
   FORMATTER
================================================================================ */

/* ======================================================
   FORMAT STATUS CUTI
====================================================== */
/* =========================
   FORMAT STATUS LABEL

   FUNCTION:
   Mengubah status database
   menjadi text lebih rapi.
========================= */
export function smartofficeFormatStatusCuti(
    status
){

    /* VALIDASI */
    if(
        !status
    ){
        return "-";
    }

    /* MENUNGGU */
    if(
        status ===
        "MENUNGGU_APPROVAL_1"
    ){
        return "Menunggu";
    }

    /* DISETUJUI */
    if(
        status ===
        "DISETUJUI"
    ){
        return "Disetujui";
    }

    /* DITOLAK */
    if(
        status ===
        "DITOLAK"
    ){
        return "Ditolak";
    }

    /* DEFAULT */
    return status;
}

/* ======================================================
   GET APPROVAL BADGE
====================================================== */
export function smartofficeGetApprovalBadge(
    status
){

    /* VALIDASI */
    if(
        !status
    ){
        status =
            "MENUNGGU_APPROVAL_1";
    }

    /* DISETUJUI */
    if(
        status ===
        "DISETUJUI"
    ){
        return `
            <span
                class="
                    smartoffice-riwayat-status
                    approved
                "
            >
                Disetujui
            </span>
        `;
    }

    /* DITOLAK */
    if(
        status ===
        "DITOLAK"
    ){
        return `
            <span
                class="
                    smartoffice-riwayat-status
                    rejected
                "
            >
                Ditolak
            </span>
        `;
    }

    /* MENUNGGU */
    return `
        <span
            class="
                smartoffice-riwayat-status
                waiting
            "
        >
            Menunggu
        </span>
    `;
}



/* ================================================================================
   DETAIL MODAL RIWAYAT
================================================================================ */
/* ======================================================
   OPEN RIWAYAT DETAIL
====================================================== */
export function smartofficeOpenRiwayatCutiDetail(
    item
){

  /* MODAL */
  const modal =
    document.getElementById(
      'smartofficeRiwayatCutiDetailModal'
    );

  /* BODY */
  const body =
    document.getElementById(
      'smartofficeRiwayatCutiDetailBody'
    );

  /* SHOW */
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

  const periodeCuti =
    item.tanggalAwal === item.tanggalAkhir

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

  /* RENDER */
  body.scrollTop = 0;
  body.innerHTML = `

    <!-- PROFILE -->
    <div class="
      smartoffice-cuti-riwayat-modal-profile
    ">
      
      <div class="
        smartoffice-cuti-riwayat-modal-profile-info
        ">
        <h4>
          ${item.jenisCuti || '-'}
        </h4>

        <span class="
          smartoffice-cuti-riwayat-modal-status
          ${statusClass}
        ">
          ${statusText}
        </span>
      </div>

    </div>

    <!-- DETAIL -->
    <div class="
      smartoffice-cuti-riwayat-modal-grid
    ">

      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">

        <label>
          Tanggal Permohonan
        </label>

        <span>
          ${formatTanggalIndonesia(
            item.tanggalSurat
          )}
        </span>

      </div>

      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          Tanggal Cuti
        </label>

        <span>
          ${periodeCuti}
        </span>
      </div>

      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          Jumlah Hari
        </label>

        <span>
          ${item.jumlahCuti || 0} Hari
        </span>
      </div>
      
      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          Sisa Cuti
        </label>

        <span>
          ${item.sisaCuti || 0} Hari
        </span>
      </div>

    </div>

    <!-- KEPERLUAN -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">

      <label>
        Keperluan
      </label>

      <span>
        ${item.keperluan || '-'}
      </span>

    </div>

    <!-- ALAMAT -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">

      <label>
        Alamat Selama Menjalani Cuti
      </label>

      <span>
        ${item.alamatSaatCuti || '-'}
      </span>

    </div>

    <!-- LAMPIRAN -->
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

    <!-- DELEGASI GRID -->
    <div class="
      smartoffice-cuti-riwayat-modal-grid
    ">

      <!-- PENERIMA -->
      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          Penerima Delegasi
        </label>

        <span>
          ${item.delegasi || '-'}
        </span>
      </div>

      <!-- NIP -->
      <div class="
        smartoffice-cuti-riwayat-modal-item
      ">
        <label>
          NIP / NRP Delegasi
        </label>

        <span>
          ${item.nipDelegasi || '-'}
        </span>
      </div>
    </div>

    <!-- TUGAS -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">

      <label>
        Tugas Yang Didelegasikan
      </label>

      <span>
        ${item.tugasDelegasi || '-'}
      </span>

    </div>

    <!-- APPROVAL 1 -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">

      <label>
        Approval 1
      </label>

      <div class="
        smartoffice-cuti-riwayat-modal-approval-box
      ">

        <div>
          <small>Nama</small>
          <strong>
            ${item.approval1 || '-'}
          </strong>
        </div>

        <div>
          <small>Status</small>
          ${smartofficeGetApprovalBadge(
            item.approval1Status
          )}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>
            ${item.approval1Tanggal || '-'}
          </strong>
        </div>

        <div>
          <small>Catatan</small>
          <strong>
            ${item.approval1Catatan || '-'}
          </strong>
        </div>

      </div>

    </div>

    <!-- APPROVAL 2 -->
    <div class="
      smartoffice-cuti-riwayat-modal-item
      full-width
    ">
      <label>
        Approval 2
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
          ${smartofficeGetApprovalBadge(
            item.approval2Status
          )}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>
            ${item.approval2Tanggal || '-'}
          </strong>
        </div>

        <div>
          <small>Catatan</small>
          <strong>
            ${item.approval2Catatan || '-'}
          </strong>
        </div>
      </div>
    </div>

    <!-- PDF -->
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

    <!-- FOOTER -->
    <div class="
      smartoffice-cuti-riwayat-modal-footer
    ">

      <button
        class="
          smartoffice-cuti-riwayat-modal-close-button
        "
        onclick="
          smartofficeCloseRiwayatCutiDetail()
        "
      >
        Tutup
      </button>
    </div>
  `;
}

/* ======================================================
   CLOSE RIWAYAT DETAIL
====================================================== */
export function smartofficeCloseRiwayatCutiDetail(){

  const modal =
    document.getElementById(
      'smartofficeRiwayatCutiDetailModal'
    );

  modal.classList.remove(
    'show'
  );

  setTimeout(function(){
    modal.style.display =
      'none';

  },200);
}

/* ======================================================
   GLOBAL WINDOW
====================================================== */
window.smartofficeOpenRiwayatCutiDetail =
    smartofficeOpenRiwayatCutiDetail;

window.smartofficeCloseRiwayatCutiDetail =
    smartofficeCloseRiwayatCutiDetail;

















































































































