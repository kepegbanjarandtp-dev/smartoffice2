/* ==========================================================
   SMART OFFICE LOGIN
========================================================== */
import {
    smartofficeShowToast
}
from "../../components/toast/toast.js";

import {
    smartofficeLogin
}
from "../../services/auth.service.js";

import {
    smartofficeSaveSession
}
from "../../core/session.js";

import {
    smartofficeNavigate
}
from "../../core/router.js";

import {
    smartofficeHideNavbar
}
from "../../components/navbar/navbar.js";

import {
    smartofficeStartActivityMonitor
}
from "../../core/activity.js";

import {
    smartofficeToggleLoader
}
from "../../components/loader/loader.js";

import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";


/* ==========================================================
   LOGIN ELEMENT
========================================================== */
const smartofficeLoginElement = {
    form:null,
    nipInput:null,
    passwordInput:null,
    loginButton:null,
    loginButtonText:null,
    loginButtonLoader:null,
    rememberCheckbox:null,
    togglePasswordButton:null,
    passwordEye:null,
    passwordEyeOff:null
};


/* ==========================================================
   LOAD LOGIN PAGE
========================================================== */
export async function smartofficeLoadPage(){

    document.body.classList.add(
        "smartoffice-login-active"
    );

    /* =========================
       HIDE MOBILE NAVBAR
    ========================= */
    smartofficeHideNavbar();

    /* =========================
       CACHE ELEMENT
    ========================= */
    smartofficeLoginElement.form =
        document.getElementById(
            "smartofficeLoginForm"
        );

    smartofficeLoginElement.nipInput =
        document.getElementById(
            "smartofficeLoginNipInput"
        );

    smartofficeLoginElement.passwordInput =
        document.getElementById(
            "smartofficeLoginPasswordInput"
        );

    smartofficeLoginElement.loginButton =
        document.getElementById(
            "smartofficeLoginButton"
        );

    smartofficeLoginElement.loginButtonText =
        document.querySelector(
            ".smartoffice-login-button-text"
        );

    smartofficeLoginElement.loginButtonLoader =
        document.querySelector(
            ".smartoffice-login-button-loader"
        );

    smartofficeLoginElement.rememberCheckbox =
        document.getElementById(
            "smartofficeRememberMe"
        );

    smartofficeLoginElement.togglePasswordButton =
        document.getElementById(
            "smartofficeTogglePasswordButton"
        );

    smartofficeLoginElement.passwordEye =
        document.getElementById(
            "smartofficePasswordEye"
        );

    smartofficeLoginElement.passwordEyeOff =
        document.getElementById(
            "smartofficePasswordEyeOff"
        );

    /* =========================
       VALIDASI ELEMENT
    ========================= */
    if(
        !smartofficeLoginElement.form ||
        !smartofficeLoginElement.nipInput ||
        !smartofficeLoginElement.passwordInput ||
        !smartofficeLoginElement.loginButton
    ){
        return;
    }

    /* =========================
       AUTO FOCUS
    ========================= */
    smartofficeLoginElement.nipInput.focus();

    /* =========================
       INIT LOGIN
    ========================= */
    smartofficeInitializeLogin();
}


/* ==========================================================
   INITIALIZE LOGIN
========================================================== */
function smartofficeInitializeLogin(){

    /* =========================
       RESTORE REMEMBER ME
    ========================= */
    smartofficeRestoreRememberMe();

    /* =========================
       RESET LOGIN STATE
    ========================= */
    smartofficeSetLoadingState(
        false
    );

    /* =========================
       LOGIN SUBMIT
    ========================= */
    smartofficeLoginElement.form
        .addEventListener(
            "submit",
            smartofficeHandleLogin
        );

    /* =========================
       TOGGLE PASSWORD
    ========================= */
    smartofficeLoginElement
        .togglePasswordButton
        ?.addEventListener(
            "click",
            smartofficeTogglePassword
        );

    /* =========================
       PASSWORD SHORTCUT
    ========================= */
    smartofficeLoginElement
        .passwordInput
        .addEventListener(
            "keydown",
            smartofficeHandlePasswordShortcut
        );
}


/* ==========================================================
   RESTORE REMEMBER ME
========================================================== */
function smartofficeRestoreRememberMe(){

    const savedNip =
        localStorage.getItem(
            "smartoffice_saved_nip"
        );

    const savedPassword =
        localStorage.getItem(
            "smartoffice_saved_password"
        );

    smartofficeLoginElement
        .nipInput
        .value =
            savedNip || "";

    smartofficeLoginElement
        .passwordInput
        .value =
            savedPassword || "";

    if(
        smartofficeLoginElement
            .rememberCheckbox
    ){
        smartofficeLoginElement
            .rememberCheckbox
            .checked =
                Boolean(
                    savedPassword
                );
    }
}


/* ==========================================================
   PASSWORD TOGGLE
========================================================== */
function smartofficeTogglePassword(){

    const showPassword =
        smartofficeLoginElement
            .passwordInput
            .type ===
            "password";

    smartofficeLoginElement
        .passwordInput
        .type =
            showPassword
                ? "text"
                : "password";

    smartofficeLoginElement
        .passwordEye
        ?.classList.toggle(
            "smartoffice-login-password-hidden",
            showPassword
        );

    smartofficeLoginElement
        .passwordEyeOff
        ?.classList.toggle(
            "smartoffice-login-password-hidden",
            !showPassword
        );
}


/* ==========================================================
   PASSWORD SHORTCUT
========================================================== */
function smartofficeHandlePasswordShortcut(
    event
){
    if(
        event.key !==
        "Escape"
    ){
        return;
    }

    smartofficeLoginElement
        .passwordInput
        .type =
            "password";

    smartofficeLoginElement
        .passwordEye
        ?.classList.remove(
            "smartoffice-login-password-hidden"
        );

    smartofficeLoginElement
        .passwordEyeOff
        ?.classList.add(
            "smartoffice-login-password-hidden"
        );
}


/* ==========================================================
   HANDLE LOGIN
========================================================== */
async function smartofficeHandleLogin(
    event
){

    /* =========================
       PREVENT SUBMIT
    ========================= */
    event.preventDefault();

    /* =========================
       PREVENT DOUBLE SUBMIT
    ========================= */
    if(
        smartofficeLoginElement
            .loginButton
            .disabled
    ){
        return;
    }

    /* =========================
       LOGIN DATA
    ========================= */
    const nip =
        smartofficeLoginElement
            .nipInput
            .value
            .trim();

    const password =
        smartofficeLoginElement
            .passwordInput
            .value
            .trim();

    const rememberMe =
        smartofficeLoginElement
            .rememberCheckbox
            ?.checked || false;

    /* =========================
       VALIDASI FORM
    ========================= */
    if(
        !nip ||
        !password
    ){
        smartofficeShowToast(
            "Lengkapi login terlebih dahulu.",
            "error"
        );

        return;
    }

    /* =========================
       LOADING
    ========================= */
    smartofficeSetLoadingState(
        true
    );

    try{

        /* =========================
           LOGIN REQUEST
        ========================= */
        await smartofficeProcessLogin(
            nip,
            password,
            rememberMe
        );
    }

    catch(error){
        console.error(
            error
        );

        smartofficeShowToast(
            "Terjadi kesalahan koneksi.",
            "error"
        );
    }

    finally{
        smartofficeSetLoadingState(
            false
        );
    }
}


/* ==========================================================
   SET LOADING STATE
========================================================== */
function smartofficeSetLoadingState(
    isLoading
){

    if(
        !smartofficeLoginElement
            ?.loginButton
    ){
        return;
    }

    smartofficeLoginElement
        .loginButton
        .disabled =
            isLoading;

    smartofficeLoginElement
        .nipInput
        .disabled =
            isLoading;

    smartofficeLoginElement
        .passwordInput
        .disabled =
            isLoading;

    smartofficeLoginElement
        .rememberCheckbox
        .disabled =
            isLoading;

    smartofficeToggleLoader(
        smartofficeLoginElement
            .loginButton,
        isLoading
    );
}


/* ==========================================================
   PROCESS LOGIN
========================================================== */
async function smartofficeProcessLogin(
    nip,
    password,
    rememberMe
){

    /* =========================
       GLOBAL LOADING
    ========================= */
    smartofficeShowGlobalLoading(
        "Memverifikasi akun..."
    );


    /* =========================
       LOGIN TIMER START - LOG
    ========================= */
    const t0 =
        performance.now();


    try{

        /* =========================
           LOGIN REQUEST
        ========================= */
        const response =
            await smartofficeLogin(
                nip,
                password
            );


        /* =========================
           LOGIN TIMER API - LOG
        ========================= */
        const t1 =
            performance.now();


        /* =========================
           VALIDASI RESPONSE
        ========================= */
        if(
            !response ||
            !response.success
        ){

            smartofficeShowToast(
                response?.message ||
                "Login gagal.",
                "error"
            );

            return;
        }


        /* =========================
           SAVE SESSION
        ========================= */
        smartofficeSaveSession(
            response.data
        );


        /* =========================
           LOGIN TIMER SESSION - LOG
        ========================= */
        const t2 =
            performance.now();


        console.log(
            "API      :",
            ((t1 - t0) / 1000).toFixed(2),
            "detik"
        );


        console.log(
            "Session  :",
            ((t2 - t1) / 1000).toFixed(2),
            "detik"
        );


        console.log(
            "Total    :",
            ((t2 - t0) / 1000).toFixed(2),
            "detik"
        );


        /* =========================
           START ACTIVITY MONITOR
        ========================= */
        smartofficeStartActivityMonitor();


        /* =========================
           REMEMBER ME
        ========================= */
        smartofficeSaveRememberMe(
            rememberMe,
            nip,
            password
        );


        /* =========================
           LOGIN SUCCESS
        ========================= */
        smartofficeShowToast(
            "Login berhasil.",
            "success"
        );


        /* =========================
           LOAD DASHBOARD
        ========================= */
        await smartofficeNavigate(
            "dashboard"
        );

    }
    catch(error){

        console.error(
            "SMARTOFFICE LOGIN ERROR:",
            error
        );

        smartofficeShowToast(
            error?.message ||
            "Terjadi kesalahan saat login.",
            "error"
        );

    }
    finally{

        /* =========================
           HIDE GLOBAL LOADING
        ========================= */
        smartofficeHideGlobalLoading();

    }

}


/* ==========================================================
   SAVE REMEMBER ME
========================================================== */
function smartofficeSaveRememberMe(
    rememberMe,
    nip,
    password
){
    if(
        rememberMe
    ){
        localStorage.setItem(
            "smartoffice_saved_nip",
            nip
        );
        localStorage.setItem(
            "smartoffice_saved_password",
            password
        );

        return;
    }
    localStorage.removeItem(
        "smartoffice_saved_nip"
    );
    localStorage.removeItem(
        "smartoffice_saved_password"
    );
}


/* ==========================================================
   DESTROY LOGIN PAGE
========================================================== */
export async function smartofficeDestroyPage(){

    document.body.classList.add(
        "smartoffice-login-active"
    );
    
    smartofficeLoginElement
        .form
        ?.removeEventListener(
            "submit",
            smartofficeHandleLogin
        );

    smartofficeLoginElement
        .togglePasswordButton
        ?.removeEventListener(
            "click",
            smartofficeTogglePassword
        );

    smartofficeLoginElement
        .passwordInput
        ?.removeEventListener(
            "keydown",
            smartofficeHandlePasswordShortcut
        );

    smartofficeClearLoginElement();
}


/* ==========================================================
   LOGIN CLEANUP
========================================================== */
function smartofficeClearLoginElement(){

    smartofficeLoginElement.form =
        null;

    smartofficeLoginElement.nipInput =
        null;

    smartofficeLoginElement.passwordInput =
        null;

    smartofficeLoginElement.loginButton =
        null;

    smartofficeLoginElement.loginButtonText =
        null;

    smartofficeLoginElement.loginButtonLoader =
        null;

    smartofficeLoginElement.rememberCheckbox =
        null;

    smartofficeLoginElement.togglePasswordButton =
        null;

    smartofficeLoginElement.passwordEye =
        null;

    smartofficeLoginElement.passwordEyeOff =
        null;
}