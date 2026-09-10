// ============================================================
// SMART OFFICE V2.1
// NAVBAR COMPONENT
// ============================================================
import './navbar.css';

import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeClearSession
} from '../../core/session.js';

import {
    smartofficeNavigate
} from '../../core/router.js';

import {
    smartofficeToggleNotificationPanel,
    smartofficeRefreshNotificationBadge,
    smartofficeDestroyNotification
} from '../notifikasi/notifikasi_PWA.js';


// ============================================================
// GLOBAL NAVBAR ELEMENT
// ============================================================
let smartofficeNavbarElement = null;


// ============================================================
// INITIALIZE NAVBAR
// ============================================================
export function smartofficeInitializeNavbar(
    role = null,
    activeMenu = 'home'
){
    const sessionValid =
        smartofficeCheckSession();

    if(!sessionValid){
        smartofficeHideNavbar();
        return;
    }

    smartofficeRenderMobileNavbar(
        role,
        activeMenu
    );
}


// ============================================================
// SHOW NAVBAR
// ============================================================
export function smartofficeShowNavbar(){
    if(smartofficeNavbarElement){
        smartofficeNavbarElement.classList.remove(
            'smartoffice-navbar-hidden'
        );
    }
}


// ============================================================
// HIDE NAVBAR
// ============================================================
export function smartofficeHideNavbar(){

    if(smartofficeNavbarElement){
        smartofficeNavbarElement.classList.add(
            'smartoffice-navbar-hidden'
        );
    }

    // Pastikan navbar yang ada di DOM ikut tersembunyi
    const navbar =
        document.getElementById(
            'smartofficeMobileNavbar'
        );

    if(navbar){
        navbar.classList.add(
            'smartoffice-navbar-hidden'
        );
    }
}


// ============================================================
// TOGGLE NAVBAR
// ============================================================
export function smartofficeToggleNavbar(){
    if(!smartofficeNavbarElement){
        return;
    }

    smartofficeNavbarElement.classList.toggle(
        'smartoffice-navbar-hidden'
    );
}


// ============================================================
// SET ACTIVE MENU
// ============================================================
export function smartofficeSetActiveNavbar(
    activeMenu
){
    if(!smartofficeNavbarElement){
        return;
    }

    const menuButtons = {
        home:
            'smartofficeHomeButton',

        cuti:
            'smartofficeCutiButton',

        notifikasi:
            'smartofficeNotificationButton',

        'dokumen-saya':
            'smartofficeDokumenSayaButton'
    };

    Object.values(menuButtons).forEach(
        function(buttonId){
            const button =
                document.getElementById(
                    buttonId
                );
            if(button){
                button.classList.remove(
                    'active'
                );
            }
        }
    );

    const activeButtonId =
        menuButtons[activeMenu];

    if(activeButtonId){
        const activeButton =
            document.getElementById(
                activeButtonId
            );
        if(activeButton){
            activeButton.classList.add(
                'active'
            );
        }
    }
}


// ============================================================
// RENDER MOBILE NAVBAR
// ============================================================
export function smartofficeRenderMobileNavbar(
    role = null,
    activeMenu = 'home'
){

    // --------------------------------------------------------
    // CHECK SESSION
    // --------------------------------------------------------
    const sessionValid =
        smartofficeCheckSession();

    if(!sessionValid){
        smartofficeHideNavbar();
        return;
    }


    // --------------------------------------------------------
    // GET SESSION
    // --------------------------------------------------------
    const session =
        smartofficeGetSession();

    if(!session){
        smartofficeHideNavbar();
        return;
    }

    // --------------------------------------------------------
    // GET ROLE
    // --------------------------------------------------------
    if(!role){
        role =
            session.role ||
            'USER';
    }

    // --------------------------------------------------------
    // JIKA NAVBAR SUDAH ADA
    // --------------------------------------------------------
    if(smartofficeNavbarElement){
        smartofficeShowNavbar();
        smartofficeSetActiveNavbar(
            activeMenu
        );
        return;
    }

    // ========================================================
    // CREATE NAVBAR
    // ========================================================
    const navbar =
        document.createElement(
            'nav'
        );

    navbar.className =
        'smartoffice-mobile-navbar';

    navbar.id =
        'smartofficeMobileNavbar';

    // ========================================================
    // NAVBAR CONTAINER
    // ========================================================
    const navbarContainer =
        document.createElement(
            'div'
        );
    navbarContainer.className =
        'smartoffice-navbar-container';

    // ========================================================
    // HOME
    // ========================================================
    const homeButton =
        document.createElement(
            'button'
        );

    homeButton.type =
        'button';

    homeButton.id =
        'smartofficeHomeButton';

    homeButton.className =
        'smartoffice-mobile-navbar-item';

    homeButton.innerHTML = `
        <span>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 10.5L12 3l9 7.5"></path>
                <path d="M5 9.5V21h14V9.5"></path>
                <path d="M9 21v-6h6v6"></path>
            </svg>
        </span>
        <small>
            Home
        </small>
    `;

    homeButton.addEventListener(
        'click',
        function(){
            smartofficeNavigate(
                'dashboard'
            );
        }
    );

    // ========================================================
    // CUTI
    // ========================================================
    const cutiButton =
        document.createElement(
            'button'
        );

    cutiButton.type =
        'button';

    cutiButton.id =
        'smartofficeCutiButton';

    cutiButton.className =
        'smartoffice-mobile-navbar-item';

    cutiButton.innerHTML = `
        <span>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="2"
                ></rect>
                <line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6"
                ></line>
                <line
                    x1="8"
                    y1="2"
                    x2="8"
                    y2="6"
                ></line>
                <line
                    x1="3"
                    y1="10"
                    x2="21"
                    y2="10"
                ></line>
            </svg>
        </span>

        <small>
            Cuti
        </small>
    `;

    cutiButton.addEventListener(
        'click',
        function(){
            smartofficeNavigate(
                'cuti'
            );
        }
    );


    // ========================================================
    // NOTIFIKASI
    // ========================================================
    const notificationButton =
        document.createElement(
            'button'
        );

    notificationButton.type =
        'button';

    notificationButton.id =
        'smartofficeNotificationButton';

    notificationButton.className =
        'smartoffice-mobile-navbar-item';

    notificationButton.innerHTML = `
        <span class="smartoffice-notification-icon">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                ></path>
                <path
                    d="M13.73 21a2 2 0 0 1-3.46 0"
                ></path>
            </svg>

            <span
                id="smartofficeNotificationBadge"
                class="smartoffice-notification-badge"
                hidden
            >
                0
            </span>
        </span>
        <small>
            Notifikasi
        </small>
    `;

    notificationButton.addEventListener(
        'click',
        function(){

            smartofficeToggleNotificationPanel();

        }
    );

    // ========================================================
    // DOKUMEN SAYA
    // ========================================================
    const dokumenSayaButton =
        document.createElement(
            'button'
        );

    dokumenSayaButton.type =
        'button';

    dokumenSayaButton.id =
        'smartofficeDokumenSayaButton';

    dokumenSayaButton.className =
        'smartoffice-mobile-navbar-item';

    dokumenSayaButton.innerHTML = `
        <span>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                ></path>
                <polyline
                    points="14 2 14 8 20 8"
                ></polyline>
                <line
                    x1="8"
                    y1="13"
                    x2="16"
                    y2="13"
                ></line>
                <line
                    x1="8"
                    y1="17"
                    x2="16"
                    y2="17"
                ></line>
            </svg>
        </span>
        <small>
            Dokumen Saya
        </small>
    `;

    dokumenSayaButton.addEventListener(
        'click',
        function(){
            smartofficeNavigate(
                'dokumen-saya'
            );
        }
    );

    // ========================================================
    // LOGOUT
    // ========================================================
    const logoutButton =
        document.createElement(
            'button'
        );

    logoutButton.type =
        'button';

    logoutButton.id =
        'smartofficeNavbarLogoutButton';

    logoutButton.className =
        'smartoffice-mobile-navbar-item';

    logoutButton.innerHTML = `
        <span>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                ></path>
                <polyline
                    points="16 17 21 12 16 7"
                ></polyline>
                <line
                    x1="21"
                    y1="12"
                    x2="9"
                    y2="12"
                ></line>
            </svg>
        </span>
        <small>
            Logout
        </small>
    `;

    logoutButton.addEventListener(
        'click',
        smartofficeNavbarLogout
    );

    // ========================================================
    // APPEND MENU
    // ========================================================
    navbarContainer.appendChild(
        homeButton
    );

    navbarContainer.appendChild(
        cutiButton
    );

    navbarContainer.appendChild(
        notificationButton
    );

    navbarContainer.appendChild(
        dokumenSayaButton
    );

    navbarContainer.appendChild(
        logoutButton
    );

    // ========================================================
    // APPEND NAVBAR
    // ========================================================
    navbar.appendChild(
        navbarContainer
    );

    document.body.appendChild(
        navbar
    );

    // ========================================================
    // SAVE GLOBAL ELEMENT
    // ========================================================
    smartofficeNavbarElement =
        navbar;

    // ========================================================
    // LOAD NOTIFICATION BADGE
    // ========================================================
    smartofficeRefreshNotificationBadge();

    // ========================================================
    // SET ACTIVE MENU
    // ========================================================
    smartofficeSetActiveNavbar(
        activeMenu
    );
}


// ============================================================
// LOGOUT
// ============================================================
function smartofficeNavbarLogout(){
    const confirmed =
        window.confirm(
            'Apakah Anda yakin ingin keluar dari Smart Office?'
        );
    if(!confirmed){
        return;
    }

    // ========================================================
    // DESTROY NOTIFICATION STATE
    // ========================================================
    smartofficeDestroyNotification();

    // --------------------------------------------------------
    // CLEAR SESSION
    // --------------------------------------------------------
    smartofficeClearSession();

    // --------------------------------------------------------
    // REMOVE NAVBAR
    // --------------------------------------------------------
    smartofficeDestroyNavbar();

    // --------------------------------------------------------
    // NAVIGATE LOGIN
    // --------------------------------------------------------
    smartofficeNavigate(
        'login'
    );
}


// ============================================================
// DESTROY NAVBAR
// ============================================================
export function smartofficeDestroyNavbar(){
    if(smartofficeNavbarElement){
        smartofficeNavbarElement.remove();
        smartofficeNavbarElement =
            null;
    }
}