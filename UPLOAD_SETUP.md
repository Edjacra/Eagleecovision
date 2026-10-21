# Gallery upload setup

Tree Planting Day uploads are stored in Vercel Blob, not in the deployed site's source folder. The public gallery lists those files through `/api/gallery-images`; uploading requires the admin token.

## Editing site text

All visible text on the site's HTML pages can be edited and published through the shared site editor. Published copy is stored in the connected Vercel Blob store and is loaded for every visitor.

1. In the Vercel project, set a strong, private `SITE_CONTENT_EDIT_TOKEN` environment variable. Keep it private and share it only with trusted site editors.
2. Ensure the Blob store is connected so the deployment has `BLOB_READ_WRITE_TOKEN`.
3. Redeploy after setting the environment variables.
4. Open any page with `?edit=1` added to its URL, enter the admin token, select the text to change, and choose **Publish changes**. Text can be edited page by page; regular visitors see the published copy without editor controls.

## Vercel configuration

1. Deploy this site as a Vercel project with the project root set to this folder.
2. In the Vercel project, create and connect a Blob store. This provides the `BLOB_READ_WRITE_TOKEN` environment variable to the deployment.
3. Add a strong, private `GALLERY_UPLOAD_TOKEN` environment variable. Use a randomly generated value and share it only with trusted photo administrators.
4. Redeploy after setting the environment variables. Preview deployments also need these variables if uploads should work there.

The gallery upload form accepts JPG, PNG, and WebP images up to 4 MB each. Multiple selected photos upload one at a time. Visitors can view uploaded photos without the admin token.
