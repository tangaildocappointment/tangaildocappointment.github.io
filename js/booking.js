/* ===== BOOKING PAGE: choose doctor, pick date (serial), patient form, confirm ===== */
// Current state of the booking page
var sel = { d: '', s: '', i: null }, // chosen department, speciality, doctor index
  cm = new Date(), // month shown in the calendar
  pick = '', // chosen date (yyyy-mm-dd)
  pt = 'n', // patient tab: n = new, e = existing
  cp = null; // existing patient that was found
// ---- Booking page dropdowns ----
CB(
  'bd',
  'Select Department',
  function () {
    return O(
      uniq(
        D.map(function (x) {
          return x[2];
        }),
      ),
    );
  },
  function (v) {
    sel = { d: v, s: '', i: null };
    chg();
  },
);
CB(
  'bs',
  'Select Speciality',
  function () {
    return O(
      uniq(
        D.filter(function (x) {
          return !sel.d || x[2] == sel.d;
        }).map(function (x) {
          return x[3];
        }),
      ),
    );
  },
  function (v) {
    sel.s = v;
    sel.i = null;
    if (v) {
      var c = D.map(function (x, i) {
        return i;
      }).filter(function (i) {
        return (!sel.d || D[i][2] == sel.d) && D[i][3] == v;
      });
      if (!sel.d && c.length) sel.d = D[c[0]][2];
      if (c.length == 1) sel.i = c[0];
    }
    chg();
  },
);
CB(
  'bn',
  'Search Doctor',
  function () {
    return D.map(function (x, i) {
      return { v: i, t: dlab(i) };
    }).filter(function (o) {
      return (!sel.d || D[o.v][2] == sel.d) && (!sel.s || D[o.v][3] == sel.s);
    });
  },
  function (v) {
    if (v === '') {
      sel.i = null;
    } else {
      sel.i = v;
      sel.d = D[v][2];
      sel.s = D[v][3];
    }
    chg();
  },
);
CB(
  'gn',
  'Select Gender',
  function () {
    return O(['Male', 'Female', 'Other']);
  },
  function () {
    chk();
  },
);
CB(
  'ms',
  'Select Status',
  function () {
    return O(['Single', 'Married', 'Divorced', 'Widowed']);
  },
  function () {
    chk();
  },
);
CB(
  'bl',
  'Select Blood Group',
  function () {
    return O(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  },
  function () {
    chk();
  },
);
CB(
  'oc',
  'Select Occupation',
  function () {
    return O([
      'Student',
      'Service Holder',
      'Businessman',
      'Farmer',
      'Housewife',
      'Teacher',
      'Doctor',
      'Engineer',
      'Unemployed',
      'Other',
    ]);
  },
  function () {
    chk();
  },
);
CB(
  'rl',
  'Select Religion',
  function () {
    return O(['Islam', 'Hinduism', 'Buddhism', 'Christianity', 'Other']);
  },
  function () {
    chk();
  },
);
CB(
  'dv',
  'Select Division',
  function () {
    return O(Object.keys(GEO));
  },
  function () {
    CBS.dis.set('', '');
    CBS.th.set('', '');
    chk();
  },
);
CB(
  'dis',
  'Select District',
  function () {
    return O(Object.keys(GEO[CBS.dv.v()] || {}));
  },
  function () {
    CBS.th.set('', '');
    chk();
  },
);
CB(
  'th',
  'Select Thana',
  function () {
    return O((GEO[CBS.dv.v()] || {})[CBS.dis.v()] || []);
  },
  function () {
    chk();
  },
);
// How many patients are already booked for this doctor on this date
function cnt(x, d) {
  return mem.filter(function (a) {
    return a.doc == x[1] && (!a.hos || a.hos == x[0]) && a.date == d;
  }).length;
}
// 0 = not available, 1 = available, 2 = slot full (15 patients booked for this doctor that day)
// Date status: 0 = not available, 1 = available, 2 = slot full (15 booked)
function slot(d) {
  if (sel.i == null || d < today()) return 0;
  var x = D[sel.i],
    k = x[4],
    w = d.getDay();
  if (!isDay(k, w)) return 0;
  return cnt(x, iso(d)) >= CAP ? 2 : 1;
}
// Show the chosen department / speciality / doctor in the dropdowns
function selUI() {
  var x = sel.i == null ? null : D[sel.i];
  CBS.bd.set(sel.d, sel.d);
  CBS.bs.set(sel.s, sel.s);
  CBS.bn.set(sel.i == null ? '' : sel.i, x ? dlab(sel.i) : '');
  $('dinf').textContent = x
    ? x[0] + ' · ' + DD(x[4]) + (x[5] ? ' · ' + x[5] : '') + ' · max ' + CAP + ' patients/day'
    : '';
}
// Show the chosen date and its serial number
function dateUI() {
  $('sd').style.display = pick ? 'flex' : 'none';
  $('okm').hidden = !pick;
  if (pick)
    $('sdt').textContent =
      new Date(pick + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) + (sel.i != null ? ' · Serial No: ' + pad(nextSerial(D[sel.i], pick)) : '');
}
// Doctor changed: reset the date and redraw
function chg() {
  pick = '';
  selUI();
  dateUI();
  cal();
  chk();
}
// Open the booking page for doctor number i
function book(i) {
  sel = { d: D[i][2], s: D[i][3], i: i };
  pick = '';
  cp = null;
  $('dupb').hidden = true;
  $('fm').reset();
  $('ph2').value = '';
  CS.forEach(function (k) {
    CBS[k].set('', '');
  });
  setPt('n');
  $('bg2').style.display = '';
  $('done').innerHTML = '';
  cm = new Date();
  cm.setDate(1);
  selUI();
  dateUI();
  cal();
  chk();
  open('ovb');
  setHash(i);
}
// Draw the calendar of the current month
function cal() {
  var y = cm.getFullYear(),
    m = cm.getMonth(),
    f = new Date(y, m, 1).getDay(),
    n = new Date(y, m + 1, 0).getDate();
  $('mt').textContent = cm.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  var h = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    .map(function (d) {
      return '<b>' + d + '</b>';
    })
    .join('');
  for (var i = 0; i < f; i++) h += '<span></span>';
  for (var d = 1; d <= n; d++) {
    var dt = new Date(y, m, d),
      s = slot(dt),
      k = iso(dt);
    h +=
      '<button type="button" class="dy ' +
      (k == pick ? 's' : s == 1 ? 'g' : s == 2 ? 'r' : 'n') +
      '" ' +
      (s == 1 ? 'data-d="' + k + '"' : 'disabled') +
      '>' +
      d +
      (s == 1 ? '<small>' + ic('check') + ' avail</small>' : s == 2 ? '<small>full</small>' : '') +
      '</button>';
  }
  $('cal').innerHTML = h;
}
$('pv').onclick = function () {
  cm.setMonth(cm.getMonth() - 1);
  cal();
};
$('nx').onclick = function () {
  cm.setMonth(cm.getMonth() + 1);
  cal();
};
$('cal').onclick = function (e) {
  var b = e.target.closest('[data-d]');
  if (b) {
    pick = b.dataset.d;
    dateUI();
    cal();
    chk();
  }
};
$('clrd').onclick = function () {
  pick = '';
  dateUI();
  cal();
  chk();
};
// ---- patient form ----
// Switch between New Patient and Existing Patient
function setPt(t) {
  pt = t;
  document.querySelectorAll('.seg button').forEach(function (z) {
    z.classList.toggle('on', z.dataset.t == t);
  });
  $('pn').hidden = t != 'n';
  $('pe').hidden = t != 'e';
  $('fm').classList.toggle('ex', t == 'e');
  chk();
}
document.querySelectorAll('.seg button').forEach(function (b) {
  b.onclick = function () {
    $('dupb').hidden = true;
    setPt(b.dataset.t);
  };
});
document.querySelectorAll('[name=it]').forEach(function (r) {
  r.onchange = function () {
    $('itl').textContent = r.value;
    $('nb').textContent =
      'N.B- Please bring your ' +
      r.value +
      (r.value == 'Passport' ? '' : ' Card') +
      ' for consultation.';
  };
});
// Fill the patient form from a saved patient
function fillP(q) {
  TX.forEach(function (k) {
    $(k).value = q[k] || '';
  });
  CS.forEach(function (k) {
    CBS[k].set(q[k] || '', q[k] || '');
  });
}
// Existing patient: find by Registration No. and auto-fill the form
function doFind() {
  var r = $('rg').value.trim().toUpperCase();
  cp =
    DEMO.concat(pts).filter(function (q) {
      return q.reg == r;
    })[0] || null;
  if (cp) {
    fillP(cp);
    $('ph2').value = cp.ph;
  } else {
    fillP({});
    $('ph2').value = '';
  }
  chk();
}
$('find').onclick = doFind;
$('rg').addEventListener('keydown', function (e) {
  if (e.key == 'Enter') {
    e.preventDefault();
    doFind();
  }
});
// List of required things that are still missing
function need() {
  var v = function (i) {
      return $(i).value.trim();
    },
    g = function (k) {
      return CBS[k].v();
    },
    m = [];
  if (sel.i == null) m.push('Doctor');
  if (!pick) m.push('Date');
  if (pt == 'n') {
    [
      ['idn', 0, 'ID number'],
      ['ph', 0, 'Phone'],
      ['nm', 0, 'Full name'],
      ['dob', 0, 'Date of birth'],
      ['gn', 1, 'Gender'],
      ['fa', 0, "Father's name"],
      ['mo', 0, "Mother's name"],
      ['ms', 1, 'Marital status'],
      ['rl', 1, 'Religion'],
      ['dv', 1, 'Division'],
      ['dis', 1, 'District'],
      ['th', 1, 'Thana'],
      ['wd', 0, 'Ward/Union'],
    ].forEach(function (a) {
      if (!(a[1] ? g(a[0]) : v(a[0]))) m.push(a[2]);
    });
    if (v('ph') && !/^[0-9+\-\s]{8,15}$/.test(v('ph'))) m.push('Valid phone');
  } else if (!(cp && cp.reg == v('rg').toUpperCase()))
    m.push(v('rg') ? 'Valid registration number' : 'Registration number');
  return m;
}
// Normalise an ID number (remove spaces/dashes, lower case)
function nrm(v) {
  return String(v).replace(/[\s-]/g, '').toLowerCase();
}
// Chosen ID type: NID / Birth Registration / Tika Card / Passport
function idType() {
  return document.querySelector('[name=it]:checked').value;
}
// Is this ID type + number already registered? returns the Reg No.
function dup() {
  var i = nrm($('idn').value);
  if (!i) return null;
  var t = idType(),
    q = DEMO.concat(pts).filter(function (x) {
      return x.idn && x.idt == t && nrm(x.idn) == i;
    })[0];
  return q ? q.reg : null;
}
// Already registered: show alert, switch to Existing Patient and auto-fill
function checkDup() {
  var r = dup();
  if (!r) return false;
  $('dupb').innerHTML =
    ic('alert') +
    ' This ' +
    esc(idType()) +
    ' number is already registered.<br>Registration No: <b>' +
    esc(r) +
    '</b><br>Switched to <b>Existing Patient</b> and the saved details were filled in.';
  $('dupb').hidden = false;
  setPt('e');
  $('rg').value = r;
  doFind();
  return true;
}
// Enable / disable the Confirm button and show what is missing
function chk() {
  var m = need(),
    d = pt == 'n' ? dup() : null;
  $('sub').disabled = m.length > 0 || !!d;
  $('er').textContent = d
    ? 'This ID is already registered (' + d + '). Please use the Existing Patient tab.'
    : m.length
      ? 'Required: ' +
        m.slice(0, 3).join(', ') +
        (m.length > 3 ? ' +' + (m.length - 3) + ' more' : '')
      : '';
}
$('fm').addEventListener('input', chk);
$('idn').addEventListener('change', function () {
  if (pt == 'n') checkDup();
});
$('sub').onclick = function () {
  if (pt == 'n' && checkDup()) return;
  if (need().length) return;
  var x = D[sel.i],
    v = function (i) {
      return $(i).value.trim();
    },
    P,
    nw = pt == 'n';
  if (nw) {
    P = {
      reg: 'R' + (10003 + pts.length),
      ph: v('ph'),
      idt: document.querySelector('[name=it]:checked').value,
      idn: v('idn'),
    };
    TX.forEach(function (k) {
      P[k] = v(k);
    });
    CS.forEach(function (k) {
      P[k] = CBS[k].v();
    });
    pts.push(P);
    js('fyd_pts', pts);
  } else P = cp;
  var a = {
    sl: nextTG(),
    sn: nextSerial(x, pick),
    reg: P.reg,
    doc: x[1],
    hos: x[0],
    dep: x[2],
    date: pick,
    name: P.nm,
    phone: P.ph,
    type: nw ? 'New Patient' : 'Existing Patient',
    time: x[5] || '',
    at: new Date().toLocaleString('en-GB'),
    status: 'pending',
    em: (nw ? v('em') : P.em || '') || '',
  };
  save(a);
  sendMail(a, 'booked'); // 1st e-mail: appointment received
  $('bg2').style.display = 'none';
  $('done').innerHTML =
    '<div class="ok-box" style="margin-top:30px"><h2 style="margin:0 0 8px">' +
    ic('checkc') +
    ' Appointment Booked</h2><p>Status: <b>Pending</b>. </p><p style="font-size:22px">Serial No: <b>' +
    pad(a.sn) +
    '</b></p><p>Appointment No: <b>' +
    a.sl +
    '</b><br>Registration No: <b>' +
    P.reg +
    '</b>' +
    (nw ? ' (use this next time)' : '') +
    '</p><p><b>' +
    esc(a.name) +
    '</b> with <b>' +
    esc(a.doc) +
    '</b><br>' +
    esc(a.hos) +
    '<br>Date: <b>' +
    a.date +
    '</b>' +
    (x[5] ? ' · ' + x[5] : '') +
    '</p><div class="acts"><button class="btn f" id="dpdf">' +
    ic('download') +
    ' Download PDF</button><button class="btn b" id="dprt">' +
    ic('printer') +
    ' Print</button></div>' +
    (MAIL.url && mailOf(a) ? '<p class="inf">A confirmation e-mail is being sent to <b>' + esc(mailOf(a)) + '</b>.</p>' : '') +
    '<p class="inf">Later use <b>' +
    ic('search') +
    ' Check Appointment</b> (Registration No. or mobile number) to see if it is confirmed and your final serial.</p><p class="warn" id="pnote"></p><button class="btn f" id="dn">' +
    ic('check') +
    ' Done</button></div>';
  $('dn').onclick = function () {
    shut('ovb');
    setPt('n');
  };
  // Download the slip as PDF, or print it (for patients who book from a computer shop)
  $('dpdf').onclick = function () {
    if (!pdfSlip(a))
      $('pnote').textContent =
        'The PDF library needs internet once. Use Print and choose "Save as PDF".';
  };
  $('dprt').onclick = function () {
    printSlip(a);
  };
};
// ---- link/hash: #appointment?department=..&doctor=.. opens a doctor directly ----
// Doctor number -> id used in the link
function docId(i) {
  return 'TG' + String(100100 + i);
}
// Put department + doctor in the page link
function setHash(i) {
  try {
    location.hash =
      'appointment?department=' +
      (uniq(
        D.map(function (x) {
          return x[2];
        }),
      ).indexOf(D[i][2]) +
        22) +
      '&doctor=' +
      docId(i);
  } catch (e) {}
}
// Read the link and open that doctor directly
function route() {
  var m = location.hash.match(/doctor=(TG\d+)/),
    on = $('ovb').classList.contains('on');
  if (m) {
    var i = +m[1].slice(2) - 100100;
    if (D[i] && !on) book(i);
  } else if (on) shut('ovb');
}
window.onhashchange = route;
route();
