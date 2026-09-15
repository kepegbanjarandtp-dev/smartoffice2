/* ======================================================
   SMART OFFICE V3 - FIREBASE FIRESTORE
====================================================== */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {

    apiKey: "AIzaSyDICkmgp5KULjpDv4PEFUx87O0KV9Q6AmU",

    authDomain: "smartoffice-v3.firebaseapp.com",

    projectId: "smartoffice-v3",

    storageBucket: "smartoffice-v3.firebasestorage.app",

    messagingSenderId: "584274876112",

    appId: "1:584274876112:web:c7d2e00c7293faccac70d5"

};


export const smartofficeFirebaseApp = initializeApp(
    firebaseConfig,
    "smartoffice-v3"
);

export const smartofficeFirestore = getFirestore(
    smartofficeFirebaseApp
);