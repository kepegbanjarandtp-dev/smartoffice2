/* =========================================================
   SMART OFFICE V2.1
   FIREBASE CLOUD MESSAGING SERVICE WORKER
========================================================= */

/* =========================================================
   FIREBASE SDK
========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIG
========================================================= */

firebase.initializeApp({

    apiKey:
        "AIzaSyBg_ccqzIYFYz9-d6O-nQwZyvCEHkDZsA0",

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
   BACKGROUND PUSH MESSAGE
========================================================= */

messaging.onBackgroundMessage(
    async (payload) => {

        console.log(
            "[Smart Office] Background message:",
            payload
        );


        /* =========================
           TITLE
        ========================= */

        const notificationTitle =
            payload?.notification?.title ||
            payload?.data?.title ||
            "Smart Office V2.1";


        /* =========================
           BODY
        ========================= */

        const notificationBody =
            payload?.notification?.body ||
            payload?.data?.body ||
            "Ada pemberitahuan baru.";


        /* =========================
           NOTIFICATION ID
        ========================= */

        const notificationId =
            payload?.data?.notificationId ||
            "smartoffice-" + Date.now();


        /* =========================
           NOTIFICATION OPTIONS
        ========================= */

        const notificationOptions = {

            body:
                notificationBody,


            icon: "/smartoffice-notification-icon-96.png",
            badge: "/smartoffice-notification-icon-96.png",


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
           SHOW NOTIFICATION
        ========================= */

        try {

            await self.registration.showNotification(
                notificationTitle,
                notificationOptions
            );

            console.log(
                "[Smart Office] Notification berhasil dibuat."
            );

        }
        catch(error) {

            console.error(
                "[Smart Office] Gagal showNotification:",
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


        const targetUrl =
            event.notification?.data?.url ||
            "/" ;


        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(
                    (clientList) => {

                        for(
                            const client of clientList
                        ){

                            if(
                                "focus" in client
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