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

    //approval: () =>
    //    import("../pages/approval/approval.js"),

    //smartspdBlud: () =>
    //    import("../pages/smartspd-blud/smartspd-blud.js"),

    //dokumenSaya: () =>
    //    import("../pages/dokumen-saya/dokumen-saya.js"),

    //arsipKepegawaian: () =>
    //    import("../pages/arsip-kepegawaian/arsip-kepegawaian.js"),

    //managementCuti: () =>
    //    import("../pages/management-cuti/management-cuti.js"),

    //bukuTamu: () =>
    //    import("../pages/buku-tamu/buku-tamu.js")*/
};


/* ======================================================
   INITIALIZE ROUTER
====================================================== */
export async function smartofficeInitializeRouter(){

    console.log(
        "SmartOffice Router Ready"
    );

    await smartofficeNavigate(
        "login"
    );
}


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeNavigate(
    pageName
){
    if(
        !pageName
    ){
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
    if(
        !app
    ){
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

    if(
        !loader
    ){
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
        await loadFunction();
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

    history.pushState(
        {
            page:
                pageName
        },
        "",
        `#${pageName}`
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
            `src/pages/${pageName}/${pageName}.html`
        );

    const html =
        await response.text();

    smartofficePageCache.set(
        pageName,
        html
    );

    return html;
}