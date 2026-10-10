/* ======================================================
   SMARTSPD BLUD SERVICE
   WRITE / BUSINESS PROCESS → GAS via smartofficeApi()
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   SUBMIT SPD
====================================================== */
export async function smartofficeSubmitSPD(data){
    return await smartofficeApi(
        "smartofficeSubmitSPD",
        data
    );
}


/* ======================================================
   UPDATE / EDIT SPD
====================================================== */
export async function smartofficeUpdateSPD(data){
    return await smartofficeApi(
        "smartofficeUpdateSPD",
        data
    );
}


/* ======================================================
   PROSES SPD
====================================================== */
export async function smartofficeProsesSPD(data){
    return await smartofficeApi(
        "smartofficeProsesSPD",
        data
    );
}


/* ======================================================
   BUKA LOCK SPD
====================================================== */
export async function smartofficeUnlockSPD(data){
    return await smartofficeApi(
        "smartofficeUnlockSPD",
        data
    );
}


/* ======================================================
   VERIFIKASI SPJ
   STATUS: REVISI / SELESAI
====================================================== */
export async function smartofficeVerifySPJ(data){
    return await smartofficeApi(
        "smartofficeVerifySPJ",
        data
    );
}


/* ======================================================
   SIMPAN PEMBAYARAN SPD
   INPUT:
   - ID SPD
   - Jumlah uang per orang
   - Jumlah petugas dibayarkan
   - Tanggal transfer
   - Bukti transfer
====================================================== */
export async function smartofficeSimpanPembayaranSPD(data){
    return await smartofficeApi(
        "smartofficeSimpanPembayaranSPD",
        data
    );
}