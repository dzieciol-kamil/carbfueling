// The dark-mode switch for the statically rendered pages — landing and FAQ, same reasoning as
// LangMenu (this directory): no client JS ships for these pages except this one control's, so
// there is no React state to render three different icons from. All three sit in the DOM at all
// times; `public/theme.js` sets [data-theme] (the resolved light/dark, for colors) and
// [data-theme-mode] (the raw auto/light/dark preference, for which icon shows) on <html>, and
// cycles auto -> light -> dark -> auto on click. It reads/writes the same localStorage entry
// the calculator's zustand store persists to (`carbfueling`), so a choice made here is what the
// calculator sees too.
//
// Plain currentColor SVGs rather than emoji: emoji render in their own fixed colors (a yellow
// sun, a grey-blue moon) that clash with the site's muted off-white palette — these inherit the
// button's ink-soft color like every other icon on the page.
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M20.6 15.2A9 9 0 1 1 8.8 3.4a7.2 7.2 0 0 0 11.8 11.8Z" />
    </svg>
  );
}

// Half sun, half moon, split by the diagonal running from the top-right corner to the
// bottom-left one — both the dividing line and the two clip regions use that same
// diagonal, so the line actually sits on the sun/moon boundary instead of crossing it.
// The gap around the line isn't cut into the artwork itself: a thick stroke in the
// button's own background color runs along the line first, erasing whatever of the sun
// or moon fell under it, and the thin visible line is drawn on top of that — image, gap,
// line, gap, image, however the icons happen to be shaped.
function AutoIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden="true">
      <defs>
        <clipPath id="theme-auto-moon-clip">
          <path d="M0 0H24L0 24Z" />
        </clipPath>
        <clipPath id="theme-auto-sun-clip">
          <path d="M24 0V24H0Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#theme-auto-moon-clip)">
        <path
          d="M20.6 15.2A9 9 0 1 1 8.8 3.4a7.2 7.2 0 0 0 11.8 11.8Z"
          fill="currentColor"
          transform="translate(0 -1)"
        />
      </g>
      <g clipPath="url(#theme-auto-sun-clip)">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M19.1 12h2.4M17.9 17.9l1.7 1.7M12 19.1v2.4M17.9 6.1l1.7-1.7" />
        </g>
      </g>
      <line x1="24" y1="0" x2="0" y2="24" stroke="var(--surface)" strokeWidth={4} />
      <line x1="24" y1="0" x2="0" y2="24" stroke="currentColor" strokeWidth={1} opacity={0.55} />
    </svg>
  );
}

export default function ThemeToggle({ label }: { label: string }) {
  return (
    <button type="button" className="theme-toggle" data-theme-toggle aria-label={label}>
      <span className="theme-toggle-icon theme-toggle-icon-auto">
        <AutoIcon />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-light">
        <SunIcon />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-dark">
        <MoonIcon />
      </span>
    </button>
  );
}
