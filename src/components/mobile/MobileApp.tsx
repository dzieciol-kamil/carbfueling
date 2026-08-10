import type { CSSProperties, ReactNode } from 'react';
import { dist, fmtHM, totalHours } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore, type MobileTab } from '../../store/appStore';
import { AutoplanFlow } from '../autoplan/AutoplanFlow';
import { MobileChartPanel } from './MobileChartPanel';
import { MobileFoodLibrary } from './MobileFoodLibrary';
import { MobileGear } from './MobileGear';
import { MobileMix } from './MobileMix';
import { MobileMixSheet } from './MobileMixSheet';
import { MobilePlanList } from './MobilePlanList';
import { MobileProfile } from './MobileProfile';
import { MobileRouteSheet } from './MobileRouteSheet';
import { MobileShopSheet } from './MobileShopSheet';

const TABS: { tab: MobileTab; icon: ReactNode }[] = [
  { tab: 'plan', icon: <path d="M2 16 L7 9 L11 12 L16 4.5 L20 8" /> },
  {
    tab: 'gear',
    icon: (
      <path d="M7 7.5 h8 v10.5 a2 2 0 0 1 -2 2 h-4 a2 2 0 0 1 -2 -2 z M9.5 7.5 v-3 h3 v3 M7 12 h8" />
    ),
  },
  {
    tab: 'mix',
    icon: (
      <path d="M6.5 5 h9 l-1.1 12.2 a2 2 0 0 1 -2 1.8 h-2.8 a2 2 0 0 1 -2 -1.8 z M7.2 11.5 h7.6" />
    ),
  },
  {
    tab: 'food',
    icon: (
      <path d="M4.4 6.2 C3.9 14.2 9.6 19.3 18 18.2 C18.9 18.1 19.2 17.1 18.4 16.6 C12.3 14.5 7.6 11.6 7.2 6.4 C7.1 5.6 4.5 5.4 4.4 6.2 Z M5.6 5.9 L5.1 3.6" />
    ),
  },
];

function iconStyle(active: boolean): CSSProperties {
  return { color: active ? 'var(--ink)' : '#B0B5B0' };
}
function labelStyle(active: boolean): CSSProperties {
  return {
    fontSize: 9,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    color: active ? 'var(--ink)' : '#9AA09B',
  };
}

export function MobileApp() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const tab = useAppStore((s) => s.ui.tab);
  const setTab = useAppStore((s) => s.setTab);
  const openRouteSheet = useAppStore((s) => s.openRouteSheet);
  const strings = t(lang);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
      }}
    >
      <div data-mobile-scroll style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <div
          style={{
            padding: '13px 18px 10px',
            borderBottom: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            // The wordmark, the route chip and the autoplan button need ~444px of intrinsic width
            // together, so on a 375px-class phone they have to wrap — without this the wordmark
            // broke onto two lines and the autoplan button was clipped off the right edge.
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            CARB FUELING
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <button
              type="button"
              data-tour="route-summary"
              onClick={openRouteSheet}
              style={{
                border: '1px solid var(--chip-border)',
                borderRadius: 999,
                padding: '6px 11px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--muted)',
                background: '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {strings.editRoutePrefix} {Math.round(dist(route))} km · {fmtHM(totalHours(route))}
            </button>
            <AutoplanFlow variant="mobile" />
          </div>
        </div>

        {tab === 'plan' && (
          <>
            <MobileChartPanel />
            <MobilePlanList />
          </>
        )}
        {tab === 'gear' && <MobileGear />}
        {tab === 'mix' && <MobileMix />}
        {tab === 'food' && <MobileFoodLibrary />}
        {tab === 'me' && <MobileProfile />}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '8px 8px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 2,
        }}
      >
        {TABS.map(({ tab: t2, icon }) => {
          const active = tab === t2;
          const label =
            t2 === 'plan'
              ? strings.tabPlan
              : t2 === 'gear'
                ? strings.tabGear
                : t2 === 'mix'
                  ? strings.tabMix
                  : strings.tabFood;
          return (
            <button
              key={t2}
              type="button"
              onClick={() => setTab(t2)}
              style={{
                border: 'none',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 0',
                cursor: 'pointer',
              }}
            >
              <svg
                width={21}
                height={21}
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={iconStyle(active)}
              >
                {icon}
              </svg>
              <span style={labelStyle(active)}>{label}</span>
            </button>
          );
        })}
        {(() => {
          const active = tab === 'me';
          return (
            <button
              type="button"
              onClick={() => setTab('me')}
              style={{
                border: 'none',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 0',
                cursor: 'pointer',
              }}
            >
              <svg
                width={21}
                height={21}
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={iconStyle(active)}
              >
                <path d="M4.5 19.5 q0 -5.5 6.5 -5.5 t6.5 5.5" />
                <circle cx={11} cy={7} r={3.4} fill="currentColor" stroke="none" />
              </svg>
              <span style={labelStyle(active)}>{strings.tabMe}</span>
            </button>
          );
        })()}
      </div>

      <MobileMixSheet />
      <MobileRouteSheet />
      <MobileShopSheet />
    </div>
  );
}
