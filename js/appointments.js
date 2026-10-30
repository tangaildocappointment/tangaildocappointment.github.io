/* ===== APPOINTMENT TOOLS: Excel export, backup / restore (used by the admin panel) ===== */

// Save a file on the user's computer
function downloadFile(name, data, type) {
  var url = URL.createObjectURL(new Blob([data], { type: type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 3000);
}

// Appointments joined with patient data and SORTED: date -> hospital A-Z -> doctor -> serial
function xrecs() {
  var P = {};
  DEMO.concat(pts).forEach(function (q) {
    P[q.reg] = q;
  });
  return mem
    .map(function (a) {
      return { a: a, q: P[a.reg] || {} };
    })
    .sort(function (x, y) {
      return (
        (x.a.date || '').localeCompare(y.a.date || '') ||
        (x.a.hos || '').localeCompare(y.a.hos || '') ||
        (x.a.doc || '').localeCompare(y.a.doc || '') ||
        (x.a.sn || 0) - (y.a.sn || 0)
      );
    });
}
// Key = doctor + hospital + date (one doctor on one day)
function gk(a) {
  return a.doc + '|' + (a.hos || '') + '|' + a.date;
}
function stText(a) {
  return a.status == 'confirmed' ? 'Confirmed' : 'Pending';
}
// Rows of Excel sheet 1 (every appointment)
function xrows() {
  var r = xrecs(),
    T = {};
  r.forEach(function (o) {
    T[gk(o.a)] = (T[gk(o.a)] || 0) + 1;
  });
  var H = [
    'Hospital',
    'Appointment Date',
    'Doctor',
    'Department',
    'Serial No',
    'Status',
    'Total Patients (that day)',
    'Patient Name',
    'Mobile Number',
    'Registration No',
    'Patient Type',
    'Gender',
    'Date of Birth',
    'Visit Time',
    'Appointment No (TG)',
    'Booked On',
  ];
  return [H].concat(
    r.map(function (o) {
      var a = o.a,
        q = o.q;
      return [
        a.hos || '',
        a.date,
        a.doc,
        a.dep,
        a.sn ? pad(a.sn) : '',
        stText(a),
        T[gk(a)],
        a.name || '',
        a.phone || '',
        a.reg || '',
        a.type || '',
        q.gn || '',
        q.dob || '',
        a.time || '',
        a.sl,
        a.at || '',
      ];
    }),
  );
}
// Rows of Excel sheet 2 (patients per doctor per day)
function xsum() {
  var g = {},
    o = [];
  xrecs().forEach(function (z) {
    var a = z.a,
      k = gk(a);
    if (!g[k]) {
      g[k] = [a.hos || '', a.date, a.doc, a.dep, 0, 0];
      o.push(g[k]);
    }
    g[k][4]++;
    if (a.status == 'confirmed') g[k][5]++;
  });
  return [
    [
      'Hospital',
      'Appointment Date',
      'Doctor',
      'Department',
      'Total Patients',
      'Confirmed',
      'Slots Left (of ' + CAP + ')',
      'Status',
    ],
  ].concat(
    o.map(function (r) {
      return r.concat([Math.max(0, CAP - r[4]), r[4] >= CAP ? 'Full' : 'Available']);
    }),
  );
}

// Excel export. note(text) shows a message to the admin.
function exportExcel(note) {
  if (!mem.length) {
    note('No appointments to export yet.');
    return;
  }
  var name = 'appointments-' + iso(today()),
    rows = xrows();
  if (typeof XLSX != 'undefined') {
    // real .xlsx file with 2 sheets (needs the SheetJS library from the internet)
    var wb = XLSX.utils.book_new(),
      s1 = XLSX.utils.aoa_to_sheet(rows),
      s2 = XLSX.utils.aoa_to_sheet(xsum());
    s1['!cols'] = [30, 15, 34, 22, 10, 11, 14, 22, 15, 13, 16, 9, 13, 20, 17, 19].map(function (w) {
      return { wch: w };
    });
    s2['!cols'] = [30, 15, 34, 22, 13, 11, 16, 11].map(function (w) {
      return { wch: w };
    });
    XLSX.utils.book_append_sheet(wb, s1, 'Appointments');
    XLSX.utils.book_append_sheet(wb, s2, 'Summary');
    downloadFile(
      name + '.xlsx',
      XLSX.write(wb, { bookType: 'xlsx', type: 'array' }),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    note('');
  } else {
    // offline: save a CSV file instead (Excel opens it)
    var csv =
      '\ufeff' +
      rows
        .map(function (r) {
          return r
            .map(function (c) {
              return '"' + String(c).replace(/"/g, '""') + '"';
            })
            .join(',');
        })
        .join('\r\n');
    downloadFile(name + '.csv', csv, 'text/csv;charset=utf-8');
    note('Saved as a CSV file (Excel opens it). Connect to the internet to get a real .xlsx file.');
  }
}

// Backup: all appointments + patients in one .json file (to move the data to another browser)
function saveBackup() {
  var data = JSON.stringify(
    { app: 'find-your-doctor', v: 1, saved: new Date().toISOString(), appts: mem, pts: pts },
    null,
    1,
  );
  downloadFile('doctor-backup-' + iso(today()) + '.json', data, 'application/json');
}
// Restore: replaces the data with the backup file. done() runs after a good restore.
function restoreBackup(file, note, done) {
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var o = JSON.parse(fr.result);
      if (!o || o.app != 'find-your-doctor' || !Array.isArray(o.appts) || !Array.isArray(o.pts))
        throw 0;
      o.appts.forEach(function (a) {
        if (!a.status) a.status = 'pending';
      });
      mem.length = 0;
      [].push.apply(mem, o.appts);
      pts.length = 0;
      [].push.apply(pts, o.pts);
      js('fyd_appts', mem);
      js('fyd_pts', pts);
      done();
      note('Backup restored: ' + mem.length + ' appointments, ' + pts.length + ' patients.');
    } catch (e) {
      note('This is not a valid backup file.');
    }
  };
  fr.readAsText(file);
}
