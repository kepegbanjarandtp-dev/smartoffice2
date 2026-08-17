/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


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