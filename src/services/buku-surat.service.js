/* ======================================================
   SMART OFFICE BUKU SURAT SERVICE
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET SEMUA DATA SURAT MASUK
   UNTUK FILTER & CLIENT-SIDE VIEW
====================================================== */
export async function smartofficeGetAllSuratMasuk(){

    const response =
        await smartofficeApi(
            "getAllSuratMasuk"
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
   BUKA LOCK SURAT MASUK
====================================================== */
export async function smartofficeBukaLockSuratMasuk(
    rowIndex,
    nip,
    role
){

    const result =
        await smartofficeApi(
            "smartofficeBukaLockSuratMasuk",
            {
                rowIndex,
                nip,
                role
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal membuka lock Surat Masuk."
        );
    }

    return result;
}