<?php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('Content-Type: application/json; charset=utf-8');

$SECRET = 'REPLACE_WITH_STORAGE_API_KEY';
$ALLOWED_ORIGINS = array('https://fxtrade.international', 'http://localhost:5173', 'http://127.0.0.1:5173');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allow = in_array($origin, $ALLOWED_ORIGINS, true) ? $origin : 'https://fxtrade.international';
header('Access-Control-Allow-Origin: ' . $allow);
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Storage-Key, Content-Type');
header('Access-Control-Max-Age: 86400');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!isset($_SERVER['HTTP_X_STORAGE_KEY']) || hash_equals($SECRET, (string)$_SERVER['HTTP_X_STORAGE_KEY']) === false) {
    http_response_code(403);
    echo json_encode(array('success' => false, 'error' => 'Forbidden'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed'));
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'upload';

if ($action === 'upload') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'No file field "file" provided'));
        exit;
    }

    $f = $_FILES['file'];

    $errorMap = array(
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form limit',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the upload'
    );
    if (!isset($f['error']) || $f['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => isset($errorMap[$f['error']]) ? $errorMap[$f['error']] : 'Upload failed'));
        exit;
    }

    $MAX_BYTES = 17 * 1024 * 1024; // 17 MiB (server drops requests above ~18 MB)
    if ($f['size'] <= 0 || $f['size'] > $MAX_BYTES) {
        http_response_code(413);
        echo json_encode(array('success' => false, 'error' => 'File too large (max 17 MB)'));
        exit;
    }

    $extWhitelist  = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf');
    $mimeWhitelist = array('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf');

    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $extWhitelist, true)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Invalid file extension'));
        exit;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $f['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $mimeWhitelist, true)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'error' => 'Invalid file content'));
        exit;
    }

    $safeName = bin2hex(random_bytes(16)) . '.' . $ext;
    $targetDir = __DIR__ . '/files';
    $target = $targetDir . '/' . $safeName;

    if (move_uploaded_file($f['tmp_name'], $target)) {
        @chmod($target, 0644);
        echo json_encode(array(
            'success' => true,
            'url' => 'https://fxtrade.international/storage/files/' . $safeName,
            'size' => $f['size'],
            'mime' => $mime
        ));
    } else {
        http_response_code(500);
        echo json_encode(array('success' => false, 'error' => 'Failed to store file'));
    }
    exit;
}

http_response_code(404);
echo json_encode(array('success' => false, 'error' => 'Unknown action'));
