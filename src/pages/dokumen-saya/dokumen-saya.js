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
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";


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
       RESET STATE
    ========================= */
    smartofficeDokumenLoaded =
        false;

    smartofficeDokumenSayaData =
        [];

    smartofficeEditDokumenId =
        null;
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


/* =========================
   RENDER DOKUMEN SAYA
========================= */
/* =========================
   RENDER DOKUMEN SAYA

   FLOW:
   1. Validasi data
   2. Loop dokumen
   3. Render card
   4. Tampilkan ke halaman
========================= */
function smartofficeRenderDokumenSaya(
  data
){

    /* =========================
     CONTAINER
  ========================= */
  const container =
    document.getElementById(
      'smartofficeDokumenSayaList'
    );

  /* =========================
     EMPTY STATE
  ========================= */
  if(
    !data ||
    !data.length
  ){
    container.innerHTML =
      `
      <div
        class="
          smartoffice-empty-state
        "
      >
        Belum ada dokumen
      </div>
      `;

    return;
  }

  /* =========================
     HTML
  ========================= */
  let html = '';

  /* =========================
     LOOP DATA
  ========================= */
  data.forEach(
    function(item){
      let cardClass =
        'empty';

      if(
        item.statusVerifikasi
        ===
        'MENUNGGU_VERIFIKASI'
      ){
        cardClass =
          'waiting';
      }
      else if(
        item.statusVerifikasi
        ===
        'TERVERIFIKASI'
      ){
        cardClass =
          'approved';
      }
      else if(
        item.statusVerifikasi
        ===
        'DITOLAK'
      ){
        cardClass =
          'rejected';
      }

      const bolehUbah =
        item.statusVerifikasi ===
        'DITOLAK'
        ||
        (
          item.isLock ===
          'TIDAK'
          &&
          item.alasanBukaLock
        );

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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
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
                '✅ Sudah Upload'
                :
                '❌ Belum Upload'
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
            item.statusVerifikasi ===
            'DITOLAK'
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
                Catatan Verifikator
              </span>

              <strong>
                ${item.catatanVerifikator}
              </strong>
            </div>
            `
            :
            ''
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
            ''
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
            ''
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
            ''
          }

          ${
            item.isLock ===
            'TIDAK'
            &&
            item.alasanBukaLock
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

            <div
              class="
                smartoffice-dokumen-row
              "
            >
              <span>
                Dibuka Oleh
              </span>

              <strong>
                ${item.openLockBy || '-'}
              </strong>
            </div>

            <div
              class="
                smartoffice-dokumen-row
              "
            >
              <span>
                Tanggal
              </span>

              <strong>
                ${item.openLockAt || '-'}
              </strong>
            </div>
            `
            :
            ''
          }
        </div>

        ${
          item.fileUrl
          ?
          `
          <div
            class="
              smartoffice-dokumen-footer
              smartoffice-dokumen-saya-footer
            "
          >
            <button
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>

              <span>
                Lihat Dokumen
              </span>
            </button>

            ${
              bolehUbah
              ?
              `
              <button
                class="
                  smartoffice-dokumen-edit-btn
                "
                onclick="
                  smartofficeUbahDokumen(
                    '${item.idDokumen}'
                  )
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="
                    flex-shrink:0;
                  "
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M12 18h-1l-1-1 6-6 2 2-6 6z"/>
                </svg>

                <span>
                  Ubah Dokumen
                </span>
              </button>
              `
              :
              ''
            }
          </div>
          `
          :
          ''
        }
      </div>
      `;
    }
  );

  /* =========================
    RENDER
  ========================= */
  container.innerHTML =
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

    fileInput.addEventListener(
        "change",
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
                        "smartofficeDokumenFileName"
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
                    "smartofficeDokumenFileName"
                );
            if(
                fileName
            ){
                fileName.innerText =
                    file.name;
            }
        }
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
        fileInput.files[0];

    /* =========================
       VALIDASI
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
       NOMOR DOKUMEN WAJIB
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
       FILE WAJIB
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
       SPINNER
    ========================= */
    submitBtn.disabled =
        true;

    submitBtn.querySelector(
        ".smartoffice-btn-text"
    ).textContent =
        "Menyimpan...";

    submitBtn.querySelector(
        ".smartoffice-btn-spinner"
    ).style.display =
        "inline-block";

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
        submitBtn.disabled =
            false;

        submitBtn.querySelector(
            ".smartoffice-btn-text"
        ).textContent =
            "Simpan Dokumen";

        submitBtn.querySelector(
            ".smartoffice-btn-spinner"
        ).style.display =
            "none";

        smartofficeShowToast(
            "Session tidak ditemukan. Silakan login kembali.",
            "error"
        );

        return;
    }

    /* =========================
       FILE READER
    ========================= */
    const reader =
        new FileReader();

    reader.onload =
        async function(e){

            try{
                /* =========================
                   UPLOAD DOKUMEN
                   V2 → SERVICE
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
                        e.target.result
                });

                /* =========================
                   RESET MEMORY
                ========================= */
                smartofficeDokumenLoaded =
                    false;

                /* =========================
                   RESET BUTTON
                ========================= */
                submitBtn.disabled =
                    false;

                submitBtn.querySelector(
                    ".smartoffice-btn-text"
                ).textContent =
                    "Simpan Dokumen";

                submitBtn.querySelector(
                    ".smartoffice-btn-spinner"
                ).style.display =
                    "none";

                /* =========================
                   SUCCESS
                ========================= */
                smartofficeShowToast(
                    "Dokumen berhasil diupload",
                    "success"
                );

                /* =========================
                   RESET FORM
                ========================= */
                smartofficeResetDokumenForm();

                /* =========================
                   LOAD ULANG DOKUMEN
                ========================= */
                await smartofficeLoadDokumenSaya();
            }
            catch(error){
                /* =========================
                   RESET BUTTON
                ========================= */
                submitBtn.disabled =
                    false;

                submitBtn.querySelector(
                    ".smartoffice-btn-text"
                ).textContent =
                    "Simpan Dokumen";

                submitBtn.querySelector(
                    ".smartoffice-btn-spinner"
                ).style.display =
                    "none";

                /* =========================
                   ERROR
                ========================= */
                smartofficeShowToast(
                    error.message ||
                    "Gagal upload dokumen",
                    "error"
                );

                console.error(
                    error
                );
            }
        };

    /* =========================
       START READER
    ========================= */
    reader.readAsDataURL(
        file
    );
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

    document.getElementById(
        "smartofficeDokumenFileName"
    ).innerText =
        "Belum ada file dipilih";
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
            class="smartoffice-edit-dokumen-card"
        >
            <h3
                class="
                    smartoffice-edit-dokumen-title
                "
            >
                ✏️ Ubah Dokumen
            </h3>

            <!-- ID DOKUMEN -->
            <div
                class="smartoffice-cuti-form-group"
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
                class="smartoffice-cuti-form-group"
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
                class="smartoffice-cuti-form-group"
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
                class="smartoffice-cuti-form-group"
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
                class="smartoffice-cuti-form-group"
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
                class="smartoffice-cuti-form-group"
            >
                <label>
                    File Baru
                </label>

                <div
                    class="smartoffice-edit-upload-box"
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
                            smartoffice-edit-upload-btn
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
                            smartoffice-edit-upload-name
                        "
                    >
                        Belum ada file dipilih
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div
                class="smartoffice-modal-footer"
            >
                <!-- UPDATE -->
                <button
                    id="smartofficeEditDokumenSubmitButton"
                    class="
                        smartoffice-approval-submit-button
                    "
                    onclick="
                        smartofficeSubmitEditDokumen()
                    "
                >
                    <span
                        class="
                            smartoffice-btn-spinner
                        "
                        style="
                            display:none;
                        "
                    ></span>

                    <span
                        class="
                            smartoffice-btn-text
                        "
                    >
                        Update Dokumen
                    </span>
                </button>

                <!-- BATAL -->
                <button
                    class="
                        smartoffice-approval-cancel-button
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
       SPINNER
    ========================= */
    submitBtn.disabled =
        true;

    submitBtn.querySelector(
        ".smartoffice-btn-text"
    ).textContent =
        "Memperbarui...";

    submitBtn.querySelector(
        ".smartoffice-btn-spinner"
    ).style.display =
        "inline-block";

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
        submitBtn.disabled =
            false;

        submitBtn.querySelector(
            ".smartoffice-btn-text"
        ).textContent =
            "Update Dokumen";

        submitBtn.querySelector(
            ".smartoffice-btn-spinner"
        ).style.display =
            "none";

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
        submitBtn.disabled =
            false;

        submitBtn.querySelector(
            ".smartoffice-btn-text"
        ).textContent =
            "Update Dokumen";

        submitBtn.querySelector(
            ".smartoffice-btn-spinner"
        ).style.display =
            "none";

        smartofficeShowToast(
            "Session tidak ditemukan. Silakan login kembali.",
            "error"
        );

        return;
    }

    /* =========================
       FILE READER
    ========================= */
    const reader =
        new FileReader();

    reader.onload =
        async function(e){

            try{
                /* =========================
                   UPDATE DOKUMEN
                   TETAP PAKAI FUNCTION LAMA
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
                   RESET BUTTON
                ========================= */
                submitBtn.disabled =
                    false;

                submitBtn.querySelector(
                    ".smartoffice-btn-text"
                ).textContent =
                    "Update Dokumen";

                submitBtn.querySelector(
                    ".smartoffice-btn-spinner"
                ).style.display =
                    "none";

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
                /* =========================
                   RESET BUTTON
                ========================= */
                submitBtn.disabled =
                    false;

                submitBtn.querySelector(
                    ".smartoffice-btn-text"
                ).textContent =
                    "Update Dokumen";

                submitBtn.querySelector(
                    ".smartoffice-btn-spinner"
                ).style.display =
                    "none";

                /* =========================
                   ERROR
                ========================= */
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