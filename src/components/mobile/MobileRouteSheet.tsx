import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { paceToSpeed, prof, speedToPace } from '../../domain/fuel';
import type { Intensity, RouteInput } from '../../domain/types';
import { t, type StringTable } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { useCourseDownload } from '../useCourseDownload';
import { InfoPopover } from '../ui/InfoPopover';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SportSwitch } from '../ui/SportSwitch';
import { MobileStepper } from './MobileStepper';

function routeSheetTitle(sport: RouteInput['sport'], strings: StringTable): string {
  switch (sport) {
    case 'running':
      return strings.routeSheetTitleRunning;
    default:
      return strings.routeSheetTitleCycling;
  }
}

function elevationGain(route: RouteInput): number {
  const pts = prof(route).pts;
  let gain = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].ele - pts[i - 1].ele;
    if (d > 0) gain += d;
  }
  return Math.round(gain / 10) * 10;
}

const sheetStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 30,
  background: '#fff',
  borderRadius: '22px 22px 0 0',
  padding: '8px 18px 24px',
  boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
  transition: 'transform 220ms cubic-bezier(0.22,0.9,0.3,1)',
  maxHeight: '86%',
  overflowY: 'auto',
};
const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 29,
  background: 'rgba(22,25,28,0.34)',
};
const sectionTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--muted)',
  borderTop: '1px solid var(--border-soft)',
  paddingTop: 14,
  marginTop: 4,
};

export function MobileRouteSheet() {
  const open = useAppStore((s) => s.ui.routeSheet);
  const closeRouteSheet = useAppStore((s) => s.closeRouteSheet);
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const setDistance = useAppStore((s) => s.setDistance);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const setSport = useAppStore((s) => s.setSport);
  const setPreMealCarbs = useAppStore((s) => s.setPreMealCarbs);
  const setPreMealMinutes = useAppStore((s) => s.setPreMealMinutes);
  const setIntensity = useAppStore((s) => s.setIntensity);
  const setTemp = useAppStore((s) => s.setTemp);
  const toggleGpx = useAppStore((s) => s.toggleGpx);
  const loadGpxFromFile = useAppStore((s) => s.loadGpxFromFile);
  const { ready: courseReady, download: downloadCourse } = useCourseDownload();
  const reconcilePlan = useAppStore((s) => s.reconcilePlan);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = t(lang);

  if (!open) return null;

  const intensityOptions: { value: Intensity; label: string }[] = [
    { value: 'low', label: strings.low },
    { value: 'mid', label: strings.medium },
    { value: 'high', label: strings.high },
  ];
  const paceSec = (() => {
    const pace = speedToPace(route.speed);
    return Math.min(900, Math.max(150, pace.min * 60 + pace.sec));
  })();

  function close() {
    closeRouteSheet();
    reconcilePlan();
  }

  return (
    <>
      <div style={backdropStyle} onClick={close} />
      <div style={sheetStyle}>
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            background: 'var(--chip-border)',
            margin: '0 auto 10px',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {routeSheetTitle(route.sport, strings)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SportSwitch
              sport={route.sport}
              onChange={setSport}
              cyclingLabel={strings.sportCycling}
              runningLabel={strings.sportRunning}
              size={44}
            />
            <button
              type="button"
              onClick={close}
              style={{
                width: 34,
                height: 34,
                border: '1px solid var(--chip-border)',
                borderRadius: 10,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MobileStepper
            label={strings.distance + ' (km)'}
            value={route.distance}
            min={0}
            max={600}
            smallStep={1}
            bigStep={5}
            onChange={setDistance}
          />
          {route.sport === 'running' ? (
            <MobileStepper
              label={strings.pace}
              value={paceSec}
              min={150}
              max={900}
              smallStep={5}
              bigStep={30}
              format={(v) => Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0')}
              onChange={(totalSec) => setSpeed(paceToSpeed(0, totalSec))}
            />
          ) : (
            <MobileStepper
              label={strings.speed + ' (km/h)'}
              value={route.speed}
              min={8}
              max={50}
              smallStep={1}
              bigStep={5}
              onChange={setSpeed}
            />
          )}

          <div style={sectionTitleStyle}>{strings.routeSheetPreStart}</div>
          <MobileStepper
            label={strings.preMealCarbs + ' (g)'}
            value={route.preMealCarbs}
            min={0}
            max={200}
            smallStep={1}
            bigStep={5}
            onChange={setPreMealCarbs}
          />
          <MobileStepper
            label={strings.preMealMinutes + ' (min)'}
            value={route.preMealMinutes}
            min={0}
            max={240}
            smallStep={1}
            bigStep={5}
            onChange={setPreMealMinutes}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>
              {strings.routeSheetIntensity}{' '}
              <InfoPopover
                hint={strings.intensityHint}
                ariaLabel={strings.intensityInfoBtnLabel}
                popoverStyle={{ top: 'calc(100% + 6px)', left: 0 }}
              >
                ⓘ
              </InfoPopover>
            </span>
            <SegmentedControl
              options={intensityOptions}
              value={route.intensity}
              onChange={setIntensity}
              minHeight={44}
            />
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--muted-2)',
              }}
            >
              <span>{strings.routeSheetTemp}</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--ink)',
                  fontWeight: 700,
                }}
              >
                {route.temp} °C
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={route.temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>

          <div style={sectionTitleStyle}>{strings.routeSheetGpxSection}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {route.gpxName || strings.gpxFile}
              </span>
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'var(--muted-2)',
              }}
            >
              +{elevationGain(route)} m
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => void downloadCourse()}
              disabled={!courseReady}
              style={{
                flex: 1,
                border: '1px solid var(--chip-border)',
                background: '#fff',
                color: 'var(--ink-soft)',
                borderRadius: 10,
                padding: '11px',
                fontSize: 12,
                fontWeight: 700,
                cursor: courseReady ? 'pointer' : 'default',
                opacity: courseReady ? 1 : 0.45,
              }}
            >
              {strings.routeSheetDownloadFile}
            </button>
            <label
              style={{
                flex: 1,
                textAlign: 'center',
                border: '1px solid var(--chip-border)',
                background: '#fff',
                color: 'var(--ink-soft)',
                borderRadius: 10,
                padding: '11px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {strings.routeSheetLoadFile}
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void loadGpxFromFile(file);
                }}
                style={{ display: 'none' }}
              />
            </label>
            <button
              type="button"
              onClick={toggleGpx}
              style={{
                width: 96,
                border: '1px solid ' + (route.useGpx ? 'var(--ink)' : 'var(--chip-border)'),
                background: route.useGpx ? 'var(--ink)' : '#fff',
                color: route.useGpx ? '#fff' : 'var(--muted-2)',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {strings.gpxOn}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-3)' }}>
            {strings.routeSheetGpxNote}
          </p>

          <button
            type="button"
            onClick={close}
            style={{
              marginTop: 4,
              background: 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: 15,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {strings.routeSheetDone}
          </button>
        </div>
      </div>
    </>
  );
}
