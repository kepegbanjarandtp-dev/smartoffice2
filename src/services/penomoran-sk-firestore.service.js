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


/* ======================================================
   GET SK BERDASARKAN TAHUN
   READ FIRESTORE + CACHE

   Contoh:
   smartofficeGetSKByTahunFirestore("2026")
====================================================== */
export async function smartofficeGetSKByTahunFirestore(
    tahun,
    forceRefresh = false
){
    const tahunValue =
        String(
            tahun || ""
        ).trim();

    if(
        !/^\d{4}$/.test(
            tahunValue
        )
    ){
        throw new Error(
            "Tahun SK tidak valid."
        );
    }

    /* ==================================================
       CEK CACHE
    ================================================== */
    if(
        !forceRefresh &&
        smartofficeSKFirestoreCache.has(
            tahunValue
        )
    ){

        return [
            ...smartofficeSKFirestoreCache.get(
                tahunValue
            )
        ];
    }

    /* ==================================================
       RANGE TANGGAL
       2026-01-01 s/d sebelum 2027-01-01
    ================================================== */
    const tanggalAwal =
        `${tahunValue}-01-01`;

    const tanggalAkhir =
        `${Number(tahunValue) + 1}-01-01`;


    console.log(
        "FIRESTORE SURAT KEPUTUSAN:",
        tanggalAwal,
        "sampai",
        tanggalAkhir
    );

    /* ==================================================
       QUERY FIRESTORE
       HANYA TAHUN
    ================================================== */
    const q =
        query(
            collection(
                smartofficeFirestore,
                "suratKeputusan"
            ),

            where(
                "tanggalSK",
                ">=",
                tanggalAwal
            ),

            where(
                "tanggalSK",
                "<",
                tanggalAkhir
            )
        );

    /* ==================================================
       AMBIL DATA
    ================================================== */
    const snapshot =
        await getDocs(
            q
        );

    /* ==================================================
       MAPPING
    ================================================== */
    const result =
        snapshot.docs.map(
            docSnapshot => {
                const data =
                    docSnapshot.data();
                return {
                    idSK:
                        data.idSK ||
                        docSnapshot.id,

                    rowIndex:
                        data.rowIndex ||
                        0,

                    timestamp:
                        data.timestamp ||
                        "",

                    timestampDisplay:
                        data.timestampDisplay ||
                        "",

                    kode:
                        data.kode ||
                        "",

                    klasifikasi:
                        data.klasifikasi ||
                        "",

                    nomorSK:
                        data.nomorSK ||
                        "",

                    tanggalSK:
                        data.tanggalSK ||
                        "",

                    tanggalSKDisplay:
                        data.tanggalSKDisplay ||
                        "",

                    tentang:
                        data.tentang ||
                        "",

                    klaster:
                        data.klaster ||
                        "",

                    statusSK:
                        data.statusSK ||
                        "",

                    file:
                        data.file ||
                        "",

                    status:
                        data.status ||
                        ""
                };
            }
        );

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

    /* ==================================================
       SIMPAN CACHE PER TAHUN
    ================================================== */
    smartofficeSKFirestoreCache.set(
        tahunValue,
        result
    );

    console.log(
        "HASIL SURAT KEPUTUSAN FIRESTORE:",
        tahunValue,
        result.length
    );

    return [
        ...result
    ];
}


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
