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
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
  }
}

function isTauri(): boolean {
  // Tauri 2.x uses __TAURI_INTERNALS__, Tauri 1.x uses __TAURI__
  return typeof window !== 'undefined' && (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__);
}

// ==================== TAURI FILE OPERATIONS ====================

async function saveFileTauri(options: SaveFileOptions): Promise<SaveResult> {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const { documentDir, join } = await import('@tauri-apps/api/path');

    // Get documents directory as default location
    const docsDir = await documentDir();
    const defaultPath = await join(docsDir, options.filename);

    // Show save dialog
    const filePath = await save({
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
    await writeFile(filePath, dataArray);

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

/**
 * Save a blob to a specific directory using Tauri's fs plugin
 * Falls back to browser download if no output directory specified or if not in Tauri
 */
export async function saveBlobToDirectory(
  blob: Blob,
  filename: string,
  outputDirectory?: string
): Promise<void> {
  console.log('saveBlobToDirectory called:', { filename, outputDirectory, blobSize: blob.size, isTauriEnv: isTauri() });

  // If no output directory, use browser download
  if (!outputDirectory) {
    console.log('No output directory specified, using browser download');
    downloadBlob(blob, filename);
    return;
  }

  // Try to use Tauri's fs plugin
  if (isTauri()) {
    try {
      const { writeFile } = await import('@tauri-apps/plugin-fs');

      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Construct full path - ensure proper path separator and no double separators
      let fullPath = outputDirectory;
      if (!fullPath.endsWith('/') && !fullPath.endsWith('\\')) {
        fullPath += outputDirectory.includes('/') ? '/' : '\\';
      }
      fullPath += filename;

      console.log('Attempting to save file to:', fullPath, 'Size:', uint8Array.length);

      await writeFile(fullPath, uint8Array);
      console.log('File saved successfully:', fullPath);
    } catch (error) {
      console.error('Failed to save file with Tauri fs:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      // Fall back to browser download
      console.log('Falling back to browser download');
      downloadBlob(blob, filename);
    }
  } else {
    // Not in Tauri, use browser download
    console.log('Not in Tauri environment, using browser download');
    downloadBlob(blob, filename);
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
