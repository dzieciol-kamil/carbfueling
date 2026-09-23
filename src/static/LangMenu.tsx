// The language switch for the statically rendered pages — landing and FAQ. It looks like the
// calculator's dropdown (Header.tsx) but works differently underneath: those pages ship no
// client JS at all, so there is no state to open the panel with. <details>/<summary> is the
// one native control that opens on its own, and each choice is a plain link to the other
// language's URL rather than a store write. Its styling lives in renderPage.mjs's ROOT_STYLE,
// the stylesheet every static page already carries, because both pages need the same widget.
//
// One difference from the calculator's menu that no markup can fix: with no script there is
// nothing to close the panel when the reader clicks elsewhere. Clicking an entry navigates
// away, which is the only thing anyone opens it for.
export default function LangMenu<Code extends string>({
  langs,
  current,
  hrefFor,
  labelFor,
}: {
  /** The full set of languages to list, in display order. */
  langs: readonly Code[];
  current: Code;
  /** Where each language's entry points — the same page in that language. */
  hrefFor: (lang: Code) => string;
  /** Short code + full name shown for a given language — kept as a prop rather than an
   *  internal lookup so this component doesn't have to know the label text itself: landing
   *  pages resolve it via `i18n/strings.ts`'s `t()`, FAQ pages via their own local map in
   *  `FaqLayout.tsx` (its chrome copy, not the calculator's `StringTable`). */
  labelFor: (lang: Code) => { short: string; name: string };
}) {
  const c = labelFor(current);
  return (
    <details className="lang-menu">
      <summary>
        <span className="lang-menu-code">{c.short}</span>
        <span className="lang-menu-name">{c.name}</span>
        <span className="lang-menu-caret">▾</span>
      </summary>
      <div className="lang-menu-list">
        {langs.map((code) => {
          const l = labelFor(code);
          return (
            <a
              key={code}
              href={hrefFor(code)}
              hrefLang={code}
              className={code === current ? 'is-current' : undefined}
            >
              <span className="lang-menu-code">{l.short}</span>
              <span className="lang-menu-name">{l.name}</span>
              <span className="lang-menu-check">✓</span>
            </a>
          );
        })}
      </div>
    </details>
  );
}
