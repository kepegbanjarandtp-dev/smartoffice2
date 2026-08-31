/* ================================================================================
   DOKUMEN SAYA
================================================================================ */

/* ======================================================
   IMPORT — SESSION
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";


/* ======================================================
   IMPORT — ROUTER
====================================================== */
import {
    smartofficeNavigate
} from "../../core/router.js";


/* ======================================================
   IMPORT — COMPONENT
====================================================== */
import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeOpenPreviewDokumen,
    smartofficeClosePreviewDokumen,
    smartofficeZoomIn,
    smartofficeZoomOut
} from "../../components/preview/preview.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeShowLoading,
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";


/* ======================================================
   IMPORT — SERVICE
====================================================== */
import {
    smartofficeGetPegawaiByNip,
    smartofficeGetMasterDokumen,
    smartofficeGetDokumenPegawai,
    smartofficeUploadDokumen
} from "../../services/dokumen-saya.service.js";


/* ================================================================================
   GLOBAL STATE
================================================================================ */

/* ======================================================
   DOKUMEN LOADED
====================================================== */
let smartofficeDokumenLoaded =
    false;

/* ======================================================
   DATA DOKUMEN SAYA
====================================================== */
let smartofficeDokumenSayaData =
    [];

/* ======================================================
   EDIT DOKUMEN
====================================================== */
let smartofficeEditDokumenId =
    null;

/* ======================================================
   FILE CHANGE HANDLER
====================================================== */
let smartofficeDokumenFileChangeHandler =
    null;


/* ================================================================================
   LIFECYCLE
================================================================================ */

/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       CHECK LOGIN SESSION
    ========================= */
    if(
        !smartofficeCheckSession()
    ){
        return;
    }

    /* =========================
       GET SESSION
    ========================= */
    const sessionData =
        smartofficeGetSession();

    /* =========================
       SESSION NOT FOUND
    ========================= */
    if(
        !sessionData
    ){
        await smartofficeLogout();

        return;
    }

    /* =========================
       RESET PAGE STATE
    ========================= */
    smartofficeDokumenLoaded =
        false;

    smartofficeDokumenSayaData =
        [];

    smartofficeEditDokumenId =
        null;

    /* =========================
       INIT UI COMPONENT
       Tidak bergantung API
    ========================= */
    smartofficeInitUploadDokumen();

    smartofficeSwitchDokumenTab(
        "upload"
    );

    /* =========================
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "dokumen"
    );

    /* =========================
       LOAD DATA
       BERJALAN PARALEL
    ========================= */

    await Promise.all([
        smartofficeLoadDataPegawaiDokumen(
            sessionData.nip
        ),

        smartofficeLoadMasterDokumen(),

        smartofficeLoadDokumenSaya(
            sessionData.nip
        )
    ]);

    /* =========================
       PAGE LOADED
    ========================= */
    smartofficeDokumenLoaded =
        true;
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){
   
    /* =========================
       REMOVE FILE LISTENER
    ========================= */
    const fileInput =
        document.getElementById(
            "smartofficeDokumenFile"
        );
    if(
        fileInput &&
        smartofficeDokumenFileChangeHandler
    ){
        fileInput.removeEventListener(
            "change",
            smartofficeDokumenFileChangeHandler
        );
        smartofficeDokumenFileChangeHandler =
            null;
    }

    /* =========================
       RESET PAGE STATE
    ========================= */
    smartofficeDokumenLoaded =
        false;

    smartofficeDokumenSayaData =
        [];

    smartofficeEditDokumenId =
        null;

    /* =========================
       RESET UPLOAD FILE
    ========================= */
    if(
        fileInput
    ){
        fileInput.value =
            "";
    }

    const fileName =
        document.getElementById(
            "smartofficeDokumenSayaFileName"
        );
    if(
        fileName
    ){
        fileName.innerText =
            "Belum ada file dipilih";
    }

    /* =========================
       CLOSE EDIT MODAL
    ========================= */
    const editModal =
        document.getElementById(
            "smartofficeEditDokumenModal"
        );
    if(
        editModal
    ){
        editModal.style.display =
            "none";
    }
}


/* ======================================================
   LOAD IDENTITAS PEGAWAI
====================================================== */
async function smartofficeLoadDataPegawaiDokumen(
    nip
){

    try{
        /* =========================
           GET DATA PEGAWAI
        ========================= */
        const data =
            await smartofficeGetPegawaiByNip(
                nip
            );

        /* =========================
           VALIDASI
        ========================= */
        if(
            !data
        ){
            smartofficeShowToast(
                "Data pegawai tidak ditemukan",
                "error"
            );

            return;
        }

        /* =========================
           NAMA
        ========================= */
        document.getElementById(
            "smartofficeDokumenNama"
        ).value =
            data.nama || "";

        /* =========================
           NIP
        ========================= */
        document.getElementById(
            "smartofficeDokumenNip"
        ).value =
            data.nip || "";

        /* =========================
           JABATAN
        ========================= */
        document.getElementById(
            "smartofficeDokumenJabatan"
        ).value =
            data.jabatan || "";

        /* =========================
           STATUS
        ========================= */
        document.getElementById(
            "smartofficeDokumenStatus"
        ).value =
            data.statusKepegawaian || "";

        /* =========================
           JENIS PEGAWAI
        ========================= */
        document.getElementById(
            "smartofficeDokumenJenis"
        ).value =
            data.jenisPegawai || "";

        /* =========================
           LOAD MASTER DOKUMEN
        ========================= */
        //await smartofficeLoadMasterDokumen();
    }
    catch(error){

        /* =========================
           REQUEST DIBATALKAN
           KARENA PINDAH HALAMAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            "Gagal memuat data pegawai:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat data pegawai",
            "error"
        );
    }
}


/* ======================================================
   LOAD MASTER DOKUMEN
====================================================== */
async function smartofficeLoadMasterDokumen(){

    try{
        /* =========================
           GET SESSION
        ========================= */
        const sessionData =
            smartofficeGetSession();
        if(
            !sessionData
        ){
            return;
        }

        /* =========================
           GET MASTER DOKUMEN
        ========================= */
        const data =
            await smartofficeGetMasterDokumen(
                sessionData.nip
            );

        /* =========================
           SELECT
        ========================= */
        const select =
            document.getElementById(
                "smartofficeDokumenJenisDokumen"
            );
        if(
            !select
        ){
            return;
        }

        /* =========================
           DEFAULT OPTION
        ========================= */
        select.innerHTML =
            `
            <option value="">
                Pilih Dokumen
            </option>
            `;

        /* =========================
           RENDER MASTER
        ========================= */
        data.forEach(
            function(item){
                select.innerHTML +=
                    `
                    <option
                        value="${item.kodeDokumen}"
                    >
                        ${item.namaDokumen}
                    </option>
                    `;
            }
        );
    }
    catch(error){

        /* =========================
           REQUEST DIBATALKAN
           KARENA PINDAH HALAMAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            "Gagal memuat master dokumen:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat jenis dokumen",
            "error"
        );
    }
}


/* =========================
   LOAD DOKUMEN SAYA

   FLOW:
   1. Ambil session
   2. Request backend
   3. Render dokumen
========================= */
async function smartofficeLoadDokumenSaya(){

    /* SESSION */
    const sessionData =
        smartofficeGetSession();
    if(
        !sessionData
    ){
        return;
    }

    try{
        const data =
            await smartofficeGetDokumenPegawai(
                sessionData.nip
            );

        smartofficeDokumenSayaData =
            data;

        smartofficeRenderDokumenStat(
            data
        );

        smartofficeRenderDokumenSaya(
            data
        );

        smartofficeDokumenLoaded =
            true;
    }
    catch(error){

        /* =========================
        REQUEST DIBATALKAN
        KARENA PINDAH HALAMAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            error
        );

        smartofficeShowToast(
            "Gagal memuat dokumen",
            "error"
        );
    }
}


/* ======================================================
   RENDER DOKUMEN SAYA
   FINAL — PREMIUM COMPACT 2 COLUMN
====================================================== */
function smartofficeRenderDokumenSaya(
    data
){

    /* ==================================================
       CONTAINER
    ================================================== */
    const container =
        document.getElementById(
            "smartofficeDokumenSayaList"
        );

    if(!container){
        return;
    }

    /* ==================================================
       EMPTY STATE
    ================================================== */
    if(
        !Array.isArray(data) ||
        data.length === 0
    ){
        container.innerHTML =
        `
        <div
            class="
                smartoffice-dokumensaya-empty
            "
        >
            <div
                class="
                    smartoffice-dokumensaya-empty-icon
                "
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="
                            M14 2H6
                            a2 2 0 0 0-2 2v16
                            a2 2 0 0 0 2 2h12
                            a2 2 0 0 0 2-2V8z
                        "
                    />

                    <polyline
                        points="
                            14 2
                            14 8
                            20 8
                        "
                    />
                </svg>
            </div>

            <strong>
                Belum ada dokumen
            </strong>

            <span>
                Belum terdapat dokumen kepegawaian
                yang dapat ditampilkan.
            </span>
        </div>
        `;

        return;
    }

    /* ==================================================
       HTML
    ================================================== */
    let html = "";

    /* ==================================================
       LOOP
    ================================================== */
    data.forEach(
        function(item){

            /* ==========================================
               STATUS
            ========================================== */
            let cardClass =
                "missing";

            let statusText =
                "Belum Upload";

            if(
                item.statusVerifikasi ===
                "MENUNGGU_VERIFIKASI"
            ){
                cardClass =
                    "waiting";

                statusText =
                    "Menunggu Verifikasi";
            }

            else if(
                item.statusVerifikasi ===
                "TERVERIFIKASI"
            ){
                cardClass =
                    "verified";

                statusText =
                    "Terverifikasi";
            }

            else if(
                item.statusVerifikasi ===
                "DITOLAK"
            ){
                cardClass =
                    "rejected";

                statusText =
                    "Ditolak";
            }

            /* ==========================================
               FILE NAME
            ========================================== */
            const fileName =
                item.fileName ||
                "Belum ada file";

            /* ==========================================
               NOMOR DOKUMEN
            ========================================== */
            const nomor =
                item.nomorDokumen ||
                "-";

            /* ==========================================
               BOLEH UBAH
            ========================================== */
            const bolehUbah =
                item.statusVerifikasi ===
                "DITOLAK"
                ||
                (
                    item.isLock ===
                    "TIDAK"
                    &&
                    item.alasanBukaLock
                );

            /* ==========================================
               STATUS DESCRIPTION
            ========================================== */
            let statusDescription =
                "Dokumen belum tersedia";

            if(
                cardClass ===
                "verified"
            ){
                statusDescription =
                    "Dokumen sudah diverifikasi";
            }

            else if(
                cardClass ===
                "waiting"
            ){
                statusDescription =
                    "Menunggu pemeriksaan";
            }

            else if(
                cardClass ===
                "rejected"
            ){
                statusDescription =
                    "Dokumen ditolak";
            }

            /* ==========================================
               INFORMATION BLOCK
            ========================================== */
            let informationHtml = "";

            /* NOMOR */
            informationHtml +=
            `
            <div
                class="
                    smartoffice-dokumensaya-meta
                "
            >
                <span
                    class="
                        smartoffice-dokumensaya-meta-label
                    "
                >
                    Nomor Dokumen
                </span>

                <strong
                    class="
                        smartoffice-dokumensaya-meta-value
                    "
                >
                    ${item.nomorDokumen || "-"}
                </strong>
            </div>
            `;
            
            /* KETERANGAN */
            informationHtml +=
            `
            <div
                class="
                    smartoffice-dokumensaya-meta
                "
            >
                <span
                    class="
                        smartoffice-dokumensaya-meta-label
                    "
                >
                    Keterangan
                </span>

                <strong
                    class="
                        smartoffice-dokumensaya-meta-value
                        note
                    "
                >
                    ${item.keterangan || "-"}
                </strong>
            </div>
            `;

            /* CATATAN VERIFIKATOR */
            if(
                item.catatanVerifikator &&
                cardClass ===
                "rejected"
            ){
                informationHtml +=
                `
                <div
                    class="
                        smartoffice-dokumensaya-meta
                        full
                        rejected-note
                    "
                >
                    <span
                        class="
                            smartoffice-dokumensaya-meta-label
                        "
                    >
                        Catatan Verifikator
                    </span>

                    <strong
                        class="
                            smartoffice-dokumensaya-meta-value
                            rejected-text
                        "
                    >
                        ${item.catatanVerifikator}
                    </strong>
                </div>
                `;
            }

            /* LOCK DIBUKA */
            if(
                item.isLock ===
                "TIDAK"
                &&
                item.alasanBukaLock
            ){
                informationHtml +=
                `
                <div
                    class="
                        smartoffice-dokumensaya-meta
                        full
                        lock-info
                    "
                >
                    <span
                        class="
                            smartoffice-dokumensaya-meta-label
                        "
                    >
                        Status Lock
                    </span>

                    <strong
                        class="
                            smartoffice-dokumensaya-meta-value
                        "
                    >
                        🔓 Lock dibuka
                    </strong>
                </div>

                <div
                    class="
                        smartoffice-dokumensaya-meta
                        full
                        lock-info
                    "
                >
                    <span
                        class="
                            smartoffice-dokumensaya-meta-label
                        "
                    >
                        Alasan Buka Lock
                    </span>

                    <strong
                        class="
                            smartoffice-dokumensaya-meta-value
                        "
                    >
                        ${item.alasanBukaLock}
                    </strong>
                </div>
                `;
            }

            /* ==========================================
               ACTION
            ========================================== */
            let actionHtml = "";

            if(
                item.fileUrl
            ){
                actionHtml +=
                `
                <button
                    type="button"
                    class="
                        smartoffice-dokumensaya-action
                    "
                    onclick="
                        smartofficeOpenPreviewDokumen(
                            '${item.fileId}',
                            '${item.fileName}'
                        )
                    "
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="
                                M14 2H6
                                a2 2 0 0 0-2 2v16
                                a2 2 0 0 0 2 2h12
                                a2 2 0 0 0 2-2V8z
                            "
                        />

                        <polyline
                            points="
                                14 2
                                14 8
                                20 8
                            "
                        />
                    </svg>

                    <span>
                        Lihat Dokumen
                    </span>
                </button>
                `;

                if(
                    bolehUbah
                ){
                    actionHtml +=
                    `
                    <button
                        type="button"
                        class="
                            smartoffice-dokumensaya-action
                            edit
                        "
                        onclick="
                            smartofficeUbahDokumen(
                                '${item.idDokumen}'
                            )
                        "
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="
                                    M14 2H6
                                    a2 2 0 0 0-2 2v16
                                    a2 2 0 0 0 2 2h12
                                    a2 2 0 0 0 2-2V8z
                                "
                            />

                            <polyline
                                points="
                                    14 2
                                    14 8
                                    20 8
                                "
                            />

                            <path
                                d="
                                    M12 18h-1l-1-1
                                    6-6 2 2-6 6z
                                "
                            />
                        </svg>

                        <span>
                            Ubah Dokumen
                        </span>
                    </button>
                    `;
                }
            }

            /* ==========================================
               RENDER CARD
            ========================================== */
            html +=
            `
            <article
                class="
                    smartoffice-dokumensaya-card
                    ${cardClass}
                "
            >

                <!-- ==================================
                     TOP
                ================================== -->
                <div
                    class="
                        smartoffice-dokumensaya-top
                    "
                >
                    <!-- ICON -->
                    <div
                        class="
                            smartoffice-dokumensaya-icon
                        "
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="
                                    M14 2H6
                                    a2 2 0 0 0-2 2v16
                                    a2 2 0 0 0 2 2h12
                                    a2 2 0 0 0 2-2V8z
                                "
                            />

                            <polyline
                                points="
                                    14 2
                                    14 8
                                    20 8
                                "
                            />
                        </svg>
                    </div>

                    <!-- DOCUMENT -->
                    <div
                        class="
                            smartoffice-dokumensaya-document
                        "
                    >
                        <strong
                            class="
                                smartoffice-dokumensaya-name
                            "
                        >
                            ${item.namaDokumen}
                        </strong>

                        <span
                            class="
                                smartoffice-dokumensaya-file
                            "
                        >
                            ${fileName}
                        </span>
                    </div>

                    <!-- STATUS -->
                    <div
                        class="
                            smartoffice-dokumensaya-status
                            ${cardClass}
                        "
                    >
                        <div
                            class="
                                smartoffice-dokumensaya-status-title
                            "
                        >
                            <span
                                class="
                                    smartoffice-dokumensaya-status-dot
                                "
                            ></span>

                            <strong>
                                ${statusText}
                            </strong>
                        </div>

                        <small>
                            ${statusDescription}
                        </small>
                    </div>
                </div>

                <!-- ==================================
                     INFORMATION
                ================================== -->
                ${
                    informationHtml
                    ?
                    `
                    <div
                        class="
                            smartoffice-dokumensaya-information
                        "
                    >
                        ${informationHtml}
                    </div>
                    `
                    :
                    ""
                }

                <!-- ==================================
                     ACTION
                ================================== -->
                ${
                    actionHtml
                    ?
                    `
                    <div
                        class="
                            smartoffice-dokumensaya-actions
                        "
                    >
                        ${actionHtml}
                    </div>
                    `
                    :
                    ""
                }
            </article>
            `;
        }
    );

    /* ==================================================
       RENDER LIST
    ================================================== */
    container.innerHTML =
    `
    <div
        class="
            smartoffice-dokumensaya-list
        "
    >
        ${html}
    </div>
    `;
}


/* =========================
   RENDER MINI STAT
========================= */
function smartofficeRenderDokumenStat(
    data
){

    console.log(
        "RENDER STAT",
        data
    );

    /* DOKUMEN WAJIB */
    const dokumenWajib =
        data.filter(
            item =>
                String(
                    item.wajibUpload || ""
                )
                .trim()
                .toUpperCase()
                ===
                "YA"
        );

    /* TOTAL WAJIB */
    const totalDokumen =
        dokumenWajib.length;

    /* TERVERIFIKASI WAJIB */
    const totalTerverifikasi =
        dokumenWajib.filter(
            item =>
                item.statusVerifikasi
                ===
                "TERVERIFIKASI"
        ).length;

    const progress =
        totalDokumen > 0
            ?
            Math.round(
                (
                    totalTerverifikasi
                    /
                    totalDokumen
                ) * 100
            )
            :
            0;

    document.getElementById(
        "smartofficeDokumenTotal"
    ).innerText =
        totalDokumen;

    document.getElementById(
        "smartofficeDokumenTerverifikasi"
    ).innerText =
        totalTerverifikasi;

    document.getElementById(
        "smartofficeDokumenProgress"
    ).innerText =
        progress + "%";
}


/* ======================================================
   SWITCH TAB DOKUMEN

   TAB:
   - upload
   - riwayat

   FLOW:
   1. Reset active tab
   2. Tampilkan content
   3. Set active button
====================================================== */
function smartofficeSwitchDokumenTab(
    tab
){

    /* CONTENT */
    const uploadContent =
        document.getElementById(
            "smartofficeUploadDokumenContent"
        );

    const riwayatContent =
        document.getElementById(
            "smartofficeDokumenSayaContent"
        );

    /* BUTTON */
    const uploadButton =
        document.getElementById(
            "smartofficeTabUploadDokumen"
        );

    const riwayatButton =
        document.getElementById(
            "smartofficeTabDokumenSaya"
        );

    /* RESET ACTIVE BUTTON */
    uploadButton.classList.remove(
        "active"
    );

    riwayatButton.classList.remove(
        "active"
    );

    /* UPLOAD TAB */
    if(
        tab === "upload"
    ){
        /* SHOW UPLOAD */
        uploadContent.style.display =
            "block";

        /* HIDE RIWAYAT */
        riwayatContent.style.display =
            "none";

        /* ACTIVE BUTTON */
        uploadButton.classList.add(
            "active"
        );
    }

    /* RIWAYAT TAB */
    else{

        /* HIDE UPLOAD */
        uploadContent.style.display =
            "none";

        /* SHOW RIWAYAT */
        riwayatContent.style.display =
            "block";

        /* ACTIVE BUTTON */
        riwayatButton.classList.add(
            "active"
        );
    }
}


/* ======================================================
   INIT UPLOAD DOKUMEN
====================================================== */
function smartofficeInitUploadDokumen(){
    const fileInput =
        document.getElementById(
            "smartofficeDokumenFile"
        );
    if(
        !fileInput
    ){
        return;
    }

    /* =========================
       PREVENT DUPLICATE LISTENER
    ========================= */
    if(
        smartofficeDokumenFileChangeHandler
    ){
        fileInput.removeEventListener(
            "change",
            smartofficeDokumenFileChangeHandler
        );
    }

    /* =========================
       CREATE HANDLER
    ========================= */
    smartofficeDokumenFileChangeHandler =
        function(e){
            const file =
                e.target.files[0];
            if(
                !file
            ){
                return;
            }

            /* =========================
               MAX 5 MB
            ========================= */
            const maxSize =
                5 * 1024 * 1024;
            if(
                file.size > maxSize
            ){
                smartofficeShowToast(
                    "Ukuran file melebihi 5 MB",
                    "error"
                );

                e.target.value =
                    "";

                const fileName =
                    document.getElementById(
                        "smartofficeDokumenSayaFileName"
                    );
                if(
                    fileName
                ){
                    fileName.innerText =
                        "Belum ada file dipilih";
                }

                return;
            }

            /* =========================
               TAMPILKAN NAMA FILE
            ========================= */
            const fileName =
                document.getElementById(
                    "smartofficeDokumenSayaFileName"
                );
            if(
                fileName
            ){
                fileName.innerText =
                    file.name;
            }
        };

    /* =========================
       ADD LISTENER
    ========================= */
    fileInput.addEventListener(
        "change",
        smartofficeDokumenFileChangeHandler
    );
}


/* ======================================================
   SUBMIT DOKUMEN
====================================================== */
async function smartofficeSubmitDokumen(){

    const submitBtn =
        document.getElementById(
            "smartofficeDokumenSubmitButton"
        );


    /* =========================
       JENIS DOKUMEN
    ========================= */

    const jenisDokumen =
        document.getElementById(
            "smartofficeDokumenJenisDokumen"
        ).value;


    /* =========================
       NOMOR DOKUMEN
    ========================= */

    const nomorDokumen =
        document.getElementById(
            "smartofficeDokumenNomor"
        ).value.trim();


    /* =========================
       KETERANGAN
    ========================= */

    const keterangan =
        document.getElementById(
            "smartofficeDokumenKeterangan"
        ).value.trim();


    /* =========================
       FILE
    ========================= */

    const fileInput =
        document.getElementById(
            "smartofficeDokumenFile"
        );

    const file =
        fileInput?.files?.[0];


    /* =========================
       VALIDASI JENIS DOKUMEN
    ========================= */

    if(
        !jenisDokumen
    ){

        smartofficeShowToast(
            "Pilih jenis dokumen",
            "error"
        );

        return;

    }


    /* =========================
       VALIDASI NOMOR DOKUMEN
    ========================= */

    if(
        !nomorDokumen
    ){

        smartofficeShowToast(
            "Nomor dokumen wajib diisi. Jika tidak memiliki nomor, isi dengan tanda (-)",
            "error"
        );

        return;

    }


    /* =========================
       VALIDASI FILE
    ========================= */

    if(
        !file
    ){

        smartofficeShowToast(
            "Pilih berkas terlebih dahulu",
            "error"
        );

        return;

    }


    /* =========================
       VALIDASI UKURAN FILE
       MAKSIMAL 5 MB
    ========================= */

    if(
        file.size >
        5 * 1024 * 1024
    ){

        smartofficeShowToast(
            "Ukuran file maksimal 5 MB",
            "error"
        );

        return;

    }


    /* =========================
       SESSION
    ========================= */

    const sessionData =
        smartofficeGetSession();


    /* =========================
       VALIDASI SESSION
    ========================= */

    if(
        !sessionData ||
        !sessionData.nip
    ){

        smartofficeShowToast(
            "Session tidak ditemukan. Silakan login kembali.",
            "error"
        );

        return;

    }


    /* =========================
       LOCK BUTTON
    ========================= */

    if(
        submitBtn
    ){

        submitBtn.disabled =
            true;

    }


    /* =========================
       GLOBAL LOADING
    ========================= */

    smartofficeShowGlobalLoading(
        "Mengupload dokumen..."
    );


    /*
       FLAG UNTUK MENENTUKAN
       APAKAH UPLOAD BERHASIL
    */

    let uploadSuccess =
        false;


    try{

        /* =========================
           CONVERT FILE
           PAKAI UTILS/File.js
        ========================= */

        const base64 =
            await smartofficeConvertFileToBase64(
                file
            );


        /* =========================
           UPLOAD DOKUMEN
        ========================= */

        await smartofficeUploadDokumen({

            nip:
                sessionData.nip,

            jenisDokumen:
                jenisDokumen,

            nomorDokumen:
                nomorDokumen,

            keterangan:
                keterangan,

            namaFile:
                file.name,

            mimeType:
                file.type,

            base64:
                base64

        });


        /* =========================
           RESET MEMORY
        ========================= */

        smartofficeDokumenLoaded =
            false;


        /* =========================
           RESET FORM
        ========================= */

        smartofficeResetDokumenForm();


        /* =========================
           LOAD ULANG DOKUMEN
        ========================= */

        await smartofficeLoadDokumenSaya();


        /* =========================
           UPLOAD BERHASIL
        ========================= */

        uploadSuccess =
            true;

    }
    catch(error){

        /* =========================
           ERROR
        ========================= */

        console.error(
            "Upload dokumen error:",
            error
        );


        smartofficeShowToast(
            error.message ||
            "Gagal upload dokumen",
            "error"
        );

    }
    finally{

        /* =========================
           HIDE GLOBAL LOADING
        ========================= */

        smartofficeHideGlobalLoading();


        /* =========================
           ENABLE BUTTON
        ========================= */

        if(
            submitBtn
        ){

            submitBtn.disabled =
                false;

        }


        /* =========================
           SUCCESS TOAST
           MUNCUL SETELAH LOADING
           SUDAH DIHILANGKAN
        ========================= */

        if(
            uploadSuccess
        ){

            smartofficeShowToast(
                "Dokumen berhasil diupload",
                "success"
            );

        }

    }

}


/* ======================================================
   RESET FORM DOKUMEN
====================================================== */
function smartofficeResetDokumenForm(){

    document.getElementById(
        "smartofficeDokumenJenisDokumen"
    ).value = "";

    document.getElementById(
        "smartofficeDokumenNomor"
    ).value = "";

    document.getElementById(
        "smartofficeDokumenKeterangan"
    ).value = "";

    document.getElementById(
        "smartofficeDokumenFile"
    ).value = "";

    const fileName =
        document.getElementById(
            "smartofficeDokumenSayaFileName"
        );

    if(
        fileName
    ){
        fileName.innerText =
            "Belum ada file dipilih";
    }
}


/* ======================================================
   REFRESH DOKUMEN
====================================================== */
async function smartofficeRefreshDokumen(){

    /* =========================
       MINI STAT LOADING
    ========================= */
    document.getElementById(
        "smartofficeDokumenTotal"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    document.getElementById(
        "smartofficeDokumenTerverifikasi"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    document.getElementById(
        "smartofficeDokumenProgress"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    /* =========================
       LIST LOADING
    ========================= */
    document.getElementById(
        "smartofficeDokumenSayaList"
    ).innerHTML = `
        <div
            class="
                smartoffice-dokumen-loading
            "
        >
            <div
                class="
                    smartoffice-dokumen-spinner
                "
            ></div>

            <p>
                Memuat dokumen...
            </p>
        </div>
    `;

    try{

        /* =========================
           RELOAD DATA
        ========================= */
        await smartofficeLoadDokumenSaya();

        /* =========================
           TOAST
        ========================= */
        smartofficeShowToast(
            "Data berhasil diperbarui",
            "success"
        );
    }
    catch(error){

        console.error(
            "Gagal refresh dokumen:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memperbarui data dokumen",
            "error"
        );
    }
}


/* ======================================================
   UBAH DOKUMEN
====================================================== */
function smartofficeUbahDokumen(
    idDokumen
){

    /* =========================
       SET ID DOKUMEN
    ========================= */
    smartofficeEditDokumenId =
        idDokumen;

    /* =========================
       CARI DATA DOKUMEN
    ========================= */
    const dokumen =
        smartofficeDokumenSayaData.find(
            item =>
                item.idDokumen ===
                idDokumen
        );

    if(
        !dokumen
    ){
        return;
    }

    /* =========================
       MODAL
    ========================= */
    const modal =
        document.getElementById(
            "smartofficeEditDokumenModal"
        );

    /* =========================
       BODY
    ========================= */
    const body =
        document.getElementById(
            "smartofficeEditDokumenBody"
        );

    /* =========================
       RENDER MODAL
    ========================= */
    body.innerHTML = `

        <div
            class="smartoffice-dokumensaya-edit-card"
        >
            <h3
                class="
                    smartoffice-dokumensaya-edit-title
                "
            >
                ✏️ Ubah Dokumen
            </h3>

            <!-- ID DOKUMEN -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    ID Dokumen
                </label>

                <input
                    type="text"
                    value="${dokumen.idDokumen}"
                    readonly
                >
            </div>

            <!-- DOKUMEN -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    Dokumen
                </label>

                <input
                    type="text"
                    value="${dokumen.namaDokumen}"
                    readonly
                >
            </div>

            <!-- NOMOR DOKUMEN -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    Nomor Dokumen
                </label>

                <input
                    type="text"
                    id="smartofficeEditNomorDokumen"
                    value="${dokumen.nomorDokumen || ""}"
                >
            </div>

            <!-- KETERANGAN -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    Keterangan
                </label>

                <input
                    type="text"
                    id="smartofficeEditKeterangan"
                    value="${dokumen.keterangan || ""}"
                >
            </div>

            <!-- FILE LAMA -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    File Lama
                </label>

                <input
                    type="text"
                    value="${dokumen.fileName || "-"}"
                    readonly
                >
            </div>

            <!-- FILE BARU -->
            <div
                class="smartoffice-dokumensaya-edit-group"
            >
                <label>
                    File Baru
                </label>

                <div
                    class="smartoffice-dokumensaya-edit-upload-box"
                >
                    <input
                        type="file"
                        id="smartofficeEditFile"
                        hidden
                        onchange="
                            smartofficePreviewEditFile(this)
                        "
                    >

                    <label
                        for="smartofficeEditFile"
                        class="
                            smartoffice-dokumensaya-edit-upload-btn
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                d="
                                    M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4
                                "
                            />

                            <polyline
                                points="17 8 12 3 7 8"
                            />

                            <line
                                x1="12"
                                y1="3"
                                x2="12"
                                y2="15"
                            />
                        </svg>

                        <span>
                            Pilih File Pengganti
                        </span>
                    </label>

                    <div
                        id="smartofficeEditFileName"
                        class="
                            smartoffice-dokumensaya-edit-upload-name
                        "
                    >
                        Belum ada file dipilih
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div
                class="smartoffice-dokumensaya-edit-footer"
            >
                <!-- UPDATE -->
                <button
                    id="smartofficeEditDokumenSubmitButton"
                    class="
                        smartoffice-dokumensaya-edit-submit
                    "
                    onclick="
                        smartofficeSubmitEditDokumen()
                    "
                >
                    <span
                        class="
                            smartoffice-dokumensaya-edit-spinner
                        "
                        style="
                            display:none;
                        "
                    ></span>

                    <span
                        class="
                            smartoffice-dokumensaya-edit-submit-text
                        "
                    >
                        Update Dokumen
                    </span>
                </button>

                <!-- BATAL -->
                <button
                    class="
                        smartoffice-dokumensaya-edit-cancel
                    "
                    onclick="
                        smartofficeCloseEditDokumenModal()
                    "
                >
                    Batal
                </button>
            </div>
        </div>
    `;

    /* =========================
       SHOW MODAL
    ========================= */
    modal.style.display =
        "flex";
}


/* ======================================================
   CLOSE MODAL
====================================================== */
function smartofficeCloseEditDokumenModal(){

    const modal =
        document.getElementById(
            "smartofficeEditDokumenModal"
        );
    if(
        modal
    ){
        modal.style.display =
            "none";
    }
}


/* ====================================================== 
   SUBMIT EDIT DOKUMEN 
====================================================== */ 
async function smartofficeSubmitEditDokumen(){ 

    console.log( 
        "EDIT ID", 
        smartofficeEditDokumenId 
    ); 

    const submitBtn = 
        document.getElementById( 
            "smartofficeEditDokumenSubmitButton" 
        ); 

    /* ========================= 
       NOMOR DOKUMEN 
    ========================= */ 
    const nomorDokumen = 
        document.getElementById( 
            "smartofficeEditNomorDokumen" 
        ).value.trim(); 

    /* ========================= 
       KETERANGAN 
    ========================= */ 
    const keterangan = 
        document.getElementById( 
            "smartofficeEditKeterangan" 
        ).value.trim(); 

    /* ========================= 
       FILE 
    ========================= */ 
    const fileInput = 
        document.getElementById( 
            "smartofficeEditFile" 
        ); 

    const file = 
        fileInput.files[0]; 

    /* ========================= 
       VALIDASI FILE 
    ========================= */ 
    if( 
        !file 
    ){ 
        smartofficeShowToast( 
            "Pilih file baru", 
            "error" 
        ); 

        return; 
    } 

    /* ========================= 
       CARI DOKUMEN 
    ========================= */ 
    const dokumen = 
        smartofficeDokumenSayaData.find( 
            item => 
                item.idDokumen === 
                smartofficeEditDokumenId 
        ); 

    if( 
        !dokumen 
    ){ 
        smartofficeShowToast( 
            "Dokumen tidak ditemukan", 
            "error" 
        ); 

        return; 
    } 

    /* ========================= 
       SESSION 
    ========================= */ 
    const sessionData = 
        smartofficeGetSession(); 

    if( 
        !sessionData || 
        !sessionData.nip 
    ){ 
        smartofficeShowToast( 
            "Session tidak ditemukan. Silakan login kembali.", 
            "error" 
        ); 

        return; 
    } 

    /* ========================= 
       DISABLE BUTTON 
    ========================= */ 
    if( 
        submitBtn 
    ){ 
        submitBtn.disabled = 
            true; 
    } 

    /* ========================= 
       FILE READER 
    ========================= */ 
    const reader = 
        new FileReader(); 

    reader.onload = 
        async function(e){ 

            /* =========================
               GLOBAL LOADING
            ========================= */
            smartofficeShowGlobalLoading(
                "Memperbarui dokumen..."
            );

            try{ 

                /* ========================= 
                   UPDATE DOKUMEN 
                ========================= */ 
                await smartofficeUploadDokumen({ 

                    isEdit: 
                        true, 

                    idDokumen: 
                        smartofficeEditDokumenId, 

                    nip: 
                        sessionData.nip, 

                    jenisDokumen: 
                        dokumen.kodeDokumen, 

                    nomorDokumen: 
                        nomorDokumen, 

                    keterangan: 
                        keterangan, 

                    namaFile: 
                        file.name, 

                    mimeType: 
                        file.type, 

                    base64: 
                        e.target.result 
                }); 

                /* ========================= 
                   SUCCESS 
                ========================= */ 
                smartofficeShowToast( 
                    "Dokumen berhasil diperbarui", 
                    "success" 
                ); 

                /* ========================= 
                   CLOSE MODAL 
                ========================= */ 
                smartofficeCloseEditDokumenModal(); 

                /* ========================= 
                   RELOAD DATA 
                ========================= */ 
                await smartofficeLoadDokumenSaya(); 

            } 
            catch(error){ 

                smartofficeShowToast( 
                    error.message || 
                    "Gagal update dokumen", 
                    "error" 
                ); 

                console.error( 
                    "Gagal update dokumen:", 
                    error 
                ); 

            } 
            finally{ 

                /* ========================= 
                   HIDE GLOBAL LOADING 
                ========================= */ 
                smartofficeHideGlobalLoading(); 

                /* ========================= 
                   ENABLE BUTTON 
                ========================= */ 
                if( 
                    submitBtn 
                ){ 
                    submitBtn.disabled = 
                        false; 
                } 
            } 
        }; 

    /* ========================= 
       START FILE READER 
    ========================= */ 
    reader.readAsDataURL( 
        file 
    ); 
}


/* ======================================================
   PREVIEW NAMA FILE EDIT
====================================================== */
function smartofficePreviewEditFile(
    input
){
    const label =
        document.getElementById(
            "smartofficeEditFileName"
        );

    if(
        input.files &&
        input.files.length
    ){
        label.textContent =
            input.files[0].name;
    }
    else{
        label.textContent =
            "Belum ada file dipilih";
    }
}


/* ======================================================
   GLOBAL — HTML INLINE EVENT
====================================================== */
window.smartofficeSwitchDokumenTab =
    smartofficeSwitchDokumenTab;

window.smartofficeSubmitDokumen =
    smartofficeSubmitDokumen;

window.smartofficeUbahDokumen =
    smartofficeUbahDokumen;

window.smartofficeCloseEditDokumenModal =
    smartofficeCloseEditDokumenModal;

window.smartofficeSubmitEditDokumen =
    smartofficeSubmitEditDokumen;

window.smartofficePreviewEditFile =
    smartofficePreviewEditFile;

window.smartofficeRefreshDokumen =
    smartofficeRefreshDokumen;