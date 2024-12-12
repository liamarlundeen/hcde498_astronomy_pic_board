// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Firebase configuration is missing or incomplete');
}
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get and export the DB
export const db = getFirestore(app);

