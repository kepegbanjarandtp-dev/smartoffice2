/* ======================================================
   SMARTOFFICE API
====================================================== */
import {
    CONFIG
} from "./config.js";


/* ======================================================
   ACTION YANG AMAN UNTUK RETRY
   READ-ONLY + LOGIN
====================================================== */
const SMARTOFFICE_RETRYABLE_ACTIONS = [

    "login",

    "smartofficeGetPegawaiByNip",
    "smartofficeSearchPegawai",

    "smartofficeGetCutiStats",
    "smartofficeGetRiwayatCuti",
    "smartofficeGetJumlahCuti",

    "smartofficeGetApprovalCuti",
    "smartofficeGetTotalPendingApproval",

    "smartofficeGetRekapCutiPegawai",
    "smartofficeGetAllRiwayatCuti",

    "smartofficeGetKapus",

    "smartofficeGetBukuTamu",

    "smartofficeGetMasterDokumen",
    "smartofficeGetDokumenPegawai"

];


/* ======================================================
   KONFIGURASI REQUEST
====================================================== */

/* =========================
   MAX RETRY
========================= */
const SMARTOFFICE_API_MAX_RETRY =
    2;


/* =========================
   TIMEOUT DEFAULT
   API BIASA = 30 DETIK
========================= */
const SMARTOFFICE_API_TIMEOUT =
    30000;


/* ======================================================
   TIMEOUT KHUSUS PER ACTION
====================================================== */
const SMARTOFFICE_API_TIMEOUTS = {

    /* =========================
       UPLOAD / UPDATE DOKUMEN
       60 DETIK
    ========================= */
    smartofficeUploadDokumen:
        60000,


    /* =========================
       DEFAULT
    ========================= */
    default:
        SMARTOFFICE_API_TIMEOUT

};


/* ======================================================
   DELAY RETRY
====================================================== */
function smartofficeApiDelay(
    attempt
){

    const delay =
        attempt === 1
            ? 1000
            : 2000;


    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                delay
            )
    );

}


/* ======================================================
   SMARTOFFICE API
====================================================== */
export async function smartofficeApi(
    action,
    data = {}
){

    /* ==================================================
       WAKTU TOTAL REQUEST
    ================================================== */
    const apiStartTime =
        performance.now();


    console.log(
        "=================================================="
    );

    console.log(
        "SMARTOFFICE API REQUEST:",
        action,
        data
    );


    /* =========================
       CEK BOLEH RETRY
    ========================= */
    const canRetry =
        SMARTOFFICE_RETRYABLE_ACTIONS
            .includes(
                action
            );


    const maxAttempt =
        canRetry
            ? SMARTOFFICE_API_MAX_RETRY
            : 0;


    /* ==================================================
       REQUEST LOOP
    ================================================== */
    for(
        let attempt = 0;
        attempt <= maxAttempt;
        attempt++
    ){

        try{

            /* =========================
               LOG RETRY
            ========================= */
            if(
                attempt > 0
            ){

                console.warn(
                    `SMARTOFFICE API RETRY ${attempt}/${maxAttempt}:`,
                    action
                );


                await smartofficeApiDelay(
                    attempt
                );

            }


            /* =========================
               WAKTU ATTEMPT
            ========================= */
            const attemptStartTime =
                performance.now();


            /* =========================
               BUILD FORM DATA
            ========================= */
            const formData =
                new URLSearchParams();


            formData.append(
                "action",
                action
            );


            Object.entries(data)
                .forEach(
                    ([key,value]) => {

                        formData.append(
                            key,
                            value ?? ""
                        );

                    }
                );


            /* =========================
               ABORT CONTROLLER
            ========================= */
            const controller =
                new AbortController();


            /* =========================
               TIMEOUT BERDASARKAN ACTION
            ========================= */
            const requestTimeout =
                SMARTOFFICE_API_TIMEOUTS[action] ||
                SMARTOFFICE_API_TIMEOUT;


            console.log(
                "SMARTOFFICE API TIMEOUT:",
                action,
                `${requestTimeout / 1000}s`
            );


            /* =========================
               TIMEOUT
            ========================= */
            const timeout =
                setTimeout(
                    () => {

                        console.warn(
                            "SMARTOFFICE API TIMEOUT:",
                            action,
                            `${requestTimeout / 1000}s`
                        );


                        controller.abort();

                    },
                    requestTimeout
                );


            try{

                /* =========================
                   FETCH START
                ========================= */
                console.log(
                    "SMARTOFFICE API FETCH START:",
                    action
                );


                /* =========================
                   REQUEST
                ========================= */
                const response =
                    await fetch(
                        CONFIG.API_URL,
                        {
                            method:
                                "POST",

                            body:
                                formData,

                            signal:
                                controller.signal
                        }
                    );


                /* =========================
                   RESPONSE TIME
                ========================= */
                const responseTime =
                    performance.now() -
                    attemptStartTime;


                console.log(
                    "SMARTOFFICE API RESPONSE:",
                    action,
                    `${responseTime.toFixed(0)} ms`,
                    `HTTP ${response.status}`
                );


                /* =========================
                   HTTP ERROR
                ========================= */
                if(
                    !response.ok
                ){

                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }


                /* =========================
                   JSON START
                ========================= */
                const jsonStartTime =
                    performance.now();


                const result =
                    await response.json();


                /* =========================
                   JSON TIME
                ========================= */
                const jsonTime =
                    performance.now() -
                    jsonStartTime;


                /* =========================
                   TOTAL TIME
                ========================= */
                const totalTime =
                    performance.now() -
                    apiStartTime;


                console.log(
                    "SMARTOFFICE API JSON:",
                    action,
                    `${jsonTime.toFixed(0)} ms`
                );


                console.log(
                    "SMARTOFFICE API SUCCESS:",
                    action,
                    result
                );


                console.log(
                    "SMARTOFFICE API TOTAL:",
                    action,
                    `${totalTime.toFixed(0)} ms`
                );


                console.log(
                    "=================================================="
                );


                return result;

            }
            finally{

                /* =========================
                   SELALU HAPUS TIMEOUT
                ========================= */
                clearTimeout(
                    timeout
                );

            }


        }
        catch(error){

            /* =========================
               TOTAL WAKTU SAAT ERROR
            ========================= */
            const errorTime =
                performance.now() -
                apiStartTime;


            console.error(
                `SMARTOFFICE API ERROR [attempt ${attempt + 1}/${maxAttempt + 1}]:`,
                action,
                error
            );


            console.error(
                "SMARTOFFICE API ERROR TIME:",
                action,
                `${errorTime.toFixed(0)} ms`
            );


            /* =========================
               MASIH ADA RETRY
            ========================= */
            if(
                attempt < maxAttempt
            ){

                continue;

            }


            /* =========================
               SEMUA PERCOBAAN GAGAL
            ========================= */
            console.error(
                "=================================================="
            );


            return {

                success:
                    false,

                message:
                    error?.name ===
                    "AbortError"

                        ?

                    "Server terlalu lama merespons."

                        :

                    "Tidak dapat terhubung ke server."

            };

        }

    }

}