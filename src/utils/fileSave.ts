// Shared "save a file" helpers used by the settings export feature
// (Header.tsx desktop, MobileProfile.tsx mobile "Me" tab) and by the share
// panel's PNG downloads (components/share/SharePanel.tsx).
//
// Prefers the File System Access API's native "Save As" dialog so the user
// can choose a destination folder and filename. That API is only available
// in Chromium-based browsers (Chrome, Edge, Arc) as of writing — Firefox and
// Safari fall back to the classic Blob + <a download> trick, which always
// saves silently straight to the browser's default downloads folder.

export async function saveTextFile(
  content: string,
  filename: string,
  mimeType = 'application/json',
): Promise<void> {
  return saveBlobFile(new Blob([content], { type: mimeType }), filename, mimeType);
}

export async function saveBlobFile(
  blob: Blob,
  filename: string,
  mimeType = blob.type || 'application/octet-stream',
): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const dot = filename.lastIndexOf('.');
      const ext = dot >= 0 ? filename.slice(dot) : '';
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: mimeType, accept: { [mimeType]: ext ? [ext] : [] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      // User dismissed the native picker — not a failure, do nothing.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
  }

  downloadViaAnchor(blob, filename);
}

function downloadViaAnchor(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
