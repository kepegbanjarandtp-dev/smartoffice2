/* ======================================================
   SMART OFFICE V3
   FIRESTORE NOTIFICATION SERVICE
====================================================== */
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   KONFIGURASI
====================================================== */
const SMARTOFFICE_NOTIFICATION_LIMIT = 20;


/* ======================================================
   NORMALISASI FIRESTORE TIMESTAMP
====================================================== */
function smartofficeNormalizeNotification(notification) {

    if (!notification) {
        return null;
    }

    let time = notification.time;

    /*
     * Firestore Timestamp
     */
    if (
        time &&
        typeof time.toDate === "function"
    ) {
        time = time.toDate();
    }

    /*
     * Pastikan Date
     */
    else if (
        time &&
        !(time instanceof Date)
    ) {
        time = new Date(time);
    }

    return {
        id:
            notification.id || "",

        type:
            notification.type || "",

        category:
            notification.category || "",

        title:
            notification.title || "",

        message:
            notification.message || "",

        time:
            time,

        target:
            notification.target || "",

        targetId:
            notification.targetId || "",

        icon:
            notification.icon || "",

        priority:
            notification.priority || "",

        recipientNip:
            notification.recipientNip || "",

        source:
            notification.source || ""
    };
}


/* ======================================================
   GET NOTIFICATIONS FIRESTORE
====================================================== */
export async function smartofficeGetNotificationsFromFirestore(
    nip
) {

    nip = String(nip || "").trim();
    if (!nip) {
        return {
            success: true,
            notifications: [],
            unreadCount: 0
        };
    }

    try {

        /* ==============================================
           COLLECTION
        ============================================== */
        const notificationRef =
            collection(
                smartofficeFirestore,
                "notifications"
            );

        /* ==============================================
           QUERY USER
        ============================================== */
        const notificationQuery =
            query(
                notificationRef,
                where(
                    "recipientNip",
                    "==",
                    nip
                ),

                orderBy(
                    "time",
                    "desc"
                ),

                limit(
                    SMARTOFFICE_NOTIFICATION_LIMIT
                )
            );

        /* ==============================================
           READ FIRESTORE
        ============================================== */

        const snapshot =
            await getDocs(
                notificationQuery
            );

        /* ==============================================
           MAPPING
        ============================================== */
        const notifications = [];

        snapshot.forEach(
            docSnapshot => {
                const data =
                    docSnapshot.data();

                const notification =
                    smartofficeNormalizeNotification({
                        id:
                            docSnapshot.id,

                        ...data

                    });
                if (notification) {
                    notifications.push(
                        notification
                    );
                }
            }
        );

        /* ==============================================
           UNREAD COUNT
           
           Untuk tahap sekarang belum ada
           persistent read/unread state.
        ============================================== */
        const unreadCount =
            notifications.length;

        console.log(
            "SMART OFFICE FIRESTORE NOTIFICATIONS:",
            {
                nip: nip,
                total: notifications.length,
                unreadCount: unreadCount
            }
        );

        return {
            success: true,
            notifications:
                notifications,
            unreadCount:
                unreadCount
        };

    } catch (error) {
        console.error(
            "SMART OFFICE FIRESTORE NOTIFICATION ERROR:",
            error
        );

        return {
            success: false,
            notifications: [],
            unreadCount: 0,
            message:
                error?.message ||
                "Gagal mengambil notifikasi dari Firestore."
        };
    }
}


/* ======================================================
   REALTIME NOTIFICATION LISTENER
====================================================== */
export function smartofficeListenNotificationsFromFirestore(
    nip,
    onChange,
    onError
) {

    nip = String(nip || "").trim();
    if (!nip) {
        console.warn(
            "SMART OFFICE NOTIFICATION LISTENER: NIP kosong."
        );

        return () => {};
    }

    try {
        /* ==============================================
           COLLECTION
        ============================================== */
        const notificationRef =
            collection(
                smartofficeFirestore,
                "notifications"
            );

        /* ==============================================
           QUERY
        ============================================== */
        const notificationQuery =
            query(

                notificationRef,
                where(
                    "recipientNip",
                    "==",
                    nip
                ),

                orderBy(
                    "time",
                    "desc"
                ),

                limit(
                    SMARTOFFICE_NOTIFICATION_LIMIT
                )
            );

        /* ==============================================
           LISTENER
        ============================================== */
        const unsubscribe =
            onSnapshot(
                notificationQuery,
                snapshot => {
                    const notifications = [];

                    snapshot.forEach(
                        docSnapshot => {
                            const data =
                                docSnapshot.data();

                            const notification =
                                smartofficeNormalizeNotification({
                                    id:
                                        docSnapshot.id,

                                    ...data
                                });

                            if (notification) {
                                notifications.push(
                                    notification
                                );
                            }
                        }
                    );

                    /* ==================================
                       UNREAD COUNT
                       
                       Tahap sekarang:
                       semua notification = unread
                    ================================== */
                    const unreadCount =
                        notifications.length;

                    console.log(
                        "SMART OFFICE NOTIFICATION REALTIME:",
                        {
                            nip: nip,
                            total: notifications.length,
                            unreadCount: unreadCount
                        }
                    );

                    /* ==================================
                       KIRIM KE UI / CACHE
                    ================================== */
                    if (
                        typeof onChange === "function"
                    ) {
                        onChange({
                            success: true,

                            notifications:
                                notifications,

                            unreadCount:
                                unreadCount
                        });
                    }
                },

                error => {
                    console.error(
                        "SMART OFFICE NOTIFICATION LISTENER ERROR:",
                        error
                    );

                    if (
                        typeof onError === "function"
                    ) {
                        onError(error);
                    }
                }
            );

        console.log(
            "SMART OFFICE NOTIFICATION LISTENER AKTIF:",
            nip
        );

        /*
         * Fungsi ini dikembalikan supaya nanti
         * listener bisa dihentikan saat logout.
         */
        return unsubscribe;

    } catch (error) {
        console.error(
            "SMART OFFICE NOTIFICATION LISTENER INIT ERROR:",
            error
        );

        if (
            typeof onError === "function"
        ) {
            onError(error);
        }

        return () => {};
    }
}