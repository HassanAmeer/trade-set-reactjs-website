import { db } from './firebase-setup';
import { doc, getDoc } from 'firebase/firestore';

const checkSettings = async () => {
    const docSnap = await getDoc(doc(db, 'admin_set', 'platform'));
    if (docSnap.exists()) {
        console.log("PLATFORM SETTINGS:", docSnap.data());
    } else {
        console.log("PLATFORM SETTINGS NOT FOUND");
    }
};

checkSettings();
