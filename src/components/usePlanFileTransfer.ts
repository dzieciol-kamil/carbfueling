import { useRef, useState, type ChangeEvent } from 'react';
import {
  buildSettingsExport,
  parseSettingsImport,
  serializeSettingsExport,
  settingsExportFileName,
  type PlanFeedback,
} from '../domain/settingsExport';
import { useAppStore } from '../store/appStore';
import { saveTextFile } from '../utils/fileSave';

// Shared save/load-a-plan-file logic behind the "Download plan"/"Load plan" buttons —
// used by Header.tsx (desktop, moving to ChartCard.tsx) and MobileProfile.tsx (mobile "Me"
// tab). Both call sites ran identical handlers before this was pulled out; this is that
// same code, not a rewrite. Each caller still renders its own buttons/feedback banner/file
// input and wires them to what's returned here, since their markup and styling differ.
export function usePlanFileTransfer() {
  const getSettingsExportData = useAppStore((s) => s.getSettingsExportData);
  const importSettings = useAppStore((s) => s.importSettings);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [planFeedback, setPlanFeedback] = useState<PlanFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setPlanFeedback(null);
    const file = buildSettingsExport(getSettingsExportData());
    try {
      await saveTextFile(serializeSettingsExport(file), settingsExportFileName());
    } catch {
      setPlanFeedback('export-error');
    }
  };

  const handleImportPick = () => fileInputRef.current?.click();

  // Always confirm before import: it silently overwrites the entire plan — route, gear,
  // mix, fills, foods and stops, not just narrow "settings" — a rare, deliberate action,
  // so there's no real UX cost to asking every time rather than trying to detect "is there
  // anything worth losing".
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (file) setPendingImportFile(file);
  };

  const applyImportedFile = async (file: File) => {
    setPlanFeedback(null);
    try {
      const text = await file.text();
      const result = parseSettingsImport(text);
      if (!result.ok) {
        setPlanFeedback('import-error');
        return;
      }
      importSettings(result.data);
      setPlanFeedback('import-success');
    } catch {
      setPlanFeedback('import-error');
    }
  };

  const cancelImport = () => setPendingImportFile(null);
  const confirmImport = () => {
    const file = pendingImportFile;
    setPendingImportFile(null);
    if (file) void applyImportedFile(file);
  };

  return {
    fileInputRef,
    planFeedback,
    setPlanFeedback,
    pendingImportFile,
    handleExport,
    handleImportPick,
    handleFileInputChange,
    cancelImport,
    confirmImport,
  };
}
