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
   1. LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

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
    );    

    /* =========================
       INITIALIZE MENU
    ========================= */
    smartofficeInitDashboardMenu();
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){
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
       E-CUTI
    ========================= */
    document
        .getElementById(
            "smartofficeCutiMenuCard"
        )
        ?.addEventListener(
            "click",
            async function(){

                await smartofficeNavigate(
                    "cuti"
                );

            }
        );

    /* =========================
       APPROVAL
    ========================= */
    document
        .getElementById(
            "smartofficeApprovalMenuCard"
        )
        ?.addEventListener(
            "click",
            async function(){

                await smartofficeNavigate(
                    "approval"
                );

            }
        );

    /* =========================
       MANAGEMENT CUTI
    ========================= */
    document
        .getElementById(
            "smartofficeManagementCutiMenuCard"
        )
        ?.addEventListener(
            "click",
            async function(){

                await smartofficeNavigate(
                    "management-cuti"
                );

            }
        );

    /* =========================
       BUKU TAMU
    ========================= */
    document
        .getElementById(
            "smartofficeBukuTamuMenuCard"
        )
        ?.addEventListener(
            "click",
            async function(){

                await smartofficeNavigate(
                    "buku-tamu"
                );

            }
        );

    /* =========================
       DOKUMEN SAYA
    ========================= */
    document
        .getElementById(
            "smartofficeDokumenSayaMenuCard"
        )
        ?.addEventListener(
            "click",
            async function(){

                await smartofficeNavigate(
                    "dokumen-saya"
                );

            }
        );

}


