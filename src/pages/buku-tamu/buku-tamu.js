/* ======================================================
   SMARTOFFICE BUKU TAMU
====================================================== */
import {
    smartofficeApi
} from "../../core/api.js";

import {
    smartofficeGenerateLaporanBukuTamu
} from "../../utils/print.js";

import {
    smartofficeGetKapus
} from "../../services/management-cuti.service.js";

import {
    smartofficeGetBukuTamu
} from "../../services/buku-tamu.service.js";


/* ======================================================
   GLOBAL DATA
====================================================== */
let smartofficeBukuTamuData = [];
let smartofficeBukuTamuFilteredData = [];


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       RESET DATA
    ========================= */
    smartofficeBukuTamuData = [];
    smartofficeBukuTamuFilteredData = [];

    /* =========================
       LOAD DATA
    ========================= */
    await smartofficeLoadBukuTamu();

    /* =========================
       INIT FILTER
    ========================= */
    smartofficeInitBukuTamuFilter();
}


/* ======================================================
   REFRESH
====================================================== */
export async function smartofficeRefreshBukuTamu(){
    await smartofficeLoadBukuTamu();
}


/* ======================================================
   LOAD DATA
====================================================== */

async function smartofficeLoadBukuTamu(){

    const container =
        document.getElementById(
            "smartofficeBukuTamuList"
        );


    /* =========================
       LOADING
    ========================= */

    if(container){

        container.innerHTML = `

            <div class="
                smartoffice-arsip-loading
            ">

                <div class="
                    smartoffice-arsip-spinner
                "></div>

                <div class="
                    smartoffice-arsip-loading-text
                ">
                    Memuat data Buku Tamu...
                </div>

            </div>

        `;

    }


    try{

        /* =========================
           API
        ========================= */

        const response =
            await smartofficeApi(
                "smartofficeGetBukuTamu"
            );


        console.log(
            "BUKU TAMU API:",
            response
        );


        /* =========================
           VALIDASI
        ========================= */

        if(
            !response ||
            !response.success
        ){

            throw new Error(
                response?.message ||
                "Gagal memuat Buku Tamu."
            );

        }


        /* =========================
           DATA
        ========================= */

        const data =
            response.data || [];


        smartofficeBukuTamuData =
            data.map(
                function(item){

                    item.foto =
                        smartofficeConvertDriveUrl(
                            item.fotoUrl
                        );

                    item.ttd =
                        smartofficeConvertDriveUrl(
                            item.ttdUrl
                        );

                    return item;

                }
            );


        /* =========================
           RESET FILTERED
        ========================= */

        smartofficeBukuTamuFilteredData =
            [];


        /* =========================
           UPDATE STAT
        ========================= */

        smartofficeUpdateStatBukuTamu();


        /* =========================
           TAHUN
        ========================= */

        smartofficeInitFilterTahunBukuTamu();


        /* =========================
           DEFAULT FILTER
           BULAN + TAHUN SEKARANG
        ========================= */

        smartofficeSetDefaultFilterBukuTamu();


        /* =========================
           FILTER OTOMATIS
        ========================= */

        smartofficeFilterBukuTamu();

    }
    catch(error){

        console.error(
            "BUKU TAMU ERROR:",
            error
        );


        if(container){

            container.innerHTML = `

                <div class="
                    smartoffice-empty-state
                ">

                    <div class="
                        smartoffice-empty-icon
                    ">
                        ⚠️
                    </div>

                    <h3>
                        Gagal memuat data
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                </div>

            `;

        }


        if(
            typeof window.smartofficeShowToast ===
            "function"
        ){

            window.smartofficeShowToast(
                "Gagal memuat Buku Tamu",
                "error"
            );

        }

    }

}


/* ======================================================
   DEFAULT FILTER BUKU TAMU
====================================================== */
function smartofficeSetDefaultFilterBukuTamu(){

    const bulan =
        document.getElementById(
            "smartofficeBukuTamuFilterBulan"
        );

    const tahun =
        document.getElementById(
            "smartofficeBukuTamuFilterTahun"
        );


    if(
        !bulan ||
        !tahun
    ){

        return;

    }


    const sekarang =
        new Date();


    /* =========================
       BULAN SEKARANG
       0 = Januari
       11 = Desember
    ========================= */

    bulan.value =
        String(
            sekarang.getMonth()
        );


    /* =========================
       TAHUN SEKARANG
    ========================= */

    tahun.value =
        String(
            sekarang.getFullYear()
        );

}


/* ======================================================
   UPDATE STATISTIK
====================================================== */
function smartofficeUpdateStatBukuTamu(){

    const total =
        smartofficeBukuTamuData.length;

    const now =
        new Date();

    const today =
        now.toLocaleDateString(
            "id-ID"
        );

    const bulan =
        now.getMonth();

    const tahun =
        now.getFullYear();

    let hariIni = 0;
    let bulanIni = 0;

    smartofficeBukuTamuData.forEach(
        function(item){

            const d =
                smartofficeParseTanggalBukuTamu(
                    item.timestamp
                );

            if(!d){
                return;
            }

            if(
                d.toLocaleDateString(
                    "id-ID"
                ) === today
            ){
                hariIni++;
            }

            if(
                d.getMonth() === bulan &&
                d.getFullYear() === tahun
            ){
                bulanIni++;
            }
        }
    );

    const totalEl =
        document.getElementById(
            "smartofficeBukuTamuTotal"
        );

    const hariIniEl =
        document.getElementById(
            "smartofficeBukuTamuHariIni"
        );

    const bulanIniEl =
        document.getElementById(
            "smartofficeBukuTamuBulanIni"
        );

    if(totalEl){
        totalEl.innerText =
            total;
    }

    if(hariIniEl){
        hariIniEl.innerText =
            hariIni;
    }

    if(bulanIniEl){
        bulanIniEl.innerText =
            bulanIni;
    }
}


/* ======================================================
   INIT FILTER
====================================================== */

function smartofficeInitBukuTamuFilter(){

    const nama =
        document.getElementById(
            "smartofficeBukuTamuFilterNama"
        );


    if(!nama){

        return;

    }


    /* HINDARI LISTENER GANDA */

    if(
        nama.dataset.initialized ===
        "true"
    ){

        return;

    }


    nama.dataset.initialized =
        "true";


    nama.addEventListener(
        "input",
        smartofficeFilterBukuTamu
    );

}


/* ======================================================
   FILTER
====================================================== */

export function smartofficeFilterBukuTamu(){

    const namaEl =
        document.getElementById(
            "smartofficeBukuTamuFilterNama"
        );

    const tanggalEl =
        document.getElementById(
            "smartofficeBukuTamuFilterTanggal"
        );

    const bulanEl =
        document.getElementById(
            "smartofficeBukuTamuFilterBulan"
        );

    const tahunEl =
        document.getElementById(
            "smartofficeBukuTamuFilterTahun"
        );


    const nama =
        namaEl?.value
            .trim()
            .toLowerCase() || "";


    const tanggal =
        tanggalEl?.value || "";


    const bulan =
        bulanEl?.value ?? "";


    const tahun =
        tahunEl?.value || "";


    /* =========================
       BELUM ADA FILTER
    ========================= */

    if(
        !nama &&
        !tanggal &&
        bulan === "" &&
        !tahun
    ){

        smartofficeBukuTamuFilteredData =
            [];

        smartofficeRenderBukuTamuKosong();

        return;

    }


    /* =========================
       FILTER DATA
    ========================= */

    smartofficeBukuTamuFilteredData =
        smartofficeBukuTamuData.filter(
            function(item){

                const date =
                    smartofficeParseTanggalBukuTamu(
                        item.timestamp
                    );


                if(!date){

                    return false;

                }


                /* NAMA */

                if(
                    nama &&
                    !String(
                        item.nama || ""
                    )
                    .toLowerCase()
                    .includes(nama)
                ){

                    return false;

                }


                /* TANGGAL */

                if(tanggal){

                    const pilih =
                        new Date(
                            tanggal
                        );


                    if(
                        date.getDate() !==
                            pilih.getDate() ||

                        date.getMonth() !==
                            pilih.getMonth() ||

                        date.getFullYear() !==
                            pilih.getFullYear()
                    ){

                        return false;

                    }

                }


                /* BULAN */

                if(
                    bulan !== "" &&
                    date.getMonth() != bulan
                ){

                    return false;

                }


                /* TAHUN */

                if(
                    tahun &&
                    date.getFullYear() != tahun
                ){

                    return false;

                }


                return true;

            }
        );


    smartofficeRenderBukuTamu();

}


/* ======================================================
   INIT TAHUN
====================================================== */

function smartofficeInitFilterTahunBukuTamu(){

    const select =
        document.getElementById(
            "smartofficeBukuTamuFilterTahun"
        );


    if(!select){

        return;

    }


    select.innerHTML =
        `
        <option value="">
            Semua Tahun
        </option>
        `;


    const tahun = [

        ...new Set(

            smartofficeBukuTamuData
                .map(
                    function(item){

                        const d =
                            smartofficeParseTanggalBukuTamu(
                                item.timestamp
                            );

                        return d
                            ? d.getFullYear()
                            : null;

                    }
                )
                .filter(Boolean)

        )

    ]
    .sort()
    .reverse();


    tahun.forEach(
        function(th){

            const opt =
                document.createElement(
                    "option"
                );


            opt.value =
                th;

            opt.textContent =
                th;


            select.appendChild(
                opt
            );

        }
    );

}


/* ======================================================
   RESET FILTER
====================================================== */

export function smartofficeResetBukuTamu(){

    const nama =
        document.getElementById(
            "smartofficeBukuTamuFilterNama"
        );

    const tanggal =
        document.getElementById(
            "smartofficeBukuTamuFilterTanggal"
        );

    const bulan =
        document.getElementById(
            "smartofficeBukuTamuFilterBulan"
        );

    const tahun =
        document.getElementById(
            "smartofficeBukuTamuFilterTahun"
        );


    if(nama){

        nama.value = "";

    }


    if(tanggal){

        tanggal.value = "";

    }


    if(bulan){

        bulan.value = "";

    }


    if(tahun){

        tahun.value = "";

    }


    smartofficeBukuTamuFilteredData =
        [];


    smartofficeRenderBukuTamuKosong();

}


/* ======================================================
   RENDER BUKU TAMU
====================================================== */

function smartofficeRenderBukuTamu(){

    const container =
        document.getElementById(
            "smartofficeBukuTamuList"
        );


    if(!container){

        return;

    }


    if(
        !smartofficeBukuTamuFilteredData.length
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
                    Tidak ada data Buku Tamu
                    sesuai filter yang dipilih
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        smartofficeBukuTamuFilteredData
            .map(
                function(item,index){

                    const date =
                        smartofficeParseTanggalBukuTamu(
                            item.timestamp
                        );


                    const tanggal =
                        date.getDate();


                    const bulan =
                        date
                            .toLocaleString(
                                "id-ID",
                                {
                                    month:"short"
                                }
                            )
                            .toUpperCase();


                    const tanggalLengkap =
                        smartofficeFormatTanggalJamFrontend(
                            item.timestamp
                        );


                    return `

                        <div
                            class="
                                smartoffice-management-card
                                smartoffice-bukutamu-card
                            "
                            onclick="
                                smartofficeOpenBukuTamuDetail(
                                    ${index}
                                )
                            "
                        >

                            <div
                                class="
                                    smartoffice-riwayat-date
                                "
                            >

                                <small>
                                    ${bulan}
                                </small>

                                <strong>
                                    ${tanggal}
                                </strong>

                            </div>


                            <div
                                class="
                                    smartoffice-management-card-content
                                "
                            >

                                <h3>
                                    ${item.nama || "-"}
                                </h3>

                                <small>
                                    ${item.alamatInstansi || "-"}
                                </small>

                                <div
                                    class="
                                        smartoffice-management-divider
                                    "
                                ></div>

                                <p>
                                    📅
                                    <strong>
                                        Tanggal :
                                    </strong>
                                    ${tanggalLengkap}
                                </p>

                                <p>
                                    📞
                                    <strong>
                                        No HP :
                                    </strong>
                                    ${item.noHp || "-"}
                                </p>

                                <p>
                                    📝
                                    <strong>
                                        Keperluan :
                                    </strong>
                                    ${item.keperluan || "-"}
                                </p>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ======================================================
   OPEN DETAIL
====================================================== */

export function smartofficeOpenBukuTamuDetail(
    index
){

    const data =
        smartofficeBukuTamuFilteredData[
            index
        ];


    if(!data){

        return;

    }


    const body =
        document.getElementById(
            "smartofficeBukuTamuDetailBody"
        );


    if(!body){

        return;

    }


    body.innerHTML = `

        <div
            class="
                smartoffice-bukutamu-detail-wrapper
            "
        >

            <div
                class="
                    smartoffice-bukutamu-image-row
                "
            >

                <div
                    class="
                        smartoffice-bukutamu-image-card
                    "
                >

                    <h4>
                        Foto Tamu
                    </h4>

                    <img
                        src="${data.foto || ""}"
                        onclick="
                            window.open(
                                '${data.foto || ""}',
                                '_blank'
                            )
                        "
                    >

                </div>


                <div
                    class="
                        smartoffice-bukutamu-image-card
                    "
                >

                    <h4>
                        Tanda Tangan
                    </h4>

                    <img
                        src="${data.ttd || ""}"
                        onclick="
                            window.open(
                                '${data.ttd || ""}',
                                '_blank'
                            )
                        "
                    >

                </div>

            </div>


            <div
                class="
                    smartoffice-bukutamu-detail-divider
                "
            ></div>


            <table
                class="
                    smartoffice-bukutamu-detail-table
                "
            >

                <tr>
                    <td>Nama</td>
                    <td>
                        ${data.nama || "-"}
                    </td>
                </tr>

                <tr>
                    <td>Instansi/Alamat</td>
                    <td>
                        ${data.alamatInstansi || "-"}
                    </td>
                </tr>

                <tr>
                    <td>No HP</td>
                    <td>
                        ${data.noHp || "-"}
                    </td>
                </tr>

                <tr>
                    <td>Tanggal</td>
                    <td>
                        ${
                            smartofficeFormatTanggalJamFrontend(
                                data.timestamp
                            )
                        }
                    </td>
                </tr>

                <tr>
                    <td>Keperluan</td>
                    <td>
                        ${data.keperluan || "-"}
                    </td>
                </tr>

                <tr>
                    <td>Pesan / Kesan</td>
                    <td>
                        ${data.pesanKesan || "-"}
                    </td>
                </tr>

            </table>

        </div>

    `;


    const modal =
        document.getElementById(
            "smartofficeBukuTamuDetailModal"
        );


    if(modal){

        modal.style.display =
            "flex";

    }

}


/* ======================================================
   CLOSE DETAIL
====================================================== */

export function smartofficeCloseBukuTamuDetail(){

    const modal =
        document.getElementById(
            "smartofficeBukuTamuDetailModal"
        );


    if(modal){

        modal.style.display =
            "none";

    }

}


/* ======================================================
   CONVERT DRIVE URL
====================================================== */

function smartofficeConvertDriveUrl(
    url
){

    if(!url){

        return "";

    }


    const match =
        url.match(
            /\/d\/(.*?)\//
        );


    if(!match){

        return url;

    }


    return (
        "https://drive.google.com/thumbnail" +
        "?id=" +
        match[1] +
        "&sz=w1000"
    );

}


/* ======================================================
   PARSE TANGGAL BUKU TAMU
   FORMAT:
   DD/MM/YYYY HH:mm:ss
====================================================== */

function smartofficeParseTanggalBukuTamu(
    value
){

    if(!value){

        return null;

    }


    const part =
        value.split(' ');


    const tanggal =
        part[0].split('/');


    const waktu =
        (
            part[1] ||
            '00:00:00'
        ).split(':');


    return new Date(

        Number(
            tanggal[2]
        ),

        Number(
            tanggal[1]
        ) - 1,

        Number(
            tanggal[0]
        ),

        Number(
            waktu[0]
        ),

        Number(
            waktu[1]
        ),

        Number(
            waktu[2]
        )

    );

}


/* ======================================================
   FORMAT TANGGAL JAM FRONTEND
   OUTPUT:
   3 Agustus 2026 13:22
====================================================== */

function smartofficeFormatTanggalJamFrontend(
    value
){

    if(!value){

        return '-';

    }


    const date =
        smartofficeParseTanggalBukuTamu(
            value
        );


    if(
        !date ||
        isNaN(
            date.getTime()
        )
    ){

        return '-';

    }


    const bulan = [

        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember'

    ];


    return (

        date.getDate() +
        ' ' +
        bulan[
            date.getMonth()
        ] +
        ' ' +
        date.getFullYear() +
        ' ' +
        String(
            date.getHours()
        ).padStart(2,'0') +
        ':' +
        String(
            date.getMinutes()
        ).padStart(2,'0')

    );

}


/* ======================================================
   PRINT BUKU TAMU
====================================================== */

export async function smartofficePrintBukuTamu(){

    const data =
        smartofficeBukuTamuFilteredData || [];


    /* =========================
       VALIDASI DATA
    ========================= */

    if(!data.length){

        if(
            typeof window.smartofficeShowToast ===
            "function"
        ){

            window.smartofficeShowToast(
                "Tidak ada data untuk dicetak",
                "error"
            );

        }

        return;

    }


    /* =========================
       BUTTON
    ========================= */

    const btn =
        document.querySelector(
            ".smartoffice-bukutamu-print-button"
        );


    const oldHtml =
        btn
            ? btn.innerHTML
            : "🖨 Print";


    if(btn){

        btn.disabled = true;

        btn.innerHTML = `
            <span
                class="
                    smartoffice-bukutamu-spinner-print
                "
            ></span>
            Cetak
        `;

    }


    try{

        /* =========================
           GET KAPUS
        ========================= */

        const response =
            await smartofficeApi(
                "smartofficeGetKapus"
            );


        if(
            !response ||
            !response.success
        ){

            throw new Error(
                response?.message ||
                "Gagal mengambil data Kepala Puskesmas."
            );

        }


        const kapus =
            response.data || "";


        /* =========================
           GENERATE LAPORAN
        ========================= */

        const laporanHtml =
            smartofficeGenerateLaporanBukuTamu(
                data,
                kapus,
                ""
            );


        /* =========================
           OPEN PRINT
        ========================= */

        const win =
            window.open(
                "",
                "_blank"
            );


        if(!win){

            throw new Error(
                "Popup diblokir browser."
            );

        }


        win.document.open();

        win.document.write(
            laporanHtml
        );

        win.document.close();


        /* =========================
           RESET BUTTON
        ========================= */

        win.onload =
            function(){

                if(btn){

                    btn.disabled =
                        false;

                    btn.innerHTML =
                        oldHtml;

                }

            };

    }
    catch(error){

        console.error(
            "PRINT BUKU TAMU ERROR:",
            error
        );


        if(btn){

            btn.disabled =
                false;

            btn.innerHTML =
                oldHtml;

        }


        if(
            typeof window.smartofficeShowToast ===
            "function"
        ){

            window.smartofficeShowToast(
                error.message ||
                "Gagal menyiapkan laporan",
                "error"
            );

        }

    }

}


/* ======================================================
   DESTROY PAGE
====================================================== */

export function smartofficeDestroyPage(){

    smartofficeBukuTamuData = [];

    smartofficeBukuTamuFilteredData = [];

}