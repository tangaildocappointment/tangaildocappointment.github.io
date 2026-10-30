/* ===== MAIN: starts the page ===== */
// Light / dark button (the icon changes: moon <-> sun)
function isDark() {
  var r = document.documentElement;
  return (
    r.dataset.theme == 'dark' ||
    (!r.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches)
  );
}
function themeIcon() {
  $('tg').innerHTML = ic(isDark() ? 'sun' : 'moon');
  $('tg').classList.toggle('sun', isDark());
}
$('tg').onclick = function () {
  document.documentElement.dataset.theme = isDark() ? 'light' : 'dark';
  themeIcon();
};
themeIcon();
// Show all doctors when the page opens
render();

// Footer year
(function () {
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
