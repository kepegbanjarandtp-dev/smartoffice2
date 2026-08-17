/* ======================================================
   SMART OFFICE BUKU TAMU SERVICE
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET DATA BUKU TAMU
====================================================== */
export async function smartofficeGetBukuTamu(){

    return await smartofficeApi(
        "smartofficeGetBukuTamu"
    );
}