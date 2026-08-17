/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET TOTAL PENDING APPROVAL
====================================================== */
export async function smartofficeGetTotalPendingApproval(
    nip
){

    /* =========================
       REQUEST API
    ========================= */   
    const response =
        await smartofficeApi(
            "totalPendingApproval",
            {
                nip
            }
        );

    /* =========================
       API FAILED
    ========================= */
    if(
        !response.success
    ){
        throw new Error(
            response.message
        );
    }

    /* =========================
       RETURN TOTAL
    ========================= */
    return response.data;
}


/* ======================================================
   GET TOTAL PENDING SEMUA APPROVAL
   CUTI + DOKUMEN
====================================================== */
export async function smartofficeGetTotalPendingApprovalAll(
    nip,
    role
){

    const response =
        await smartofficeApi(
            "smartofficeGetTotalPendingApprovalAll",
            {
                nip,
                role
            }
        );

    if(!response.success){
        throw new Error(
            response.message ||
            "Gagal memuat total pending approval."
        );
    }

    return Number(
        response.data
    ) || 0;
}