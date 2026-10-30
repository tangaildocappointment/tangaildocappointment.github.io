/* ===== SLIP: print the appointment slip or download it as a PDF ===== */
var SYS = 'Tangail Zila Sadar Hospital & Clinic';

// The lines shown on the slip
function slipRows(a) {
  return [
    ['Appointment No', a.sl],
    ['Registration No', a.reg || '-'],
    ['Patient', a.name],
    ['Mobile', a.phone || '-'],
    ['Doctor', a.doc],
    ['Department', a.dep],
    ['Hospital', a.hos || '-'],
    ['Date', a.date],
    ['Visit Time', a.time || 'Please call the hospital'],
    [
      'Status',
      a.status == 'confirmed' ? 'Confirmed' : 'Pending',
    ],
  ];
}

var SLIP_NOTE =
  'Please reach the hospital 15 minutes before your time and show this slip. If a patient before you cancels, your serial moves up: check your final serial with Check Appointment (Registration No. or mobile).';

// The slip as HTML (used for printing)
function slipHTML(a) {
  return (
    '<div class="sl-box"><div class="sl-h"><b>' +
    esc(SYS) +
    '</b><br>Appointment Slip</div>' +
    '<div class="sl-serial"><small>SERIAL NO</small><b>' +
    pad(a.sn) +
    '</b></div><table>' +
    slipRows(a)
      .map(function (r) {
        return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>';
      })
      .join('') +
    '</table><p class="sl-n">' +
    esc(SLIP_NOTE) +
    '</p><p class="sl-f">Printed on ' +
    new Date().toLocaleString('en-GB') +
    '</p></div>'
  );
}

// Print: fills the hidden #slip box and opens the print window (only #slip is printed, see CSS @media print)
function printSlip(a) {
  $('slip').innerHTML = slipHTML(a);
  window.print();
}

// jsPDF only knows basic Latin letters, so other characters are replaced by "?"
function lat(s) {
  return String(s)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
}

// Download: builds a real PDF file. Returns false if the PDF library could not be loaded.
// Build the PDF document (jsPDF object) or null if the library is missing
function buildPdf(a) {
  if (!window.jspdf) return null;
  var d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a5' }),
    W = 148;
  d.setFillColor(22, 96, 127);
  d.rect(0, 0, W, 30, 'F');
  d.setTextColor(255, 255, 255);
  d.setFont('helvetica', 'bold');
  d.setFontSize(14);
  d.text(lat(SYS), W / 2, 13, { align: 'center' });
  d.setFont('helvetica', 'normal');
  d.setFontSize(11);
  d.text('Appointment Slip', W / 2, 22, { align: 'center' });
  d.setTextColor(0, 0, 0);
  d.setDrawColor(22, 96, 127);
  d.setLineWidth(0.8);
  d.roundedRect(44, 38, 60, 30, 3, 3);
  d.setFontSize(9);
  d.text('SERIAL NO', W / 2, 45, { align: 'center' });
  d.setFont('helvetica', 'bold');
  d.setFontSize(32);
  d.text(pad(a.sn), W / 2, 60, { align: 'center' });
  var y = 82;
  d.setFontSize(10);
  slipRows(a).forEach(function (r) {
    var lines = d.splitTextToSize(lat(r[1]), 80);
    d.setFont('helvetica', 'bold');
    d.setTextColor(90, 90, 90);
    d.text(r[0] + ':', 14, y);
    d.setFont('helvetica', 'normal');
    d.setTextColor(0, 0, 0);
    d.text(lines, 52, y);
    y += lines.length * 5 + 2;
    d.setDrawColor(220, 220, 220);
    d.setLineWidth(0.2);
    d.line(14, y - 3.5, W - 14, y - 3.5);
    y += 2;
  });
  d.setFontSize(8.5);
  d.setTextColor(80, 80, 80);
  d.text(d.splitTextToSize(SLIP_NOTE, W - 28), 14, y + 4);
  d.setFontSize(8);
  d.text('Printed on ' + new Date().toLocaleString('en-GB'), 14, 203);
  return d;
}

function pdfSlip(a) {
  var d = buildPdf(a);
  if (!d) return false;
  d.save('appointment-' + a.sl + '.pdf');
  return true;
}
