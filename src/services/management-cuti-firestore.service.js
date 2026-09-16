/* ======================================================
   SMART OFFICE V3
   FIRESTORE - MANAGEMENT CUTI
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
   GET REKAP CUTI PEGAWAI
====================================================== */
export async function smartofficeGetRekapPegawaiFirestore(){

    try{
        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "pegawai"
                ),
                where(
                    "status",
                    "==",
                    "AKTIF"
                )
            );

        const snapshot =
            await getDocs(q);

        const result =
            snapshot.docs.map(docSnapshot => {
                const data =
                    docSnapshot.data();

                return {
                    nama:
                        data.nama || "",

                    nip:
                        docSnapshot.id,

                    jabatan:
                        data.jabatan || "",

                    statusKepegawaian:
                        data.statusKepegawaian || "",

                    totalCuti:
                        data.totalCutiTahunan || 0,

                    cutiTerpakai:
                        data.cutiTerpakai || 0,

                    sisaCuti:
                        data.sisaCuti || 0,

                    tahunCuti:
                        data.tahunCuti || ""
                };
            });

        result.sort((a, b) =>
            String(a.nama || "").localeCompare(
                String(b.nama || ""),
                "id",
                {
                    sensitivity: "base"
                }
            )
        );

        return result;
    }
    catch(error){
        console.error(
            "Firestore Get Rekap Pegawai Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil rekap cuti pegawai dari Firestore."
        );
    }
}


/* ======================================================
   GET ALL RIWAYAT CUTI
   SUMBER : FIRESTORE CUTI
====================================================== */
export async function smartofficeGetAllRiwayatCutiFirestore(
    bulan,
    tahun
){

    try{

        const bulanNumber =
            String(bulan).padStart(2, "0");

        const tahunNumber =
            String(tahun);

        const tanggalAwal =
            `${tahunNumber}-${bulanNumber}-01`;

        const bulanBerikutnya =
            Number(bulanNumber) === 12
                ? 1
                : Number(bulanNumber) + 1;

        const tahunBerikutnya =
            Number(bulanNumber) === 12
                ? Number(tahunNumber) + 1
                : Number(tahunNumber);

        const tanggalAkhir =
            `${tahunBerikutnya}-${String(
                bulanBerikutnya
            ).padStart(2, "0")}-01`;

        console.log(
            "FIRESTORE RIWAYAT CUTI:",
            tanggalAwal,
            "sampai",
            tanggalAkhir
        );

        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "cuti"
                ),
                where(
                    "tanggalAwalCuti",
                    ">=",
                    tanggalAwal
                ),
                where(
                    "tanggalAwalCuti",
                    "<",
                    tanggalAkhir
                )
            );

        const snapshot =
            await getDocs(q);

        const result =
            snapshot.docs.map(docSnapshot => {

                const data =
                    docSnapshot.data();

                return {
                    idCuti:
                        data.idCuti ||
                        docSnapshot.id,

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
                        data.jumlahCuti || "",

                    tahunCuti:
                        data.tahunCuti || "",

                    keperluan:
                        data.keperluan || "",

                    lampiran:
                        data.fileLampiranUrl || "",

                    delegasi:
                        data.penerimaDelegasi || "",

                    nipDelegasi:
                        data.nipNrpDelegasi || "",

                    tugasDelegasi:
                        data.tugasYangDidelegasikan || "",

                    status:
                        String(
                            data.status || ""
                        ).trim(),

                    approval1:
                        data.approval1 || "",

                    approval1Nip:
                        data.approval1Nip || "",

                    approval1Status:
                        data.approval1Status || "",

                    approval1Tanggal:
                        data.approval1Tgl || "",

                    approval1Catatan:
                        data.approval1Catatan || "",

                    approval2:
                        data.approval2 || "",

                    approval2Nip:
                        data.approval2Nip || "",

                    approval2Status:
                        data.approval2Status || "",

                    approval2Tanggal:
                        data.approval2Tgl || "",

                    approval2Catatan:
                        data.approval2Catatan || "",

                    pdfUrl:
                        data.filePdfUrl || "",

                    tanggalSurat:
                        data.tanggalSuratPermohonan || "",

                    alamatSaatCuti:
                        data.alamatSaatCuti || "",

                    sisaCuti:
                        data.sisaCuti || ""
                };
            });

        result.sort(function(a, b){
            return new Date(a.tanggalAwal) -
                   new Date(b.tanggalAwal);
        });

        return result;

    }
    catch(error){

        console.error(
            "Firestore Get Riwayat Cuti Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil riwayat cuti dari Firestore."
        );
    }
}


/* ======================================================
   GET DATA KEPALA PUSKESMAS
====================================================== */
export async function smartofficeGetKapusFirestore(){

    try{
        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "pegawai"
                ),
                where(
                    "role",
                    "==",
                    "KAPUS"
                )
            );

        const snapshot =
            await getDocs(q);
        if(
            snapshot.empty
        ){
            return null;
        }

        const data =
            snapshot.docs[0].data();

        return {
            ...data,
            nip: snapshot.docs[0].id
        };
    }
    catch(error){
        console.error(
            "Firestore Get Kapus Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil data Kepala Puskesmas dari Firestore."
        );
    }
}