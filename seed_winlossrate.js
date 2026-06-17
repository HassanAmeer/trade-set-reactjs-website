import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './src/firebase-setup.js'; // Adjust if needed

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    console.log("Starting migration: winPercent -> winLossRate");
    const sigRef = doc(db, 'admin_set', 'market_signal');
    const snap = await getDoc(sigRef);
    if (!snap.exists()) {
        console.log("No market_signal doc found.");
        return;
    }
    const data = snap.data();
    
    let needsUpdate = false;
    const updates = {};
    
    if (data.globalWinPercent !== undefined) {
        updates.globalWinLossRate = data.globalWinPercent;
        updates.globalWinPercent = null; // We can set to null or delete it in logic
        needsUpdate = true;
    }
    
    if (data.affectedUsersMap) {
        const newMap = { ...data.affectedUsersMap };
        let mapChanged = false;
        Object.keys(newMap).forEach(uid => {
            if (newMap[uid].winPercent !== undefined) {
                newMap[uid].winLossRate = newMap[uid].winPercent;
                delete newMap[uid].winPercent;
                mapChanged = true;
            }
        });
        if (mapChanged) {
            updates.affectedUsersMap = newMap;
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        console.log("Updating document with:", updates);
        // We will do a full object update to effectively remove old keys in affectedUsersMap
        await updateDoc(sigRef, updates);
        console.log("Migration completed successfully!");
    } else {
        console.log("No migration needed.");
    }
    process.exit(0);
}

seed().catch(console.error);
