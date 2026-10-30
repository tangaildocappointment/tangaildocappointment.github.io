/* ===== STORAGE: all data is saved in the browser (localStorage) ===== */
// mem = list of appointments, pts = list of registered patients
var mem = jl('fyd_appts'),
  pts = jl('fyd_pts');
// Older bookings that have no registration number get one here
mem.forEach(function (a) {
  if (!a.reg && a.type == 'New Patient') {
    var r = 'R' + (10003 + pts.length);
    pts.push({ reg: r, nm: a.name, ph: a.phone });
    a.reg = r;
  }
});
var sc = {};
mem.forEach(function (a) {
  var k = a.doc + '|' + (a.hos || '') + '|' + a.date;
  sc[k] = (sc[k] || 0) + 1;
  if (!a.sn) a.sn = sc[k];
});
mem.forEach(function (a) {
  if (!a.status) a.status = 'pending'; // pending = waiting for the admin to confirm
});
js('fyd_appts', mem);
js('fyd_pts', pts);
// Read a list from localStorage (empty list if nothing saved)
function jl(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || '[]');
  } catch (e) {
    return [];
  }
}
// Write a list to localStorage
function js(k, a) {
  try {
    localStorage.setItem(k, JSON.stringify(a));
  } catch (e) {}
}
// Add one appointment and save
function save(a) {
  mem.push(a);
  js('fyd_appts', mem);
}
// Next appointment (TG) number: the smallest number that is free (= total booked + 1)
function nextTG() {
  var used = {};
  mem.forEach(function (a) {
    used[parseInt(String(a.sl).replace(/\D/g, ''), 10)] = 1;
  });
  var n = 1001;
  while (used[n]) n++;
  return 'TG-' + n;
}
// Next serial number of a doctor on a date: the smallest number that is free
function nextSerial(x, d) {
  var used = {};
  mem.forEach(function (a) {
    if (a.doc == x[1] && (!a.hos || a.hos == x[0]) && a.date == d) used[a.sn] = 1;
  });
  var n = 1;
  while (used[n]) n++;
  return n;
}
// Number part of a TG number: "TG-1004" -> 1004
function tgNum(sl) {
  return parseInt(String(sl).replace(/\D/g, ''), 10);
}
// Cancel (delete) an appointment. The patients AFTER it move up by one:
//  - serial number: same doctor, same hospital, same date, bigger serial -> serial - 1
//  - TG number: every bigger TG number -> TG number - 1
function removeAppt(a) {
  var n = tgNum(a.sl);
  mem.splice(mem.indexOf(a), 1);
  mem.forEach(function (b) {
    if (b.doc == a.doc && (b.hos || '') == (a.hos || '') && b.date == a.date && b.sn > a.sn) b.sn--;
    if (tgNum(b.sl) > n) b.sl = 'TG-' + (tgNum(b.sl) - 1);
  });
  js('fyd_appts', mem);
}
