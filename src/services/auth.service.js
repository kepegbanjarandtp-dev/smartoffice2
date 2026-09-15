/* ======================================================
   SMARTOFFICE AUTH SERVICE
====================================================== */
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";

import {
    smartofficeFirebaseApp
} from "../core/firebase-firestore.js";


const smartofficeAuth = getAuth(smartofficeFirebaseApp);


/* ======================================================
   LOGIN FIREBASE
====================================================== */

export async function smartofficeLogin(nip, password) {

    const email = `${String(nip).trim()}@auth.smartoffice.internal`;
    console.log("Firebase Auth Email:", email);

    try {

        const credential = await signInWithEmailAndPassword(
            smartofficeAuth,
            email,
            password
        );

        return {
            success: true,
            user: credential.user
        };

    } catch (error) {

        console.error("Firebase Login Error:", error);

        return {
            success: false,
            message: "NIP atau password salah."
        };

    }
}


/* ======================================================
   LOGOUT FIREBASE
====================================================== */

export async function smartofficeLogoutFirebase() {

    try {

        await signOut(smartofficeAuth);

        return {
            success: true
        };

    } catch (error) {

        console.error("Firebase Logout Error:", error);

        return {
            success: false,
            message: error.message
        };

    }
}