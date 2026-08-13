/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeClearSession,
    smartofficeLogout
} from "../../core/session.js";

import {
    smartofficeNavigate
} from "../../core/router.js";

/* ======================================================
   COMPONENT
====================================================== */
import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetTotalPendingApproval
} from "../../services/dashboard.service.js";


/* ======================================================
   DASHBOARD STATE
====================================================== */
let smartofficeDashboardMenuHandlers = {};
let smartofficeDashboardDestroyed = false;


/* ======================================================
   1. LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       RESET LIFECYCLE
    ========================= */
    smartofficeDashboardDestroyed =
        false;

    smartofficeDashboardMenuHandlers =
        {};

    /* =========================
       CHECK LOGIN SESSION
    ========================= */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* =========================
       GET USER SESSION
    ========================= */
    const sessionData =
        smartofficeGetSession();

    /* =========================
       SESSION NOT FOUND
    ========================= */
    if(
        !sessionData
    ){
        await smartofficeLogout();
        return;
    }

    /* =========================
       RENDER WELCOME CARD
    ========================= */
    smartofficeRenderWelcome(
        sessionData
    );

    /* =========================
       FILTER MENU BY ROLE
    ========================= */
    smartofficeFilterMenuByRole(
        sessionData.role
    );

    /* =========================
       RENDER MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "home"
    );

    /* =========================
       LOAD APPROVAL BADGE
    ========================= */
    smartofficeLoadApprovalBadge(
        sessionData
    ).catch(
        error => {

            console.warn(
                "Load Approval Badge Error:",
                error
            );

        }
    );

    /* =========================
       PAGE MAY HAVE BEEN DESTROYED
    ========================= */
    if(
        smartofficeDashboardDestroyed
    ){
        return;
    }

    /* =========================
       INITIALIZE MENU
    ========================= */
    smartofficeInitDashboardMenu();
}


/* ======================================================
   DESTROY PAGE
====================================================== */
/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    /* =========================
       MARK PAGE DESTROYED
    ========================= */
    smartofficeDashboardDestroyed =
        true;


    /* =========================
       REMOVE MENU LISTENERS
    ========================= */
    const handlers =
        smartofficeDashboardMenuHandlers;


    const menuIds = [
        "smartofficeCutiMenuCard",
        "smartofficeApprovalMenuCard",
        "smartofficeManagementCutiMenuCard",
        "smartofficeBukuTamuMenuCard",
        "smartofficeDokumenSayaMenuCard"
    ];


    menuIds.forEach(
        function(id){

            const element =
                document.getElementById(
                    id
                );

            const handler =
                handlers[id];

            if(
                element &&
                handler
            ){

                element.removeEventListener(
                    "click",
                    handler
                );

            }

        }
    );


    /* =========================
       RESET HANDLERS
    ========================= */
    smartofficeDashboardMenuHandlers =
        {};


    /* =========================
       RESET APPROVAL BADGE
    ========================= */
    const badge =
        document.getElementById(
            "smartofficeApprovalBadge"
        );

    if(
        badge
    ){

        badge.textContent =
            "0";

        badge.classList.remove(
            "show"
        );

    }


    /* =========================
       REMOVE MOBILE NAVBAR
    ========================= */
    const navbar =
        document.getElementById(
            "smartofficeMobileNavbarFixed"
        );

    if(
        navbar
    ){

        navbar.remove();

    }
}


/* ======================================================
   2. RENDER WELCOME
====================================================== */
function smartofficeRenderWelcome(
    sessionData
){
    console.log(sessionData);

    /* =========================
       USER AVATAR
    ========================= */
    const avatarElement =
        document.getElementById(
            "smartofficeDashboardAvatar"
        );

    if(
        avatarElement
    ){
        avatarElement.textContent =
            (sessionData.nama || "?")
            .charAt(0)
            .toUpperCase();
    }

    /* =========================
       USER NAME
    ========================= */
    const userNameElement =
        document.getElementById(
            "smartofficeDashboardUserName"
        );
    if(
        userNameElement
    ){
        userNameElement.textContent =
            sessionData.nama || "-";
    }

    /* =========================
       USER POSITION
    ========================= */
    const jabatanElement =
        document.getElementById(
            "smartofficeDashboardJabatan"
        );
    if(
        jabatanElement
    ){
        jabatanElement.textContent =
            sessionData.jabatan || "-";
    }

    /* =========================
       CURRENT DATE
    ========================= */
    const todayElement =
        document.getElementById(
            "smartofficeDashboardToday"
        );
    if(
        todayElement
    ){
        todayElement.textContent =
            new Date().toLocaleDateString(
                "id-ID",
                {
                    weekday:"long",
                    day:"numeric",
                    month:"long",
                    year:"numeric"
                }
            );
    }
}


/* ======================================================
   3. FILTER MENU BY ROLE
====================================================== */
function smartofficeFilterMenuByRole(
    role
){

    /* =========================
       MENU ELEMENT
    ========================= */
    const approvalMenu =
        document.getElementById(
            "smartofficeApprovalMenuCard"
        );

    const managementCutiMenu =
        document.getElementById(
            "smartofficeManagementCutiMenuCard"
        );

    const arsipMenu =
        document.getElementById(
            "smartofficeArsipMenuCard"
        );

    /* =========================
       RESET MENU
    ========================= */
    document
        .querySelectorAll(
            ".smartoffice-dashboard-menu-card"
        )
        .forEach(function(menu){
            menu.style.display = "";
        });

    /* =========================
       USER
    ========================= */
    if(
        role === "USER"
    ){
        approvalMenu &&
            (approvalMenu.style.display = "none");

        managementCutiMenu &&
            (managementCutiMenu.style.display = "none");

        arsipMenu &&
            (arsipMenu.style.display = "none");
    } 
}


/* ======================================================
   4. LOAD APPROVAL BADGE
====================================================== */
async function smartofficeLoadApprovalBadge(
    sessionData
){

    /* =========================
       USER CANNOT APPROVE
    ========================= */
    if(
        sessionData.role === "USER"
    ){
        return;
    }

    /* =========================
       LOAD BADGE
    ========================= */
    try{
        const total =
            await smartofficeGetTotalPendingApproval(
                sessionData.nip
            );

        smartofficeUpdateApprovalBadge(
            total
        );
    }

    catch(error){
        console.error(
            "Load Approval Badge Error:",
            error
        );
    }
}


/* ======================================================
   UPDATE APPROVAL BADGE
====================================================== */
function smartofficeUpdateApprovalBadge(
    total
){

    /* =========================
       BADGE ELEMENT
    ========================= */
    const badge =
        document.getElementById(
            "smartofficeApprovalBadge"
        );
    if(
        !badge
    ){
        return;
    }

    /* =========================
       TOTAL APPROVAL
    ========================= */
    total =
        Number(total) || 0;

    /* =========================
       HIDE BADGE
    ========================= */
    if(
        total <= 0
    ){
        badge.textContent =
            "0";

        badge.classList.remove(
            "show"
        );

        return;
    }

    /* =========================
       SHOW BADGE
    ========================= */
    badge.textContent =
        String(total);

    badge.classList.add(
        "show"
    );
}


/* ======================================================
   INIT DASHBOARD MENU
====================================================== */
function smartofficeInitDashboardMenu(){

    /* =========================
       PREVENT DUPLICATE INIT
    ========================= */
    smartofficeDestroyDashboardMenuListeners();


    /* =========================
       E-CUTI
    ========================= */
    const cutiMenu =
        document.getElementById(
            "smartofficeCutiMenuCard"
        );

    if(
        cutiMenu
    ){

        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "cuti"
                );

            };

        cutiMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeCutiMenuCard"
        ] =
            handler;

    }


    /* =========================
       APPROVAL
    ========================= */
    const approvalMenu =
        document.getElementById(
            "smartofficeApprovalMenuCard"
        );

    if(
        approvalMenu
    ){

        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "approval"
                );

            };

        approvalMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeApprovalMenuCard"
        ] =
            handler;

    }


    /* =========================
       MANAGEMENT CUTI
    ========================= */
    const managementCutiMenu =
        document.getElementById(
            "smartofficeManagementCutiMenuCard"
        );

    if(
        managementCutiMenu
    ){

        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "management-cuti"
                );

            };

        managementCutiMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeManagementCutiMenuCard"
        ] =
            handler;

    }


    /* =========================
       BUKU TAMU
    ========================= */
    const bukuTamuMenu =
        document.getElementById(
            "smartofficeBukuTamuMenuCard"
        );

    if(
        bukuTamuMenu
    ){

        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "buku-tamu"
                );

            };

        bukuTamuMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeBukuTamuMenuCard"
        ] =
            handler;

    }


    /* =========================
       DOKUMEN SAYA
    ========================= */
    const dokumenSayaMenu =
        document.getElementById(
            "smartofficeDokumenSayaMenuCard"
        );

    if(
        dokumenSayaMenu
    ){

        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "dokumen-saya"
                );

            };

        dokumenSayaMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeDokumenSayaMenuCard"
        ] =
            handler;

    }
}


/* ======================================================
   DESTROY DASHBOARD MENU LISTENERS
====================================================== */
function smartofficeDestroyDashboardMenuListeners(){

    const handlers =
        smartofficeDashboardMenuHandlers;


    Object.keys(
        handlers
    ).forEach(
        function(id){

            const element =
                document.getElementById(
                    id
                );

            const handler =
                handlers[id];

            if(
                element &&
                handler
            ){

                element.removeEventListener(
                    "click",
                    handler
                );

            }

        }
    );


    smartofficeDashboardMenuHandlers =
        {};
}


