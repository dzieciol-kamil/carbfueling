// Cleans utm_* params from the address bar after GoatCounter (count.js) has
// recorded them. `load` fires only once every discovered script — including
// count.js, which is `async` — has finished executing, so this always runs
// after the pageview with the UTM query string was already sent.
window.addEventListener('load', function () {
  var url = new URL(location.href);
  var changed = false;
  Array.prototype.slice.call(url.searchParams.keys()).forEach(function (key) {
    if (key.toLowerCase().indexOf('utm_') === 0) {
      url.searchParams.delete(key);
      changed = true;
    }
  });
  if (changed) history.replaceState(null, '', url.pathname + url.search + url.hash);
});
