import type { CSSProperties, ReactNode } from 'react';
import { combinedGroups } from '../../domain/combinedRefill';
import {
  citricAmount,
  citricAmountFromDisplay,
  citricDisplayAmount,
  citricGramsFromAmount,
  presetTagFor,
  ratioPresetIndex,
  type CitricAmount,
} from '../../domain/fuel';
import type { CitricSource, RatioPreset } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { InfoPopover } from '../ui/InfoPopover';
import { NumberInput } from '../ui/NumberInput';
import { SegmentedControl, SegmentedTrack, segmentItemStyle } from '../ui/SegmentedControl';
import { FAQ_HREF_FROM_CALCULATOR } from '../../urls';
import { PanelShell } from './PanelShell';

const RATIO_PRESETS = [2, 1.2, 1, 0.8];
const CITRIC_SOURCES: CitricSource[] = ['citric', 'lemon', 'lemonJuice', 'lime', 'limeJuice'];

function FaqLink({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <a
      href={FAQ_HREF_FROM_CALCULATOR + slug + '/'}
      target="_blank"
      rel="noopener"
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
}

const sectionCardStyle: CSSProperties = {
  border: '1px solid #E9EBE5',
  borderRadius: 12,
  padding: '12px 14px 14px',
  background: '#FBFCFA',
  marginBottom: 10,
};
const blockHeaderStyle: CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 10 };
const inputRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
};
const inputBoxStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid var(--chip-border)',
  borderRadius: 8,
  padding: '6px 10px',
  background: '#fff',
};
const miniInputStyle: CSSProperties = {
  width: 46,
  border: 'none',
  background: 'transparent',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 700,
  textAlign: 'right',
};
function citricSourceLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  switch (source) {
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
}

// The citric-amount field label is deliberately wordier than the source-picker button it follows
// (e.g. button "Cytryna" vs field "Świeża cytryna") — the button is a short pick, but the field
// needs to disambiguate a squeezed whole fruit from bottled juice, since that distinction is what
// determines the unit (fraction-of-fruit vs ml) the number below it is in.
function citricFieldLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  switch (source) {
    case 'lemon':
      return strings.citricFieldLemon;
    case 'lemonJuice':
      return strings.citricFieldLemonJuice;
    case 'lime':
      return strings.citricFieldLime;
    case 'limeJuice':
      return strings.citricFieldLimeJuice;
    default:
      return strings.citricLabel.charAt(0).toUpperCase() + strings.citricLabel.slice(1);
  }
}

function citricSubLabel(unit: CitricAmount['unit'], strings: ReturnType<typeof t>): string {
  if (unit === 'ml') return strings.per100Ml;
  if (unit === 'fruit') return strings.per100Fruit;
  return strings.per100;
}

// Step size for the citric-amount input, tuned per displayed unit: fine-grained grams for powder,
// coarser ml for juice, and quarter-fruit increments for whole fruit — expressed on the 0-100+
// percentage scale `citricDisplayAmount` below shows in the UI, so a quarter of a fruit (0.25) is
// a step of 25.
function citricStep(unit: CitricAmount['unit']): number {
  if (unit === 'ml') return 0.5;
  if (unit === 'fruit') return 25;
  return 0.05;
}

// Passed as `NumberInput`'s `round` option for the citric fields below. Both `citricAmount`'s ml
// conversion (division by a yield constant like 0.06) and `citricGramsFromAmount`'s fruit->grams
// conversion (e.g. 0.25 * 30 * 0.06) can produce long floating-point tails (3.3333333333333335,
// 0.44999999999999996) that would otherwise overflow the narrow 1/3-width grid cell — including
// when the user types/pastes such a value directly, not just when it arrives via conversion.
// Operates on the same displayed scale as `citricDisplayAmount` (already ×100 for 'fruit'), so the
// fruit case rounds to the nearest whole percentage point (this field shows a fine-grained 0-100+
// percentage, not a quarter-fruit picker — rounding to the nearest 25 here would silently zero out
// any real setting under 12.5%, e.g. the default 0.2g/100ml citric setting, which is ~8.9% of a
// lemon and must round to 9, not 0).
export function roundCitricDisplay(amount: number, unit: CitricAmount['unit']): number {
  if (unit === 'ml') return Math.round(amount * 10) / 10;
  if (unit === 'fruit') return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

// The "Izo" caption on the 2:1 preset flags it as this app's default isotonic ratio — showing
// that same caption on the gel row's identical preset would misleadingly imply the gel mix is
// somehow "isotonic" too, so the gel row skips it and shows only the bare "2:1".
function presetCaption(r: number, strings: ReturnType<typeof t>, forGel: boolean): string | null {
  if (r === 2) return forGel ? null : strings.izo;
  if (r === 1) return strings.ratioLabelSugar;
  if (r === 0.8) return strings.ratioLabelHoney;
  return null;
}

function SectionBlockHeader({
  title,
  hint,
  disabled,
}: {
  title: string;
  hint: ReactNode;
  disabled?: boolean;
}) {
  return (
    <InfoPopover
      hint={hint}
      triggerStyle={{ ...blockHeaderStyle, display: 'inline-block', opacity: disabled ? 0.6 : 1 }}
      popoverStyle={{ top: 'calc(100% + 6px)', left: 0 }}
    >
      {title} <span style={{ fontWeight: 400, color: 'var(--muted-2)' }}>ⓘ</span>
    </InfoPopover>
  );
}

interface InputRowProps {
  label: string;
  subLabel: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  round?: (n: number) => number;
  disabled?: boolean;
}

function InputRow({ label, subLabel, value, onChange, step, round, disabled }: InputRowProps) {
  return (
    <label style={{ ...inputRowStyle, opacity: disabled ? 0.6 : 1 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</span>
      <span style={inputBoxStyle}>
        <NumberInput
          step={step}
          value={value}
          onChange={onChange}
          round={round}
          disabled={disabled}
          style={miniInputStyle}
        />
        <span style={{ fontSize: 11, color: 'var(--muted-3)', marginLeft: 4 }}>{subLabel}</span>
      </span>
    </label>
  );
}

interface RatioButtonsProps {
  value: number;
  onChange: (n: number, preset: RatioPreset) => void;
  strings: ReturnType<typeof t>;
  forGel: boolean;
  preset: RatioPreset;
  disabled?: boolean;
}

function RatioButtons({
  value,
  onChange,
  strings,
  forGel,
  preset,
  disabled = false,
}: RatioButtonsProps) {
  const presetIndex = ratioPresetIndex(value, preset, RATIO_PRESETS);
  const selectedIndex = presetIndex === -1 ? RATIO_PRESETS.length : presetIndex;

  return (
    <SegmentedTrack
      selectedIndex={disabled ? -1 : selectedIndex}
      style={{ opacity: disabled ? 0.6 : 1, marginBottom: 10 }}
    >
      {(registerRef) => (
        <>
          {RATIO_PRESETS.map((r, i) => {
            const caption = presetCaption(r, strings, forGel);
            return (
              <button
                key={r}
                ref={registerRef(i)}
                type="button"
                onClick={() => onChange(r, presetTagFor(r))}
                disabled={disabled}
                style={{
                  ...segmentItemStyle(i === presetIndex, { disabled }),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {caption && (
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75 }}>{caption}</span>
                )}
                <span>{r}:1</span>
              </button>
            );
          })}
          <label
            ref={registerRef(RATIO_PRESETS.length)}
            onClick={() => {
              if (presetIndex !== -1 && !disabled) onChange(value, 'custom');
            }}
            style={{
              ...segmentItemStyle(presetIndex === -1, { disabled }),
              // Wider than the 4 preset segments (flex 1 each): it carries an input, not just
              // a short label, so it needs more room to breathe than an equal 1/5 share gives it.
              flex: '1.3 1 0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <span style={{ opacity: 0.75 }}>{strings.ratioCustom}</span>
            <NumberInput
              min={0.2}
              max={10}
              step={0.1}
              value={value}
              onChange={(n) => onChange(n, 'custom')}
              fallback={2}
              disabled={disabled}
              style={{
                width: 30,
                boxSizing: 'border-box',
                border: 'none',
                background: 'transparent',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'right',
                color: 'inherit',
              }}
            />
            <span>:1</span>
          </label>
        </>
      )}
    </SegmentedTrack>
  );
}

interface CitricSourceButtonsProps {
  active: CitricSource;
  onChange: (src: CitricSource) => void;
  strings: ReturnType<typeof t>;
  disabled?: boolean;
}

function CitricSourceButtons({
  active,
  onChange,
  strings,
  disabled = false,
}: CitricSourceButtonsProps) {
  return (
    <SegmentedControl
      options={CITRIC_SOURCES.map((src) => ({
        value: src,
        label: citricSourceLabel(src, strings),
      }))}
      value={active}
      onChange={onChange}
      disabled={disabled}
      style={{ marginBottom: 10 }}
    />
  );
}

export function MixPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const combinedFillIds = useAppStore((s) => s.combinedFillIds);
  const closePanel = useAppStore((s) => s.closePanel);
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
  const resetMix = useAppStore((s) => s.resetMix);
  const strings = t(lang);
  const izoCitric = citricAmount(mix.citric, mix.citricSource);
  const gelCitricAmt = citricAmount(mix.gelCitric, mix.gelCitricSource);
  // Gel's ratio/salt/citric/citricSource are inherited from izo when there's an active
  // cross-type combine (see combinedRefill.ts's 'mixed' group) — the combined batch computes
  // under izo's numbers, so editing gel's own copies of these would be misleading while that's
  // in effect. gelConc is never part of that shared recipe, so it stays editable regardless.
  // Read live store state (not memoized) so this follows the user's combine-checkbox selection
  // in real time, including while this panel is open.
  const selectedFills = fills.filter((f) => combinedFillIds.includes(f.fid));
  const gelLocked = combinedGroups(selectedFills, gear, mix).some((g) => g.content === 'mixed');

  const mixIntro = (
    <>
      {strings.mixHintPre}
      <FaqLink slug="malto-fructose-blend">{strings.mixHintLink1}</FaqLink>
      {strings.mixHintMid1}
      <FaqLink slug="honey-sugar-diy-mix">{strings.mixHintLink2}</FaqLink>
      {strings.mixHintMid2}
      <FaqLink slug="sodium-electrolytes-cycling">{strings.mixHintLink3}</FaqLink>
      {strings.mixHintMid3}
      <FaqLink slug="diy-flavor-additives">{strings.mixHintLink4}</FaqLink>
      {strings.mixHintPost}
    </>
  );

  return (
    <PanelShell title={strings.tabMix} onClose={closePanel}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixSection}
        </span>
        <button
          onClick={resetMix}
          style={{
            border: '1px solid var(--chip-border)',
            background: '#fff',
            borderRadius: 8,
            padding: '5px 10px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-2)',
            cursor: 'pointer',
          }}
        >
          {strings.resetDefaults}
        </button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
        {mixIntro}
      </p>

      <div style={sectionCardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{strings.mixIzo}</div>

        <SectionBlockHeader title={strings.mixSugarBlendHeader} hint={strings.mixRatioHint} />
        <RatioButtons
          value={mix.ratio}
          onChange={setRatio}
          strings={strings}
          forGel={false}
          preset={mix.ratioPreset}
        />
        <InputRow
          label={strings.mixSugarAmountIzo}
          subLabel={strings.per100}
          value={mix.conc}
          onChange={setConc}
          step={0.5}
        />
        <InputRow
          label={strings.mixSaltAmount}
          subLabel={strings.per100}
          value={mix.salt}
          onChange={setSalt}
          step={0.05}
        />

        <SectionBlockHeader title={strings.mixFlavorHeader} hint={strings.mixCitricHint} />
        <CitricSourceButtons
          active={mix.citricSource}
          onChange={setCitricSource}
          strings={strings}
        />
        <InputRow
          label={citricFieldLabel(mix.citricSource, strings)}
          subLabel={citricSubLabel(izoCitric.unit, strings)}
          value={citricDisplayAmount(izoCitric.amount, izoCitric.unit)}
          onChange={(v) =>
            setCitric(
              citricGramsFromAmount(citricAmountFromDisplay(v, izoCitric.unit), mix.citricSource),
            )
          }
          step={citricStep(izoCitric.unit)}
          round={(v) => roundCitricDisplay(v, izoCitric.unit)}
        />
      </div>

      <div style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700 }}>{strings.mixGel}</span>
          {gelLocked && (
            <button
              onClick={clearCombinedFills}
              style={{
                border: '1px solid var(--chip-border)',
                background: '#fff',
                borderRadius: 7,
                padding: '4px 9px',
                fontFamily: 'Archivo, sans-serif',
                fontSize: 10.5,
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
              margin: '0 0 10px',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--muted-2)',
              background: '#F4F5F2',
              border: '1px solid var(--chip-border)',
              borderRadius: 8,
              padding: '7px 9px',
            }}
          >
            {strings.gelLockedNote}
          </p>
        )}

        <SectionBlockHeader
          title={strings.mixSugarBlendHeader}
          hint={strings.mixRatioHint}
          disabled={gelLocked}
        />
        <RatioButtons
          value={mix.gelRatio}
          onChange={setGelRatio}
          strings={strings}
          forGel={true}
          preset={mix.gelRatioPreset}
          disabled={gelLocked}
        />
        <InputRow
          label={strings.mixSugarAmountGel}
          subLabel={strings.per100}
          value={mix.gelConc}
          onChange={setGelConc}
          step={1}
        />
        <InputRow
          label={strings.mixSaltAmount}
          subLabel={strings.per100}
          value={mix.gelSalt}
          onChange={setGelSalt}
          step={0.05}
          disabled={gelLocked}
        />

        <SectionBlockHeader
          title={strings.mixFlavorHeader}
          hint={strings.mixCitricHint}
          disabled={gelLocked}
        />
        <CitricSourceButtons
          active={mix.gelCitricSource}
          onChange={setGelCitricSource}
          strings={strings}
          disabled={gelLocked}
        />
        <InputRow
          label={citricFieldLabel(mix.gelCitricSource, strings)}
          subLabel={citricSubLabel(gelCitricAmt.unit, strings)}
          value={citricDisplayAmount(gelCitricAmt.amount, gelCitricAmt.unit)}
          onChange={(v) =>
            setGelCitric(
              citricGramsFromAmount(
                citricAmountFromDisplay(v, gelCitricAmt.unit),
                mix.gelCitricSource,
              ),
            )
          }
          step={citricStep(gelCitricAmt.unit)}
          round={(v) => roundCitricDisplay(v, gelCitricAmt.unit)}
          disabled={gelLocked}
        />
      </div>
    </PanelShell>
  );
}
