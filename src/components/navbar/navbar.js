import "./navbar.css";

/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
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
   RENDER MOBILE NAVBAR
====================================================== */

/* =========================
   MOBILE NAVIGATION

   PARAM:
   - role
   - activeMenu

   MENU:
   - Home
   - Approval
   - Cuti
   - SPD
   - Akun
========================= */
export function smartofficeRenderMobileNavbar(
  role,
  activeMenu
){

  /* =========================
     VALIDATE SESSION
  ========================= */
  if(
    !smartofficeCheckSession()
  ){
    return;
  }

  /* =========================
     REMOVE OLD NAVBAR
  ========================= */
  const oldNavbar =
    document.getElementById(
      'smartofficeMobileNavbarFixed'
    );

  if(
    oldNavbar
  ){
    oldNavbar.remove();
  }

  /* =========================
     CREATE NAVBAR
  ========================= */
  const navbar =
    document.createElement(
      'div'
    );

  navbar.id =
    'smartofficeMobileNavbarFixed';

  navbar.className =
    'smartoffice-mobile-navbar';

  /* =========================
     NAVBAR HTML
  ========================= */
  let navbarHtml =
    '';

  /* =====================================================
     HOME MENU
  ====================================================== */
  navbarHtml += `

    <div
      id="smartofficeHomeButton"
      class="
        smartoffice-mobile-navbar-item
        ${
          activeMenu === 'home'
            ? 'active'
            : ''
        }
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
    role === 'PJ' ||
    role === 'KAPUS' ||
    role === 'ADMIN'
  ){

    navbarHtml += `

    <div
      id="smartofficeApprovalButton"
      class="
        smartoffice-mobile-navbar-item
        ${
          activeMenu === 'approval'
            ? 'active'
            : ''
        }
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
        ${
          activeMenu === 'cuti'
            ? 'active'
            : ''
        }
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
        ${
          activeMenu === 'spd'
            ? 'active'
            : ''
        }
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
     ACCOUNT MENU
  ====================================================== */
  navbarHtml += `

    <div
      class="smartoffice-mobile-navbar-item"
      id="smartofficeLogoutButton"
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

  /* =========================
     RENDER NAVBAR
  ========================= */
  navbar.innerHTML =
    navbarHtml;

  /* =========================
     APPEND TO BODY
  ========================= */
  document.body.appendChild(
    navbar
  );

  /* =========================
     LOGOUT EVENT
  ========================= */
  document
    .getElementById(
        "smartofficeHomeButton"
    )
    ?.addEventListener(
        "click",
        ()=>
            smartofficeNavigate(
                "dashboard"
            )
    );

    document
    .getElementById(
        "smartofficeApprovalButton"
    )
    ?.addEventListener(
        "click",
        ()=>
            smartofficeNavigate(
                "approval"
            )
    );

    document
    .getElementById(
        "smartofficeCutiButton"
    )
    ?.addEventListener(
        "click",
        ()=>
            smartofficeNavigate(
                "cuti"
            )
    );

    document
    .getElementById(
        "smartofficeSpdButton"
    )
    ?.addEventListener(
        "click",
        ()=>
            smartofficeNavigate(
                "spd"
            )
    );

    document
    .getElementById(
        "smartofficeLogoutButton"
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

    smartofficeClearSession();

    await smartofficeNavigate(
        "login"
    );

}