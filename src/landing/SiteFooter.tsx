// src/landing/SiteFooter.tsx
//
// The real site footer (see src/components/Footer.tsx and
// src/components/mobile/MobileProfile.tsx), reshaped for the statically-prerendered
// landing pages. Pure props in, markup out — no hooks, no store, no event handlers,
// so it renders correctly under react-dom/server's renderToStaticMarkup. Layout
// switches from the two-column desktop band to a single stacked column via CSS
// (see the `.site-footer*` rules in Landing.en.tsx / Landing.pl.tsx's landingCss),
// not JS, matching the breakpoint the rest of the landing already uses.
//
// No "Replay tour" button here — that only works inside the running app.
import { absCap } from '../domain/fuel';
import { DEFAULT_MIX } from '../domain/types';
import { t, type Lang } from '../i18n/strings';
import { faqHref } from '../urls';
import { CoffeeIcon, GitHubIcon } from '../components/Footer';

interface SiteFooterProps {
  lang: Lang;
}

export default function SiteFooter({ lang }: SiteFooterProps) {
  const strings = t(lang);
  // No plan/fills in scope on the landing — falls back to absCap's izo-only default
  // off the app's own default mix, same as Footer.tsx does with no plan in scope.
  const cap = absCap(DEFAULT_MIX);
  const absorptionNote = strings.capNote + cap + ' g/h' + strings.capNote2;

  return (
    <div className="site-footer">
      <div className="site-footer-columns">
        <div className="site-footer-about">
          <div className="site-footer-mark-row">
            <span className="site-footer-mark">CARB FUELING</span>
            <span className="site-footer-version">v{__APP_VERSION__}</span>
          </div>
          <p className="site-footer-about-body">{strings.ftAboutBody}</p>
          <p className="site-footer-note">
            {absorptionNote} {strings.ftSources2}
          </p>
          <span className="site-footer-privacy">{strings.ftPrivacy}</span>
        </div>

        <div className="site-footer-contribute">
          <span className="site-footer-label">{strings.ftLinks}</span>
          <div className="site-footer-links">
            <div className="site-footer-row">
              <a
                className="site-footer-pill"
                href="https://github.com/dzieciol-kamil/carbfueling/issues/new"
                target="_blank"
                rel="noopener"
              >
                <span className="site-footer-dot" style={{ background: 'var(--carb)' }} />
                <span>{strings.ftIssues}</span>
              </a>
              <a
                className="site-footer-icon-btn"
                href="https://github.com/dzieciol-kamil/carbfueling"
                target="_blank"
                rel="noopener"
                title={strings.ftRepo}
              >
                <GitHubIcon />
              </a>
            </div>
            <div className="site-footer-row">
              <a className="site-footer-pill" href="mailto:carbfueling@gmail.com">
                <span className="site-footer-dot" style={{ background: '#8b5cf6' }} />
                <span>{strings.ftContact}</span>
              </a>
              <a
                className="site-footer-pill site-footer-pill-coffee"
                href="https://suppi.pl/kamild"
                target="_blank"
                rel="noopener"
              >
                <CoffeeIcon />
                <span>{strings.ftSupport}</span>
              </a>
            </div>
            <a className="site-footer-pill" href={faqHref(lang)}>
              <span className="site-footer-dot" style={{ background: 'var(--food)' }} />
              <span>{strings.ftFaq}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="site-footer-disclaimer">
        <span className="site-footer-label">{strings.ftLegal}</span>
        <p className="site-footer-disclaimer-body">{strings.ftLegalBody}</p>
      </div>

      <div className="site-footer-bottom">
        <span className="site-footer-copyright">{strings.ftCopyright}</span>
      </div>
    </div>
  );
}
