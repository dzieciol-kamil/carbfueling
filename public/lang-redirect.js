var lang = navigator.language.toLowerCase();
if (lang.startsWith('pl')) {
  location.replace(document.currentScript.dataset.plTarget);
} else if (lang.startsWith('de')) {
  location.replace(document.currentScript.dataset.deTarget);
}
