/* ======================================================
   IMPORT CSS
====================================================== */
import "./preview.css";

/* ======================================================
   IMPORT UTILS
====================================================== */
import {
  smartofficeGetDriveFileId
} from "../../utils/drive.js";


/* ======================================================
   OPEN PREVIEW DOKUMEN
====================================================== */
export function smartofficeOpenPreviewDokumen(
  fileId,
  fileName
){

  const modal =
    document.getElementById(
      'smartofficePreviewModal'
    );

  const content =
    document.getElementById(
      'smartofficePreviewContent'
    );

  smartofficePreviewZoom =
    100;

  document.getElementById(
    'smartofficePreviewZoomText'
  ).textContent =
    '100%';

  document.getElementById(
    'smartofficePreviewFileName'
  ).textContent =
    fileName;

  document.getElementById(
    'smartofficePreviewDownloadBtn'
  ).href =
    'https://drive.google.com/uc?export=download&id=' +
    fileId;

  document.getElementById(
    'smartofficePreviewToolbar'
  ).style.display =
    'none';

  const ext =
    fileName
      .split('.')
      .pop()
      .toLowerCase();

  /* =========================
     FILE GAMBAR
  ========================= */
  if(
    [
      'jpg',
      'jpeg',
      'png',
      'webp'
    ].includes(ext)
  ){

    const imageUrl =
      'https://drive.google.com/thumbnail?id=' +
      fileId +
      '&sz=w2000';

    document.getElementById(
      'smartofficePreviewToolbar'
    ).style.display =
      'flex';

    content.innerHTML =
    `
      <img
        id="smartofficePreviewImage"
        src="${imageUrl}"
        class="smartoffice-preview-image"
        style="width:100%;"
      >
    `;
  }

  /* =========================
     PDF
  ========================= */
  else{
    const previewUrl =
      'https://drive.google.com/file/d/' +
      fileId +
      '/preview';

    content.innerHTML =
    `
      <iframe
        src="${previewUrl}"
        class="
          smartoffice-preview-pdf
        "
      ></iframe>
    `;

  }

  modal.style.display =
    'flex';
}

/* ======================================================
   CLOSE PREVIEW
====================================================== */
export function smartofficeClosePreviewDokumen(){
  document.getElementById(
    'smartofficePreviewModal'
  ).style.display =
    'none';
}


/* ======================================================
   ZOOM IN
====================================================== */
let smartofficePreviewZoom =
  100;

export function smartofficeZoomIn(){
  smartofficePreviewZoom += 20;

  if(
    smartofficePreviewZoom > 300
  ){
    smartofficePreviewZoom = 300;
  }

  const img =
    document.getElementById(
      'smartofficePreviewImage'
    );

  if(img){
    img.style.width =
      smartofficePreviewZoom +
      '%';
  }

  document.getElementById(
    'smartofficePreviewZoomText'
  ).textContent =
    smartofficePreviewZoom +
    '%';
}

/* ======================================================
   ZOOM OUT
====================================================== */
export function smartofficeZoomOut(){
  smartofficePreviewZoom -= 20;

  if(
    smartofficePreviewZoom < 20
  ){
    smartofficePreviewZoom = 20;
  }

  const img =
    document.getElementById(
      'smartofficePreviewImage'
    );

  if(img){
    img.style.width =
      smartofficePreviewZoom +
      '%';
  }

  document.getElementById(
    'smartofficePreviewZoomText'
  ).textContent =
    smartofficePreviewZoom +
    '%';
}


/* ======================================================
   GLOBAL WINDOW
====================================================== */

window.smartofficeOpenPreviewDokumen =
  smartofficeOpenPreviewDokumen;

window.smartofficeClosePreviewDokumen =
  smartofficeClosePreviewDokumen;

window.smartofficeZoomIn =
  smartofficeZoomIn;

window.smartofficeZoomOut =
  smartofficeZoomOut;