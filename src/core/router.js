import {
    smartofficeStorageGet
} from "./storage.js";


/* ======================================================
   SMARTOFFICE ROUTER
====================================================== */
let smartofficeCurrentPage =
    null;

let smartofficeCurrentDestroy =
    null;

const smartofficePageCache =
    new Map();


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

    /*
    "verify-cuti": () =>
        import("../pages/verify-cuti/verify-cuti.js"),
    */

    "buku-tamu": () =>
        import("../pages/buku-tamu/buku-tamu.js"),

    "dokumen-saya": () =>
        import("../pages/dokumen-saya/dokumen-saya.js"),

};


/* ======================================================
   INITIALIZE ROUTER
====================================================== */
export async function smartofficeInitializeRouter(){

    console.log(
        "SmartOffice Router Ready"
    );


    const hash =
        window.location.hash;


    /* ==================================================
       VERIFY CUTI
       SEMENTARA DINONAKTIFKAN
       TETAP DISIMPAN
    ================================================== */

    /*
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
    */


    /* ==================================================
       CEK SESSION LANGSUNG DARI STORAGE
    ================================================== */

    let session = null;

    try {

        session =
            smartofficeStorageGet(
                "smartoffice_session"
            );

    }
    catch(error){

        console.error(
            "SMARTOFFICE SESSION ERROR:",
            error
        );

    }


    /* ==================================================
       SESSION ADA
    ================================================== */

    if(
        session
    ){

        console.log(
            "SmartOffice Session ditemukan"
        );

        console.log(
            "Langsung ke Dashboard"
        );


        await smartofficeNavigate(
            "dashboard"
        );


        return;

    }


    /* ==================================================
       SESSION TIDAK ADA
    ================================================== */

    console.log(
        "SmartOffice Session tidak ditemukan"
    );


    await smartofficeNavigate(
        "login"
    );

}


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeNavigate(
    pageName,
    params = {}
){

    if(!pageName){
        return;
    }


    /* =========================
       DESTROY CURRENT PAGE
    ========================= */

    await smartofficeDestroyCurrentPage();


    /* =========================
       LOAD HTML
    ========================= */

    const html =
        await smartofficeGetPageHtml(
            pageName
        );


    const app =
        document.getElementById(
            "app"
        );


    if(!app){
        return;
    }


    app.innerHTML =
        html;


    /* =========================
       LOAD MODULE
    ========================= */

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


    /* =========================
       INIT PAGE
    ========================= */

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


    /* =========================
       DESTROY FUNCTION
    ========================= */

    smartofficeCurrentDestroy =
        module.smartofficeDestroyPage ||
        module.smartofficeDestroyLoginPage ||
        null;


    smartofficeCurrentPage =
        pageName;


    /* =========================
       URL
    ========================= */

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
            page: pageName,
            params: params
        },
        "",
        hash
    );

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


    const response =
        await fetch(
            `/pages/${pageName}/${pageName}.html`
        );


    const html =
        await response.text();


    smartofficePageCache.set(
        pageName,
        html
    );


    return html;

}


/* ======================================================
   GLOBAL ROUTER
====================================================== */
window.smartofficeLoadPage =
    smartofficeNavigate;