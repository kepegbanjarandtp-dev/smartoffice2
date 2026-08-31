import "./navbar.css";


/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeClearSession
} from "../../core/session.js";


import {
    smartofficeNavigate
} from "../../core/router.js";



/* ======================================================
   SMARTOFFICE NAVBAR
====================================================== */
let smartofficeNavbarElement =
    null;


/* ======================================================
   INITIALIZE NAVBAR
====================================================== */
export function smartofficeInitializeNavbar(){
    smartofficeNavbarElement =
        document.getElementById(
            "smartofficeMobileNavbarFixed"
        );
}


/* ======================================================
   SHOW NAVBAR
====================================================== */
export function smartofficeShowNavbar(){
    if(
        !smartofficeNavbarElement
    ){
        smartofficeNavbarElement =
            document.getElementById(
                "smartofficeMobileNavbarFixed"
            );
    }

    if(
        !smartofficeNavbarElement
    ){
        return;
    }

    smartofficeNavbarElement
        .classList.remove(
            "hidden"
        );
}


/* ======================================================
   HIDE NAVBAR
====================================================== */
export function smartofficeHideNavbar(){
    if(
        !smartofficeNavbarElement
    ){
        smartofficeNavbarElement =
            document.getElementById(
                "smartofficeMobileNavbarFixed"
            );
    }

    if(
        !smartofficeNavbarElement
    ){
        return;
    }

    smartofficeNavbarElement
        .classList.add(
            "hidden"
        );
}


/* ======================================================
   TOGGLE NAVBAR
====================================================== */
export function smartofficeToggleNavbar(
    isShow
){
    if(
        isShow
    ){
        smartofficeShowNavbar();
        return;
    }

    smartofficeHideNavbar();
}


/* ======================================================
   DESTROY NAVBAR
====================================================== */
export function smartofficeDestroyNavbar(){
    smartofficeNavbarElement =
        null;
}


/* ======================================================
   SET ACTIVE MENU
====================================================== */
function smartofficeSetActiveNavbar(
    activeMenu
){
    const navbar =
        document.getElementById(
            "smartofficeMobileNavbarFixed"
        );

    if(
        !navbar
    ){
        return;
    }


    /* ==================================================
       RESET SEMUA ACTIVE
    ================================================== */
    navbar
        .querySelectorAll(
            ".smartoffice-mobile-navbar-item"
        )
        .forEach(
            function(item){

                item.classList.remove(
                    "active"
                );
            }
        );


    /* ==================================================
       DASHBOARD = HOME
    ================================================== */
    if(
        activeMenu === "dashboard"
    ){
        activeMenu =
            "home";
    }


    /* ==================================================
       CARI MENU AKTIF
    ================================================== */
    const activeMap = {
        home:
            "smartofficeHomeButton",

        approval:
            "smartofficeApprovalButton",

        cuti:
            "smartofficeCutiButton",

        spd:
            "smartofficeSpdButton"
    };

    const buttonId =
        activeMap[
            activeMenu
        ];

    if(
        !buttonId
    ){
        return;
    }

    const button =
        document.getElementById(
            buttonId
        );

    if(
        button
    ){
        button.classList.add(
            "active"
        );
    }
}


/* ======================================================
   RENDER MOBILE NAVBAR

   PARAM:
   - role
   - activeMenu

   CATATAN:
   Navbar hanya dibuat SATU KALI.

   Jika navbar sudah ada:
   - tidak dibuat ulang
   - tidak dihapus
   - hanya active menu yang diubah
====================================================== */
export function smartofficeRenderMobileNavbar(
    role,
    activeMenu
){

    /* ==================================================
       VALIDATE SESSION
    ================================================== */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* ==================================================
       GET ROLE DARI SESSION
       Jika role tidak dikirim
    ================================================== */
    if(
        !role
    ){
        const sessionData =
            smartofficeGetSession();

        role =
            sessionData?.role || "";
    }

    /* ==================================================
       NAVBAR SUDAH ADA
       JANGAN BUAT ULANG
    ================================================== */
    const existingNavbar =
        document.getElementById(
            "smartofficeMobileNavbarFixed"
        );
    if(
        existingNavbar
    ){
        smartofficeNavbarElement =
            existingNavbar;

        smartofficeSetActiveNavbar(
            activeMenu
        );

        return;
    }

    /* ==================================================
       CREATE NAVBAR
       HANYA PERTAMA KALI
    ================================================== */
    const navbar =
        document.createElement(
            "div"
        );

    navbar.id =
        "smartofficeMobileNavbarFixed";

    navbar.className =
        "smartoffice-mobile-navbar";

    /* ==================================================
       NAVBAR HTML
    ================================================== */
    let navbarHtml =
        "";

    /* =====================================================
       HOME MENU
    ====================================================== */
    navbarHtml += `
        <div
            id="smartofficeHomeButton"
            class="
                smartoffice-mobile-navbar-item
            "
        >
            <span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="
                        M3 9.5
                        12 3
                        l9 6.5
                        V20
                        a1 1 0 0 1-1 1
                        h-5v-7H9v7H4
                        a1 1 0 0 1-1-1Z
                    "/>
                </svg>
            </span>

            <small>
                Home
            </small>
        </div>
    `;

    /* =====================================================
       APPROVAL MENU
    ====================================================== */
    if(
        role === "SUPERADMIN" ||
        role === "PJ" ||
        role === "KAPUS" ||
        role === "ADMIN"
    ){
        navbarHtml += `
            <div
                id="smartofficeApprovalButton"
                class="
                    smartoffice-mobile-navbar-item
                "
            >
                <span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="
                            M9 11l3 3L22 4
                        "/>

                        <path d="
                            M21 12v7
                            a2 2 0 0 1-2 2H5
                            a2 2 0 0 1-2-2V5
                            a2 2 0 0 1 2-2h11
                        "/>
                    </svg>
                </span>

                <small>
                    Approval
                </small>
            </div>
        `;
    }

    /* =====================================================
       CUTI MENU
    ====================================================== */
    navbarHtml += `
        <div
            id="smartofficeCutiButton"
            class="
                smartoffice-mobile-navbar-item
            "
        >
            <span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                    />

                    <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                    />

                    <line
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="6"
                    />

                    <line
                        x1="3"
                        y1="10"
                        x2="21"
                        y2="10"
                    />
                </svg>
            </span>

            <small>
                Cuti
            </small>
        </div>
    `;

    /* =====================================================
       SPD MENU
    ====================================================== */
    navbarHtml += `
        <div
            id="smartofficeSpdButton"
            class="
                smartoffice-mobile-navbar-item
            "
        >
            <span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="
                        M3 7h18
                    "/>

                    <path d="
                        M6 3h12l3 4
                        v13
                        a1 1 0 0 1-1 1H4
                        a1 1 0 0 1-1-1V7l3-4Z
                    "/>

                    <path d="
                        M8 11h8
                    "/>

                    <path d="
                        M8 15h5
                    "/>
                </svg>
            </span>

            <small>
                SPD
            </small>
        </div>
    `;

    /* =====================================================
       ACCOUNT / LOGOUT
    ====================================================== */
    navbarHtml += `
        <div
            class="
                smartoffice-mobile-navbar-item
            "
            id="smartofficeNavbarLogoutButton"
        >
            <span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="
                        M20 21
                        a8 8 0 0 0-16 0
                    "/>

                    <circle
                        cx="12"
                        cy="7"
                        r="4"
                    />
                </svg>
            </span>

            <small>
                Logout
            </small>
        </div>
    `;

    /* ==================================================
       RENDER NAVBAR
    ================================================== */
    navbar.innerHTML =
        navbarHtml;

    /* ==================================================
       APPEND TO BODY
    ================================================== */
    document.body.appendChild(
        navbar
    );

    /* ==================================================
       SAVE REFERENCE
    ================================================== */
    smartofficeNavbarElement =
        navbar;

    /* ==================================================
       SET ACTIVE AWAL
    ================================================== */
    smartofficeSetActiveNavbar(
        activeMenu
    );

    /* ==================================================
       HOME EVENT
       ACTIVE DIUBAH SEBELUM NAVIGASI
    ================================================== */
    document
        .getElementById(
            "smartofficeHomeButton"
        )
        ?.addEventListener(
            "click",
            function(){
                smartofficeSetActiveNavbar(
                    "home"
                );

                smartofficeNavigate(
                    "dashboard"
                );
            }
        );

    /* ==================================================
       APPROVAL EVENT
       ACTIVE DIUBAH SEBELUM NAVIGASI
    ================================================== */
    document
        .getElementById(
            "smartofficeApprovalButton"
        )
        ?.addEventListener(
            "click",
            function(){
                smartofficeSetActiveNavbar(
                    "approval"
                );

                smartofficeNavigate(
                    "approval"
                );
            }
        );

    /* ==================================================
       CUTI EVENT
       ACTIVE DIUBAH SEBELUM NAVIGASI
    ================================================== */
    document
        .getElementById(
            "smartofficeCutiButton"
        )
        ?.addEventListener(
            "click",
            function(){
                smartofficeSetActiveNavbar(
                    "cuti"
                );

                smartofficeNavigate(
                    "cuti"
                );
            }
        );

    /* ==================================================
       SPD EVENT
       ACTIVE DIUBAH SEBELUM NAVIGASI
    ================================================== */
    document
        .getElementById(
            "smartofficeSpdButton"
        )
        ?.addEventListener(
            "click",
            function(){
                smartofficeSetActiveNavbar(
                    "spd"
                );

                smartofficeNavigate(
                    "spd"
                );
            }
        );


    /* ==================================================
       LOGOUT EVENT
    ================================================== */
    document
        .getElementById(
            "smartofficeNavbarLogoutButton"
        )
        ?.addEventListener(
            "click",
            smartofficeNavbarLogout
        );
}


/* ======================================================
   NAVBAR LOGOUT
====================================================== */
async function smartofficeNavbarLogout(){
    if(
        !confirm(
            "Yakin ingin keluar?"
        )
    ){
        return;
    }

    /* =========================
       CLEAR SESSION
    ========================= */
    smartofficeClearSession();

    /* =========================
       REMOVE NAVBAR
    ========================= */
    document
        .getElementById(
            "smartofficeMobileNavbarFixed"
        )
        ?.remove();

    smartofficeNavbarElement =
        null;

    /* =========================
       NAVIGATE LOGIN
    ========================= */
    await smartofficeNavigate(
        "login"
    );
}