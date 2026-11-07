# TradeSet cPanel PHP Storage (fxtrade.international)

All app uploads are stored on our own cPanel hosting instead of a third-party API.

## Live layout (public_html/storage/)

```
storage/
  api.php             # Upload endpoint, X-Storage-Key auth, PHP mime/ext check, 17 MiB cap
  index.html          # placeholder page
  .htaccess           # disables directory listing only
  files/              # uploaded files, publicly served from
    .htaccess         # disables script execution + directory listing (403)
```

URL: `https://fxtrade.international/storage/api.php` (POST multipart, field `file`,
header `X-Storage-Key: <key>`)

## Deploy / restore

1. Upload `api.php`, `index.html`, `storage.htaccess` (→ `storage/.htaccess`),
   `files.htaccess` (→ `storage/files/.htaccess`) to `public_html/storage/`.
2. Replace `REPLACE_WITH_STORAGE_API_KEY` in the live `api.php` with the key used
   in the web bundle (`src/services/dbs.js`, `STORAGE_API_KEY`).
3. Ensure the `storage/files/` folder exists and is web-accessible.

## Notes

- Accepted uploads: jpg/jpeg/png/gif/webp/pdf (web app sends images only), 17 MiB max
  (Hostinger drops request bodies above ~18 MB, and PHP limits are 1024M).
- Mode switch lives in Firestore doc `admin_set/storage { mode: 'native' | 'api' }`,
  toggled from Admin Settings → "File Storage Mode". `native` = this PHP storage,
  `api` = legacy thelocalrent.com chunked upload (still supported).
- The API key is public by design (client-side bundle), same as the legacy token.
  Security is enforced server-side via mime/ext checks and the no-exec `.htaccess`.
