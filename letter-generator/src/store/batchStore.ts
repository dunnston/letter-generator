import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BatchJob,
  BatchItem,
  BatchSettings,
  BatchResult,
  ColumnMappingConfig,
  ExcelFile,
  LetterType,
} from '../types';
import {
  createBatchJob,
  validateBatchJob,
  transitionJobState,
  updateItemStatus,
  createBatchResult,
  calculateProgress,
  getBatchSummary,
} from '../services/batchProcessor';

// Default batch settings
const defaultBatchSettings: BatchSettings = {
  letterType: '1099',
  outputFormat: 'docx',
  outputDirectory: '',
  fileNamingPattern: '{clientName}_{letterType}_{date}',
  firmName: '',
  assistantName: '',
  contactEmail: '',
  taxYear: new Date().getFullYear(),
  includeDisclaimer: true,
};

interface BatchState {
  // Current import state
  excelFile: ExcelFile | null;
  rawData: ArrayBuffer | null;

  // Column mapping
  mappingConfig: ColumnMappingConfig | null;

  // Current job
  currentJob: BatchJob | null;

  // Job history (persisted)
  jobHistory: BatchResult[];

  // Settings
  settings: BatchSettings;

  // Saved mapping configurations
  savedMappings: Array<{
    id: string;
    name: string;
    letterType: Exclude<LetterType, 'engagement'>;
    config: ColumnMappingConfig;
    createdAt: string;
  }>;

  // Import actions
  setExcelFile: (file: ExcelFile | null, rawData?: ArrayBuffer) => void;
  selectSheet: (sheetName: string) => void;
  clearImport: () => void;

  // Mapping actions
  setMappingConfig: (config: ColumnMappingConfig) => void;
  updateMapping: (index: number, mapping: Partial<ColumnMappingConfig['mappings'][0]>) => void;
  addMapping: (mapping: ColumnMappingConfig['mappings'][0]) => void;
  removeMapping: (index: number) => void;

  // Saved mapping actions
  saveMappingConfig: (name: string) => void;
  loadMappingConfig: (id: string) => void;
  deleteSavedMapping: (id: string) => void;

  // Job actions
  createJob: (items: BatchItem[]) => void;
  validateJob: () => void;
  startJob: () => void;
  pauseJob: () => void;
  resumeJob: () => void;
  cancelJob: () => void;
  completeJob: () => void;
  updateItemInJob: (
    itemId: string,
    status: BatchItem['status'],
    errorMessage?: string,
    outputPath?: string
  ) => void;
  clearCurrentJob: () => void;

  // Settings actions
  updateSettings: (settings: Partial<BatchSettings>) => void;

  // History actions
  addToHistory: (result: BatchResult) => void;
  clearHistory: () => void;

  // Computed getters
  getProgress: () => number;
  getSummary: () => ReturnType<typeof getBatchSummary> | null;
  canStartJob: () => boolean;
}

export const useBatchStore = create<BatchState>()(
  persist(
    (set, get) => ({
      // Initial state
      excelFile: null,
      rawData: null,
      mappingConfig: null,
      currentJob: null,
      jobHistory: [],
      settings: defaultBatchSettings,
      savedMappings: [],

      // Import actions
      setExcelFile: (file, rawData) =>
        set({
          excelFile: file,
          rawData: rawData || null,
          mappingConfig: null,
          currentJob: null,
        }),

      selectSheet: (sheetName) =>
        set((state) => {
          if (!state.excelFile) return state;
          return {
            excelFile: {
              ...state.excelFile,
              selectedSheet: sheetName,
            },
          };
        }),

      clearImport: () =>
        set({
          excelFile: null,
          rawData: null,
          mappingConfig: null,
          currentJob: null,
        }),

      // Mapping actions
      setMappingConfig: (config) => set({ mappingConfig: config }),

      updateMapping: (index, mapping) =>
        set((state) => {
          if (!state.mappingConfig) return state;
          const newMappings = [...state.mappingConfig.mappings];
          newMappings[index] = { ...newMappings[index], ...mapping };
          return {
            mappingConfig: {
              ...state.mappingConfig,
              mappings: newMappings,
            },
          };
        }),

      addMapping: (mapping) =>
        set((state) => {
          if (!state.mappingConfig) return state;
          return {
            mappingConfig: {
              ...state.mappingConfig,
              mappings: [...state.mappingConfig.mappings, mapping],
            },
          };
        }),

      removeMapping: (index) =>
        set((state) => {
          if (!state.mappingConfig) return state;
          const newMappings = state.mappingConfig.mappings.filter((_, i) => i !== index);
          return {
            mappingConfig: {
              ...state.mappingConfig,
              mappings: newMappings,
            },
          };
        }),

      // Saved mapping actions
      saveMappingConfig: (name) =>
        set((state) => {
          if (!state.mappingConfig) return state;
          const savedMapping = {
            id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            letterType: state.mappingConfig.letterType,
            config: state.mappingConfig,
            createdAt: new Date().toISOString(),
          };
          return {
            savedMappings: [...state.savedMappings, savedMapping],
          };
        }),

      loadMappingConfig: (id) =>
        set((state) => {
          const saved = state.savedMappings.find((m) => m.id === id);
          if (!saved) return state;
          return { mappingConfig: saved.config };
        }),

      deleteSavedMapping: (id) =>
        set((state) => ({
          savedMappings: state.savedMappings.filter((m) => m.id !== id),
        })),

      // Job actions
      createJob: (items) =>
        set((state) => {
          if (!state.mappingConfig) return state;
          const job = createBatchJob(
            state.mappingConfig.letterType,
            state.excelFile?.fileName || 'Unknown',
            items,
            state.settings,
            state.mappingConfig
          );
          return { currentJob: job };
        }),

      validateJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          return { currentJob: validateBatchJob(state.currentJob) };
        }),

      startJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            return { currentJob: transitionJobState(state.currentJob, 'start') };
          } catch {
            return state;
          }
        }),

      pauseJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            return { currentJob: transitionJobState(state.currentJob, 'pause') };
          } catch {
            return state;
          }
        }),

      resumeJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            return { currentJob: transitionJobState(state.currentJob, 'resume') };
          } catch {
            return state;
          }
        }),

      cancelJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            return { currentJob: transitionJobState(state.currentJob, 'cancel') };
          } catch {
            return state;
          }
        }),

      completeJob: () =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            const completedJob = transitionJobState(state.currentJob, 'complete');
            const result = createBatchResult(
              completedJob,
              completedJob.startedAt
                ? new Date(completedJob.startedAt).getTime()
                : Date.now()
            );
            return {
              currentJob: completedJob,
              jobHistory: [result, ...state.jobHistory].slice(0, 50), // Keep last 50
            };
          } catch {
            return state;
          }
        }),

      updateItemInJob: (itemId, status, errorMessage, outputPath) =>
        set((state) => {
          if (!state.currentJob) return state;
          try {
            return {
              currentJob: updateItemStatus(
                state.currentJob,
                itemId,
                status,
                errorMessage,
                outputPath
              ),
            };
          } catch {
            return state;
          }
        }),

      clearCurrentJob: () => set({ currentJob: null }),

      // Settings actions
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // History actions
      addToHistory: (result) =>
        set((state) => ({
          jobHistory: [result, ...state.jobHistory].slice(0, 50),
        })),

      clearHistory: () => set({ jobHistory: [] }),

      // Computed getters
      getProgress: () => {
        const state = get();
        return state.currentJob ? calculateProgress(state.currentJob) : 0;
      },

      getSummary: () => {
        const state = get();
        return state.currentJob ? getBatchSummary(state.currentJob) : null;
      },

      canStartJob: () => {
        const state = get();
        if (!state.currentJob) return false;
        if (!state.mappingConfig) return false;
        return (
          state.currentJob.status === 'idle' &&
          state.currentJob.items.some((i) => i.status === 'pending')
        );
      },
    }),
    {
      name: 'batch-storage',
      partialize: (state) => ({
        // Only persist settings, history, and saved mappings
        settings: state.settings,
        jobHistory: state.jobHistory,
        savedMappings: state.savedMappings,
      }),
    }
  )
);
