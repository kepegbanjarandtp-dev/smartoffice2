/* ======================================================
   SMARTOFFICE AUTH
====================================================== */
import {
    smartofficeSaveSession,
    smartofficeGetSession,
    smartofficeClearSession,
    smartofficeIsLogin
}
from "./session.js";

export function smartofficeLoginSession(
    user
){

    smartofficeSaveSession(
        user
    );

}

export function smartofficeLogoutSession(){

    smartofficeClearSession();

}

export function smartofficeGetUser(){

    return smartofficeGetSession();

}

export function smartofficeCheckLogin(){

    return smartofficeCheckSession();

}