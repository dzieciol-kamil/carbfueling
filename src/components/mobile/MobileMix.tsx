import { combinedGroups } from '../../domain/combinedRefill';
import {
  absCap,
  citricAmount,
  citricGramsFromAmount,
  fmtFruitFraction,
  presetTagFor,
  type CitricAmount,
} from '../../domain/fuel';
import type { CitricSource, RatioPreset } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { MobileStepper } from './MobileStepper';

const RATIO_PRESETS = [2, 1.5, 1, 0.8];
const CITRIC_SOURCES: CitricSource[] = ['citric', 'lemon', 'lemonJuice', 'lime', 'limeJuice'];

export function MobileMix() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const combinedFillIds = useAppStore((s) => s.combinedFillIds);
  const setRatio = useAppStore((s) => s.setRatio);
  const setGelRatio = useAppStore((s) => s.setGelRatio);
  const setConc = useAppStore((s) => s.setConc);
  const setSalt = useAppStore((s) => s.setSalt);
  const setCitric = useAppStore((s) => s.setCitric);
  const setCitricSource = useAppStore((s) => s.setCitricSource);
  const setGelConc = useAppStore((s) => s.setGelConc);
  const setGelSalt = useAppStore((s) => s.setGelSalt);
  const setGelCitric = useAppStore((s) => s.setGelCitric);
  const setGelCitricSource = useAppStore((s) => s.setGelCitricSource);
  const clearCombinedFills = useAppStore((s) => s.clearCombinedFills);
  const openMixSheet = useAppStore((s) => s.openMixSheet);
  const strings = t(lang);

  // No fills in scope here — falls back to absCap's izo-only default rather than a real
  // izo/gel blend, since this is a live preview of the mix settings themselves, not a plan.
  const cap = absCap(mix);
  // Same lock condition as MixPanel.tsx's desktop counterpart: gel's ratio/salt/citric/source
  // are inherited from izo whenever there's an active cross-type combine, so those controls
  // become read-only here too. Reads live store state so it tracks the combine selection while
  // this panel stays open.
  const selectedFills = fills.filter((f) => combinedFillIds.includes(f.fid));
  const gelLocked = combinedGroups(selectedFills, gear, mix).some((g) => g.content === 'mixed');
  // See MixPanel.tsx's presetCaption for why the gel row skips the "Izo" caption on 2:1.
  const presetCaption = (r: number, forGel: boolean) =>
    r === 2
      ? forGel
        ? null
        : strings.izo
      : r === 1
        ? strings.ratioLabelSugar
        : r === 0.8
          ? strings.ratioLabelHoney
          : null;

  const citricSourceCaption = (src: CitricSource) => {
    switch (src) {
      case 'lemon':
        return strings.citricSourceLemon;
      case 'lemonJuice':
        return strings.citricSourceLemonJuice;
      case 'lime':
        return strings.citricSourceLime;
      case 'limeJuice':
        return strings.citricSourceLimeJuice;
      default:
        return strings.citricSourceCitric;
    }
  };

  // Same field-label swap as MixPanel.tsx's citricFieldLabel: the powder source keeps the short
  // "kwasek" label, whole-fruit/juice sources show their own name since the stepper is no longer
  // showing grams of powder but a practical amount of that ingredient. A parenthetical unit is
  // appended for the grams/ml units (mirroring the "(g/l)" suffix the salt stepper already uses);
  // the fruit-fraction unit is dimensionless so the fruit name alone is enough.
  const citricFieldLabel = (src: CitricSource, unit: CitricAmount['unit']) => {
    const name = src === 'citric' ? strings.citricLabel : citricSourceCaption(src);
    if (unit === 'ml') return name + ' (ml)';
    if (unit === 'fruit') return name;
    return name + ' (g/l)';
  };

  const izoCitric = citricAmount(mix.citric, mix.citricSource);
  const gelCitricAmt = citricAmount(mix.gelCitric, mix.gelCitricSource);

  const citricSourceButtons = (
    active: CitricSource,
    onChange: (src: CitricSource) => void,
    disabled = false,
  ) => (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, opacity: disabled ? 0.6 : 1 }}>
      {CITRIC_SOURCES.map((src) => {
        const isActive = active === src;
        return (
          <button
            key={src}
            type="button"
            onClick={() => onChange(src)}
            disabled={disabled}
            style={{
              flex: '1 1 76px',
              padding: '10px 4px',
              borderRadius: 9,
              border: '1px solid ' + (isActive ? 'var(--ink)' : 'var(--chip-border)'),
              background: isActive ? 'var(--ink)' : '#fff',
              color: isActive ? '#fff' : 'var(--muted-2)',
              fontSize: 11,
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {citricSourceCaption(src)}
          </button>
        );
      })}
    </div>
  );

  // Stepper bounds/step/format tuned per displayed unit: fine grams for powder, coarser ml for
  // juice, quarter-fruit increments (formatted as a compact ASCII fraction, e.g. "3/4") for whole
  // fruit — deliberately without the percentage `fmtFruitFractionPct` adds for the recipe card,
  // since this narrow stepper slot doesn't have room for it.
  const citricStepperProps = (unit: CitricAmount['unit'], gramsMax: number) => {
    if (unit === 'ml') {
      return { min: 0, max: gramsMax * 20, smallStep: 1, bigStep: 5, format: undefined };
    }
    if (unit === 'fruit') {
      return {
        min: 0,
        max: Math.max(2, Math.ceil(gramsMax / 10)),
        smallStep: 0.25,
        bigStep: 1,
        format: fmtFruitFraction,
      };
    }
    return {
      min: 0,
      max: gramsMax,
      smallStep: 0.2,
      bigStep: 0.2,
      format: (v: number) => v.toFixed(1),
    };
  };

  const ratioButtons = (
    value: number,
    onChange: (n: number, preset: RatioPreset) => void,
    forGel: boolean,
    disabled = false,
    preset: RatioPreset = 'custom',
  ) => (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, opacity: disabled ? 0.6 : 1 }}>
      {RATIO_PRESETS.map((r) => {
        const caption = presetCaption(r, forGel);
        const active = value === r && preset === presetTagFor(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r, presetTagFor(r))}
            disabled={disabled}
            style={{
              flex: '1 1 76px',
              padding: '14px 4px',
              borderRadius: 9,
              border: '1px solid ' + (active ? 'var(--ink)' : 'var(--chip-border)'),
              background: active ? 'var(--ink)' : '#fff',
              color: active ? '#fff' : 'var(--muted-2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {caption ? caption + ' ' : ''}
            {r}:1
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixSection}
        </div>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--muted-2)' }}>
          {strings.mixHintMobile} {strings.absCapNoteMobile.replace('{cap}', String(cap))}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixIzo}
        </div>
        {ratioButtons(mix.ratio, setRatio, false, false, mix.ratioPreset)}
        {citricSourceButtons(mix.citricSource, setCitricSource)}
        <MobileStepper
          label={strings.concLabel + ' (' + strings.per100 + ')'}
          value={mix.conc}
          min={2}
          max={20}
          smallStep={1}
          bigStep={1}
          onChange={setConc}
          stackedLabel
        />
        <MobileStepper
          label={strings.saltLabel + ' (g/l)'}
          value={mix.salt}
          min={0}
          max={4}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setSalt}
          stackedLabel
        />
        <MobileStepper
          label={citricFieldLabel(mix.citricSource, izoCitric.unit)}
          value={izoCitric.amount}
          {...citricStepperProps(izoCitric.unit, 6)}
          onChange={(v) => setCitric(citricGramsFromAmount(v, mix.citricSource))}
          stackedLabel
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {strings.mixGel}
          </span>
          {gelLocked && (
            <button
              type="button"
              onClick={clearCombinedFills}
              style={{
                border: '1px solid var(--chip-border)',
                background: '#fff',
                borderRadius: 8,
                padding: '5px 10px',
                fontFamily: 'Archivo, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--muted-2)',
                cursor: 'pointer',
              }}
            >
              {strings.unlockGelButton}
            </button>
          )}
        </div>
        {gelLocked && (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--muted-2)',
              background: '#F4F5F2',
              border: '1px solid var(--chip-border)',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            {strings.gelLockedNote}
          </p>
        )}
        {ratioButtons(mix.gelRatio, setGelRatio, true, gelLocked, mix.gelRatioPreset)}
        {citricSourceButtons(mix.gelCitricSource, setGelCitricSource, gelLocked)}
        <MobileStepper
          label={strings.gelConcLabel + ' (' + strings.per100 + ')'}
          value={mix.gelConc}
          min={20}
          max={90}
          smallStep={1}
          bigStep={5}
          onChange={setGelConc}
          stackedLabel
        />
        <MobileStepper
          label={strings.saltLabel + ' (g/l)'}
          value={mix.gelSalt}
          min={0}
          max={6}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setGelSalt}
          disabled={gelLocked}
          stackedLabel
        />
        <MobileStepper
          label={citricFieldLabel(mix.gelCitricSource, gelCitricAmt.unit)}
          value={gelCitricAmt.amount}
          {...citricStepperProps(gelCitricAmt.unit, 8)}
          onChange={(v) => setGelCitric(citricGramsFromAmount(v, mix.gelCitricSource))}
          disabled={gelLocked}
          stackedLabel
        />
      </div>

      <button
        type="button"
        onClick={openMixSheet}
        style={{
          border: '1px solid var(--chip-border)',
          borderRadius: 11,
          padding: '13px',
          background: '#fff',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
        }}
      >
        {strings.bidonComposition}
      </button>
    </div>
  );
}
