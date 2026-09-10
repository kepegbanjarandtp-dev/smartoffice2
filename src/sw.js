/* =========================================================
   SMART OFFICE V2.1
   MAIN PWA + FIREBASE CLOUD MESSAGING SERVICE WORKER
========================================================= */


/* =========================================================
   WORKBOX PRECACHE
========================================================= */

import {
    precacheAndRoute
} from "workbox-precaching";


precacheAndRoute(
    self.__WB_MANIFEST
);


/* =========================================================
   FIREBASE SDK
========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIG
========================================================= */

firebase.initializeApp({

    apiKey:
        "AIzaSyBg_ccqIYFYz9-d6O-nQwZyvCEHkDZsA0",

    authDomain:
        "smartoffice-v2.firebaseapp.com",

    projectId:
        "smartoffice-v2",

    storageBucket:
        "smartoffice-v2.firebasestorage.app",

    messagingSenderId:
        "814086580443",

    appId:
        "1:814086580443:web:d1b4106b887daa75f644fe"

});


/* =========================================================
   FIREBASE MESSAGING
========================================================= */

const messaging =
    firebase.messaging();


/* =========================================================
   BACKGROUND PUSH
========================================================= */

messaging.onBackgroundMessage(
    async (payload) => {

        console.log(
            "[Smart Office] FCM Background Message:",
            payload
        );


        /* =========================
           TITLE
        ========================= */

        const title =
            payload?.notification?.title ||
            payload?.data?.title ||
            "Smart Office V2.1";


        /* =========================
           BODY
        ========================= */

        const body =
            payload?.notification?.body ||
            payload?.data?.body ||
            "Ada pemberitahuan baru.";


        /* =========================
           NOTIFICATION ID
        ========================= */

        const notificationId =
            payload?.data?.notificationId ||
            "smartoffice-" +
            Date.now();


        /* =========================
           OPTIONS
        ========================= */

        const options = {

            body:
                body,

            icon:
                "/smartoffice-icon-192-white.png",

            badge:
                "/smartoffice-icon-192-white.png",

            data:
                {
                    ...(payload?.data || {}),

                    notificationId:
                        notificationId
                },

            tag:
                notificationId,

            renotify:
                true,

            requireInteraction:
                false

        };


        /* =========================
           SHOW
        ========================= */

        try {

            await self.registration.showNotification(
                title,
                options
            );

            console.log(
                "[Smart Office] Notification berhasil ditampilkan."
            );

        }
        catch(error) {

            console.error(
                "[Smart Office] showNotification gagal:",
                error
            );

        }

    }
);


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const data =
            event.notification?.data ||
            {};


        const targetUrl =
            data.url ||
            "/";


        event.waitUntil(

            clients
                .matchAll({
                    type:
                        "window",

                    includeUncontrolled:
                        true
                })

                .then(
                    (clientList) => {

                        for(
                            const client
                            of clientList
                        ){

                            if(
                                "focus"
                                in client
                            ){

                                return client.focus();

                            }

                        }


                        if(
                            clients.openWindow
                        ){

                            return clients.openWindow(
                                targetUrl
                            );

                        }

                    }
                )

        );

    }
);