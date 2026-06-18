/**
 * seed-trade-control.mjs
 *
 * Migrates Firestore:
 *   OLD: admin_set/market_signal  { isActive, direction, symbol, globalWinLossRate, affectedUsersMap, updatedAt }
 *   NEW: admin_set/trade_control  { currencyName, winLossUsers }
 *
 * Run once:
 *   node seed-trade-control.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBuJBw-6i92lkgXrST0s0Lf0XfTLn7g4WU',
    authDomain: 'trade-set.firebaseapp.com',
    projectId: 'trade-set',
    storageBucket: 'trade-set.firebasestorage.app',
    messagingSenderId: '496946165435',
    appId: '1:496946165435:web:d92c9c1711fa7a0c229b9e'
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);

async function migrate() {
    console.log('Reading old doc: admin_set/market_signal ...');
    const oldRef  = doc(db, 'admin_set', 'market_signal');
    const oldSnap = await getDoc(oldRef);

    // Build winLossUsers from old affectedUsersMap (keep only name, email, winLossPercentage)
    let winLossUsers = {};

    if (oldSnap.exists()) {
        const old = oldSnap.data();
        console.log('Old data:', JSON.stringify(old, null, 2));

        const oldMap = old.affectedUsersMap || {};
        Object.entries(oldMap).forEach(([uid, u]) => {
            // Resolve winLossPercentage from any legacy field name
            const pct = u.winLossPercentage ?? u.winLossRate ?? u.winPercent ?? 0;
            winLossUsers[uid] = {
                name:              u.name  || 'Anonymous',
                email:             u.email || '',
                winLossPercentage: Number(pct)
            };
        });

        console.log('\nMigrated winLossUsers:', JSON.stringify(winLossUsers, null, 2));
    } else {
        console.log('No old document found — creating fresh trade_control doc.');
    }

    // Read currencyName from old symbol field
    const currencyName = oldSnap.exists()
        ? (oldSnap.data().symbol || 'BTC/USDT')
        : 'BTC/USDT';

    // Write new clean document
    const newRef  = doc(db, 'admin_set', 'trade_control');
    const newData = { currencyName, winLossUsers };

    console.log('\nWriting new doc: admin_set/trade_control ...');
    console.log(JSON.stringify(newData, null, 2));

    await setDoc(newRef, newData);
    console.log('✅  admin_set/trade_control written successfully.');

    // Delete old document
    if (oldSnap.exists()) {
        console.log('\nDeleting old doc: admin_set/market_signal ...');
        await deleteDoc(oldRef);
        console.log('✅  admin_set/market_signal deleted.');
    }

    console.log('\n✅  Migration complete!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
