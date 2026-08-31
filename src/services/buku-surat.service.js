/* ======================================================
   SMART OFFICE BUKU SURAT SERVICE
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET SEMUA DATA SURAT MASUK
   UNTUK FILTER & CLIENT-SIDE VIEW
====================================================== */
export async function smartofficeGetAllSuratMasuk(){
    const response =
        await smartofficeApi(
            "getAllSuratMasuk"
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
   GET MASTER SURAT
   UNTUK DISPOSISI
====================================================== */
export async function smartofficeGetMasterSurat(){
    const response =
        await smartofficeApi(
            "getMasterSurat"
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal mengambil master surat."
        );
    }

    return response.data;
}


/* ======================================================
   BUKA LOCK SURAT MASUK
====================================================== */
export async function smartofficeBukaLockSuratMasuk(
    rowIndex,
    nip,
    role
){
    const result =
        await smartofficeApi(
            "smartofficeBukaLockSuratMasuk",
            {
                rowIndex,
                nip,
                role
            }
        );
    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal membuka lock Surat Masuk."
        );
    }

    return result;
}


/* ======================================================
   PREVIEW NOMOR AGENDA SURAT MASUK
====================================================== */
export async function smartofficePreviewNomorAgendaMasuk(){
    const response =
        await smartofficeApi(
            "previewNomorAgendaMasuk"
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal mengambil nomor agenda."
        );
    }

    return response.data;
}


/* ======================================================
   SIMPAN SURAT MASUK
====================================================== */
export async function smartofficeSaveSuratMasuk(
    payload
){
    const response =
        await smartofficeApi(
            "saveAndLockSuratMasuk",
            payload
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal menyimpan Surat Masuk."
        );
    }

    return response;
}

