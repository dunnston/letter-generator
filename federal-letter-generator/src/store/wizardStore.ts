import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EngagementLetterData,
  WizardStep,
  ClientInfo,
  InitialContact,
  FirmDocuments,
  CFPDisclosure,
  ServicesOffered,
  ClientGoal,
  PlanningProcess,
  Account,
  FeeStructure,
  CompensationDisclosure,
  ConflictOfInterest,
  AdditionalSections,
  AdvisorInfo,
} from '../types';

// Default values for initialization
const defaultClientInfo: ClientInfo = {
  firstName: '',
  lastName: '',
  salutation: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
  },
  letterDate: new Date().toISOString().split('T')[0],
};

const defaultInitialContact: InitialContact = {
  type: 'conversation',
  customDescription: '',
};

const defaultFirmDocuments: FirmDocuments = {
  formCRS: true,
  formADV: true,
  regBIDisclosure: false,
  brokerageAgreement: false,
  investmentAdvisoryAgreement: true,
  customDocuments: [],
  deliveryMethod: 'handed',
};

const defaultCFPDisclosure: CFPDisclosure = {
  include: false,
  useCustomLanguage: false,
  customLanguage: '',
};

const defaultServices: ServicesOffered = {
  financialPlanning: true,
  investmentAdvisory: false,
  brokerageServices: false,
  riskManagement: false,
  insuranceLines: [],
};

const defaultPlanningProcess: PlanningProcess = {
  includeImplementation: true,
  includeMonitoring: true,
  includeUpdating: true,
  monitoringFrequency: 'annually',
};

const defaultFeeStructure: FeeStructure = {
  brokerageCommissions: false,
  mutualFundETFFees: true,
  custodyFees: false,
};

const defaultCompensation: CompensationDisclosure = {
  paidFromPlanningFees: true,
  paidFromAdvisoryFees: false,
  paidFromCommissions: false,
  paidFromInsuranceCommissions: false,
  revenueSharing: false,
  revenueSharingProducts: [],
  referralFees: false,
  referralFeeDescription: '',
  salesIncentives: false,
  salesIncentiveDescription: '',
};

const defaultAdditionalSections: AdditionalSections = {
  clientResponsibilities: [],
  engagementTermination: 'ongoing_until_terminated',
  terminationNotice: '',
  privacyPolicyDelivery: 'included',
  hasDisciplinaryHistory: false,
  disciplinaryDescription: '',
  hasBankruptcyHistory: false,
  bankruptcyDescription: '',
  includeCleanRecord: true,
};

const defaultAdvisor: AdvisorInfo = {
  name: '',
  credentials: '',
  email: '',
  phone: '',
  firmName: '',
};

// Initial wizard data with defaults
const initialWizardData: Partial<EngagementLetterData> = {
  client: defaultClientInfo,
  initialContact: defaultInitialContact,
  firmDocuments: defaultFirmDocuments,
  cfpDisclosure: defaultCFPDisclosure,
  services: defaultServices,
  goals: [],
  planningProcess: defaultPlanningProcess,
  accounts: [],
  fees: defaultFeeStructure,
  compensation: defaultCompensation,
  conflicts: [],
  additional: defaultAdditionalSections,
  advisor: defaultAdvisor,
};

interface WizardStore {
  // State
  currentStep: WizardStep;
  data: Partial<EngagementLetterData>;
  isComplete: boolean;
  lastSaved: string | null;

  // Navigation
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Data updates
  updateClient: (client: Partial<ClientInfo>) => void;
  updateInitialContact: (contact: Partial<InitialContact>) => void;
  updateFirmDocuments: (docs: Partial<FirmDocuments>) => void;
  updateCFPDisclosure: (disclosure: Partial<CFPDisclosure>) => void;
  updateServices: (services: Partial<ServicesOffered>) => void;
  updateGoals: (goals: ClientGoal[]) => void;
  addGoal: (goal: ClientGoal) => void;
  removeGoal: (goalId: string) => void;
  updatePlanningProcess: (process: Partial<PlanningProcess>) => void;
  updateAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  updateFees: (fees: Partial<FeeStructure>) => void;
  updateCompensation: (compensation: Partial<CompensationDisclosure>) => void;
  updateConflicts: (conflicts: ConflictOfInterest[]) => void;
  addConflict: (conflict: ConflictOfInterest) => void;
  removeConflict: (conflictId: string) => void;
  updateAdditional: (additional: Partial<AdditionalSections>) => void;
  updateAdvisor: (advisor: Partial<AdvisorInfo>) => void;

  // Full data management
  setData: (data: Partial<EngagementLetterData>) => void;
  resetWizard: () => void;
  markComplete: () => void;

  // Computed helpers
  getStepValidation: (step: WizardStep) => boolean;
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      data: initialWizardData,
      isComplete: false,
      lastSaved: null,

      // Navigation
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 13) {
          set({ currentStep: (currentStep + 1) as WizardStep });
        }
      },
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as WizardStep });
        }
      },

      // Data updates
      updateClient: (client) =>
        set((state) => ({
          data: {
            ...state.data,
            client: { ...state.data.client, ...client } as ClientInfo,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateInitialContact: (contact) =>
        set((state) => ({
          data: {
            ...state.data,
            initialContact: { ...state.data.initialContact, ...contact } as InitialContact,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateFirmDocuments: (docs) =>
        set((state) => ({
          data: {
            ...state.data,
            firmDocuments: { ...state.data.firmDocuments, ...docs } as FirmDocuments,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateCFPDisclosure: (disclosure) =>
        set((state) => ({
          data: {
            ...state.data,
            cfpDisclosure: { ...state.data.cfpDisclosure, ...disclosure } as CFPDisclosure,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateServices: (services) =>
        set((state) => ({
          data: {
            ...state.data,
            services: { ...state.data.services, ...services } as ServicesOffered,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateGoals: (goals) =>
        set((state) => ({
          data: { ...state.data, goals },
          lastSaved: new Date().toISOString(),
        })),

      addGoal: (goal) =>
        set((state) => ({
          data: { ...state.data, goals: [...(state.data.goals || []), goal] },
          lastSaved: new Date().toISOString(),
        })),

      removeGoal: (goalId) =>
        set((state) => ({
          data: {
            ...state.data,
            goals: (state.data.goals || []).filter((g) => g.id !== goalId),
          },
          lastSaved: new Date().toISOString(),
        })),

      updatePlanningProcess: (process) =>
        set((state) => ({
          data: {
            ...state.data,
            planningProcess: { ...state.data.planningProcess, ...process } as PlanningProcess,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateAccounts: (accounts) =>
        set((state) => ({
          data: { ...state.data, accounts },
          lastSaved: new Date().toISOString(),
        })),

      addAccount: (account) =>
        set((state) => ({
          data: { ...state.data, accounts: [...(state.data.accounts || []), account] },
          lastSaved: new Date().toISOString(),
        })),

      removeAccount: (accountId) =>
        set((state) => ({
          data: {
            ...state.data,
            accounts: (state.data.accounts || []).filter((a) => a.id !== accountId),
          },
          lastSaved: new Date().toISOString(),
        })),

      updateAccount: (accountId, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            accounts: (state.data.accounts || []).map((a) =>
              a.id === accountId ? { ...a, ...updates } : a
            ),
          },
          lastSaved: new Date().toISOString(),
        })),

      updateFees: (fees) =>
        set((state) => ({
          data: {
            ...state.data,
            fees: { ...state.data.fees, ...fees } as FeeStructure,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateCompensation: (compensation) =>
        set((state) => ({
          data: {
            ...state.data,
            compensation: { ...state.data.compensation, ...compensation } as CompensationDisclosure,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateConflicts: (conflicts) =>
        set((state) => ({
          data: { ...state.data, conflicts },
          lastSaved: new Date().toISOString(),
        })),

      addConflict: (conflict) =>
        set((state) => ({
          data: { ...state.data, conflicts: [...(state.data.conflicts || []), conflict] },
          lastSaved: new Date().toISOString(),
        })),

      removeConflict: (conflictId) =>
        set((state) => ({
          data: {
            ...state.data,
            conflicts: (state.data.conflicts || []).filter((c) => c.id !== conflictId),
          },
          lastSaved: new Date().toISOString(),
        })),

      updateAdditional: (additional) =>
        set((state) => ({
          data: {
            ...state.data,
            additional: { ...state.data.additional, ...additional } as AdditionalSections,
          },
          lastSaved: new Date().toISOString(),
        })),

      updateAdvisor: (advisor) =>
        set((state) => ({
          data: {
            ...state.data,
            advisor: { ...state.data.advisor, ...advisor } as AdvisorInfo,
          },
          lastSaved: new Date().toISOString(),
        })),

      // Full data management
      setData: (data) =>
        set({
          data: { ...initialWizardData, ...data },
          lastSaved: new Date().toISOString(),
        }),

      resetWizard: () =>
        set({
          currentStep: 1,
          data: initialWizardData,
          isComplete: false,
          lastSaved: null,
        }),

      markComplete: () => set({ isComplete: true }),

      // Validation helper
      getStepValidation: (step) => {
        const { data } = get();
        switch (step) {
          case 1:
            return !!(
              data.client?.firstName &&
              data.client?.lastName &&
              data.client?.address?.line1 &&
              data.client?.address?.city &&
              data.client?.address?.state &&
              data.client?.address?.zipCode
            );
          case 2:
            return !!data.initialContact?.type;
          case 3:
            return !!data.firmDocuments?.deliveryMethod;
          case 4:
            return true; // Optional step
          case 5:
            return !!(
              data.services?.financialPlanning ||
              data.services?.investmentAdvisory ||
              data.services?.brokerageServices ||
              data.services?.riskManagement
            );
          case 6:
            return (data.goals?.length || 0) > 0;
          case 7:
            return true; // Has defaults
          case 8:
            return true; // Accounts are optional based on services
          case 9:
            return true; // Has defaults
          case 10:
            return true; // Has defaults
          case 11:
            return true; // Conflicts can be empty
          case 12:
            return !!(data.advisor?.name && data.advisor?.email);
          case 13:
            return true; // Review step
          default:
            return false;
        }
      },
    }),
    {
      name: 'wizard-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
