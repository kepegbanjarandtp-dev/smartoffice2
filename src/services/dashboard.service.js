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