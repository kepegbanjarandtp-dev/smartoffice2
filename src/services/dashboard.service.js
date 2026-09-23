/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";

import {
    smartofficeGetTotalPendingApprovalFirestore
} from "./approval-firestore.service.js";

import {
    collection,
    getCountFromServer,
    getDocs,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET TOTAL PENDING APPROVAL
====================================================== */
export async function smartofficeGetTotalPendingApproval(
    nip
){
    /* =========================
       REQUEST API
    ========================= */   
    const response =
        await smartofficeApi(
            "totalPendingApproval",
            {
                nip
            }
        );

    /* =========================
       API FAILED
    ========================= */
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    /* =========================
       RETURN TOTAL
    ========================= */
    return response.data;
}


/* ======================================================
   GET TOTAL PENDING SEMUA APPROVAL
   CUTI + DOKUMEN
====================================================== */
export async function smartofficeGetTotalPendingApprovalAll(
    nip,
    role
){

    return await smartofficeGetTotalPendingApprovalFirestore(
        nip,
        role
    );
}


/* ======================================================
   DASHBOARD STATISTIK
   FIRESTORE COUNT ONLY
====================================================== */

let smartofficeDashboardStatsCache = null;
let smartofficeDashboardStatsCacheTime = 0;

const SMARTOFFICE_DASHBOARD_STATS_CACHE_MS = 60 * 1000;


/* ======================================================
   GET TANGGAL HARI INI
   FORMAT: YYYY-MM-DD
====================================================== */
function smartofficeDashboardGetToday(){

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* ======================================================
   GET STATISTIK DASHBOARD
====================================================== */
export async function smartofficeGetDashboardStats(){

    const now =
        Date.now();
    if(
        smartofficeDashboardStatsCache &&
        now - smartofficeDashboardStatsCacheTime <
            SMARTOFFICE_DASHBOARD_STATS_CACHE_MS
    ){
        return smartofficeDashboardStatsCache;
    }

    const today =
        smartofficeDashboardGetToday();

    /* ==============================
       TOTAL PEGAWAI AKTIF
    ============================== */
    const pegawaiQuery =
        query(
            collection(
                smartofficeFirestore,
                "pegawai"
            ),
            where(
                "status",
                "==",
                "AKTIF"
            )
        );

    /* ==============================
       SEDANG CUTI
    ============================== */
    const cutiQuery =
        query(
            collection(
                smartofficeFirestore,
                "cuti"
            ),
            where(
                "recordStatus",
                "==",
                "ACTIVE"
            ),
            where(
                "status",
                "==",
                "DISETUJUI"
            ),
            where(
                "tanggalAwalCuti",
                "<=",
                today
            ),
            where(
                "tanggalAkhirCuti",
                ">=",
                today
            )
        );

    /* ==============================
       TOTAL ARSIP KEPEGAWAIAN
    ============================== */
    const arsipQuery =
        query(
            collection(
                smartofficeFirestore,
                "dokumenPegawai"
            )
        );

    /* ==============================
       COUNT SAJA
       Tidak download dokumen
    ============================== */
    const [
        pegawaiSnapshot,
        cutiSnapshot,
        arsipSnapshot
    ] = await Promise.all([

        getCountFromServer(
            pegawaiQuery
        ),

        getCountFromServer(
            cutiQuery
        ),

        getCountFromServer(
            arsipQuery
        )
    ]);

    const result = {
        totalPegawai:
            pegawaiSnapshot.data().count,
        sedangCuti:
            cutiSnapshot.data().count,
        totalArsip:
            arsipSnapshot.data().count
    };

    /* ==============================
       CACHE 1 MENIT
    ============================== */
    smartofficeDashboardStatsCache =
        result;
    smartofficeDashboardStatsCacheTime =
        now;

    return result;
}


/* ======================================================
   CLEAR CACHE STATISTIK DASHBOARD
====================================================== */
export function smartofficeClearDashboardStatsCache(){
    smartofficeDashboardStatsCache =
        null;
    smartofficeDashboardStatsCacheTime =
        0;
}


/* ======================================================
   GET PEGAWAI YANG SEDANG CUTI
   DASHBOARD
   SEMUA DATA CUTI YANG SEDANG BERLANGSUNG
====================================================== */

export async function smartofficeGetSedangCutiFirestore(){

    const today =
        smartofficeDashboardGetToday();


    /* ==================================================
       QUERY CUTI AKTIF HARI INI
    ================================================== */

    const cutiQuery =
        query(

            collection(
                smartofficeFirestore,
                "cuti"
            ),

            where(
                "recordStatus",
                "==",
                "ACTIVE"
            ),

            where(
                "status",
                "==",
                "DISETUJUI"
            ),

            where(
                "tanggalAwalCuti",
                "<=",
                today
            ),

            where(
                "tanggalAkhirCuti",
                ">=",
                today
            )

        );


    /* ==================================================
       AMBIL SEMUA CUTI YANG SEDANG BERLANGSUNG
    ================================================== */

    const snapshot =
        await getDocs(
            cutiQuery
        );


    /* ==================================================
       FORMAT DATA
    ================================================== */

    const result =
        snapshot.docs.map(
            docSnapshot => {

                const data =
                    docSnapshot.data();

                return {

                    idCuti:
                        data.idCuti ||
                        docSnapshot.id,

                    nama:
                        data.nama ||
                        "-",

                    nip:
                        data.nipNrp ||
                        "",

                    tanggalAwal:
                        data.tanggalAwalCuti ||
                        "",

                    tanggalAkhir:
                        data.tanggalAkhirCuti ||
                        "",

                    jenisCuti:
                        data.jenisCuti ||
                        ""

                };

            }
        );


    /* ==================================================
       URUTKAN BERDASARKAN TANGGAL AWAL CUTI
    ================================================== */

    result.sort(
        (a,b) =>
            String(
                a.tanggalAwal || ""
            )
            .localeCompare(
                String(
                    b.tanggalAwal || ""
                )
            )
    );


    return result;

}