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
import { LANGS, t, type Lang } from '../i18n/strings';

export default function LangMenu({
  lang,
  hrefFor,
}: {
  lang: Lang;
  /** Where each language's entry points — the same page in that language. */
  hrefFor: (lang: Lang) => string;
}) {
  return (
    <details className="lang-menu">
      <summary>
        <span className="lang-menu-code">{t(lang).langShort}</span>
        <span className="lang-menu-name">{t(lang).langName}</span>
        <span className="lang-menu-caret">▾</span>
      </summary>
      <div className="lang-menu-list">
        {LANGS.map((code) => (
          <a
            key={code}
            href={hrefFor(code)}
            hrefLang={code}
            className={code === lang ? 'is-current' : undefined}
          >
            <span className="lang-menu-code">{t(code).langShort}</span>
            <span className="lang-menu-name">{t(code).langName}</span>
            <span className="lang-menu-check">✓</span>
          </a>
        ))}
      </div>
    </details>
  );
}
