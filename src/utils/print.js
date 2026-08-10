/* ======================================================
   SMART OFFICE PRINT
====================================================== */
import {
    smartofficeShowToast
} from "../components/toast/toast.js";

import {
    formatTanggalIndonesia
} from "./date.js";

import {
    smartofficeGetKapus
} from "../services/management-cuti.service.js";


/* ======================================================
   CONFIG KOP
====================================================== */

/* =========================
   KONFIGURASI LAPORAN
========================= */
const SMARTOFFICE_LOGO_KABUPATEN =
    "https://i.ibb.co.com/tMMPJP0T/Kabupaten-Bandung.png";

const SMARTOFFICE_NAMA_PEMERINTAH =
    "PEMERINTAH KABUPATEN BANDUNG";

const SMARTOFFICE_NAMA_DINAS =
    "DINAS KESEHATAN";

const SMARTOFFICE_NAMA_INSTANSI =
    "PUSKESMAS NAMBO";

const SMARTOFFICE_ALAMAT =
    "Jl. Raya Arjasari No.110 Arjasari 40379 Kabupaten Bandung Provinsi Jawa Barat Telp. (022) 5940017";

const SMARTOFFICE_TELEPON =
    "(022) 5940017";

const SMARTOFFICE_EMAIL =
    "pkmnambo.bandungkab@gmail.com";

const SMARTOFFICE_WEBSITE =
    "www.pkmnambo.bandungkab.go.id";


/* =========================
   FORMAT TANGGAL
========================= */
/* ======================================================
   FORMAT TANGGAL SURAT FRONTEND
   OUTPUT:
   Arjasari, 14 Juli 2026
====================================================== */
function smartofficeFormatTanggalSuratFrontend(
    value
){

    if(
        !value
    ){
        return "-";
    }


    const date =
        new Date(
            value
        );


    if(
        isNaN(date)
    ){
        return "-";
    }


    const bulanIndonesia = [

        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"

    ];


    const tanggal =
        date.getDate();


    const bulan =
        bulanIndonesia[
            date.getMonth()
        ];


    const tahun =
        date.getFullYear();


    return `
        Arjasari,
        ${tanggal}
        ${bulan}
        ${tahun}
    `
    .replace(/\s+/g, " ")
    .trim();
}


/* ======================================================
   PRINT RIWAYAT CUTI
====================================================== */
export async function smartofficeExportRiwayatCutiPdf(){

    const data =
        window.smartofficeManagementRiwayatFilteredData || [];

    if(
        !data.length
    ){
        smartofficeShowToast(
            "Tidak ada data untuk dicetak",
            "error"
        );

        return;
    }

    /* =========================
       LOADING BUTTON
    ========================= */
    const btn =
        document.querySelector(
            ".smartoffice-management-print-button"
        );

    if(!btn){
        return;
    }

    const oldHtml =
        btn.innerHTML;

    btn.disabled =
        true;

    btn.innerHTML =
        '<span class="smartoffice-spinner-print"></span>Cetak';

    try{

        /*
         * ==================================================
         * GET DATA KAPUS
         * ==================================================
         *
         * BAGIAN INI NANTI KITA HUBUNGKAN KE SERVICE GAS
         * REST API YANG SUDAH DIPAKAI PROJECT.
         *
         * JANGAN gunakan google.script.run lagi.
         *
         */

        const kapus =
            await smartofficeGetKapus();

        const laporanHtml =
            smartofficeGenerateLaporanRiwayatCuti(
                data,
                kapus,
                ""
            );

        const win =
            window.open(
                "",
                "_blank"
            );

        if(!win){

            btn.disabled =
                false;

            btn.innerHTML =
                oldHtml;

            smartofficeShowToast(
                "Popup diblokir browser",
                "error"
            );

            return;
        }

        win.document.open();

        win.document.write(
            laporanHtml
        );

        win.document.close();

        win.onload =
            function(){
                btn.disabled =
                    false;

                btn.innerHTML =
                    oldHtml;
            };
    }
    catch(error){

        console.error(
            error
        );

        btn.disabled =
            false;

        btn.innerHTML =
            oldHtml;

        smartofficeShowToast(
            "Gagal menyiapkan laporan",
            "error"
        );
    }
}


/* ======================================================
   GENERATE LAPORAN RIWAYAT CUTI
====================================================== */
export function smartofficeGenerateLaporanRiwayatCuti(
    data,
    kapus,
    qrUrl
){

    const bodyHtml = `

        <div
            class="
                smartoffice-report-container
            "
        >

            <table
                class="
                    smartoffice-report-table
                "
            >

                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>NIP/NRP</th>
                        <th>Jabatan</th>
                        <th>
                            Status
                            Kepegawaian
                        </th>
                        <th>
                            Jenis
                            Cuti
                        </th>
                        <th>
                            Tanggal
                            Mulai
                        </th>
                        <th>
                            Tanggal
                            Akhir
                        </th>
                        <th>
                            Jumlah
                            Hari
                        </th>
                        <th>
                            Status
                            Approval
                        </th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        data
                            .map(
                                function(
                                    item,
                                    index
                                ){
                                    return `
                                        <tr>
                                            <td>
                                                ${index + 1}
                                            </td>
                                            <td>
                                                ${item.nama || "-"}
                                            </td>
                                            <td>
                                                ${item.nip || "-"}
                                            </td>
                                            <td>
                                                ${item.jabatan || "-"}
                                            </td>
                                            <td>
                                                ${item.statusKepegawaian || "-"}
                                            </td>
                                            <td>
                                                ${item.jenisCuti || "-"}
                                            </td>
                                            <td>
                                                ${formatTanggalIndonesia(
                                                    item.tanggalAwal
                                                )}
                                            </td>
                                            <td>
                                                ${formatTanggalIndonesia(
                                                    item.tanggalAkhir
                                                )}
                                            </td>
                                            <td>
                                                ${item.jumlahCuti || 0}
                                                Hari
                                            </td>
                                            <td>
                                                ${item.status || "-"}
                                            </td>
                                        </tr>
                                    `;
                                }
                            )
                            .join("")
                    }
                </tbody>
            </table>

            <div
                class="
                    smartoffice-report-keterangan
                "
            >
                <strong>
                    Keterangan :
                </strong>

                Laporan ini dihasilkan secara otomatis oleh
                Smart Office Puskesmas Nambo.

            </div>
        </div>
    `;

    /* =========================
       PERIODE
    ========================= */
    const bulanSelect =
        document.getElementById(
            "smartofficeManagementFilterBulan"
        );

    const tahun =
        document.getElementById(
            "smartofficeManagementFilterTahun"
        ).value ||
        "Semua Tahun";

    const bulanText =
        bulanSelect.options[
            bulanSelect.selectedIndex
        ].text;

    const periode =
        bulanText +
        " " +
        tahun;

    /* =========================
       GENERATE TEMPLATE
    ========================= */
    return smartofficeGenerateTemplateLaporan(
        "LAPORAN RIWAYAT CUTI",
        periode,
        bodyHtml,
        data.length,
        kapus,
        qrUrl
    );
}


/* ======================================================
   GENERATE TEMPLATE LAPORAN
====================================================== */
export function smartofficeGenerateTemplateLaporan(
    judul,
    periode,
    bodyHtml,
    totalData,
    kapus,
    qrUrl
){

    /* =========================
        FORMAT PRINT
    ========================= */
    const html = `

        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>
            ${judul}
            </title>

            <style>
            /* =====================================
               RESET
            ====================================== */
            *{
                box-sizing:border-box;
            }

            body{
                margin:0;
                padding:0;
                font-family:Arial,sans-serif;
                font-size:13px;
                color:#222;
            }

            /* =====================================
               PRINT
            ====================================== */
            @page{
                size:A4 landscape;
                margin:4mm;
            }

            @media print{
                button{
                    display:none;
                }
            }

            thead{
                display:table-header-group;
            }

            tfoot{
                display:table-footer-group;
            }

            tr{
                page-break-inside:avoid;
            }

            /* =====================================
               CONTAINER LAPORAN
            ====================================== */
            .smartoffice-report-container{
                width:calc(100% - 20px);
                margin:0 auto;
            }

            /* =====================================
               KOP SURAT
            ====================================== */
            .smartoffice-report-kop{
                display:flex;
                align-items:center;
                gap:12px;
            }

            .smartoffice-report-kop-logo img{
                width:72px;
            }

            .smartoffice-report-kop-content{
                flex:1;
                text-align:center;
            }

            .smartoffice-report-kop-title-1{
                font-size:14px;
            }

            .smartoffice-report-kop-title-2{
                font-size:18px;
                font-weight:bold;
            }

            .smartoffice-report-kop-title-3{
                font-size:18px;
                font-weight:bold;
            }

            .smartoffice-report-kop-address{
                margin-top:2px;
                font-size:9px;
            }

            .smartoffice-report-line-1{
                height:2px;
                background:#000;
                margin-top:6px;
            }

            .smartoffice-report-line-2{
                height:1px;
                background:#000;
                margin-bottom:12px;
            }

            .smartoffice-report-title{
                margin:8px auto 12px;
                text-align:center;
                font-size:18px;
                font-weight:bold;
            }

            /* =====================================
               INFO LAPORAN
            ====================================== */
            .smartoffice-report-info{
                margin:8px 0 12px;
            }

            .smartoffice-report-info-table{
                width:auto;
                border-collapse:collapse;
            }

            .smartoffice-report-info-table td{
                padding:2px 6px;
                font-size:12px;
            }

            /* =====================================
               TABEL
            ====================================== */
            .smartoffice-report-table{
                width:100%;
                border-collapse:collapse;
            }

            .smartoffice-report-table th{
                background:#0f766e;
                color:#ffffff;
                border:1px solid #dddddd;
                padding:5px;
                text-align:center;
                font-size:11px;
            }

            .smartoffice-report-table td{
                border:1px solid #dddddd;
                padding:4px 6px;
                font-size:11px;
                white-space:nowrap;
            }

            .smartoffice-report-table th:first-child,
            .smartoffice-report-table td:first-child{
                width:55px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(2),
            .smartoffice-report-table td:nth-child(2){
                width:300px;
            }

            .smartoffice-report-table td:nth-child(2){
                text-align:left;
            }

            .smartoffice-report-table th:nth-child(3),
            .smartoffice-report-table td:nth-child(3){
                width:170px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(4),
            .smartoffice-report-table td:nth-child(4){
                width:230px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(5),
            .smartoffice-report-table td:nth-child(5){
                width:120px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(6),
            .smartoffice-report-table td:nth-child(6){
                width:140px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(7),
            .smartoffice-report-table td:nth-child(7),
            .smartoffice-report-table th:nth-child(8),
            .smartoffice-report-table td:nth-child(8){
                width:120px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(9),
            .smartoffice-report-table td:nth-child(9){
                width:90px;
                text-align:center;
            }

            .smartoffice-report-table th:nth-child(10),
            .smartoffice-report-table td:nth-child(10){
                width:130px;
                text-align:center;
            }

            /* =====================================
               FOOTER
            ===================================== */
            .smartoffice-report-footer{
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                margin-top:18px;
            }

            .smartoffice-report-footer-left{
                width:110px;
                flex-shrink:0;
            }

            .smartoffice-report-qr{
                width:70px;
                height:70px;
            }

            .smartoffice-report-qr img{
                width:100%;
                height:100%;
                object-fit:contain;
            }

            .smartoffice-report-qr-text{
                margin-top:8px;
                font-size:11px;
            }

            .smartoffice-report-footer-right{
                width:260px;
                margin-right:40px;
                text-align:center;
                font-size:12px;
                flex-shrink:0;
            }

            .smartoffice-report-kapus{
                font-weight:bold;
                text-decoration:underline;
            }

            .smartoffice-report-sign-space{
                height:55px;
            }

            /* =====================================
            KETERANGAN
            ===================================== */
            .smartoffice-report-keterangan{
                margin-top:18px;
                font-size:10px;
                color:#555;
            }

            /* =====================================
            BUTTON
            ===================================== */
            button{
                display:block;
                margin:24px auto 0;
                padding:12px 30px;
                border:none;
                border-radius:8px;
                background:#0f766e;
                color:#fff;
                font-size:14px;
                font-weight:bold;
                cursor:pointer;
            }

            @media print{
                button{
                    display:none !important;
                }
            }


            /* ======================================================
                TABLE BUKU TAMU
            ====================================================== */
            .smartoffice-bukutamu-report-table{
                width:100%;
                border-collapse:collapse;
                table-layout:fixed;
            }

            .smartoffice-bukutamu-report-table th,
            .smartoffice-bukutamu-report-table td{
                border:1px solid #dbe2ea;
                padding:6px;
                font-size:11px;
                vertical-align:middle;
                text-align:center;
            }

            /* =========================
                WRAP TEXT
            ========================= */
            .smartoffice-bukutamu-wrap{
                white-space:normal;
                word-break:break-word;
                overflow-wrap:anywhere;
                text-align:left;
            }

            /* =========================
                FOTO
            ========================= */
            .smartoffice-report-photo{
                width:60px;
                height:60px;
                object-fit:cover;
                border:1px solid #dbe2ea;
                border-radius:6px;
            }

            /* =========================
                TTD
            ========================= */
            .smartoffice-report-sign-cell{
                text-align:center;
                vertical-align:middle;
            }

            .smartoffice-report-sign{
                width:60px;
                height:60px;
                object-fit:contain;
                object-position:center;
                border:1px solid #dbe2ea;
                border-radius:6px;
                background:#fff;
                display:block;
                margin:auto;
            }

            /* =========================
               LEBAR KOLOM
            ========================= */
            .smartoffice-bukutamu-report-table th:nth-child(1),
            .smartoffice-bukutamu-report-table td:nth-child(1){
                width:35px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(2),
            .smartoffice-bukutamu-report-table td:nth-child(2){
                width:95px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(3),
            .smartoffice-bukutamu-report-table td:nth-child(3){
                width:140px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(4),
            .smartoffice-bukutamu-report-table td:nth-child(4){
                width:160px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(5),
            .smartoffice-bukutamu-report-table td:nth-child(5){
                width:80px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(6),
            .smartoffice-bukutamu-report-table td:nth-child(6){
                width:170px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(7),
            .smartoffice-bukutamu-report-table td:nth-child(7){
                width:170px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(8),
            .smartoffice-bukutamu-report-table td:nth-child(8){
                width:70px;
            }

            .smartoffice-bukutamu-report-table th:nth-child(9),
            .smartoffice-bukutamu-report-table td:nth-child(9){
                width:70px;
            }

            </style>
        </head>
        <body>

        <!-- =====================================
            KOP SURAT
        ===================================== -->

        <div class="smartoffice-report-container">

            <div class="smartoffice-report-kop">

                <div class="smartoffice-report-kop-logo">
                    <img src="${SMARTOFFICE_LOGO_KABUPATEN}">
                </div>

                <div class="smartoffice-report-kop-content">

                    <div class="smartoffice-report-kop-title-1">
                        ${SMARTOFFICE_NAMA_PEMERINTAH}
                    </div>

                    <div class="smartoffice-report-kop-title-2">
                        ${SMARTOFFICE_NAMA_DINAS}
                    </div>

                    <div class="smartoffice-report-kop-title-3">
                        ${SMARTOFFICE_NAMA_INSTANSI}
                    </div>

                    <div class="smartoffice-report-kop-address">
                        ${SMARTOFFICE_ALAMAT}
                    </div>

                    <div class="smartoffice-report-kop-address">
                        Email : ${SMARTOFFICE_EMAIL}
                        &nbsp;&nbsp;
                        Website : ${SMARTOFFICE_WEBSITE}
                    </div>

                </div>

            </div>

            <div class="smartoffice-report-line-1"></div>
            <div class="smartoffice-report-line-2"></div>

        </div>

        <!-- =====================================
            JUDUL
        ===================================== -->
        <div class="smartoffice-report-container">

            <div class="smartoffice-report-title">
                ${judul}
            </div>

        </div>

        <!-- =====================================
            INFORMASI LAPORAN
        ===================================== -->
        <div class="smartoffice-report-container">

            <div class="smartoffice-report-info">

                <table class="smartoffice-report-info-table">

                    <tr>
                        <td>Periode</td>
                        <td>:</td>
                        <td>${periode}</td>
                    </tr>

                    <tr>
                        <td>Tanggal Cetak</td>
                        <td>:</td>
                        <td>${new Date().toLocaleString('id-ID')}</td>
                    </tr>

                    <tr>
                        <td>Total Data</td>
                        <td>:</td>
                        <td>${totalData}</td>
                    </tr>

                </table>

            </div>

        </div>

        <!-- =====================================
            ISI LAPORAN
        ====================================== -->
        ${bodyHtml}

        <!-- =====================================
            FOOTER
        ===================================== -->
        <div class="smartoffice-report-container">

            <div class="smartoffice-report-footer">

                <!--
                ======================================================
                QR CODE

                Sementara dinonaktifkan.

                Akan digunakan pada fitur:
                - Simpan Laporan
                - Arsip Laporan
                - Verifikasi Dokumen

                ======================================================
                <div class="smartoffice-report-footer-left">

                    <div class="smartoffice-report-qr">

                        ${
                            qrUrl
                            ?
                            `
                            <img src="${qrUrl}">
                            `
                            :
                            ''
                        }

                    </div>

                    <div class="smartoffice-report-qr-text">
                        Scan untuk Verifikasi Dokumen
                    </div>

                </div>
                -->

                <!-- =========================
                    SPACER TENGAH
                ========================== -->
                <div class="smartoffice-report-footer-center"></div>


                <!-- =========================
                    TANDA TANGAN
                ========================== -->
                <div class="smartoffice-report-footer-right">

                    <div>
                        ${smartofficeFormatTanggalSuratFrontend(new Date())}
                    </div>

                    <br>

                    <div>
                        Kepala Puskesmas Nambo
                    </div>

                    <div class="smartoffice-report-sign-space"></div>

                    <div class="smartoffice-report-kapus">
                        ${kapus.nama || ''}
                    </div>

                    <div>
                        NIP. ${kapus.nip || ''}
                    </div>

                </div>

            </div>

        </div>

        <!-- =====================================
            BUTTON PRINT
        ====================================== -->
        <button
            onclick="
            window.print()
            "
        >

            Cetak PDF

        </button>

        <!-- =====================================
            AUTO PRINT
        ====================================== -->
        <${'script'}>
            window.addEventListener(
            'load',

            function(){
                setTimeout(function(){
                window.focus();
                window.print();
                },500);
              }
            );
        </${'script'}>
        </body>      
    </html>

    `;

        return html;
    // ISI FUNGSI LAMA ANDA DI SINI
}


/* ======================================================
   GENERATE LAPORAN BUKU TAMU
====================================================== */
export function smartofficeGenerateLaporanBukuTamu(
    data,
    kapus,
    qrUrl
){

    const bodyHtml = `

        <div class="smartoffice-report-container">

            <table class="smartoffice-bukutamu-report-table">

                <thead>

                    <tr>
                        <th>No</th>
                        <th>Tanggal</th>
                        <th>Nama</th>
                        <th>Instansi / Alamat</th>
                        <th>No HP</th>
                        <th>Keperluan</th>
                        <th>Pesan / Kesan</th>
                        <th>Foto</th>
                        <th>TTD</th>
                    </tr>

                </thead>

                <tbody>

                    ${
                        data
                            .map(function(item,index){

                                return `

                                    <tr>

                                        <td>
                                            ${index + 1}
                                        </td>

                                        <td>
                                            ${smartofficeFormatTanggalJamFrontend(
                                                item.timestamp
                                            )}
                                        </td>

                                        <td>
                                            ${item.nama || '-'}
                                        </td>

                                        <td class="smartoffice-bukutamu-wrap">
                                            ${item.alamatInstansi || '-'}
                                        </td>

                                        <td>
                                            ${item.noHp || '-'}
                                        </td>

                                        <td class="smartoffice-bukutamu-wrap">
                                            ${item.keperluan || '-'}
                                        </td>

                                        <td class="smartoffice-bukutamu-wrap">
                                            ${item.pesanKesan || '-'}
                                        </td>

                                        <td>
                                            <img
                                                src="${item.foto}"
                                                class="smartoffice-report-photo"
                                            >
                                        </td>

                                        <td class="smartoffice-report-sign-cell">
                                            <img
                                                src="${item.ttd}"
                                                class="smartoffice-report-sign"
                                            >
                                        </td>

                                    </tr>

                                `;

                            })
                            .join('')
                    }

                </tbody>

            </table>


            <div class="smartoffice-report-keterangan">

                <strong>
                    Keterangan :
                </strong>

                Laporan ini dihasilkan secara otomatis oleh
                Smart Office Puskesmas Nambo.

            </div>

        </div>

    `;


    /* =========================
       PERIODE
    ========================= */

    const bulanSelect =
        document.getElementById(
            'smartofficeBukuTamuFilterBulan'
        );


    const tahun =
        document.getElementById(
            'smartofficeBukuTamuFilterTahun'
        ).value ||
        'Semua Tahun';


    const bulanText =
        bulanSelect.options[
            bulanSelect.selectedIndex
        ].text;


    const periode =
        bulanText +
        ' ' +
        tahun;


    /* =========================
       GENERATE TEMPLATE
    ========================= */

    return smartofficeGenerateTemplateLaporan(

        'LAPORAN BUKU TAMU DIGITAL',

        periode,

        bodyHtml,

        data.length,

        kapus,

        qrUrl

    );

}


/* ======================================================
   PRINT LAPORAN
====================================================== */
export function smartofficePrintLaporan(){
    window.print();
}




/* ======================================================
   GLOBAL
   Karena HTML menggunakan onclick=""
====================================================== */
window.smartofficeExportRiwayatCutiPdf =
    smartofficeExportRiwayatCutiPdf;

window.smartofficePrintLaporan =
    smartofficePrintLaporan;