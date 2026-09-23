/* ======================================================
   SMART OFFICE
   FIRESTORE - PENOMORAN SK
====================================================== */
import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   CACHE SK
   CACHE PER TAHUN
====================================================== */
const smartofficeSKFirestoreCache =
    new Map();


/* ==================================================
   URUTKAN:
   1. TANGGAL SK TERBARU → TERLAMA
   2. JIKA TANGGAL SAMA → NOMOR URUT TERKECIL → TERBESAR
================================================== */
result.sort(
    function(a, b){

        const tanggalA =
            String(
                a.tanggalSK || ""
            );

        const tanggalB =
            String(
                b.tanggalSK || ""
            );

        /* =========================
           TANGGAL SK
        ========================= */
        const tanggalCompare =
            tanggalB.localeCompare(
                tanggalA
            );

        if(
            tanggalCompare !== 0
        ){
            return tanggalCompare;
        }

        /* =========================
           TANGGAL SAMA
           AMBIL NOMOR URUT DARI
           NOMOR SK
        ========================= */
        const nomorA =
            String(
                a.nomorSK || ""
            );

        const nomorB =
            String(
                b.nomorSK || ""
            );

        const matchA =
            nomorA.match(
                /\/(\d+)\/[^/]+\/\d{4}$/
            );

        const matchB =
            nomorB.match(
                /\/(\d+)\/[^/]+\/\d{4}$/
            );

        const urutA =
            matchA
                ? Number(matchA[1])
                : 999999;

        const urutB =
            matchB
                ? Number(matchB[1])
                : 999999;

        return urutA - urutB;
    }
);


/* ======================================================
   CLEAR CACHE SK
   tahun = null → semua cache
====================================================== */
export function smartofficeClearSKFirestoreCache(
    tahun = null
){
    if(
        tahun === null ||
        tahun === undefined ||
        tahun === ""
    ){
        smartofficeSKFirestoreCache.clear();

        return;
    }

    smartofficeSKFirestoreCache.delete(
        String(
            tahun
        ).trim()
    );
}
