# CTYBC site editor: one-time Vercel setup

The editor is available at `/admin.html`. It uses Vercel Functions for sign-in and saves, and Vercel Blob for the public site-content record and uploaded public photographs. The site remains readable if CMS storage has not been configured.

1. In the Vercel project connected to this GitHub repository, open **Storage** and create a **Blob** store with **Public** access. Public access is required for the site to display photos and public page content directly. Connect the store to this project and Production; Vercel adds `BLOB_READ_WRITE_TOKEN` to the project environment.
2. In **Settings → Environment Variables**, add these two Production secrets:
   - `CMS_ADMIN_PASSWORD`: a long, unique password for the CTYBC website editor.
   - `CMS_SESSION_SECRET`: a separate random secret (at least 32 random bytes). Generate one locally with `openssl rand -base64 32` and paste it into Vercel. Do not commit either value to GitHub or put it in frontend code.
3. Redeploy Production so the Functions receive the new store token and secrets.
4. Visit `https://<your-domain>/admin.html` and sign in. Select a page, click a text block, image, or link in the preview, then choose **Save page edits**. Use **Photo archive** to add one or more gallery photos.

Admin sessions expire after eight hours. Page text, image, and link edits are stored as safe DOM patches in Blob; gallery uploads are stored as public image blobs and appear in the public archive. Content pages themselves remain public, as expected for website content.
