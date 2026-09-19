/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";

import {
    smartofficeGetTotalPendingApprovalFirestore
} from "./approval-firestore.service.js";


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

    return await smartofficeGetTotalPendingApprovalFirestore(
        nip,
        role
    );
}