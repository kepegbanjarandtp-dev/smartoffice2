/* ============================================================================================
   IMPORT
============================================================================================ */

/* ======================================================
   IMPORT — CORE
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
   IMPORT — COMPONENT
====================================================== */
import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeLoadNotificationCache
} from "../../components/notifikasi/notifikasi_PWA.js";

/* ======================================================
   IMPORT — SERVICE
====================================================== */
import {
    smartofficeGetTotalPendingApproval,
    smartofficeGetTotalPendingApprovalAll,
    smartofficeGetDashboardStats,
    smartofficeGetSedangCutiFirestore
} from "../../services/dashboard.service.js";

import {
    smartofficeGetTotalPendingApprovalFirestore,
    smartofficeGetDokumenVerifikasiFirestore
} from "../../services/approval-firestore.service.js";

/* ======================================================
   IMPORT — ASSET
====================================================== */
import logoSimbok from "../../assets/icons/logo-simbok.svg";



/* ============================================================================================
   DASHBOARD STATE
============================================================================================ */

/* ======================================================
   DASHBOARD MENU STATE
====================================================== */
let smartofficeDashboardMenuHandlers = {};
let smartofficeDashboardDestroyed = false;

/* ======================================================
   LIFECYCLE STATE
====================================================== */
let smartofficeDashboardPageInstance = 0;

/* ======================================================
   DASHBOARD — SEDANG CUTI STATE
====================================================== */
let smartofficeDashboardSedangCutiCache = null;
let smartofficeDashboardSedangCutiLoading = false;
let smartofficeDashboardSedangCutiRequest = 0;


/* ============================================================================================
   1. PAGE LIFECYCLE
============================================================================================ */

/* ======================================================
   1.1 LOAD DASHBOARD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       RESET LIFECYCLE
    ========================= */
    smartofficeDashboardPageInstance++;

    const pageInstance =
        smartofficeDashboardPageInstance;

    smartofficeDashboardDestroyed =
        false;

    /* =========================
       RESET SEDANG CUTI STATE
    ========================= */
    smartofficeDashboardSedangCutiCache =
        null;
    smartofficeDashboardSedangCutiLoading =
        false;
    smartofficeDashboardSedangCutiRequest++;

    /* =========================
       RESET HANDLERS
    ========================= */
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
       SET ICON SIMBOK
    ========================= */
    const simbokIcon =
        document.getElementById(
            "smartofficeSimbokIcon"
        );

    console.log(
        "SIMBOK ELEMENT:",
        simbokIcon
    );

    console.log(
        "SIMBOK LOGO IMPORT:",
        logoSimbok
    );

    if(
        simbokIcon
    ){
        simbokIcon.src =
            logoSimbok;

        console.log(
            "SIMBOK SRC SET:",
            simbokIcon.src
        );
    }

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

    /* ==========================================
       PRELOAD NOTIFICATION
       Setelah router selesai abort request lama
    ========================================== */
    smartofficeLoadNotificationCache()
    .catch(
        error => {
            console.warn(
                "[Smart Office] Notification preload gagal:",
                error
            );
        }
    );

    /* =========================
       LOGOUT BUTTON
    ========================= */
    const logoutButton =
        document.getElementById(
            "smartofficeLogoutButton"
        );
    if(
        logoutButton
    ){
        logoutButton.onclick =
            async function(){
                await smartofficeLogout();
            };
    }

    /* =========================
       LOAD APPROVAL BADGE
       BACKGROUND / NON-BLOCKING
    ========================= */
    smartofficeLoadApprovalBadge(
        sessionData,
        pageInstance
    )
    .catch(
        error => {
            console.warn(
                "Load Approval Badge Error:",
                error
            );
        }
    );

    /* =========================
       LOAD DASHBOARD STATISTICS
       BACKGROUND / NON-BLOCKING
    ========================= */
    smartofficeLoadDashboardStats(
        pageInstance
    )
    .catch(
        error => {
            console.warn(
                "Load Dashboard Statistics Error:",
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

    /* =========================
       INIT SEDANG CUTI
       HANYA PASANG LISTENER
       BELUM ADA FIRESTORE READ
    ========================= */
    smartofficeInitDashboardCuti(
        pageInstance
    );
}


/* ======================================================
   1.2 DESTROY DASHBOARD PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    /* =========================
       INVALIDATE ASYNC REQUEST
    ========================= */
    smartofficeDashboardPageInstance++;

    /* =========================
       MARK PAGE DESTROYED
    ========================= */
    smartofficeDashboardDestroyed =
        true;

    /* =========================
       INVALIDATE SEDANG CUTI
       REQUEST
    ========================= */
    smartofficeDashboardSedangCutiRequest++;
    smartofficeDashboardSedangCutiLoading =
        false;

    /* =========================
       REMOVE DASHBOARD LISTENERS
    ========================= */
    const handlers =
        smartofficeDashboardMenuHandlers;

    const elementIds = [

        /* ======================
           MENU
        ====================== */
        "smartofficeCutiMenuCard",
        "smartofficeApprovalMenuCard",
        "smartofficeManagementCutiMenuCard",
        "smartofficeBukuTamuMenuCard",
        "smartofficeDokumenSayaMenuCard",
        "smartofficeArsipPegawaiMenuCard",
        "smartofficeESuratMenuCard",
        "smartofficeDokumenPuskesmasMenuCard",

        /* ======================
           SEDANG CUTI
        ====================== */
        "smartofficeDashboardSummaryCuti",
        "smartofficeDashboardCutiClose",
    ];

    elementIds.forEach(
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
       RESET SEDANG CUTI STATE
    ========================= */
    smartofficeDashboardSedangCutiCache =
        null;

    smartofficeDashboardSedangCutiLoading =
        false;

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
}


/* ============================================================================================
   2. WELCOME & USER INFORMATION
============================================================================================ */

/* ======================================================
   2.1 RENDER WELCOME CARD
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
   2.2 FILTER MENU BERDASARKAN ROLE
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
            "smartofficeArsipPegawaiMenuCard"
        );

    const masterDataMenu =
        document.getElementById(
            "smartofficeMasterDataMenuCard"
        );

    /* =========================
       ROLE CATEGORY
    ========================= */
    const roleCategory =
        document.getElementById(
            "smartofficeDashboardRoleCategory"
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

    if(roleCategory){
        roleCategory.style.display = "";
    }

    /* =========================
       USER
    ========================= */
    if(
        role === "USER"
    ){
        /* HIDE CONTAINER */
        if(roleCategory){
            roleCategory.style.display =
                "none";
        }

        /* HIDE MENU CARD */
        approvalMenu &&
            (approvalMenu.style.display = "none");

        managementCutiMenu &&
            (managementCutiMenu.style.display = "none");

        arsipMenu &&
            (arsipMenu.style.display = "none");

        masterDataMenu &&
            (masterDataMenu.style.display = "none");
    }

    /* =========================
       SUPERADMIN
       Master Data TETAP TAMPIL
    ========================= */
    else if(
        role === "SUPERADMIN"
    ){
        masterDataMenu &&
            (masterDataMenu.style.display = "");
    }

    /* =========================
       PJ
       Master Data TETAP TAMPIL
    ========================= */
    else if(
        role === "PJ"
    ){
        masterDataMenu &&
            (masterDataMenu.style.display = "");
    }

    /* =========================
       ADMIN
       Master Data TETAP TAMPIL
    ========================= */
    else if(
        role === "ADMIN"
    ){
        masterDataMenu &&
            (masterDataMenu.style.display = "");
    }
}


/* ============================================================================================
   3. APPROVAL BADGE
============================================================================================ */

/* ======================================================
   3.1 LOAD TOTAL APPROVAL
====================================================== */
async function smartofficeLoadApprovalBadge(
    sessionData,
    pageInstance
){

    /* =========================
       USER
       TIDAK PERLU REQUEST
    ========================= */
    if(
        sessionData.role === "USER"
    ){
        return;
    }

    try{
        let total = 0;

        /* =========================
           PJ
           CUTI + DOKUMEN
        ========================= */
        if(sessionData.role === "PJ"){

            total =
                await smartofficeGetTotalPendingApprovalAll(
                    sessionData.nip,
                    sessionData.role
                );

            if(
                pageInstance !==
                smartofficeDashboardPageInstance ||
                smartofficeDashboardDestroyed
            ){
                return;
            }          
        }

        /* =========================
           ADMIN/SUPERADMIN
           DOKUMEN SAJA
        ========================= */
        else if(
            sessionData.role === "ADMIN" ||
            sessionData.role === "SUPERADMIN"
        ){
            const dokumen =
                await smartofficeGetDokumenVerifikasiFirestore()

            if(
                pageInstance !==
                smartofficeDashboardPageInstance ||
                smartofficeDashboardDestroyed
            ){
                return;
            }

            total =
                Array.isArray(dokumen)
                    ? dokumen.length
                    : 0;
        }

        /* =========================
           KAPUS
           CUTI SAJA
        ========================= */
        else if(
            sessionData.role === "KAPUS"
        ){
            total =
                await smartofficeGetTotalPendingApprovalFirestore(
                    sessionData.nip,
                    sessionData.role
                );
            if(
                pageInstance !==
                smartofficeDashboardPageInstance ||
                smartofficeDashboardDestroyed
            ){
                return;
            }
        }

        /* =========================
           UPDATE BADGE
        ========================= */
        if(
            pageInstance !==
            smartofficeDashboardPageInstance ||
            smartofficeDashboardDestroyed
        ){
            return;
        }

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
   3.2 UPDATE APPROVAL BADGE
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


/* ============================================================================================
   4. DASHBOARD MENU
============================================================================================ */

/* ======================================================
   4.1 INIT DASHBOARD MENU
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
       SMARTSPD BLUD
    ========================= */
    const spdBludMenu =
        document.getElementById(
            "smartofficeSPDBLUDMenuCard"
        );
    if(
        spdBludMenu
    ){
        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "smartspd-blud"
                );
            };

        spdBludMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeSPDBLUDMenuCard"
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

    /* =========================
       ARSIP KEPEGAWAIAN
    ========================= */
    const arsipPegawaiMenu =
        document.getElementById(
            "smartofficeArsipPegawaiMenuCard"
        );
    if(
        arsipPegawaiMenu
    ){
        const handler =
            async function(){
                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "arsip-pegawai"
                );
            };
        arsipPegawaiMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeArsipPegawaiMenuCard"
        ] =
            handler;
    }

    /* =========================
       BUKU SURAT
    ========================= */
    const bukuSuratMenu =
        document.getElementById(
            "smartofficeESuratMenuCard"
        );

    if(
        bukuSuratMenu
    ){
        const handler =
            async function(){

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "buku-surat"
                );
            };

        bukuSuratMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeESuratMenuCard"
        ] =
            handler;
    }

    /* =========================
       PUSAT DOKUMEN
    ========================= */
    const pusatDokumenMenu =
        document.getElementById(
            "smartofficeDokumenPuskesmasMenuCard"
        );

    if(
        pusatDokumenMenu
    ){
        const handler =
            async function(){
                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "pusat-dokumen"
                );
            };

        pusatDokumenMenu.addEventListener(
            "click",
            handler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeDokumenPuskesmasMenuCard"
        ] =
            handler;
    }

    /* ======================================================
       MENU DALAM PENGEMBANGAN
    ====================================================== */
    const menuPengembangan = [

        {
            id:
                "smartofficeJejaringPuskesmasMenuCard",
            message:
                "Fitur Jejaring Puskesmas sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeImunisasiJejaringMenuCard",
            message:
                "Fitur Imunisasi Jejaring sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeAgendaMenuCard",
            message:
                "Fitur Agenda & Kegiatan sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeLaporanMenuCard",
            message:
                "Fitur Laporan & Rekap sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeMasterDataMenuCard",
            message:
                "Fitur Master Data sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeJurnalApelMenuCard",
            message:
                "Fitur Jurnal Apel sedang dalam pengembangan."
        },

        {
            id:
                "smartofficeDataPajakMenuCard",
            message:
                "Fitur Data Pajak sedang dalam pengembangan."
        },
        
        {
            id:
                "smartofficeSimbokMenuCard",
            message:
                "Fitur simBOK sedang dalam pengembangan."
        }

    ];

    menuPengembangan.forEach(
        function(item){
            const menu =
                document.getElementById(
                    item.id
                );
            if(!menu){
                return;
            }

            const handler =
                function(){
                    if(
                        smartofficeDashboardDestroyed
                    ){
                        return;
                    }

                    smartofficeShowToast(
                        item.message,
                        "info"
                    );
                };

            menu.addEventListener(
                "click",
                handler
            );

            smartofficeDashboardMenuHandlers[
                item.id
            ] =
                handler;
        }
    );
}


/* ======================================================
   4.2 DESTROY DASHBOARD MENU LISTENERS
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


/* ============================================================================================
   5. DASHBOARD STATISTICS
============================================================================================ */

/* ======================================================
   5.1 LOAD DASHBOARD STATISTICS
====================================================== */
async function smartofficeLoadDashboardStats(){

    try{
        const stats =
            await smartofficeGetDashboardStats();

        const pegawaiElement =
            document.getElementById(
                "smartofficeDashboardStatPegawai"
            );

        const cutiElement =
            document.getElementById(
                "smartofficeDashboardStatCuti"
            );

        const arsipElement =
            document.getElementById(
                "smartofficeDashboardStatArsip"
            );

        if(pegawaiElement){
            pegawaiElement.textContent =
                stats.totalPegawai;
        }

        if(cutiElement){
            cutiElement.textContent =
                stats.sedangCuti;
        }

        if(arsipElement){
            arsipElement.textContent =
                stats.totalArsip;
        }
    }
    catch(error){
        console.error(
            "Dashboard statistics error:",
            error
        );

        const elements = [
            "smartofficeDashboardStatPegawai",
            "smartofficeDashboardStatCuti",
            "smartofficeDashboardStatArsip"
        ];

        elements.forEach(id => {
            const element =
                document.getElementById(id);
            if(element){
                element.textContent = "-";
            }
        });
    }
}


/* ============================================================================================
   6. DASHBOARD — SEDANG CUTI
============================================================================================ */

/* ======================================================
   6.1 INIT SEDANG CUTI
====================================================== */
function smartofficeInitDashboardCuti(
    pageInstance
){
    const cutiCard =
        document.getElementById(
            "smartofficeDashboardSummaryCuti"
        );

    const cutiClose =
        document.getElementById(
            "smartofficeDashboardCutiClose"
        );
    if(
        !cutiCard
    ){
        return;
    }

    /* ==================================================
       REMOVE OLD LISTENERS
    ================================================== */
    const oldHandler =
        smartofficeDashboardMenuHandlers[
            "smartofficeDashboardSummaryCuti"
        ];
    if(
        oldHandler
    ){
        cutiCard.removeEventListener(
            "click",
            oldHandler
        );
    }

    const oldCloseHandler =
        smartofficeDashboardMenuHandlers[
            "smartofficeDashboardCutiClose"
        ];
    if(
        oldCloseHandler &&
        cutiClose
    ){
        cutiClose.removeEventListener(
            "click",
            oldCloseHandler
        );
    }

    /* ==================================================
       ELEMENT DETAIL
    ================================================== */
    const detail =
        document.getElementById(
            "smartofficeDashboardCutiDetail"
        );

    const loading =
        document.getElementById(
            "smartofficeDashboardCutiLoading"
        );

    const list =
        document.getElementById(
            "smartofficeDashboardCutiList"
        );

    /* ==================================================
       CLICK SEDANG CUTI
    ================================================== */
    const toggleHandler =
        async function(){
            if(
                smartofficeDashboardDestroyed ||
                pageInstance !==
                    smartofficeDashboardPageInstance
            ){
                return;
            }

            if(
                !detail
            ){
                return;
            }

            /* ==========================================
               CLOSE
            ========================================== */
            if(
                !detail.hidden
            ){

                detail.hidden =
                    true;

                cutiCard.setAttribute(
                    "aria-expanded",
                    "false"
                );

                return;
            }

            /* ==========================================
               OPEN
            ========================================== */
            detail.hidden =
                false;

            cutiCard.setAttribute(
                "aria-expanded",
                "true"
            );

            /* ==========================================
               GUNAKAN CACHE
            ========================================== */
            if(
                Array.isArray(
                    smartofficeDashboardSedangCutiCache
                )
            ){
                smartofficeRenderDashboardCutiList(
                    smartofficeDashboardSedangCutiCache
                );

                return;
            }

            /* ==========================================
               CEK TOTAL STATISTIK
               AGAR 0 TIDAK MELAKUKAN READ
            ========================================== */
            const statElement =
                document.getElementById(
                    "smartofficeDashboardStatCuti"
                );

            const totalCuti =
                Number(
                    statElement?.textContent
                ) || 0;
            if(
                totalCuti <= 0
            ){
                smartofficeDashboardSedangCutiCache =
                    [];

                smartofficeRenderDashboardCutiList(
                    []
                );

                return;
            }

            /* ==========================================
               CEGAH REQUEST GANDA
            ========================================== */
            if(
                smartofficeDashboardSedangCutiLoading
            ){
                return;
            }

            smartofficeDashboardSedangCutiLoading =
                true;

            const requestId =
                ++smartofficeDashboardSedangCutiRequest;

            /* ==========================================
               LOADING
            ========================================== */
            if(
                loading
            ){
                loading.hidden =
                    false;
            }

            if(
                list
            ){
                list.innerHTML =
                    "";
            }

            try{
                console.log(
                    "DASHBOARD CUTI — mulai mengambil data"
                );

                const data =
                    await smartofficeGetSedangCutiFirestore();

                console.log(
                    "DASHBOARD CUTI — data Firestore:",
                    data
                );

                /* ======================================
                CEK LIFECYCLE
                ====================================== */
                if(
                    smartofficeDashboardDestroyed ||
                    pageInstance !==
                        smartofficeDashboardPageInstance ||
                    requestId !==
                        smartofficeDashboardSedangCutiRequest
                ){
                    return;
                }

                /* ======================================
                SIMPAN CACHE
                ====================================== */
                smartofficeDashboardSedangCutiCache =
                    Array.isArray(data)
                        ? data
                        : [];

                console.log(
                    "DASHBOARD CUTI — cache:",
                    smartofficeDashboardSedangCutiCache
                );

                /* ======================================
                RENDER
                ====================================== */
                smartofficeRenderDashboardCutiList(
                    smartofficeDashboardSedangCutiCache
                );

                console.log(
                    "DASHBOARD CUTI — render berhasil"
                );
            }
            catch(error){
                console.error(
                    "LOAD DASHBOARD SEDANG CUTI ERROR:",
                    error
                );

                console.error(
                    "ERROR MESSAGE:",
                    error?.message
                );

                console.error(
                    "ERROR STACK:",
                    error?.stack
                );

                if(
                    smartofficeDashboardDestroyed ||
                    pageInstance !==
                        smartofficeDashboardPageInstance
                ){
                    return;
                }

                if(
                    list
                ){

                    list.innerHTML =
                        "";

                    const errorElement =
                        document.createElement(
                            "div"
                        );

                    errorElement.className =
                        "smartoffice-dashboard-cuti-empty";

                    errorElement.textContent =
                        "Gagal memuat data cuti.";

                    list.appendChild(
                        errorElement
                    );
                }
            }            
            finally{
                if(
                    requestId ===
                    smartofficeDashboardSedangCutiRequest
                ){
                    smartofficeDashboardSedangCutiLoading =
                        false;
                    if(
                        loading
                    ){
                        loading.hidden =
                            true;
                    }
                }
            }
        };

    /* ==================================================
       ATTACH CLICK
    ================================================== */
    cutiCard.addEventListener(
        "click",
        toggleHandler
    );

    smartofficeDashboardMenuHandlers[
        "smartofficeDashboardSummaryCuti"
    ] =
        toggleHandler;

    /* ==================================================
       ACCESSIBILITY
    ================================================== */
    cutiCard.setAttribute(
        "aria-expanded",
        "false"
    );

    /* ==================================================
       CLOSE BUTTON
    ================================================== */
    if(
        cutiClose
    ){
        const closeHandler =
            function(event){
                event.stopPropagation();

                if(
                    smartofficeDashboardDestroyed
                ){
                    return;
                }

                if(
                    detail
                ){
                    detail.hidden =
                        true;
                }

                cutiCard.setAttribute(
                    "aria-expanded",
                    "false"
                );
            };

        cutiClose.addEventListener(
            "click",
            closeHandler
        );

        smartofficeDashboardMenuHandlers[
            "smartofficeDashboardCutiClose"
        ] =
            closeHandler;
    }
}


/* ======================================================
   6.2 RENDER DAFTAR PEGAWAI SEDANG CUTI
====================================================== */
function smartofficeRenderDashboardCutiList(
    data
){
    const list =
        document.getElementById(
            "smartofficeDashboardCutiList"
        );
    if(
        !list
    ){
        return;
    }

    list.innerHTML =
        "";

    /* ==================================================
       DATA KOSONG
    ================================================== */
    if(
        !Array.isArray(data) ||
        data.length === 0
    ){
        const emptyElement =
            document.createElement(
                "div"
            );

        emptyElement.className =
            "smartoffice-dashboard-cuti-empty";

        emptyElement.textContent =
            "Tidak ada pegawai yang sedang cuti.";

        list.appendChild(
            emptyElement
        );

        return;
    }

    /* ==================================================
       RENDER SEMUA DATA
    ================================================== */
    data.forEach(
        function(item){
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "smartoffice-dashboard-cuti-row";

            /* ==========================================
               AVATAR
            ========================================== */
            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "smartoffice-dashboard-cuti-avatar";

            const nama =
                String(
                    item?.nama || "-"
                )
                .trim();

            const namaParts =
                nama
                    .split(/\s+/)
                    .filter(Boolean);

            const inisial =
                namaParts.length >= 2
                    ? (
                        namaParts[0][0] +
                        namaParts[1][0]
                    )
                    : (
                        namaParts[0]?.[0] ||
                        "?"
                    );

            avatar.textContent =
                inisial.toUpperCase();

            /* ==========================================
               CONTENT
            ========================================== */
            const content =
                document.createElement(
                    "div"
                );

            content.className =
                "smartoffice-dashboard-cuti-content";

            const namaElement =
                document.createElement(
                    "strong"
                );

            namaElement.textContent =
                nama;

            const periodeElement =
                document.createElement(
                    "span"
                );

            periodeElement.textContent =
                smartofficeDashboardFormatTanggalCutiRange(
                    item?.tanggalAwal,
                    item?.tanggalAkhir
                );

            content.appendChild(
                namaElement
            );

            content.appendChild(
                periodeElement
            );

            /* ==========================================
               ROW
            ========================================== */
            row.appendChild(
                avatar
            );

            row.appendChild(
                content
            );

            list.appendChild(
                row
            );
        }
    );
}


/* ======================================================
   6.3 FORMAT TANGGAL CUTI
       INPUT  : YYYY-MM-DD
       OUTPUT : DD MMMM YYYY
====================================================== */
function smartofficeDashboardFormatTanggalCuti(
    tanggal
){
    if(
        !tanggal
    ){
        return "-";
    }

    const parts =
        String(
            tanggal
        ).split("-");
    if(
        parts.length !== 3
    ){
        return String(
            tanggal
        );
    }

    const tahun =
        Number(
            parts[0]
        );

    const bulan =
        Number(
            parts[1]
        );

    const hari =
        Number(
            parts[2]
        );

    const namaBulan = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    if(
        !tahun ||
        !bulan ||
        !hari ||
        !namaBulan[bulan - 1]
    ){
        return String(
            tanggal
        );
    }

    return `${hari} ${namaBulan[bulan - 1]} ${tahun}`;
}


/* ======================================================
   6.4 FORMAT RANGE TANGGAL CUTI
====================================================== */
function smartofficeDashboardFormatTanggalCutiRange(
    tanggalAwal,
    tanggalAkhir
){
    const awal =
        smartofficeDashboardFormatTanggalCuti(
            tanggalAwal
        );

    const akhir =
        smartofficeDashboardFormatTanggalCuti(
            tanggalAkhir
        );

    /* ==================================================
       JIKA CUTI HANYA 1 HARI
    ================================================== */
    if(
        tanggalAwal &&
        tanggalAkhir &&
        String(tanggalAwal) ===
            String(tanggalAkhir)
    ){
        return awal;
    }

    /* ==================================================
       JIKA CUTI LEBIH DARI 1 HARI
    ================================================== */
    if(
        awal === "-" &&
        akhir === "-"
    ){
        return "-";
    }

    if(
        awal === "-"
    ){
        return akhir;
    }

    if(
        akhir === "-"
    ){
        return awal;
    }

    return `${awal} – ${akhir}`;
}

