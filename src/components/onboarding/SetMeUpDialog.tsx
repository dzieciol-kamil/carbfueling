import { useState, type CSSProperties, type ReactNode } from 'react';
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG } from '../../domain/fuel';
import type { FoodLibEntry, Vessel } from '../../domain/types';
import { t, type StringTable } from '../../i18n/strings';
import {
  DEFAULT_FOOD_LIB,
  isDesktopView,
  SETUP_NEW_PREFIX,
  useAppStore,
} from '../../store/appStore';
import { NumberInput } from '../ui/NumberInput';

type Row<T> = { item: T; on: boolean };

type VesselKind = 'bottle' | 'flask' | 'bladder';

function newVessel(kind: VesselKind, id: number, strings: StringTable): Vessel {
  const gid = SETUP_NEW_PREFIX + id;
  if (kind === 'flask') {
    return {
      gid,
      name: strings.setupFlaskName,
      vol: 250,
      allowed: ['izo', 'water', 'gel'],
      gelParts: 4,
    };
  }
  if (kind === 'bladder') {
    return { gid, name: strings.setupBladderName, vol: 1500, allowed: ['water'], gelParts: 4 };
  }
  return { gid, name: strings.setupBottleName, vol: 650, allowed: ['water', 'izo'], gelParts: 4 };
}

const sectionTitleStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--ink)' };
const hintStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--ink-soft)',
};
const whereStyle: CSSProperties = { margin: 0, fontSize: 11, color: 'var(--muted-3)' };
const fieldStyle: CSSProperties = {
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '9px 11px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  background: 'var(--surface)',
  color: 'var(--ink)',
  minWidth: 0,
  boxSizing: 'border-box',
};
const numberFieldStyle: CSSProperties = {
  ...fieldStyle,
  fontFamily: "'JetBrains Mono', monospace",
  textAlign: 'right',
};
const addBtnStyle: CSSProperties = {
  border: '1px dashed var(--border-dashed)',
  background: 'var(--surface-soft)',
  borderRadius: 999,
  padding: '7px 12px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-soft)',
  cursor: 'pointer',
};
const ghostBtnStyle: CSSProperties = {
  border: '1px solid var(--chip-border)',
  background: 'var(--surface)',
  color: 'var(--ink-soft)',
  borderRadius: 8,
  padding: '9px 16px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'Archivo, sans-serif',
  cursor: 'pointer',
};
const primaryBtnStyle: CSSProperties = {
  ...ghostBtnStyle,
  background: 'var(--selected-bg)',
  color: 'var(--on-brand)',
  fontWeight: 700,
};

// A real checkbox inside each chip, like the bottle rows above: a filled vs. an outlined pill
// alone did not read as ticked vs. not, least of all in dark mode.
function chipStyle(on: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: '1px solid ' + (on ? 'var(--ink)' : 'var(--chip-border)'),
    background: 'var(--surface)',
    color: on ? 'var(--ink)' : 'var(--muted)',
    borderRadius: 999,
    padding: '7px 13px 7px 10px',
    fontFamily: 'Archivo, sans-serif',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

function Section({
  title,
  hint,
  where,
  children,
}: {
  title: string;
  hint?: string;
  where: string;
  children: ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={sectionTitleStyle}>{title}</span>
      {hint && <p style={hintStyle}>{hint}</p>}
      {children}
      <p style={whereStyle}>{where}</p>
    </section>
  );
}

/**
 * "Set me up" (plan 2.8): weight, the bottles the rider owns and the products they usually take.
 * Opens on its own at first run and on demand from the Plan menu / Settings. Nothing is written
 * until Save, so Skip and × leave everything as it was; Save goes through `applySetup`, the same
 * data Settings, Gear and Products edit. Route and mix are deliberately not asked.
 */
export function SetMeUpDialog() {
  const open = useAppStore((s) => s.ui.setupOpen);
  if (!open) return null;
  return <SetMeUpForm />;
}

function SetMeUpForm() {
  const lang = useAppStore((s) => s.ui.lang);
  const desktop = useAppStore((s) => isDesktopView(s.ui.viewMode, s.ui.autoView));
  const closeSetup = useAppStore((s) => s.closeSetup);
  const applySetup = useAppStore((s) => s.applySetup);
  const strings = t(lang);

  // A draft of the store's own data, read once on open: a returning rider sees what they saved.
  const [weight, setWeight] = useState(() => useAppStore.getState().route.weight);
  const [gear, setGear] = useState<Row<Vessel>[]>(() =>
    useAppStore.getState().gear.map((item) => ({ item, on: true })),
  );
  // The rider's own products ticked, plus any default one they no longer have, unticked — so a
  // product removed in the past can be brought back from here.
  const [food, setFood] = useState<Row<FoodLibEntry>[]>(() => {
    const lib = useAppStore.getState().foodLib;
    const missing = DEFAULT_FOOD_LIB.filter((d) => !lib.some((e) => e.key === d.key));
    return [
      ...lib.map((item) => ({ item, on: true })),
      ...missing.map((item) => ({ item, on: false })),
    ];
  });
  const [nextId, setNextId] = useState(1);
  const [ownName, setOwnName] = useState('');
  const [ownCarbs, setOwnCarbs] = useState(25);

  const updateVessel = (i: number, patch: Partial<Vessel>) =>
    setGear((rows) => rows.map((r, j) => (j === i ? { ...r, item: { ...r.item, ...patch } } : r)));

  function addVessel(kind: VesselKind) {
    setGear((rows) => [...rows, { item: newVessel(kind, nextId, strings), on: true }]);
    setNextId((n) => n + 1);
  }

  function addOwnFood() {
    const name = ownName.trim();
    if (!name) return;
    const item: FoodLibEntry = {
      key: SETUP_NEW_PREFIX + nextId,
      pl: name,
      en: name,
      de: name,
      it: name,
      carbs: Math.max(0, ownCarbs),
    };
    setFood((rows) => [...rows, { item, on: true }]);
    setNextId((n) => n + 1);
    setOwnName('');
  }

  function save() {
    applySetup({
      weight,
      gear: gear.filter((r) => r.on).map((r) => r.item),
      foodLib: food.filter((r) => r.on).map((r) => r.item),
    });
  }

  const body = (
    <>
      <p style={hintStyle}>{strings.setupIntro}</p>

      <Section
        title={strings.setupWeightTitle}
        where={desktop ? strings.setupWeightWhere : strings.setupWeightWhereMobile}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={WEIGHT_MIN_KG}
            max={WEIGHT_MAX_KG}
            step={1}
            value={weight}
            aria-label={strings.weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 0 }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 700,
              minWidth: 58,
              textAlign: 'right',
            }}
          >
            {weight} kg
          </span>
        </label>
      </Section>

      <Section
        title={strings.setupGearTitle}
        hint={strings.setupGearHint}
        where={strings.setupGearWhere}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {gear.map((row, i) => (
            <div
              key={row.item.gid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--chip-border)',
                borderRadius: 10,
                padding: '6px 8px',
                opacity: row.on ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={row.on}
                aria-label={row.item.name}
                onChange={(e) =>
                  setGear((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, on: e.target.checked } : r)),
                  )
                }
                style={{ width: 18, height: 18, flex: '0 0 auto' }}
              />
              <input
                type="text"
                value={row.item.name}
                onChange={(e) => updateVessel(i, { name: e.target.value })}
                style={{ ...fieldStyle, flex: 1 }}
              />
              <NumberInput
                min={50}
                max={3000}
                step={10}
                parser="int"
                value={row.item.vol}
                onChange={(vol) => updateVessel(i, { vol: Math.max(0, vol) })}
                style={{ ...numberFieldStyle, width: 72, flex: '0 0 auto' }}
              />
              <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>ml</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['bottle', 'flask', 'bladder'] as const).map((kind) => (
            <button key={kind} type="button" onClick={() => addVessel(kind)} style={addBtnStyle}>
              +{' '}
              {kind === 'bottle'
                ? strings.setupAddBottle
                : kind === 'flask'
                  ? strings.setupAddFlask
                  : strings.setupAddBladder}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title={strings.setupFoodTitle}
        hint={strings.setupFoodHint}
        where={strings.setupFoodWhere}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {food.map((row, i) => (
            <label key={row.item.key} style={chipStyle(row.on)}>
              <input
                type="checkbox"
                checked={row.on}
                onChange={(e) =>
                  setFood((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, on: e.target.checked } : r)),
                  )
                }
                style={{ width: 16, height: 16, margin: 0 }}
              />
              {row.item[lang] || row.item.en}
            </label>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addOwnFood();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <input
            type="text"
            value={ownName}
            placeholder={strings.setupOwnFoodPlaceholder}
            onChange={(e) => setOwnName(e.target.value)}
            style={{ ...fieldStyle, flex: 1 }}
          />
          <NumberInput
            min={0}
            step={1}
            parser="int"
            value={ownCarbs}
            onChange={setOwnCarbs}
            style={{ ...numberFieldStyle, width: 56, flex: '0 0 auto' }}
          />
          <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>g</span>
          <button type="submit" disabled={!ownName.trim()} style={addBtnStyle}>
            + {strings.setupOwnFoodAdd}
          </button>
        </form>
      </Section>
    </>
  );

  const buttons = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button type="button" onClick={closeSetup} style={ghostBtnStyle}>
        {strings.setupSkip}
      </button>
      <button type="button" onClick={save} style={primaryBtnStyle}>
        {strings.setupSave}
      </button>
    </div>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 17, fontWeight: 700 }}>{strings.setupTitle}</span>
      <button
        type="button"
        onClick={closeSetup}
        aria-label={strings.setupSkip}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--muted)',
          padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );

  if (!desktop) {
    // Full-screen sheet: header and buttons stay put, only the questions scroll.
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={strings.setupTitle}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 18px 10px', borderBottom: '1px solid var(--border-soft)' }}>
          {header}
        </div>
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '14px 18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {body}
        </div>
        <div
          style={{
            padding: '12px 18px calc(16px + env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          {buttons}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div
        onClick={closeSetup}
        style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.55)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={strings.setupTitle}
        style={{
          position: 'relative',
          margin: '32px auto',
          width: 520,
          maxWidth: 'calc(100vw - 28px)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 22px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxSizing: 'border-box',
        }}
      >
        {header}
        {body}
        {buttons}
      </div>
    </div>
  );
}
