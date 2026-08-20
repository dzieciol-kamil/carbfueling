export const SITE = 'https://carbfueling.com';

const ROOT_STYLE = `
  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('__BASE__/fonts/archivo-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
      U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('__BASE__/fonts/archivo-latin-ext.woff2') format('woff2');
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329,
      U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('__BASE__/fonts/jetbrains-mono-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
      U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('__BASE__/fonts/jetbrains-mono-latin-ext.woff2') format('woff2');
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329,
      U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  :root { --ink:#16191c; --bg:#eff0ec; --surface:#fff; --border:#e3e5e0; --border-soft:#edefea;
    --chip-border:#dde0da; --muted:#7a817c; --muted-2:#6e7573; --muted-3:#9aa09b;
    --ink-soft:#3d423e; --carb:#5aa33f; --gel:#c9922e; --food:#b4552f; --water:#3d8fbf; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Archivo', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased; }
  a { color: var(--water); text-decoration: none; }
  a:hover { color: #2f7099; }

  /* Language switch, shared by the landing and the FAQ pages (src/static/LangMenu.tsx).
     Shaped to match the calculator's own dropdown in Header.tsx — the values below are that
     component's inline styles — but built on <details>, since these pages ship no script to
     open a panel with. It lives in this stylesheet rather than in a page's own <style> block
     because two different page types render the same widget. */
  .lang-menu { position: relative; }
  .lang-menu > summary {
    display: flex; align-items: center; gap: 8px; cursor: pointer; list-style: none;
    border: 1px solid var(--chip-border); background: #fff; border-radius: 999px;
    padding: 7px 13px; color: var(--ink);
  }
  .lang-menu > summary::-webkit-details-marker { display: none; }
  .lang-menu[open] > summary { border-color: var(--ink); }
  .lang-menu-code { font-family: 'JetBrains Mono', monospace; font-size: 11px;
    font-weight: 700; letter-spacing: 0.06em; }
  .lang-menu > summary .lang-menu-name { font-size: 12px; color: var(--muted); }
  .lang-menu-caret { font-size: 9px; color: var(--muted-3); }
  .lang-menu-list {
    display: flex; flex-direction: column; gap: 2px;
    position: absolute; top: calc(100% + 6px); right: 0; min-width: 178px;
    background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 6px;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.14); z-index: 60;
  }
  .lang-menu-list a { display: flex; align-items: center; gap: 9px; border-radius: 8px;
    padding: 8px 10px; color: var(--ink); }
  .lang-menu-list a.is-current { background: #f2f5ef; }
  .lang-menu-list .lang-menu-code { flex: 0 0 22px; letter-spacing: normal; }
  .lang-menu-list .lang-menu-name { font-size: 12.5px; font-weight: 500; }
  .lang-menu-check { margin-left: auto; font-size: 11px; color: var(--carb);
    visibility: hidden; }
  .lang-menu-list a.is-current .lang-menu-check { visibility: visible; }

  /* The FAQ pages carry the landing's opening photograph, held still behind the article:
     fixed, so it never scrolls with the text, and washed over the reading column so the
     prose keeps its contrast. The wash is a band as wide as the column plus slack rather
     than a percentage of the viewport, so it covers the text at every window width; below
     ~860px both its stops fall off the edges and the whole screen washes over, which is
     what a phone should get. */
  /* The FAQ header's padding and its button group's gap live here rather than in the inline
     styles the rest of that bar uses, for one reason: the phone rules below have to be able
     to override them, and an inline style beats a stylesheet rule. Keeping them here is what
     makes the two headers land in the same place on a phone as they do on a desktop. */
  .faq-header { padding: 0 32px; }
  .faq-actions { display: flex; align-items: center; gap: 10px; }

  .faq-bg {
    position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0;
    object-fit: cover; object-position: center center;
    opacity: 0.5; filter: saturate(0.7) contrast(0.98); pointer-events: none;
  }
  .faq-wash {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: linear-gradient(90deg,
      rgba(239, 240, 236, 0) 0%,
      rgba(239, 240, 236, 0.86) calc(50% - 430px),
      rgba(239, 240, 236, 0.86) calc(50% + 430px),
      rgba(239, 240, 236, 0) 100%);
  }

  /* The band just above the phone breakpoint: the desktop bar still applies but no longer fits,
     and the tagline drops there on the landing too. Kept in step so the two headers still match
     across the whole range. The wordmark and the button hold their line at every width. */
  @media (min-width: 761px) and (max-width: 800px) {
    .faq-tagline { display: none; }
  }
  .faq-wordmark, .faq-actions > a { white-space: nowrap; }

  /* Phone: the landing's header is a fixed bar with no room to spare, so the trigger drops
     to the language code alone, and the FAQ header's tagline goes the way the landing's
     does — the wordmark alone still says what the site is. The open panel keeps both code
     and name. */
  @media (max-width: 760px) {
    .lang-menu > summary { gap: 6px; padding: 6px 10px; }
    .lang-menu > summary .lang-menu-name { display: none; }
    /* The landing's own phone rules for the same bar, kept in step so the header still
       matches once the tagline drops and the button shrinks. The "!important" on the button
       is the landing's too, and needed for the same reason: the padding and size it
       overrides are inline styles on the element. (The landing pairs this with a 15px
       wordmark rule that its own inline font-size silently overrides — so the wordmark
       stays 22px on a phone there, and the rule is not copied here.) */
    .faq-header { padding: 0 0.8em; }
    .faq-tagline { display: none; }
    .faq-wordmark { white-space: nowrap; }
    .faq-actions { gap: 6px; }
    .faq-actions > a {
      padding: 6px 10px !important; font-size: 11px !important; white-space: nowrap;
    }
  }
`;

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch],
  );
}

// Safe to embed inside a <script type="application/ld+json"> element: JSON.stringify already
// produces valid JSON, but a literal "</script" substring in a title/description would still
// prematurely close the tag when parsed as HTML. Escaping "<" as its unicode escape prevents
// that while remaining valid, round-trippable JSON.
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

/** The single place `__BASE__` markers (from src/urls.ts and this file's own templates)
 *  become the real deploy-time base path. A plain string substitution rather than a regex
 *  over href="/"/src="/" attributes: those patterns miss CSS `url(...)` references and
 *  data-* attributes, and risk double-prefixing an already-prefixed value. The marker
 *  approach can't do either — it only ever replaces exactly what was deliberately marked. */
export function prefixInternalUrls(html, base) {
  return html.split('__BASE__').join(base);
}

export function renderPage({
  urlPath,
  altPath,
  lang,
  title,
  description,
  jsonLd,
  bodyHtml,
  base = '',
  noindex = false,
  canonicalOverride,
  langRedirectTarget,
}) {
  const canonical = canonicalOverride ?? `${SITE}${urlPath}`;
  const alternate = `${SITE}${altPath}`;
  const enHref = lang === 'pl' ? alternate : canonical;
  const plHref = lang === 'pl' ? canonical : alternate;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  // 'article' is correct for FAQ articles' own og:type — but FAQPage (the FAQ index) and
  // WebApplication (landing pages, and / which reuses the EN landing page) both describe a
  // whole page/app, not a single piece of content, so both need 'website' too.
  const ogType = jsonLd['@type'] === 'Article' ? 'article' : 'website';
  const robotsTag = noindex ? '\n    <meta name="robots" content="noindex, nofollow" />' : '';
  const langRedirectTag = langRedirectTarget
    ? `\n    <script src="__BASE__/lang-redirect.js" data-pl-target="__BASE__${langRedirectTarget}"></script>`
    : '';
  const html = `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://kddudi.goatcounter.com; connect-src 'self' https://kddudi.goatcounter.com; base-uri 'self'; form-action 'self';"
    />
    <link rel="icon" type="image/svg+xml" href="__BASE__/favicon.svg" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en" href="${enHref}" />
    <link rel="alternate" hreflang="pl" href="${plHref}" />
    <link rel="alternate" hreflang="x-default" href="${enHref}" />${robotsTag}
    <meta name="theme-color" content="#16191c" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta property="og:locale" content="${lang === 'pl' ? 'pl_PL' : 'en_US'}" />
    <meta property="og:locale:alternate" content="${lang === 'pl' ? 'en_US' : 'pl_PL'}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>
    <script data-goatcounter="https://kddudi.goatcounter.com/count" async src="__BASE__/count.js"></script>${langRedirectTag}
    <style>${ROOT_STYLE}</style>
  </head>
  <body>
    <div id="root">${bodyHtml}</div>
  </body>
</html>`;
  return prefixInternalUrls(html, base);
}

/** The retired `/faq/*` paths, kept alive as redirects to their `/en/faq/*` replacements.
 *  The head carries more than a refresh: a canonical naming the destination (so a crawler
 *  that indexes the stub before following it still credits the real page), a title (so a
 *  link unfurler has something other than a URL to show), and `lang` (so a screen reader
 *  reaching one doesn't have to guess). Every stub targets an English page — the retired
 *  paths only ever served English — hence the hardcoded `en`. Canonical is SITE-absolute
 *  like every other page's, never base-prefixed; on /preview the noindex flag is what
 *  keeps the stub out of the index. */
export function renderRedirectStub({ targetPath, base = '', noindex = false }) {
  const robots = noindex ? '\n    <meta name="robots" content="noindex, nofollow" />' : '';
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=__BASE__${targetPath}" />${robots}
    <link rel="canonical" href="${SITE}${targetPath}" />
    <title>Moved — Carb Fueling</title>
    <script src="__BASE__/redirect.js" data-target="__BASE__${targetPath}"></script>
  </head>
  <body></body>
</html>
`;
  return prefixInternalUrls(html, base);
}
