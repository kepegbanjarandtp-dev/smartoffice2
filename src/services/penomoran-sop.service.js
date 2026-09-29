/* ======================================================
   PUSAT DOKUMEN
   SERVICE PENOMORAN SOP
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET ALL SOP
====================================================== */
export async function smartofficeGetAllSOP(){

    const response =
        await smartofficeApi(
            "getAllSOP"
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal memuat data SOP."
        );
    }

    return response.data || [];
}


/* ======================================================
   GET SOP
   PAGINATION DARI BACKEND
====================================================== */
export async function smartofficeGetSOP(
    page = 1,
    limit = 25
){
    const response =
        await smartofficeApi(
            "getSOP",
            {
                page,
                limit
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal memuat data SOP."
        );
    }

    return response.data || {};
}


/* ======================================================
   AMBIL MASTER SOP
====================================================== */
export async function smartofficeGetSOPMaster(){

    const response =
        await smartofficeApi(
            "getSOPMaster"
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal memuat master SOP."
        );
    }

    return response.data || {};
}


/* ======================================================
   PREVIEW NOMOR SOP
====================================================== */
export async function smartofficePreviewNomorSOP(
    klaster,
    tanggalSOP
){
    const response =
        await smartofficeApi(
            "previewNomorSOP",
            {
                klaster,
                tanggal: tanggalSOP
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal membuat preview nomor SOP."
        );
    }

    return response.data || "";
}


/* ======================================================
   SIMPAN / UPDATE SOP
====================================================== */
export async function smartofficeAddSOPDraft(
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
            "addSOPDraft",
            requestPayload
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal menyimpan SOP."
        );
    }

    return response.data || {};
}


/* ======================================================
   BUKA LOCK SOP
====================================================== */
export async function smartofficeBukaLockSOP(
    nomorSOP
){
    const response =
        await smartofficeApi(
            "bukaLockSOP",
            {
                nomorSOP
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal membuka kunci SOP."
        );
    }

    return (
        response.data ||
        response
    );
}


/* ======================================================
   HAPUS SOP
====================================================== */
export async function smartofficeHapusSOP(
    nomorSOP
){
    const response =
        await smartofficeApi(
            "hapusSOP",
            {
                nomorSOP
            }
        );
    if(
        !response.success
    ){
        throw new Error(
            response.message ||
            "Gagal menghapus SOP."
        );
    }
    return (
        response.data ||
        response
    );
}