import {
    smartofficeStorageGet,
    smartofficeStorageRemove
} from "./storage.js";

import {
    smartofficeAbortAllRequests
} from "./api.js";

import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../components/loading/loading.js";


/* ======================================================
   SMARTOFFICE ROUTER
====================================================== */
let smartofficeCurrentPage =
    null;

let smartofficeCurrentDestroy =
    null;

const smartofficePageCache =
    new Map();

let smartofficeNavigationId = 0;
let smartofficePageHtmlController = null;


/* ======================================================
   PAGE MODULES
====================================================== */
const smartofficeModules = {

    login: () =>
        import("../pages/login/login.js"),

    dashboard: () =>
        import("../pages/dashboard/dashboard.js"),

    cuti: () =>
        import("../pages/cuti/cuti.js"),

    approval: () =>
        import("../pages/approval/approval.js"),

    "management-cuti": () =>
        import("../pages/management-cuti/management-cuti.js"),

    "verify-cuti": () =>
        import("../pages/verify-cuti/verify-cuti.js"),

    "buku-tamu": () =>
        import("../pages/buku-tamu/buku-tamu.js"),

    "dokumen-saya": () =>
        import("../pages/dokumen-saya/dokumen-saya.js"),

    "arsip-pegawai": () =>
        import("../pages/arsip-pegawai/arsip-pegawai.js"),

    "buku-surat": () =>
        import("../pages/buku-surat/buku-surat.js"),

    "pusat-dokumen": () =>
        import("../pages/pusat-dokumen/penomoran-sk.js"),

};


/* ======================================================
   INITIALIZE ROUTER
====================================================== */
export async function smartofficeInitializeRouter(){

    console.log(
        "SmartOffice Router Ready"
    );

    /* ==================================================
       VERIFY CUTI
    ================================================== */
    const hash =
        window.location.hash;

    if(
        hash.startsWith(
            "#verify-cuti"
        )
    ){

        const queryString =
            hash.includes("?")
                ? hash.split("?")[1]
                : "";


        const urlParams =
            new URLSearchParams(
                queryString
            );


        const idCuti =
            urlParams.get(
                "idCuti"
            );


        await smartofficeNavigate(
            "verify-cuti",
            {
                idCuti:
                    idCuti || ""
            }
        );

        return;
    }


    /* ==================================================
       RESET SESSION SETIAP REFRESH
    ================================================== */
    smartofficeStorageRemove(
        "smartoffice_session"
    );

    console.log(
        "SmartOffice Session dihapus karena refresh"
    );


    /* ==================================================
       DENGARKAN TOMBOL BACK/FORWARD BROWSER
    ================================================== */
    window.addEventListener(
        "popstate",
        smartofficeHandlePopState
    );


    /* ==================================================
       LANGSUNG KE LOGIN
    ================================================== */
    await smartofficeNavigate(
        "login"
    );
}


/* ======================================================
   HANDLE POPSTATE (TOMBOL BACK/FORWARD)
====================================================== */
async function smartofficeHandlePopState(
    event
){

    const state =
        event.state;

    if(
        state &&
        state.page
    ){

        await smartofficeNavigate(
            state.page,
            state.params || {},
            {
                pushState: false
            }
        );
    }
    else{

        /* =========================
           FALLBACK KALAU STATE
           KOSONG (MISAL LOAD AWAL)
        ========================= */
        const hash =
            window.location.hash
                .replace("#", "");

        const [pageName, queryString] =
            hash.split("?");

        const params =
            queryString
                ? Object.fromEntries(
                    new URLSearchParams(
                        queryString
                    )
                )
                : {};

        await smartofficeNavigate(
            pageName || "login",
            params,
            {
                pushState: false
            }
        );
    }
}


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeNavigate(
    pageName,
    params = {},
    options = {}
){

    if(!pageName){
        return;
    }

    const {
        pushState = true
    } = options;

    let globalLoadingHandled = false;

    /*
     * Setiap navigasi memiliki ID sendiri.
     *
     * Kalau user pindah halaman lagi sebelum proses
     * sebelumnya selesai, navigasi lama dianggap stale.
     */
    const navigationId =
        ++smartofficeNavigationId;


    console.log(
        "[Router] Navigasi mulai:",
        pageName,
        "ID:",
        navigationId
    );


    /*
     * Batalkan request HTML halaman sebelumnya.
     *
     * Request HTML ini tidak menggunakan api.js,
     * jadi harus dikelola router sendiri.
     */
    if(smartofficePageHtmlController){

        try{

            smartofficePageHtmlController.abort();

        }
        catch(error){

            console.warn(
                "[Router] Abort HTML request gagal:",
                error
            );

        }

        smartofficePageHtmlController =
            null;
    }


    /* ==================================================
       GLOBAL PAGE LOADING

       Login tidak memakai global loading saat
       pertama kali dibuka.
    ================================================== */
    const useGlobalLoading =
        pageName !== "login";


    if(useGlobalLoading){

        smartofficeShowGlobalLoading(
            "Memuat halaman..."
        );

    }


    try{

        /* ==================================================
           ABORT SEMUA REQUEST LAMA

           Request halaman sebelumnya tidak boleh
           menghalangi halaman baru.
        ================================================== */
        smartofficeAbortAllRequests();


        /* ==================================================
           DESTROY CURRENT PAGE
        ================================================== */
        await smartofficeDestroyCurrentPage();


        /*
         * Kalau selama proses destroy user sudah pindah
         * ke halaman lain, navigasi ini dibatalkan.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            console.log(
                "[Router] Navigasi stale setelah destroy:",
                pageName,
                navigationId
            );

            return;
        }


        /* ==================================================
           AMBIL CONTAINER APP
        ================================================== */
        const app =
            document.getElementById(
                "app"
            );


        if(!app){

            throw new Error(
                "Container #app tidak ditemukan."
            );

        }


        /* ==================================================
           LOAD HTML
        ================================================== */
        let html;


        try{

            html =
                await smartofficeGetPageHtml(
                    pageName,
                    navigationId
                );

        }
        catch(error){

            console.error(
                "SMARTOFFICE GAGAL MEMUAT HALAMAN:",
                pageName,
                error
            );


            /*
             * Jangan tampilkan error dari navigasi lama.
             */
            if(
                navigationId !==
                smartofficeNavigationId
            ){

                return;
            }


            app.innerHTML =
                smartofficeGetErrorHtml(
                    pageName
                );

            return;
        }


        /*
         * Jangan render HTML kalau navigasinya sudah
         * digantikan oleh navigasi baru.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            console.log(
                "[Router] HTML stale:",
                pageName,
                navigationId
            );

            return;
        }


        /* ==================================================
           RENDER HTML
        ================================================== */
        app.innerHTML =
            html;


        /* ==================================================
           LOAD MODULE
        ================================================== */
        const loader =
            smartofficeModules[
                pageName
            ];


        if(!loader){

            throw new Error(
                `Halaman "${pageName}" tidak ditemukan`
            );

        }


        const module =
            await smartofficeLoadModule(
                loader,
                pageName
            );


        /*
         * Module bisa selesai setelah user sudah pindah
         * halaman. Jangan lanjutkan navigasi lama.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            console.log(
                "[Router] Module stale:",
                pageName,
                navigationId
            );

            return;
        }


        /* ==================================================
           INIT PAGE
        ================================================== */
        const loadFunction =
            module.smartofficeLoadPage ||
            module.smartofficeLoadLoginPage ||
            module.default;


        if(
            typeof loadFunction ===
            "function"
        ){

            /*
             * Halaman sudah berhasil dimuat.
             *
             * Global loading tidak menunggu proses
             * pengambilan data internal halaman.
             *
             * Spinner mini stat / card akan menangani
             * loading data masing-masing.
             */
            smartofficeHideGlobalLoading();


            /*
             * Lepaskan tanggung jawab global loading
             * dari finally.
             */
            globalLoadingHandled = true;


            /*
             * Jalankan lifecycle halaman.
             *
             * PENTING:
             * Tidak di-await oleh router.
             *
             * Jadi kalau GAS lambat mengambil data,
             * user tetap bisa pindah halaman.
             */
            Promise.resolve(
                loadFunction(params)
            ).catch(function(error){

                console.error(
                    "SMARTOFFICE PAGE LOAD ERROR:",
                    pageName,
                    error
                );

            });

        }


        /* ==================================================
           SIMPAN DESTROY FUNCTION
        ================================================== */

        /*
         * Pastikan navigasi ini masih merupakan
         * navigasi aktif sebelum memasang destroy.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            return;
        }


        smartofficeCurrentDestroy =
            module.smartofficeDestroyPage ||
            module.smartofficeDestroyLoginPage ||
            null;


        /* ==================================================
           CURRENT PAGE
        ================================================== */
        smartofficeCurrentPage =
            pageName;


        /* ==================================================
           URL
        ================================================== */
        if(
            pushState &&
            navigationId === smartofficeNavigationId
        ){

            const query =
                new URLSearchParams(
                    params
                ).toString();


            const hash =
                query
                    ? `#${pageName}?${query}`
                    : `#${pageName}`;


            history.pushState(
                {
                    page:
                        pageName,

                    params:
                        params
                },
                "",
                hash
            );

        }

    }
    catch(error){

        /* ==================================================
           NAVIGATION ERROR
        ================================================== */
        console.error(
            "SMARTOFFICE NAVIGATE ERROR:",
            pageName,
            error
        );


        /*
         * Jangan menimpa halaman baru dengan error
         * dari navigasi lama.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            return;
        }


        const app =
            document.getElementById(
                "app"
            );


        if(app){

            app.innerHTML =
                smartofficeGetErrorHtml(
                    pageName
                );

        }

    }
    finally{

        /* ==================================================
           GLOBAL PAGE LOADING OFF

           Hanya navigasi yang masih aktif yang boleh
           mematikan global loading.
        ================================================== */
        if(
            navigationId ===
            smartofficeNavigationId &&
            useGlobalLoading &&
            !globalLoadingHandled
        ){

            smartofficeHideGlobalLoading();

        }

    }
}


/* ======================================================
   RESET NAVIGATION STATE

   Digunakan saat logout / reset aplikasi
====================================================== */
export function smartofficeResetNavigationState(){

    /*
     * Membuat semua navigasi yang sedang berjalan
     * dianggap stale.
     */
    smartofficeNavigationId++;


    /*
     * Batalkan request HTML aktif.
     */
    if(smartofficePageHtmlController){

        try{

            smartofficePageHtmlController.abort();

        }
        catch(error){

            console.warn(
                "[Router] Reset navigation abort gagal:",
                error
            );

        }

        smartofficePageHtmlController =
            null;
    }
}


/* ======================================================
   DESTROY CURRENT PAGE
====================================================== */
export async function smartofficeDestroyCurrentPage(){

    if(
        typeof smartofficeCurrentDestroy ===
        "function"
    ){

        await smartofficeCurrentDestroy();

    }


    smartofficeCurrentDestroy =
        null;
}


/* ======================================================
   GET PAGE HTML
====================================================== */
async function smartofficeGetPageHtml(
    pageName,
    navigationId
){

    /*
     * Gunakan cache kalau HTML sudah pernah dimuat.
     */
    if(
        smartofficePageCache.has(
            pageName
        )
    ){

        return smartofficePageCache.get(
            pageName
        );

    }


    /*
     * Controller khusus untuk fetch HTML.
     *
     * Ini terpisah dari api.js karena request HTML
     * router bukan request API GAS.
     */
    const controller =
        new AbortController();


    smartofficePageHtmlController =
        controller;


    const url =
        `/pages/${pageName}/${pageName}.html`;


    const maxAttempts = 2;

    let lastError = null;


    for(
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ){

        /*
         * Cek apakah navigasi masih aktif.
         */
        if(
            navigationId !==
            smartofficeNavigationId
        ){

            return "";

        }


        try{

            const response =
                await fetch(
                    url,
                    {
                        cache: "no-store",
                        signal: controller.signal
                    }
                );


            if(!response.ok){

                throw new Error(
                    `Gagal memuat halaman "${pageName}" (status ${response.status})`
                );

            }


            const html =
                await response.text();


            /*
             * Setelah fetch selesai, cek lagi.
             */
            if(
                navigationId !==
                smartofficeNavigationId
            ){

                return "";

            }


            smartofficePageCache.set(
                pageName,
                html
            );


            return html;

        }
        catch(error){

            /*
             * Abort adalah kondisi normal ketika user
             * pindah halaman dengan cepat.
             */
            if(
                error?.name === "AbortError"
            ){

                console.log(
                    "[Router] HTML request dibatalkan:",
                    pageName,
                    navigationId
                );

                return "";

            }


            lastError =
                error;


            /*
             * Jangan retry kalau navigasi sudah stale.
             */
            if(
                navigationId !==
                smartofficeNavigationId
            ){

                return "";

            }


            console.warn(
                `SMARTOFFICE LOAD PAGE FAILED: ${pageName} - attempt ${attempt}`,
                error
            );


            /*
             * Retry maksimal satu kali.
             */
            if(
                attempt < maxAttempts
            ){

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500
                        )
                );


                /*
                 * Cek kembali setelah delay retry.
                 */
                if(
                    navigationId !==
                    smartofficeNavigationId
                ){

                    return "";

                }

            }

        }

    }


    throw (
        lastError ||
        new Error(
            `Gagal memuat halaman "${pageName}".`
        )
    );
}


/* ======================================================
   ERROR HTML (FALLBACK UI)
====================================================== */
function smartofficeGetErrorHtml(
    pageName
){

    return `
        <div style="padding: 40px; text-align: center;">
            <p style="font-weight: bold; margin-bottom: 8px;">
                Gagal memuat halaman "${pageName}"
            </p>

            <p style="margin-bottom: 16px; color: #666;">
                Periksa koneksi internet kamu, lalu coba lagi.
            </p>

            <button
                onclick="window.smartofficeLoadPage('${pageName}')"
                style="padding: 8px 16px; cursor: pointer;"
            >
                Coba Lagi
            </button>
        </div>
    `;
}


/* ======================================================
   RECOVERY VITE CHUNK ERROR
====================================================== */
function smartofficeIsChunkLoadError(
    error
){

    const message =
        String(
            error?.message ||
            error ||
            ""
        ).toLowerCase();


    return (
        message.includes(
            "failed to fetch dynamically imported module"
        ) ||

        message.includes(
            "importing a module script failed"
        ) ||

        message.includes(
            "dynamically imported module"
        ) ||

        message.includes(
            "chunkloaderror"
        )
    );
}


/* ======================================================
   RETRY LOAD MODULE
====================================================== */
async function smartofficeLoadModule(
    loader,
    pageName
){

    try{

        return await loader();

    }
    catch(error){

        console.warn(
            "SMARTOFFICE MODULE LOAD FAILED:",
            pageName,
            error
        );


        /* ==============================================
           BUKAN ERROR CHUNK
        ============================================== */
        if(
            !smartofficeIsChunkLoadError(
                error
            )
        ){

            throw error;

        }


        /* ==============================================
           CEK APAKAH SUDAH PERNAH RECOVERY
        ============================================== */
        const recoveryKey =
            "smartoffice_chunk_recovery";


        const alreadyRecovered =
            sessionStorage.getItem(
                recoveryKey
            );


        if(alreadyRecovered){

            console.error(
                "SMARTOFFICE CHUNK RECOVERY SUDAH PERNAH DILAKUKAN."
            );

            throw error;

        }


        /* ==============================================
           TANDAI RECOVERY
        ============================================== */
        sessionStorage.setItem(
            recoveryKey,
            "1"
        );


        /* ==============================================
           BERSIHKAN CACHE PWA
        ============================================== */
        if(
            "caches" in window
        ){

            try{

                const cacheNames =
                    await caches.keys();


                await Promise.all(
                    cacheNames.map(
                        cacheName =>
                            caches.delete(
                                cacheName
                            )
                    )
                );

            }
            catch(cacheError){

                console.warn(
                    "SMARTOFFICE CACHE CLEAR FAILED:",
                    cacheError
                );

            }

        }


        /* ==============================================
           UPDATE SERVICE WORKER
        ============================================== */
        if(
            "serviceWorker" in navigator
        ){

            try{

                const registrations =
                    await navigator
                        .serviceWorker
                        .getRegistrations();


                await Promise.all(
                    registrations.map(
                        registration =>
                            registration.update()
                    )
                );

            }
            catch(swError){

                console.warn(
                    "SMARTOFFICE SERVICE WORKER UPDATE FAILED:",
                    swError
                );

            }

        }


        /* ==============================================
           RELOAD SATU KALI
        ============================================== */
        console.warn(
            `SMARTOFFICE CHUNK ERROR: ${pageName}. Reload aplikasi untuk mengambil asset terbaru.`
        );


        window.location.reload();


        return new Promise(
            () => {}
        );

    }
}


/* ======================================================
   GLOBAL ROUTER
====================================================== */
window.smartofficeLoadPage =
    smartofficeNavigate;
