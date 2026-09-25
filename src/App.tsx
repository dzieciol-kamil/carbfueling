import { useEffect } from 'react';
import { ChartCard } from './components/chart/ChartCard';
import { ChartHelpModal } from './components/chart/ChartHelpModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileApp } from './components/mobile/MobileApp';
import { PrintSheet } from './components/print/PrintSheet';
import { FoodPanel } from './components/panels/FoodPanel';
import { GearPanel } from './components/panels/GearPanel';
import { MixPanel } from './components/panels/MixPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { RecipesSection } from './components/recipes/RecipesSection';
import { RoutePanel } from './components/RoutePanel';
import { hasPendingSharedPlan, SharedPlanPrompt } from './components/SharedPlanPrompt';
import { SharePanel } from './components/share/SharePanel';
import { SummaryCards } from './components/SummaryCards';
import { OnboardingHints } from './components/onboarding/OnboardingHints';
import { shouldOpenSetup } from './components/onboarding/onboardingFlow';
import { SetMeUpDialog } from './components/onboarding/SetMeUpDialog';
import { SampleBar } from './components/tour/SampleBar';
import { TourOverlay } from './components/tour/TourOverlay';
import { usePlanHistoryKeys } from './components/ui/UndoRedo';
import { DESKTOP_BREAKPOINT, isDesktopView, resolveTheme, useAppStore } from './store/appStore';
import { nextLangPath } from './urls';
import { LANGS, type Lang } from './i18n/strings';

function App() {
  const panel = useAppStore((s) => s.ui.panel);
  const onboardingVersion = useAppStore((s) => s.ui.onboardingVersion);
  const openSetup = useAppStore((s) => s.openSetup);
  const lang = useAppStore((s) => s.ui.lang);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setAutoView = useAppStore((s) => s.setAutoView);
  const setLang = useAppStore((s) => s.setLang);
  const themeMode = useAppStore((s) => s.ui.themeMode);
  const autoTheme = useAppStore((s) => s.ui.autoTheme);
  const setAutoTheme = useAppStore((s) => s.setAutoTheme);

  usePlanHistoryKeys();

  // First run opens "Set me up", not the tour (plan 2.1). Someone arriving on a share link is
  // asked about that plan instead; the setup waits for their next visit.
  useEffect(() => {
    if (!shouldOpenSetup(onboardingVersion) || hasPendingSharedPlan()) return;
    const id = setTimeout(openSetup, 400);
    return () => clearTimeout(id);
  }, [onboardingVersion, openSetup]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const target = nextLangPath(location.pathname, lang);
    if (target !== location.pathname) {
      // replaceState, not pushState: switching language is not a navigation. A pushed entry
      // would combine with the popstate listener below to turn Back into a language toggle —
      // Back from /pl/calculator/ would land on /en/calculator/ and flip the UI to English
      // instead of leaving the calculator, and every toggle would add another entry to undo.
      history.replaceState(null, '', target);
    }
  }, [lang]);

  useEffect(() => {
    // Built from LANGS, not a literal list of codes — this regex/cast pair went stale once
    // already (missed a language) by hardcoding what LANGS already knows.
    const langSegment = new RegExp(`/(${LANGS.join('|')})/`);
    const onPopState = () => {
      const match = location.pathname.match(langSegment);
      if (match) setLang(match[1] as Lang);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setLang]);

  useEffect(() => {
    const update = () =>
      setAutoView(window.innerWidth >= DESKTOP_BREAKPOINT ? 'desktop' : 'mobile');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [setAutoView]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setAutoTheme(media.matches ? 'dark' : 'light');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [setAutoTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(themeMode, autoTheme);
  }, [themeMode, autoTheme]);

  if (!isDesktopView(viewMode, autoView)) {
    return (
      <>
        <div className="app-shell">
          <MobileApp />
          <TourOverlay />
          <SetMeUpDialog />
          <OnboardingHints />
          <SharedPlanPrompt />
          <SharePanel desktop={false} />
          <ChartHelpModal desktop={false} />
        </div>
        <PrintSheet />
      </>
    );
  }

  return (
    <>
      <div
        className="app-shell"
        style={{
          minHeight: '100vh',
          padding: '14px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Header />
        {panel === 'gear' && <GearPanel />}
        {panel === 'mix' && <MixPanel />}
        {panel === 'food' && <FoodPanel />}
        {panel === 'settings' && <SettingsPanel />}
        <div
          style={{
            width: '100%',
            maxWidth: 1420,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <SampleBar />
          <div
            data-tour="route-summary"
            style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}
          >
            <RoutePanel />
            <SummaryCards />
          </div>
          <ChartCard />
          <RecipesSection />
        </div>
        <Footer />
        <TourOverlay />
        <SetMeUpDialog />
        <OnboardingHints />
        <SharedPlanPrompt />
        <SharePanel desktop />
        <ChartHelpModal desktop />
      </div>
      <PrintSheet />
    </>
  );
}

export default App;
