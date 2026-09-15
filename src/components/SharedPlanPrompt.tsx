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
 * Reads and strips the `?p=` param once per page load, at module scope rather than in the
 * component's mount effect. App.tsx renders SharedPlanPrompt in both its mobile and its
 * desktop branch, which are separate subtrees: crossing DESKTOP_BREAKPOINT (a resize, a
 * tablet rotating) unmounts one instance and mounts a fresh one. A mount effect would find
 * the URL already stripped by the first instance and the dialog would vanish mid-decision,
 * with no way back because the link is gone from the address bar. Hoisting the read out
 * means both instances initialise from the same cached plan.
 *
 * The param is removed as soon as it has been read, not after the answer — a refresh must
 * not re-ask, and "Udostępnij" from this point on has to produce a link to *this* browser's
 * plan rather than re-emitting the one that just arrived (spec §5.4). A link that fails to
 * decode is treated as if it were never there: a truncated paste should not error the app
 * (decodeSharedPlan returns null instead of throwing).
 *
 * decodeSharedPlan is async now (it awaits DecompressionStream), so what is cached here is a
 * *promise* of the decoded plan rather than the plan itself. That does not weaken the
 * synchronous guarantee above: the URL read and the history.replaceState strip below still
 * happen inline, before decodeSharedPlan is even called — only the decode result is awaited,
 * and only later, inside the component.
 */
let pendingSharedPlan: Promise<SharedPlan | null> | null = readSharedPlanFromUrl();

function readSharedPlanFromUrl(): Promise<SharedPlan | null> | null {
  const url = new URL(location.href);
  const param = url.searchParams.get(SHARE_PARAM);
  if (!param) return null;
  url.searchParams.delete(SHARE_PARAM);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  return decodeSharedPlan(param);
}

/** Drops the cached plan once the user has answered, so a later remount in the other
 *  branch does not re-ask. Idempotent — a second call is a no-op. */
function consumePendingSharedPlan(): void {
  pendingSharedPlan = null;
}

/**
 * Asks before overwriting whatever plan this browser already has with one that arrived
 * on a share link.
 *
 * Rendered in both of App.tsx's branches, the same way TourOverlay is — the dialog is a
 * full-screen overlay, so it needs no desktop/mobile variant.
 */
export function SharedPlanPrompt() {
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  const [pending, setPending] = useState<SharedPlan | null>(null);

  // The module-scope promise is what carries the plan across a desktop/mobile remount (see
  // pendingSharedPlan above) — this effect just waits for whichever promise was captured at
  // module load and, if nothing has consumed it since (dismiss()/apply() null it out), shows
  // the dialog. The cancellation flag stops a late resolution from reopening the dialog after
  // this particular instance has already unmounted.
  useEffect(() => {
    const plan = pendingSharedPlan;
    if (!plan) return;
    let cancelled = false;
    plan.then((decoded) => {
      if (!cancelled && pendingSharedPlan === plan) setPending(decoded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!pending) return null;

  function dismiss() {
    consumePendingSharedPlan();
    setPending(null);
  }

  function apply() {
    // Capture before clearing: dismiss() must not race the value we are about to import.
    const plan = pending;
    dismiss();
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
      onCancel={dismiss}
      onConfirm={apply}
    />
  );
}
