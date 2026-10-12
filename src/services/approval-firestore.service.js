/* ======================================================
   APPROVAL CUTI - FIRESTORE SERVICE
====================================================== */
import {
    collection,
    getDocs,
    getCountFromServer,
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
   OPTIMASI: FILTER LANGSUNG DI FIRESTORE
====================================================== */
export async function smartofficeGetApprovalCutiFirestore(nip){

    try{
        const loginNip = String(nip || "")
            .replace(/'/g, "")
            .replace(/\.0$/, "")
            .trim();

        if(!loginNip){
            return [];
        }

        const cutiCollection = collection(
            smartofficeFirestore,
            "cuti"
        );

        /* APPROVAL TAHAP 1 */
        const approval1Query = query(
            cutiCollection,
            where("recordStatus", "==", "ACTIVE"),
            where("status", "==", "MENUNGGU_APPROVAL_1"),
            where("approval1Nip", "==", loginNip)
        );

        /* APPROVAL TAHAP 2 */
        const approval2Query = query(
            cutiCollection,
            where("recordStatus", "==", "ACTIVE"),
            where("status", "==", "MENUNGGU_APPROVAL_2"),
            where("approval2Nip", "==", loginNip)
        );

        const [
            approval1Snapshot,
            approval2Snapshot
        ] = await Promise.all([
            getDocs(approval1Query),
            getDocs(approval2Query)
        ]);

        const result = [];

        function mapCuti(docSnapshot){
            const data = docSnapshot.data();

            return {
                idCuti:
                    data.idCuti || docSnapshot.id,

                tanggalSurat:
                    data.tanggalSuratPermohonan || "-",

                nama: data.nama || "",
                nip: data.nipNrp || "",
                jabatan: data.jabatan || "",
                statusKepegawaian: data.statusKepegawaian || "",
                jenisCuti: data.jenisCuti || "",
                tanggalAwal: data.tanggalAwalCuti || "",
                tanggalAkhir: data.tanggalAkhirCuti || "",
                jumlahCuti: data.jumlahCuti || 0,
                keperluan: data.keperluan || "",
                lampiran: data.fileLampiranUrl || "",
                delegasi: data.penerimaDelegasi || "",
                nipDelegasi: data.nipNrpDelegasi || "-",
                tugasDelegasi: data.tugasYangDidelegasikan || "",
                alamatSaatCuti: data.alamatSaatCuti || "-",
                sisaCuti: data.sisaCuti || 0,
                masaKerja: data.masaKerja || "-",

                status: String(data.status || "").trim(),

                approval1Nip: String(data.approval1Nip || "")
                    .replace(/'/g, "")
                    .replace(/\.0$/, "")
                    .trim(),

                approval2Nip: String(data.approval2Nip || "")
                    .replace(/'/g, "")
                    .replace(/\.0$/, "")
                    .trim()
            };
        }

        approval1Snapshot.forEach(docSnapshot => {
            result.push(mapCuti(docSnapshot));
        });

        approval2Snapshot.forEach(docSnapshot => {
            result.push(mapCuti(docSnapshot));
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
   GET APPROVAL SPD — FIRESTORE
   OPTIMASI: FILTER STATUS LANGSUNG DI FIRESTORE

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
        const spdQuery = query(
            collection(
                smartofficeFirestore,
                "smartspdBLUD"
            ),
            where("STATUS_SPD", "in", [
                "MENUNGGU REVIEW",
                "PERLU REVISI"
            ])
        );

        const snapshot = await getDocs(spdQuery);

        const result = snapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();

            return {
                idSPD:
                    data["ID SPD"] ||
                    data.idSPD ||
                    docSnapshot.id,

                nama:
                    data["Nama"] || "",

                nip:
                    data["NIP / NRP"] || "",

                pangkatGolongan:
                    data["Pangkat & Golongan"] || "",

                jabatan:
                    data["Jabatan"] || "",

                kegiatan:
                    data["Kegiatan"] || "",

                lokasi:
                    data["Lokasi"] || "",

                tanggalSPD:
                    data["Tanggal SPD Dibuat"] || "",

                tanggalBerangkat:
                    data["Tanggal Berangkat"] || "",

                tanggalPulang:
                    data["Tanggal Pulang"] || "",

                jumlahHari:
                    data["Jumlah Hari"] || "",

                tipeKeberangkatan:
                    data["Tipe Keberangkatan"] || "",

                jenisPerjalananDinas:
                    data["JENIS_PERJALANAN_DINAS"] || "",

                statusSPD:
                    String(data["STATUS_SPD"] || "").trim(),

                reviewer:
                    data["REVIEWER"] || "",

                reviewerNip:
                    data["REVIEWER_NIP"] || "",

                tglReview:
                    data["TGL_REVIEW_SPD"] || "",

                tglApprove:
                    data["TGL_APPROVE_SPD"] || "",

                tglRevisi:
                    data["TGL_REVISI_SPD"] || "",

                catatanRevisi:
                    data["CATATAN_REVISI_SPD"] || "",

                totalRevisi:
                    data["TOTAL_REVISI_SPD"] || "0",

                linkPdf:
                    data["LINK_PDF_SPD"] || "",

                statusData:
                    data["STATUS_DATA"] || "",

                pdfGenerated:
                    data["PDF_GENERATED"] || "",

                lastUpdate:
                    data["LAST_UPDATE"] || "",

                pengikut: [
                    data["Nama Pengikut 1"] || "",
                    data["Nama Pengikut 2"] || "",
                    data["Nama Pengikut 3"] || "",
                    data["Nama Pengikut 4"] || ""
                ],

                raw: data
            };
        });

        /* URUTKAN TERBARU */
        result.sort((a, b) => {
            const dateA = String(a.tanggalSPD || "");
            const dateB = String(b.tanggalSPD || "");

            return dateB.localeCompare(dateA);
        });

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
   WATCH STATUS APPROVAL CUTI
====================================================== */
export function smartofficeWatchApprovalCutiFirestore(
    idCuti,
    callback
){
    const targetId =
        String(idCuti || "").trim();

    if(!targetId){
        console.warn(
            "WATCH APPROVAL CUTI: ID cuti kosong."
        );

        return function(){};
    }

    if(typeof callback !== "function"){
        console.warn(
            "WATCH APPROVAL CUTI: callback tidak valid."
        );

        return function(){};
    }

    try{
        const cutiRef =
            doc(
                smartofficeFirestore,
                "cuti",
                targetId
            );

        const unsubscribe =
            onSnapshot(
                cutiRef,

                snapshot => {
                    if(!snapshot.exists()){
                        console.warn(
                            "WATCH APPROVAL CUTI: dokumen tidak ditemukan:",
                            targetId
                        );

                        return;
                    }

                    const data =
                        snapshot.data();

                    const status =
                        String(
                            data.status || ""
                        ).trim();

                    console.log(
                        "WATCH APPROVAL CUTI:",
                        targetId,
                        {
                            status
                        }
                    );

                    callback({
                        idCuti:
                            data.idCuti ||
                            targetId,

                        status,
                        data
                    });
                },

                error => {
                    console.error(
                        "WATCH APPROVAL CUTI FIRESTORE ERROR:",
                        targetId,
                        error
                    );

                    callback({
                        error: true,
                        idCuti: targetId,
                        message:
                            error?.message ||
                            "Gagal memantau status approval cuti."
                    });
                }
            );

        return unsubscribe;
    }
    catch(error){
        console.error(
            "WATCH APPROVAL CUTI INIT ERROR:",
            targetId,
            error
        );

        return function(){};
    }
}
