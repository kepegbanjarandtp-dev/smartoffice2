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

let smartofficeIsNavigating =
    false;


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
           REQUEST HALAMAN SEBELUMNYA TIDAK BOLEH
           MENGHALANGI HALAMAN BARU
        ================================================== */
        smartofficeAbortAllRequests();

        /* ==================================================
           DESTROY CURRENT PAGE
        ================================================== */
        await smartofficeDestroyCurrentPage();

        /* ==================================================
           LOAD HTML
        ================================================== */
        const app =
            document.getElementById(
                "app"
            );

        if(!app){
            return;
        }

        let html;

        try{
            html =
                await smartofficeGetPageHtml(
                    pageName
                );
        }
        catch(error){
            console.error(
                "SMARTOFFICE GAGAL MEMUAT HALAMAN:",
                pageName,
                error
            );

            app.innerHTML =
                smartofficeGetErrorHtml(
                    pageName
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
            await loader();

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
            await loadFunction(
                params
            );
        }

        /* ==================================================
           SIMPAN DESTROY FUNCTION
        ================================================== */
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
        if(pushState){

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
           Login tidak memiliki global loading router.
        ================================================== */
        if(useGlobalLoading){
            smartofficeHideGlobalLoading();
        }
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
    pageName
){

    if(
        smartofficePageCache.has(
            pageName
        )
    ){
        return smartofficePageCache.get(
            pageName
        );
    }

    const maxAttempts = 2;

    let lastError = null;

    for(
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ){

        try{

            const response =
                await fetch(
                    `/pages/${pageName}/${pageName}.html`,
                    {
                        cache: "no-store"
                    }
                );

            if(!response.ok){

                throw new Error(
                    `Gagal memuat halaman "${pageName}" (status ${response.status})`
                );

            }

            const html =
                await response.text();

            smartofficePageCache.set(
                pageName,
                html
            );

            return html;

        }
        catch(error){

            lastError = error;

            console.warn(
                `SMARTOFFICE LOAD PAGE FAILED: ${pageName} - attempt ${attempt}`,
                error
            );

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
   GLOBAL ROUTER
====================================================== */
window.smartofficeLoadPage =
    smartofficeNavigate;
