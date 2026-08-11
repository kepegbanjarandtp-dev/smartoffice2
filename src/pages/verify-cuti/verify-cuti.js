import {
    smartofficeApi
} from "../../core/api.js";

import "./verify-cuti.css";

import {
    smartofficeFormatTanggalIndoJamFrontend
} from "../../utils/date.js";

console.log(
    "VERIFY-CUTI.JS LOADED"
);

/* ======================================================
   LOAD VERIFY CUTI
====================================================== */
export async function smartofficeLoadPage(){

    console.log(
        "VERIFY LOAD PAGE START"
    );

    /* =========================
       GET URL
    ========================= */
    const hash =
        window.location.hash;

    const queryString =
        hash.includes("?")
            ? hash.split("?")[1]
            : "";

    const params =
        new URLSearchParams(
            queryString
        );

    const idCuti =
        params.get(
            "idCuti"
        );

    /* =========================
       VALIDASI ID
    ========================= */

    if(
        !idCuti
    ){

        smartofficeRenderVerifyCutiError(
            "ID dokumen tidak ditemukan."
        );

        return;

    }


    /* =========================
       LOAD DATA
    ========================= */

    try{

        console.log(
            "VERIFY: RENDER LOADING"
        );

        smartofficeRenderVerifyCutiLoading();

        console.log(
            "VERIFY: LOADING SELESAI"
        );

        console.log(
            "VERIFY: CALL API",
            idCuti
        );

        const response =
            await smartofficeApi(
                "smartofficeVerifyCuti",
                {
                    idCuti:
                        idCuti
                }
            );

        console.log(
            "VERIFY: API RESPONSE",
            response
        );


        if(
            !response.success
        ){

            smartofficeRenderVerifyCutiError(
                response.message ||
                "Gagal memverifikasi dokumen."
            );

            return;

        }


        if(
            !response.data ||
            !response.data.valid
        ){

            smartofficeRenderVerifyCutiError(
                response.data?.message ||
                "Dokumen tidak ditemukan."
            );

            return;

        }


        /* =========================
           DATA VALID
        ========================= */

        const data =
            response.data.data;


        smartofficeRenderVerifyCuti(
            data
        );

    }
    catch(error){

        console.error(
            "VERIFY CUTI ERROR:",
            error
        );


        smartofficeRenderVerifyCutiError(
            "Tidak dapat memverifikasi dokumen."
        );

    }

}


/* ======================================================
   RENDER VERIFY CUTI
====================================================== */
function smartofficeRenderVerifyCuti(
    data
){

    console.log(
        "VERIFY: RENDER START",
        data
    );

    const container =
        document.getElementById(
            "smartofficeVerifyCutiPage"
        );

    console.log(
        "VERIFY: CONTAINER",
        container
    );

    if(
        !container
    ){

        console.error(
            "VERIFY: CONTAINER TIDAK DITEMUKAN"
        );

        return;
    }


    container.innerHTML = `

        <div class="smartoffice-verify-cuti-page">

            <div class="smartoffice-verify-cuti-card">

                <div
                    class="
                        smartoffice-verify-cuti-top-glow
                    "
                ></div>


                <div
                    class="
                        smartoffice-verify-cuti-check-wrapper
                    "
                >

                    <svg
                        viewBox="0 0 24 24"
                    >

                        <path
                            d="
                                M5 13
                                l4 4
                                L19 7
                            "
                        ></path>

                    </svg>

                </div>


                <h1>
                    Dokumen Valid
                </h1>


                <div
                    class="
                        smartoffice-verify-cuti-subtitle
                    "
                >

                    Dokumen Smart Office
                    berhasil diverifikasi
                    dan tercatat resmi
                    dalam sistem.

                </div>


                <!-- =========================
                     ID CUTI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        ID CUTI
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.idCuti || "-"}
                    </div>

                </div>


                <!-- =========================
                     NAMA
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        NAMA PEGAWAI
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.nama || "-"}
                    </div>

                </div>


                <!-- =========================
                     NIP
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        NIP / NRP
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.nip || "-"}
                    </div>

                </div>


                <!-- =========================
                     JENIS CUTI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        JENIS CUTI
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.jenisCuti || "-"}
                    </div>

                </div>


                <!-- =========================
                     TANGGAL CUTI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        TANGGAL CUTI
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.tanggalAwal || "-"}
                        -
                        ${data.tanggalAkhir || "-"}
                    </div>

                </div>


                <!-- =========================
                     JUMLAH CUTI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        JUMLAH CUTI
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.jumlahCuti || 0} Hari
                    </div>

                </div>


                <!-- =========================
                     STATUS APPROVAL
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        STATUS APPROVAL
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-status-badge
                        "
                    >

                        <div
                            class="
                                smartoffice-verify-cuti-status-dot
                            "
                        ></div>

                        ${data.status || "-"}

                    </div>

                </div>


                <!-- =========================
                     DIVERIFIKASI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        DIVERIFIKASI OLEH
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.diverifikasiOleh || "-"}
                    </div>

                </div>


                <!-- =========================
                     DISETUJUI
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-info-box
                    "
                >

                    <div
                        class="
                            smartoffice-verify-cuti-label
                        "
                    >
                        DISETUJUI OLEH
                    </div>

                    <div
                        class="
                            smartoffice-verify-cuti-value
                        "
                    >
                        ${data.disetujuiOleh || "-"}
                    </div>

                </div>


                <!-- =========================
                     FOOTER
                ========================= -->

                <div
                    class="
                        smartoffice-verify-cuti-footer
                    "
                >

                    Smart Office System<br>

                    Dokumen dipindai pada:
                    ${smartofficeFormatTanggalIndoJamFrontend(
                        new Date()
                    )}

                </div>

            </div>

        </div>

    `;

    console.log(
        "VERIFY: RENDER SELESAI",
        container.innerHTML.length
    );

}


/* ======================================================
   LOADING VERIFY CUTI
====================================================== */
function smartofficeRenderVerifyCutiLoading(){

    const container =
        document.getElementById(
            "smartofficeVerifyCutiPage"
        );


    if(
        !container
    ){
        return;
    }


    container.innerHTML = `

        <div
            class="
                smartoffice-verify-cuti-page
            "
        >

            <div
                class="
                    smartoffice-verify-cuti-card
                    smartoffice-verify-cuti-loading
                "
            >

                Memverifikasi dokumen...

            </div>

        </div>

    `;

}


/* ======================================================
   ERROR VERIFY CUTI
====================================================== */
function smartofficeRenderVerifyCutiError(
    message
){

    const container =
        document.getElementById(
            "smartofficeVerifyCutiPage"
        );


    if(
        !container
    ){
        return;
    }


    container.innerHTML = `

        <div
            class="
                smartoffice-verify-cuti-error-page
            "
        >

            <div
                class="
                    smartoffice-verify-cuti-error-card
                "
            >

                <h2>
                    Dokumen Tidak Ditemukan
                </h2>

                <p>
                    ${message || "QR atau ID dokumen tidak valid."}
                </p>

            </div>

        </div>

    `;

}