/* =========================================================
   SMART OFFICE V2.1
   FIREBASE CONFIGURATION
========================================================= */

import { initializeApp } from "firebase/app";

import {
    getInstallations,
    deleteInstallations
} from "firebase/installations"; 

import {
    getMessaging,
    register,
    unregister,
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

const smartofficeInstallations =
    getInstallations(
        smartofficeFirebaseApp
    );


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
   STATE
========================================================= */

let smartofficeMessagingRegistration = null;

let smartofficeFCMRegisteredListener = null;

let smartofficeFCMUnregisteredListener = null;

let smartofficeFCMRegisterPromise = null;
const SMARTOFFICE_FCM_RESET_KEY =
    "smartoffice_fcm_reset_v1";


/* =========================================================
   FCM STATUS UI
   SEMENTARA UNTUK DEBUG ANDROID
========================================================= */

function smartofficeShowFCMStatus(
    message,
    type = "info"
){

    let element =
        document.getElementById(
            "smartofficeFCMDebugStatus"
        );

    if(!element){

        element =
            document.createElement(
                "div"
            );

        element.id =
            "smartofficeFCMDebugStatus";

        element.style.position =
            "fixed";

        element.style.left =
            "16px";

        element.style.right =
            "16px";

        element.style.bottom =
            "90px";

        element.style.zIndex =
            "999999";

        element.style.padding =
            "12px 14px";

        element.style.borderRadius =
            "12px";

        element.style.background =
            "#111827";

        element.style.color =
            "#FFFFFF";

        element.style.fontSize =
            "12px";

        element.style.fontFamily =
            "Arial, sans-serif";

        element.style.lineHeight =
            "1.5";

        element.style.boxShadow =
            "0 8px 30px rgba(0,0,0,.25)";

        element.style.wordBreak =
            "break-word";

        document.body.appendChild(
            element
        );
    }

    element.textContent =
        message;

    if(type === "success"){
        element.style.background =
            "#166534";
    }
    else if(type === "error"){
        element.style.background =
            "#991B1B";
    }
    else{
        element.style.background =
            "#111827";
    }
}


/* =========================================================
   GET SERVICE WORKER FCM
========================================================= */
async function smartofficeGetMessagingServiceWorker(){

    if(!("serviceWorker" in navigator)){
        throw new Error(
            "Browser tidak mendukung Service Worker."
        );
    }

    if(smartofficeMessagingRegistration){
        return smartofficeMessagingRegistration;
    }

    smartofficeMessagingRegistration =
        await navigator.serviceWorker.register(
            "/sw.js",
            {
                scope: "/"
            }
        );

    await navigator.serviceWorker.ready;

    console.log(
        "[Smart Office] PWA + FCM Service Worker siap:",
        smartofficeMessagingRegistration.scope
    );

    return smartofficeMessagingRegistration;
}


/* =========================================================
   REGISTER PUSH FCM
========================================================= */

export async function smartofficeRegisterFCM(){

    /* =====================================================
       DEVELOPMENT
       FCM tidak dijalankan di localhost.
       ===================================================== */

    if(!import.meta.env.PROD){

        console.log(
            "[Smart Office] FCM dilewati pada mode development."
        );

        return {
            success: true,
            skipped: true,
            message:
                "FCM dilewati pada mode development."
        };
    }


    if(
        smartofficeFCMRegisterPromise
    ){

        return (
            smartofficeFCMRegisterPromise
        );
    }


    smartofficeFCMRegisterPromise =
        smartofficeRegisterFCMInternal();


    try{

        return await
            smartofficeFCMRegisterPromise;

    }
    finally{

        smartofficeFCMRegisterPromise =
            null;
    }
}


/* =========================================================
   RESET FCM DARI PWA
   ========================================================= */

export async function smartofficeResetFCM(){

    try{

        smartofficeShowFCMStatus(
            "FCM: menghapus registrasi lama..."
        );

        const registration =
            await smartofficeGetMessagingServiceWorker();

        if(!registration){

            throw new Error(
                "Service Worker Smart Office tidak ditemukan."
            );
        }


        /* =========================================
           UNREGISTER FCM
        ========================================= */

        const removed =
            await unregister(
                smartofficeMessaging
            );

        smartofficeShowFCMStatus(
            "HASIL UNREGISTER:\n" +
            String(removed)
        );


        /* =========================================
           REGISTER FCM KEMBALI
        ========================================= */

        await register(
            smartofficeMessaging,
            {
                vapidKey:
                    SMARTOFFICE_FCM_VAPID_KEY,

                serviceWorkerRegistration:
                    registration
            }
        );


        smartofficeShowFCMStatus(
            "FCM REGISTER ULANG.\n" +
            "Menunggu FID baru..."
        );


        return {
            success: true,
            message:
                "FCM berhasil diregistrasikan ulang."
        };

    }
    catch(error){

        console.error(
            "[Smart Office] Reset FCM gagal:",
            error
        );

        smartofficeShowFCMStatus(
            "FCM RESET GAGAL:\n" +
            (
                error?.message ||
                "Gagal reset FCM."
            ),
            "error"
        );

        return {
            success: false,
            message:
                error?.message ||
                "Gagal reset FCM."
        };
    }
}


export async function smartofficeDeleteFirebaseInstallation(){

    try{

        smartofficeShowFCMStatus(
            "FCM: menghapus Firebase Installation lama..."
        );

        await deleteInstallations(
            smartofficeInstallations
        );

        console.log(
            "[Smart Office] Firebase Installation lama berhasil dihapus."
        );

        smartofficeShowFCMStatus(
            "✓ Firebase Installation lama dihapus.\n" +
            "Siap membuat FID baru.",
            "success"
        );

        return {
            success: true,
            message:
                "Firebase Installation lama berhasil dihapus."
        };

    }
    catch(error){

        console.error(
            "[Smart Office] Gagal menghapus Firebase Installation:",
            error
        );

        smartofficeShowFCMStatus(
            "FCM GAGAL HAPUS INSTALLATION:\n" +
            (
                error?.message ||
                "Gagal menghapus Firebase Installation."
            ),
            "error"
        );

        return {
            success: false,
            message:
                error?.message ||
                "Gagal menghapus Firebase Installation."
        };
    }
}

/* =========================================================
   INTERNAL REGISTER
========================================================= */

async function smartofficeRegisterFCMInternal(){

    try{

        /* =================================================
           SUPPORT
        ================================================= */

        if(
            !("Notification" in window)
        ){

            smartofficeShowFCMStatus(
                "FCM GAGAL: Browser tidak mendukung Notification.",
                "error"
            );

            return {
                success: false,
                message:
                    "Browser tidak mendukung Notification."
            };

        }


        if(
            !("serviceWorker" in navigator)
        ){

            smartofficeShowFCMStatus(
                "FCM GAGAL: Service Worker tidak didukung.",
                "error"
            );

            return {
                success: false,
                message:
                    "Browser tidak mendukung Service Worker."
            };

        }


        /* =================================================
           PERMISSION
        ================================================= */

        let permission =
            Notification.permission;


        if(
            permission !== "granted"
        ){

            smartofficeShowFCMStatus(
                "FCM: meminta izin notifikasi..."
            );

            permission =
                await Notification.requestPermission();

        }


        if(
            permission !== "granted"
        ){

            smartofficeShowFCMStatus(
                "FCM GAGAL: izin notifikasi = " +
                permission,
                "error"
            );

            return {
                success: false,
                message:
                    "Izin notifikasi tidak diberikan."
            };

        }


        /* =================================================
           SERVICE WORKER FCM
        ================================================= */

        const registration =
            await smartofficeGetMessagingServiceWorker();


        if(
            !registration
        ){

            throw new Error(
                "Service Worker FCM tidak berhasil didaftarkan."
            );

        }


        smartofficeShowFCMStatus(
            "FCM: Service Worker berhasil."
        );


        /* =================================================
           REGISTER LISTENER SEKALI SAJA
        ================================================= */

        if(
            !smartofficeFCMRegisteredListener
        ){

            smartofficeFCMRegisteredListener =
                onRegistered(
                    smartofficeMessaging,
                    async (installationId) => {

                        console.log(
                            "[Smart Office] Firebase Installation ID:",
                            installationId
                        );


                        if(
                            !installationId
                        ){

                            console.error(
                                "[Smart Office] FID kosong."
                            );

                            return;

                        }


                        smartofficeShowFCMStatus(
                            "FCM FID: " +
                            installationId +
                            "\nMengirim FID ke server..."
                        );


                        const result =
                            await smartofficeRegisterPushToken(
                                installationId
                            );


                        if(
                            result?.success
                        ){

                            smartofficeShowFCMStatus(
                                "✓ FCM BERHASIL\n" +
                                "FID: " +
                                installationId +
                                "\n" +
                                "FID sudah terdaftar ke akun.",
                                "success"
                            );

                        }
                        else{

                            smartofficeShowFCMStatus(
                                "FCM FID didapat,\n" +
                                "tetapi gagal dikirim ke GAS.\n" +
                                (
                                    result?.message ||
                                    "Unknown error"
                                ),
                                "error"
                            );

                        }

                    }
                );

        }


        /* =================================================
           UNREGISTER LISTENER SEKALI SAJA
        ================================================= */

        if(
            !smartofficeFCMUnregisteredListener
        ){

            smartofficeFCMUnregisteredListener =
                onUnregistered(
                    smartofficeMessaging,
                    async (installationId) => {

                        console.warn(
                            "[Smart Office] FID tidak lagi terdaftar:",
                            installationId
                        );

                    }
                );

        }


        /* =================================================
           HAPUS FIREBASE INSTALLATION LAMA
           HANYA SEKALI
        ================================================= */

        const alreadyReset =
            localStorage.getItem(
                SMARTOFFICE_FCM_RESET_KEY
            ) === "done";


        if(
            !alreadyReset
        ){

            smartofficeShowFCMStatus(
                "FCM: menghapus Firebase Installation lama..."
            );


            try{

                await deleteInstallations(
                    smartofficeInstallations
                );


                console.log(
                    "[Smart Office] Firebase Installation lama dihapus."
                );

            }
            catch(error){

                console.warn(
                    "[Smart Office] Firebase Installation lama tidak dapat dihapus:",
                    error
                );

            }


            localStorage.setItem(
                SMARTOFFICE_FCM_RESET_KEY,
                "done"
            );


            smartofficeShowFCMStatus(
                "Firebase Installation lama diproses.\n" +
                "Membuat registrasi FCM baru..."
            );

        }


        /* =================================================
           REGISTER FCM
        ================================================= */

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
            "[Smart Office] FCM register() berhasil."
        );


        smartofficeShowFCMStatus(
            "FCM: registrasi push berhasil dijalankan."
        );


        console.log(
            "[Smart Office] Register FCM berhasil dijalankan."
        );


        return {

            success: true,

            message:
                "Registrasi push berhasil dijalankan."

        };

    }
    catch(error){

        console.error(
            "[Smart Office] Gagal register FCM:",
            error
        );


        smartofficeShowFCMStatus(
            "FCM GAGAL:\n" +
            (
                error?.message ||
                "Gagal register FCM."
            ),
            "error"
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
   REGISTER FID KE GAS
========================================================= */

export async function smartofficeRegisterPushToken(
    installationId
){

    try{

        if(
            !installationId
        ){

            return {

                success: false,

                message:
                    "Firebase Installation ID kosong."
            };
        }


        /* =================================================
           AMBIL SESSION
        ================================================= */

        const sessionRaw =
            localStorage.getItem(
                "smartoffice_session"
            );


        if(
            !sessionRaw
        ){

            smartofficeShowFCMStatus(
                "FCM GAGAL: session tidak ditemukan.",
                "error"
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

            return {

                success: false,

                message:
                    "Session tidak valid."
            };
        }


        /* =================================================
           NIP
        ================================================= */

        const nip =
            String(
                session?.nip ||
                session?.NIP ||
                ""
            ).trim();


        console.log(
            "[Smart Office] NIP FCM:",
            nip
        );


        console.log(
            "[Smart Office] FID FCM:",
            installationId
        );


        if(
            !nip
        ){

            smartofficeShowFCMStatus(
                "FCM GAGAL: NIP login tidak ditemukan.",
                "error"
            );

            return {

                success: false,

                message:
                    "NIP login tidak ditemukan."
            };
        }


        /* =================================================
           KIRIM KE GAS
        ================================================= */

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
   TAMPILKAN NOTIFIKASI SAAT APLIKASI SEDANG TERBUKA
========================================================= */

export function smartofficeListenFCMMessage(callback){

    return onMessage(
        smartofficeMessaging,

        async (payload) => {

            console.log(
                "[Smart Office] Foreground push:",
                payload
            );

            const title =
                payload?.notification?.title ||
                payload?.data?.title ||
                "Smart Office V2.1";

            const body =
                payload?.notification?.body ||
                payload?.data?.body ||
                "Ada pemberitahuan baru.";

            const notificationId =
                payload?.data?.notificationId ||
                "smartoffice-" + Date.now();

            const url =
                payload?.data?.url ||
                "/";

            try {

                const registration =
                    await navigator.serviceWorker.ready;

                await registration.showNotification(
                    title,
                    {
                        body: body,

                        icon:
                            "/smartoffice-icon-192-white.png",

                        badge:
                            "/smartoffice-icon-192-white.png",

                        tag:
                            notificationId,

                        renotify:
                            true,

                        requireInteraction:
                            false,

                        data: {
                            ...(payload?.data || {}),
                            notificationId,
                            url
                        }
                    }
                );

                console.log(
                    "[Smart Office] Foreground notification tampil."
                );

            } catch(error) {

                console.error(
                    "[Smart Office] Foreground notification gagal:",
                    error
                );

            }

            if(typeof callback === "function"){
                callback(payload);
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