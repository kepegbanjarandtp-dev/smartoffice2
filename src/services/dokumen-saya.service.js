/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";

import {
    smartofficeCacheGet,
    smartofficeCacheSet,
    smartofficeCacheRemove
} from "../core/cache.js";

import {
    smartofficeGetDokumenPegawaiFirestore
} from "./dokumen-saya-firestore.service.js";


/* ======================================================
   GET DATA PEGAWAI
====================================================== */
export async function smartofficeGetPegawaiByNip(
    nip
){

    const response =
        await smartofficeApi(
            "smartofficeGetPegawaiByNip",
            {
                nip
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    return response.data;
}


/* ======================================================
   GET MASTER DOKUMEN
====================================================== */
export async function smartofficeGetMasterDokumen(
    nip
){

    const response =
        await smartofficeApi(
            "smartofficeGetMasterDokumen",
            {
                nip
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    return response.data;
}


/* ======================================================
   GET DOKUMEN PEGAWAI
====================================================== */
export async function smartofficeGetDokumenPegawai(
    nip
){
    const response =
        await smartofficeApi(
            "smartofficeGetDokumenPegawai",
            {
                nip
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    return response.data;
}


/* ======================================================
   GET DOKUMEN PEGAWAI - CACHE
====================================================== */
export async function smartofficeGetDokumenPegawaiCached(
    nip,
    forceRefresh = false
){

    const nipValue =
        String(nip || "").trim();

    const cacheKey =
        `dokumen_saya_${nipValue}`;

    /* =========================
       CEK CACHE
    ========================= */
    if(!forceRefresh){

        const cached =
            smartofficeCacheGet(cacheKey);
        if(cached){
            console.log(
                "DOKUMEN SAYA: DARI CACHE",
                nipValue
            );

            return cached;
        }
    }

    /* =========================
       FIRESTORE
    ========================= */
    const data =
        await smartofficeGetDokumenPegawaiFirestore(
            nipValue
        );

    /* =========================
       SIMPAN CACHE BARU
    ========================= */
    smartofficeCacheSet(
        cacheKey,
        data
    );

    console.log(
        "DOKUMEN SAYA: FIRESTORE",
        nipValue
    );

    return data;
}


/* ======================================================
   UPLOAD / UPDATE DOKUMEN
====================================================== */
export async function smartofficeUploadDokumen(
    formData
){
    const response =
        await smartofficeApi(
            "smartofficeUploadDokumen",
            formData
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    return response;
}