// Shared "save text to a file" helper used by the settings export feature
// (Header.tsx desktop, MobileProfile.tsx mobile "Me" tab).
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
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([content], { type: mimeType }));
      await writable.close();
      return;
    } catch (err) {
      // User dismissed the native picker — not a failure, do nothing.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
  }

  downloadViaAnchor(content, filename, mimeType);
}

function downloadViaAnchor(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
