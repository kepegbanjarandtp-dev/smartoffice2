import {
    smartofficeApi
} from "../../core/api.js";

import {
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";

/* ======================================================
   LOAD APPROVAL DOKUMEN
====================================================== */
export async function smartofficeLoadApprovalDokumen(){

    /* =========================
       CONTAINER
    ========================= */
    const container =
        document.getElementById(
            "smartofficeApprovalDokumenList"
        );

    if(!container){
        return;
    }

    /* =========================
       LOADING
    ========================= */
    container.innerHTML = `
        <div class="smartoffice-loading">
            <div class="smartoffice-loading-spinner">
            </div>

            <div class="smartoffice-loading-text">
                Memuat dokumen approval...
            </div>
        </div>
    `;

    /* =========================
       LOAD DATA
    ========================= */
    try{
        const response =
            await smartofficeApi(
                "smartofficeGetDokumenVerifikasi"
            );

        /* =========================
           VALIDASI RESPONSE
        ========================= */
        if(
            !response ||
            !response.success
        ){
            throw new Error(
                response?.message ||
                "Gagal memuat dokumen approval."
            );
        }

        /* =========================
           DATA
        ========================= */
        const data =
            response.data || [];

        console.log(
            "APPROVAL DOKUMEN:",
            data
        );

        /* =========================
           RENDER
        ========================= */
        smartofficeRenderApprovalDokumen(
            data
        );
    }
    catch(error){

        /* =========================
           REQUEST DIBATALKAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            "LOAD APPROVAL DOKUMEN ERROR:",
            error
        );

        /* =========================
           ERROR STATE
        ========================= */
        container.innerHTML = `
            <div class="smartoffice-empty-state">
                <div class="smartoffice-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Gagal memuat dokumen
                </h3>

                <p>
                    ${error.message}
                </p>
            </div>
        `;

        if(
            typeof window.smartofficeShowToast ===
            "function"
        ){
            window.smartofficeShowToast(
                "Gagal memuat approval dokumen",
                "error"
            );
        }
    }
}


/* ======================================================
   RENDER APPROVAL DOKUMEN
====================================================== */
export function smartofficeRenderApprovalDokumen(
    data
){

    /* =========================
       CONTAINER
    ========================= */
    const container =
        document.getElementById(
            "smartofficeApprovalDokumenList"
        );
    if(!container){
        return;
    }

    /* =========================
       EMPTY STATE
    ========================= */
    if(
        !data ||
        !data.length
    ){
        container.innerHTML = `
            <div class="smartoffice-arsip-empty">
                <div class="smartoffice-arsip-empty-icon">
                    📄
                </div>

                <h3>
                    Tidak Ada Dokumen
                </h3>

                <p>
                    Tidak ada dokumen yang menunggu verifikasi
                </p>
            </div>
        `;
        return;
    }

    /* =========================
       HTML
    ========================= */
    let html = "";

    /* =========================
       LOOP DATA
    ========================= */
    data.forEach(
        function(item){
            html += `
                <div class="smartoffice-verifikasi-card">
                    <div class="smartoffice-verifikasi-header">
                        <h4 class="smartoffice-verifikasi-title">
                            ${item.namaDokumen || "-"}
                        </h4>

                        <div class="smartoffice-verifikasi-subtitle">
                            ${item.nama || "-"}
                        </div>
                    </div>

                    <div class="smartoffice-verifikasi-body">
                        <div class="smartoffice-dokumen-row">
                            <span>
                                Nomor Dokumen
                            </span>

                            <strong>
                                ${item.nomorDokumen || "-"}
                            </strong>
                        </div>

                        ${
                            item.keterangan
                            ?
                            `
                            <div class="smartoffice-dokumen-row">
                                <span>
                                    Keterangan
                                </span>

                                <strong>
                                    ${item.keterangan}
                                </strong>
                            </div>
                            `
                            :
                            ""
                        }

                        <div class="smartoffice-dokumen-row">
                            <span>
                                File
                            </span>

                            <strong>
                                ${item.fileName || "-"}
                            </strong>
                        </div>
                    </div>

                    <div class="smartoffice-verifikasi-footer">

                        <!-- LIHAT DOKUMEN -->
                        <button
                            type="button"
                            class="smartoffice-dokumen-link"
                            onclick="
                                smartofficeOpenPreviewDokumen(
                                    '${item.fileId}',
                                    '${item.fileName || ""}'
                                )
                            "
                        >
                            <svg
                                style="flex-shrink:0;"
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path d="
                                    M14 2H6
                                    a2 2 0 0 0-2 2v16
                                    a2 2 0 0 0 2 2h12
                                    a2 2 0 0 0 2-2V8z
                                "/>

                                <polyline points="
                                    14 2
                                    14 8
                                    20 8
                                "/>

                                <line
                                    x1="16"
                                    y1="13"
                                    x2="8"
                                    y2="13"
                                />

                                <line
                                    x1="16"
                                    y1="17"
                                    x2="8"
                                    y2="17"
                                />

                                <line
                                    x1="10"
                                    y1="9"
                                    x2="8"
                                    y2="9"
                                />
                            </svg>

                            <span>
                                Lihat Dokumen
                            </span>
                        </button>

                        <!-- ACTION -->
                        <div class="smartoffice-verifikasi-action">
                            <button
                                type="button"
                                class="smartoffice-button-success"
                                onclick="
                                    smartofficeVerifikasiDokumen(
                                        '${item.idDokumen}'
                                    )
                                "
                            >
                                Verifikasi
                            </button>

                            <button
                                type="button"
                                class="smartoffice-button-danger"
                                onclick="
                                    smartofficeTolakDokumen(
                                        '${item.idDokumen}'
                                    )
                                "
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    );

    /* =========================
       RENDER
    ========================= */
    container.innerHTML =
        html;
}


/* ======================================================
   VERIFIKASI DOKUMEN
====================================================== */
export function smartofficeVerifikasiDokumen(
    idDokumen
){

    smartofficeOpenVerifikasiDokumenModal(
        idDokumen
    );
}


/* ======================================================
   TOLAK DOKUMEN
====================================================== */
export function smartofficeTolakDokumen(
    idDokumen
){

    smartofficeOpenTolakDokumenModal(
        idDokumen
    );
}


/* ======================================================
   OPEN VERIFIKASI DOKUMEN MODAL
====================================================== */
export function smartofficeOpenVerifikasiDokumenModal(
    idDokumen
){

    const body =
        document.getElementById(
            "smartofficeArsipActionBody"
        );

    if(!body){
        return;
    }

    body.innerHTML = `
        <div class="smartoffice-arsip-modal-icon">
            ✓
        </div>

        <div class="smartoffice-arsip-modal-title">
            Verifikasi Dokumen
        </div>

        <div class="smartoffice-arsip-modal-text">
            Dokumen akan dikunci setelah diverifikasi.
        </div>

        <div class="smartoffice-arsip-modal-footer">
            <button
                id="smartofficeVerifikasiSubmitButton"
                class="smartoffice-management-filter-button"
                onclick="
                    smartofficeSubmitVerifikasiDokumen(
                        '${idDokumen}'
                    )
                "
            >
                Verifikasi
            </button>

            <button
                class="smartoffice-management-reset-button"
                onclick="
                    smartofficeCloseArsipModal()
                "
            >
                Batal
            </button>
        </div>
    `;

    const modal =
        document.getElementById(
            "smartofficeArsipActionModal"
        );
    if(!modal){
        return;
    }

    modal.style.display =
        "flex";

    setTimeout(
        function(){
            modal.classList.add(
                "show"
            );
        },
        10
    );
}


/* ======================================================
   OPEN TOLAK DOKUMEN MODAL
====================================================== */
export function smartofficeOpenTolakDokumenModal(
    idDokumen
){

    const body =
        document.getElementById(
            "smartofficeArsipActionBody"
        );

    if(!body){
        return;
    }

    body.innerHTML = `
        <div class="smartoffice-arsip-modal-icon danger">
            ✕
        </div>

        <div class="smartoffice-arsip-modal-title">
            Tolak Dokumen
        </div>

        <div class="smartoffice-arsip-modal-text">
            Alasan penolakan wajib diisi.
        </div>

        <textarea
            id="smartofficeTolakDokumenAlasan"
            class="smartoffice-arsip-textarea"
            placeholder="Tulis alasan penolakan..."
        ></textarea>

        <div class="smartoffice-arsip-modal-footer">
            <button
                id="smartofficeTolakSubmitButton"
                class="smartoffice-management-filter-button"
                onclick="
                    smartofficeSubmitTolakDokumen(
                        '${idDokumen}'
                    )
                "
            >
                Tolak
            </button>

            <button
                class="smartoffice-management-reset-button"
                onclick="
                    smartofficeCloseArsipModal()
                "
            >
                Batal
            </button>
        </div>
    `;

    const modal =
        document.getElementById(
            "smartofficeArsipActionModal"
        );
    if(!modal){
        return;
    }

    modal.style.display =
        "flex";

    setTimeout(
        function(){
            modal.classList.add(
                "show"
            );
        },
        10
    );
}


/* ======================================================
   SUBMIT VERIFIKASI DOKUMEN
====================================================== */
export async function smartofficeSubmitVerifikasiDokumen(
    idDokumen
){

    /* =========================
       VALIDASI
    ========================= */
    if(!idDokumen){
        smartofficeShowToast(
            "ID dokumen tidak ditemukan.",
            "error"
        );

        return;
    }

    /* =========================
       BUTTON
    ========================= */
    const button =
        document.getElementById(
            "smartofficeVerifikasiSubmitButton"
        );

    if(button){
        button.disabled =
            true;

        button.innerHTML = `
            <span
                class="
                    smartofficearsip-btn-spinner
                "
            ></span>
            Memverifikasi...
        `;
    }

    /* =========================
       GLOBAL LOADING
    ========================= */
    smartofficeShowGlobalLoading(
        "Memverifikasi dokumen..."
    );

    try{
        /* =========================
           API
        ========================= */
        const response =
            await smartofficeApi(
                "smartofficeVerifikasiDokumen",
                {
                    idDokumen
                }
            );

        /* =========================
           REQUEST DIBATALKAN
        ========================= */
        if(
            response?.aborted
        ){
            return;
        }

        /* =========================
           API ERROR
        ========================= */
        if(
            !response ||
            !response.success
        ){
            throw new Error(
                response?.message ||
                "Gagal memverifikasi dokumen."
            );
        }

        /* =========================
           CLOSE MODAL
        ========================= */
        smartofficeCloseArsipModal();

        /* =========================
           SUCCESS
        ========================= */
        smartofficeShowToast(
            "Dokumen berhasil diverifikasi",
            "success"
        );

        /* =========================
           LOAD ULANG DATA
        ========================= */
        await smartofficeLoadApprovalDokumen();


        /* =========================
           UPDATE BADGE APPROVAL
        ========================= */

        /*
         * Badge approval dashboard tidak perlu
         * dipanggil dari sini secara langsung.
         *
         * Badge akan diperbarui ketika kembali
         * ke dashboard.
         */
    }
    catch(error){
        /* =========================
           REQUEST DIBATALKAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            "SUBMIT VERIFIKASI DOKUMEN ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memverifikasi dokumen.",
            "error"
        );
    }
    finally{
        /* =========================
           STOP GLOBAL LOADING
        ========================= */
        smartofficeHideGlobalLoading();

        /* =========================
           ENABLE BUTTON
        ========================= */
        if(button){
            button.disabled =
                false;

            button.innerHTML =
                "Verifikasi";
        }
    }
}


/* ======================================================
   SUBMIT TOLAK DOKUMEN
====================================================== */
export async function smartofficeSubmitTolakDokumen(
    idDokumen
){

    /* =========================
       AMBIL ALASAN
    ========================= */
    const alasanElement =
        document.getElementById(
            "smartofficeTolakDokumenAlasan"
        );

    const alasan =
        alasanElement
            ? alasanElement.value.trim()
            : "";

    /* =========================
       VALIDASI ALASAN
    ========================= */
    if(!alasan){
        smartofficeShowToast(
            "Alasan wajib diisi",
            "error"
        );

        return;
    }

    /* =========================
       BUTTON
    ========================= */
    const button =
        document.getElementById(
            "smartofficeTolakSubmitButton"
        );

    if(button){
        button.disabled =
            true;

        button.innerHTML = `
            <span
                class="smartofficearsip-btn-spinner"
            ></span>
            Menolak...
        `;
    }

    /* =========================
       GLOBAL LOADING
    ========================= */
    smartofficeShowGlobalLoading(
        "Menolak dokumen..."
    );

    try{
        /* =========================
           API
        ========================= */
        const response =
            await smartofficeApi(
                "smartofficeTolakDokumen",
                {
                    idDokumen,
                    alasan
                }
            );

        /* =========================
           REQUEST DIBATALKAN
        ========================= */
        if(
            response?.aborted
        ){
            return;
        }

        /* =========================
           API ERROR
        ========================= */
        if(
            !response ||
            !response.success
        ){
            throw new Error(
                response?.message ||
                "Gagal menolak dokumen."
            );
        }

        /* =========================
           CLOSE MODAL
        ========================= */
        smartofficeCloseArsipModal();

        /* =========================
           SUCCESS
        ========================= */
        smartofficeShowToast(
            "Dokumen ditolak",
            "success"
        );

        /* =========================
           LOAD ULANG LIST APPROVAL
        ========================= */
        await smartofficeLoadApprovalDokumen();
    }
    catch(error){
        /* =========================
           REQUEST DIBATALKAN
        ========================= */
        if(
            error?.message ===
            "Request dibatalkan."
        ){
            return;
        }

        console.error(
            "SUBMIT TOLAK DOKUMEN ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal menolak dokumen.",
            "error"
        );
    }
    finally{
        /* =========================
           STOP GLOBAL LOADING
        ========================= */
        smartofficeHideGlobalLoading();

        /* =========================
           ENABLE BUTTON
        ========================= */
        if(button){
            button.disabled =
                false;
            button.innerHTML =
                "Tolak";
        }
    }
}


/* =========================
   CLOSE MODAL ARSIP
========================= */
function smartofficeCloseArsipModal(){

  const modal =
    document.getElementById(
      'smartofficeArsipActionModal'
    );

  modal.classList.remove(
    'show'
  );

  setTimeout(
    function(){
      modal.style.display =
        'none';
    },
    250
  );
}