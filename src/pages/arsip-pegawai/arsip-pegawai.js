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
    if(infoContainer){
        infoContainer.innerHTML =
        `
        <div class="smartoffice-arsip-loading">
            <div class="smartoffice-arsip-spinner">
            </div>

            <div class="smartoffice-arsip-loading-text">
                Memuat data pegawai...
            </div>
        </div>
        `;
    }

    /* LOADING LIST */
    if(listContainer){
        listContainer.innerHTML =
        `
        <div class="smartoffice-arsip-loading">
            <div class="smartoffice-arsip-spinner">
            </div>

            <div class="smartoffice-arsip-loading-text">
                Memuat arsip pegawai...
            </div>
        </div>
        `;
    }

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
====================================================== */
export function smartofficeRenderArsipPegawai(
    result
){
    const infoContainer =
        document.getElementById(
            "smartofficeArsipPegawaiInfo"
        );

    const listContainer =
        document.getElementById(
            "smartofficeArsipPegawaiList"
        );

    /* =========================
       VALIDASI CONTAINER
    ========================= */
    if(
        !infoContainer ||
        !listContainer
    ){
        return;
    }

    /* =========================
       DOKUMEN WAJIB SAJA
    ========================= */
    const dokumenWajib =
        result.dokumen.filter(
            item =>
                item.wajibUpload ===
                "YA"
        );

    const totalDokumen =
        dokumenWajib.length;

    const totalTerverifikasi =
        dokumenWajib.filter(
            item =>
                item.statusVerifikasi ===
                "TERVERIFIKASI"
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

    /* =========================
       INISIAL
    ========================= */
    const namaParts =
        result.pegawai.nama
            .trim()
            .split(" ")
            .filter(Boolean);

    const inisial =
        namaParts.length >= 2
            ?
            (
                namaParts[0][0] +
                namaParts[1][0]
            ).toUpperCase()
            :
            namaParts[0][0].toUpperCase();

    /* =========================
       PROGRESS COLOR
    ========================= */
    let progressColor =
        "#ef4444";

    if(
        progress >= 25
    ){
        progressColor =
            "#f97316";
    }

    if(
        progress >= 50
    ){
        progressColor =
            "#3b82f6";
    }

    if(
        progress >= 75
    ){
        progressColor =
            "#22c55e";
    }

    if(
        progress === 100
    ){
        progressColor =
            "#16a34a";
    }

    /* =========================
       STATUS
    ========================= */
    let status =
        "Belum Lengkap";

    if(
        progress >= 75
    ){
        status =
            "Hampir Lengkap";
    }

    if(
        progress === 100
    ){
        status =
            "Lengkap";
    }

    /* =========================
       INFO PEGAWAI
    ========================= */
    infoContainer.innerHTML =
    `
    <div class="smartoffice-arsip-summary-card">
        <div class="smartoffice-progress-header">
            <div class="smartoffice-progress-avatar">
                ${inisial}
            </div>

            <div class="smartoffice-progress-user">
                <div class="smartoffice-progress-name">
                    ${result.pegawai.nama}
                </div>

                <div class="smartoffice-progress-position">
                    ${result.pegawai.jabatan}
                </div>
            </div>
        </div>

        <div class="smartoffice-progress-status-row">
            <div class="smartoffice-arsip-summary-label">
                ${status}
            </div>

            <div class="smartoffice-progress-percent">
                ${progress}%
            </div>
        </div>

        <div class="smartoffice-arsip-progress">
            <div
                class="smartoffice-arsip-progress-bar"
                style="
                    width:${progress}%;
                    background:${progressColor};
                "
            ></div>

        </div>

        <div class="smartoffice-arsip-summary-info">
            ${totalTerverifikasi}
            dari
            ${totalDokumen}
            dokumen terverifikasi
        </div>
    </div>
    `;

    /* =========================
       RENDER LIST
    ========================= */
    const sessionData =
        smartofficeGetSession();

    let html = "";

    result.dokumen.forEach(
        function(item){

            let cardClass =
                "empty";

            if(
                item.statusVerifikasi ===
                "MENUNGGU_VERIFIKASI"
            ){
                cardClass =
                    "waiting";
            }

            else if(
                item.statusVerifikasi ===
                "TERVERIFIKASI"
            ){
                cardClass =
                    "approved";
            }

            else if(
                item.statusVerifikasi ===
                "DITOLAK"
            ){
                cardClass =
                    "rejected";
            }

            html +=
            `
            <div
                class="
                    smartoffice-dokumen-card
                    ${cardClass}
                "
            >
                <div
                    class="
                        smartoffice-dokumen-header
                    "
                >
                    <h4
                        class="
                            smartoffice-dokumen-title
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
                                    M14 2H6
                                    a2 2 0 0 0-2 2v16
                                    a2 2 0 0 0 2 2h12
                                    a2 2 0 0 0 2-2V8z
                                "
                            />

                            <polyline
                                points="14 2 14 8 20 8"
                            />
                        </svg>
                        ${item.namaDokumen}
                    </h4>
                </div>

                <div
                    class="
                        smartoffice-dokumen-info
                    "
                >
                    <div
                        class="
                            smartoffice-dokumen-row
                        "
                    >
                        <span>
                            Upload
                        </span>

                        <strong>
                            ${
                                item.uploaded
                                    ?
                                    "✅ Sudah Upload"
                                    :
                                    "❌ Belum Upload"
                            }
                        </strong>
                    </div>

                    <div
                        class="
                            smartoffice-dokumen-row
                        "
                    >
                        <span>
                            Status
                        </span>

                        <span
                            class="
                                smartoffice-dokumen-status
                                ${cardClass}
                            "
                        >
                            ${item.statusVerifikasi}
                        </span>

                    </div>

                    ${
                        item.statusVerifikasi === "DITOLAK"
                        &&
                        item.catatanVerifikator
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Alasan Penolakan
                            </span>

                            <strong
                                style="
                                    color:#dc2626;
                                "
                            >
                                ${item.catatanVerifikator}
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.alasanBukaLock
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Status Lock
                            </span>

                            <strong>
                                🔓 TERBUKA
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.alasanBukaLock
                        &&
                        item.openLockBy
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Alasan Lock Dibuka
                            </span>

                            <strong>
                                ${item.alasanBukaLock}
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.nomorDokumen
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Nomor Dokumen
                            </span>

                            <strong>
                                ${item.nomorDokumen}
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.keterangan
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Keterangan
                            </span>

                            <strong
                                style="
                                    color:#64748b;
                                    font-weight:500;
                                "
                            >
                                ${item.keterangan}
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.fileName
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                File
                            </span>

                            <strong>
                                ${item.fileName}
                            </strong>

                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.openLockBy
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Dibuka Oleh
                            </span>

                            <strong>
                                ${item.openLockBy}
                            </strong>

                        </div>
                        `
                        :
                        ""
                    }

                    ${
                        item.openLockAt
                        ?
                        `
                        <div
                            class="
                                smartoffice-dokumen-row
                            "
                        >
                            <span>
                                Tanggal Buka Lock
                            </span>

                            <strong>
                                ${item.openLockAt}
                            </strong>
                        </div>
                        `
                        :
                        ""
                    }

                </div>

                ${
                    item.fileUrl
                    ?
                    `
                    <div
                        class="smartoffice-arsip-footer"
                    >
                        <button
                            type="button"
                            class="
                                smartoffice-dokumen-link
                            "
                            onclick="
                                smartofficeOpenPreviewDokumen(
                                    '${item.fileId}',
                                    '${item.fileName}'
                                )
                            "
                        >
                            <svg
                                style="
                                    flex-shrink:0;
                                "
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
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
                                    points="14 2 14 8 20 8"
                                />

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

                        <div
                            class="
                                smartoffice-arsip-action
                            "
                        >
                            ${
                                item.alasanBukaLock
                                ?
                                `
                                <span
                                    class="
                                        smartoffice-arsip-lock-open
                                    "
                                >
                                    🔓 Dapat Upload Ulang
                                </span>
                                `
                                :
                                (
                                    item.statusVerifikasi ===
                                    "TERVERIFIKASI"
                                    &&
                                    item.isLock === "YA"
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
                                    ?
                                    `
                                    <button
                                        type="button"
                                        class="
                                            smartoffice-arsip-button-lock
                                        "
                                        onclick="
                                            smartofficeBukaLockDokumenPrompt(
                                                '${item.idDokumen}'
                                            )
                                        "
                                    >
                                        🔓 Buka Lock
                                    </button>
                                    `
                                    :
                                    ""
                                )
                            }
                        </div>
                    </div>
                    `
                    :
                    ""
                }
            </div>
            `;
        }
    );

    listContainer.innerHTML =
    `
    <div
        class="
            smartoffice-dokumen-list
        "
    >
        ${html}
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

    container.innerHTML =
    `
    <div class="smartoffice-arsip-loading">
        <div class="smartoffice-arsip-spinner">
        </div>

        <div class="smartoffice-arsip-loading-text">
            Memuat progres arsip...
        </div>
    </div>
    `;

    try{
        const data =
            await smartofficeGetProgressArsip();

        if(
            !Array.isArray(data)
        ){
            throw new Error(
                "Data progress arsip tidak valid."
            );
        }

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
        <div class="smartoffice-arsip-empty">
            <div class="smartoffice-arsip-empty-icon">
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
    <div class="smartoffice-arsip-modal-icon warning">
        🔓
    </div>

    <div class="smartoffice-arsip-modal-title">
        Buka Lock Dokumen
    </div>

    <div class="smartoffice-arsip-modal-text">
        Alasan membuka lock wajib diisi.
    </div>

    <textarea
        id="smartofficeBukaLockAlasan"
        class="smartoffice-arsip-textarea"
        placeholder="Tulis alasan membuka lock..."
    ></textarea>

    <div class="smartoffice-arsip-modal-footer">
        <button
            id="smartofficeBukaLockSubmitButton"
            class="smartoffice-management-filter-button"
            type="button"
            onclick="
                smartofficeSubmitBukaLockDokumen(
                    '${idDokumen}'
                )
            "
        >
            Buka Lock
        </button>

        <button
            class="smartoffice-management-reset-button"
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
            class="
                smartofficearsip-btn-spinner
            "
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
    <div class="smartoffice-arsip-empty">
        <div class="smartoffice-arsip-empty-icon">
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
    <div class="smartoffice-arsip-empty">
        <div class="smartoffice-arsip-empty-icon">
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

    container.innerHTML =
    `
    <div class="smartoffice-arsip-loading">
        <div class="smartoffice-arsip-spinner">
        </div>

        <div class="smartoffice-arsip-loading-text">
            Memuat progress arsip...
        </div>
    </div>
    `;

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

window.smartofficeBukaArsipPegawai =
    smartofficeBukaArsipPegawai;