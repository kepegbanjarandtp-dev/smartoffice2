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
    rowIndex
){

    const sessionData =
        smartofficeGetSession();

    const response =
        await smartofficeApi(
            "bukaLockSuratMasuk",
            {
                rowIndex,
                nip:
                    sessionData?.nip || "",
                role:
                    sessionData?.role || ""
            }
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