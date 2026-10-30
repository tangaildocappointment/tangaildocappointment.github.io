/* ===== ADMIN: login, password reset, confirm / cancel appointments, Excel, backup ===== */
// NOTE: this is a front-end demo. The password is saved only as a salted hash in this browser.
// A real system must check the login on a server.
var AK = 'fyd_admin', // storage key: admin account
  LK = 'fyd_lock', // storage key: wrong login attempts
  SK = 'fyd_sess', // session key: time of the last admin action
  QS = [
    "What is your first school's name?",
    "What is your mother's first name?",
    'What is the name of your first pet?',
    'In which city were you born?',
    "What is your favourite teacher's name?",
  ];

// ---------- small helpers ----------
function rj(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    return null;
  }
}
function wj(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}
// Random text used as salt
function rnd() {
  var b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.prototype.map
    .call(b, function (x) {
      return ('0' + x.toString(16)).slice(-2);
    })
    .join('');
}
// The password is never saved as plain text, only salted SHA-256
function hash(s) {
  if (window.crypto && crypto.subtle) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map
        .call(new Uint8Array(b), function (x) {
          return ('0' + x.toString(16)).slice(-2);
        })
        .join('');
    });
  }
  var h = 5381; // very old browsers only
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Promise.resolve(String(h));
}
// Is the admin logged in? sess(true) refreshes the time. A session ends after 15 minutes without action.
function sess(touch) {
  try {
    if (touch) sessionStorage.setItem(SK, Date.now());
    var t = +sessionStorage.getItem(SK);
    return !!t && Date.now() - t < 900000;
  } catch (e) {
    return false;
  }
}
// 5 wrong tries lock the login for 60 seconds
function lockLeft() {
  var l = rj(LK) || {};
  return l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0;
}
function fail() {
  var l = rj(LK) || {};
  l.n = (l.n || 0) + 1;
  if (l.n >= 5) {
    l.until = Date.now() + 60000;
    l.n = 0;
  }
  wj(LK, l);
}
function view(h) {
  $('abody').innerHTML = '<div class="ad">' + h + '</div>';
}
function err(m) {
  $('aerr').textContent = m;
}
function gv(i) {
  return $(i).value.trim();
}
function onEnter(ids, fn) {
  ids.forEach(function (i) {
    $(i).addEventListener('keydown', function (e) {
      if (e.key == 'Enter') fn();
    });
  });
}
function adminNote(m) {
  var e = $('anote');
  if (e) e.textContent = m;
}
// Own confirm window (the browser's confirm() can be blocked)
function ask(title, msg, yes, fn) {
  $('cq').textContent = title;
  $('cm').textContent = msg;
  $('cy').textContent = yes;
  $('cy').className = /delete/i.test(yes) ? 'btn dng s' : 'btn f';
  $('cy').onclick = function () {
    shut('cfm');
    fn();
  };
  $('cn').onclick = function () {
    shut('cfm');
  };
  open('cfm');
}

// ---------- screens ----------
// First time: create the admin account
function vSetup() {
  view(
    '<h2>Create admin account</h2><p class="inf">First time only. Only the admin should do this.</p><div class="g2"><div><label>Username</label><input id="au"></div><div></div><div><label>Password (min 6 characters)</label><input id="ap" type="password"></div><div><label>Confirm password</label><input id="ap2" type="password"></div><div><label>Security question (for a forgotten password)</label><select id="aq">' +
      QS.map(function (q) {
        return '<option>' + esc(q) + '</option>';
      }).join('') +
      '</select></div><div><label>Your answer</label><input id="aa"></div></div><p class="warn" id="aerr"></p><button class="btn f" id="ago">' +
      ic('check') +
      ' Create account</button>',
  );
  $('ago').onclick = function () {
    var u = gv('au'),
      p = $('ap').value,
      an = gv('aa').toLowerCase();
    if (u.length < 3) return err('Username must have at least 3 characters.');
    if (p.length < 6) return err('Password must have at least 6 characters.');
    if (p != $('ap2').value) return err('The two passwords are not the same.');
    if (!an) return err('Please write the answer of the security question.');
    var s = rnd(),
      s2 = rnd();
    Promise.all([hash(s + p), hash(s2 + an)]).then(function (h) {
      wj(AK, { u: u, s: s, h: h[0], q: $('aq').value, s2: s2, a: h[1] });
      sess(true);
      vPanel();
    });
  };
  onEnter(['au', 'ap', 'ap2', 'aa'], function () {
    $('ago').click();
  });
}
// Login
function vLogin() {
  view(
    '<h2>' +
      ic('shield') +
      ' Admin Login</h2><div class="g2"><div><label>Username</label><input id="au"></div><div><label>Password</label><input id="ap" type="password"></div></div><p class="warn" id="aerr"></p><div class="acts"><button class="btn f" id="ago">' +
      ic('lock') +
      ' Login</button><button class="btn o" id="afg">' +
      ic('key') +
      ' Forgot password?</button></div>',
  );
  var go = function () {
    var acc = rj(AK),
      n = lockLeft();
    if (n) return err('Too many wrong tries. Wait ' + n + ' seconds.');
    hash(acc.s + $('ap').value).then(function (h) {
      if (gv('au').toLowerCase() == acc.u.toLowerCase() && h == acc.h) {
        wj(LK, {});
        sess(true);
        vPanel();
      } else {
        fail();
        err(
          'Wrong username or password.' +
            (lockLeft() ? ' Locked for ' + lockLeft() + ' seconds.' : ''),
        );
      }
    });
  };
  $('ago').onclick = go;
  $('afg').onclick = vForgot;
  onEnter(['au', 'ap'], go);
}
// Forgot password: answer the security question, then choose a new password
function vForgot() {
  var acc = rj(AK);
  view(
    '<h2>Reset password</h2><p>Security question:<br><b>' +
      esc(acc.q) +
      '</b></p><div class="g2"><div><label>Your answer</label><input id="aa"></div><div></div><div><label>New password (min 6 characters)</label><input id="ap" type="password"></div><div><label>Confirm new password</label><input id="ap2" type="password"></div></div><p class="warn" id="aerr"></p><div class="acts"><button class="btn f" id="ago">' +
      ic('key') +
      ' Reset password</button><button class="btn b" id="aback">' +
      ic('chevl') +
      ' Back to login</button></div>',
  );
  $('aback').onclick = vLogin;
  $('ago').onclick = function () {
    var n = lockLeft();
    if (n) return err('Too many wrong tries. Wait ' + n + ' seconds.');
    if ($('ap').value.length < 6) return err('Password must have at least 6 characters.');
    if ($('ap').value != $('ap2').value) return err('The two passwords are not the same.');
    hash(acc.s2 + gv('aa').toLowerCase()).then(function (h) {
      if (h != acc.a) {
        fail();
        return err('The answer is wrong.');
      }
      var s = rnd();
      hash(s + $('ap').value).then(function (h2) {
        acc.s = s;
        acc.h = h2;
        wj(AK, acc);
        wj(LK, {});
        vLogin();
        err('Password changed. Please login with the new password.');
      });
    });
  };
}
// Change password (admin is logged in)
function vChange() {
  view(
    '<h2>Change password</h2><div class="g2"><div><label>Current password</label><input id="ap0" type="password"></div><div></div><div><label>New password (min 6 characters)</label><input id="ap" type="password"></div><div><label>Confirm new password</label><input id="ap2" type="password"></div></div><p class="warn" id="aerr"></p><div class="acts"><button class="btn f" id="ago">' +
      ic('save') +
      ' Save</button><button class="btn b" id="aback">' +
      ic('chevl') +
      ' Back</button></div>',
  );
  $('aback').onclick = vPanel;
  $('ago').onclick = function () {
    var acc = rj(AK);
    if ($('ap').value.length < 6) return err('Password must have at least 6 characters.');
    if ($('ap').value != $('ap2').value) return err('The two passwords are not the same.');
    hash(acc.s + $('ap0').value).then(function (h) {
      if (h != acc.h) return err('The current password is wrong.');
      var s = rnd();
      hash(s + $('ap').value).then(function (h2) {
        acc.s = s;
        acc.h = h2;
        wj(AK, acc);
        vPanel();
        adminNote('Password changed.');
      });
    });
  };
}

// ---------- the admin panel ----------
function vPanel() {
  var acc = rj(AK);
  view(
    '<div class="ahead"><h2>' +
      ic('shield') +
      ' Admin Panel</h2><span>Logged in as <b>' +
      esc(acc.u) +
      '</b></span><span class="sp"></span><button class="btn o" id="achg">' +
      ic('key') +
      ' Change password</button><button class="btn o" id="aout">' +
      ic('logout') +
      ' Logout</button></div><div class="stats" id="astat"></div><div class="bar"><button class="btn f" id="xl">' +
      ic('sheet') +
      ' Download Excel</button><button class="btn o" id="xb">' +
      ic('save') +
      ' Save Backup</button><button class="btn b" id="xr">' +
      ic('folder') +
      ' Restore Backup</button><input type="file" id="xf" accept=".json,application/json" hidden><button class="btn dng" id="xclr">' +
      ic('trash') +
      ' Clear all</button></div><p class="warn" id="anote"></p><div class="g3"><select id="fst"><option value="">All status</option><option value="pending" selected>Pending</option><option value="confirmed">Confirmed</option></select><input id="fdt" type="date"><input id="fq" placeholder="Search name, phone, Reg No, TG No, doctor..."></div><div id="alist"></div>',
  );
  $('achg').onclick = vChange;
  $('aout').onclick = function () {
    try {
      sessionStorage.removeItem(SK);
    } catch (e) {}
    shut('ova');
  };
  $('xl').onclick = function () {
    sess(true);
    exportExcel(adminNote);
  };
  $('xb').onclick = saveBackup;
  $('xr').onclick = function () {
    $('xf').value = '';
    $('xf').click();
  };
  $('xf').onchange = function () {
    var f = this.files[0];
    if (!f) return;
    ask(
      'Restore this backup?',
      mem.length
        ? 'This replaces ALL current appointments and patients.'
        : 'The backup will be loaded.',
      'Yes, restore',
      function () {
        restoreBackup(f, adminNote, adminList);
      },
    );
  };
  $('xclr').onclick = function () {
    ask(
      'Delete ALL appointments?',
      'Every appointment and every registered patient will be removed. This cannot be undone.',
      'Yes, delete all',
      function () {
        mem.length = 0;
        pts.length = 0;
        js('fyd_appts', mem);
        js('fyd_pts', pts);
        adminList();
        adminNote('All data deleted.');
      },
    );
  };
  ['fst', 'fdt', 'fq'].forEach(function (i) {
    $(i).addEventListener('input', adminList);
    $(i).addEventListener('change', adminList);
  });
  $('alist').onclick = function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    sess(true);
    var a = mem.filter(function (x) {
      return x.sl == b.dataset.sl;
    })[0];
    if (!a) return;
    if (b.dataset.act == 'prt') printSlip(a);
    else if (b.dataset.act == 'pdf') {
      if (!pdfSlip(a))
        adminNote('The PDF library needs internet once. Use Print and choose "Save as PDF".');
    } else if (b.dataset.act == 'ok') confirmAppt(a);
    else if (b.dataset.act == 'del') cancelAppt(a);
  };
  adminList();
}

// Confirm: permanent, cannot be changed or cancelled afterwards
function confirmAppt(a) {
  if (a.status == 'confirmed') return;
  ask(
    'Confirm this appointment?',
    a.name +
      ' with ' +
      a.doc +
      ' on ' +
      a.date +
      '. Confirming is permanent: it cannot be changed or cancelled later.',
    'Yes, confirm',
    function () {
      a.status = 'confirmed';
      a.cat = new Date().toLocaleString('en-GB');
      js('fyd_appts', mem);
      sendMail(a, 'confirmed'); // 2nd e-mail: confirmed + final serial
      adminList();
    },
  );
}
// Cancel: the appointment is deleted completely and the patients after it move up by one
// (their serial number and their TG number get smaller by 1, see removeAppt in storage.js).
function cancelAppt(a) {
  if (a.status == 'confirmed') return;
  ask(
    'Cancel and delete this appointment?',
    a.name +
      ' with ' +
      a.doc +
      ' on ' +
      a.date +
      ' (' +
      a.sl +
      ', serial ' +
      pad(a.sn) +
      ') will be deleted completely. The patients after this one move up by one: their serial numbers (same doctor, same date) and their TG numbers become 1 smaller.',
    'Yes, delete',
    function () {
      removeAppt(a);
      adminList();
    },
  );
}

// Draw the numbers and the appointment cards (with the filters)
function adminList() {
  var all = xrecs().map(function (o) {
      return o.a;
    }),
    st = $('fst').value,
    dt = $('fdt').value,
    q = $('fq').value.trim().toLowerCase(),
    pend = all.filter(function (a) {
      return a.status != 'confirmed';
    }).length;
  $('astat').innerHTML =
    '<div class="stat"><b>' +
    all.length +
    '</b>Total booked</div><div class="stat"><b>' +
    pend +
    '</b>Pending</div><div class="stat"><b>' +
    (all.length - pend) +
    '</b>Confirmed</div>';
  var list = all.filter(function (a) {
    var c = a.status == 'confirmed' ? 'confirmed' : 'pending';
    return (
      (!st || st == c) &&
      (!dt || a.date == dt) &&
      (!q ||
        [a.name, a.phone, a.reg, a.sl, a.doc, a.hos, a.dep].join(' ').toLowerCase().indexOf(q) > -1)
    );
  });
  $('alist').innerHTML = list.length
    ? list
        .map(function (a) {
          var c = a.status == 'confirmed',
            sl = esc(a.sl);
          return (
            '<div class="ac' +
            (c ? ' ok' : '') +
            '"><div class="ah1"><b>' +
            sl +
            '</b><span class="sr">Serial No: ' +
            pad(a.sn) +
            '</span><span class="bd ' +
            (c ? 'bc' : 'bp') +
            '">' +
            (c ? ic('checkc') + ' Confirmed' : ic('hourglass') + ' Pending') +
            '</span></div><div>' +
            ic('calendar') +
            ' ' +
            esc(a.date) +
            (a.time ? ' · ' + esc(a.time) : '') +
            '</div><div>' +
            ic('steth') +
            ' ' +
            esc(a.doc) +
            ' (' +
            esc(a.dep) +
            ')</div><div>' +
            ic('hospital') +
            ' ' +
            esc(a.hos || '-') +
            '</div><div>' +
            ic('user') +
            ' <b>' +
            esc(a.name) +
            '</b> · <a href="tel:' +
            esc(String(a.phone || '').replace(/[^0-9+]/g, '')) +
            '">' +
            ic('phone') +
            ' ' +
            esc(a.phone || '-') +
            '</a> · Reg: ' +
            esc(a.reg || '-') +
            '</div><div class="mut">' +
            esc(a.type || '') +
            ' · booked ' +
            esc(a.at || '') +
            (c && a.cat ? ' · confirmed ' + esc(a.cat) : '') +
            '</div><div class="acts">' +
            (c
              ? '<span class="lock">' + ic('lock') + ' Confirmed permanently</span>'
              : '<button class="btn f" data-act="ok" data-sl="' +
                sl +
                '">' +
                ic('check') +
                ' Confirm</button><button class="btn dng" data-act="del" data-sl="' +
                sl +
                '">' +
                ic('x') +
                ' Cancel</button>') +
            '<button class="btn b" data-act="prt" data-sl="' +
            sl +
            '">' +
            ic('printer') +
            ' Print</button><button class="btn b" data-act="pdf" data-sl="' +
            sl +
            '">' +
            ic('pdf') +
            ' PDF</button></div></div>'
          );
        })
        .join('')
    : '<p class="inf">No appointments here.</p>';
}

// ---------- the Admin button on the first page ----------
$('adm').onclick = function () {
  if (!rj(AK)) vSetup();
  else if (sess(false)) {
    sess(true);
    vPanel();
  } else vLogin();
  open('ova');
};
