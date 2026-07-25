/* ======================================================
   OPEN RIWAYAT DETAIL
====================================================== */
function smartofficeOpenRiwayatCutiDetail(
  item
){

  /* MODAL */
  const modal =
    document.getElementById(
      'smartofficeRiwayatCutiDetailModal'
    );

  /* BODY */
  const body =
    document.getElementById(
      'smartofficeRiwayatCutiDetailBody'
    );

  /* SHOW */
  modal.style.display =
    'flex';

  setTimeout(function(){

    modal.classList.add(
      'show'
    );

  },10);

  /* STATUS */
  let statusText =
    'Menunggu';

  let statusClass =
    'waiting';

  if(
    item.status ===
    'DISETUJUI'
  ){

    statusText =
      'Disetujui';

    statusClass =
      'approved';
  }

  if(
    item.status ===
    'DITOLAK'
  ){

    statusText =
      'Ditolak';

    statusClass =
      'rejected';
  }

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

  /* RENDER */
  body.scrollTop = 0;
  body.innerHTML = `

    <!-- PROFILE -->
    <div class="
      smartoffice-approval-profile
    ">
      
      <div class="
        smartoffice-approval-profile-info
        smartoffice-riwayat-detail-header-info
      ">
        <h4>
          ${item.jenisCuti || '-'}
        </h4>

        <span class="
          smartoffice-riwayat-status
          ${statusClass}
        ">
          ${statusText}
        </span>
      </div>

    </div>

    <!-- DETAIL -->
    <div class="
      smartoffice-approval-detail-grid
    ">

      <div class="
        smartoffice-approval-detail-item
      ">

        <label>
          Tanggal Permohonan
        </label>

        <span>
          ${formatTanggalIndonesia(
            item.tanggalSurat
          )}
        </span>

      </div>

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

      <div class="
        smartoffice-approval-detail-item
      ">
        <label>
          Jumlah Hari
        </label>

        <span>
          ${item.jumlahCuti || 0} Hari
        </span>
      </div>
      
      <div class="
        smartoffice-approval-detail-item
      ">
        <label>
          Sisa Cuti
        </label>

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

      <label>
        Keperluan
      </label>

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

    <!-- LAMPIRAN -->
    <div class="
      smartoffice-approval-lampiran
      smartoffice-riwayat-lampiran
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
                class="
                  smartoffice-dokumen-link
                "
                onclick="
                  smartofficeOpenPreviewDokumen(
                    '${smartofficeGetDriveFileId(item.lampiran)}',
                    'Lampiran Cuti'
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

    <!-- DELEGASI GRID -->
    <div class="
      smartoffice-approval-detail-grid
    ">

      <!-- PENERIMA -->
      <div class="
        smartoffice-approval-detail-item
      ">
        <label>
          Penerima Delegasi
        </label>

        <span>
          ${item.delegasi || '-'}
        </span>
      </div>

      <!-- NIP -->
      <div class="
        smartoffice-approval-detail-item
      ">
        <label>
          NIP / NRP Delegasi
        </label>

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

    <!-- APPROVAL 1 -->
    <div class="
      smartoffice-approval-detail-item
      full-width
    ">

      <label>
        Approval 1
      </label>

      <div class="
        smartoffice-riwayat-approval-box
      ">

        <div>
          <small>Nama</small>
          <strong>
            ${item.approval1 || '-'}
          </strong>
        </div>

        <div>
          <small>Status</small>
          ${smartofficeGetApprovalBadge(
            item.approval1Status
          )}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>
            ${item.approval1Tanggal || '-'}
          </strong>
        </div>

        <div>
          <small>Catatan</small>
          <strong>
            ${item.approval1Catatan || '-'}
          </strong>
        </div>

      </div>

    </div>

    <!-- APPROVAL 2 -->
    <div class="
      smartoffice-approval-detail-item
      full-width
    ">
      <label>
        Approval 2
      </label>

      <div class="
        smartoffice-riwayat-approval-box
      ">
        <div>
          <small>Nama</small>
          <strong>
            ${item.approval2 || '-'}
          </strong>
        </div>

        <div>
          <small>Status</small>
          ${smartofficeGetApprovalBadge(
            item.approval2Status
          )}
        </div>

        <div>
          <small>Tanggal</small>
          <strong>
            ${item.approval2Tanggal || '-'}
          </strong>
        </div>

        <div>
          <small>Catatan</small>
          <strong>
            ${item.approval2Catatan || '-'}
          </strong>
        </div>
      </div>
    </div>

    <!-- PDF -->
    <div class="
      smartoffice-approval-detail-item
      full-width
    ">

      <label>
        File PDF Surat Cuti
      </label>

      <span>
        ${
          item.pdfUrl
          ?
          `
          <button
            class="
              smartoffice-dokumen-link
            "
            onclick="
              smartofficeOpenPreviewDokumen(
                '${smartofficeGetDriveFileId(item.pdfUrl)}',
                'Surat Cuti.pdf'
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>

            <span>
              Lihat PDF
            </span>

          </button>
          `
          :
          'PDF belum tersedia'
        }
      </span>
    </div>

    <!-- FOOTER -->
    <div class="
      smartoffice-approval-action-footer
    ">

      <button
        class="
          smartoffice-approval-cancel-button
        "
        onclick="
          smartofficeCloseRiwayatCutiDetail()
        "
      >
        Tutup
      </button>
    </div>
  `;
}

/* ======================================================
   CLOSE RIWAYAT DETAIL
====================================================== */
function smartofficeCloseRiwayatCutiDetail(){

  const modal =
    document.getElementById(
      'smartofficeRiwayatCutiDetailModal'
    );

  modal.classList.remove(
    'show'
  );

  setTimeout(function(){
    modal.style.display =
      'none';

  },200);
}
