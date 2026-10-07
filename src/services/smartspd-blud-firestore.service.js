/* ======================================================
   SMART OFFICE V3
   FIRESTORE SMARTSPD BLUD SERVICE
   READ ONLY
====================================================== */
import {
    collection,
    getDocs
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET ALL SPD BLUD
====================================================== */
export async function smartofficeGetAllSPDFromFirestore(){

    const snapshot =
        await getDocs(
            collection(
                smartofficeFirestore,
                "smartspdBLUD"
            )
        );

    return snapshot.docs.map(function(docSnap){

        return {
            id: docSnap.id,
            ...docSnap.data()
        };

    });
}