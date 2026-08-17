/* ======================================================
   API
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET DATA PEGAWAI
====================================================== */
export async function smartofficeGetPegawaiByNip(
    nip
){
    const response =
        await smartofficeApi(
            "smartofficeGetPegawaiByNip",
            {
                nip
            }
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
   SEARCH PEGAWAI
====================================================== */
export async function smartofficeSearchPegawai(
    keyword
){
    const response =
        await smartofficeApi(
            "smartofficeSearchPegawai",
            {
                keyword
            }
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
   GET JUMLAH CUTI
====================================================== */
export async function smartofficeGetJumlahCuti(
    tanggalAwal,
    tanggalAkhir
){
    const response =
        await smartofficeApi(
            "smartofficeGetJumlahCuti",
            {
                tanggalAwal,
                tanggalAkhir
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


/* ======================================================
   SUBMIT CUTI
====================================================== */
export async function smartofficeSubmitCuti(
    formData
){
    const response =
        await smartofficeApi(
            "smartofficeSubmitCuti",
            formData
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


/* ======================================================
   GET RIWAYAT CUTI
====================================================== */
export async function smartofficeGetRiwayatCuti(
    nip
){
    const response =
        await smartofficeApi(
            "smartofficeGetRiwayatCuti",
            {
                nip
            }
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