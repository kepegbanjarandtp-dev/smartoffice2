/* ================================================================================
   IMPORT
================================================================================ */
import {
    smartofficeApi
} from "../core/api.js";

/* ================================================================================
   GET APPROVAL CUTI
================================================================================ */
export async function smartofficeGetApprovalCuti(
    nip
){
    const result =
        await smartofficeApi(
            "smartofficeGetApprovalCuti",
            {
                nip
            }
        );

    if(!result.success){
        throw new Error(
            result.message
        );
    }

    return result.data;
}

/* ================================================================================
   PROCESS APPROVAL CUTI
================================================================================ */
export async function smartofficeProcessApprovalCuti(
    idCuti,
    action,
    nip,
    catatan
){
    const result =
        await smartofficeApi(
            "smartofficeProcessApprovalCuti",
            {
                idCuti,
                action,
                nip,
                catatan
            }
        );

    if(!result.success){
        throw new Error(
            result.message
        );
    }

    return result;
}



/* ======================================================
   GET DOKUMEN VERIFIKASI
====================================================== */
export async function smartofficeGetDokumenVerifikasi(){

    const result =
        await smartofficeApi(
            "smartofficeGetDokumenVerifikasi"
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memuat dokumen approval."
        );
    }
    return result.data || [];
}


/* ======================================================
   VERIFIKASI DOKUMEN
====================================================== */
export async function smartofficeVerifikasiDokumenApi(
    idDokumen
){
    const result =
        await smartofficeApi(
            "smartofficeVerifikasiDokumen",
            {
                idDokumen
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memverifikasi dokumen."
        );
    }
    return result;
}


/* ======================================================
   TOLAK DOKUMEN
====================================================== */
export async function smartofficeTolakDokumenApi(
    idDokumen,
    alasan
){
    const result =
        await smartofficeApi(
            "smartofficeTolakDokumen",
            {
                idDokumen,
                alasan
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal menolak dokumen."
        );
    }
    return result;
}