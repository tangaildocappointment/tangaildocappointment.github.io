/* ===== FINDER PAGE: filters, doctor cards, scroll animation, profile popup ===== */
// Filter doctors: every filled box must match (AND)
function filt() {
  var h = $('fh').value.trim(),
    d = $('fd').value.trim(),
    s = $('fs').value.trim(),
    n = $('fn').value.trim();
  return D.map(function (x, i) {
    return { i: i, x: x };
  }).filter(function (o) {
    var x = o.x;
    return match(x[0], h) && match(x[2], d) && match(x[3], s) && match(x[1], n);
  });
}
// Draw the doctor cards for the filtered list
function render() {
  var r = filt();
  $('cnt').textContent = r.length + ' doctor' + (r.length == 1 ? '' : 's') + ' found';
  $('grid').innerHTML = r.length
    ? r
        .map(function (o) {
          var x = o.x;
          return (
            '<div class="dc"><div class="av"><img src="images/doctor.png" alt="' +
            esc(x[1]) +
            '"></div><h4>' +
            esc(x[1]) +
            '</h4><div class="d">' +
            des(x[1]) +
            '</div><div class="dep">' +
            esc(x[2]) +
            '</div><div class="sp">' +
            esc(x[0]) +
            '</div><div class="v"><b>Visit:</b> ' +
            DD(x[4]) +
            (x[5] ? ' (' + x[5] + ')' : '') +
            '</div><div class="row"><button class="btn f" data-a="' +
            o.i +
            '">' +
            ic('calplus') +
            ' Appoinment</button><button class="btn b" data-p="' +
            o.i +
            '">' +
            ic('user') +
            ' Profile</button></div></div>'
          );
        })
        .join('')
    : '<p style="grid-column:1/-1;text-align:center;color:var(--mut)">No doctor matches your search.</p>';
  reveal();
}
var io = null,
  ao = null;
// Cards slide in one after another every time they enter the screen (IntersectionObserver)
function reveal() {
  var cs = document.querySelectorAll('.dc');
  if (
    !('IntersectionObserver' in window) ||
    matchMedia('(prefers-reduced-motion:reduce)').matches
  ) {
    cs.forEach(function (c) {
      c.classList.add('in');
    });
    return;
  }
  if (io) io.disconnect();
  if (ao) ao.disconnect();
  io = new IntersectionObserver(
    function (es) {
      var k = 0;
      es.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.12) {
          clearTimeout(el._t);
          if (!el.classList.contains('in'))
            el._t = setTimeout(function () {
              el.classList.add('in');
            }, k++ * 120);
        } else if (!e.isIntersecting) {
          clearTimeout(el._t);
          el.classList.remove('in');
        }
      });
    },
    { threshold: [0, 0.12], rootMargin: '0px 0px -6% 0px' },
  );
  ao = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('act', e.isIntersecting);
      });
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  cs.forEach(function (c) {
    io.observe(c);
    ao.observe(c);
  });
}
$('grid').onclick = function (e) {
  var b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.p != null) prof(+b.dataset.p);
  if (b.dataset.a != null) book(+b.dataset.a);
};
// Profile popup of one doctor
function prof(i) {
  var x = D[i];
  $('prof').innerHTML =
    '<div class="av"><img src="images/doctor.png" alt="' +
    esc(x[1]) +
    '"></div><h3 style="text-align:center">' +
    esc(x[1]) +
    '</h3><p style="text-align:center;color:var(--mut)">' +
    des(x[1]) +
    '</p><p><b>Hospital:</b> ' +
    esc(x[0]) +
    '</p><p><b>Department:</b> ' +
    esc(x[2]) +
    '</p><p><b>Speciality:</b> ' +
    esc(x[3]) +
    '</p><p><b>Visit Day:</b> ' +
    DD(x[4]) +
    '</p><p><b>Visit Time:</b> ' +
    (x[5] || 'Please call the hospital to confirm') +
    '</p><button class="btn f" style="width:100%" id="pb">' +
    ic('calplus') +
    ' Book Appointment</button>';
  open('ovp');
  $('pb').onclick = function () {
    shut('ovp');
    book(i);
  };
}
// ---- Find page dropdowns (hospital > department > speciality, or doctor name) ----
// Called when a filter box changes: clears the other mode, then redraws the cards
function FP(id) {
  return function (v, t) {
    if (t) {
      if (id == 'fn')
        ['fh', 'fd', 'fs'].forEach(function (k) {
          CBS[k].set('', '');
        });
      else CBS.fn.set('', '');
    }
    render();
  };
}
CB(
  'fh',
  'Select or Search Hospital',
  function () {
    return O(
      uniq(
        D.map(function (x) {
          return x[0];
        }),
      ),
    );
  },
  FP('fh'),
  { free: 1 },
);
CB(
  'fd',
  'Select or Search Department',
  function () {
    var h = $('fh').value.trim();
    return O(
      uniq(
        D.filter(function (x) {
          return match(x[0], h);
        }).map(function (x) {
          return x[2];
        }),
      ),
    );
  },
  FP('fd'),
  { free: 1 },
);
CB(
  'fs',
  'Select or Search Speciality',
  function () {
    var h = $('fh').value.trim(),
      d = $('fd').value.trim();
    return O(
      uniq(
        D.filter(function (x) {
          return match(x[0], h) && match(x[2], d);
        }).map(function (x) {
          return x[3];
        }),
      ),
    );
  },
  FP('fs'),
  { free: 1 },
);
CB(
  'fn',
  'Search Doctor by Name',
  function () {
    return O(
      uniq(
        D.map(function (x) {
          return x[1];
        }),
      ),
    );
  },
  FP('fn'),
  { free: 1 },
);
$('clr').onclick = function () {
  ['fh', 'fd', 'fs', 'fn'].forEach(function (k) {
    CBS[k].set('', '');
  });
  render();
};
