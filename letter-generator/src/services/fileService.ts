/**
 * File Service - Handles file save operations
 *
 * This service provides file save functionality for both Tauri (desktop) and web environments.
 * In Tauri, it uses native file dialogs. In web, it falls back to browser download.
 */

import type { EngagementLetterData } from '../types';
import { generateFilename } from './documentGenerator';

// ==================== TYPE DEFINITIONS ====================

export interface SaveFileOptions {
  filename: string;
  data: Blob | Uint8Array | string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// ==================== TAURI DETECTION ====================

declare global {
  interface Window {
    __TAURI__?: {
      dialog: {
        save: (options: {
          defaultPath?: string;
          filters?: Array<{ name: string; extensions: string[] }>;
        }) => Promise<string | null>;
      };
      fs: {
        writeBinaryFile: (path: string, data: Uint8Array) => Promise<void>;
        writeTextFile: (path: string, data: string) => Promise<void>;
      };
      path: {
        documentDir: () => Promise<string>;
        join: (...paths: string[]) => Promise<string>;
      };
    };
  }
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

// ==================== TAURI FILE OPERATIONS ====================

async function saveFileTauri(options: SaveFileOptions): Promise<SaveResult> {
  if (!window.__TAURI__) {
    return { success: false, error: 'Tauri not available' };
  }

  try {
    const { dialog, fs, path } = window.__TAURI__;

    // Get documents directory as default location
    const documentsDir = await path.documentDir();
    const defaultPath = await path.join(documentsDir, options.filename);

    // Show save dialog
    const filePath = await dialog.save({
      defaultPath,
      filters: options.filters,
    });

    if (!filePath) {
      return { success: false, error: 'Save cancelled by user' };
    }

    // Convert data to Uint8Array if needed
    let dataArray: Uint8Array;
    if (options.data instanceof Blob) {
      const arrayBuffer = await options.data.arrayBuffer();
      dataArray = new Uint8Array(arrayBuffer);
    } else if (typeof options.data === 'string') {
      const encoder = new TextEncoder();
      dataArray = encoder.encode(options.data);
    } else {
      dataArray = options.data;
    }

    // Write file
    await fs.writeBinaryFile(filePath, dataArray);

    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving file',
    };
  }
}

// ==================== BROWSER FILE OPERATIONS ====================

async function saveFileBrowser(options: SaveFileOptions): Promise<SaveResult> {
  try {
    // Convert data to Blob if needed
    let blob: Blob;
    if (options.data instanceof Blob) {
      blob = options.data;
    } else if (typeof options.data === 'string') {
      blob = new Blob([options.data], { type: 'text/plain' });
    } else {
      blob = new Blob([options.data]);
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving file',
    };
  }
}

// ==================== PUBLIC API ====================

export async function saveFile(options: SaveFileOptions): Promise<SaveResult> {
  if (isTauri()) {
    return saveFileTauri(options);
  }
  return saveFileBrowser(options);
}

export async function saveDocxFile(blob: Blob, filename: string): Promise<SaveResult> {
  return saveFile({
    filename,
    data: blob,
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
  });
}

export async function savePdfFile(blob: Blob, filename: string): Promise<SaveResult> {
  return saveFile({
    filename,
    data: blob,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });
}

export async function saveEngagementLetterDocx(
  blob: Blob,
  data: EngagementLetterData
): Promise<SaveResult> {
  const filename = generateFilename(data, 'docx');
  return saveDocxFile(blob, filename);
}

export async function saveEngagementLetterPdf(
  blob: Blob,
  data: EngagementLetterData
): Promise<SaveResult> {
  const filename = generateFilename(data, 'pdf');
  return savePdfFile(blob, filename);
}

// ==================== UTILITY FUNCTIONS ====================

export function downloadBlob(blob: Blob, filename: string): void {
  console.log('downloadBlob called:', { filename, blobSize: blob.size, blobType: blob.type });

  if (!blob || blob.size === 0) {
    console.error('downloadBlob: Blob is empty or null');
    throw new Error('Cannot download empty file');
  }

  const url = URL.createObjectURL(blob);
  console.log('Created object URL:', url);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  console.log('Triggering download click for:', filename);
  a.click();

  // Delay cleanup to ensure download starts
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Download cleanup complete');
  }, 100);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
