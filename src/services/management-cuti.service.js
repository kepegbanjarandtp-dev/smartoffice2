import {
    smartofficeApi
} from "../core/api.js";

/* ======================================================
   GET REKAP CUTI PEGAWAI
====================================================== */
export async function smartofficeGetRekapPegawai(){

    const response =
        await smartofficeApi(
            "smartofficeGetRekapCutiPegawai"
        );

    if(!response.success){
        throw new Error(
            response.message
        );
    }

    return response.data;

}

/* ======================================================
   GET ALL RIWAYAT CUTI
====================================================== */
export async function smartofficeGetAllRiwayatCuti(){

    const response =
        await smartofficeApi(
            "smartofficeGetAllRiwayatCuti"
        );

    if(!response.success){
        throw new Error(
            response.message
        );
    }

    return response.data;

}