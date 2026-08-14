/* ======================================================
   SMARTOFFICE API
====================================================== */
import { CONFIG }
from "./config.js";


/* ======================================================
   ACTIVE API REQUESTS
   Menyimpan semua request yang sedang berjalan
====================================================== */
const smartofficeActiveRequests =
    new Set();


/* ======================================================
   RETRY CONFIG
   Apps Script kadang balikin 404 sesaat karena race
   condition di redirect script.googleusercontent.com
====================================================== */
const SMARTOFFICE_MAX_RETRIES = 1;
const SMARTOFFICE_RETRY_BASE_DELAY_MS = 400;

function smartofficeDelay(ms){
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}


/* ======================================================
   ABORT SEMUA REQUEST
====================================================== */
export function smartofficeAbortAllRequests(){

    console.log(
        "SMARTOFFICE ABORT ALL REQUESTS:",
        smartofficeActiveRequests.size
    );

    for(
        const controller
        of smartofficeActiveRequests
    ){
        try{
            controller.abort();
        }
        catch(error){
            console.warn(
                "SMARTOFFICE ABORT ERROR:",
                error
            );
        }
    }

    smartofficeActiveRequests.clear();
}


/* ======================================================
   SMARTOFFICE API
====================================================== */
export async function smartofficeApi(
    action,
    data = {}
){

    /* ==================================================
       REQUEST CONTROLLER
    ================================================== */
    const controller =
        new AbortController();

    smartofficeActiveRequests.add(
        controller
    );

    try{

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
                ([key, value]) => {

                    formData.append(
                        key,
                        value ?? ""
                    );
                }
            );

        /* =========================
           REQUEST ID
        ========================= */
        const requestId =
            `${action}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;

        /* =========================
           REQUEST DENGAN RETRY
           Retry khusus untuk 404 (kemungkinan race
           condition di redirect Apps Script) dan
           kegagalan jaringan sesaat lainnya.
        ========================= */
        let lastError = null;

        for(
            let attempt = 1;
            attempt <= SMARTOFFICE_MAX_RETRIES;
            attempt++
        ){
            try{
                console.time(
                    `SMARTOFFICE FETCH ${requestId} (attempt ${attempt})`
                );

                const response =
                    await fetch(
                        CONFIG.API_URL,
                        {
                            method: "POST",
                            body: formData,
                            redirect: "follow",
                            credentials: "omit",
                            cache: "no-store",
                            signal: controller.signal
                        }
                    );

                console.timeEnd(
                    `SMARTOFFICE FETCH ${requestId} (attempt ${attempt})`
                );

                /* =========================
                   404 -> KEMUNGKINAN RACE
                   CONDITION, WORTH DI-RETRY
                ========================= */
                if(
                    response.status === 404 &&
                    attempt < SMARTOFFICE_MAX_RETRIES
                ){
                    console.warn(
                        `SMARTOFFICE 404 (attempt ${attempt}), retrying...`
                    );

                    await smartofficeDelay(
                        SMARTOFFICE_RETRY_BASE_DELAY_MS * attempt
                    );

                    continue;
                }

                if(!response.ok){
                    throw new Error(
                        `Server Error: ${response.status}`
                    );
                }

                /* =========================
                   RESPONSE CONTENT TYPE
                ========================= */
                const contentType =
                    response.headers.get(
                        "content-type"
                    );

                if(
                    !contentType ||
                    !contentType.includes(
                        "application/json"
                    )
                ){
                    throw new Error(
                        "Respons server bukan JSON."
                    );
                }

                /* =========================
                   PARSE JSON
                ========================= */
                const result =
                    await response.json();

                return result;
            }
            catch(error){

                /* ==========================================
                   REQUEST DIBATALKAN -> JANGAN DI-RETRY,
                   LANGSUNG LEMPAR KE HANDLER LUAR
                ========================================== */
                if(
                    error?.name === "AbortError"
                ){
                    throw error;
                }

                lastError = error;

                if(attempt < SMARTOFFICE_MAX_RETRIES){
                    console.warn(
                        `SMARTOFFICE FETCH FAILED (attempt ${attempt}):`,
                        error.message
                    );

                    await smartofficeDelay(
                        SMARTOFFICE_RETRY_BASE_DELAY_MS * attempt
                    );

                    continue;
                }
            }
        }

        /* ==========================================
           SEMUA PERCOBAAN GAGAL
        ========================================== */
        throw (
            lastError ||
            new Error(
                "Gagal terhubung ke server setelah beberapa percobaan."
            )
        );
    }
    catch(error){

        /* ==========================================
           REQUEST DIBATALKAN
        ========================================== */
        if(
            error?.name === "AbortError"
        ){

            console.log(
                "SMARTOFFICE REQUEST ABORTED:",
                action
            );

            return {
                success: false,
                aborted: true,
                message:
                    "Request dibatalkan."
            };
        }

        /* ==========================================
           ERROR NORMAL
        ========================================== */
        console.error(
            "SMARTOFFICE API ERROR",
            error
        );

        return {
            success: false,
            aborted: false,
            message:
                error.message ||
                "Tidak dapat terhubung ke server."
        };

    }
    finally{

        /* ==========================================
           HAPUS REQUEST YANG SUDAH SELESAI
        ========================================== */
        smartofficeActiveRequests.delete(
            controller
        );
    }
}