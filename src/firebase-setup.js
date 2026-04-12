import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBuJBw-6i92lkgXrST0s0Lf0XfTLn7g4WU",
    authDomain: "trade-set.firebaseapp.com",
    projectId: "trade-set",
    storageBucket: "trade-set.firebasestorage.app",
    messagingSenderId: "496946165435",
    appId: "1:496946165435:web:d92c9c1711fa7a0c229b9e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;