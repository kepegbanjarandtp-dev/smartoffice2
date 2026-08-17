import "./loading.css";

/* ======================================================
   SHOW LOADING
   Loading di dalam container / card
====================================================== */
export function smartofficeShowLoading(
    containerId,
    text = "Memuat data..."
){
    const container =
        document.getElementById(
            containerId
        );

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


/* ======================================================
   GLOBAL LOADING OVERLAY
====================================================== */
let smartofficeGlobalLoadingCount = 0;


/* ======================================================
   SHOW GLOBAL LOADING
====================================================== */
export function smartofficeShowGlobalLoading(
    text = "Memuat data..."
){
    smartofficeGlobalLoadingCount++;

    document.body.classList.add(
        "smartoffice-global-loading-active"
    );

    let overlay =
        document.getElementById(
            "smartofficeGlobalLoading"
        );

    /* =========================
       CREATE OVERLAY
    ========================= */
    if(!overlay){

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "smartofficeGlobalLoading";

        overlay.className =
            "smartoffice-global-loading";

        overlay.innerHTML = `
            <div class="
                smartoffice-global-loading-content
            ">
                <div class="
                    smartoffice-global-loading-spinner
                "></div>

                <div class="
                    smartoffice-global-loading-text
                ">
                    ${text}
                </div>
            </div>
        `;

        document.body.appendChild(
            overlay
        );
    }
    else{
        const textElement =
            overlay.querySelector(
                ".smartoffice-global-loading-text"
            );

        if(textElement){
            textElement.textContent =
                text;
        }
    }

    /* =========================
       SHOW
    ========================= */
    requestAnimationFrame(
        function(){
            overlay.classList.add(
                "is-visible"
            );
        }
    );
}


/* ======================================================
   HIDE GLOBAL LOADING
====================================================== */
export function smartofficeHideGlobalLoading(){
    if(
        smartofficeGlobalLoadingCount <= 0
    ){
        smartofficeGlobalLoadingCount = 0;
        return;
    }

    smartofficeGlobalLoadingCount--;

    /* =========================
       MASIH ADA PROSES
    ========================= */
    if(
        smartofficeGlobalLoadingCount > 0
    ){
        return;
    }

    document.body.classList.remove(
        "smartoffice-global-loading-active"
    );

    const overlay =
        document.getElementById(
            "smartofficeGlobalLoading"
        );

    if(!overlay){
        return;
    }

    overlay.classList.remove(
        "is-visible"
    );

    /* =========================
       REMOVE SETELAH ANIMASI
    ========================= */
    setTimeout(
        function(){
            if(
                overlay &&
                !overlay.classList.contains(
                    "is-visible"
                )
            ){
                overlay.remove();
            }
        },
        200
    );
}


/* ======================================================
   FORCE HIDE
   Untuk logout / destroy aplikasi
====================================================== */
export function smartofficeForceHideGlobalLoading(){
    smartofficeGlobalLoadingCount =
        0;

    document.body.classList.remove(
        "smartoffice-global-loading-active"
    );
    
    const overlay =
        document.getElementById(
            "smartofficeGlobalLoading"
        );

    if(overlay){
        overlay.remove();
    }
}