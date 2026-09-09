// The dark-mode switch for the statically rendered pages — landing and FAQ, same reasoning as
// LangMenu (this directory): no client JS ships for these pages except this one control's, so
// there is no React state to render two different icons from. Both icons sit in the DOM at all
// times; `public/theme.js` sets `[data-theme]` on <html> before first paint (from localStorage,
// falling back to prefers-color-scheme) and flips it on click, and the same attribute that
// recolors the rest of the page also picks which icon shows (see `.theme-toggle*` rules in
// renderPage.mjs's ROOT_STYLE).
//
// Plain currentColor SVGs rather than the ☀️/🌙 emoji: emoji render in their own fixed colors
// (a yellow sun, a grey-blue moon) that clash with the site's muted off-white palette — these
// inherit the button's ink-soft color like every other icon on the page.
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M20.6 15.2A9 9 0 1 1 8.8 3.4a7.2 7.2 0 0 0 11.8 11.8Z" />
    </svg>
  );
}

export default function ThemeToggle({ label }: { label: string }) {
  return (
    <button type="button" className="theme-toggle" data-theme-toggle aria-label={label}>
      <span className="theme-toggle-icon theme-toggle-icon-light">
        <SunIcon />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-dark">
        <MoonIcon />
      </span>
    </button>
  );
}
