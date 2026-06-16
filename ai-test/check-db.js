import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuJBw-6i92lkgXrST0s0Lf0XfTLn7g4WU",
    authDomain: "trade-set.firebaseapp.com",
    projectId: "trade-set",
    storageBucket: "trade-set.firebasestorage.app",
    messagingSenderId: "496946165435",
    appId: "1:496946165435:web:d92c9c1711fa7a0c229b9e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runDiagnostics() {
    console.log("=== FIRESTORE RATES DIAGNOSTICS ===");
    
    // 1. Custom overrides
    const customSnap = await getDoc(doc(db, 'admin_set', 'coins_custom_rates'));
    console.log("\n1. admin_set/coins_custom_rates (Custom Rates Overrides):");
    if (customSnap.exists()) {
        console.log(JSON.stringify(customSnap.data(), null, 2));
    } else {
        console.log("Not found.");
    }

    // 2. Metals live rates
    const metalsSnap = await getDoc(doc(db, 'coins_rates_metals', 'latest'));
    console.log("\n2. coins_rates_metals/latest:");
    if (metalsSnap.exists()) {
        console.log(JSON.stringify(metalsSnap.data(), null, 2));
    } else {
        console.log("Not found.");
    }

    // 3. Crypto live rates
    const cryptoSnap = await getDoc(doc(db, 'coins_rates_crypto', 'latest'));
    console.log("\n3. coins_rates_crypto/latest (First 3 rates):");
    if (cryptoSnap.exists()) {
        const d = cryptoSnap.data();
        console.log("syncedAt:", d.syncedAt);
        console.log("rates:", JSON.stringify((d.rates || []).slice(0, 3), null, 2));
    } else {
        console.log("Not found.");
    }

    // 4. Forex live rates
    const forexSnap = await getDoc(doc(db, 'coins_rates_forex', 'latest'));
    console.log("\n4. coins_rates_forex/latest:");
    if (forexSnap.exists()) {
        console.log(JSON.stringify(forexSnap.data(), null, 2));
    } else {
        console.log("Not found.");
    }

    // 5. Stocks live rates
    const stocksSnap = await getDoc(doc(db, 'coins_rates_stocks', 'latest'));
    console.log("\n5. coins_rates_stocks/latest:");
    if (stocksSnap.exists()) {
        console.log(JSON.stringify(stocksSnap.data(), null, 2));
    } else {
        console.log("Not found.");
    }

    process.exit(0);
}

runDiagnostics().catch(console.error);
