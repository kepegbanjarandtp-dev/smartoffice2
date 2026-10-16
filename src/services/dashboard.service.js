/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";

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
       TOTAL PEGAWAI
       Semua dokumen pegawai dihitung
    ============================== */
    const pegawaiCollection =
        collection(
            smartofficeFirestore,
            "pegawai"
        );

    const pegawaiQuery =
        query(
            pegawaiCollection
        );

    /* ==============================
       RINCIAN STATUS KEPEGAWAIAN
    ============================== */

    const pnsQuery =
        query(
            pegawaiCollection,
            where(
                "statusKepegawaian",
                "==",
                "PNS"
            )
        );

    const pppkQuery =
        query(
            pegawaiCollection,
            where(
                "statusKepegawaian",
                "==",
                "PPPK"
            )
        );

    const pppkParuhWaktuQuery =
        query(
            pegawaiCollection,
            where(
                "statusKepegawaian",
                "==",
                "PPPK PARUH WAKTU"
            )
        );

    const bludQuery =
        query(
            pegawaiCollection,
            where(
                "statusKepegawaian",
                "==",
                "BLUD"
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
        pnsSnapshot,
        pppkSnapshot,
        pppkParuhWaktuSnapshot,
        bludSnapshot,
        cutiSnapshot,
        arsipSnapshot
    ] = await Promise.all([

        getCountFromServer(
            pegawaiQuery
        ),

        getCountFromServer(
            pnsQuery
        ),

        getCountFromServer(
            pppkQuery
        ),

        getCountFromServer(
            pppkParuhWaktuQuery
        ),

        getCountFromServer(
            bludQuery
        ),

        getCountFromServer(
            cutiQuery
        ),

        getCountFromServer(
            arsipQuery
        )
    ]);

    /* ==============================
       HASIL
    ============================== */
    const result = {

        totalPegawai:
            pegawaiSnapshot.data().count,

        pegawaiPNS:
            pnsSnapshot.data().count,

        pegawaiPPPK:
            pppkSnapshot.data().count,

        pegawaiPPPKParuhWaktu:
            pppkParuhWaktuSnapshot.data().count,

        pegawaiBLUD:
            bludSnapshot.data().count,

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


/* ======================================================
   TOTAL DOKUMEN DITOLAK — DOKUMEN SAYA
   CACHE 60 DETIK PER NIP
====================================================== */
const smartofficeDashboardDokumenDitolakCache = new Map();

export async function smartofficeGetTotalDokumenDitolak(nip){

    const nipValue = String(nip || "").trim();

    if(!nipValue){
        return 0;
    }

    const now = Date.now();

    const cached =
        smartofficeDashboardDokumenDitolakCache.get(nipValue);

    if(
        cached &&
        now - cached.time < SMARTOFFICE_DASHBOARD_STATS_CACHE_MS
    ){
        return cached.count;
    }

    const dokumenDitolakQuery = query(
        collection(
            smartofficeFirestore,
            "dokumenPegawai"
        ),
        where("nip", "==", nipValue),
        where("statusVerifikasi", "==", "DITOLAK")
    );

    const snapshot = await getCountFromServer(
        dokumenDitolakQuery
    );

    const count = snapshot.data().count;

    smartofficeDashboardDokumenDitolakCache.set(
        nipValue,
        {
            count,
            time: now
        }
    );

    return count;
}