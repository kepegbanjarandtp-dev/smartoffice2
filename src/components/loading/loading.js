import "./loading.css";

/* ======================================================
   SHOW LOADING
====================================================== */
export function smartofficeShowLoading(
    containerId,
    text = "Memuat data..."
){

    const container =
        document.getElementById(containerId);

    if(!container) return;

    container.innerHTML = `
        <div class="smartoffice-loading">

            <div class="smartoffice-loading-spinner"></div>

            <div class="smartoffice-loading-text">
                ${text}
            </div>

        </div>
    `;
}
