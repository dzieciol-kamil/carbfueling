import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { paceToSpeed, prof, speedToPace } from '../domain/fuel';
import type { Intensity, RouteInput } from '../domain/types';
import { t, type StringTable } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { InfoPopover } from './ui/InfoPopover';
import { NumberInput } from './ui/NumberInput';
import { SegmentedControl } from './ui/SegmentedControl';
import { SportSwitch } from './ui/SportSwitch';

function routeTitle(sport: RouteInput['sport'], strings: StringTable): string {
  switch (sport) {
    case 'running':
      return strings.routeRunning;
    default:
      return strings.routeCycling;
  }
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 600,
  background: '#fff',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  flex: '1 1 0',
  minWidth: 0,
};

function elevationGain(routeState: RouteInput): number {
  const pts = prof(routeState).pts;
  let gain = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].ele - pts[i - 1].ele;
    if (d > 0) gain += d;
  }
  return Math.round(gain / 10) * 10;
}

export function RoutePanel() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const setMode = useAppStore((s) => s.setMode);
  const setDistance = useAppStore((s) => s.setDistance);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const setSport = useAppStore((s) => s.setSport);
  const setHours = useAppStore((s) => s.setHours);
  const setMinutes = useAppStore((s) => s.setMinutes);
  const reconcilePlan = useAppStore((s) => s.reconcilePlan);
  const setIntensity = useAppStore((s) => s.setIntensity);
  const setTemp = useAppStore((s) => s.setTemp);
  const setPreMealCarbs = useAppStore((s) => s.setPreMealCarbs);
  const setPreMealMinutes = useAppStore((s) => s.setPreMealMinutes);
  const toggleGpx = useAppStore((s) => s.toggleGpx);
  const loadGpxFromFile = useAppStore((s) => s.loadGpxFromFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = t(lang);

  const intensityOptions: { value: Intensity; label: string }[] = [
    { value: 'low', label: strings.low },
    { value: 'mid', label: strings.medium },
    { value: 'high', label: strings.high },
  ];
  const pace = speedToPace(route.speed);

  return (
    <div
      style={{
        // flexShrink 0 pins this to exactly 760px; a residual flexGrow of 1 (vs.
        // SummaryCards' 9999) only matters once this wraps onto its own row, where
        // it's the sole item and grows to fill the full width per issue #68.
        flex: '1 0 760px',
        boxSizing: 'border-box',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        gap: '14px 44px',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '0 0 272px', width: 272 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {routeTitle(route.sport, strings)}
          </span>
          <SportSwitch
            sport={route.sport}
            onChange={setSport}
            cyclingLabel={strings.sportCycling}
            runningLabel={strings.sportRunning}
          />
        </div>

        <SegmentedControl
          options={[
            { value: 'route' as const, label: strings.byRoute },
            { value: 'time' as const, label: strings.byTime },
          ]}
          value={route.mode}
          onChange={setMode}
          style={{ alignSelf: 'flex-start', width: 272, maxWidth: '100%' }}
        />

        {route.mode === 'route' ? (
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-end',
              width: 272,
              maxWidth: '100%',
            }}
          >
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.distance} (km)</span>
              <NumberInput
                value={route.distance}
                onChange={setDistance}
                onCommit={reconcilePlan}
                zeroAsEmpty
                style={inputStyle}
              />
            </label>
            {route.sport === 'running' ? (
              <>
                <label style={labelStyle}>
                  <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.paceMin}</span>
                  <NumberInput
                    value={pace.min}
                    onChange={(min) => setSpeed(paceToSpeed(min, pace.sec))}
                    parser="int"
                    min={0}
                    zeroAsEmpty
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.paceSec}</span>
                  <NumberInput
                    value={pace.sec}
                    onChange={(sec) => setSpeed(paceToSpeed(pace.min, sec))}
                    parser="int"
                    min={0}
                    max={59}
                    zeroAsEmpty
                    style={inputStyle}
                  />
                </label>
              </>
            ) : (
              <label style={labelStyle}>
                <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                  {strings.speed} (km/h)
                </span>
                <NumberInput
                  value={route.speed}
                  onChange={setSpeed}
                  zeroAsEmpty
                  style={inputStyle}
                />
              </label>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-end',
              width: 272,
              maxWidth: '100%',
            }}
          >
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.hours}</span>
              <NumberInput
                value={route.hours}
                onChange={setHours}
                onCommit={reconcilePlan}
                zeroAsEmpty
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.minutes}</span>
              <NumberInput
                value={route.minutes}
                onChange={setMinutes}
                onCommit={reconcilePlan}
                zeroAsEmpty
                style={inputStyle}
              />
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 44px', flex: '0 0 394px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: '0 0 220px',
            width: 220,
            paddingTop: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
              {strings.intensity}{' '}
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
            />
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
            <span
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--muted-2)',
              }}
            >
              <span>{strings.temp}</span>
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
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flex: '0 0 130px',
            width: 130,
            paddingTop: 20,
          }}
        >
          <label style={{ ...labelStyle, gap: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
              {strings.preMealCarbs} (g)
            </span>
            <NumberInput
              value={route.preMealCarbs}
              onChange={setPreMealCarbs}
              zeroAsEmpty
              style={inputStyle}
            />
          </label>
          <label style={{ ...labelStyle, gap: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
              {strings.preMealMinutes} (min)
            </span>
            <NumberInput
              value={route.preMealMinutes}
              onChange={setPreMealMinutes}
              zeroAsEmpty
              style={inputStyle}
            />
          </label>
        </div>
      </div>

      <div
        style={{
          flex: '0 1 710px',
          width: '100%',
          maxWidth: 710,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '9px 14px',
          border: '1px dashed var(--chip-border)',
          borderRadius: 11,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ minWidth: 140, flex: '1 1 auto' }}>
          <span
            style={{ display: 'block', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}
          >
            {strings.gpx}
          </span>
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
            flex: '0 0 auto',
            whiteSpace: 'nowrap',
          }}
        >
          +{elevationGain(route)} m
        </span>
        <span style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
          <label
            style={{
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--ink-soft)',
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            {strings.gpxPick}
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
            onClick={toggleGpx}
            style={{
              border: '1px solid ' + (route.useGpx ? 'var(--ink)' : 'var(--chip-border)'),
              background: route.useGpx ? 'var(--ink)' : '#fff',
              color: route.useGpx ? '#fff' : 'var(--muted-2)',
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {strings.gpxOn}
          </button>
        </span>
      </div>
      {route.gpxError && (
        <span style={{ fontSize: 11, color: 'var(--food)', flex: '1 1 100%' }}>
          {strings.gpxBad}
        </span>
      )}
    </div>
  );
}
