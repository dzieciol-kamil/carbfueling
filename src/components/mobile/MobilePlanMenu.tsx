import { useEffect, useState } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { AutoplanFlow } from '../autoplan/AutoplanFlow';
import { PrintIcon } from '../print/PrintIcon';
import { ShareIcon } from '../share/ShareIcon';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MenuButton } from '../ui/MenuButton';
import { DownloadIcon, StartOverIcon, UploadIcon, WandIcon } from '../ui/planIcons';
import { usePlanFileTransfer } from '../usePlanFileTransfer';

/**
 * Everything the phone can do with the plan as a whole, in one menu beside "Edit route". The
 * trigger keeps the autoplan button's green, and "Suggest a plan" leads the list in the same green:
 * it is the app's main action, and folding it into a neutral menu would hide it.
 */
export function MobilePlanMenu() {
  const lang = useAppStore((s) => s.ui.lang);
  const clearPlan = useAppStore((s) => s.clearPlan);
  const openPanel = useAppStore((s) => s.openPanel);
  const strings = t(lang);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const {
    fileInputRef,
    planFeedback,
    setPlanFeedback,
    pendingImportFile,
    handleExport,
    handleImportPick,
    handleFileInputChange,
    cancelImport,
    confirmImport,
  } = usePlanFileTransfer();

  // The same auto-dismiss as the desktop row's banner (ChartCard.tsx).
  useEffect(() => {
    if (!planFeedback) return;
    const timer = setTimeout(() => setPlanFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [planFeedback, setPlanFeedback]);

  return (
    <div style={{ position: 'relative' }}>
      <AutoplanFlow
        variant="mobile"
        renderTrigger={({ start, disabled, title, style }) => (
          <MenuButton
            label={strings.planMenuButton}
            triggerStyle={style}
            align="right"
            items={[
              {
                key: 'autoplan',
                label: strings.autoplanButton,
                icon: <WandIcon />,
                accent: true,
                disabled,
                title,
                onSelect: start,
              },
              {
                key: 'clear',
                label: strings.clearPlanButton,
                icon: <StartOverIcon />,
                onSelect: () => setClearConfirmOpen(true),
              },
              {
                key: 'export',
                label: strings.exportPlanButton,
                icon: <DownloadIcon />,
                onSelect: handleExport,
              },
              {
                key: 'import',
                label: strings.importPlanButton,
                icon: <UploadIcon />,
                onSelect: handleImportPick,
              },
              {
                key: 'share',
                label: strings.sharePlanButton,
                icon: <ShareIcon />,
                onSelect: () => openPanel('share'),
              },
              {
                key: 'print',
                label: strings.printPlanButton,
                icon: <PrintIcon />,
                onSelect: () => window.print(),
              },
            ]}
          />
        )}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      {planFeedback && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 240,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 12px',
            boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
            fontSize: 12,
            lineHeight: 1.5,
            color: planFeedback === 'import-success' ? 'var(--muted-2)' : 'var(--danger)',
            zIndex: 60,
          }}
        >
          {planFeedback === 'import-error'
            ? strings.importPlanError
            : planFeedback === 'import-success'
              ? strings.importPlanSuccess
              : strings.exportPlanError}
        </div>
      )}

      {pendingImportFile && (
        <ConfirmDialog
          title={strings.importPlanConfirmTitle}
          body={strings.importPlanConfirmBody}
          cancelLabel={strings.importPlanConfirmCancel}
          confirmLabel={strings.importPlanConfirmConfirm}
          onCancel={cancelImport}
          onConfirm={confirmImport}
        />
      )}

      {clearConfirmOpen && (
        <ConfirmDialog
          title={strings.clearPlanConfirmTitle}
          body={strings.clearPlanConfirmBody}
          cancelLabel={strings.clearPlanConfirmCancel}
          confirmLabel={strings.clearPlanConfirmConfirm}
          onCancel={() => setClearConfirmOpen(false)}
          onConfirm={() => {
            clearPlan();
            setClearConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}
