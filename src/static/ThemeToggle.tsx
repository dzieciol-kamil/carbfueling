// The dark-mode switch for the statically rendered pages — landing and FAQ, same reasoning as
// LangMenu (this directory): no client JS ships for these pages except this one control's, so
// there is no React state to render two different icons from. Both icons sit in the DOM at all
// times; `public/theme.js` sets `[data-theme]` on <html> before first paint (from localStorage,
// falling back to prefers-color-scheme) and flips it on click, and the same attribute that
// recolors the rest of the page also picks which icon shows (see `.theme-toggle*` rules in
// renderPage.mjs's ROOT_STYLE).
export default function ThemeToggle({ label }: { label: string }) {
  return (
    <button type="button" className="theme-toggle" data-theme-toggle aria-label={label}>
      <span className="theme-toggle-icon theme-toggle-icon-light">☀️</span>
      <span className="theme-toggle-icon theme-toggle-icon-dark">🌙</span>
    </button>
  );
}
