/**
 * Storage Service
 * Handles file system operations with Tauri or browser fallback
 */

import type { EngagementLetterData, LetterTemplate, AdvisorInfo } from '../types';

// ==================== TYPE DEFINITIONS ====================

interface StorageConfig {
  appDataDir: string;
  templatesDir: string;
  settingsFile: string;
  recentDocsFile: string;
}

interface AppSettings {
  defaultAdvisor: Partial<AdvisorInfo>;
  defaultOutputDirectory: string;
  defaultFileNamingPattern: string;
  defaultOutputFormat: 'docx' | 'pdf' | 'both';
  autoSaveEnabled: boolean;
  showPreviewPane: boolean;
  firmName: string;
  firmDocumentsDefaults: {
    formCRS: boolean;
    formADV: boolean;
    regBIDisclosure: boolean;
    brokerageAgreement: boolean;
    investmentAdvisoryAgreement: boolean;
  };
}

interface RecentDocument {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  filePath?: string;
  clientName?: string;
}

// ==================== TAURI API DETECTION ====================

interface TauriFS {
  readTextFile: (path: string) => Promise<string>;
  writeTextFile: (path: string, contents: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  createDir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
  readDir: (path: string) => Promise<Array<{ name: string; path: string }>>;
}

interface TauriPath {
  appDataDir: () => Promise<string>;
  join: (...paths: string[]) => Promise<string>;
}

// Check if running in Tauri environment
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Get Tauri APIs (returns null if not in Tauri)
async function getTauriApis(): Promise<{ fs: TauriFS; path: TauriPath } | null> {
  if (!isTauri()) return null;

  try {
    // Dynamic import for Tauri APIs - these will only resolve in Tauri environment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tauriWindow = window as any;

    // Check if Tauri APIs are available
    if (!tauriWindow.__TAURI_INTERNALS__) {
      console.warn('Tauri internals not available');
      return null;
    }

    // Use Tauri's invoke pattern for file system operations
    // This avoids the need for @tauri-apps/plugin-fs to be installed
    const invoke = tauriWindow.__TAURI_INTERNALS__.invoke;
    if (!invoke) {
      console.warn('Tauri invoke not available');
      return null;
    }

    // For now, return null to use browser storage
    // Full Tauri integration can be added when the Tauri plugins are configured
    console.log('Tauri detected, but using browser storage for compatibility');
    return null;
  } catch (error) {
    console.warn('Tauri APIs not available, using browser storage:', error);
    return null;
  }
}

// ==================== BROWSER STORAGE FALLBACK ====================

const STORAGE_PREFIX = 'federal-letter-generator:';

function browserStorageGet<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function browserStorageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function browserStorageRemove(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

function browserStorageGetAll(prefix: string): Array<{ key: string; value: unknown }> {
  const results: Array<{ key: string; value: unknown }> = [];
  const fullPrefix = `${STORAGE_PREFIX}${prefix}`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(fullPrefix)) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || '');
        results.push({ key: key.replace(STORAGE_PREFIX, ''), value });
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return results;
}

// ==================== TAURI FILE SYSTEM OPERATIONS ====================

class TauriStorageService {
  private config: StorageConfig | null = null;
  private tauriApis: { fs: TauriFS; path: TauriPath } | null = null;

  async initialize(): Promise<boolean> {
    this.tauriApis = await getTauriApis();
    if (!this.tauriApis) return false;

    const { fs, path } = this.tauriApis;

    const appData = await path.appDataDir();
    const templatesDir = await path.join(appData, 'templates');
    const settingsFile = await path.join(appData, 'settings.json');
    const recentDocsFile = await path.join(appData, 'recent-documents.json');

    this.config = {
      appDataDir: appData,
      templatesDir,
      settingsFile,
      recentDocsFile,
    };

    // Ensure directories exist
    if (!(await fs.exists(appData))) {
      await fs.createDir(appData, { recursive: true });
    }
    if (!(await fs.exists(templatesDir))) {
      await fs.createDir(templatesDir, { recursive: true });
    }

    return true;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.config || !this.tauriApis) return;
    await this.tauriApis.fs.writeTextFile(this.config.settingsFile, JSON.stringify(settings, null, 2));
  }

  async loadSettings(): Promise<AppSettings | null> {
    if (!this.config || !this.tauriApis) return null;

    try {
      if (await this.tauriApis.fs.exists(this.config.settingsFile)) {
        const content = await this.tauriApis.fs.readTextFile(this.config.settingsFile);
        return JSON.parse(content);
      }
    } catch {
      console.error('Failed to load settings');
    }
    return null;
  }

  async saveTemplate(template: LetterTemplate): Promise<void> {
    if (!this.config || !this.tauriApis) return;

    const filePath = await this.tauriApis.path.join(this.config.templatesDir, `${template.id}.json`);
    await this.tauriApis.fs.writeTextFile(filePath, JSON.stringify(template, null, 2));
  }

  async loadTemplate(id: string): Promise<LetterTemplate | null> {
    if (!this.config || !this.tauriApis) return null;

    try {
      const filePath = await this.tauriApis.path.join(this.config.templatesDir, `${id}.json`);
      if (await this.tauriApis.fs.exists(filePath)) {
        const content = await this.tauriApis.fs.readTextFile(filePath);
        return JSON.parse(content);
      }
    } catch {
      console.error(`Failed to load template ${id}`);
    }
    return null;
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!this.config || !this.tauriApis) return;

    try {
      const filePath = await this.tauriApis.path.join(this.config.templatesDir, `${id}.json`);
      if (await this.tauriApis.fs.exists(filePath)) {
        await this.tauriApis.fs.removeFile(filePath);
      }
    } catch {
      console.error(`Failed to delete template ${id}`);
    }
  }

  async getAllTemplates(): Promise<LetterTemplate[]> {
    if (!this.config || !this.tauriApis) return [];

    try {
      const files = await this.tauriApis.fs.readDir(this.config.templatesDir);
      const templates: LetterTemplate[] = [];

      for (const file of files) {
        if (file.name.endsWith('.json')) {
          const content = await this.tauriApis.fs.readTextFile(file.path);
          templates.push(JSON.parse(content));
        }
      }

      return templates;
    } catch {
      return [];
    }
  }

  async saveRecentDocuments(docs: RecentDocument[]): Promise<void> {
    if (!this.config || !this.tauriApis) return;
    await this.tauriApis.fs.writeTextFile(this.config.recentDocsFile, JSON.stringify(docs, null, 2));
  }

  async loadRecentDocuments(): Promise<RecentDocument[]> {
    if (!this.config || !this.tauriApis) return [];

    try {
      if (await this.tauriApis.fs.exists(this.config.recentDocsFile)) {
        const content = await this.tauriApis.fs.readTextFile(this.config.recentDocsFile);
        return JSON.parse(content);
      }
    } catch {
      console.error('Failed to load recent documents');
    }
    return [];
  }
}

// ==================== UNIFIED STORAGE SERVICE ====================

class StorageService {
  private tauriService: TauriStorageService;
  private isInitialized = false;
  private useTauri = false;

  constructor() {
    this.tauriService = new TauriStorageService();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.useTauri = await this.tauriService.initialize();
    this.isInitialized = true;

    console.log(`Storage service initialized (${this.useTauri ? 'Tauri' : 'Browser'} mode)`);
  }

  // Settings
  async saveSettings(settings: AppSettings): Promise<void> {
    if (this.useTauri) {
      await this.tauriService.saveSettings(settings);
    } else {
      browserStorageSet('settings', settings);
    }
  }

  async loadSettings(): Promise<AppSettings | null> {
    if (this.useTauri) {
      return this.tauriService.loadSettings();
    }
    return browserStorageGet<AppSettings>('settings');
  }

  // Templates
  async saveTemplate(template: LetterTemplate): Promise<void> {
    if (this.useTauri) {
      await this.tauriService.saveTemplate(template);
    } else {
      browserStorageSet(`template:${template.id}`, template);
    }
  }

  async loadTemplate(id: string): Promise<LetterTemplate | null> {
    if (this.useTauri) {
      return this.tauriService.loadTemplate(id);
    }
    return browserStorageGet<LetterTemplate>(`template:${id}`);
  }

  async deleteTemplate(id: string): Promise<void> {
    if (this.useTauri) {
      await this.tauriService.deleteTemplate(id);
    } else {
      browserStorageRemove(`template:${id}`);
    }
  }

  async getAllTemplates(): Promise<LetterTemplate[]> {
    if (this.useTauri) {
      return this.tauriService.getAllTemplates();
    }

    const items = browserStorageGetAll('template:');
    return items.map((item) => item.value as LetterTemplate);
  }

  // Recent Documents
  async saveRecentDocuments(docs: RecentDocument[]): Promise<void> {
    if (this.useTauri) {
      await this.tauriService.saveRecentDocuments(docs);
    } else {
      browserStorageSet('recent-documents', docs);
    }
  }

  async loadRecentDocuments(): Promise<RecentDocument[]> {
    if (this.useTauri) {
      return this.tauriService.loadRecentDocuments();
    }
    return browserStorageGet<RecentDocument[]>('recent-documents') || [];
  }

  // Wizard auto-save (always use browser storage for speed)
  saveWizardDraft(data: Partial<EngagementLetterData>): void {
    browserStorageSet('wizard-draft', {
      data,
      savedAt: new Date().toISOString(),
    });
  }

  loadWizardDraft(): { data: Partial<EngagementLetterData>; savedAt: string } | null {
    return browserStorageGet('wizard-draft');
  }

  clearWizardDraft(): void {
    browserStorageRemove('wizard-draft');
  }

  // Check if there's a draft to resume
  hasDraft(): boolean {
    return browserStorageGet('wizard-draft') !== null;
  }
}

// Singleton instance
export const storageService = new StorageService();

// Export types
export type { AppSettings, RecentDocument, StorageConfig };
