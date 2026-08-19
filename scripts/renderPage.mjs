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

export function renderRedirectStub({ targetPath, base = '', noindex = false }) {
  const robots = noindex ? '\n    <meta name="robots" content="noindex, nofollow" />' : '';
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=__BASE__${targetPath}" />${robots}
    <script src="__BASE__/redirect.js" data-target="__BASE__${targetPath}"></script>
  </head>
  <body></body>
</html>
`;
  return prefixInternalUrls(html, base);
}
