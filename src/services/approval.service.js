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