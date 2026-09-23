// Loops over whatever data-<code>-target attributes renderPage.mjs put on this script tag,
// instead of one hardcoded `else if` per language — a new language needs no edit here, only
// a new dataset entry from renderPage.mjs's langRedirectTargets (itself derived from LANGS).
var lang = navigator.language.toLowerCase();
var dataset = document.currentScript.dataset;
for (var key in dataset) {
  var match = /^(.+)Target$/.exec(key);
  if (match && lang.startsWith(match[1])) {
    location.replace(dataset[key]);
    break;
  }
}
