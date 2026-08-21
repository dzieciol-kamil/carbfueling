import type { CSSProperties } from 'react';
import type { Content } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { NumberInput } from '../ui/NumberInput';
import { createVesselReorderHandler } from './gearDragHandler';
import { PanelShell } from './PanelShell';

const CONTENT_OPTIONS: Content[] = ['water', 'izo', 'gel'];

const stepBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  width: 16,
  height: 22,
  padding: 0,
  lineHeight: 1,
  flex: '0 0 auto',
};

function contentLabel(content: Content, lang: 'pl' | 'en'): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function cOpt(on: boolean, color: string): CSSProperties {
  return {
    border: '1px solid ' + (on ? color : 'var(--chip-border)'),
    background: on ? color : '#fff',
    color: on ? '#fff' : 'var(--muted)',
    borderRadius: 7,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
  };
}

export function GearPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const gear = useAppStore((s) => s.gear);
  const closePanel = useAppStore((s) => s.closePanel);
  const updateVessel = useAppStore((s) => s.updateVessel);
  const removeVessel = useAppStore((s) => s.removeVessel);
  const addVessel = useAppStore((s) => s.addVessel);
  const toggleVesselAllowed = useAppStore((s) => s.toggleVesselAllowed);
  const setVesselGelParts = useAppStore((s) => s.setVesselGelParts);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const strings = t(lang);

  return (
    <PanelShell title={strings.tabGear} onClose={closePanel}>
      <div data-gear-list style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gear.map((vessel) => (
          <div
            key={vessel.gid}
            data-gid={vessel.gid}
            style={{
              border: '1px solid #E9EBE5',
              borderRadius: 12,
              padding: 12,
              background: '#FBFCFA',
              opacity: dragKey === 'g' + vessel.gid ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                onPointerDown={createVesselReorderHandler(vessel.gid)}
                style={{
                  cursor: 'grab',
                  touchAction: 'none',
                  color: 'var(--muted-3)',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                  userSelect: 'none',
                  flex: '0 0 auto',
                }}
              >
                ⠿
              </span>
              <input
                type="text"
                value={vessel.name}
                onChange={(e) => updateVessel(vessel.gid, { name: e.target.value })}
                style={{
                  flex: 1,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 10,
                  padding: '9px 11px',
                  fontFamily: 'Archivo, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fff',
                }}
              />
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 10,
                  padding: '0 10px',
                  width: 92,
                  background: '#fff',
                }}
              >
                <NumberInput
                  value={vessel.vol}
                  onChange={(vol) => updateVessel(vessel.gid, { vol })}
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '9px 0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>ml</span>
              </span>
              <button
                onClick={() => removeVessel(vessel.gid)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#B0B5B0',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 6,
                  width: 26,
                  flex: '0 0 26px',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.canCarry}</span>
              <span style={{ display: 'flex', gap: 5 }}>
                {CONTENT_OPTIONS.map((k) => (
                  <button
                    key={k}
                    onClick={() => toggleVesselAllowed(vessel.gid, k)}
                    style={cOpt((vessel.allowed || []).includes(k), sourceColor(k))}
                  >
                    {contentLabel(k, lang)}
                  </button>
                ))}
              </span>
              {(vessel.allowed || []).includes('gel') && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    border: '1px solid var(--chip-border)',
                    borderRadius: 10,
                    padding: '0 4px 0 10px',
                    background: '#fff',
                    boxSizing: 'content-box',
                    marginLeft: 'auto',
                    marginRight: 35,
                    flex: '0 0 auto',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
                    {strings.gelPartsLabel}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <button
                      type="button"
                      onClick={() => setVesselGelParts(vessel.gid, vessel.gelParts - 1)}
                      style={stepBtnStyle}
                      aria-label="-"
                    >
                      −
                    </button>
                    <NumberInput
                      min={1}
                      max={12}
                      step={1}
                      parser="int"
                      fallback={1}
                      value={vessel.gelParts}
                      onChange={(gelParts) => setVesselGelParts(vessel.gid, gelParts)}
                      style={{
                        width: 16,
                        border: 'none',
                        padding: '9px 0',
                        background: 'transparent',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setVesselGelParts(vessel.gid, vessel.gelParts + 1)}
                      style={stepBtnStyle}
                      aria-label="+"
                    >
                      +
                    </button>
                  </span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addVessel}
        style={{
          marginTop: 12,
          border: '1px dashed #C9CEC7',
          background: '#F7F8F5',
          borderRadius: 10,
          padding: '11px 16px',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + {strings.addGear}
      </button>
    </PanelShell>
  );
}
