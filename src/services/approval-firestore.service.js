/* ======================================================
   APPROVAL CUTI - FIRESTORE SERVICE
====================================================== */

import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET APPROVAL CUTI
====================================================== */
export async function smartofficeGetApprovalCutiFirestore(nip){

    try{
        const loginNip =
            String(nip || "")
                .replace(/'/g, "")
                .replace(/\.0$/, "")
                .trim();

        if(!loginNip){
            return [];
        }

        /* ==================================================
           AMBIL DATA CUTI
        ================================================== */
        const snapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "cuti"
                )
            );

        /* ==================================================
           FILTER SESUAI HAK APPROVAL
        ================================================== */
        const result =
            snapshot.docs
                .map(docSnapshot => {
                    const data =
                        docSnapshot.data();

                    return {
                        idCuti:
                            data.idCuti ||
                            docSnapshot.id,

                        tanggalSurat:
                            data.tanggalSuratPermohonan || "-",

                        nama:
                            data.nama || "",

                        nip:
                            data.nipNrp || "",

                        jabatan:
                            data.jabatan || "",

                        statusKepegawaian:
                            data.statusKepegawaian || "",

                        jenisCuti:
                            data.jenisCuti || "",

                        tanggalAwal:
                            data.tanggalAwalCuti || "",

                        tanggalAkhir:
                            data.tanggalAkhirCuti || "",

                        jumlahCuti:
                            data.jumlahCuti || 0,

                        keperluan:
                            data.keperluan || "",

                        lampiran:
                            data.fileLampiranUrl || "",

                        delegasi:
                            data.penerimaDelegasi || "",

                        nipDelegasi:
                            data.nipNrpDelegasi || "-",

                        tugasDelegasi:
                            data.tugasYangDidelegasikan || "",

                        alamatSaatCuti:
                            data.alamatSaatCuti || "-",

                        sisaCuti:
                            data.sisaCuti || 0,

                        masaKerja:
                            data.masaKerja || "-",

                        status:
                            String(data.status || "").trim(),

                        approval1Nip:
                            String(data.approval1Nip || "")
                                .replace(/'/g, "")
                                .replace(/\.0$/, "")
                                .trim(),

                        approval2Nip:
                            String(data.approval2Nip || "")
                                .replace(/'/g, "")
                                .replace(/\.0$/, "")
                                .trim()
                    };
                })
                .filter(item => {
                    const isApproval1 =
                        item.status === "MENUNGGU_APPROVAL_1" &&
                        item.approval1Nip === loginNip;

                    const isApproval2 =
                        item.status === "MENUNGGU_APPROVAL_2" &&
                        item.approval2Nip === loginNip;

                    return (
                        isApproval1 ||
                        isApproval2
                    );
                });

        return result;
    }
    catch(error){
        console.error(
            "Firestore Get Approval Cuti Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil approval cuti dari Firestore."
        );
    }
}


/* ======================================================
   GET DOKUMEN VERIFIKASI
====================================================== */
export async function smartofficeGetDokumenVerifikasiFirestore(){

    try{
        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "dokumenPegawai"
                ),
                where(
                    "statusVerifikasi",
                    "==",
                    "MENUNGGU_VERIFIKASI"
                )
            );

        const snapshot =
            await getDocs(q);

        const result =
            snapshot.docs.map(
                docSnapshot => {
                    const data =
                        docSnapshot.data();
                    return {
                        idDokumen:
                            data.idDokumen ||
                            docSnapshot.id,

                        nip:
                            data.nip || "",

                        nama:
                            data.namaPegawai || "",

                        statusKepegawaian:
                            data.statusKepegawaian || "",

                        jenisPegawai:
                            data.jenisPegawai || "",

                        kodeDokumen:
                            data.kodeDokumen || "",

                        namaDokumen:
                            data.namaDokumen || "",

                        nomorDokumen:
                            data.nomorDokumen || "",

                        fileName:
                            data.namaFile || "",

                        fileId:
                            data.fileId || "",

                        fileUrl:
                            data.fileUrl || "",

                        keterangan:
                            data.keterangan || ""
                    };
                }
            );

        return result;
    }
    catch(error){
        console.error(
            "Firestore Get Dokumen Verifikasi Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil dokumen verifikasi dari Firestore."
        );
    }
}


/* ======================================================
   GET TOTAL PENDING APPROVAL
   CUTI + DOKUMEN
====================================================== */
export async function smartofficeGetTotalPendingApprovalFirestore(
    nip,
    role
){

    try{
        const loginNip =
            String(nip || "")
                .replace(/'/g, "")
                .replace(/\.0$/, "")
                .trim();

        /* ==================================================
           PENDING CUTI
        ================================================== */
        const cutiSnapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "cuti"
                )
            );

        let totalCuti = 0;

        cutiSnapshot.docs.forEach(
            docSnapshot => {
                const data =
                    docSnapshot.data();

                const recordStatus =
                    String(
                        data.recordStatus || ""
                    ).trim();

                if(recordStatus !== "ACTIVE"){
                    return;
                }

                const status =
                    String(
                        data.status || ""
                    ).trim();

                const approval1Nip =
                    String(
                        data.approval1Nip || ""
                    )
                    .replace(/'/g, "")
                    .replace(/\.0$/, "")
                    .trim();

                const approval2Nip =
                    String(
                        data.approval2Nip || ""
                    )
                    .replace(/'/g, "")
                    .replace(/\.0$/, "")
                    .trim();

                const isApproval1 =
                    status === "MENUNGGU_APPROVAL_1" &&
                    approval1Nip === loginNip;

                const isApproval2 =
                    status === "MENUNGGU_APPROVAL_2" &&
                    approval2Nip === loginNip;
                if(
                    isApproval1 ||
                    isApproval2
                ){
                    totalCuti++;
                }
            }
        );

        /* ==================================================
           PENDING DOKUMEN
        ================================================== */
        let totalDokumen = 0;

        if(
            role === "PJ" ||
            role === "ADMIN" ||
            role === "SUPERADMIN"
        ){
            const dokumenSnapshot =
                await getDocs(
                    query(
                        collection(
                            smartofficeFirestore,
                            "dokumenPegawai"
                        ),
                        where(
                            "statusVerifikasi",
                            "==",
                            "MENUNGGU_VERIFIKASI"
                        )
                    )
                );

            totalDokumen =
                dokumenSnapshot.size;
        }

        /* ==================================================
           TOTAL
        ================================================== */
        return totalCuti + totalDokumen;
    }
    catch(error){
        console.error(
            "Firestore Total Pending Approval Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal menghitung total pending approval."
        );
    }
}