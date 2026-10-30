/* ===== UTILS: small helper functions used everywhere ===== */
var $ = function (i) {
  return document.getElementById(i);
};
// Escape text before putting it inside HTML (stops broken markup / XSS)
function esc(s) {
  var d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}
// Visit days (digits 0=Sun ... 6=Sat, 'a' = every day, 'u' = not specified) -> readable text
var DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function DD(k) {
  if (k == 'u') return 'Schedule not specified';
  if (k == 'a' || k.length == 7) return 'Every Day';
  var wk = [6, 0, 1, 2, 3, 4, 5]; // Bangladesh week: Saturday first
  if (k.length == 1) return 'Every ' + DN[k];
  if (k.length == 6) {
    return (
      'Every Day except ' +
      DN[
        wk.filter(function (x) {
          return k.indexOf(x) < 0;
        })[0]
      ]
    );
  }
  var d = wk.filter(function (x) {
      return k.indexOf(x) > -1;
    }),
    runs = [[d[0]]];
  for (var i = 1; i < d.length; i++) {
    var r = runs[runs.length - 1];
    if (wk.indexOf(d[i]) == wk.indexOf(r[r.length - 1]) + 1) r.push(d[i]);
    else runs.push([d[i]]);
  }
  return runs
    .map(function (r) {
      return r.length >= 3
        ? DN[r[0]] + ' to ' + DN[r[r.length - 1]]
        : r
            .map(function (x) {
              return DN[x];
            })
            .join(', ');
    })
    .join(', ');
}
// Does this doctor sit on week day w (0 = Sunday ... 6 = Saturday)?
function isDay(k, w) {
  return k == 'a' || k == 'u' || k.indexOf(w) > -1;
}
// Doctor name for dropdowns: adds the hospital when the same name is in more than one hospital
function dlab(i) {
  var n = D[i][1];
  return D.filter(function (x) {
    return x[1] == n;
  }).length > 1
    ? n + ' (' + D[i][0] + ')'
    : n;
}
// Designation (Professor...) from the start of the doctor's name
function des(n) {
  return /^Assoc/.test(n)
    ? 'Associate Professor'
    : /^Asst/.test(n)
      ? 'Assistant Professor'
      : /^Prof/.test(n)
        ? 'Professor'
        : /^Lt/.test(n)
          ? 'Lt. Col. & Consultant'
          : 'Consultant';
}
// Unique + sorted values (used to build dropdown lists)
function uniq(a) {
  return a
    .filter(function (v, i) {
      return a.indexOf(v) == i;
    })
    .sort();
}
// Case-insensitive substring match: the heart of the search
function match(v, q) {
  return !q || v.toLowerCase().indexOf(q.toLowerCase()) > -1;
}
// Turn ['a','b'] into [{v:'a',t:'a'}, ...] option objects for the dropdown
function O(a) {
  return a.map(function (s) {
    return { v: s, t: s };
  });
}
// Today's date without the time
function today() {
  var t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
// Date -> "yyyy-mm-dd" text
function iso(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
// 1 -> "01" (serial numbers)
function pad(n) {
  return String(n).padStart(2, '0');
}
// Show a popup / page
function open(id) {
  $(id).classList.add('on');
}
// Hide a popup / page
function shut(id) {
  $(id).classList.remove('on');
  if (id == 'ovb' && location.hash) location.hash = '';
}
document.querySelectorAll('.x').forEach(function (b) {
  b.onclick = function () {
    shut(b.dataset.c);
  };
});

// SVG icon from the drawings at the top of index.html, e.g. ic('lock')
function ic(n) {
  return '<svg class="ic"><use href="#i-' + n + '"></use></svg>';
}
