/* ======================================================
   SMART OFFICE ARSIP PEGAWAI
====================================================== */

/* ======================================================
   CORE — SESSION
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";

/* ======================================================
   SERVICE — ARSIP PEGAWAI
====================================================== */
import {
    smartofficeGetDaftarPegawaiArsip,
    smartofficeGetArsipPegawai,
    smartofficeGetArsipStat,
    smartofficeGetProgressArsip,
    smartofficeBukaLockDokumen
} from "../../services/arsip-pegawai.service.js";

/* ======================================================
   COMPONENT
====================================================== */
import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeOpenPreviewDokumen
} from "../../components/preview/preview.js";

import {
    smartofficeShowLoading
} from "../../components/loading/loading.js";


/* ======================================================
   GLOBAL STATE
====================================================== */
let smartofficeArsipPegawaiData =
    [];

let smartofficeArsipPageInstance =
    0;

const smartofficeArsipPegawaiHandlers =
    new Map();


/* ======================================================
   LOAD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    const pageInstance =
        ++smartofficeArsipPageInstance;

    console.log(
        "SMARTOFFICE ARSIP PEGAWAI: LOAD PAGE"
    );

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
    if(
        !sessionData
    ){
        await smartofficeLogout();

        return;
    }

    /* =========================
       RESET STATE
    ========================= */
    smartofficeArsipPegawaiData =
        [];

    window.smartofficeProgressLoaded =
        false;

    /* =========================
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "arsip-pegawai"
    );

    /* =========================
       LOAD DATA BERSAMAAN
    ========================= */
    await Promise.all([
        smartofficeLoadPegawaiArsip(),
        smartofficeLoadArsipStat(),
        smartofficeLoadProgressArsip()
    ]);

    if(
        pageInstance !==
        smartofficeArsipPageInstance
    ){
        return;
    }

    /* =========================
       PROGRESS SUDAH LOADED
    ========================= */
    window.smartofficeProgressLoaded =
        true;

    console.log(
        "SMARTOFFICE ARSIP PEGAWAI: READY"
    );
}


/* ======================================================
   DESTROY PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    ++smartofficeArsipPageInstance;

    console.log(
        "SMARTOFFICE ARSIP PEGAWAI: DESTROY PAGE"
    );

    /* =========================
       REMOVE EVENT HANDLERS
    ========================= */
    smartofficeArsipPegawaiHandlers.forEach(
        function(
            handler,
            element
        ){
            element?.removeEventListener(
                "click",
                handler
            );
        }
    );

    smartofficeArsipPegawaiHandlers.clear();

    /* =========================
       RESET STATE
    ========================= */
    smartofficeArsipPegawaiData =
        [];

    /* =========================
       RESET PROGRESS STATE
    ========================= */
    window.smartofficeProgressLoaded =
        false;

    /* =========================
       RESET DOM STATE
    ========================= */
    const progressList =
        document.getElementById(
            "smartofficeProgressArsipList"
        );
    if(progressList){
        progressList.innerHTML =
            "";
    }

    const pegawaiInfo =
        document.getElementById(
            "smartofficeArsipPegawaiInfo"
        );
    if(pegawaiInfo){
        pegawaiInfo.innerHTML =
            "";
    }

    const pegawaiList =
        document.getElementById(
            "smartofficeArsipPegawaiList"
        );
    if(pegawaiList){
        pegawaiList.innerHTML =
            "";
    }

    console.log(
        "SMARTOFFICE ARSIP PEGAWAI: DESTROYED"
    );
}


/* ======================================================
   LOAD PEGAWAI ARSIP
====================================================== */
export async function smartofficeLoadPegawaiArsip(){

    try{
        const data =
            await smartofficeGetDaftarPegawaiArsip();

        console.log(
            "PEGAWAI ARSIP",
            data
        );

        if(
            !Array.isArray(data)
        ){
            return;
        }

        const select =
            document.getElementById(
                "smartofficeArsipPegawaiSelect"
            );
        if(
            !select
        ){
            return;
        }

        let html =
            '<option value="">Pilih Pegawai</option>';

        data.forEach(
            function(item){
                html +=
                `
                <option value="${item.nip}">
                    ${item.nama}
                </option>
                `;
            }
        );

        select.innerHTML =
            html;
    }
    catch(error){
        console.error(
            "SMARTOFFICE LOAD PEGAWAI ARSIP ERROR:",
            error
        );
    }
}


/* ======================================================
   CARI ARSIP PEGAWAI
====================================================== */
export async function smartofficeCariArsipPegawai(){

    const select =
        document.getElementById(
            "smartofficeArsipPegawaiSelect"
        );

    const infoContainer =
        document.getElementById(
            "smartofficeArsipPegawaiInfo"
        );

    const listContainer =
        document.getElementById(
            "smartofficeArsipPegawaiList"
        );

    const nip =
        select?.value || "";
    if(
        !nip
    ){
        smartofficeShowToast(
            "Pilih pegawai terlebih dahulu",
            "error"
        );

        return;
    }

    /* LOADING INFO */
    smartofficeShowLoading(
        "smartofficeArsipPegawaiInfo",
        "Memuat data pegawai..."
    );

    /* LOADING LIST */
    smartofficeShowLoading(
        "smartofficeArsipPegawaiList",
        "Memuat arsip pegawai..."
    );

    try{
        const data =
            await smartofficeGetArsipPegawai(
                nip
            );

        smartofficeRenderArsipPegawai(
            data
        );
    }
    catch(error){
        console.error(
            "SMARTOFFICE CARI ARSIP PEGAWAI ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memuat arsip pegawai.",
            "error"
        );
    }
}


/* ======================================================
   RENDER ARSIP PEGAWAI
   FINAL — STRUKTUR SAMA DENGAN DOKUMEN SAYA
   CLASS TETAP ARSIP PEGAWAI
====================================================== */
export function smartofficeRenderArsipPegawai(
    result
){
    console.log(
        "SMARTOFFICE ARSIP PEGAWAI: RENDER",
        result
    );

    /* ==================================================
       CONTAINER
    ================================================== */
    const infoContainer =
        document.getElementById(
            "smartofficeArsipPegawaiInfo"
        );

    const listContainer =
        document.getElementById(
            "smartofficeArsipPegawaiList"
        );

    if(
        !infoContainer ||
        !listContainer
    ){
        return;
    }

    /* ==================================================
       DOKUMEN
    ================================================== */
    const dokumen =
        Array.isArray(result?.dokumen)
            ? result.dokumen
            : [];

    const dokumenWajib =
        dokumen.filter(
            function(item){
                return (
                    item.wajibUpload ===
                    "YA"
                );
            }
        );

    /* ==================================================
       PROGRESS
    ================================================== */
    const totalDokumen =
        dokumenWajib.length;

    const totalTerverifikasi =
        dokumenWajib.filter(
            function(item){
                return (
                    item.statusVerifikasi ===
                    "TERVERIFIKASI"
                );
            }
        ).length;

    const progress =
        totalDokumen > 0
            ?
            Math.round(
                (
                    totalTerverifikasi /
                    totalDokumen
                ) * 100
            )
            :
            0;

    /* ==================================================
       INISIAL
    ================================================== */
    const nama =
        result?.pegawai?.nama ||
        "-";

    const namaParts =
        nama
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    let inisial = "-";

    if(
        namaParts.length >= 2
    ){
        inisial =
            (
                namaParts[0][0] +
                namaParts[1][0]
            ).toUpperCase();
    }

    else if(
        namaParts.length === 1
    ){
        inisial =
            namaParts[0][0]
                .toUpperCase();
    }

    /* ==================================================
       WARNA PROGRESS
       SAMA DENGAN PROGRESS ARSIP
    ================================================== */
    let progressColor =
        "#EF4444";

    if(
        progress >= 75
    ){
        progressColor =
            "#3B82F6";
    }

    if(
        progress === 100
    ){
        progressColor =
            "#22C55E";
    }

    /* ==================================================
       STATUS PEGAWAI
    ================================================== */
    let status =
        "Belum Lengkap";

    let statusClass =
        "danger";

    if(
        progress >= 75 &&
        progress < 100
    ){
        status =
            "Hampir Lengkap";

        statusClass =
            "warning";
    }

    if(
        progress === 100
    ){
        status =
            "Lengkap";

        statusClass =
            "success";
    }

    /* ==================================================
       INFO PEGAWAI
       TETAP PAKAI STRUKTUR YANG SEKARANG
    ================================================== */
    infoContainer.innerHTML =
    `
    <div
        class="
            smartoffice-arsippegawai-progress-card
            smartoffice-arsippegawai-info-progress-card
        "
    >
        <!-- EMPLOYEE -->
        <div
            class="
                smartoffice-arsippegawai-progress-employee
            "
        >
            <div
                class="
                    smartoffice-arsippegawai-progress-avatar
                "
            >
                ${inisial}
            </div>

            <div
                class="
                    smartoffice-arsippegawai-progress-employee-info
                "
            >
                <div
                    class="
                        smartoffice-arsippegawai-progress-name
                    "
                >
                    ${nama}
                </div>

                <div
                    class="
                        smartoffice-arsippegawai-progress-position
                    "
                >
                    ${result?.pegawai?.jabatan || "-"}
                </div>
            </div>
        </div>

        <!-- PROGRESS -->
        <div
            class="
                smartoffice-arsippegawai-progress-detail
            "
        >
            <div
                class="
                    smartoffice-arsippegawai-progress-label
            "
            >
                Kelengkapan Arsip
            </div>

            <div
                class="
                    smartoffice-arsippegawai-progress-track
                "
            >
                <div
                    class="
                        smartoffice-arsippegawai-progress-fill
                    "
                    style="
                        width:${progress}%;
                        background:${progressColor};
                    "
                ></div>
            </div>

            <div
                class="
                    smartoffice-arsippegawai-progress-info
                "
            >
                ${totalTerverifikasi}
                dari
                ${totalDokumen}
                dokumen terverifikasi
            </div>
        </div>

        <!-- RING -->
        <div
            class="
                smartoffice-arsippegawai-progress-percent
            "
            style="
                --progress:${progress}%;
                --progress-color:${progressColor};
            "
        >
            ${progress}%
        </div>

        <!-- STATUS -->
        <div
            class="
                smartoffice-arsippegawai-progress-status
                ${statusClass}
            "
        >
            <span
                class="
                    smartoffice-arsippegawai-progress-status-dot
                "
            ></span>
            ${status}
        </div>
    </div>
    `;

    /* ==================================================
       SESSION
    ================================================== */
    const sessionData =
        smartofficeGetSession();

    /* ==================================================
       RENDER DOCUMENT
    ================================================== */
    let html = "";

    dokumen.forEach(
        function(item){
            /* ==========================================
               STATUS
            ========================================== */
            let cardClass =
                "missing";

            let statusText =
                "Belum Upload";

            let statusDescription =
                "Dokumen belum tersedia";

            if(
                item.statusVerifikasi ===
                "MENUNGGU_VERIFIKASI"
            ){
                cardClass =
                    "waiting";

                statusText =
                    "Menunggu Verifikasi";

                statusDescription =
                    "Menunggu pemeriksaan";
            }

            else if(
                item.statusVerifikasi ===
                "TERVERIFIKASI"
            ){
                cardClass =
                    "verified";

                statusText =
                    "Terverifikasi";

                statusDescription =
                    "Dokumen sudah diverifikasi";
            }

            else if(
                item.statusVerifikasi ===
                "DITOLAK"
            ){
                cardClass =
                    "missing";

                statusText =
                    "Ditolak";

                statusDescription =
                    "Dokumen perlu diperbaiki";
            }

            /* ==========================================
               FILE
            ========================================== */
            const fileDescription =
                item.fileName
                    ?
                    item.fileName
                    :
                    "Belum ada file";

            /* ==========================================
               INFORMATION
            ========================================== */
            let informationHtml = "";

            /* NOMOR DOKUMEN
               SELALU MUNCUL
            */
            informationHtml +=
            `
            <div
                class="
                    smartoffice-arsippegawai-status-extra
                    number
                "
            >
                <span
                    class="
                        smartoffice-arsippegawai-detail-label
                    "
                >
                    Nomor Dokumen
                </span>

                <strong
                    class="
                        smartoffice-arsippegawai-detail-value
                    "
                >
                    ${item.nomorDokumen || "-"}
                </strong>
            </div>
            `;

            /* KETERANGAN
               SELALU MUNCUL
            */
            informationHtml +=
            `
            <div
                class="
                    smartoffice-arsippegawai-status-extra
                    note
                "
            >
                <span
                    class="
                        smartoffice-arsippegawai-detail-label
                    "
                >
                    Keterangan
                </span>

                <strong
                    class="
                        smartoffice-arsippegawai-detail-value
                    "
                >
                    ${item.keterangan || "-"}
                </strong>
            </div>
            `;

            /* CATATAN VERIFIKATOR */
            if(
                item.statusVerifikasi ===
                "DITOLAK"
                &&
                item.catatanVerifikator
            ){
                informationHtml +=
                `
                <div
                    class="
                        smartoffice-arsippegawai-status-extra
                        rejected-note
                    "
                >
                    <span
                        class="
                            smartoffice-arsippegawai-detail-label
                        "
                    >
                        Catatan Verifikator
                    </span>

                    <strong
                        class="
                            smartoffice-arsippegawai-detail-value
                            rejected-text
                        "
                    >
                        ${item.catatanVerifikator}
                    </strong>
                </div>
                `;
            }

            /* LOCK INFO */
            if(
                item.alasanBukaLock
            ){
                informationHtml +=
                `
                <div
                    class="
                        smartoffice-arsippegawai-status-extra
                        lock-info
                    "
                >
                    <span
                        class="
                            smartoffice-arsippegawai-detail-label
                        "
                    >
                        Status Lock
                    </span>

                    <strong
                        class="
                            smartoffice-arsippegawai-detail-value
                        "
                    >
                        🔓 Lock dibuka
                    </strong>
                </div>
                `;

                informationHtml +=
                `
                <div
                    class="
                        smartoffice-arsippegawai-status-extra
                        lock-info
                    "
                >
                    <span
                        class="
                            smartoffice-arsippegawai-detail-label
                        "
                    >
                        Dibuka Oleh
                    </span>

                    <strong
                        class="
                            smartoffice-arsippegawai-detail-value
                        "
                    >
                        ${item.openLockBy || "-"}
                    </strong>

                </div>
                `;

                informationHtml +=
                `
                <div
                    class="
                        smartoffice-arsippegawai-status-extra
                        lock-info
                    "
                >
                    <span
                        class="
                            smartoffice-arsippegawai-detail-label
                        "
                    >
                        Tanggal Buka Lock
                    </span>

                    <strong
                        class="
                            smartoffice-arsippegawai-detail-value
                        "
                    >
                        ${item.openLockAt || "-"}
                    </strong>
                </div>
                `;
            }

            /* ==========================================
               ACTION
            ========================================== */
            let actionHtml = "";

            /* LIHAT DOKUMEN */
            if(
                item.fileUrl
            ){
                actionHtml +=
                `
                <button
                    type="button"
                    class="
                        smartoffice-arsippegawai-document-action
                    "
                    onclick="
                        smartofficeOpenPreviewDokumen(
                            '${item.fileId}',
                            '${item.fileName || ""}'
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
                        Lihat
                    </span>

                </button>
                `;
            }

            /* LOCK */
            if(
                item.alasanBukaLock
            ){
                actionHtml +=
                `
                <div
                    class="
                        smartoffice-arsippegawai-lock-open
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
                        <rect
                            x="3"
                            y="11"
                            width="18"
                            height="10"
                            rx="2"
                        />

                        <path
                            d="
                                M7 11V7
                                a5 5 0 0 1 10 0
                            "
                        />
                    </svg>

                    <div>
                        <strong>
                            Lock Terbuka
                        </strong>

                        <small>
                            Dapat Upload Ulang
                        </small>
                    </div>
                </div>
                `;
            }

            else if(
                item.statusVerifikasi ===
                "TERVERIFIKASI"
                &&
                item.isLock ===
                "YA"
                &&
                sessionData
                &&
                [
                    "ADMIN",
                    "KAPUS",
                    "PJ"
                ].includes(
                    sessionData.role
                )
            ){
                actionHtml +=
                `
                <button
                    type="button"
                    class="
                        smartoffice-arsippegawai-lock-button
                    "
                    onclick="
                        smartofficeBukaLockDokumenPrompt(
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
                        <rect
                            x="3"
                            y="11"
                            width="18"
                            height="10"
                            rx="2"
                        />

                        <path
                            d="
                                M7 11V7
                                a5 5 0 0 1 10 0
                                v1
                            "
                        />
                    </svg>

                    <span>
                        Buka Lock
                    </span>
                </button>
                `;
            }

            /* ==========================================
               CARD
               STRUKTUR SAMA DENGAN DOKUMEN SAYA
            ========================================== */
            html +=
            `
            <div
                class="
                    smartoffice-arsippegawai-document-item
                    ${cardClass}
                "
            >
                <!-- ==================================
                     ICON
                ================================== -->
                <div
                    class="
                        smartoffice-arsippegawai-document-icon
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

                <!-- ==================================
                     DOCUMENT
                ================================== -->
                <div
                    class="
                        smartoffice-arsippegawai-document-name
                    "
                >
                    <strong>
                        ${item.namaDokumen}
                    </strong>

                    <span>
                        ${fileDescription}
                    </span>
                </div>

                <!-- ==================================
                     STATUS
                ================================== -->
                <div
                    class="
                        smartoffice-arsippegawai-document-status
                        ${cardClass}
                    "
                >
                    <div
                        class="
                            smartoffice-arsippegawai-status-title
                        "
                    >
                        <span
                            class="
                                smartoffice-arsippegawai-status-dot
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

                <!-- ==================================
                     INFORMATION
                ================================== -->
                <div
                    class="
                        smartoffice-arsippegawai-document-information
                    "
                >
                    ${informationHtml}
                </div>

                <!-- ==================================
                     ACTION
                ================================== -->
                ${
                    actionHtml
                    ?
                    `
                    <div
                        class="
                            smartoffice-arsippegawai-document-actions
                        "
                    >
                        ${actionHtml}
                    </div>
                    `
                    :
                    ""
                }
            </div>
            `;
        }
    );

    /* ==================================================
       EMPTY
    ================================================== */
    if(
        dokumen.length === 0
    ){
        listContainer.innerHTML =
        `
        <div
            class="
                smartoffice-arsippegawai-empty
            "
        >
            <div
                class="
                    smartoffice-arsippegawai-empty-icon
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
                            M3 7
                            a2 2 0 0 1 2-2h5
                            l2 2h7
                            a2 2 0 0 1 2 2v8
                            a2 2 0 0 1-2 2H5
                            a2 2 0 0 1-2-2z
                        "
                    />
                </svg>
            </div>

            <h3>
                Belum ada arsip
            </h3>

            <p>
                Belum terdapat dokumen arsip
                untuk pegawai ini.
            </p>
        </div>
        `;

        return;
    }

    /* ==================================================
       LIST
       WRAPPER TETAP DIPERTAHANKAN
    ================================================== */
    listContainer.innerHTML =
    `
    <div
        class="
            smartoffice-arsippegawai-document-card
        "
    >
        <div
            class="
                smartoffice-arsippegawai-document-header
            "
        >
            <div
                class="
                    smartoffice-arsippegawai-document-title
                "
            >
                <div
                    class="
                        smartoffice-arsippegawai-document-title-icon
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

                <span>
                    Dokumen Arsip Pegawai
                </span>
            </div>

            <div
                class="
                    smartoffice-arsippegawai-document-legend
                "
            >
                <span class="verified">
                    <i></i>
                    Terverifikasi
                </span>

                <span class="waiting">
                    <i></i>
                    Menunggu Verifikasi
                </span>

                <span class="missing">
                    <i></i>
                    Belum Upload
                </span>
            </div>
        </div>

        <div
            class="
                smartoffice-arsippegawai-document-list
            "
        >
            ${html}
        </div>
    </div>
    `;
}


/* ======================================================
   LOAD ARSIP STAT
====================================================== */
export async function smartofficeLoadArsipStat(){

    console.log(
        "LOAD ARSIP STAT"
    );

    try{
        const data =
            await smartofficeGetArsipStat();

        console.log(
            "ARSIP STAT",
            data
        );

        smartofficeRenderArsipStat(
            data
        );
    }
    catch(error){
        console.error(
            "LOAD ARSIP STAT ERROR:",
            error
        );
    }
}


/* ======================================================
   LOAD PROGRESS ARSIP
====================================================== */
export async function smartofficeLoadProgressArsip(){

    const container =
        document.getElementById(
            "smartofficeProgressArsipList"
        );
    if(
        !container
    ){
        return;
    }

    /* =========================
       GLOBAL LOADING
    ========================= */
    smartofficeShowLoading(
        "smartofficeProgressArsipList",
        "Memuat progres arsip..."
    );

    try{    
        /* =========================
           SERVICE
        ========================= */    
        const data =
            await smartofficeGetProgressArsip();

        if(
            !Array.isArray(data)
        ){
            throw new Error(
                "Data progress arsip tidak valid."
            );
        }

        /* =========================
           RENDER
        ========================= */
        smartofficeRenderProgressArsip(
            data
        );
    }
    catch(error){
        console.error(
            "SMARTOFFICE LOAD PROGRESS ARSIP ERROR:",
            error
        );

        container.innerHTML =
        `
        <div class="smartoffice-arsippegawai-empty">
            <div class="smartoffice-arsippegawai-empty-icon">
                ⚠️
            </div>

            <h3>
                Gagal Memuat Progress
            </h3>

            <p>
                ${error.message || "Terjadi kesalahan."}
            </p>
        </div>
        `;
    }
}


/* ======================================================
   SWITCH TAB ARSIP
====================================================== */
export function smartofficeSwitchArsipTab(
    tab
){
    const arsipContent =
        document.getElementById(
            "smartofficeArsipPegawaiContent"
        );

    const arsipButton =
        document.getElementById(
            "smartofficeTabArsipPegawai"
        );

    const progressContent =
        document.getElementById(
            "smartofficeProgressArsipContent"
        );

    const progressButton =
        document.getElementById(
            "smartofficeTabProgressArsip"
        );

    /* =========================
       VALIDASI
    ========================= */
    if(
        !arsipContent ||
        !arsipButton ||
        !progressContent ||
        !progressButton
    ){
        console.error(
            "Elemen tab arsip tidak ditemukan"
        );

        return;
    }

    /* =========================
       RESET ACTIVE
    ========================= */
    arsipButton.classList.remove(
        "active"
    );

    progressButton.classList.remove(
        "active"
    );

    /* =========================
       TAB PROGRESS
    ========================= */
    if(
        tab === "progress"
    ){
        progressContent.style.display =
            "block";

        arsipContent.style.display =
            "none";

        progressButton.classList.add(
            "active"
        );

        return;
    }

    /* =========================
       TAB ARSIP PEGAWAI
    ========================= */
    else{
        progressContent.style.display =
            "none";

        arsipContent.style.display =
            "block";

        arsipButton.classList.add(
            "active"
        );
    }
}


/* ======================================================
   RENDER PROGRESS ARSIP
====================================================== */
export function smartofficeRenderProgressArsip(
    data
){

    console.log(
        "RENDER PROGRESS",
        data
    );

    const container =
        document.getElementById(
            "smartofficeProgressArsipList"
        );
    if(!container){
        return;
    }

    /* =========================
       EMPTY DATA
    ========================= */
    if(
        !Array.isArray(data) ||
        data.length === 0
    ){
        container.innerHTML =
        `
        <div
            class="
                smartoffice-arsippegawai-progress-empty
            "
        >
            Belum ada data progress arsip.
        </div>
        `;

        return;
    }

    let html = "";

    data.forEach(
        function(item){

            /* =========================
               STATUS
            ========================= */
            let status =
                "Belum Lengkap";

            let statusClass =
                "danger";

            let color =
                "#EF4444";

            if(
                item.progress >= 75
            ){
                status =
                    "Hampir Lengkap";

                statusClass =
                    "warning";

                color =
                    "#3B82F6";
            }

            if(
                item.progress === 100
            ){
                status =
                    "Lengkap";

                statusClass =
                    "success";

                color =
                    "#22C55E";
            }

            /* =========================
               CARD
            ========================= */
            html +=
            `
            <div
                class="
                    smartoffice-arsippegawai-progress-card
                "
            >
                <!-- =====================
                     PEGAWAI
                ====================== -->
                <div
                    class="
                        smartoffice-arsippegawai-progress-employee
                    "
                >
                    <div
                        class="
                            smartoffice-arsippegawai-progress-avatar
                        "
                    >
                        ${item.inisial}
                    </div>

                    <div
                        class="
                            smartoffice-arsippegawai-progress-employee-info
                        "
                    >
                        <div
                            class="
                                smartoffice-arsippegawai-progress-name
                            "
                        >
                            ${item.nama}
                        </div>

                        <div
                            class="
                                smartoffice-arsippegawai-progress-position
                            "
                        >
                            ${item.jabatan || "-"}
                        </div>
                    </div>
                </div>

                <!-- =====================
                     PROGRESS DETAIL
                ====================== -->
                <div
                    class="
                        smartoffice-arsippegawai-progress-detail
                    "
                >
                    <div
                        class="
                            smartoffice-arsippegawai-progress-label
                        "
                    >
                        Kelengkapan Arsip
                    </div>

                    <div
                        class="
                            smartoffice-arsippegawai-progress-track
                        "
                    >
                        <div
                            class="
                                smartoffice-arsippegawai-progress-fill
                            "
                            style="
                                width:${item.progress}%;
                                background:${color};
                            "
                        >
                        </div>
                    </div>

                    <div
                        class="
                            smartoffice-arsippegawai-progress-info
                        "
                    >
                        ${item.verified}
                        dari
                        ${item.total}
                        dokumen terverifikasi
                    </div>
                </div>

                <!-- =====================
                     PERCENT
                ====================== -->
                <div
                    class="
                        smartoffice-arsippegawai-progress-percent
                    "
                    style="
                        --progress:${item.progress}%;
                        --progress-color:${color};
                    "
                >
                    ${item.progress}%
                </div>

                <!-- =====================
                     STATUS
                ====================== -->
                <div
                    class="
                        smartoffice-arsippegawai-progress-status
                        ${statusClass}
                    "
                >
                    <span
                        class="
                            smartoffice-arsippegawai-progress-status-dot
                        "
                    >
                    </span>
                    ${status}
                </div>

                <!-- =====================
                     DETAIL BUTTON
                ====================== -->
                <button
                    type="button"
                    class="
                        smartoffice-arsippegawai-progress-detail-btn
                    "
                    title="Lihat Arsip Pegawai"
                    onclick="
                        smartofficeBukaArsipPegawai(
                            '${item.nip}'
                        )
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
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="m9 18 6-6-6-6"
                        />
                    </svg>
                </button>
            </div>
            `;
        }
    );

    container.innerHTML =
        html;
}


/* ======================================================
   BUKA ARSIP PEGAWAI DARI PROGRESS
====================================================== */
export async function smartofficeBukaArsipPegawai(
    nip
){

    console.log(
        "BUKA ARSIP PEGAWAI:",
        nip
    );

    /* =========================
       VALIDASI
    ========================= */
    if(!nip){
        smartofficeShowToast(
            "NIP pegawai tidak ditemukan.",
            "error"
        );

        return;
    }

    /* =========================
       PINDAH KE TAB ARSIP
    ========================= */
    smartofficeSwitchArsipTab(
        "arsip"
    );

    /* =========================
       SELECT PEGAWAI
    ========================= */
    const select =
        document.getElementById(
            "smartofficeArsipPegawaiSelect"
        );

    if(!select){
        console.error(
            "SELECT PEGAWAI ARSIP TIDAK DITEMUKAN"
        );

        return;
    }

    /* =========================
       SET NIP
    ========================= */
    select.value =
        String(nip);

    /* =========================
       PASTIKAN VALUE BERHASIL
    ========================= */
    if(
        select.value !==
        String(nip)
    ){
        console.warn(
            "NIP belum tersedia di dropdown:",
            nip
        );

        return;
    }

    /* =========================
       LANGSUNG CARI
    ========================= */
    await smartofficeCariArsipPegawai();
}


/* ======================================================
   RENDER ARSIP STAT
====================================================== */
function smartofficeRenderArsipStat(
    data
){
    const totalPegawai =
        document.getElementById(
            "smartofficeArsipTotalPegawai"
        );

    const totalDokumen =
        document.getElementById(
            "smartofficeArsipTotalDokumen"
        );

    const progress =
        document.getElementById(
            "smartofficeArsipProgress"
        );

    if(totalPegawai){
        totalPegawai.innerText =
            data?.totalPegawai || 0;
    }

    if(totalDokumen){
        totalDokumen.innerText =
            data?.totalUpload || 0;
    }

    if(progress){
        progress.innerText =
            data?.totalTerverifikasi || 0;
    }
}


/* ======================================================
   BUKA LOCK DOKUMEN
====================================================== */
export function smartofficeBukaLockDokumenPrompt(
    idDokumen
){
    smartofficeOpenBukaLockDokumenModal(
        idDokumen
    );
}


/* ======================================================
   OPEN BUKA LOCK MODAL
====================================================== */
export function smartofficeOpenBukaLockDokumenModal(
    idDokumen
){

    const body =
        document.getElementById(
            "smartofficeArsipActionBody"
        );

    if(!body){
        return;
    }

    body.innerHTML =
    `
    <div class="smartoffice-arsippegawai-modal-icon warning">

        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
            />

            <path
                d="
                    M8 11V7
                    a4 4 0 0 1
                    8 0v4
                "
            />

            <path
                d="M12 15v3"
            />
        </svg>

    </div>


    <div class="smartoffice-arsippegawai-modal-title">
        Buka Lock Dokumen
    </div>


    <div class="smartoffice-arsippegawai-modal-text">
        Alasan membuka lock wajib diisi.
    </div>


    <textarea
        id="smartofficeBukaLockAlasan"
        class="smartoffice-arsippegawai-modal-textarea"
        placeholder="Tulis alasan membuka lock..."
    ></textarea>


    <div class="smartoffice-arsippegawai-modal-footer">

        <button
            id="smartofficeBukaLockSubmitButton"
            class="smartoffice-arsippegawai-modal-submit"
            type="button"
            onclick="
                smartofficeSubmitBukaLockDokumen(
                    '${idDokumen}'
                )
            "
        >

            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <rect
                    x="5"
                    y="11"
                    width="14"
                    height="10"
                    rx="2"
                />

                <path
                    d="
                        M8 11V7
                        a4 4 0 0 1
                        8 0v4
                    "
                />
            </svg>

            <span>
                Buka Lock
            </span>

        </button>


        <button
            class="smartoffice-arsippegawai-modal-cancel"
            type="button"
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
   SUBMIT BUKA LOCK DOKUMEN
====================================================== */
export async function smartofficeSubmitBukaLockDokumen(
    idDokumen
){
    const alasanElement =
        document.getElementById(
            "smartofficeBukaLockAlasan"
        );

    const alasan =
        alasanElement
            ? alasanElement.value.trim()
            : "";

    /* =========================
       VALIDASI ALASAN
    ========================= */
    if(
        !alasan
    ){
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
            "smartofficeBukaLockSubmitButton"
        );

    if(button){
        button.disabled =
            true;

        button.innerHTML =
        `
        <span
            class="smartoffice-arsippegawai-btn-spinner"
        ></span>
        Membuka Lock...
        `;
    }

    /* =========================
       SESSION
    ========================= */
    const sessionData =
        smartofficeGetSession();

    try{
        /* =========================
           API
        ========================= */
        const response =
            await smartofficeBukaLockDokumen(
                idDokumen,
                alasan,
                sessionData.nip,
                sessionData.role
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
           CLOSE MODAL
        ========================= */
        smartofficeCloseArsipModal();

        /* =========================
           SUCCESS
        ========================= */
        smartofficeShowToast(
            "Lock dokumen berhasil dibuka",
            "success"
        );

        /* =========================
           LOAD ULANG ARSIP
        ========================= */
        await smartofficeCariArsipPegawai();
    }
    catch(error){
        console.error(
            "SMARTOFFICE BUKA LOCK ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal membuka lock",
            "error"
        );
    }
    finally{
        if(button){
            button.disabled =
                false;

            button.innerHTML =
                "Buka Lock";
        }
    }
}


/* ======================================================
   CLOSE MODAL AKSI ARSIP PEGAWAI
====================================================== */
export function smartofficeCloseArsipModal(){
    const modal =
        document.getElementById(
            "smartofficeArsipActionModal"
        );
    if(!modal){
        return;
    }

    /* =========================
       CLOSE ANIMATION
    ========================= */
    modal.classList.remove(
        "show"
    );

    /* =========================
       HIDE
    ========================= */
    setTimeout(
        function(){
            modal.style.display =
                "none";

            /* Bersihkan isi modal */
            const body =
                document.getElementById(
                    "smartofficeArsipActionBody"
                );

            if(body){
                body.innerHTML =
                    "";
            }
        },
        200
    );
}


/* ======================================================
   RESET ARSIP PEGAWAI
====================================================== */
export function smartofficeResetArsipPegawai(){

    document.getElementById(
        "smartofficeArsipPegawaiSelect"
    ).value = "";

    document.getElementById(
        "smartofficeArsipStatusSelect"
    ).value = "";

    document.getElementById(
        "smartofficeArsipPegawaiInfo"
    ).innerHTML = "";

    document.getElementById(
        "smartofficeArsipPegawaiList"
    ).innerHTML =
    `
    <div class="smartoffice-arsippegawai-empty">
        <div class="smartoffice-arsippegawai-empty-icon">
            🗂️
        </div>

        <h3>
            Belum ada arsip dipilih
        </h3>

        <p>
            Pilih pegawai lalu klik Cari
        </p>
    </div>
    `;
}


/* ======================================================
   REFRESH ARSIP
====================================================== */
export async function smartofficeRefreshArsip(){

    /* =========================
       MINI STAT
    ========================= */
    document.getElementById(
        "smartofficeArsipTotalPegawai"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    document.getElementById(
        "smartofficeArsipTotalDokumen"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    document.getElementById(
        "smartofficeArsipProgress"
    ).innerHTML =
        '<span class="smartoffice-mini-loader"></span>';

    /* =========================
       RESET FILTER
    ========================= */
    document.getElementById(
        "smartofficeArsipPegawaiSelect"
    ).value = "";

    document.getElementById(
        "smartofficeArsipStatusSelect"
    ).value = "";

    /* =========================
       RESET INFO
    ========================= */
    document.getElementById(
        "smartofficeArsipPegawaiInfo"
    ).innerHTML = "";

    /* =========================
       EMPTY STATE
    ========================= */
    document.getElementById(
        "smartofficeArsipPegawaiList"
    ).innerHTML =
    `
    <div class="smartoffice-arsippegawai-empty">
        <div class="smartoffice-arsippegawai-empty-icon">
            🗂️
        </div>

        <h3>
            Belum ada arsip dipilih
        </h3>

        <p>
            Pilih pegawai lalu klik Cari
        </p>
    </div>
    `;

    /* =========================
       RELOAD DATA
    ========================= */
    await Promise.all([
        smartofficeLoadArsipStat(),
        smartofficeLoadPegawaiArsip()
    ]);

    /* =========================
       TOAST
    ========================= */
    smartofficeShowToast(
        "Data arsip berhasil diperbarui",
        "success"
    );
}


/* ======================================================
   REFRESH PROGRESS ARSIP
====================================================== */
export async function smartofficeRefreshProgressArsip(){

    window.smartofficeProgressLoaded =
        false;

    const container =
        document.getElementById(
            "smartofficeProgressArsipList"
        );

    if(!container){
        return;
    }

    smartofficeShowLoading(
        "smartofficeProgressArsipList",
        "Memuat progres arsip..."
    );

    await smartofficeLoadProgressArsip();

    window.smartofficeProgressLoaded =
        true;
}


/* ======================================================
   GLOBAL ARSIP PEGAWAI FUNCTIONS
   Untuk inline onclick pada HTML
====================================================== */
window.smartofficeSwitchArsipTab =
    smartofficeSwitchArsipTab;

window.smartofficeRefreshProgressArsip =
    smartofficeRefreshProgressArsip;

window.smartofficeRefreshArsipPegawai =
    smartofficeRefreshArsip;

window.smartofficeResetArsipPegawai =
    smartofficeResetArsipPegawai;

window.smartofficeCariArsipPegawai =
    smartofficeCariArsipPegawai;

window.smartofficeBukaLockDokumenPrompt =
    smartofficeBukaLockDokumenPrompt;

window.smartofficeOpenBukaLockDokumenModal =
    smartofficeOpenBukaLockDokumenModal;

window.smartofficeSubmitBukaLockDokumen =
    smartofficeSubmitBukaLockDokumen;

window.smartofficeCloseArsipModal =
    smartofficeCloseArsipModal;

window.smartofficeBukaArsipPegawai =
    smartofficeBukaArsipPegawai;