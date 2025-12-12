import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LetterTemplate,
  EngagementLetterData,
  AdvisorInfo,
  GoalCategoryTemplate,
  DisclaimerSettings,
} from '../types';
import { DEFAULT_GOAL_TEMPLATES, DEFAULT_DISCLAIMER_TEXT } from '../types';

interface AppSettings {
  // Default advisor info (pre-fills wizard)
  defaultAdvisor: Partial<AdvisorInfo>;

  // Default output settings
  defaultOutputDirectory: string;
  defaultFileNamingPattern: string;
  defaultOutputFormat: 'docx' | 'pdf' | 'both';

  // UI preferences
  autoSaveEnabled: boolean;
  showPreviewPane: boolean;

  // Goal templates - customizable categories and sub-topics
  goalTemplates: GoalCategoryTemplate[];

  // Disclaimer settings
  disclaimer: DisclaimerSettings;
}

const defaultSettings: AppSettings = {
  defaultAdvisor: {},
  defaultOutputDirectory: '',
  defaultFileNamingPattern: '{lastName}_{firstName}_{letterType}_{date}',
  defaultOutputFormat: 'docx',
  autoSaveEnabled: true,
  showPreviewPane: true,
  goalTemplates: [...DEFAULT_GOAL_TEMPLATES],
  disclaimer: {
    includeDisclaimer: false,
    disclaimerText: DEFAULT_DISCLAIMER_TEXT,
  },
};

interface TemplateStore {
  // Templates
  templates: LetterTemplate[];

  // Settings
  settings: AppSettings;

  // Recent documents
  recentDocuments: Array<{
    id: string;
    name: string;
    type: string;
    generatedAt: string;
    filePath?: string;
  }>;

  // Template actions
  addTemplate: (template: LetterTemplate) => void;
  updateTemplate: (id: string, updates: Partial<LetterTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => LetterTemplate | undefined;
  getTemplatesByType: (type: LetterTemplate['type']) => LetterTemplate[];
  setDefaultTemplate: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Create template from wizard data
  saveAsTemplate: (
    name: string,
    type: 'engagement',
    wizardData: Partial<EngagementLetterData>
  ) => LetterTemplate;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateDefaultAdvisor: (advisor: Partial<AdvisorInfo>) => void;
  updateDisclaimer: (disclaimer: Partial<DisclaimerSettings>) => void;

  // Goal template actions
  updateGoalTemplates: (templates: GoalCategoryTemplate[]) => void;
  addGoalCategory: (category: GoalCategoryTemplate) => void;
  updateGoalCategory: (categoryId: string, updates: Partial<GoalCategoryTemplate>) => void;
  deleteGoalCategory: (categoryId: string) => void;
  resetGoalTemplates: () => void;

  // Recent documents actions
  addRecentDocument: (doc: {
    name: string;
    type: string;
    filePath?: string;
  }) => void;
  clearRecentDocuments: () => void;
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [],
      settings: defaultSettings,
      recentDocuments: [],

      // Template actions
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, template],
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      getTemplatesByType: (type) => {
        return get().templates.filter((t) => t.type === type);
      },

      setDefaultTemplate: (id) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === id);
          if (!template) return state;

          return {
            templates: state.templates.map((t) => ({
              ...t,
              isDefault: t.id === id ? true : t.type === template.type ? false : t.isDefault,
            })),
          };
        }),

      toggleFavorite: (id) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        })),

      saveAsTemplate: (name, type, wizardData) => {
        const template: LetterTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wizardData,
          isDefault: false,
          isFavorite: false,
        };

        set((state) => ({
          templates: [...state.templates, template],
        }));

        return template;
      },

      // Settings actions
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      updateDefaultAdvisor: (advisor) =>
        set((state) => ({
          settings: {
            ...state.settings,
            defaultAdvisor: { ...state.settings.defaultAdvisor, ...advisor },
          },
        })),

      updateDisclaimer: (disclaimer) =>
        set((state) => ({
          settings: {
            ...state.settings,
            disclaimer: { ...state.settings.disclaimer, ...disclaimer },
          },
        })),

      // Goal template actions
      updateGoalTemplates: (templates) =>
        set((state) => ({
          settings: { ...state.settings, goalTemplates: templates },
        })),

      addGoalCategory: (category) =>
        set((state) => ({
          settings: {
            ...state.settings,
            goalTemplates: [...state.settings.goalTemplates, category],
          },
        })),

      updateGoalCategory: (categoryId, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            goalTemplates: state.settings.goalTemplates.map((t) =>
              t.id === categoryId ? { ...t, ...updates } : t
            ),
          },
        })),

      deleteGoalCategory: (categoryId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            goalTemplates: state.settings.goalTemplates.filter((t) => t.id !== categoryId),
          },
        })),

      resetGoalTemplates: () =>
        set((state) => ({
          settings: { ...state.settings, goalTemplates: [...DEFAULT_GOAL_TEMPLATES] },
        })),

      // Recent documents actions
      addRecentDocument: (doc) =>
        set((state) => {
          const newDoc = {
            id: `doc-${Date.now()}`,
            ...doc,
            generatedAt: new Date().toISOString(),
          };

          // Keep only last 10 recent documents
          const recentDocuments = [newDoc, ...state.recentDocuments].slice(0, 10);

          return { recentDocuments };
        }),

      clearRecentDocuments: () => set({ recentDocuments: [] }),
    }),
    {
      name: 'template-storage',
    }
  )
);
