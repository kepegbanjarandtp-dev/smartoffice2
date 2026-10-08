/* ======================================================
   SMARTSPD BLUD SERVICE
   WRITE / BUSINESS PROCESS → GAS via smartofficeApi()
===================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   SUBMIT SPD
====================================================== */
export async function smartofficeSubmitSPD(
    data
){
    return await smartofficeApi(
        "smartofficeSubmitSPD",
        data
    );
}


/* ======================================================
   UPDATE / EDIT SPD
====================================================== */
export async function smartofficeUpdateSPD(
    data
){
    return await smartofficeApi(
        "smartofficeUpdateSPD",
        data
    );
}


/* ======================================================
   PROSES SPD
====================================================== */
export async function smartofficeProsesSPD(
    data
){
    return await smartofficeApi(
        "smartofficeProsesSPD",
        data
    );
}