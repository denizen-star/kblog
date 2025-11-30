## Google Apps Script Deployment Steps

Use the checklist below to generate a production URL for the `Kblog Engagement` spreadsheet.

1. **Open the Spreadsheet**
   - Navigate to [`Kblog Engagement`](https://docs.google.com/spreadsheets/d/1JOjadmdAw_4T5plT3jOy2ha-J8bISdbvhAxVaDaePFg/edit?usp=sharing).
   - Verify the tabs exist: `Contact Messages`, `Project Inquiries`, `Newsletter Signups`, `Site Engagement Events`.

2. **Launch Apps Script**
   - In the sheet toolbar, click `Extensions` → `Apps Script`.
   - If prompted to name the project, use `Kblog Data Pipeline`.

3. **Replace the Default Code**
   - Delete any starter code (typically the `function myFunction()` block).
   - Paste the script from `docs/kblog-data-collection-implementation.md` (Section 2). It contains the `doPost`, `formatContact`, `formatProjectInquiry`, `formatNewsletter`, and `formatEvent` helpers plus utilities (`ensureSheet`, `parsePayload`, `buildResponse`, etc.).
   - Press `Ctrl+S` / `Cmd+S` or click the floppy disk icon to save.

4. **Deploy as Web App**
   - Click the blue `Deploy` button → `New deployment`.
   - For `Select type`, choose `Web app`.
   - Under `Description`, enter a short note (e.g., `Initial deployment`).
   - Set `Execute as` to `Me`.
   - Set `Who has access` to `Anyone`.
   - Click `Deploy` and authorize the script if Google prompts for permissions (approve any warnings, acknowledging the script writes to your sheet).

5. **Copy the Web App URL**
   - After deployment, a dialog shows `Web app` with a URL like `https://script.google.com/macros/s/.../exec`.
   - Click the copy icon; this is your production endpoint.

6. **Update Environment Variables**
   - On the server hosting Kblog, set `GS_DATA_PIPELINE_URL` (or update `.env`) to `https://script.google.com/macros/s/AKfycbywheaIvDhHOaXzhNaJsIe9CIdH6XinnTchfOZ0lVxQ0RanOZ86NLqTzRk122MyyxhHqA/exec`.
   - Restart the Node server so `process.env.GS_DATA_PIPELINE_URL` is reloaded.

7. **Smoke Test**
   - Submit a contact form, a project inquiry, and a newsletter signup.
   - Refresh the spreadsheet and confirm rows appear in the correct tabs with timestamps, session IDs, and metadata.
   - Load an article page to verify a row is added to `Site Engagement Events`.

8. **Re-deploying Later**
   - When you redeploy (e.g., after editing the script), repeat step 4 and choose `Manage deployments` → `Edit` for the existing deployment, then click `Deploy`.
   - The URL remains the same; no server changes needed unless you switch to a new deployment.





