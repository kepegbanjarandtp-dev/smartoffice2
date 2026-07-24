import {
    smartofficeNavigate
} from "./router.js";

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
       CLEAR SESSION
    ========================= */
    smartofficeClearSession();

    /* =========================
       NAVIGATE LOGIN
    ========================= */
    await smartofficeNavigate(
        "login"
    );

}