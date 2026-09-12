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

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeShowLoading
} from "../../components/loading/loading.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";


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
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        null,
        "buku-tamu"
    );

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
                smartoffice-loading
            ">
                <div class="
                    smartoffice-loading-spinner
                "></div>

                <div class="
                    smartoffice-loading-text
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

                    item.fotoFallback =
                        smartofficeConvertDriveUrlDirect(
                            item.fotoUrl
                        );

                    item.ttdFallback =
                        smartofficeConvertDriveUrlDirect(
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
        /* =========================
           REQUEST DIBATALKAN
           KARENA PINDAH HALAMAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

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

    /* =========================
    KEMBALI KE FILTER DEFAULT
    BULAN + TAHUN SEKARANG
    ========================= */
    smartofficeSetDefaultFilterBukuTamu();
    smartofficeFilterBukuTamu();
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
                                smartoffice-bukutamu-card
                            "
                            onclick="
                                smartofficeOpenBukuTamuDetail(
                                    ${index}
                                )
                            "
                        >
                            <!-- =========================
                                DATE PANEL
                            ========================= -->
                            <div
                                class="
                                    smartoffice-bukutamu-date
                                "
                            >
                                <small>
                                    ${bulan}
                                </small>

                                <strong>
                                    ${tanggal}
                                </strong>
                            </div>

                            <!-- =========================
                                CARD CONTENT
                            ========================= -->
                            <div
                                class="
                                    smartoffice-bukutamu-card-content
                                "
                            >
                                <div
                                    class="
                                        smartoffice-bukutamu-card-heading
                                    "
                                >
                                    <div>
                                        <h3>
                                            ${item.nama || "-"}
                                        </h3>

                                        <small>
                                            ${item.alamatInstansi || "-"}
                                        </small>
                                    </div>
                                </div>

                                <div
                                    class="
                                        smartoffice-bukutamu-divider
                                    "
                                ></div>

                                <!-- =========================
                                    DATE + PHONE
                                ========================= -->
                                <div
                                    class="
                                        smartoffice-bukutamu-info-row
                                    "
                                >
                                    <!-- TANGGAL -->
                                    <div
                                        class="
                                            smartoffice-bukutamu-info-box
                                            smartoffice-bukutamu-info-date
                                        "
                                    >
                                        <div
                                            class="
                                                smartoffice-bukutamu-info-icon
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
                                                    height="18"
                                                    rx="2"
                                                />

                                                <line
                                                    x1="16"
                                                    y1="2"
                                                    x2="16"
                                                    y2="6"
                                                />

                                                <line
                                                    x1="8"
                                                    y1="2"
                                                    x2="8"
                                                    y2="6"
                                                />

                                                <line
                                                    x1="3"
                                                    y1="10"
                                                    x2="21"
                                                    y2="10"
                                                />
                                            </svg>
                                        </div>

                                        <div
                                            class="
                                                smartoffice-bukutamu-info-text
                                            "
                                        >
                                            <span>
                                                Tanggal
                                            </span>

                                            <strong>
                                                ${tanggalLengkap}
                                            </strong>
                                        </div>
                                    </div>

                                    <!-- NO HP -->
                                    <div
                                        class="
                                            smartoffice-bukutamu-info-box
                                            smartoffice-bukutamu-info-phone
                                        "
                                    >
                                        <div
                                            class="
                                                smartoffice-bukutamu-info-icon
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
                                                        M22 16.92
                                                        v3
                                                        a2 2 0 0 1
                                                        -2.18 2
                                                        19.79 19.79 0 0 1
                                                        -8.63-3.07
                                                        19.5 19.5 0 0 1
                                                        -6-6
                                                        A19.79 19.79 0 0 1
                                                        2.12 4.18
                                                        2 2 0 0 1
                                                        4.11 2h3
                                                        a2 2 0 0 1
                                                        2 1.72
                                                        12.84 12.84 0 0 0
                                                        .7 2.81
                                                        2 2 0 0 1
                                                        -.45 2.11
                                                        L8.09 9.91
                                                        a16 16 0 0 0
                                                        6 6
                                                        l1.27-1.27
                                                        a2 2 0 0 1
                                                        2.11-.45
                                                        12.84 12.84 0 0 0
                                                        2.81.7
                                                        A2 2 0 0 1
                                                        22 16.92z
                                                    "
                                                />
                                            </svg>
                                        </div>

                                        <div
                                            class="
                                                smartoffice-bukutamu-info-text
                                            "
                                        >
                                            <span>
                                                No HP
                                            </span>

                                            <strong>
                                                ${item.noHp || "-"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <!-- =========================
                                    KEPERLUAN
                                ========================= -->
                                <div
                                    class="
                                        smartoffice-bukutamu-info-box
                                        smartoffice-bukutamu-info-purpose
                                    "
                                >
                                    <div
                                        class="
                                            smartoffice-bukutamu-info-icon
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
                                                    M14 2
                                                    H6
                                                    a2 2 0 0 0-2 2
                                                    v16
                                                    a2 2 0 0 0 2 2
                                                    h12
                                                    a2 2 0 0 0 2-2
                                                    V8
                                                    z
                                                "
                                            />

                                            <path
                                                d="
                                                    M14 2
                                                    v6
                                                    h6
                                                "
                                            />

                                            <line
                                                x1="8"
                                                y1="13"
                                                x2="16"
                                                y2="13"
                                            />

                                            <line
                                                x1="8"
                                                y1="17"
                                                x2="14"
                                                y2="17"
                                            />
                                        </svg>
                                    </div>

                                    <div
                                        class="
                                            smartoffice-bukutamu-info-text
                                        "
                                    >
                                        <span>
                                            Keperluan
                                        </span>

                                        <strong>
                                            ${item.keperluan || "-"}
                                        </strong>
                                    </div>
                                </div>
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
                        class="
                            smartoffice-bukutamu-signature
                        "
                        src="${data.ttd || ""}"
                        onerror="
                            this.onerror=null;
                            this.src='${data.ttdFallback || ""}';
                        "
                        onclick="
                            window.open(
                                '${data.ttdFallback || data.ttd || ""}',
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
   DRIVE IMAGE FALLBACK
   Digunakan jika thumbnail gagal dimuat
====================================================== */
function smartofficeConvertDriveUrlDirect(url){
    if(!url){
        return "";
    }

    const match =
        url.match(/\/d\/(.*?)\//);

    if(!match){
        return url;
    }

    const fileId =
        match[1];

    return (
        "https://lh3.googleusercontent.com/d/" +
        fileId
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

    /* RESET DATA */
    smartofficeBukuTamuData = [];
    smartofficeBukuTamuFilteredData = [];

    /* CLOSE DETAIL MODAL */
    const modal =
        document.getElementById(
            "smartofficeBukuTamuDetailModal"
        );

    if(modal){
        modal.style.display = "none";
    }
}


/* ======================================================
   GLOBAL WINDOW BINDING
   Untuk fungsi yang dipanggil dari HTML onclick
====================================================== */

window.smartofficeRefreshBukuTamu =
    smartofficeRefreshBukuTamu;

window.smartofficeFilterBukuTamu =
    smartofficeFilterBukuTamu;

window.smartofficeResetBukuTamu =
    smartofficeResetBukuTamu;

window.smartofficePrintBukuTamu =
    smartofficePrintBukuTamu;

window.smartofficeOpenBukuTamuDetail =
    smartofficeOpenBukuTamuDetail;

window.smartofficeCloseBukuTamuDetail =
    smartofficeCloseBukuTamuDetail;