/* ======================================================
   SMART OFFICE — ARSIP PEGAWAI SERVICE
====================================================== */

import {
    smartofficeApi
} from "../core/api.js";

import {
    smartofficeGetDaftarPegawaiArsipFirestore,
    smartofficeGetArsipPegawaiFirestore,
    smartofficeGetArsipStatFirestore,
    smartofficeGetProgressArsipFirestore
} from "./arsip-pegawai-firestore.service.js";

import {
    smartofficeCacheGet,
    smartofficeCacheSet,
    smartofficeCacheRemove
} from "../core/cache.js";


/* ======================================================
   GET DAFTAR PEGAWAI ARSIP
   FIRESTORE READ
====================================================== */
export async function smartofficeGetDaftarPegawaiArsip(
    forceRefresh = false
){

    const cacheKey = "arsip_daftar_pegawai";

    if(!forceRefresh){
        const cached = smartofficeCacheGet(cacheKey);

        if(cached){
            console.log("ARSIP: DAFTAR PEGAWAI DARI CACHE");
            return cached;
        }
    }

    try{
        const data =
            await smartofficeGetDaftarPegawaiArsipFirestore();

        smartofficeCacheSet(cacheKey,data);

        return data;
    }
    catch(error){
        console.error(
            "Firestore Daftar Pegawai Arsip Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat daftar pegawai."
        );
    }
}


/* ======================================================
   GET ARSIP PEGAWAI
   FIRESTORE READ
====================================================== */
export async function smartofficeGetArsipPegawai(
    nip,
    forceRefresh = false
){

    const nipValue = String(nip || "").trim();

    const cacheKey =
        `arsip_detail_pegawai_${nipValue}`;

    if(!forceRefresh){
        const cached = smartofficeCacheGet(cacheKey);

        if(cached){
            console.log(
                "ARSIP: DETAIL PEGAWAI DARI CACHE",
                nipValue
            );

            return cached;
        }
    }

    try{
        const data =
            await smartofficeGetArsipPegawaiFirestore(
                nipValue
            );

        smartofficeCacheSet(cacheKey,data);

        return data;
    }
    catch(error){
        console.error(
            "Firestore Arsip Pegawai Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat arsip pegawai."
        );
    }
}


/* ======================================================
   GET ARSIP STAT
   FIRESTORE READ
====================================================== */
export async function smartofficeGetArsipStat(
    forceRefresh = false
){

    const cacheKey = "arsip_stat";

    if(!forceRefresh){
        const cached = smartofficeCacheGet(cacheKey);

        if(cached){
            console.log("ARSIP: STAT DARI CACHE");
            return cached;
        }
    }

    try{
        const data =
            await smartofficeGetArsipStatFirestore();

        smartofficeCacheSet(cacheKey,data);

        return data;
    }
    catch(error){
        console.error(
            "Firestore Arsip Stat Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat statistik arsip."
        );
    }
}


/* ======================================================
   GET PROGRESS ARSIP
   FIRESTORE READ
====================================================== */
export async function smartofficeGetProgressArsip(
    forceRefresh = false
){

    const cacheKey = "arsip_progress";

    if(!forceRefresh){
        const cached = smartofficeCacheGet(cacheKey);

        if(cached){
            console.log("ARSIP: PROGRESS DARI CACHE");
            return cached;
        }
    }

    try{
        const data =
            await smartofficeGetProgressArsipFirestore();

        smartofficeCacheSet(cacheKey,data);

        return data;
    }
    catch(error){
        console.error(
            "Firestore Progress Arsip Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat progress arsip."
        );
    }
}


/* ======================================================
   INVALIDATE CACHE ARSIP
====================================================== */
export function smartofficeClearArsipCache(nip = ""){

    smartofficeCacheRemove(
        "arsip_daftar_pegawai"
    );

    smartofficeCacheRemove(
        "arsip_stat"
    );

    smartofficeCacheRemove(
        "arsip_progress"
    );

    const nipValue =
        String(nip || "").trim();

    /* =========================
       HAPUS DETAIL TERTENTU
    ========================= */
    if(nipValue){

        smartofficeCacheRemove(
            `arsip_detail_pegawai_${nipValue}`
        );

    }

    /* =========================
       HAPUS SEMUA DETAIL ARSIP
    ========================= */
    else{

        Object.keys(sessionStorage)
            .filter(key =>
                key.startsWith(
                    "smartoffice_cache_arsip_detail_pegawai_"
                )
            )
            .forEach(key =>
                sessionStorage.removeItem(key)
            );

    }

    console.log(
        "ARSIP: CACHE DIBERSIHKAN",
        nipValue || "SEMUA"
    );
}


/* ======================================================
   BUKA LOCK DOKUMEN
   WRITE → TETAP GAS
====================================================== */
export async function smartofficeBukaLockDokumen(
    idDokumen,
    alasan,
    nip,
    role
){

    const result =
        await smartofficeApi(
            "smartofficeBukaLockDokumen",
            {
                idDokumen,
                alasan,
                nip,
                role
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal membuka lock dokumen."
        );
    }

    return result;
}