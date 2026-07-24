import "./toast.css";

/* ======================================================
   SMARTOFFICE TOAST
====================================================== */
let smartofficeToastContainer =
    null;

/* ======================================================
   SHOW TOAST
====================================================== */
export function smartofficeShowToast(
    message,
    type = "info",
    duration = 3000
){
    smartofficeInitializeToast();

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `smartoffice-toast smartoffice-toast-${type}`;
    toast.textContent =
        message;

    smartofficeToastContainer
        .appendChild(
            toast
        );

    requestAnimationFrame(
        () => {
            toast.classList.add(
                "show"
            );
        }
    );

    setTimeout(
        () => {
            toast.classList.remove(
                "show"
            );

            setTimeout(
                () => {
                    toast.remove();
                },
                300
            );
        },
        duration
    );
}


/* ======================================================
   INITIALIZE TOAST
====================================================== */
function smartofficeInitializeToast(){
    if(
        smartofficeToastContainer
    ){
        return;
    }

    smartofficeToastContainer =
        document.createElement(
            "div"
        );

    smartofficeToastContainer.id =
        "smartofficeToastContainer";
    document.body.appendChild(
        smartofficeToastContainer
    );
}