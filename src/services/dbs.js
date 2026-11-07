/**
 * Storage service — Dual Mode (module-level switch):
 *  - 'native' (DEFAULT): TradeSet's own storage — PHP API on cPanel
 *    (https://fxtrade.international/storage/api.php), files served from
 *    /storage/files/. Supports images & PDFs up to 12 MB.
 *  - 'api' (legacy): external third-party chunked-upload API (thelocalrent.com).
 *
 * The active mode is stored in Firestore doc admin_set/storage { mode }
 * and toggled from Admin Settings → "File Storage Mode" (defaults to native).
 * Every upload call in the app goes through uploadFileChunks(); the mode
 * switch routes it automatically, no other code changes required.
 */
import { db } from '../firebase-setup';
import { doc, onSnapshot } from 'firebase/firestore';

const STORAGE_API_URL = 'https://fxtrade.international/storage/api.php';
// Shared key checked by api.php. Note: client-side value is public by design
// (same model as the legacy API token). Server-side validation enforces
// file type, size and extension whitelists, and the /storage/files/ folder
// has script execution disabled.
const STORAGE_API_KEY = 'c7405e175587e9bf8892638e71fec8e95fe90b8083a9f3cf';

let storageMode = 'native'; // safe default

onSnapshot(
    doc(db, 'admin_set', 'storage'),
    (snap) => {
        storageMode = snap.exists() && snap.data()?.mode ? snap.data().mode : 'native';
        console.log('[Storage] active mode:', storageMode);
    },
    (error) => {
        console.warn('[Storage] mode listener error (defaulting to native):', error);
        storageMode = 'native';
    }
);

export const getStorageMode = () => storageMode;

const uploadFileNative = async (file, onProgress) => {
    if (!file) return { success: false, error: 'No file provided' };
    if (onProgress) onProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(STORAGE_API_URL, {
            method: 'POST',
            headers: { 'X-Storage-Key': STORAGE_API_KEY },
            body: formData
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
            throw new Error(data?.error || `Upload failed (HTTP ${response.status})`);
        }

        if (onProgress) onProgress(100);

        return {
            success: true,
            url: data.url
        };
    } catch (error) {
        console.error('Native Storage Upload Error:', error);
        return { success: false, error: error.message };
    }
};

const uploadFileApi = async (file, onProgress) => {
    if (!file) return { success: false, error: "No file provided" };
    const CHUNK_SIZE = 256 * 1024; // 256KB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = Date.now().toString() + Math.random().toString(36).substring(7);
    let lastResponse = null;

    try {
        for (let i = 0; i < totalChunks; i++) {
            const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const formData = new FormData();
            formData.append('folder_name', 'trade_profiles');
            formData.append('is_secret', '0');
            formData.append('file_id', fileId);
            formData.append('chunk_index', i);
            formData.append('total_chunks', totalChunks);
            formData.append('chunk_file', chunk);

            const response = await fetch('https://link.thelocalrent.com/api/upload_file_chunks', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer 572fdbb7c7e74d16b346882232e97cd0'
                },
                body: formData
            });

            if (!response.ok) throw new Error(`Upload failed at chunk ${i}`);

            lastResponse = await response.json();

            if (onProgress) {
                onProgress(Math.round(((i + 1) / totalChunks) * 100));
            }
        }

        // The final response includes the file URL in the "link" field
        return {
            success: true,
            url: lastResponse?.link
        };
    } catch (error) {
        console.error("Chunk Upload Error:", error);
        return { success: false, error: error.message };
    }
};

export const uploadFileChunks = async (file, onProgress) => {
    if (storageMode === 'api') {
        return uploadFileApi(file, onProgress);
    }
    return uploadFileNative(file, onProgress);
};
