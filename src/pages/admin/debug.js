import { db } from '../../firebase-setup';
import { collectionGroup, getDocs, query, limit } from 'firebase/firestore';

export const debugTrades = async () => {
    console.log("Checking for ANY trades in collectionGroup...");
    try {
        const q = query(collectionGroup(db, 'trades'), limit(10));
        const snap = await getDocs(q);
        console.log("Found trades count:", snap.size);
        snap.forEach(doc => {
            console.log("Trade found:", doc.id, doc.data());
        });
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
};
