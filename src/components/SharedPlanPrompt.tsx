import { useEffect, useState } from 'react';
import {
  decodeSharedPlan,
  sharedPlanToSettingsData,
  SHARE_PARAM,
  type SharedPlan,
} from '../domain/sharePlan';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { ConfirmDialog } from './ui/ConfirmDialog';

/**
 * Handles arriving at the calculator on a `?p=` share link: decode it, ask before
 * overwriting whatever plan this browser already has, and strip the param either way.
 *
 * The param is removed as soon as it has been read, not after the answer — a refresh must
 * not re-ask, and "Udostępnij" from this point on has to produce a link to *this* browser's
 * plan rather than re-emitting the one that just arrived (spec §5.4). A link that fails to
 * decode is treated as if it were never there: a truncated paste should not error the app.
 *
 * Rendered in both of App.tsx's branches, the same way TourOverlay is — the dialog is a
 * full-screen overlay, so it needs no desktop/mobile variant.
 */
export function SharedPlanPrompt() {
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  const [pending, setPending] = useState<SharedPlan | null>(null);

  useEffect(() => {
    const url = new URL(location.href);
    const param = url.searchParams.get(SHARE_PARAM);
    if (!param) return;
    url.searchParams.delete(SHARE_PARAM);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    setPending(decodeSharedPlan(param));
  }, []);

  if (!pending) return null;

  function apply() {
    // Capture before clearing: setPending(null) must not race the value we are about to import.
    const plan = pending;
    setPending(null);
    if (!plan) return;
    const { getSettingsExportData, importSettings } = useAppStore.getState();
    importSettings(sharedPlanToSettingsData(plan, getSettingsExportData()));
  }

  return (
    <ConfirmDialog
      title={strings.sharedPlanConfirmTitle}
      body={strings.sharedPlanConfirmBody}
      cancelLabel={strings.sharedPlanConfirmCancel}
      confirmLabel={strings.sharedPlanConfirmConfirm}
      onCancel={() => setPending(null)}
      onConfirm={apply}
    />
  );
}
