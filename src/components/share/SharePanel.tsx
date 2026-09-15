import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { buildSharedPlan, encodeSharedPlan, SHARE_PARAM } from '../../domain/sharePlan';
import { shareBlurb, shareStats } from '../../domain/shareSummary';
import { countedNoun, t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { saveBlobFile } from '../../utils/fileSave';
import { canvasSize, renderShareImage, shareImageFileName, type ShareLayout } from './shareCanvas';

interface SharePanelProps {
  desktop: boolean;
}

type FormatId = 'link' | 'text' | 'badge' | 'qr' | 'chart';

const FORMATS: FormatId[] = ['link', 'text', 'badge', 'chart', 'qr'];

const LAYOUT_OF: Partial<Record<FormatId, ShareLayout>> = {
  badge: 'badge',
  qr: 'qr',
  chart: 'chart',
};

// minHeight keeps a real tap target in the mobile bottom sheet, where the padding alone
// would leave the buttons under the usual 44px floor.
const actionBtn: CSSProperties = {
  border: '1px solid var(--chip-border)',
  background: 'var(--selected-bg)',
  color: 'var(--on-brand)',
  borderRadius: 10,
  padding: '10px 16px',
  minHeight: 44,
  fontFamily: 'Archivo, sans-serif',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

/** The secondary half of an action pair, styled like ConfirmDialog's cancel button. */
const secondaryBtn: CSSProperties = {
  ...actionBtn,
  background: 'var(--surface)',
  color: 'var(--ink-soft)',
  fontWeight: 600,
};

const disabledBtn: CSSProperties = { opacity: 0.5, cursor: 'not-allowed' };

const cueBtn: CSSProperties = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  padding: 8,
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

/** Desktop only: the panel is pinned to the viewport's centre (`top: 50%` + a -50% translate), so
 *  an arrow at the panel's own vertical centre stays put however tall the current format makes it.
 *  In the mobile bottom sheet the panel grows upwards from `bottom: 0` and its centre moves, so
 *  there the arrows stay in normal flow next to the title. */
const cueEdge = (side: 'left' | 'right'): CSSProperties => ({
  ...cueBtn,
  position: 'absolute',
  [side]: 10,
  top: '50%',
  transform: 'translateY(-50%)',
});

const previewBox: CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border-soft)',
  borderRadius: 10,
  padding: 12,
  minHeight: 120,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** How much of the viewport the panel's own chrome takes around the preview — its margins, the
 *  title, the weight opt-in, the carousel head, the dots, the buttons and every gap between them,
 *  measured with a little slack for a hint that wraps to two lines. The preview canvas is capped
 *  at what is left, because a percentage cap cannot work here: the box it sits in is a flex item
 *  whose height comes out of flex shrinking, which is indefinite as far as `max-height: 100%` is
 *  concerned, so the canvas would keep the height its aspect ratio implies and spill out. */
const PREVIEW_CHROME_PX = 344;

const codeStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  lineHeight: 1.6,
  color: 'var(--ink-soft)',
  wordBreak: 'break-all',
  whiteSpace: 'pre-wrap',
  textAlign: 'left',
  width: '100%',
};

/**
 * The share panel: a weight opt-in, then a one-at-a-time carousel over the five ways to hand
 * this plan to someone. Gated on `ui.panel === 'share'` and rendered in both of App.tsx's
 * branches with a `desktop` prop, exactly like ChartHelpModal — the overlay geometry is the
 * only thing that differs between the two.
 */
export function SharePanel({ desktop }: SharePanelProps) {
  const open = useAppStore((s) => s.ui.panel === 'share');
  const lang = useAppStore((s) => s.ui.lang);
  const closePanel = useAppStore((s) => s.closePanel);
  const includeWeight = useAppStore((s) => s.ui.shareIncludeWeight);
  const setIncludeWeight = useAppStore((s) => s.setShareIncludeWeight);
  // Subscribed, not read through getState(), so editing the plan behind an open panel
  // re-renders the preview instead of leaving a stale link on screen.
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const shops = useAppStore((s) => s.shops);
  const foodLib = useAppStore((s) => s.foodLib);
  const strings = t(lang);

  const [index, setIndex] = useState(0);
  // The message carries a sequence number so copying twice is a real state change: the same text
  // set again would leave the state untouched, and the auto-dismiss effect below would never
  // re-run — the second toast would then inherit the first one's remaining time.
  const [feedback, setFeedback] = useState<{ text: string; seq: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const format = FORMATS[index];
  const layout = LAYOUT_OF[format];

  // The body reads the whole export snapshot rather than reassembling one from the slices
  // above, so the link always encodes exactly what importSettings consumes on the far end.
  // The slices are therefore the invalidation signal, not the input: every field the codec
  // touches is one of them, so a change to any of them is what makes the link go stale.
  const url = useMemo(() => {
    const data = useAppStore.getState().getSettingsExportData();
    const encoded = encodeSharedPlan(buildSharedPlan(data, includeWeight));
    // location.origin + pathname, so the link keeps whatever base path this build is served
    // under (/preview/ included) and whichever language the sender is using.
    return `${location.origin}${location.pathname}?${SHARE_PARAM}=${encoded}`;
  }, [includeWeight, route, mix, gear, fills, foods, shops]);

  const plan = useMemo(
    () => ({ route, mix, gear, fills, foods, foodLib }),
    [route, mix, gear, fills, foods, foodLib],
  );
  const stats = useMemo(() => shareStats(plan, shops), [plan, shops]);
  // The stop count is inflected here, not in the domain layer: picking "postój"/"postoje"/
  // "postojów" needs both the string table and the language, and shareSummary.ts has neither.
  const blurb = shareBlurb(
    stats,
    strings.shareBlurbTemplate,
    countedNoun(stats.stops, strings.shareStopsPlural, lang),
  );

  // t() returns a fresh table on every call, so the canvas labels are memoised on the language
  // instead — otherwise the render effect below would fire on every keystroke behind the panel.
  const labels = useMemo(() => {
    const s = t(lang);
    return {
      distance: s.shareStatDistance,
      duration: s.shareStatDuration,
      carbs: s.shareStatCarbs,
      hydration: s.shareStatHydration,
      vessels: s.shareStatVessels,
      stops: s.shareStatStops,
      legendCarbs: s.shareLegendCarbs,
      legendWater: s.shareLegendWater,
    };
  }, [lang]);

  // The QR layouts size themselves from the link, so the preview's aspect ratio depends on the
  // url too — and computing it re-encodes the QR, which is too slow to redo on every render.
  const canvasDims = useMemo(() => (layout ? canvasSize(layout, url) : null), [layout, url]);
  // No size means the link does not fit in a QR code at all (see QR_MAX_BYTES). Only the 'qr'
  // format carries one, so every other format — the links included — is unaffected.
  const qrTooLarge = layout === 'qr' && !canvasDims;

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!open || !layout || !canvasRef.current) return;
    renderShareImage(canvasRef.current, {
      layout,
      url,
      stats,
      caption: blurb,
      labels,
      plan,
    });
  }, [open, layout, url, stats, blurb, labels, plan]);

  if (!open) return null;

  function say(text: string) {
    setFeedback((prev) => ({ text, seq: (prev?.seq ?? 0) + 1 }));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      say(strings.shareCopied);
    } catch {
      say(strings.shareCopyError);
    }
  }

  /** The one PNG both image buttons hand out, so copy and download can never diverge. */
  function shareBlob(): Promise<Blob> {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.reject(new Error('share canvas missing'));
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob produced no image'))),
        'image/png',
      ),
    );
  }

  async function copyImage() {
    if (typeof ClipboardItem === 'undefined' || typeof navigator.clipboard?.write !== 'function') {
      say(strings.shareCopyImageError);
      return;
    }
    try {
      // The blob promise is passed in unresolved on purpose: awaiting it first would end the
      // click's user-gesture window, and Safari (iOS above all) then rejects the write.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': shareBlob() })]);
      say(strings.shareCopied);
    } catch {
      say(strings.shareCopyImageError);
    }
  }

  async function download() {
    if (!layout) return;
    try {
      await saveBlobFile(
        await shareBlob(),
        shareImageFileName(layout, {
          badge: strings.shareFileBadge,
          qr: strings.shareFileQr,
          chart: strings.shareFileChart,
        }),
        'image/png',
      );
    } catch {
      say(strings.shareDownloadError);
    }
  }

  const titleOf: Record<FormatId, string> = {
    link: strings.shareFormatLink,
    text: strings.shareFormatText,
    badge: strings.shareFormatBadge,
    qr: strings.shareFormatQr,
    chart: strings.shareFormatChart,
  };
  const hintOf: Record<FormatId, string> = {
    link: strings.shareFormatLinkHint,
    text: strings.shareFormatTextHint,
    badge: strings.shareFormatBadgeHint,
    qr: strings.shareFormatQrHint,
    chart: strings.shareFormatChartHint,
  };

  const panelStyle: CSSProperties = desktop
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxWidth: 'calc(100vw - 28px)',
        maxHeight: 'calc(100vh - 40px)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        // The side padding is the arrows' lane: they sit inside it, flanking the content rather
        // than over it, at every panel height and down to the `maxWidth` clamp.
        padding: '18px 46px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        boxSizing: 'border-box',
      }
    : {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '94vh',
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.22)',
        padding: '16px 18px calc(16px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        boxSizing: 'border-box',
      };

  const step = (delta: number) => setIndex((i) => (i + delta + FORMATS.length) % FORMATS.length);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 210 }}>
      <div
        onClick={closePanel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.55)' }}
      />
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.sharePanelTitle}</span>
          <button
            onClick={closePanel}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--muted)',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <label
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={includeWeight}
            onChange={(e) => setIncludeWeight(e.target.checked)}
          />
          <span>
            {strings.shareIncludeWeight} ({Math.round(route.weight)} kg)
          </span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={strings.sharePrevFormat}
            style={desktop ? cueEdge('left') : cueBtn}
          >
            <span className="share-cue share-cue-left" aria-hidden="true">
              <i />
            </span>
          </button>

          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{titleOf[format]}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.45, marginTop: 3 }}>
              {hintOf[format]}
            </div>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label={strings.shareNextFormat}
            style={desktop ? cueEdge('right') : cueBtn}
          >
            <span className="share-cue" aria-hidden="true">
              <i />
            </span>
          </button>
        </div>

        <div style={previewBox}>
          {format === 'link' && <code style={codeStyle}>{url}</code>}
          {format === 'text' && (
            <code style={codeStyle}>
              {blurb}
              {'\n'}
              {url}
            </code>
          )}
          {qrTooLarge && (
            <span style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>
              {strings.shareQrTooLarge}
            </span>
          )}
          {layout && canvasDims && (
            <canvas
              ref={canvasRef}
              style={{
                // Fitted to the space in *both* axes rather than stretched to the box's width:
                // the near-square 'qr' canvas is taller than the panel can be, and a canvas at
                // `width: 100%` keeps the height its aspect ratio implies and spills out of the
                // preview box. The wide formats never got tall enough to show it. The bitmap is
                // untouched either way, so the download keeps its full resolution.
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: `calc(100vh - ${PREVIEW_CHROME_PX}px)`,
                aspectRatio: `${canvasDims.w} / ${canvasDims.h}`,
                borderRadius: 8,
                border: '1px solid var(--border-soft)',
              }}
            />
          )}
        </div>

        <div className="share-dots" aria-hidden="true">
          {FORMATS.map((f, i) => (
            <i key={f} className={i === index ? 'is-current' : undefined} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {format === 'link' && (
            <button style={actionBtn} onClick={() => void copy(url)}>
              {strings.shareCopyLink}
            </button>
          )}
          {format === 'text' && (
            <button style={actionBtn} onClick={() => void copy(`${blurb}\n${url}`)}>
              {strings.shareCopyText}
            </button>
          )}
          {layout && (
            <>
              <button
                style={qrTooLarge ? { ...secondaryBtn, ...disabledBtn } : secondaryBtn}
                disabled={qrTooLarge}
                onClick={() => void copyImage()}
              >
                {strings.shareCopyImage}
              </button>
              <button
                style={qrTooLarge ? { ...actionBtn, ...disabledBtn } : actionBtn}
                disabled={qrTooLarge}
                onClick={() => void download()}
              >
                {strings.shareDownloadPng}
              </button>
            </>
          )}
        </div>

        <div style={{ minHeight: 16, fontSize: 11, color: 'var(--muted-2)', textAlign: 'center' }}>
          {feedback?.text}
        </div>
      </div>
    </div>
  );
}
