/* ======================================================
   SMART OFFICE V3
   FIRESTORE PEGAWAI SERVICE
====================================================== */
import {
    collection,
    getDocs,
    doc,
    getDoc
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET DATA PEGAWAI DARI FIRESTORE
====================================================== */
export async function smartofficeGetPegawaiFromFirestore(nip){

    try{
        const nipValue =
            String(nip || "").trim();

        if(!nipValue){
            return {
                success: false,
                message: "NIP tidak boleh kosong."
            };
        }

        const pegawaiRef =
            doc(
                smartofficeFirestore,
                "pegawai",
                nipValue
            );

        const snapshot =
            await getDoc(
                pegawaiRef
            );

        /* =========================
           DATA TIDAK DITEMUKAN
        ========================= */
        if(!snapshot.exists()){
            return {
                success: false,
                message: "Data pegawai tidak ditemukan."
            };
        }

        /* =========================
           DATA DITEMUKAN
        ========================= */
        const data = snapshot.data();
        return {
            success: true,
            data: {
                ...data,
                pangkat: data.pangkatGol || ""
            }
        };
    }
    catch(error){
        console.error(
            "Firestore Get Pegawai Error:",
            error
        );

        return {
            success: false,
            message:
                error?.message ||
                "Gagal mengambil data pegawai dari Firestore."
        };
    }
}


/* ======================================================
   GET SEMUA DATA PEGAWAI DARI FIRESTORE
====================================================== */
export async function smartofficeGetAllPegawaiFromFirestore(){

    try{
        const snapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "pegawai"
                )
            );

        return {
            success: true,
            data: snapshot.docs.map(docSnapshot => ({
                ...docSnapshot.data(),
                nip: docSnapshot.id
            }))
        };
    }
    catch(error){

        console.error(
            "Firestore Get All Pegawai Error:",
            error
        );

        return {
            success: false,
            data: [],
            message:
                error?.message ||
                "Gagal mengambil data pegawai dari Firestore."
        };
    }
}