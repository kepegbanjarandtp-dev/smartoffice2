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
    smartofficeShowLoading
} from "../../components/loading/loading.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeGetApprovalCuti,
    smartofficeProcessApprovalCuti,
    smartofficeGetDokumenVerifikasi,
    smartofficeVerifikasiDokumenApi,
    smartofficeTolakDokumenApi
} from "../../services/approval.service.js";

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
const smartofficeApprovalState = {
  idCuti : ''
};

let smartofficeApprovalAction =
  'APPROVE';

let smartofficeSubmittingApproval =
  false;

/* ======================================================
   LIFECYCLE STATE
====================================================== */
let smartofficeApprovalDestroyed =
  false;

const smartofficeApprovalHandlers =
  new Map();


/* ================================================================================
   LOAD PAGE
================================================================================ */

/* ======================================================
   SMART OFFICE LOAD APPROVAL PAGE
====================================================== */
export async function smartofficeLoadPage(){

    /* =========================
       RESET LIFECYCLE
    ========================= */
    smartofficeApprovalDestroyed =
        false;
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

        setTimeout(function(){
            modal.style.display =
                "none";
            modal.style.opacity =
                "";
        },50);
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
        smartofficeLoadApprovalDokumen()
    ]);
}



/* ======================================================
   SMART OFFICE LOAD APPROVAL CUTI
====================================================== */
export async function smartofficeLoadApprovalCuti(){

  console.log(
    'LOAD APPROVAL CUTI JALAN'
  );

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
        await smartofficeGetApprovalCuti(
            sessionData.nip
        );

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
            <div class="
              smartoffice-approval-card
            ">
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

  setTimeout(function(){

    modal.classList.add(
      'show'
    );

  },10);

  /* =========================
    RESET ACTION
  ========================= */
  smartofficeApprovalAction =
    'APPROVE';

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
function smartofficeCloseApprovalDetail(){

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
    "APPROVE";

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
  setTimeout(()=>{
    modal.style.display =
      "none";
  },250);
}

/* ======================================================
   DESTROY APPROVAL PAGE
====================================================== */
export async function smartofficeDestroyPage(){

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
            "smartofficeArsipActionModal"
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
        "APPROVE";

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

  /* LOCK */
  smartofficeSubmittingApproval =
    true;

  /* DISABLE */
  submitButton.disabled =
    true;

  /* BUTTON TEXT */
  submitButton.innerHTML = `
    <div class="
      smartoffice-cuti-form-button-loading
    ">
      <div class="
        smartoffice-cuti-form-button-spinner
      "></div>

      <span>
        ${
          action === "REJECT"
            ? "Menolak..."
            : "Menyetujui..."
        }
      </span>
    </div>
  `;

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
       CLOSE MODAL
    ========================= */
    smartofficeCloseApprovalDetail();

    /* =========================
      REFRESH SEMUA DATA APPROVAL
      CUTI + DOKUMEN
    ========================= */
    await smartofficeRefreshAllApprovalData();

  }catch(error){
    smartofficeShowToast(
      error.message ||
      "Terjadi kesalahan.",
      "error"
    );

  }finally{

    /* =========================
       RESET BUTTON
    ========================= */
    smartofficeSubmittingApproval =
      false;

    if(
      submitButton
    ){
      submitButton.disabled =
        false;

      submitButton.innerHTML =
        "Submit";
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
        smartofficeLoadApprovalDokumen()
    ]);
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
            await smartofficeGetDokumenVerifikasi();

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
           CUTI + DOKUMEN
        ========================= */
        await smartofficeRefreshAllApprovalData();


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
           LOAD ULANG 
           LIST APPROVAL + CUTI
        ========================= */
        await smartofficeRefreshAllApprovalData();
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
export function smartofficeCloseArsipModal(){

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

window.smartofficeCloseArsipModal =
    smartofficeCloseArsipModal;




