import {
    collection,
    getDocs,
    getCountFromServer,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";



/* ======================================================
   GET TOTAL PENDING APPROVAL
   CUTI + DOKUMEN + SPD
   OPTIMASI FIRESTORE READ
====================================================== */
export async function smartofficeGetTotalPendingApprovalFirestore(
    nip,
    role
){
    try{
        const loginNip =
            String(nip || "")
                .replace(/'/g, "")
                .replace(/\.0$/, "")
                .trim();

        let totalCuti = 0;
        let totalDokumen = 0;
        let totalSPD = 0;
        
        /* ==================================================
        CUTI
        PJ + KAPUS
        OPTIMASI: FILTER LANGSUNG BERDASARKAN NIP
        ================================================== */
        if(
            (role === "PJ" || role === "KAPUS") &&
            loginNip
        ){
            const cutiCollection =
                collection(
                    smartofficeFirestore,
                    "cuti"
                );

            /* APPROVAL TAHAP 1 */
            const approval1Query =
                query(
                    cutiCollection,
                    where("recordStatus", "==", "ACTIVE"),
                    where("status", "==", "MENUNGGU_APPROVAL_1"),
                    where("approval1Nip", "==", loginNip)
                );

            /* APPROVAL TAHAP 2 */
            const approval2Query =
                query(
                    cutiCollection,
                    where("recordStatus", "==", "ACTIVE"),
                    where("status", "==", "MENUNGGU_APPROVAL_2"),
                    where("approval2Nip", "==", loginNip)
                );

            /* HITUNG TANPA MENGUNDUH DOKUMEN */
            const [
                approval1Snapshot,
                approval2Snapshot
            ] = await Promise.all([
                getCountFromServer(approval1Query),
                getCountFromServer(approval2Query)
            ]);

            totalCuti =
                approval1Snapshot.data().count +
                approval2Snapshot.data().count;
        }

        /* ==================================================
           DOKUMEN + SPD
           PJ + ADMIN + SUPERADMIN
        ================================================== */
        if(
            role === "PJ" ||
            role === "ADMIN" ||
            role === "SUPERADMIN"
        ){
            const dokumenQuery =
                query(
                    collection(
                        smartofficeFirestore,
                        "dokumenPegawai"
                    ),
                    where(
                        "statusVerifikasi",
                        "==",
                        "MENUNGGU_VERIFIKASI"
                    )
                );

            const spdQuery =
                query(
                    collection(
                        smartofficeFirestore,
                        "smartspdBLUD"
                    ),
                    where(
                        "STATUS_SPD",
                        "in",
                        [
                            "MENUNGGU REVIEW",
                            "PERLU REVISI"
                        ]
                    )
                );

            const [
                dokumenCountSnapshot,
                spdCountSnapshot
            ] = await Promise.all([
                getCountFromServer(dokumenQuery),
                getCountFromServer(spdQuery)
            ]);

            totalDokumen =
                dokumenCountSnapshot.data().count;

            totalSPD =
                spdCountSnapshot.data().count;
        }

        return totalCuti + totalDokumen + totalSPD;
    }
    catch(error){
        console.error(
            "Firestore Total Pending Approval Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal menghitung total pending approval."
        );
    }
}
