// Google Apps Script: sends the e-mail from the Gmail account that owns this script.
// Create it while logged in as jadid24013@gmail.com (see SETUP.md).
var TOKEN = ''; // must be the same as MAIL.token in js/mailer.js

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return out('forbidden: TOKEN in Code.gs and token in js/mailer.js are different');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to || '')) return out('bad address: ' + d.to);
    var opt = {
      to: d.to,
      subject: String(d.subject || 'Appointment').slice(0, 150),
      htmlBody: d.html,
      body: 'Please open this e-mail in an app that shows HTML.',
      name: d.name || 'Hospital Appointment',
    };
    if (d.pdf) {
      opt.attachments = [
        Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', d.pdfName || 'slip.pdf'),
      ];
    }
    MailApp.sendEmail(opt);
    return out('ok');
  } catch (err) {
    return out('error: ' + err);
  }
}
// Open the /exec URL in a browser: you must see this text. If you see a Google login page, access is NOT "Anyone".
function doGet() {
  return out('Mailer is online');
}
function out(t) {
  return ContentService.createTextOutput(t);
}

// Run this ONCE from the editor (select testMail > Run) to give the permission and send a test mail to yourself.
function testMail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Test mail', 'Mail sending works.');
}
