/* ======================================================
   SMART OFFICE V3
   FIRESTORE - CUTI
====================================================== */
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET RIWAYAT CUTI USER
====================================================== */
export async function smartofficeGetRiwayatCutiFirestore(nip) {

    const q = query(
        collection(smartofficeFirestore, "cuti"),
        where("nipNrp", "==", String(nip).trim())
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {

        const d = doc.data();

        return {
            ...d,

            // Mapping Firestore → format yang dipakai frontend
            tanggalSurat: d.tanggalSuratPermohonan,
            tanggalAwal: d.tanggalAwalCuti,
            tanggalAkhir: d.tanggalAkhirCuti,

            lampiran: d.fileLampiranUrl,

            delegasi: d.penerimaDelegasi,
            nipDelegasi: d.nipNrpDelegasi,
            tugasDelegasi: d.tugasYangDidelegasikan,

            approval1Tanggal: d.approval1Tgl,
            approval2Tanggal: d.approval2Tgl,

            pdfUrl: d.filePdfUrl
        };
    });
}


/* ======================================================
   GET CUTI STATS USER
====================================================== */
export async function smartofficeGetCutiStatsFirestore(nip) {

    const nipValue = String(nip || "").trim();

    if(!nipValue){
        return {
            success: false,
            message: "NIP tidak boleh kosong."
        };
    }

    /* =========================
       GET SISA CUTI
       DARI PEGAWAI
    ========================= */
    const pegawaiRef = doc(
        smartofficeFirestore,
        "pegawai",
        nipValue
    );

    const pegawaiSnapshot = await getDoc(pegawaiRef);

    let sisaCuti = 0;

    if(pegawaiSnapshot.exists()){
        const pegawai = pegawaiSnapshot.data();
        sisaCuti = Number(pegawai.sisaCuti || 0);
    }

    /* =========================
       GET DATA CUTI USER
    ========================= */
    const q = query(
        collection(smartofficeFirestore, "cuti"),
        where("nipNrp", "==", nipValue)
    );

    const snapshot = await getDocs(q);

    let menunggu = 0;
    let disetujui = 0;

    snapshot.forEach(docSnapshot => {

        const data = docSnapshot.data();
        const status = String(data.status || "").trim();

        if(
            status === "MENUNGGU_APPROVAL_1" ||
            status === "MENUNGGU_APPROVAL_2"
        ){
            menunggu++;
        }

        if(status === "DISETUJUI"){
            disetujui++;
        }
    });

    return {
        success: true,
        data: {
            sisaCuti: sisaCuti,
            totalMenunggu: menunggu,
            totalDisetujui: disetujui
        }
    };
}