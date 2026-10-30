/* ===== DROPDOWN: one reusable "Select or Search" dropdown used on every page ===== */
var CBS = {};
// Build a "Select or Search" dropdown inside <div id="c_ID">.
// opts() gives the options, pk(value, text) is called when something is chosen.
// {free:1} = the typed text itself is the value (used by the Find page filters).
function CB(id, ph, opts, pk, o2) {
  o2 = o2 || {};
  var h = $('c_' + id);
  h.className = 'cb';
  h.innerHTML =
    '<input id="' +
    id +
    '" placeholder="' +
    ph +
    '" autocomplete="off"><button type="button" class="cc" hidden>' +
    ic('x') +
    '</button><span class="ar"></span><div class="lst" hidden></div>';
  var inp = h.children[0],
    cc = h.children[1],
    ar = h.children[2],
    lst = h.children[3],
    cv = { v: '', t: '' },
    hl = -1,
    arr = [];
  function draw(q) {
    arr = opts().filter(function (x) {
      return !q || x.t.toLowerCase().indexOf(q.toLowerCase()) > -1;
    });
    hl = -1;
    lst.innerHTML = arr.length
      ? arr
          .map(function (x, i) {
            return (
              '<div class="op' +
              (cv.v !== '' && x.v === cv.v ? ' sl' : '') +
              '" data-i="' +
              i +
              '">' +
              esc(x.t) +
              '</div>'
            );
          })
          .join('')
      : '<div class="no">No options</div>';
    lst.hidden = false;
    h.classList.add('open');
  }
  function close() {
    lst.hidden = true;
    h.classList.remove('open');
  }
  function sync() {
    var e = !(o2.free || cv.v === '');
    cc.hidden = !e;
    h.classList.toggle('has', e);
  }
  function choose(x) {
    cv = { v: x.v, t: x.t };
    inp.value = x.t;
    close();
    sync();
    pk(x.v, x.t);
  }
  inp.onfocus = function () {
    draw('');
  };
  inp.oninput = function () {
    draw(inp.value);
    if (o2.free) pk(inp.value, inp.value);
  };
  inp.onblur = function () {
    close();
    if (!o2.free) inp.value = cv.t;
  };
  inp.onkeydown = function (e) {
    var n = lst.querySelectorAll('.op');
    if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
      e.preventDefault();
      if (lst.hidden) draw('');
      n = lst.querySelectorAll('.op');
      hl = Math.max(0, Math.min(n.length - 1, hl + (e.key == 'ArrowDown' ? 1 : -1)));
      n.forEach(function (z, i) {
        z.classList.toggle('hl', i == hl);
      });
      if (n[hl]) n[hl].scrollIntoView({ block: 'nearest' });
    } else if (e.key == 'Enter') {
      if (!lst.hidden && hl > -1 && arr[hl]) {
        e.preventDefault();
        choose(arr[hl]);
      }
    } else if (e.key == 'Escape') close();
  };
  lst.onmousedown = function (e) {
    e.preventDefault();
    var d = e.target.closest('.op');
    if (d) choose(arr[+d.dataset.i]);
  };
  ar.onmousedown = function (e) {
    e.preventDefault();
    if (lst.hidden) {
      inp.focus();
      draw('');
    } else close();
  };
  cc.onmousedown = function (e) {
    e.preventDefault();
    cv = { v: '', t: '' };
    inp.value = '';
    sync();
    pk('', '');
    inp.focus();
    draw('');
  };
  CBS[id] = {
    set: function (v, t) {
      cv = { v: v, t: t };
      inp.value = t;
      sync();
    },
    v: function () {
      return cv.v;
    },
  };
}
