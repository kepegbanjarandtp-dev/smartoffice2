/* ======================================================
   PUSAT DOKUMEN
   SERVICE PENOMORAN SK
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET ALL SURAT KEPUTUSAN
====================================================== */
export async function smartofficeGetAllSK(){
    const response =
        await smartofficeApi(
            "getAllSK"
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal memuat data Surat Keputusan."
        );
    }

    return response.data || [];
}


/* ======================================================
   AMBIL MASTER SK
====================================================== */
export async function smartofficeGetSKMaster(){
    const response =
        await smartofficeApi(
            "getSKMaster"
        );

    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal memuat master Surat Keputusan."
        );
    }

    return response.data || {};
}


/* ======================================================
   PREVIEW NOMOR SK
====================================================== */
export async function smartofficePreviewNomorSK(
    kode,
    klaster,
    tanggalSK
){
    const response =
        await smartofficeApi(
            "previewNomorSK",
            {
                kode,
                klaster,
                tanggalSK
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal membuat preview nomor SK."
        );
    }

    return response.data || "";
}


/* ======================================================
   SIMPAN / UPDATE SK
====================================================== */
export async function smartofficeAddSKDraft(
    payload
){

    const requestPayload = {
        ...payload,

        file:
            payload.file &&
            typeof payload.file === "object"
                ? JSON.stringify(payload.file)
                : payload.file || ""
    };

    const response =
        await smartofficeApi(
            "addSKDraft",
            requestPayload
        );

    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal menyimpan Surat Keputusan."
        );
    }

    return response.data || {};
}


/* ======================================================
   BUKA LOCK SK
====================================================== */
export async function smartofficeBukaLockSK(
    rowIndex
){
    const response =
        await smartofficeApi(
            "bukaLockSK",
            {
                rowIndex
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal membuka kunci Surat Keputusan."
        );
    }

    return (
        response.data ||
        response
    );
}


/* ======================================================
   HAPUS SK
====================================================== */
export async function smartofficeHapusSK(
    rowIndex
){

    const response =
        await smartofficeApi(
            "hapusSK",
            {
                rowIndex
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal menghapus Surat Keputusan."
        );
    }

    return response.data ||
           response;
}
