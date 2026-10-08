/* ================================================================================
   IMPORT
================================================================================ */

/* ======================================================
   CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeClearSession,
    smartofficeLogout   
} from "../../core/session.js";

import {
    smartofficeNavigate
} from "../../core/router.js";

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
  smartofficeOpenPreviewDokumen,
  smartofficeClosePreviewDokumen,
  smartofficeZoomIn,
  smartofficeZoomOut
} from "../../components/preview/preview.js";

import {
    smartofficeShowLoading,
    smartofficeShowGlobalLoading,
    smartofficeHideGlobalLoading
} from "../../components/loading/loading.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetApprovalCuti,
    smartofficeProcessApprovalCuti,
    smartofficeGetDokumenVerifikasi,
    smartofficeVerifikasiDokumenApi,
    smartofficeTolakDokumenApi,
    smartofficeProcessApprovalSPD
} from "../../services/approval.service.js";

import {
    smartofficeGetApprovalCutiFirestore,
    smartofficeGetDokumenVerifikasiFirestore,
    smartofficeWatchVerifikasiDokumenFirestore,
    smartofficeGetApprovalSPDFirestore
} from "../../services/approval-firestore.service.js";

/* ======================================================
   UTILS
====================================================== */
import {
    formatTanggalIndonesia
} from "../../utils/date.js";

import {
  smartofficeGetDriveFileId
} from "../../utils/drive.js";



/* ================================================================================
   STATE
================================================================================ */

/* ======================================================
   APPROVAL STATE
====================================================== */
const smartofficeApprovalState = { idCuti:'' };
let smartofficeApprovalAction = "";
let smartofficeSubmittingApproval = false;

/* ======================================================
   LIFECYCLE STATE
====================================================== */
let smartofficeApprovalDestroyed = false;
let smartofficeApprovalPageInstance = 0;
const smartofficeApprovalHandlers = new Map();
let smartofficeApprovalModalTimer = null;


/* ================================================================================
   LOAD PAGE
================================================================================ */

/* ======================================================
   SMART OFFICE LOAD APPROVAL PAGE
====================================================== */
export async function smartofficeLoadPage(){

    smartofficeApprovalPageInstance++;

    const pageInstance =
        smartofficeApprovalPageInstance;

    /* =========================
       RESET LIFECYCLE
    ========================= */
    smartofficeApprovalDestroyed = false;
    
    smartofficeApprovalHandlers.clear();

    /* =========================
       SESSION
    ========================= */
    const sessionData =
        smartofficeGetSession();

    if(!sessionData){
        await smartofficeNavigate(
            "login"
        );
        return;
    }

    /* =========================
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "approval"
    );

    /* =========================
       PRELOAD DETAIL MODAL
    ========================= */
    const modal =
        document.getElementById(
            "smartofficeApprovalDetailModal"
        );
    if(modal){
        modal.style.display =
            "flex";
        modal.style.opacity =
            "0";

        if(smartofficeApprovalModalTimer){
            clearTimeout(
                smartofficeApprovalModalTimer
            );
        }

        smartofficeApprovalModalTimer =
            setTimeout(
                function(){
                    if(!modal.isConnected){
                        smartofficeApprovalModalTimer =
                            null;
                        return;
                    }
                    modal.style.display =
                        "none";

                    modal.style.opacity =
                        "";

                    smartofficeApprovalModalTimer =
                        null;
                },
                50
            );
    }

    /* =========================
      BACK
    ========================= */
    const backButton =
        document.getElementById(
            "smartofficeApprovalBackButton"
        );
    if(backButton){
        const handler =
            async function(){
                if(
                    smartofficeApprovalDestroyed
                ){
                    return;
                }

                await smartofficeNavigate(
                    "dashboard"
                );
            };
        backButton.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            backButton,
            handler
        );
    }

    /* =========================
      REFRESH
    ========================= */
    const refreshButton =
        document.getElementById(
            "smartofficeApprovalRefreshButton"
        );
    if(refreshButton){
        const handler =
            smartofficeRefreshApproval;

        refreshButton.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            refreshButton,
            handler
        );
    }

    /* =========================
      TAB CUTI
    ========================= */
    const tabCuti =
        document.getElementById(
            "smartofficeTabApprovalCuti"
        );
    if(tabCuti){
        const handler =
            function(){
                if(
                    smartofficeApprovalDestroyed
                ){
                    return;
                }

                smartofficeSwitchApprovalTab(
                    "cuti"
                );
            };

        tabCuti.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            tabCuti,
            handler
        );
    }

    /* =========================
      TAB SPD
    ========================= */
    const tabSpd =
        document.getElementById(
            "smartofficeTabApprovalSpd"
        );
    if(tabSpd){
        const handler =
            function(){
                if(
                    smartofficeApprovalDestroyed
                ){
                    return;
                }

                smartofficeSwitchApprovalTab(
                    "spd"
                );
            };
        tabSpd.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            tabSpd,
            handler
        );
    }

    /* =========================
      TAB DOKUMEN
    ========================= */
    const tabDokumen =
        document.getElementById(
            "smartofficeTabApprovalDokumen"
        );
    if(tabDokumen){
        const handler =
            function(){
                if(
                    smartofficeApprovalDestroyed
                ){
                    return;
                }

                smartofficeSwitchApprovalTab(
                    "dokumen"
                );
            };

        tabDokumen.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            tabDokumen,
            handler
        );
    }

    /* =========================
      CLOSE MODAL
    ========================= */
    const closeButton =
        document.getElementById(
            "smartofficeApprovalDetailCloseButton"
        );
    if(closeButton){
        const handler =
            smartofficeCloseApprovalDetail;

        closeButton.addEventListener(
            "click",
            handler
        );

        smartofficeApprovalHandlers.set(
            closeButton,
            handler
        );
    }

    /* =========================
      LOAD DATA
      BERJALAN PARALEL
    ========================= */
    await Promise.all([
        smartofficeLoadApprovalCuti(),
        smartofficeLoadApprovalDokumen(),
        smartofficeLoadApprovalSPD()
    ]);
}



/* ======================================================
   SMART OFFICE LOAD APPROVAL CUTI
====================================================== */
export async function smartofficeLoadApprovalCuti(){

  console.log(
    'LOAD APPROVAL CUTI JALAN'
  );

  const pageInstance =
    smartofficeApprovalPageInstance;

  /* =========================
     SESSION
  ========================= */
  const sessionData =
    smartofficeGetSession();

  /* =========================
     CONTAINER
  ========================= */
  const container =
    document.getElementById(
      'smartofficeApprovalCutiList'
    );

  if(
    !container
  ){

    console.log(
      'CONTAINER BELUM ADA'
    );

    return;
  }

  /* =========================
     LOADING
  ========================= */
  smartofficeShowLoading(
      "smartofficeApprovalCutiList",
      "Memuat data approval..."
   );

  /* =========================
     REQUEST BACKEND
  ========================= */
  console.log(
    'SESSION:',
    sessionData
  );
  
  try{
      const data =
        await smartofficeGetApprovalCutiFirestore(
            sessionData.nip
        );

      if(
          pageInstance !==
          smartofficeApprovalPageInstance
      ){
          return;
      }

      console.log(data);

      /* =========================
        BADGE TAB CUTI
      ========================= */
      const badge =
          document.getElementById(
              "smartofficeApprovalCutiBadge"
          );
      if (badge) {
          const total =
              data?.length || 0;
          badge.textContent = total;
          badge.classList.toggle(
              "show",
              total > 0
          );
      }

      /* =========================
        EMPTY DATA
      ========================= */
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="
            smartoffice-empty-state
          ">
            <div class="
              smartoffice-empty-icon
            ">
              📭
            </div>

            <h3>
              Tidak ada approval
            </h3>

            <p>
              Belum ada pengajuan
              yang perlu diproses
            </p>
          </div>
        `;

        return;
      }

      /* =========================
         HTML
      ========================= */
      let html = '';

      /* =========================
        AVATAR COLORS
      ========================= */
      const avatarColors = [
        'linear-gradient(135deg,#2563eb,#1d4ed8)',
        'linear-gradient(135deg,#7c3aed,#6d28d9)',
        'linear-gradient(135deg,#059669,#047857)',
        'linear-gradient(135deg,#ea580c,#c2410c)',
        'linear-gradient(135deg,#db2777,#be185d)',
        'linear-gradient(135deg,#0891b2,#0e7490)',
        'linear-gradient(135deg,#dc2626,#b91c1c)'
      ];

      console.log(data);
      /* =========================
        LOOP DATA
      ========================= */
      data.forEach(
        function(item,index){
            
          console.log(item);   // <-- Di sini
            
          const avatarColor =
            avatarColors[
              index % avatarColors.length
            ];

          const periodeCuti =
            item.tanggalAwal === item.tanggalAkhir

            ?

            formatTanggalIndonesia(
              item.tanggalAwal
            )

            :

            `${formatTanggalIndonesia(
              item.tanggalAwal
            )} - ${formatTanggalIndonesia(
              item.tanggalAkhir
            )}`;
            
          html += `
            <div
                class="smartoffice-approval-card"
                data-id-cuti="${item.idCuti}"
            >
              <div class="
                smartoffice-approval-card-header
              ">

                <!-- LEFT -->
                <div class="
                  smartoffice-approval-card-user
                ">

                  <!-- AVATAR -->
                  <div
                    class="
                      smartoffice-approval-avatar
                    "
                    style="
                      background:${avatarColor};
                    "
                  >
                    ${
                      item.nama
                      ? item.nama.charAt(0)
                      : 'A'
                    }
                  </div>

                  <!-- INFO -->
                  <div class="
                    smartoffice-approval-card-info
                  ">
                    <div class="
                      smartoffice-approval-card-title
                    ">
                      ${item.nama}
                    </div>

                    <div class="
                      smartoffice-approval-card-subtitle
                    ">
                      ${item.jabatan || '-'}
                    </div>
                  </div>
                </div>

                <!-- STATUS -->
                <div class="
                  smartoffice-approval-status
                ">
                  Pending
                </div>

              </div>

              <div class="
                smartoffice-approval-card-body
              ">
                <div class="
                  smartoffice-approval-item
                ">
                  <div class="
                    smartoffice-approval-label
                  ">
                    Jenis Cuti
                  </div>

                  <div class="
                    smartoffice-approval-value
                  ">
                    ${item.jenisCuti}
                  </div>
                </div>

                <div class="
                  smartoffice-approval-item
                ">
                  <div class="
                    smartoffice-approval-label
                  ">
                    Tanggal Cuti
                  </div>

                  <div class="
                    smartoffice-approval-value
                  ">
                    ${periodeCuti}
                  </div>
                </div>

                <div class="
                  smartoffice-approval-item
                ">
                  <div class="
                    smartoffice-approval-label
                  ">
                    Jumlah Hari
                  </div>

                  <div class="
                    smartoffice-approval-value
                  ">
                    ${item.jumlahCuti} Hari
                  </div>
                </div>

                <div class="
                  smartoffice-approval-item
                ">
                  <div class="
                    smartoffice-approval-label
                  ">
                    Keperluan
                  </div>

                  <div class="
                    smartoffice-approval-value
                  ">
                    ${item.keperluan}
                  </div>
                </div>
              </div>

              <!-- =========================
                  FOOTER ACTION
              ========================= -->
              <div class="
                smartoffice-approval-card-footer
              ">

                <!-- DETAIL & APPROVAL -->
                <button
                    class="
                      smartoffice-approval-detail-button
                    "
                    data-index="${index}"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="
                      M1 12s4-8 11-8
                      11 8 11 8
                      -4 8-11 8
                      -11-8-11-8
                    "/>

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>

                  <span>
                    Detail & Approval
                  </span>
                </button>
              </div>
            </div>
          `;
        }
      );

      /* =========================
        RENDER HTML
      ========================= */
      container.innerHTML = html;

         const buttons =
            container.querySelectorAll(
               ".smartoffice-approval-detail-button"
            );
         buttons.forEach(
            function(button){
                const handler =
                    function(){
                        if(
                            smartofficeApprovalDestroyed
                        ){
                            return;
                        }

                        const index =
                            Number(
                                button.dataset.index
                            );

                        smartofficeOpenApprovalDetail(
                            data[index]
                        );
                    };

                button.addEventListener(
                    "click",
                    handler
                );

                smartofficeApprovalHandlers.set(
                    button,
                    handler
                );
            }
        );
   }
   catch (error) {
      console.error(error);

      container.innerHTML = `
         <div class="smartoffice-empty-state">
               ${error.message}
         </div>
      `;
   }
}


/* ======================================================
   SMART OFFICE LOAD APPROVAL SPD
====================================================== */
export async function smartofficeLoadApprovalSPD(){

    const pageInstance =
        smartofficeApprovalPageInstance;

    const container =
        document.getElementById(
            "smartofficeApprovalSpdContent"
        );
    if(!container){
        console.warn(
            "Container Approval SPD tidak ditemukan."
        );

        return;
    }

    /* ==================================================
       LOADING
    ================================================== */
    container.innerHTML = `
        <div class="smartoffice-loading">

            <div class="
                smartoffice-loading-spinner
            "></div>

            <div class="
                smartoffice-loading-text
            ">
                Memuat approval SPD...
            </div>
        </div>
    `;

    try{
        const data =
            await smartofficeGetApprovalSPDFirestore();

        if(
            pageInstance !==
            smartofficeApprovalPageInstance
        ){

            return;
        }

        console.log(
            "APPROVAL SPD:",
            data
        );

        /* ==================================================
           BADGE TAB SPD
        ================================================== */
        const badge =
            document.getElementById(
                "smartofficeApprovalSpdBadge"
            );

        const total =
            Array.isArray(data)
                ? data.length
                : 0;
        if(badge){
            badge.textContent =
                total;

            badge.classList.toggle(
                "show",
                total > 0
            );
        }

        /* ==================================================
           EMPTY
        ================================================== */
        if(
            !Array.isArray(data) ||
            data.length === 0
        ){
            container.innerHTML = `
                <div class="
                    smartoffice-empty-state
                ">
                    <div class="
                        smartoffice-empty-icon
                    ">
                        📭
                    </div>

                    <h3>
                        Tidak ada approval SPD
                    </h3>

                    <p>
                        Belum ada SPD yang perlu
                        diproses.
                    </p>
                </div>
            `;

            return;
        }

        /* ==================================================
           RENDER
        ================================================== */
        let html = "";

        const avatarColors = [
            "linear-gradient(135deg,#2563eb,#1d4ed8)",
            "linear-gradient(135deg,#7c3aed,#6d28d9)",
            "linear-gradient(135deg,#059669,#047857)",
            "linear-gradient(135deg,#ea580c,#c2410c)",
            "linear-gradient(135deg,#db2777,#be185d)",
            "linear-gradient(135deg,#0891b2,#0e7490)",
            "linear-gradient(135deg,#dc2626,#b91c1c)"
        ];

        data.forEach(
            function(item,index){
                const avatarColor =
                    avatarColors[
                        index %
                        avatarColors.length
                    ];

                const status =
                    String(
                        item.statusSPD || ""
                    ).trim();

                const statusLabel =
                    status === "PERLU REVISI"
                        ? "Perlu Revisi"
                        : "Menunggu Review";

                const tanggalBerangkat =
                    item.tanggalBerangkat ||
                    "-";

                const tanggalPulang =
                    item.tanggalPulang ||
                    "-";

                const jenisPerjalanan =
                    item.jenisPerjalananDinas ||
                    "-";

                html += `
                    <div
                        class="
                            smartoffice-approval-card
                        "
                        data-id-spd="
                            ${item.idSPD}
                        "
                    >
                        <!-- HEADER -->
                        <div class="
                            smartoffice-approval-card-header
                        ">
                            <div class="
                                smartoffice-approval-card-user
                            ">
                                <div
                                    class="
                                        smartoffice-approval-avatar
                                    "
                                    style="
                                        background:${avatarColor};
                                    "
                                >
                                    ${
                                        item.nama
                                            ? item.nama.charAt(0)
                                            : "S"
                                    }
                                </div>

                                <div class="
                                    smartoffice-approval-card-info
                                ">
                                    <div class="
                                        smartoffice-approval-card-title
                                    ">
                                        ${item.nama || "-"}
                                    </div>


                                    <div class="
                                        smartoffice-approval-card-subtitle
                                    ">
                                        ${item.jabatan || "-"}
                                    </div>
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-status
                            ">
                                ${statusLabel}
                            </div>
                        </div>

                        <!-- BODY -->
                        <div class="
                            smartoffice-approval-card-body
                        ">
                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    ID SPD
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${item.idSPD || "-"}
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    Kegiatan
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${item.kegiatan || "-"}
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    Lokasi
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${item.lokasi || "-"}
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    Tanggal Perjalanan
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${tanggalBerangkat}
                                    -
                                    ${tanggalPulang}
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    Jumlah Hari
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${item.jumlahHari || 0}
                                    Hari
                                </div>
                            </div>

                            <div class="
                                smartoffice-approval-item
                            ">
                                <div class="
                                    smartoffice-approval-label
                                ">
                                    Tipe Keberangkatan
                                </div>

                                <div class="
                                    smartoffice-approval-value
                                ">
                                    ${item.tipeKeberangkatan || "-"}
                                </div>
                            </div>
                        </div>

                        <!-- FOOTER -->
                        <div class="
                            smartoffice-approval-card-footer
                        ">
                            <button
                                type="button"
                                class="
                                    smartoffice-approval-detail-button
                                "
                                data-index="${index}"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="
                                        M1 12s4-8 11-8
                                        11 8 11 8
                                        -4 8-11 8
                                        -11-8-11-8
                                    "/>

                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="3"
                                    />
                                </svg>

                                <span>
                                    Detail & Approval
                                </span>
                            </button>
                        </div>
                    </div>
                `;
            }
        );

        container.innerHTML =
            html;

        /* ==================================================
           DETAIL BUTTON
        ================================================== */
        const buttons =
            container.querySelectorAll(
                ".smartoffice-approval-detail-button"
            );

        buttons.forEach(
            function(button){

                const handler =
                    async function(event){

                        event.preventDefault();
                        event.stopPropagation();

                        if(
                            smartofficeApprovalDestroyed
                        ){
                            return;
                        }

                        const index =
                            Number(
                                button.dataset.index
                            );

                        const item =
                            data[index];

                        if(!item){
                            smartofficeShowToast(
                                "Data SPD tidak ditemukan.",
                                "error"
                            );

                            return;
                        }

                        smartofficeOpenApprovalSPD(
                            item
                        );
                    };

                button.addEventListener(
                    "click",
                    handler
                );

                smartofficeApprovalHandlers.set(
                    button,
                    handler
                );

            }
        );
    }
    catch(error){
        console.error(
            "Load Approval SPD Error:",
            error
        );

        container.innerHTML = `
            <div class="
                smartoffice-empty-state
            ">
                <h3>
                    Gagal memuat approval SPD
                </h3>
                <p>
                    ${
                        error.message ||
                        "Terjadi kesalahan."
                    }
                </p>
            </div>
        `;
    }
}


/* ======================================================
  UPDATE UI LANGSUNG
  TANPA GET ULANG
===================================================== */
function smartofficeRemoveApprovalCutiFromUI(idCuti){

    const container =
        document.getElementById(
            "smartofficeApprovalCutiList"
        );

    if(!container) return;

    const card =
        container.querySelector(
            `.smartoffice-approval-card[data-id-cuti="${idCuti}"]`
        );
    if(card){
        card.remove();
    }

    /* UPDATE BADGE CUTI */
    const badge =
        document.getElementById(
            "smartofficeApprovalCutiBadge"
        );

    const remaining =
        container.querySelectorAll(
            ".smartoffice-approval-card"
        ).length;

    if(badge){
        badge.textContent =
            remaining;

        badge.classList.toggle(
            "show",
            remaining > 0
        );
    }

    /* EMPTY STATE */
    if(remaining === 0){
        container.innerHTML = `
            <div class="smartoffice-empty-state">
                <div class="smartoffice-empty-icon">
                    📭
                </div>
                <h3>
                    Tidak ada approval
                </h3>
                <p>
                    Belum ada pengajuan yang perlu diproses
                </p>
            </div>
        `;
    }
}


/* ================================================================================
   DETAIL MODAL CUTI
================================================================================ */

/* ======================================================
   SMART OFFICE OPEN APPROVAL DETAIL
====================================================== */
function smartofficeOpenApprovalDetail(
  item
){

  /* =========================
     SAVE ACTIVE ID CUTI
  ========================= */
  smartofficeApprovalState.idCuti =
    item.idCuti;

  /* =========================
     MODAL
  ========================= */
  const modal =
    document.getElementById(
      'smartofficeApprovalDetailModal'
    );

  /* =========================
     BODY
  ========================= */
  const body =
    document.getElementById(
      'smartofficeApprovalDetailBody'
    );

  /* =========================
     SHOW MODAL
  ========================= */
  modal.style.display =
  'flex';

  if(smartofficeApprovalModalTimer){
      clearTimeout(
          smartofficeApprovalModalTimer
      );
  }

  smartofficeApprovalModalTimer =
      setTimeout(function(){
          if(
              !modal ||
              !modal.isConnected
          ){
              smartofficeApprovalModalTimer =
                  null;
              return;
          }
          modal.classList.add('show');

          smartofficeApprovalModalTimer =
              null;
      },10);

  /* =========================
    RESET ACTION
  ========================= */
  smartofficeApprovalAction = "";

  /* =========================
    HELPER
  ========================= */
  const identitasLabel =
    item.statusKepegawaian === 'BLUD'
      ? 'NRP'
      : 'NIP';

  const periodeCuti =
    item.tanggalAwal === item.tanggalAkhir

    ?

    formatTanggalIndonesia(
      item.tanggalAwal
    )

    :

    `${formatTanggalIndonesia(
      item.tanggalAwal
    )} - ${formatTanggalIndonesia(
      item.tanggalAkhir
    )}`;

  /* =========================
     RENDER DETAIL
  ========================= */
    body.innerHTML = `

      <!-- PROFILE HEADER -->
      <div class="
        smartoffice-approval-profile
      ">

        <!-- AVATAR -->
        <div class="
          smartoffice-approval-avatar
        ">
          ${item.nama
            ? item.nama.charAt(0)
            : 'A'
          }
        </div>

        <!-- INFO -->
        <div class="
          smartoffice-approval-profile-info
        ">
          <h4>
            ${item.nama || '-'}
          </h4>

          <p>
            ${item.jabatan || '-'}
          </p>
        </div>
      </div>

      <!-- DETAIL -->
      <div class="
        smartoffice-approval-detail-grid
      ">

        <!-- NIP -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>${identitasLabel}</label>
          <span>
            ${item.nip || '-'}
          </span>
        </div>

        <!-- STATUS -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Status Kepegawaian</label>
          <span>
            ${item.statusKepegawaian || '-'}
          </span>
        </div>

        <!-- MASA KERJA -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Masa Kerja</label>
          <span>
            ${item.masaKerja || '-'}
          </span>
        </div>

        <!-- JENIS CUTI -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Jenis Cuti</label>
          <span>
            ${item.jenisCuti || '-'}
          </span>
        </div>

        <!-- TANGGAL SURAT -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>
            Tanggal Surat Permohonan
          </label>

          <span>
            ${item.tanggalSurat || '-'}
          </span>
        </div>

        <!-- TANGGAL CUTI -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>
            Tanggal Cuti
          </label>

          <span>
            ${periodeCuti}
          </span>
        </div>

        <!-- JUMLAH -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Jumlah Hari</label>
          <span>
            ${item.jumlahCuti || 0} Hari
          </span>
        </div>

        <!-- SISA CUTI -->
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Sisa Cuti Tahunan</label>
          <span>
            ${item.sisaCuti || 0} Hari
          </span>
        </div>
      </div>

      <!-- KEPERLUAN -->
      <div class="
        smartoffice-approval-detail-item
        full-width
      ">
        <label>Keperluan</label>

        <span>
          ${item.keperluan || '-'}
        </span>
      </div>

      <!-- ALAMAT -->
      <div class="
        smartoffice-approval-detail-item
        full-width
      ">
        <label>
          Alamat Selama Menjalani Cuti
        </label>

        <span>
          ${item.alamatSaatCuti || '-'}
        </span>
      </div>

      <!-- DELEGASI -->
      <div class="
        smartoffice-approval-detail-grid
      ">
        <div class="
          smartoffice-approval-detail-item
        ">
          <label>Penerima Delegasi</label>

          <span>
            ${item.delegasi || '-'}
          </span>
        </div>

        <div class="
          smartoffice-approval-detail-item
        ">
          <label>NIP/NRP</label>

          <span>
            ${item.nipDelegasi || '-'}
          </span>
        </div>
      </div>

      <!-- TUGAS -->
      <div class="
        smartoffice-approval-detail-item
        full-width
      ">
        <label>
          Tugas Yang Didelegasikan
        </label>

        <span>
          ${item.tugasDelegasi || '-'}
        </span>
      </div>

      <!-- LAMPIRAN -->
      <div class="
        smartoffice-approval-lampiran
      ">
        <div class="
          smartoffice-approval-lampiran-title
        ">
          Lampiran
        </div>

        <div class="
          smartoffice-approval-file-card
        ">
          <div class="
            smartoffice-approval-file-icon
          ">
            📄
          </div>

          <div class="
            smartoffice-approval-file-info
          ">
            <div class="
              smartoffice-approval-file-name
            ">
              ${
                item.lampiran
                ?
                `
                <button
                  id="smartofficePreviewLampiranButton"
                  class="
                     smartoffice-approval-dokumen-link
                  "
                  data-fileid="${smartofficeGetDriveFileId(item.lampiran)}"
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>

                  <span>
                    Lihat Lampiran
                  </span>

                </button>
                `
                :
                'Tidak ada lampiran'
              }
            </div>
          </div>
        </div>
      </div>

      <!-- INFO BOX -->
      <div class="
        smartoffice-approval-info-box
      ">
        <div class="
          smartoffice-approval-info-icon
        ">
          ℹ
        </div>

        <div class="
          smartoffice-approval-info-text
        ">
          Pastikan data pengajuan cuti
          sudah sesuai sebelum
          melakukan approval.
        </div>
      </div>

      <!-- APPROVAL ACTION -->
      <div class="
        smartoffice-approval-action
      ">
        <div class="
          smartoffice-approval-action-title
        ">
          Aksi Approval
        </div>

        <!-- ACTION BUTTONS -->
        <div class="
          smartoffice-approval-action-buttons
        ">

          <!-- APPROVE -->
          <button
            id="smartofficeApproveActionButton"
            class="
               smartoffice-approval-action-button
            "
            type="button"
          >
            ✓ Approve
          </button>

          <!-- REJECT -->
          <button
            id="smartofficeRejectActionButton"
            class="
               smartoffice-approval-action-button
            "
            type="button"
          >
            ✕ Reject
          </button>
        </div>

        <!-- CATATAN -->
        <div
          id="smartofficeApprovalCatatanWrapper"
          style="
            display:none;
          "
        >
          <textarea
            id="smartofficeApprovalCatatan"
            class="
              smartoffice-approval-catatan
            "
            placeholder="
              Tulis alasan penolakan...
            "
          ></textarea>
        </div>

        <!-- FOOTER -->
        <div class="
          smartoffice-approval-action-footer
        ">
          <button
            id="smartofficeApprovalCancelButton"
            class="
               smartoffice-approval-cancel-button
            "
          >
            Batal
          </button>

          <button
            id="smartofficeApprovalSubmitButton"
            class="
               smartoffice-approval-submit-button
            "
          >
            Submit
          </button>
        </div>
      </div>
    `;

    /* =========================
      EVENT LISTENER
   ========================= */
   // Preview Lampiran
   document
      .getElementById("smartofficePreviewLampiranButton")
      ?.addEventListener("click", function () {
         const fileId = this.dataset.fileid;

         smartofficeOpenPreviewDokumen(
               fileId,
               "Lampiran Cuti"
         );
      });

   // Approve
   document
      .getElementById("smartofficeApproveActionButton")
      ?.addEventListener("click", function () {
         smartofficeSetApprovalAction("APPROVE");
      });

   // Reject
   document
      .getElementById("smartofficeRejectActionButton")
      ?.addEventListener("click", function () {
         smartofficeSetApprovalAction("REJECT");
      });

   // Cancel
   document
      .getElementById("smartofficeApprovalCancelButton")
      ?.addEventListener("click", function () {
         smartofficeCloseApprovalDetail();
      });

   // Submit
   document
      .getElementById("smartofficeApprovalSubmitButton")
      ?.addEventListener("click", function () {
         smartofficeSubmitApprovalAction();
      });  
}


/* ======================================================
   SMART OFFICE CLOSE APPROVAL DETAIL
====================================================== */
export function smartofficeCloseApprovalDetail(){

  const modal =
    document.getElementById(
      "smartofficeApprovalDetailModal"
    );
  if(!modal){
    return;
  }

  /* REMOVE SHOW */
  modal.classList.remove(
    "show"
  );

  /* RESET STATE */
  smartofficeApprovalAction =
    "";

  smartofficeApprovalState.idCuti =
    "";

  /* RESET FORM */
  const textarea =
    document.getElementById(
      "smartofficeApprovalCatatan"
    );
  if(
    textarea
  ){
    textarea.value =
      "";
  }

  const textareaWrapper =
    document.getElementById(
      "smartofficeApprovalCatatanWrapper"
    );
  if(
    textareaWrapper
  ){
    textareaWrapper.style.display =
      "none";
  }

  /* RESET BUTTON */
  const approveButton =
    document.getElementById(
      "smartofficeApproveActionButton"
    );

  const rejectButton =
    document.getElementById(
      "smartofficeRejectActionButton"
    );

  approveButton?.classList.remove(
    "active"
  );

  rejectButton?.classList.remove(
    "reject-active"
  );

  approveButton?.classList.add(
    "active"
  );

  /* HIDE AFTER ANIMATION */
  if(smartofficeApprovalModalTimer){
      clearTimeout(
          smartofficeApprovalModalTimer
      );
  }

  smartofficeApprovalModalTimer =
      setTimeout(function(){
          if(
              !modal ||
              !modal.isConnected
          ){
              smartofficeApprovalModalTimer =
                  null;
              return;
          }

          if(
              !modal.classList.contains('show')
          ){
              modal.style.display = 'none';
          }

          smartofficeApprovalModalTimer =
              null;
      },250);
}


/* ======================================================
   OPEN DETAIL APPROVAL SPD
====================================================== */

function smartofficeOpenApprovalSPD(item){

    if(!item){
        return;
    }

    const existing =
        document.getElementById(
            "smartofficeApprovalSPDModal"
        );

    if(existing){
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.id =
        "smartofficeApprovalSPDModal";

    modal.className =
        "smartoffice-approval-spd-modal-overlay";


    const raw =
        item.raw || {};

    const status =
        String(
            item.statusSPD || ""
        ).trim();


    /* ==================================================
       PENGIKUT
    ================================================== */

    const pengikut = [
        {
            nama:
                raw["Nama Pengikut 1"] || "",
            nip:
                raw["NIP/NRP Pengikut 1"] || "",
            tglLahir:
                raw["Tgl Lahir 1"] || "",
            noWa:
                raw["No_WA Pengikut 1"] || ""
        },
        {
            nama:
                raw["Nama Pengikut 2"] || "",
            nip:
                raw["NIP/NRP Pengikut 2"] || "",
            tglLahir:
                raw["Tgl Lahir 2"] || "",
            noWa:
                raw["No_WA Pengikut 2"] || ""
        },
        {
            nama:
                raw["Nama Pengikut 3"] || "",
            nip:
                raw["NIP/NRP Pengikut 3"] || "",
            tglLahir:
                raw["Tgl Lahir 3"] || "",
            noWa:
                raw["No_WA Pengikut 3"] || ""
        },
        {
            nama:
                raw["Nama Pengikut 4"] || "",
            nip:
                raw["NIP/NRP Pengikut 4"] || "",
            tglLahir:
                raw["Tgl Lahir 4"] || "",
            noWa:
                raw["No_WA Pengikut 4"] || ""
        }
    ].filter(function(person){

        return (
            person.nama ||
            person.nip ||
            person.tglLahir ||
            person.noWa
        );

    });


    /* ==================================================
       RENDER PENGIKUT
    ================================================== */

    let pengikutHTML = "";

    if(pengikut.length){

        pengikutHTML =
            pengikut.map(
                function(person,index){

                    return `
                        <div
                            class="
                                smartoffice-approval-spd-pengikut-card
                            "
                        >

                            <div
                                class="
                                    smartoffice-approval-spd-pengikut-number
                                "
                            >
                                ${index + 1}
                            </div>

                            <div
                                class="
                                    smartoffice-approval-spd-pengikut-info
                                "
                            >

                                <strong>
                                    ${person.nama || "-"}
                                </strong>

                                <span>
                                    NIP / NRP:
                                    ${person.nip || "-"}
                                </span>

                                <span>
                                    Tgl Lahir:
                                    ${person.tglLahir || "-"}
                                </span>

                                <span>
                                    No. WA:
                                    ${person.noWa || "-"}
                                </span>

                            </div>

                        </div>
                    `;

                }
            ).join("");

    }
    else{

        pengikutHTML = `
            <div
                class="
                    smartoffice-approval-spd-empty
                "
            >
                Tidak ada pengikut.
            </div>
        `;

    }


    /* ==================================================
       DETAIL JADWAL
    ================================================== */

    const jadwal = [
        {
            hari: "Hari 1",
            berangkat:
                raw["Berangkat Hari 1"] || "",
            pulang:
                raw["Pulang Hari 1"] || "",
            lokasi:
                raw["Lokasi Hari 1"] || "",
            tiba:
                raw["Tiba Hari 1"] || ""
        },
        {
            hari: "Hari 2",
            berangkat:
                raw["Berangkat Hari 2"] || "",
            pulang:
                raw["Pulang Hari 2"] || "",
            lokasi:
                raw["Lokasi Hari 2"] || "",
            tiba:
                raw["Tiba Hari 2"] || ""
        },
        {
            hari: "Hari 3",
            berangkat:
                raw["Berangkat Hari 3"] || "",
            pulang:
                raw["Pulang Hari 3"] || "",
            lokasi:
                raw["Lokasi Hari 3"] || "",
            tiba:
                raw["Tiba Hari 3"] || ""
        }
    ].filter(function(schedule){

        return (
            schedule.berangkat ||
            schedule.pulang ||
            schedule.lokasi ||
            schedule.tiba
        );

    });


    let jadwalHTML = "";

    if(jadwal.length){

        jadwalHTML =
            jadwal.map(
                function(schedule){

                    return `
                        <div
                            class="
                                smartoffice-approval-spd-jadwal-card
                            "
                        >

                            <div
                                class="
                                    smartoffice-approval-spd-jadwal-title
                                "
                            >
                                ${schedule.hari}
                            </div>

                            <div
                                class="
                                    smartoffice-approval-spd-jadwal-grid
                                "
                            >

                                <div>
                                    <label>
                                        Berangkat
                                    </label>

                                    <span>
                                        ${schedule.berangkat || "-"}
                                    </span>
                                </div>

                                <div>
                                    <label>
                                        Pulang
                                    </label>

                                    <span>
                                        ${schedule.pulang || "-"}
                                    </span>
                                </div>

                                <div>
                                    <label>
                                        Lokasi
                                    </label>

                                    <span>
                                        ${schedule.lokasi || "-"}
                                    </span>
                                </div>

                                <div>
                                    <label>
                                        Tiba
                                    </label>

                                    <span>
                                        ${schedule.tiba || "-"}
                                    </span>
                                </div>

                            </div>

                        </div>
                    `;

                }
            ).join("");

    }
    else{

        jadwalHTML = `
            <div
                class="
                    smartoffice-approval-spd-empty
                "
            >
                Detail jadwal perjalanan tidak tersedia.
            </div>
        `;

    }


    /* ==================================================
       MODAL HTML
    ================================================== */

    modal.innerHTML = `

        <div
            class="
                smartoffice-approval-spd-modal
            "
        >

            <!-- HEADER -->
            <div
                class="
                    smartoffice-approval-spd-modal-header
                "
            >

                <div>

                    <h3>
                        Detail Approval SPD
                    </h3>

                    <p>
                        ${item.idSPD || "-"}
                    </p>

                </div>

                <button
                    type="button"
                    id="smartofficeApprovalSPDClose"
                    class="
                        smartoffice-approval-spd-modal-close
                    "
                >
                    ×
                </button>

            </div>


            <!-- BODY -->
            <div
                class="
                    smartoffice-approval-spd-modal-body
                "
            >

                <!-- PROFILE -->
                <div
                    class="
                        smartoffice-approval-spd-profile
                    "
                >

                    <div
                        class="
                            smartoffice-approval-spd-avatar
                        "
                    >
                        ${
                            item.nama
                                ? item.nama.charAt(0)
                                : "S"
                        }
                    </div>

                    <div
                        class="
                            smartoffice-approval-spd-profile-info
                        "
                    >

                        <h4>
                            ${item.nama || "-"}
                        </h4>

                        <p>
                            ${item.jabatan || "-"}
                        </p>

                    </div>

                </div>


                <!-- INFORMASI SPD -->
                <div
                    class="
                        smartoffice-approval-spd-section-title
                    "
                >
                    Informasi SPD
                </div>


                <div
                    class="
                        smartoffice-approval-spd-detail-grid
                    "
                >

                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            NIP / NRP
                        </label>

                        <span>
                            ${item.nip || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Pangkat & Golongan
                        </label>

                        <span>
                            ${
                                item.pangkatGolongan ||
                                "-"
                            }
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Email
                        </label>

                        <span>
                            ${raw["Email"] || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            No. WhatsApp
                        </label>

                        <span>
                            ${raw["No_WA"] || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Alat Angkut
                        </label>

                        <span>
                            ${raw["Alat Angkut"] || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Kegiatan
                        </label>

                        <span>
                            ${item.kegiatan || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Lokasi
                        </label>

                        <span>
                            ${item.lokasi || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Tanggal SPD Dibuat
                        </label>

                        <span>
                            ${item.tanggalSPD || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Tanggal Berangkat
                        </label>

                        <span>
                            ${item.tanggalBerangkat || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Tanggal Pulang
                        </label>

                        <span>
                            ${item.tanggalPulang || "-"}
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Jumlah Hari
                        </label>

                        <span>
                            ${item.jumlahHari || 0} Hari
                        </span>
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-detail-item
                        "
                    >
                        <label>
                            Tipe Keberangkatan
                        </label>

                        <span>
                            ${
                                item.tipeKeberangkatan ||
                                "-"
                            }
                        </span>
                    </div>

                </div>


                <!-- JADWAL -->
                <div
                    class="
                        smartoffice-approval-spd-section-title
                    "
                >
                    Detail Jadwal Perjalanan
                </div>


                <div
                    class="
                        smartoffice-approval-spd-jadwal-list
                    "
                >
                    ${jadwalHTML}
                </div>


                <!-- PENGIKUT -->
                <div
                    class="
                        smartoffice-approval-spd-section-title
                    "
                >
                    Pengikut
                </div>


                <div
                    class="
                        smartoffice-approval-spd-pengikut-list
                    "
                >
                    ${pengikutHTML}
                </div>


                <!-- PENETAPAN -->
                <div
                    class="
                        smartoffice-approval-spd-section-title
                    "
                >
                    Penetapan Perjalanan Dinas
                </div>


                <div
                    class="
                        smartoffice-approval-spd-detail-item
                        smartoffice-approval-spd-full-width
                    "
                >

                    <label>
                        Jenis Perjalanan Dinas
                    </label>

                    <select
                        id="smartofficeApprovalSPDJenis"
                        class="
                            smartoffice-approval-spd-form-input
                        "
                    >

                        <option value="">
                            Pilih Jenis Perjalanan Dinas
                        </option>

                        <option
                            value="Perjalanan Dinas Dalam Kota"
                            ${
                                item.jenisPerjalananDinas ===
                                "Perjalanan Dinas Dalam Kota"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Perjalanan Dinas Dalam Kota
                        </option>

                        <option
                            value="Perjalanan Dinas Biasa"
                            ${
                                item.jenisPerjalananDinas ===
                                "Perjalanan Dinas Biasa"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Perjalanan Dinas Biasa
                        </option>

                    </select>

                </div>


                <!-- CATATAN -->
                <div
                    id="smartofficeApprovalSPDCatatanWrapper"
                    class="
                        smartoffice-approval-spd-detail-item
                        smartoffice-approval-spd-full-width
                    "
                    style="display:none;"
                >

                    <label>
                        Catatan
                    </label>

                    <textarea
                        id="smartofficeApprovalSPDCatatan"
                        class="
                            smartoffice-approval-spd-catatan
                        "
                        placeholder=""
                    ></textarea>

                </div>


                <!-- ACTION -->
                <div
                    class="
                        smartoffice-approval-spd-action
                    "
                >

                    <div
                        class="
                            smartoffice-approval-spd-action-title
                        "
                    >
                        Aksi Approval SPD
                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-action-buttons
                        "
                    >

                        <button
                            type="button"
                            id="smartofficeApprovalSPDApprove"
                            class="
                                smartoffice-approval-spd-action-button
                            "
                        >
                            ✓ Approve
                        </button>


                        <button
                            type="button"
                            id="smartofficeApprovalSPDRevisi"
                            class="
                                smartoffice-approval-spd-action-button
                            "
                        >
                            ↻ Perlu Revisi
                        </button>


                        <button
                            type="button"
                            id="smartofficeApprovalSPDBatalkan"
                            class="
                                smartoffice-approval-spd-action-button
                            "
                        >
                            ✕ Tolak
                        </button>

                    </div>


                    <div
                        class="
                            smartoffice-approval-spd-action-footer
                        "
                    >

                        <button
                            type="button"
                            id="smartofficeApprovalSPDCancel"
                            class="
                                smartoffice-approval-spd-cancel
                            "
                        >
                            Batal
                        </button>


                        <button
                            type="button"
                            id="smartofficeApprovalSPDSubmit"
                            class="
                                smartoffice-approval-spd-submit
                            "
                        >
                            Proses
                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ==================================================
       STATE
    ================================================== */

    let selectedAction = "";


    /* ==================================================
       ELEMENT
    ================================================== */

    const jenisSelect =
        document.getElementById(
            "smartofficeApprovalSPDJenis"
        );

    const catatanWrapper =
        document.getElementById(
            "smartofficeApprovalSPDCatatanWrapper"
        );

    const catatanInput =
        document.getElementById(
            "smartofficeApprovalSPDCatatan"
        );

    const approveButton =
        document.getElementById(
            "smartofficeApprovalSPDApprove"
        );

    const revisiButton =
        document.getElementById(
            "smartofficeApprovalSPDRevisi"
        );

    const tolakButton =
        document.getElementById(
            "smartofficeApprovalSPDBatalkan"
        );

    const closeButton =
        document.getElementById(
            "smartofficeApprovalSPDClose"
        );

    const cancelButton =
        document.getElementById(
            "smartofficeApprovalSPDCancel"
        );

    const submitButton =
        document.getElementById(
            "smartofficeApprovalSPDSubmit"
        );


    /* ==================================================
       SET ACTION
    ================================================== */

    function setAction(action){

        selectedAction =
            action;


        approveButton?.classList.remove(
            "smartoffice-approval-spd-action-active",
            "smartoffice-approval-spd-action-danger"
        );

        revisiButton?.classList.remove(
            "smartoffice-approval-spd-action-active",
            "smartoffice-approval-spd-action-danger"
        );

        tolakButton?.classList.remove(
            "smartoffice-approval-spd-action-active",
            "smartoffice-approval-spd-action-danger"
        );


        if(action === "APPROVE"){

            approveButton?.classList.add(
                "smartoffice-approval-spd-action-active"
            );

            catatanWrapper.style.display =
                "none";

            catatanInput.value =
                "";

            catatanInput.placeholder =
                "";

        }


        else if(action === "REVISI"){

            revisiButton?.classList.add(
                "smartoffice-approval-spd-action-danger"
            );

            catatanWrapper.style.display =
                "block";

            catatanInput.placeholder =
                "Tulis catatan revisi...";

        }


        else if(action === "BATALKAN"){

            tolakButton?.classList.add(
                "smartoffice-approval-spd-action-danger"
            );

            catatanWrapper.style.display =
                "block";

            catatanInput.placeholder =
                "Tulis alasan penolakan...";

        }

    }


    /* ==================================================
       ACTION BUTTON
    ================================================== */

    approveButton?.addEventListener(
        "click",
        function(){

            setAction("APPROVE");

        }
    );


    revisiButton?.addEventListener(
        "click",
        function(){

            setAction("REVISI");

        }
    );


    tolakButton?.addEventListener(
        "click",
        function(){

            setAction("BATALKAN");

        }
    );


    /* ==================================================
       CLOSE
    ================================================== */

    function closeModal(){

        modal.remove();

    }


    closeButton?.addEventListener(
        "click",
        closeModal
    );


    cancelButton?.addEventListener(
        "click",
        closeModal
    );


    /* ==================================================
       SUBMIT
    ================================================== */

    submitButton?.addEventListener(
        "click",
        async function(){

            if(!selectedAction){

                smartofficeShowToast(
                    "Pilih aksi approval terlebih dahulu.",
                    "warning"
                );

                return;
            }


            if(!jenisSelect?.value){

                smartofficeShowToast(
                    "Pilih Jenis Perjalanan Dinas terlebih dahulu.",
                    "warning"
                );

                jenisSelect?.focus();

                return;
            }


            const catatan =
                catatanInput?.value.trim() || "";


            if(
                (
                    selectedAction === "REVISI" ||
                    selectedAction === "BATALKAN"
                ) &&
                !catatan
            ){

                smartofficeShowToast(
                    selectedAction === "REVISI"
                        ? "Catatan revisi wajib diisi."
                        : "Alasan penolakan wajib diisi.",
                    "warning"
                );

                catatanInput?.focus();

                return;
            }


            await smartofficeSubmitApprovalSPD(
                item,
                selectedAction,
                jenisSelect.value,
                catatan,
                submitButton,
                closeModal
            );

        }
    );


    /* ==================================================
       CLICK OUTSIDE
    ================================================== */

    modal.addEventListener(
        "click",
        function(event){

            if(
                event.target === modal
            ){

                closeModal();

            }

        }
    );

}


/* ======================================================
   DESTROY APPROVAL PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    if(smartofficeApprovalModalTimer){
        clearTimeout(
            smartofficeApprovalModalTimer
        );

        smartofficeApprovalModalTimer = null;
    }

    /* =========================
       MARK DESTROYED
    ========================= */
    smartofficeApprovalDestroyed =
        true;

    /* =========================
       REMOVE ALL EVENT LISTENERS
    ========================= */
    smartofficeApprovalHandlers
        .forEach(
            function(
                handler,
                element
            ){
                if(
                    element &&
                    handler
                ){
                    element.removeEventListener(
                        "click",
                        handler
                    );
                }
            }
        );

    smartofficeApprovalHandlers.clear();

    /* =========================
       CLOSE MODAL APPROVAL CUTI
    ========================= */
    const modal =
        document.getElementById(
            "smartofficeApprovalDetailModal"
        );
    if(modal){
        modal.classList.remove(
            "show"
        );
        modal.style.display =
            "none";
    }

    /* =========================
      RESET APPROVAL DOKUMEN
    ========================= */
    const dokumenList =
        document.getElementById(
            "smartofficeApprovalDokumenList"
        );

    if(dokumenList){
        dokumenList.innerHTML = "";
    }

    /* =========================
       RESET BADGE DOKUMEN
    ========================= */
    const dokumenBadge =
        document.getElementById(
            "smartofficeApprovalDokumenBadge"
        );

    if(dokumenBadge){
        dokumenBadge.textContent =
            "0";

        dokumenBadge.style.display =
            "none";
    }

    /* =========================
      CLOSE MODAL DOKUMEN
    ========================= */
    const dokumenModal =
        document.getElementById(
            "smartofficeApprovalDokumenActionModal"
        );

    if(dokumenModal){
        dokumenModal.classList.remove(
            "show"
        );

        dokumenModal.style.display =
            "none";
    }

    /* =========================
       RESET STATE
    ========================= */
    smartofficeApprovalState.idCuti =
        "";

    smartofficeApprovalAction =
        "";

    smartofficeSubmittingApproval =
        false;

    /* =========================
       REMOVE GLOBAL FUNCTION
    ========================= */
    if(
        window.smartofficeCloseApprovalDetail ===
        smartofficeCloseApprovalDetail
    ){
        delete window
            .smartofficeCloseApprovalDetail;
    }
}

window.smartofficeCloseApprovalDetail =
    smartofficeCloseApprovalDetail;


/* ======================================================
   SUBMIT APPROVAL ACTION
====================================================== */
async function smartofficeSubmitApprovalAction(){

  /* PREVENT DOUBLE CLICK */
  if(
    smartofficeSubmittingApproval
  ){
    return;
  }

  /* =========================
     SESSION
  ========================= */
  const sessionData =
    smartofficeGetSession();

  /* =========================
     ACTION
  ========================= */
  const action =
    smartofficeApprovalAction;
  if(
      action !== "APPROVE" &&
      action !== "REJECT"
  ){
      smartofficeShowToast(
          "Silakan pilih Approve atau Reject terlebih dahulu.",
          "error"
      );
      return;
  }

  console.log(
      "SMARTOFFICE APPROVAL ACTION SEBELUM SUBMIT:",
      action
  );

  /* =========================
     CATATAN
  ========================= */
  const textarea =
    document.getElementById(
      "smartofficeApprovalCatatan"
    );

  const catatan =
    textarea
      ? textarea.value.trim()
      : "";

  /* =========================
     VALIDASI REJECT
  ========================= */
  if(
    action === "REJECT"
    &&
    !catatan
  ){
    smartofficeShowToast(
      "Catatan reject wajib diisi",
      "error"
    );

    return;
  }

  /* =========================
     BUTTON
  ========================= */
  const submitButton =
    document.getElementById(
      "smartofficeApprovalSubmitButton"
    );

  /* =========================
     LOCK
  ========================= */
  smartofficeSubmittingApproval =
    true;

  /* =========================
     DISABLE BUTTON
  ========================= */
  if(
    submitButton
  ){
    submitButton.disabled =
      true;
  }

  /* =========================
     BUTTON TEXT
  ========================= */
  if(
    submitButton
  ){
    submitButton.innerHTML =
      action === "REJECT"
        ? "Menolak..."
        : "Menyetujui...";
  }

  /* =========================
     GLOBAL LOADING
  ========================= */
  smartofficeShowGlobalLoading(
    action === "REJECT"
      ? "Memproses penolakan..."
      : "Memproses persetujuan..."
  );

  try{

    /* =========================
       PROCESS APPROVAL
    ========================= */
    const response =
      await smartofficeProcessApprovalCuti(
        smartofficeApprovalState.idCuti,
        action,
        sessionData.nip,
        catatan
      );

    /* =========================
       SUCCESS
    ========================= */
    smartofficeShowToast(
      response.message,
      "success"
    );

    /* =========================
      SIMPAN ID CUTI
    ========================= */
    const idCuti =
        smartofficeApprovalState.idCuti;

    /* =========================
       CLOSE MODAL
    ========================= */
    smartofficeCloseApprovalDetail();

    /* =========================
      UPDATE UI LANGSUNG
      TANPA GET ULANG
    ========================= */
    smartofficeRemoveApprovalCutiFromUI(
        idCuti
    );
  }catch(error){
    smartofficeShowToast(
      error.message ||
      "Terjadi kesalahan.",
      "error"
    );

  }finally{

    /* =========================
       HIDE GLOBAL LOADING
    ========================= */
    smartofficeHideGlobalLoading();

    /* =========================
       RESET STATE
    ========================= */
    smartofficeSubmittingApproval =
      false;

    /* =========================
       ENABLE BUTTON
    ========================= */
    if(
      submitButton
    ){
      submitButton.disabled =
        false;

      submitButton.innerHTML =
        action === "REJECT"
          ? "Tolak"
          : "Setujui";
    }
  }
}


/* ======================================================
   SET APPROVAL ACTION
====================================================== */
function smartofficeSetApprovalAction(action){

  /* =========================
     SAVE STATE
  ========================= */
  smartofficeApprovalAction =
    action;

  /* =========================
     BUTTON
  ========================= */
  const approveButton =
    document.getElementById(
      "smartofficeApproveActionButton"
    );

  const rejectButton =
    document.getElementById(
      "smartofficeRejectActionButton"
    );

  /* =========================
     TEXTAREA
  ========================= */
  const textareaWrapper =
    document.getElementById(
      "smartofficeApprovalCatatanWrapper"
    );

  /* =========================
     VALIDASI
  ========================= */
  if(
    !approveButton ||
    !rejectButton
  ){
    return;
  }

  /* =========================
     RESET BUTTON
  ========================= */
  approveButton.classList.remove(
    "active"
  );

  rejectButton.classList.remove(
    "reject-active"
  );

  /* =========================
     APPROVE
  ========================= */
  if(
    action === "APPROVE"
  ){
    approveButton.classList.add(
      "active"
    );

    if(
      textareaWrapper
    ){
      textareaWrapper.style.display =
        "none";
    }
  }

  /* =========================
     REJECT
  ========================= */
  else{
    rejectButton.classList.add(
      "reject-active"
    );

    if(
      textareaWrapper
    ){
      textareaWrapper.style.display =
        "block";
    }
  }
}



/* ================================================================================
   APPROVAL ACTION HELPER
================================================================================ */

/* ======================================================
   SMART OFFICE REFRESH APPROVAL
====================================================== */
async function smartofficeRefreshApproval(){

    try{
        /* =========================
           REFRESH CUTI + DOKUMEN
        ========================= */
        await smartofficeRefreshAllApprovalData();

        /* =========================
           SUCCESS
        ========================= */
        smartofficeShowToast(
            "Data berhasil diperbarui",
            "success"
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

        /* =========================
           ERROR
        ========================= */
        console.error(
            "REFRESH APPROVAL ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memuat data.",
            "error"
        );
    }
}

/* ======================================================
   REFRESH SEMUA DATA APPROVAL
====================================================== */
export async function smartofficeRefreshAllApprovalData(){
    await Promise.all([
        smartofficeLoadApprovalCuti(),
        smartofficeLoadApprovalSPD(),
        smartofficeLoadApprovalDokumen()
    ]);
}


/* ======================================================
   SUBMIT APPROVAL SPD
====================================================== */
async function smartofficeSubmitApprovalSPD(
    item,
    action,
    jenisPerjalananDinas,
    catatan,
    submitButton,
    closeModal
){
    if(
        !item ||
        !item.idSPD
    ){
        smartofficeShowToast(
            "Data SPD tidak ditemukan.",
            "error"
        );

        return;
    }

    if(!action){
        smartofficeShowToast(
            "Silakan pilih aksi approval.",
            "error"
        );

        return;
    }

    /* ==================================================
       JENIS PERJALANAN DINAS
       WAJIB UNTUK SEMUA AKSI
    ================================================== */
    if(!jenisPerjalananDinas){
        smartofficeShowToast(
            "Jenis Perjalanan Dinas wajib dipilih.",
            "error"
        );

        return;
    }

    /* ==================================================
       CATATAN REVISI
    ================================================== */
    if(
        action === "REVISI" &&
        !catatan
    ){
        smartofficeShowToast(
            "Catatan revisi wajib diisi.",
            "error"
        );

        return;
    }

    /* ==================================================
       TOLAK
       FRONTEND TETAP KIRIM BATALKAN
       BACKEND AKAN MENYIMPAN DITOLAK
    ================================================== */
    if(
        action === "BATALKAN" &&
        !catatan
    ){
        smartofficeShowToast(
            "Alasan penolakan wajib diisi.",
            "error"
        );

        return;
    }

    /* ==================================================
       SESSION
    ================================================== */
    const sessionData =
        smartofficeGetSession();

    if(!sessionData){
        smartofficeShowToast(
            "Session pengguna tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       DISABLE BUTTON
    ================================================== */
    if(submitButton){
        submitButton.disabled =
            true;
        submitButton.innerHTML =
            "Memproses...";
    }

    try{

        /* ==============================================
           PROSES APPROVAL
        ============================================== */
        const response =
            await smartofficeProcessApprovalSPD(
                item.idSPD,
                action,
                sessionData.nama ||
                sessionData.name ||
                "",
                sessionData.nip ||
                "",
                jenisPerjalananDinas,
                catatan
            );

        if(
            !response ||
            !response.success
        ){
            throw new Error(
                response?.message ||
                "Approval SPD gagal diproses."
            );
        }

        /* ==============================================
           TOAST
        ============================================== */
        smartofficeShowToast(
            response.message ||
            (
                action === "APPROVE"
                    ? "SPD berhasil disetujui."
                    :
                action === "REVISI"
                    ? "SPD dikembalikan untuk revisi."
                    :
                "SPD berhasil ditolak."
            ),
            "success"
        );

        /* ==============================================
           CLOSE MODAL
        ============================================== */
        if(
            typeof closeModal ===
            "function"
        ){
            closeModal();
        }

        /* ==============================================
           REFRESH APPROVAL SPD
        ============================================== */
        await Promise.all([
            smartofficeLoadApprovalSPD(),
            smartofficeLoadApprovalCuti(),
            smartofficeLoadApprovalDokumen()
        ]);
    }
    catch(error){
        console.error(
            "SUBMIT APPROVAL SPD ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memproses approval SPD.",
            "error"
        );
    }
    finally{
        if(submitButton){
            submitButton.disabled =
                false;
            submitButton.innerHTML =
                "Proses";
        }
    }
}


/* ======================================================
   SMART OFFICE SWITCH APPROVAL TAB
====================================================== */
function smartofficeSwitchApprovalTab(tab){

  /* CONTENT */
  const cutiContent =
    document.getElementById(
      "smartofficeApprovalCutiContent"
    );

  const spdContent =
    document.getElementById(
      "smartofficeApprovalSpdContent"
    );

  const dokumenContent =
    document.getElementById(
      "smartofficeApprovalDokumenContent"
    );

  /* BUTTON */
  const cutiButton =
    document.getElementById(
      "smartofficeTabApprovalCuti"
    );

  const spdButton =
    document.getElementById(
      "smartofficeTabApprovalSpd"
    );

  const dokumenButton =
    document.getElementById(
      "smartofficeTabApprovalDokumen"
    );

  /* VALIDASI */
  if(
    !cutiContent ||
    !spdContent ||
    !dokumenContent ||
    !cutiButton ||
    !spdButton ||
    !dokumenButton
  ){
    return;
  }

  /* RESET */
  cutiContent.style.display = "none";
  spdContent.style.display = "none";
  dokumenContent.style.display = "none";

  cutiButton.classList.remove("active");
  spdButton.classList.remove("active");
  dokumenButton.classList.remove("active");

  switch(tab){
    case "cuti":
      cutiContent.style.display = "block";
      cutiButton.classList.add("active");
      break;

    case "spd":
      spdContent.style.display = "block";
      spdButton.classList.add("active");
      break;

    case "dokumen":
      dokumenContent.style.display = "block";
      dokumenButton.classList.add("active");
      break;
  }
}



/* ======================================================
   LOAD APPROVAL DOKUMEN
====================================================== */
export async function smartofficeLoadApprovalDokumen(){

    const pageInstance =
        smartofficeApprovalPageInstance;

    /* =========================
       CONTAINER
    ========================= */
    const container =
        document.getElementById(
            "smartofficeApprovalDokumenList"
        );
    if(!container){
        console.warn(
            "Container Approval Dokumen tidak ditemukan"
        );

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
        const data =
            await smartofficeGetDokumenVerifikasiFirestore();
        if(
            pageInstance !==
            smartofficeApprovalPageInstance
        ){
            return;
        }

        /* =========================
           LOG
        ========================= */
        console.log(
            "APPROVAL DOKUMEN:",
            data
        );

        /* =========================
           UPDATE BADGE
        ========================= */
        const badge =
            document.getElementById(
                "smartofficeApprovalDokumenBadge"
            );
        if(badge){
            const total =
                Array.isArray(data)
                    ? data.length
                    : 0;

            badge.textContent =
                total;

            badge.style.display =
                total > 0
                    ? "inline-flex"
                    : "none";
        }

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

        /* =========================
           TOAST
        ========================= */
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
            <div class="smartoffice-empty-state">
                <div class="smartoffice-empty-icon">
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
              <div class="smartoffice-approval-dokumen-card">

                  <!-- ==================================================
                      HEADER
                  ================================================== -->
                  <div class="smartoffice-approval-dokumen-header">
                      <div class="smartoffice-approval-dokumen-title">
                          <!-- ICON DOKUMEN -->
                          <div class="smartoffice-approval-dokumen-icon">
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16
                                          a2 2 0 0 0 2 2h12
                                          a2 2 0 0 0 2-2V8z"/>

                                  <polyline points="14 2 14 8 20 8"/>
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
                          </div>

                          <!-- NAMA DOKUMEN + PEGAWAI -->
                          <div class="smartoffice-approval-dokumen-title-text">
                              <h4>
                                  ${item.namaDokumen || "-"}
                              </h4>

                              <div class="smartoffice-approval-dokumen-pegawai">
                                  ${item.nama || "-"}
                              </div>
                          </div>
                      </div>

                      <!-- STATUS -->
                      <div class="smartoffice-approval-dokumen-status">
                          Menunggu Verifikasi
                      </div>
                  </div>

                  <!-- ==================================================
                      BODY
                  ================================================== -->
                  <div class="smartoffice-approval-dokumen-body">
                      <!-- NOMOR DOKUMEN -->
                      <div class="smartoffice-approval-dokumen-info">
                          <div class="smartoffice-approval-dokumen-info-icon">
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16
                                          a2 2 0 0 0 2 2h12
                                          a2 2 0 0 0 2-2V8z"/>

                                  <polyline points="14 2 14 8 20 8"/>
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
                              </svg>
                          </div>

                          <span>
                              Nomor Dokumen
                          </span>

                          <strong>
                              ${item.nomorDokumen || "-"}
                          </strong>
                      </div>

                      <!-- KETERANGAN -->
                      ${
                          item.keterangan
                          ?
                          `
                          <div class="smartoffice-approval-dokumen-info">
                              <div class="smartoffice-approval-dokumen-info-icon">
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="1.8"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                  >
                                      <circle
                                          cx="12"
                                          cy="12"
                                          r="9"
                                      />
                                      <line
                                          x1="12"
                                          y1="8"
                                          x2="12"
                                          y2="12"
                                      />
                                      <line
                                          x1="12"
                                          y1="16"
                                          x2="12.01"
                                          y2="16"
                                      />
                                  </svg>
                              </div>

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

                      <!-- FILE -->
                      <div class="smartoffice-approval-dokumen-info">
                          <div class="smartoffice-approval-dokumen-info-icon">
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="1.8"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              >
                                  <path d="M21 12.5V7a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2v14
                                          a2 2 0 0 0 2 2h12.5"/>

                                  <path d="M15 15l3 3 3-3"/>

                                  <path d="M18 12v6"/>
                              </svg>
                          </div>

                          <span>
                              File
                          </span>

                          <strong>
                              ${item.fileName || "-"}
                          </strong>
                      </div>
                  </div>

                  <!-- ==================================================
                      FOOTER
                  ================================================== -->
                  <div class="smartoffice-approval-dokumen-footer">
                      <!-- LIHAT DOKUMEN -->
                      <button
                          type="button"
                          class="smartoffice-approval-dokumen-preview"
                          onclick="
                              smartofficeOpenPreviewDokumen(
                                  '${item.fileId}',
                                  '${item.fileName || ""}'
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
                              <path d="M14 2H6a2 2 0 0 0-2 2v16
                                      a2 2 0 0 0 2 2h12
                                      a2 2 0 0 0 2-2V8z"/>

                              <polyline points="14 2 14 8 20 8"/>
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
                      <div class="smartoffice-approval-dokumen-actions">
                          <!-- VERIFIKASI -->
                          <button
                              type="button"
                              class="smartoffice-approval-dokumen-verify"
                              onclick="
                                  smartofficeVerifikasiDokumen(
                                      '${item.idDokumen}'
                                  )
                              "
                          >
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="17"
                                  height="17"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              >
                                  <polyline points="20 6 9 17 4 12"/>
                              </svg>

                              <span>
                                  Verifikasi
                              </span>
                          </button>

                          <!-- TOLAK -->
                          <button
                              type="button"
                              class="smartoffice-approval-dokumen-reject"
                              onclick="
                                  smartofficeTolakDokumen(
                                      '${item.idDokumen}'
                                  )
                              "
                          >
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="17"
                                  height="17"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                              >
                                  <circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                  />

                                  <line
                                      x1="9"
                                      y1="9"
                                      x2="15"
                                      y2="15"
                                  />

                                  <line
                                      x1="15"
                                      y1="9"
                                      x2="9"
                                      y2="15"
                                  />
                              </svg>

                              <span>
                                  Tolak
                              </span>
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
            "smartofficeApprovalDokumenActionBody"
        );
    if(!body){
        return;
    }

    body.innerHTML = `
        <div class="smartoffice-approval-dokumen-modal-icon">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>

        <div class="smartoffice-approval-dokumen-modal-title">
            Verifikasi Dokumen
        </div>

        <div class="smartoffice-approval-dokumen-modal-text">
            Dokumen akan dikunci setelah diverifikasi.
            Pastikan dokumen telah diperiksa dengan benar.
        </div>

        <div class="smartoffice-approval-dokumen-modal-footer">
            <button
                id="smartofficeVerifikasiSubmitButton"
                type="button"
                class="smartoffice-approval-dokumen-modal-primary"
                onclick="
                    smartofficeSubmitVerifikasiDokumen(
                        '${idDokumen}'
                    )
                "
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>

                <span>
                    Verifikasi
                </span>
            </button>

            <button
                type="button"
                class="smartoffice-approval-dokumen-modal-secondary"
                onclick="
                    smartofficeCloseApprovalDokumenModal()
                "
            >
                Batal
            </button>
        </div>
    `;

    const modal =
        document.getElementById(
            "smartofficeApprovalDokumenActionModal"
        );
    if(!modal){
        return;
    }

    modal.style.display =
        "flex";

    if(smartofficeApprovalModalTimer){
        clearTimeout(
            smartofficeApprovalModalTimer
        );
    }

    smartofficeApprovalModalTimer =
        setTimeout(
            function(){
                if(!modal.isConnected){
                    smartofficeApprovalModalTimer =
                        null;
                    return;
                }

                modal.classList.add(
                    "show"
                );

                smartofficeApprovalModalTimer =
                    null;
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
            "smartofficeApprovalDokumenActionBody"
        );
    if(!body){
        return;
    }

    body.innerHTML = `
        <div class="smartoffice-approval-dokumen-modal-icon danger">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M18 6L6 18"/>
                <path d="M6 6L18 18"/>
            </svg>
        </div>

        <div class="smartoffice-approval-dokumen-modal-title">
            Tolak Dokumen
        </div>

        <div class="smartoffice-approval-dokumen-modal-text">
            Alasan penolakan wajib diisi.
        </div>

        <textarea
            id="smartofficeApprovalDokumenRejectReason"
            class="smartoffice-approval-dokumen-modal-textarea"
            placeholder="Tulis alasan penolakan..."
        ></textarea>

        <div class="smartoffice-approval-dokumen-modal-footer">
            <button
                id="smartofficeApprovalDokumenRejectSubmitButton"
                type="button"
                class="smartoffice-approval-dokumen-modal-danger"
                onclick="
                    smartofficeSubmitTolakDokumen(
                        '${idDokumen}'
                    )
                "
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 6L6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>

                <span>
                    Tolak Dokumen
                </span>
            </button>

            <button
                type="button"
                class="smartoffice-approval-dokumen-modal-secondary"
                onclick="
                    smartofficeCloseApprovalDokumenModal()
                "
            >
                Batal
            </button>
        </div>
    `;

    const modal =
        document.getElementById(
            "smartofficeApprovalDokumenActionModal"
        );
    if(!modal){
        return;
    }

    modal.style.display =
        "flex";

    if(smartofficeApprovalModalTimer){
        clearTimeout(
            smartofficeApprovalModalTimer
        );
    }

    smartofficeApprovalModalTimer =
        setTimeout(
            function(){
                if(!modal.isConnected){
                    smartofficeApprovalModalTimer =
                        null;
                    return;
                }

                modal.classList.add(
                    "show"
                );

                smartofficeApprovalModalTimer =
                    null;
            },
            10
        );
}


/* ======================================================
   HAPUS DOKUMEN APPROVAL DARI UI
   Setelah berhasil diverifikasi / ditolak
====================================================== */
function smartofficeRemoveApprovalDokumenFromUI(
    idDokumen
){

    const container =
        document.getElementById(
            "smartofficeApprovalDokumenList"
        );
    if(!container){
        return;
    }

    const buttons =
        container.querySelectorAll(
            "button"
        );

    let targetCard = null;

    buttons.forEach(
        function(button){
            const onclick =
                button.getAttribute(
                    "onclick"
                ) || "";
            if(
                onclick.includes(
                    String(idDokumen)
                )
            ){
                targetCard =
                    button.closest(
                        ".smartoffice-approval-dokumen-card"
                    );
            }
        }
    );

    if(targetCard){
        targetCard.remove();
    }

    /* =========================
       UPDATE BADGE
    ========================= */
    const badge =
        document.getElementById(
            "smartofficeApprovalDokumenBadge"
        );

    if(badge){

        const remaining =
            container.querySelectorAll(
                ".smartoffice-approval-dokumen-card"
            ).length;

        badge.textContent =
            remaining;

        badge.style.display =
            remaining > 0
                ? "inline-flex"
                : "none";
    }

    /* =========================
       EMPTY STATE
    ========================= */
    const remainingCards =
        container.querySelectorAll(
            ".smartoffice-approval-dokumen-card"
        ).length;

    if(remainingCards === 0){
        container.innerHTML = `
            <div class="smartoffice-empty-state">
                <div class="smartoffice-empty-icon">
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
    }
}


/* ======================================================
   TUNGGU VERIFIKASI
   GAS SUCCESS ATAU FIRESTORE VERIFIED
====================================================== */
function smartofficeWaitVerifikasiDokumen(
    idDokumen
){
    const targetId =
        String(idDokumen || "").trim();

    return new Promise(
        async (resolve, reject) => {
            if(!targetId){
                reject(
                    new Error(
                        "ID dokumen tidak ditemukan."
                    )
                );

                return;
            }

            let selesai = false;

            let unsubscribe =
                null;

            let timeoutTimer =
                null;

            /* ==================================================
               SELESAIKAN PROSES
            ================================================== */
            const finish = (
                result
            ) => {
                if(selesai){
                    return;
                }

                selesai = true;

                if(timeoutTimer){
                    clearTimeout(
                        timeoutTimer
                    );

                    timeoutTimer = null;
                }

                if(
                    typeof unsubscribe ===
                    "function"
                ){
                    unsubscribe();
                    unsubscribe = null;
                }

                resolve(result);
            };

            /* ==================================================
               WATCH FIRESTORE
               DIPASANG TERLEBIH DAHULU
            ================================================== */
            unsubscribe =
                smartofficeWatchVerifikasiDokumenFirestore(
                    targetId,
                    firestoreResult => {
                        if(selesai){
                            return;
                        }

                        if(
                            firestoreResult?.error
                        ){
                            console.warn(
                                "WATCH FIRESTORE ERROR:",
                                firestoreResult.message
                            );

                            return;
                        }

                        const status =
                            String(
                                firestoreResult?.statusVerifikasi ||
                                ""
                            ).trim();
                        if(
                            status ===
                            "TERVERIFIKASI"
                        ){
                            console.log(
                                "VERIFIKASI SELESAI DARI FIRESTORE:",
                                targetId
                            );

                            finish({
                                success: true,
                                source:
                                    "firestore"
                            });
                        }
                    }
                );

            /* ==================================================
               FALLBACK TIMEOUT
               
               BUKAN TIMEOUT GAS.
               Ini batas keseluruhan proses.
            ================================================== */
            timeoutTimer =
                setTimeout(
                    () => {
                        if(selesai){
                            return;
                        }

                        selesai = true;

                        if(
                            typeof unsubscribe ===
                            "function"
                        ){
                            unsubscribe();
                            unsubscribe = null;
                        }

                        reject(
                            new Error(
                                "Verifikasi belum terkonfirmasi. Silakan coba lagi."
                            )
                        );
                    },
                    40000
                );

            /* ==================================================
               GAS REQUEST
            ================================================== */
            smartofficeVerifikasiDokumenApi(
                targetId
            )
            .then(
                response => {
                    if(selesai){
                        return;
                    }

                    /* ==========================================
                       GAS SUCCESS
                    ========================================== */
                    if(
                        response?.success === true
                    ){
                        console.log(
                            "VERIFIKASI SELESAI DARI GAS:",
                            targetId
                        );

                        finish({
                            success: true,
                            source:
                                "gas",
                            response
                        });

                        return;
                    }

                    /* ==========================================
                       GAS FALSE / ABORT / TIMEOUT
                       
                       JANGAN LANGSUNG ERROR.
                       FIRESTORE MASIH DITUNGGU.
                    ========================================== */
                    console.warn(
                        "GAS VERIFIKASI BELUM MEMBERI SUCCESS:",
                        targetId,
                        response
                    );
                }
            )
            .catch(
                error => {
                    if(selesai){
                        return;
                    }
                    /*
                     * PENTING:
                     *
                     * Error GAS TIDAK LANGSUNG
                     * MENANG.
                     *
                     * Firestore tetap ditunggu.
                     */
                    console.warn(
                        "GAS VERIFIKASI ERROR, FIRESTORE MASIH DITUNGGU:",
                        targetId,
                        error
                    );
                }
            );
        }
    );
}


/* ======================================================
   TUNGGU PENOLAKAN DOKUMEN
   GAS SUCCESS ATAU FIRESTORE DITOLAK
====================================================== */
function smartofficeWaitTolakDokumen(
    idDokumen,
    alasan
){
    const targetId =
        String(idDokumen || "").trim();

    return new Promise(
        async (resolve, reject) => {
            if(!targetId){
                reject(
                    new Error(
                        "ID dokumen tidak ditemukan."
                    )
                );

                return;
            }

            let selesai = false;

            let unsubscribe =
                null;

            let timeoutTimer =
                null;

            const finish = (
                result
            ) => {
                if(selesai){
                    return;
                }

                selesai = true;

                if(timeoutTimer){
                    clearTimeout(
                        timeoutTimer
                    );

                    timeoutTimer = null;
                }

                if(
                    typeof unsubscribe ===
                    "function"
                ){
                    unsubscribe();
                    unsubscribe = null;
                }

                resolve(result);
            };

            /* ==========================================
               WATCH FIRESTORE
            ========================================== */
            unsubscribe =
                smartofficeWatchVerifikasiDokumenFirestore(
                    targetId,

                    firestoreResult => {
                        if(selesai){
                            return;
                        }

                        if(
                            firestoreResult?.error
                        ){
                            console.warn(
                                "WATCH FIRESTORE TOLAK ERROR:",
                                firestoreResult.message
                            );

                            return;
                        }

                        const status =
                            String(
                                firestoreResult?.statusVerifikasi ||
                                ""
                            ).trim();
                        if(
                            status ===
                            "DITOLAK"
                        ){
                            console.log(
                                "PENOLAKAN SELESAI DARI FIRESTORE:",
                                targetId
                            );

                            finish({
                                success: true,
                                source:
                                    "firestore"
                            });
                        }
                    }
                );

            /* ==========================================
               TIMEOUT
            ========================================== */
            timeoutTimer =
                setTimeout(
                    () => {
                        if(selesai){
                            return;
                        }

                        selesai = true;

                        if(
                            typeof unsubscribe ===
                            "function"
                        ){
                            unsubscribe();
                            unsubscribe = null;
                        }

                        reject(
                            new Error(
                                "Penolakan belum terkonfirmasi. Silakan coba lagi."
                            )
                        );
                    },
                    40000
                );

            /* ==========================================
               KIRIM KE GAS
            ========================================== */
            smartofficeTolakDokumenApi(
                targetId,
                alasan
            )
            .then(
                response => {
                    if(selesai){
                        return;
                    }

                    if(
                        response?.success === true
                    ){
                        console.log(
                            "PENOLAKAN SELESAI DARI GAS:",
                            targetId
                        );

                        finish({
                            success: true,
                            source:
                                "gas",
                            response
                        });

                        return;
                    }

                    console.warn(
                        "GAS TOLAK BELUM MEMBERI SUCCESS:",
                        targetId,
                        response
                    );
                }
            )
            .catch(
                error => {
                    if(selesai){
                        return;
                    }

                    console.warn(
                        "GAS TOLAK ERROR, FIRESTORE MASIH DITUNGGU:",
                        targetId,
                        error
                    );
                }
            );
        }
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
                class="smartoffice-approval-dokumen-btn-spinner"
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

    /* =========================
       TOAST RESULT
    ========================= */
    let toastMessage = "";
    let toastType = "";

    try{
        console.log(
            "MULAI VERIFIKASI:",
            idDokumen
        );

        /* ==================================================
           TUNGGU SALAH SATU:
           
           1. GAS success:true
           2. Firestore statusVerifikasi = TERVERIFIKASI
        ================================================== */
        const result =
            await smartofficeWaitVerifikasiDokumen(
                idDokumen
            );

        console.log(
            "VERIFIKASI BERHASIL:",
            idDokumen,
            result
        );

        /* =========================
           CLOSE MODAL
        ========================= */
        smartofficeCloseApprovalDokumenModal();

        /* =========================
           HAPUS DARI UI
        ========================= */
        smartofficeRemoveApprovalDokumenFromUI(
            idDokumen
        );

        /* =========================
           SUCCESS TOAST
        ========================= */
        toastMessage =
            "Dokumen berhasil diverifikasi";

        toastType =
            "success";
    }
    catch(error){
        console.error(
            "SUBMIT VERIFIKASI DOKUMEN ERROR:",
            error
        );

        /* =========================
           ERROR TOAST
        ========================= */
        toastMessage =
            error?.message ||
            "Gagal memverifikasi dokumen.";

        toastType =
            "error";
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

            button.innerHTML = `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="20 6 9 17 4 12"/>
                </svg>

                <span>
                    Verifikasi
                </span>
            `;
        }
    }

    /* =========================
       TOAST
    ========================= */
    if(toastMessage){
        smartofficeShowToast(
            toastMessage,
            toastType
        );
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
            "smartofficeApprovalDokumenRejectReason"
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
            "smartofficeApprovalDokumenRejectSubmitButton"
        );
    if(button){
        button.disabled =
            true;

        button.innerHTML = `
            <span
                class="smartoffice-approval-dokumen-btn-spinner"
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

    /* =========================
       TOAST RESULT
    ========================= */
    let toastMessage = "";
    let toastType = "";

    try{
        console.log(
            "MULAI TOLAK DOKUMEN:",
            idDokumen
        );

        const result =
            await smartofficeWaitTolakDokumen(
                idDokumen,
                alasan
            );

        console.log(
            "PENOLAKAN BERHASIL:",
            idDokumen,
            result
        );

        /* =========================
           CLOSE MODAL
        ========================= */
        smartofficeCloseApprovalDokumenModal();

        /* =========================
           HAPUS DARI UI
        ========================= */
        smartofficeRemoveApprovalDokumenFromUI(
            idDokumen
        );

        /* =========================
           SUCCESS TOAST
        ========================= */
        toastMessage =
            "Dokumen ditolak";

        toastType =
            "success";
    }
    catch(error){
        console.error(
            "SUBMIT TOLAK DOKUMEN ERROR:",
            error
        );

        toastMessage =
            error?.message ||
            "Gagal menolak dokumen.";

        toastType =
            "error";
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

            button.innerHTML = `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 6L6 18"/>
                    <path d="M6 6L18 18"/>
                </svg>

                <span>
                    Tolak Dokumen
                </span>
            `;
        }
    }

    /* =========================
       TOAST
    ========================= */
    if(
        toastMessage
    ){
        smartofficeShowToast(
            toastMessage,
            toastType
        );
    }
}


/* ======================================================
   CLOSE MODAL APPROVAL DOKUMEN
====================================================== */
export function smartofficeCloseApprovalDokumenModal(){

    const modal =
        document.getElementById(
            'smartofficeApprovalDokumenActionModal'
        );
    if(!modal){
        return;
    }

    modal.classList.remove(
        'show'
    );

    if(smartofficeApprovalModalTimer){
        clearTimeout(
            smartofficeApprovalModalTimer
        );
    }

    smartofficeApprovalModalTimer =
        setTimeout(function(){
            if(
                !modal ||
                !modal.isConnected
            ){
                smartofficeApprovalModalTimer =
                    null;
                return;
            }

            if(
                !modal.classList.contains('show')
            ){
                modal.style.display = 'none';
            }

            smartofficeApprovalModalTimer =
                null;
        },250);
}


/* ======================================================
   GLOBAL APPROVAL DOKUMEN FUNCTIONS
   Untuk inline onclick pada HTML
====================================================== */
window.smartofficeVerifikasiDokumen =
    smartofficeVerifikasiDokumen;

window.smartofficeTolakDokumen =
    smartofficeTolakDokumen;

window.smartofficeOpenVerifikasiDokumenModal =
    smartofficeOpenVerifikasiDokumenModal;

window.smartofficeOpenTolakDokumenModal =
    smartofficeOpenTolakDokumenModal;

window.smartofficeSubmitVerifikasiDokumen =
    smartofficeSubmitVerifikasiDokumen;

window.smartofficeSubmitTolakDokumen =
    smartofficeSubmitTolakDokumen;

window.smartofficeCloseApprovalDokumenModal =
    smartofficeCloseApprovalDokumenModal;




