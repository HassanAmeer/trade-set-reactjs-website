/**
 * Service for handling file uploads using chunked uploads to a third-party API.
 * Replaces Firebase Storage as per user request.
 */

export const uploadFileChunks = async (file, onProgress) => {
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