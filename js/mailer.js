/* ===== MAILER: sends the appointment e-mails to the patient (through Google Apps Script) ===== */
// How it works: the website sends the e-mail text to a small Google Apps Script web app.
// That script runs inside the Gmail account jadid24013@gmail.com and sends the e-mail from it.
// So the Gmail password is NEVER written in this website. Setup steps: email-setup/SETUP.md
var MAIL = {
  url: '', // <-- paste the Web App URL here (ends with /exec), see email-setup/SETUP.md
  token: '', // <-- must be the same as TOKEN inside email-setup/Code.gs
  from: '',
};

// Find the patient's e-mail: it is saved in the appointment, or in the patient record
function mailOf(a) {
  var e = a.em;
  if (!e && a.reg) {
    var q = DEMO.concat(pts).filter(function (p) {
      return p.reg == a.reg;
    })[0];
    e = q && q.em;
  }
  e = String(e || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

// The e-mail body: a message + the appointment slip as a table (works in every mail app)
function mailHTML(a, kind) {
  var ok = kind == 'confirmed',
    head = ok
      ? 'Your appointment is <b style="color:#2e7d5b">CONFIRMED</b>.'
      : 'We received your appointment request. Status: <b>Pending</b>.',
    note = ok
      ? 'This is your final serial number. Please reach the hospital 15 minutes before your time and show this e-mail or the printed slip.'
      : 'Your serial number may move up if a patient before you cancels. You will get a second e-mail with your final serial when the hospital confirms. You can also use "Check Appointment" on the website.',
    rows = slipRows(a)
      .map(function (r) {
        return (
          '<tr><td style="padding:7px 10px;border-bottom:1px solid #e3e9ee;color:#5a6b78;width:38%">' +
          esc(r[0]) +
          '</td><td style="padding:7px 10px;border-bottom:1px solid #e3e9ee;color:#17324d"><b>' +
          esc(r[1]) +
          '</b></td></tr>'
        );
      })
      .join('');
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#17324d">' +
    '<div style="background:#16607f;color:#fff;text-align:center;padding:14px;border-radius:10px 10px 0 0"><b style="font-size:16px">' +
    esc(SYS) +
    '</b><br>Appointment Slip</div>' +
    '<div style="border:2px solid #16607f;border-top:0;border-radius:0 0 10px 10px;padding:16px">' +
    '<p style="margin:0 0 12px">Dear <b>' +
    esc(a.name) +
    '</b>,<br>' +
    head +
    '</p>' +
    '<div style="text-align:center;border:2px solid #16607f;border-radius:10px;padding:8px;margin:12px auto;width:170px"><small>SERIAL NO</small><br><b style="font-size:36px">' +
    pad(a.sn) +
    '</b></div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
    rows +
    '</table>' +
    '<p style="font-size:12px;color:#5a6b78;margin:14px 0 0">' +
    esc(note) +
    '</p></div>' +
    '<p style="font-size:11px;color:#8a97a2;text-align:center">This is an automatic e-mail. Please do not reply.</p></div>'
  );
}

// Send one e-mail. kind = 'booked' (1st mail) or 'confirmed' (2nd mail). Never stops the booking if it fails.
function sendMail(a, kind) {
  var to = mailOf(a);
  if (!to) return;
  if (!MAIL.url) {
    console.warn('E-mail NOT sent: MAIL.url is empty in js/mailer.js. Follow email-setup/SETUP.md');
    return;
  }
  var pdf = '';
  try {
    var d = buildPdf(a); // the slip as a PDF attachment
    if (d) pdf = d.output('datauristring').split(',')[1];
  } catch (e) {}
  var subject =
    (kind == 'confirmed' ? 'Appointment Confirmed - Serial ' : 'Appointment Received - Serial ') +
    pad(a.sn) +
    ' (' +
    a.sl +
    ')';
  try {
    // Normal (CORS) request: Apps Script answers with CORS headers, so we can READ the answer and show problems.
    fetch(MAIL.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: MAIL.token,
        to: to,
        subject: subject,
        html: mailHTML(a, kind),
        name: SYS,
        pdf: pdf,
        pdfName: 'appointment-' + a.sl + '.pdf',
      }),
    })
      .then(function (r) {
        return r.text();
      })
      .then(function (t) {
        t = String(t).trim();
        if (t == 'ok') console.log('E-mail sent to ' + to);
        else if (/^</.test(t))
          console.warn('E-mail NOT sent: Google returned a web page, not "ok". Deployment access is not "Anyone", or the URL is wrong. See email-setup/SETUP.md (Problems).');
        else console.warn('E-mail NOT sent. Apps Script said: ' + t);
      })
      .catch(function (err) {
        console.warn('E-mail request was blocked/failed: ' + err + '. Open test-mail.html to find the reason.');
      });
  } catch (e) {}
}
