import type { Content } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { MobileStepper } from './MobileStepper';

const CONTENT_OPTIONS: Content[] = ['water', 'izo', 'gel'];

export function MobileGear() {
  const lang = useAppStore((s) => s.ui.lang);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const updateVessel = useAppStore((s) => s.updateVessel);
  const removeVessel = useAppStore((s) => s.removeVessel);
  const addVessel = useAppStore((s) => s.addVessel);
  const toggleVesselAllowed = useAppStore((s) => s.toggleVesselAllowed);
  const setVesselGelParts = useAppStore((s) => s.setVesselGelParts);
  const strings = t(lang);

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {strings.gear}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
        {strings.gearHintMobile}
      </p>

      {gear.map((vessel) => {
        const count = fills.filter((f) => f.gid === vessel.gid).length;
        const gelAllowed = vessel.allowed.includes('gel');
        return (
          <div
            key={vessel.gid}
            style={{
              border: '1px solid var(--chip-border)',
              borderRadius: 13,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <input
                type="text"
                value={vessel.name}
                onChange={(e) => updateVessel(vessel.gid, { name: e.target.value })}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 10,
                  padding: '9px 11px',
                  fontFamily: 'Archivo, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'var(--surface)',
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--muted)',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {count}
                {strings.inPlanSuffix}
              </span>
            </div>

            <MobileStepper
              label="ml"
              value={vessel.vol}
              min={100}
              max={2000}
              smallStep={10}
              bigStep={50}
              onChange={(vol) => updateVessel(vessel.gid, { vol })}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.canCarry}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {CONTENT_OPTIONS.map((c) => {
                  const active = vessel.allowed.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleVesselAllowed(vessel.gid, c)}
                      style={{
                        flex: 1,
                        padding: '11px 4px',
                        borderRadius: 9,
                        border: '1px solid ' + (active ? sourceColor(c) : 'var(--chip-border)'),
                        background: active ? sourceColor(c) : 'var(--surface)',
                        color: active ? 'var(--on-brand)' : 'var(--muted-2)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {c === 'water' ? strings.water : c === 'gel' ? strings.gel : strings.izo}
                    </button>
                  );
                })}
              </div>
            </div>

            {gelAllowed && (
              <MobileStepper
                label={strings.gelPartsStepper}
                value={vessel.gelParts}
                min={1}
                max={12}
                smallStep={1}
                bigStep={1}
                onChange={(n) => setVesselGelParts(vessel.gid, n)}
              />
            )}

            <button
              type="button"
              onClick={() => removeVessel(vessel.gid)}
              style={{
                alignSelf: 'flex-start',
                border: '1px solid var(--border-warm)',
                borderRadius: 8,
                padding: '6px 10px',
                background: 'var(--surface)',
                color: 'var(--food)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {strings.removeItem}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addVessel}
        style={{
          border: '1px dashed var(--border-dashed)',
          borderRadius: 11,
          padding: 12,
          background: 'var(--surface-soft)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
        }}
      >
        + {strings.addGear}
      </button>
    </div>
  );
}
