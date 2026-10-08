/* ======================================================
   APPROVAL CUTI - FIRESTORE SERVICE
====================================================== */
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    onSnapshot
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
   WATCH STATUS VERIFIKASI DOKUMEN
====================================================== */
export function smartofficeWatchVerifikasiDokumenFirestore(
    idDokumen,
    callback
){
    const targetId =
        String(idDokumen || "").trim();

    if(!targetId){
        console.warn(
            "WATCH VERIFIKASI: ID dokumen kosong."
        );

        return function(){};
    }

    if(typeof callback !== "function"){
        console.warn(
            "WATCH VERIFIKASI: callback tidak valid."
        );

        return function(){};
    }

    try{
        const dokumenRef =
            doc(
                smartofficeFirestore,
                "dokumenPegawai",
                targetId
            );

        const unsubscribe =
            onSnapshot(
                dokumenRef,

                snapshot => {
                    if(!snapshot.exists()){
                        console.warn(
                            "WATCH VERIFIKASI: dokumen tidak ditemukan:",
                            targetId
                        );

                        return;
                    }

                    const data =
                        snapshot.data();

                    const statusVerifikasi =
                        String(
                            data.statusVerifikasi || ""
                        ).trim();

                    const lockDokumen =
                        String(
                            data.isLock || ""
                        ).trim();

                    console.log(
                        "WATCH VERIFIKASI:",
                        targetId,
                        {
                            statusVerifikasi,
                            lockDokumen
                        }
                    );

                    callback({
                        idDokumen:
                            data.idDokumen ||
                            targetId,
                        statusVerifikasi,
                        lockDokumen,
                        data
                    });
                },

                error => {
                    console.error(
                        "WATCH VERIFIKASI FIRESTORE ERROR:",
                        targetId,
                        error
                    );

                    callback({
                        error: true,
                        idDokumen: targetId,
                        message:
                            error?.message ||
                            "Gagal memantau status dokumen."
                    });
                }
            );

        return unsubscribe;
    }
    catch(error){
        console.error(
            "WATCH VERIFIKASI INIT ERROR:",
            targetId,
            error
        );

        return function(){};
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


/* ======================================================
   GET APPROVAL SPD — FIRESTORE

   ROLE:
   - PJ
   - ADMIN
   - SUPERADMIN

   STATUS:
   - MENUNGGU REVIEW
   - PERLU REVISI
====================================================== */
export async function smartofficeGetApprovalSPDFirestore(){

    try{
        /* ==================================================
           AMBIL SEMUA DATA SPD
        ================================================== */
        const snapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "smartspdBLUD"
                )
            );

        /* ==================================================
           FILTER STATUS APPROVAL SPD
        ================================================== */
        const result =
            snapshot.docs
                .map(
                    docSnapshot => {
                        const data =
                            docSnapshot.data();

                        return {
                            idSPD:
                                data["ID SPD"] ||
                                data.idSPD ||
                                docSnapshot.id,

                            nama:
                                data["Nama"] ||
                                "",

                            nip:
                                data["NIP / NRP"] ||
                                "",

                            pangkatGolongan:
                                data["Pangkat & Golongan"] ||
                                "",

                            jabatan:
                                data["Jabatan"] ||
                                "",

                            kegiatan:
                                data["Kegiatan"] ||
                                "",

                            lokasi:
                                data["Lokasi"] ||
                                "",

                            tanggalSPD:
                                data["Tanggal SPD Dibuat"] ||
                                "",

                            tanggalBerangkat:
                                data["Tanggal Berangkat"] ||
                                "",

                            tanggalPulang:
                                data["Tanggal Pulang"] ||
                                "",

                            jumlahHari:
                                data["Jumlah Hari"] ||
                                "",

                            tipeKeberangkatan:
                                data["Tipe Keberangkatan"] ||
                                "",

                            jenisPerjalananDinas:
                                data["JENIS_PERJALANAN_DINAS"] ||
                                "",

                            statusSPD:
                                String(
                                    data["STATUS_SPD"] ||
                                    ""
                                ).trim(),

                            reviewer:
                                data["REVIEWER"] ||
                                "",

                            reviewerNip:
                                data["REVIEWER_NIP"] ||
                                "",

                            tglReview:
                                data["TGL_REVIEW_SPD"] ||
                                "",

                            tglApprove:
                                data["TGL_APPROVE_SPD"] ||
                                "",

                            tglRevisi:
                                data["TGL_REVISI_SPD"] ||
                                "",

                            catatanRevisi:
                                data["CATATAN_REVISI_SPD"] ||
                                "",

                            totalRevisi:
                                data["TOTAL_REVISI_SPD"] ||
                                "0",

                            linkPdf:
                                data["LINK_PDF_SPD"] ||
                                "",

                            statusData:
                                data["STATUS_DATA"] ||
                                "",

                            pdfGenerated:
                                data["PDF_GENERATED"] ||
                                "",

                            lastUpdate:
                                data["LAST_UPDATE"] ||
                                "",

                            pengikut: [
                                data["Nama Pengikut 1"] ||
                                "",

                                data["Nama Pengikut 2"] ||
                                "",

                                data["Nama Pengikut 3"] ||
                                "",

                                data["Nama Pengikut 4"] ||
                                ""
                            ],

                            raw:
                                data
                        };
                    }
                )
                .filter(
                    item => {
                        return (
                            item.statusSPD ===
                                "MENUNGGU REVIEW" ||

                            item.statusSPD ===
                                "PERLU REVISI"
                        );
                    }
                );

        /* ==================================================
           URUTKAN TERBARU
        ================================================== */
        result.sort(
            function(a, b){
                const dateA =
                    String(
                        a.tanggalSPD || ""
                    );

                const dateB =
                    String(
                        b.tanggalSPD || ""
                    );

                return dateB.localeCompare(
                    dateA
                );
            }
        );

        return result;
    }
    catch(error){
        console.error(
            "Firestore Get Approval SPD Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil approval SPD dari Firestore."
        );
    }
}


/* ======================================================
   GET TOTAL APPROVAL SPD — FIRESTORE
====================================================== */
export async function smartofficeGetTotalApprovalSPDFirestore(){

    try{
        const snapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "smartspdBLUD"
                )
            );

        let total = 0;

        snapshot.docs.forEach(
            docSnapshot => {
                const data =
                    docSnapshot.data();

                const statusSPD =
                    String(
                        data["STATUS_SPD"] ||
                        ""
                    ).trim();
                if(
                    statusSPD ===
                        "MENUNGGU REVIEW" ||

                    statusSPD ===
                        "PERLU REVISI"
                ){
                    total++;
                }
            }
        );

        return total;
    }
    catch(error){
        console.error(
            "Firestore Total Approval SPD Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal menghitung approval SPD."
        );
    }
}
