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