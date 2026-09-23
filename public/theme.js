(function () {
  var APP_KEY = 'carbfueling';
  // Kept in sync by hand with appStore.ts's persist `version` — this script has no access to
  // that module. A mismatch just means the app's own `migrate` runs once on next load, which
  // is written to tolerate partial/missing fields already, so this is a soft coupling.
  var APP_VERSION = 5;
  var MODES = ['auto', 'light', 'dark'];

  function readThemeMode() {
    try {
      var raw = localStorage.getItem(APP_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var mode = parsed && parsed.state && parsed.state.ui && parsed.state.ui.themeMode;
        if (MODES.indexOf(mode) !== -1) return mode;
      }
    } catch (e) {}
    return 'auto';
  }

  // Writes into the SAME localStorage entry the calculator's zustand store persists to, so a
  // choice made here is what the calculator sees on its next load too (and vice versa) —
  // otherwise setting dark here and opening the calculator right after hits daylight.
  function writeThemeMode(mode) {
    try {
      var raw = localStorage.getItem(APP_KEY);
      var parsed = raw ? JSON.parse(raw) : { state: {}, version: APP_VERSION };
      parsed.state = parsed.state || {};
      parsed.state.ui = parsed.state.ui || {};
      parsed.state.ui.themeMode = mode;
      localStorage.setItem(APP_KEY, JSON.stringify(parsed));
    } catch (e) {}
  }

  function resolve(mode) {
    return mode === 'auto'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  }

  function apply(mode) {
    document.documentElement.dataset.theme = resolve(mode);
    document.documentElement.dataset.themeMode = mode;
  }

  apply(readThemeMode());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = MODES[(MODES.indexOf(readThemeMode()) + 1) % MODES.length];
      writeThemeMode(next);
      apply(next);
    });
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (readThemeMode() === 'auto') apply('auto');
  });
})();
