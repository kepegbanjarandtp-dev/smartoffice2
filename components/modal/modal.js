/* ======================================================
   SMARTOFFICE MODAL
====================================================== */
let smartofficeActiveModal =
    null;
    

/* ======================================================
   OPEN MODAL
====================================================== */
export function smartofficeOpenModal(
    modalId
){
    const modal =
        document.getElementById(
            modalId
        );
    if(
        !modal
    ){
        return;
    }

    modal.classList.add(
        "show"
    );

    document.body.classList.add(
        "smartoffice-modal-open"
    );

    smartofficeActiveModal =
        modal;
}


/* ======================================================
   CLOSE MODAL
====================================================== */
export function smartofficeCloseModal(
    modalId
){
    const modal =
        document.getElementById(
            modalId
        );
    if(
        !modal
    ){
        return;
    }

    modal.classList.remove(
        "show"
    );

    if(
        smartofficeActiveModal ===
        modal
    ){
        smartofficeActiveModal =
            null;
    }

    document.body.classList.remove(
        "smartoffice-modal-open"
    );
}


/* ======================================================
   CLOSE ACTIVE MODAL
====================================================== */
export function smartofficeCloseActiveModal(){
    if(
        !smartofficeActiveModal
    ){
        return;
    }

    smartofficeActiveModal
        .classList.remove(
            "show"
        );

    smartofficeActiveModal =
        null;

    document.body.classList.remove(
        "smartoffice-modal-open"
    );
}


/* ======================================================
   INITIALIZE MODAL
====================================================== */
export function smartofficeInitializeModal(){

    document.addEventListener(
        "click",
        event => {
            const closeButton =
                event.target.closest(
                    "[data-smartoffice-modal-close]"
                );
            if(
                closeButton
            ){
                const modal =
                    closeButton.closest(
                        ".smartoffice-modal"
                    );
                if(
                    modal
                ){
                    smartofficeCloseModal(
                        modal.id
                    );
                }
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key ===
                "Escape"
            ){
                smartofficeCloseActiveModal();
            }
        }
    );
}