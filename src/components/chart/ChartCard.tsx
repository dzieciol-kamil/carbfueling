import { useEffect, useState, type CSSProperties } from 'react';
import { dist, prof } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore, type YMode } from '../../store/appStore';
import type { XUnit } from '../../domain/types';
import { AutoplanFlow } from '../autoplan/AutoplanFlow';
import { FoodLibraryChips } from '../FoodLibraryChips';
import { LanesSection } from '../lanes/LanesSection';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SegmentedControl } from '../ui/SegmentedControl';
import { usePlanFileTransfer } from '../usePlanFileTransfer';
import { StopMarkers } from './StopMarkers';
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

const planBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  border: '1px solid var(--chip-border)',
  background: '#fff',
  borderRadius: 999,
  padding: '7px 12px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function ChartCard() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const yMode = useAppStore((s) => s.ui.yMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const setYMode = useAppStore((s) => s.setYMode);
  const setXUnit = useAppStore((s) => s.setXUnit);
  const addStop = useAppStore((s) => s.addStop);
  const openChartHelp = useAppStore((s) => s.openChartHelp);
  const clearPlan = useAppStore((s) => s.clearPlan);
  const strings = t(lang);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const {
    fileInputRef,
    planFeedback,
    setPlanFeedback,
    pendingImportFile,
    handleExport,
    handleImportPick,
    handleFileInputChange,
    cancelImport,
    confirmImport,
  } = usePlanFileTransfer();

  // Mirrors the auto-dismiss this feedback banner had in Header.tsx before the Save/Load
  // buttons moved here.
  useEffect(() => {
    if (!planFeedback) return;
    const timer = setTimeout(() => setPlanFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [planFeedback, setPlanFeedback]);

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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
          <AutoplanFlow variant="desktop" />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={handleExport} style={planBtnStyle}>
                <DownloadIcon />
                <span>{strings.exportPlanButton}</span>
              </button>
              <button onClick={handleImportPick} style={planBtnStyle}>
                <UploadIcon />
                <span>{strings.importPlanButton}</span>
              </button>
              <button onClick={() => setClearConfirmOpen(true)} style={planBtnStyle}>
                <ClearIcon />
                <span>{strings.clearPlanButton}</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            {planFeedback && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: 220,
                  maxWidth: 280,
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: planFeedback === 'import-success' ? 'var(--muted-2)' : '#B3402A',
                  zIndex: 60,
                }}
              >
                {planFeedback === 'import-error'
                  ? strings.importPlanError
                  : planFeedback === 'import-success'
                    ? strings.importPlanSuccess
                    : strings.exportPlanError}
              </div>
            )}
          </div>
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
        <div
          style={{
            width: 168,
            flex: '0 0 168px',
            height: CHART_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
          {/* Bottom of the column, below the prose above: the chart's legend, one entry per
              line, and the "?" help trigger. marginTop: auto hugs both to the column's
              bottom regardless of how tall the prose above ends up (varies by yMode/lang) —
              the help button used to sit here absolutely positioned on its own; now it sits
              below the legend it used to overlap. */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            </div>
            <button
              type="button"
              onClick={openChartHelp}
              title={strings.chartHelpBtnLabel}
              aria-label={strings.chartHelpBtnLabel}
              style={{
                alignSelf: 'flex-end',
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
        </div>
        <div data-tour="chart" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Chart height={CHART_HEIGHT} showAxis />
          <StopMarkers
            distanceKm={dist(route)}
            height={CHART_HEIGHT}
            bottomPadding={CHART_PB}
            route={route}
            xUnit={xUnit}
          />
        </div>
        <div style={{ width: 40, flex: '0 0 40px', position: 'relative', height: CHART_HEIGHT }}>
          <button
            data-tour="add-stop"
            onClick={addStop}
            title={strings.addStop}
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

      {pendingImportFile && (
        <ConfirmDialog
          title={strings.importPlanConfirmTitle}
          body={strings.importPlanConfirmBody}
          cancelLabel={strings.importPlanConfirmCancel}
          confirmLabel={strings.importPlanConfirmConfirm}
          onCancel={cancelImport}
          onConfirm={confirmImport}
        />
      )}

      {clearConfirmOpen && (
        <ConfirmDialog
          title={strings.clearPlanConfirmTitle}
          body={strings.clearPlanConfirmBody}
          cancelLabel={strings.clearPlanConfirmCancel}
          confirmLabel={strings.clearPlanConfirmConfirm}
          onCancel={() => setClearConfirmOpen(false)}
          onConfirm={() => {
            clearPlan();
            setClearConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}

// These three match Header.tsx's GearIcon/MixIcon/FoodIcon/SettingsIcon idiom (viewBox,
// stroke width, sizing) so the whole Planning row reads as one icon set.
function DownloadIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 3.5 V13.5 M7 10 L11 14 L15 10 M4.5 18.5 H17.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 14.5 V4.5 M7 8 L11 4 L15 8 M4.5 18.5 H17.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3.5 L10 11" />
      <path d="M10 11 L5 13.5 M10 11 L7 17.5 M10 11 L11.5 17.8 M10 11 L14 14.5" />
    </svg>
  );
}
