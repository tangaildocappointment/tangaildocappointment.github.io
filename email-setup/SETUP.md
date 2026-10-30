# Email setup (one time, about 5 minutes)

The slip is inside the mail and also attached as a PDF.
Emails are sent from **** automatically. No password is stored in the website.

1. Login to Google as ``, open https://script.google.com and click **New project**.
2. Delete the sample code and paste everything from `Code.gs`. Change `TOKEN` to your own secret word.
3. Select `testMail` at the top, click **Run**, allow the permission (Advanced > Go to project > Allow). A test mail comes to your inbox.
4. Click **Deploy > New deployment > type: Web app**.
   - Execute as: **Me ()**
   - Who has access: **Anyone**
5. Click Deploy and copy the **Web app URL** (ends with `/exec`).
6. Open `js/mailer.js` and set `url:` to that URL and `token:` to the same secret word as step 2.
7. Save, refresh the website. Done. Book an appointment with an email: mail 1 goes at booking, mail 2 (final serial) goes when the admin confirms.

Notes
- If you change `Code.gs` later, use Deploy > Manage deployments > Edit > New version.
- Sending limit: about 100 mails/day on a normal Gmail, (a university account would give more, but it often blocks "Anyone" access).
- Mails can land in Spam the first time. Ask the patient to check it.

## Problems (mail does not come)
1. Open the `/exec` URL in a browser. You must see **Mailer is online**. If you see a Google login page or "Sorry, unable to open the file", the deployment access is not "Anyone".
2. Open `test-mail.html` in the browser, paste the URL + token + your e-mail, click Send. It shows the exact answer from Google (ok / forbidden / error ...).
3. Changed `Code.gs` after deploying? Deploy > Manage deployments > Edit (pencil) > Version: **New version** > Deploy. The URL stays the same.
4. The patient must type an e-mail in the booking form, or no mail is sent.
5. Press F12 > Console after booking: the page now prints why a mail was not sent.
