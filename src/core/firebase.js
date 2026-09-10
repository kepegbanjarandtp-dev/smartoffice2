/* =========================================================
   SMART OFFICE V2.1
   FIREBASE CONFIGURATION
========================================================= */
import { initializeApp } from "firebase/app";

import {
    getMessaging,
    register,
    onRegistered,
    onUnregistered,
    onMessage
} from "firebase/messaging";

import { smartofficeApi } from "./api.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */
const firebaseConfig = {
    apiKey: "AIzaSyBg_ccqzIYFYz9-d6O-nQwZyvCEHkDZsA0",
    authDomain: "smartoffice-v2.firebaseapp.com",
    projectId: "smartoffice-v2",
    storageBucket: "smartoffice-v2.firebasestorage.app",
    messagingSenderId: "814086580443",
    appId: "1:814086580443:web:d1b4106b887daa75f644fe"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */
const smartofficeFirebaseApp =
    initializeApp(firebaseConfig);


/* =========================================================
   FIREBASE MESSAGING
========================================================= */
const smartofficeMessaging =
    getMessaging(
        smartofficeFirebaseApp
    );


/* =========================================================
   VAPID PUBLIC KEY
========================================================= */
const SMARTOFFICE_FCM_VAPID_KEY =
    "BHLvAdvxETbqEaulGDOBAH9VuB2t2vHnqNM59Y2waEHytT12Au3OO1jlx7ohf-pmQwfCne0UzrftllhtOpZg9DE";


/* =========================================================
   SERVICE WORKER
========================================================= */
let smartofficeMessagingRegistration = null;


/* =========================================================
   GET SERVICE WORKER REGISTRATION
========================================================= */
async function smartofficeGetMessagingServiceWorker(){

    if(
        !("serviceWorker" in navigator)
    ){
        throw new Error(
            "Browser tidak mendukung Service Worker."
        );
    }

    if(
        smartofficeMessagingRegistration
    ){
        return smartofficeMessagingRegistration;
    }

    smartofficeMessagingRegistration =
        await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
        );

    await navigator.serviceWorker.ready;

    return smartofficeMessagingRegistration;
}


/* =========================================================
   REGISTER PUSH
========================================================= */
export async function smartofficeRegisterFCM(){

    try{
        /* =========================
           CEK SUPPORT
        ========================= */
        if(
            !("Notification" in window) ||
            !("serviceWorker" in navigator)
        ){
            console.warn(
                "[Smart Office] Browser tidak mendukung Web Push."
            );

            return {
                success: false,
                message:
                    "Browser tidak mendukung Web Push."
            };
        }

        /* =========================
           REQUEST PERMISSION
        ========================= */
        const permission =
            await Notification.requestPermission();

        if(
            permission !== "granted"
        ){
            console.warn(
                "[Smart Office] Izin notifikasi tidak diberikan."
            );

            return {
                success: false,
                message:
                    "Izin notifikasi tidak diberikan."
            };
        }

        /* =========================
           SERVICE WORKER
        ========================= */
        const registration =
            await smartofficeGetMessagingServiceWorker();

        /* =========================
           CALLBACK FID
        ========================= */
        const unregisterRegistered =
            onRegistered(
                smartofficeMessaging,
                async (installationId) => {
                    console.log(
                        "[Smart Office] Firebase Installation ID:",
                        installationId
                    );

                    await smartofficeRegisterPushToken(
                        installationId
                    );
                }
            );

        /* =========================
           CALLBACK UNREGISTERED
        ========================= */
        onUnregistered(
            smartofficeMessaging,
            async (installationId) => {
                console.warn(
                    "[Smart Office] FID tidak lagi terdaftar:",
                    installationId
                );
                /*
                 * Nanti kita buat endpoint GAS
                 * untuk menghapus FID ini.
                 */
            }
        );

        /* =========================
           REGISTER KE FCM
        ========================= */
        await register(
            smartofficeMessaging,
            {
                vapidKey:
                    SMARTOFFICE_FCM_VAPID_KEY,

                serviceWorkerRegistration:
                    registration
            }
        );

        console.log(
            "[Smart Office] Register FCM berhasil dijalankan."
        );

        return {
            success: true,
            message:
                "Registrasi push berhasil dijalankan.",
            unsubscribe:
                unregisterRegistered
        };
    }
    catch(error){

        console.error(
            "[Smart Office] Gagal register FCM:",
            error
        );

        return {
            success: false,
            message:
                error?.message ||
                "Gagal register FCM."
        };
    }
}


/* =========================================================
   REGISTER FID KE BACKEND GAS
========================================================= */
export async function smartofficeRegisterPushToken(
    installationId
){
    try{
        if(
            !installationId
        ){
            console.warn(
                "[Smart Office] Firebase Installation ID kosong."
            );

            return {
                success: false,
                message:
                    "Firebase Installation ID kosong."
            };
        }

        /* =========================
           AMBIL SESSION
        ========================= */
        const sessionRaw =
            localStorage.getItem(
                "smartoffice_session"
            );
        if(
            !sessionRaw
        ){
            console.warn(
                "[Smart Office] Session tidak ditemukan."
            );

            return {
                success: false,
                message:
                    "Session tidak ditemukan."
            };
        }

        let session;

        try{
            session =
                JSON.parse(
                    sessionRaw
                );
        }
        catch(error){
            console.error(
                "[Smart Office] Session tidak valid:",
                error
            );

            return {
                success: false,
                message:
                    "Session tidak valid."
            };
        }

        /* =========================
           AMBIL NIP
        ========================= */
        const nip =
            String(
                session?.nip ||
                session?.NIP ||
                ""
            ).trim();

        if(
            !nip
        ){
            console.warn(
                "[Smart Office] NIP login tidak ditemukan."
            );

            return {
                success: false,
                message:
                    "NIP login tidak ditemukan."
            };
        }

        /* =========================
           KIRIM FID KE GAS
        ========================= */
        const response =
            await smartofficeApi(
                "smartofficeRegisterPushToken",
                {
                    nip: nip,
                    token: installationId
                }
            );

        console.log(
            "[Smart Office] Register Push FID:",
            response
        );

        return response;
    }
    catch(error){
        console.error(
            "[Smart Office] Gagal register Push FID:",
            error
        );

        return {
            success: false,
            message:
                error?.message ||
                "Gagal mendaftarkan Push FID."
        };
    }
}


/* =========================================================
   FOREGROUND MESSAGE
========================================================= */

export function smartofficeListenFCMMessage(
    callback
){
    return onMessage(
        smartofficeMessaging,
        (payload) => {

            console.log(
                "[Smart Office] Foreground push:",
                payload
            );

            if(
                typeof callback === "function"
            ){
                callback(
                    payload
                );
            }
        }
    );
}


/* =========================================================
   EXPORT
========================================================= */
export {
    smartofficeFirebaseApp,
    smartofficeMessaging,
    SMARTOFFICE_FCM_VAPID_KEY
};