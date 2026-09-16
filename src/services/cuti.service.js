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
   SEARCH PEGAWAI
====================================================== */
export async function smartofficeSearchPegawai(
    keyword
){
    const response =
        await smartofficeApi(
            "smartofficeSearchPegawai",
            {
                keyword
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


export async function smartofficeSearchPegawaiCuti(
    keyword
){
    const response =
        await smartofficeApi(
            "smartofficeSearchPegawaiCuti",
            {
                keyword
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
   GET JUMLAH CUTI
====================================================== */
export async function smartofficeGetJumlahCuti(
    tanggalAwal,
    tanggalAkhir
){
    const response =
        await smartofficeApi(
            "smartofficeGetJumlahCuti",
            {
                tanggalAwal,
                tanggalAkhir
            }
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


/* ======================================================
   SUBMIT CUTI
====================================================== */
export async function smartofficeSubmitCuti(
    formData
){
    const response =
        await smartofficeApi(
            "smartofficeSubmitCuti",
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


/* ======================================================
   GET RIWAYAT CUTI
   ------------------------------------------------------
   READ:
   Cache → Firestore
====================================================== */
export async function smartofficeGetRiwayatCuti(nip){

    const nipValue =
        String(nip || "").trim();

    if(!nipValue){
        throw new Error(
            "NIP tidak boleh kosong."
        );
    }

    const cacheKey =
        "cuti_riwayat_" + nipValue;

    /* =========================
       CEK CACHE
    ========================= */

    const cached =
        smartofficeCacheGet(
            cacheKey
        );

    if(cached){

        return cached;

    }

    /* =========================
       FIRESTORE
    ========================= */

    const {
        smartofficeGetRiwayatCutiFirestore
    } = await import(
        "./cuti-firestore.service.js"
    );

    const data =
        await smartofficeGetRiwayatCutiFirestore(
            nipValue
        );

    /* =========================
       SIMPAN CACHE
    ========================= */

    smartofficeCacheSet(
        cacheKey,
        data
    );

    return data;
}