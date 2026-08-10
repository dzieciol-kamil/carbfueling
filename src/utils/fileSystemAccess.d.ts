// Minimal ambient types for the File System Access API's showSaveFilePicker.
// Not yet part of TypeScript's bundled "dom" lib, and this project only
// needs the small save-file slice of the spec (used by src/utils/fileSave.ts
// for the settings export "Save As" flow) — so we declare just that here
// rather than pulling in a full third-party types package.

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle {
  readonly kind: 'file';
  readonly name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface SaveFilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: SaveFilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
}

// Declared as a plain (non-optional) member so `'showSaveFilePicker' in window`
// narrows the type without leaving a spurious `| undefined`. Runtime support
// detection still happens via that `in` check at the call site — this
// interface only exists to give TS a type for the property once detected.
interface Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
}
