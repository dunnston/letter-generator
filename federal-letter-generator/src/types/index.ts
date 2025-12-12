// ==================== ENGAGEMENT LETTER TYPES ====================

// Step 1: Client Information
export interface ClientInfo {
  firstName: string;
  lastName: string;
  salutation: string; // "Dear Pat:" format
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  letterDate: string; // ISO date string
}

// Step 2: Initial Contact Type
export type InitialContactType = 'conversation' | 'email' | 'meeting' | 'phone' | 'referral';

export interface InitialContact {
  type: InitialContactType;
  customDescription?: string;
  referrerName?: string; // For referral type
}

// Step 3: Firm Documents Provided
export type DeliveryMethod = 'handed' | 'enclosed' | 'attached' | 'separate_correspondence';

export interface FirmDocuments {
  formCRS: boolean;
  formADV: boolean;
  regBIDisclosure: boolean;
  brokerageAgreement: boolean;
  investmentAdvisoryAgreement: boolean;
  customDocuments: string[];
  deliveryMethod: DeliveryMethod;
}

// Step 4: CFP Fiduciary Disclosure
export interface CFPDisclosure {
  include: boolean;
  useCustomLanguage: boolean;
  customLanguage?: string;
}

// Standard CFP Board language
export const DEFAULT_CFP_LANGUAGE = `As we discussed, I am a CFP® professional and have agreed to comply with CFP Board's Code of Ethics and Standards of Conduct. The Code and Standards includes a fiduciary duty, which provides that "At all times when providing financial advice to a client, a CFP® professional must act as a fiduciary, and therefore, act in the best interests of the client."`;

// Step 5: Services Offered
export type InsuranceLine = 'life' | 'long_term_care' | 'disability' | 'health' | 'property_casualty' | 'all_lines';

export interface ServicesOffered {
  financialPlanning: boolean;
  investmentAdvisory: boolean;
  brokerageServices: boolean;
  riskManagement: boolean;
  insuranceLines: InsuranceLine[];
}

// Step 6: Client Goals
export type GoalCategory =
  | 'Cash Flow'
  | 'Investment'
  | 'Retirement'
  | 'Estate Planning'
  | 'Risk Management'
  | 'Tax'
  | 'Education'
  | 'Special Situations';

export interface ClientGoal {
  id: string;
  category: GoalCategory;
  description: string;
  isCustom: boolean;
}

// Step 7: Financial Planning Process
export type MonitoringFrequency = 'annually' | 'semi-annually' | 'quarterly';

export interface PlanningProcess {
  includeImplementation: boolean;
  includeMonitoring: boolean;
  includeUpdating: boolean;
  monitoringFrequency: MonitoringFrequency;
}

// Step 8: Account Configuration
export type AccountType = 'investment_advisory' | 'brokerage' | 'retirement_brokerage';
export type CustodianType = 'firm' | 'third_party';
export type ReportFrequency = 'monthly' | 'quarterly' | 'annually';

export interface Account {
  id: string;
  nickname: string;
  type: AccountType;
  custodian: CustodianType;
  custodianName?: string;
  discretionary: boolean;
  willMonitor: boolean;
  willProvideRecommendations: boolean;
  reportFrequency: ReportFrequency;
  onlineAccess: boolean;
}

// Step 9: Fee Structure
export type PlanningFeeType = 'one_time' | 'annual' | 'hourly';
export type AdvisoryCalculationMethod = 'quarter_end' | 'average_daily' | 'average_monthly';
export type PaymentSchedule = 'monthly' | 'quarterly' | 'annually';
export type RiskManagementFeeType = 'included_in_planning' | 'separate_commission' | 'fee_based';

export interface HourlyRate {
  role: string;
  rate: number;
}

export interface FeeTier {
  upTo: number | null; // null = unlimited
  percentage: number;
}

export interface FinancialPlanningFee {
  type: PlanningFeeType;
  amount: number;
  hourlyRates?: HourlyRate[];
}

export interface AdvisoryFee {
  calculationMethod: AdvisoryCalculationMethod;
  tiers: FeeTier[];
  paymentSchedule: PaymentSchedule;
  deductedFrom: string; // Account nickname
}

export interface RiskManagementFee {
  type: RiskManagementFeeType;
  thirdPartyAgent: boolean;
}

export interface FeeStructure {
  financialPlanningFee?: FinancialPlanningFee;
  advisoryFee?: AdvisoryFee;
  brokerageCommissions: boolean;
  riskManagementFee?: RiskManagementFee;
  mutualFundETFFees: boolean;
  custodyFees: boolean;
  custodyFeeDescription?: string;
}

// Step 10: Compensation Disclosure
export interface CompensationDisclosure {
  paidFromPlanningFees: boolean;
  paidFromAdvisoryFees: boolean;
  paidFromCommissions: boolean;
  paidFromInsuranceCommissions: boolean;
  revenueSharing: boolean;
  revenueSharingProducts: string[];
  referralFees: boolean;
  referralFeeDescription?: string;
  salesIncentives: boolean;
  salesIncentiveDescription?: string;
}

// Step 11: Conflicts of Interest
export interface ConflictOfInterest {
  id: string;
  description: string;
  isStandard: boolean;
}

// Step 12: Additional Sections
export type EngagementTermination = 'ongoing_until_terminated' | 'fixed_term';
export type PrivacyPolicyDelivery = 'included' | 'enclosed' | 'separate' | 'previously_provided';

export interface AdditionalSections {
  clientResponsibilities: string[];
  engagementTermination: EngagementTermination;
  terminationNotice?: string;
  privacyPolicyDelivery: PrivacyPolicyDelivery;
  hasDisciplinaryHistory: boolean;
  disciplinaryDescription?: string;
  hasBankruptcyHistory: boolean;
  bankruptcyDescription?: string;
  includeCleanRecord: boolean;
}

// Advisor Information
export interface AdvisorInfo {
  name: string;
  credentials: string;
  email: string;
  phone: string;
  firmName: string;
}

// Complete Engagement Letter Data
export interface EngagementLetterData {
  client: ClientInfo;
  initialContact: InitialContact;
  firmDocuments: FirmDocuments;
  cfpDisclosure: CFPDisclosure;
  services: ServicesOffered;
  goals: ClientGoal[];
  planningProcess: PlanningProcess;
  accounts: Account[];
  fees: FeeStructure;
  compensation: CompensationDisclosure;
  conflicts: ConflictOfInterest[];
  additional: AdditionalSections;
  advisor: AdvisorInfo;
}

// ==================== BATCH LETTER TYPES ====================

// 1099 Report
export interface TaxReportAccount {
  accountName: string;
  accountNumber: string;
  taxForm: string;
  specialNotes: string;
}

export interface Report1099Data {
  client: {
    name: string;
    email?: string;
  };
  accounts: TaxReportAccount[];
  taxYear: number;
  firmName: string;
  assistantName: string;
  contactEmail: string;
}

// Beneficiary Review
export interface Beneficiary {
  name: string;
  percentage: number;
  dollarAmount: number;
}

export interface BeneficiaryReviewData {
  accountOwner: string;
  accountType: string;
  accountNumber: string;
  accountValue: number;
  primaryBeneficiaries: Beneficiary[];
  primaryPerStirpes: boolean;
  contingentBeneficiaries: Beneficiary[];
  contingentPerStirpes: boolean;
}

// RMD Strategy
export interface RMDAccount {
  accountName: string;
  accountNumber: string;
  hasSystematic: boolean;
  amountRequired: number;
  yearToDateWithdrawals: number;
}

export interface RMDRecommendation {
  accountName: string;
  suggestedWithdrawal: number;
  depositLocation: string;
  federalTax: number;
  stateTax: number;
}

export interface RMDStrategyData {
  accountOwner: string;
  taxYear: number;
  accounts: RMDAccount[];
  totalRMDDue: number;
  totalWithdrawals: number;
  remainingRMD: number;
  recommendations: RMDRecommendation[];
  assistantName: string;
}

// Tax Strategy
export interface TaxYearData {
  deduction: number;
  deductionType?: 'standard' | 'itemized';
  taxableIncome: number;
  taxBill: number;
  bracket: number;
}

export interface TaxStrategyData {
  clientName: string;
  taxYear: number;
  priorYear: TaxYearData & { deductionType: 'standard' | 'itemized' };
  currentYear: TaxYearData;
  primaryStrategy: string;
  strategyDescription: string;
}

// ==================== TEMPLATE TYPES ====================

export type LetterType = 'engagement' | '1099' | 'beneficiary' | 'rmd' | 'tax_strategies';

export interface LetterTemplate {
  id: string;
  name: string;
  type: LetterType;
  createdAt: string;
  updatedAt: string;
  wizardData?: Partial<EngagementLetterData>;
  batchSettings?: BatchSettings;
  isDefault: boolean;
  isFavorite: boolean;
}

export interface BatchSettings {
  letterType: Exclude<LetterType, 'engagement'>;
  outputFormat: 'docx' | 'pdf' | 'both';
  outputDirectory: string;
  fileNamingPattern: string;
  firmName: string;
  assistantName: string;
  contactEmail: string;
  taxYear: number;
  includeDisclaimer: boolean;
  customDisclaimerText?: string;
}

// ==================== CONTENT BLOCK TYPES ====================

export interface ContentBlock {
  id: string;
  category: string;
  title: string;
  content: string;
  placeholders: string[];
}

// ==================== WIZARD STATE TYPES ====================

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface WizardState {
  currentStep: WizardStep;
  data: Partial<EngagementLetterData>;
  isComplete: boolean;
  lastSaved?: string;
}

// ==================== UI TYPES ====================

export interface StepConfig {
  step: WizardStep;
  title: string;
  description: string;
  isOptional: boolean;
}

export const WIZARD_STEPS: StepConfig[] = [
  { step: 1, title: 'Client Information', description: 'Name, address, and date', isOptional: false },
  { step: 2, title: 'Initial Contact', description: 'How you connected', isOptional: false },
  { step: 3, title: 'Firm Documents', description: 'Documents provided', isOptional: false },
  { step: 4, title: 'CFP Disclosure', description: 'Fiduciary language', isOptional: true },
  { step: 5, title: 'Services Offered', description: 'Types of services', isOptional: false },
  { step: 6, title: 'Client Goals', description: 'Focus areas', isOptional: false },
  { step: 7, title: 'Planning Process', description: 'CFP process steps', isOptional: false },
  { step: 8, title: 'Account Configuration', description: 'Account details', isOptional: false },
  { step: 9, title: 'Fee Structure', description: 'How client pays', isOptional: false },
  { step: 10, title: 'Compensation', description: 'How you are paid', isOptional: false },
  { step: 11, title: 'Conflicts of Interest', description: 'Disclosure of conflicts', isOptional: false },
  { step: 12, title: 'Additional Sections', description: 'Final details', isOptional: false },
  { step: 13, title: 'Review & Generate', description: 'Preview and export', isOptional: false },
];
