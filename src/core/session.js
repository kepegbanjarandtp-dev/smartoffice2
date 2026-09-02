import {
    smartofficeNavigate,
    smartofficeResetNavigationState
} from "./router.js";

import {
    smartofficeAbortAllRequests
} from "./api.js";

import {
    smartofficeForceHideGlobalLoading
} from "../components/loading/loading.js";

/* ======================================================
   SMARTOFFICE SESSION
====================================================== */
import {
    smartofficeStorageSet,
    smartofficeStorageGet,
    smartofficeStorageRemove
}
from "./storage.js";

const SMARTOFFICE_SESSION_KEY =
    "smartoffice_session";

/* ======================================================
   SAVE SESSION
====================================================== */
export function smartofficeSaveSession(
    data
){
    smartofficeStorageSet(
        SMARTOFFICE_SESSION_KEY,
        data
    );
}

/* ======================================================
   GET SESSION
====================================================== */
export function smartofficeGetSession(){
    return smartofficeStorageGet(
        SMARTOFFICE_SESSION_KEY
    );
}

/* ======================================================
   CLEAR SESSION
====================================================== */
export function smartofficeClearSession(){
    smartofficeStorageRemove(
        SMARTOFFICE_SESSION_KEY
    );
}

/* ======================================================
   CHECK SESSION
====================================================== */
export function smartofficeCheckSession(){
    return !!smartofficeGetSession();
}

/* ======================================================
   LOGOUT
====================================================== */
export async function smartofficeLogout(){

    /* =========================
       CONFIRM LOGOUT
    ========================= */
    if(
        !confirm(
            "Yakin ingin keluar?"
        )
    ){
        return;
    }

    /* =========================
       ABORT SEMUA REQUEST AKTIF
       USER LAMA
    ========================= */
    smartofficeAbortAllRequests();

    /* =========================
       RESET GLOBAL LOADING
    ========================= */
    smartofficeForceHideGlobalLoading();
    smartofficeResetNavigationState();

    /* =========================
       CLEAR SESSION
    ========================= */
    smartofficeClearSession();

    /* =========================
       HAPUS NAVBAR
    ========================= */
    document
        .getElementById(
            "smartofficeMobileNavbarFixed"
        )
        ?.remove();

    /* =========================
       NAVIGATE LOGIN
    ========================= */
    await smartofficeNavigate(
        "login"
    );
}