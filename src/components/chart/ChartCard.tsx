import type { CSSProperties } from 'react';
import { dist, prof } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore, type YMode } from '../../store/appStore';
import type { XUnit } from '../../domain/types';
import { FoodLibraryChips } from '../FoodLibraryChips';
import { LanesSection } from '../lanes/LanesSection';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ShopMarkers } from './ShopMarkers';
import { TimelineSection } from '../timeline/TimelineSection';
import { Chart } from './Chart';
import { elevationTicks } from './ElevationLayer';
import { CHART_COLORS } from './theme';

const CHART_HEIGHT = 300;
const CHART_PB = 22;
const ELEVATION_SHARE = 0.62;

const legendItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 12,
  color: 'var(--muted-2)',
};

export function ChartCard() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const yMode = useAppStore((s) => s.ui.yMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const setYMode = useAppStore((s) => s.setYMode);
  const setXUnit = useAppStore((s) => s.setXUnit);
  const addShop = useAppStore((s) => s.addShop);
  const openChartHelp = useAppStore((s) => s.openChartHelp);
  const strings = t(lang);

  const showGutLane = yMode !== 'fluid';
  const showUnits = route.mode !== 'time';
  const legMain = yMode === 'fluid' ? strings.legFluid : strings.absorbed;
  const legNeed = yMode === 'fluid' ? strings.legSweat : strings.need;
  const legMainColor =
    yMode === 'fluid'
      ? 'var(--water)'
      : `linear-gradient(90deg, ${CHART_COLORS.neutralLine}, ${CHART_COLORS.carb}, ${CHART_COLORS.water}, ${CHART_COLORS.gel}, ${CHART_COLORS.food})`;

  const yModeOptions: { value: YMode; label: string }[] = [
    { value: 'rate', label: strings.carbMode },
    { value: 'fluid', label: strings.fluidMode },
  ];
  const xUnitOptions: { value: XUnit; label: string }[] = [
    { value: 'km', label: 'km' },
    { value: 'h', label: strings.axisTime },
  ];

  const eleTicks = route.gpxTrack
    ? elevationTicks(prof(route).pts, CHART_HEIGHT, CHART_PB, ELEVATION_SHARE)
    : [];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {strings.curve}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexShrink: 0,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={legendItemStyle}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: legMainColor }} />
            {legMain}
          </span>
          <span style={legendItemStyle}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed #A8AEA9' }} />
            {legNeed}
          </span>
          <span style={legendItemStyle}>
            <span
              style={{
                width: 14,
                height: 0,
                borderTop: '2px dotted ' + (yMode === 'fluid' ? 'var(--water)' : 'var(--carb)'),
              }}
            />
            {strings.legCap}
          </span>
          {showGutLane && (
            <span style={legendItemStyle}>
              <span style={{ width: 14, height: 8, borderRadius: 2, background: '#DCC98A' }} />
              {strings.gutLane}
            </span>
          )}
          <SegmentedControl
            options={yModeOptions}
            value={yMode}
            onChange={setYMode}
            fullWidth={false}
          />
          {showUnits && (
            <SegmentedControl
              options={xUnitOptions}
              value={xUnit}
              onChange={setXUnit}
              fullWidth={false}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <div style={{ width: 168, flex: '0 0 168px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
            {showGutLane && (
              <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>
                {strings.gutHint}
              </span>
            )}
            {yMode === 'rate' && (
              <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>
                {strings.curveHint}
              </span>
            )}
            {yMode === 'fluid' && (
              <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>
                {strings.capNoteFluid}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openChartHelp}
            title={strings.chartHelpBtnLabel}
            aria-label={strings.chartHelpBtnLabel}
            style={{
              position: 'absolute',
              right: 0,
              // 22 mirrors Chart.tsx's PB (bottom axis padding) for showAxis=true, the
              // exact call this component makes below — keeps the icon's bottom edge
              // flush with the chart's 0-baseline.
              bottom: 22,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--muted)',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            ?
          </button>
        </div>
        <div data-tour="chart" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Chart height={CHART_HEIGHT} showAxis />
          <ShopMarkers
            distanceKm={dist(route)}
            height={CHART_HEIGHT}
            bottomPadding={CHART_PB}
            route={route}
            xUnit={xUnit}
          />
        </div>
        <div style={{ width: 40, flex: '0 0 40px', position: 'relative', height: CHART_HEIGHT }}>
          <button
            data-tour="add-shop"
            onClick={addShop}
            title={strings.addShopStop}
            style={{
              position: 'absolute',
              top: 3,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: 7,
              cursor: 'pointer',
              border: '1px dashed #B9C0B7',
              background: '#F7F8F5',
              color: 'var(--ink-soft)',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
              fontFamily: 'Archivo, sans-serif',
              pointerEvents: 'auto',
            }}
          >
            +
          </button>
          {eleTicks.map((tick) => (
            <span
              key={tick.value}
              style={{
                position: 'absolute',
                left: 4,
                top: tick.y - 6,
                fontSize: 10,
                color: 'var(--muted-2)',
                whiteSpace: 'nowrap',
              }}
            >
              {tick.value} m
            </span>
          ))}
        </div>
      </div>

      <LanesSection />
      <FoodLibraryChips />
      <TimelineSection />
    </div>
  );
}
