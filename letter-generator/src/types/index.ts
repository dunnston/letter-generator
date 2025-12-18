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

// Step 4: Professional Designation & Fiduciary Disclosures (CFP, ChFC, RIA)
export interface CFPDisclosure {
  include: boolean;
  useCustomLanguage: boolean;
  customLanguage?: string;
}

export interface ChFCDisclosure {
  include: boolean;
  useCustomLanguage: boolean;
  customLanguage?: string;
}

export interface RIADisclosure {
  include: boolean;
  useCustomLanguage: boolean;
  customLanguage?: string;
}

// Standard CFP Board language
export const DEFAULT_CFP_LANGUAGE = `As we discussed, I am a CFP® professional and have agreed to comply with CFP Board's Code of Ethics and Standards of Conduct. The Code and Standards includes a fiduciary duty, which provides that "At all times when providing financial advice to a client, a CFP® professional must act as a fiduciary, and therefore, act in the best interests of the client."`;

// Standard ChFC language
export const DEFAULT_CHFC_LANGUAGE = `As we discussed, I am a ChFC® (Chartered Financial Consultant) professional and have agreed to comply with The American College of Financial Services Code of Ethics and Professional Responsibility. As a ChFC®, I am committed to providing competent and ethical financial planning services, acting with integrity, objectivity, and in your best interests.`;

// Standard RIA Fiduciary language
export const DEFAULT_RIA_LANGUAGE = `As a Registered Investment Advisor, I am held to a fiduciary standard—the highest standard of care in financial services. This means I have a legal and ethical obligation to always act in your best financial interest, placing your needs above my own. I am required to provide full transparency regarding fees and potential conflicts of interest, exercise due diligence in all recommendations, and seek best execution for your investments. My advice is tailored to your specific goals, risk tolerance, and financial situation.`;

// Engagement scope limitation language
export const ENGAGEMENT_SCOPE_LANGUAGE = `This engagement covers only the services listed above. If you request additional services outside this scope, we will agree separately on the terms and fee for those services.`;

// Advisor responsibility clarification language
export const ADVISOR_RESPONSIBILITY_LANGUAGE = `I am responsible for delivering a financial plan and recommendations as described above. I am not responsible for implementing recommendations, preparing legal documents, or filing tax returns. Those responsibilities remain with you, your attorney, and your accountant.`;

// No ongoing monitoring language (when monitoring is not included)
export const NO_MONITORING_LANGUAGE = `I will not monitor your accounts or update your plan after the engagement period unless we agree to a new engagement.`;

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
  | 'Special Situations'
  | 'Social Security'
  | string; // Allow custom categories

export interface ClientGoal {
  id: string;
  category: GoalCategory;
  description: string;
  isCustom: boolean;
}

// Goal template for settings - defines category with selectable sub-topics
export interface GoalCategoryTemplate {
  id: string;
  category: string; // e.g., "Cash flow", "Investment", "Retirement"
  planningLabel: string; // e.g., "planning" - what follows the category name
  subTopics: GoalSubTopic[]; // Selectable items for this category
  isDefault: boolean; // System default vs user-created
}

export interface GoalSubTopic {
  id: string;
  label: string; // e.g., "preparing a cash flow summary"
  isDefault: boolean;
}

// Default goal category templates with sub-topics
export const DEFAULT_GOAL_TEMPLATES: GoalCategoryTemplate[] = [
  {
    id: 'cash_flow',
    category: 'Cash flow',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'cf_summary', label: 'preparing a cash flow summary', isDefault: true },
      { id: 'cf_income_expenses', label: 'evaluating income and expenses', isDefault: true },
      { id: 'cf_emergency', label: 'planning for an adequate emergency fund', isDefault: true },
      { id: 'cf_budget', label: 'creating a household budget', isDefault: false },
      { id: 'cf_debt', label: 'developing a debt reduction strategy', isDefault: false },
    ],
  },
  {
    id: 'investment',
    category: 'Investment',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'inv_analysis', label: 'portfolio analysis', isDefault: true },
      { id: 'inv_allocation', label: 'asset allocation advice', isDefault: true },
      { id: 'inv_qualified', label: 'review of qualified plan assets', isDefault: true },
      { id: 'inv_realloc', label: 'recommendations for reallocating cash or savings into more productive yet low-risk investments', isDefault: true },
      { id: 'inv_policy', label: 'developing an investment policy statement', isDefault: false },
      { id: 'inv_tax', label: 'evaluating tax-efficient investment strategies', isDefault: false },
    ],
  },
  {
    id: 'retirement',
    category: 'Retirement',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'ret_readiness', label: 'analyzing retirement readiness at various ages', isDefault: true },
      { id: 'ret_fers', label: 'evaluating federal benefits such as FERS and TSP', isDefault: true },
      { id: 'ret_income', label: 'developing a retirement income plan', isDefault: true },
      { id: 'ret_healthcare', label: 'planning for healthcare costs in retirement', isDefault: false },
      { id: 'ret_pension', label: 'evaluating pension options', isDefault: false },
    ],
  },
  {
    id: 'estate',
    category: 'Estate',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'est_attorney', label: 'coordination with your attorney', isDefault: true },
      { id: 'est_documents', label: 'assessing current documents', isDefault: true },
      { id: 'est_trusts', label: 'exploring strategies for trusts, powers of attorney, and related matters', isDefault: true },
      { id: 'est_beneficiary', label: 'reviewing beneficiary designations', isDefault: false },
      { id: 'est_inheritance', label: 'planning for inheritance and wealth transfer', isDefault: false },
    ],
  },
  {
    id: 'risk',
    category: 'Risk management',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'risk_review', label: 'review of current insurance coverage (life, health, and other relevant policies)', isDefault: true },
      { id: 'risk_analysis', label: 'analysis of needs', isDefault: true },
      { id: 'risk_appropriate', label: 'evaluation of whether existing coverage remains appropriate', isDefault: true },
      { id: 'risk_ltc', label: 'considering long-term care insurance options', isDefault: false },
      { id: 'risk_disability', label: 'evaluating disability income protection', isDefault: false },
    ],
  },
  {
    id: 'tax',
    category: 'Tax',
    planningLabel: 'planning, in coordination with your accountant',
    isDefault: true,
    subTopics: [
      { id: 'tax_strategies', label: 'identifying strategies for efficient tax management during both working years and retirement', isDefault: true },
      { id: 'tax_roth', label: 'evaluating Roth conversion opportunities', isDefault: false },
      { id: 'tax_bracket', label: 'optimizing tax bracket management', isDefault: false },
      { id: 'tax_charitable', label: 'reviewing charitable giving strategies', isDefault: false },
    ],
  },
  {
    id: 'social_security',
    category: 'Social Security',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'ss_timing', label: 'guidance on timing and strategies to maximize benefits', isDefault: true },
      { id: 'ss_spousal', label: 'evaluating spousal and survivor benefit options', isDefault: false },
      { id: 'ss_taxation', label: 'understanding taxation of benefits', isDefault: false },
    ],
  },
  {
    id: 'education',
    category: 'Education',
    planningLabel: 'planning',
    isDefault: true,
    subTopics: [
      { id: 'edu_529', label: 'evaluating 529 plan options', isDefault: true },
      { id: 'edu_funding', label: 'considering education funding alternatives', isDefault: false },
      { id: 'edu_aid', label: 'reviewing financial aid strategies', isDefault: false },
    ],
  },
];

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
export type PlanningFeeType = 'one_time' | 'annual' | 'monthly' | 'hourly';
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

export interface FeeInstallment {
  amount: number;
  description: string; // e.g., "due at the start of the engagement", "due upon delivery of the final plan"
}

export interface FinancialPlanningFee {
  type: PlanningFeeType;
  amount: number;
  hourlyRates?: HourlyRate[];
  useInstallments: boolean;
  installments?: FeeInstallment[];
  // Monthly fee options
  monthsUpfront?: number; // Number of months to pay upfront (e.g., 6)
  monthlyDuration?: number; // Total duration in months (optional)
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
  // Additional advisory fee disclosure (for advisors who charge advisory fees separately)
  includeAdditionalAdvisoryFee: boolean;
  additionalAdvisoryFeePercentage?: number;
  additionalAdvisoryFeeDescription?: string;
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

export interface ConflictMitigations {
  includeMitigations: boolean;
  mitigationStrategies: string[];
}

// Default conflict mitigation strategies
export const DEFAULT_MITIGATION_STRATEGIES = [
  'I will always disclose when I stand to receive compensation for a recommendation.',
  'I will always provide an alternative option so you can compare and make an informed decision.',
  'You are never obligated to implement any product or recommendation through me.',
];

// Step 12: Additional Sections
export type EngagementTermination = 'ongoing_until_terminated' | 'fixed_term';
export type PrivacyPolicyDelivery = 'included' | 'enclosed' | 'separate' | 'previously_provided' | 'link';

export interface AdditionalSections {
  clientResponsibilities: string[];
  engagementTermination: EngagementTermination;
  terminationNotice?: string;
  engagementStartDescription?: string; // e.g., "on the date of our first meeting"
  engagementEndDescription?: string; // e.g., "upon delivery of the final plan"
  followUpPeriod?: string; // e.g., "12 months"
  includeFollowUpPeriod: boolean;
  terminationFeeLanguage?: string; // e.g., "any unpaid portion of the agreed fee will remain due for work completed to date"
  privacyPolicyDelivery: PrivacyPolicyDelivery;
  privacyPolicyLink?: string; // URL to privacy policy when delivery method is 'link'
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

// Disclaimer Settings
export interface DisclaimerSettings {
  includeDisclaimer: boolean;
  disclaimerText: string;
}

// Engagement Letter Defaults (for Settings page)
export interface EngagementDefaults {
  // Disclosure toggles
  includeRIADisclosure: boolean;
  includeCFPDisclosure: boolean;
  includeChFCDisclosure: boolean;

  // Primary compensation sources
  paidFromPlanningFees: boolean;
  paidFromAdvisoryFees: boolean;
  paidFromCommissions: boolean;
  paidFromInsuranceCommissions: boolean;

  // Conflicts - list of default conflict template IDs to auto-add
  defaultConflictIds: string[];
  includeMitigations: boolean;

  // Additional sections
  engagementTermination: EngagementTermination;
  includeClientResponsibilities: boolean;
  includeCleanRecord: boolean;

  // Privacy policy
  defaultPrivacyPolicyDelivery: PrivacyPolicyDelivery;
  defaultPrivacyPolicyLink: string;
}

// Default disclaimer text
export const DEFAULT_DISCLAIMER_TEXT = `This letter is intended to document our engagement and does not constitute a contract. The services described herein are subject to applicable laws, regulations, and firm policies. Past performance is not indicative of future results. Investment involves risk, including the possible loss of principal.`;

// Complete Engagement Letter Data
export interface EngagementLetterData {
  client: ClientInfo;
  initialContact: InitialContact;
  firmDocuments: FirmDocuments;
  cfpDisclosure: CFPDisclosure;
  chfcDisclosure: ChFCDisclosure;
  riaDisclosure: RIADisclosure;
  services: ServicesOffered;
  goals: ClientGoal[];
  planningProcess: PlanningProcess;
  accounts: Account[];
  fees: FeeStructure;
  compensation: CompensationDisclosure;
  conflicts: ConflictOfInterest[];
  conflictMitigations: ConflictMitigations;
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

// ==================== BATCH PROCESSING TYPES ====================

// Excel Import Types
export interface ExcelColumn {
  index: number;
  header: string;
  sampleValues: string[]; // First few values for preview
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rowCount: number;
}

export interface ExcelFile {
  fileName: string;
  sheets: ExcelSheet[];
  selectedSheet: string;
}

// Column Mapping Types
export interface ColumnMapping {
  sourceColumn: string; // Excel column header
  targetField: string; // Field in our data structure
  transform?: ColumnTransform;
}

export type ColumnTransform =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'currency' // Parse as currency
  | 'percentage' // Parse as percentage
  | 'date' // Parse as date
  | 'boolean'; // Parse as boolean (yes/no, true/false, 1/0)

export interface ColumnMappingConfig {
  letterType: Exclude<LetterType, 'engagement'>;
  mappings: ColumnMapping[];
  hasHeaderRow: boolean;
  startRow: number; // 0-indexed, after header if present
}

// Required fields for each batch letter type
export const REQUIRED_FIELDS_BY_TYPE: Record<Exclude<LetterType, 'engagement'>, string[]> = {
  '1099': ['clientName', 'accountName', 'accountNumber', 'taxForm'],
  'beneficiary': ['accountOwner', 'accountType', 'accountNumber', 'accountValue', 'beneficiaryName', 'beneficiaryPercentage'],
  'rmd': ['accountOwner', 'accountName', 'accountNumber', 'amountRequired'],
  'tax_strategies': ['clientName', 'taxYear', 'priorYearTaxableIncome', 'priorYearTaxBill', 'currentYearTaxableIncome'],
};

// Field definitions for column mapping UI
export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';
  description?: string;
}

export const FIELD_DEFINITIONS_1099: FieldDefinition[] = [
  { key: 'clientName', label: 'Client Name', required: true, type: 'string', description: 'Full name of the client' },
  { key: 'clientEmail', label: 'Client Email', required: false, type: 'string', description: 'Email address for the client' },
  { key: 'accountName', label: 'Account Name', required: true, type: 'string', description: 'Name/title of the account' },
  { key: 'accountNumber', label: 'Account Number', required: true, type: 'string', description: 'Account number (will be masked in letter)' },
  { key: 'taxForm', label: 'Tax Form', required: true, type: 'string', description: 'Type of tax form (e.g., 1099-DIV, 1099-INT)' },
  { key: 'specialNotes', label: 'Special Notes', required: false, type: 'string', description: 'Any special notes for this account' },
];

export const FIELD_DEFINITIONS_BENEFICIARY: FieldDefinition[] = [
  { key: 'accountOwner', label: 'Account Owner', required: true, type: 'string', description: 'Name of account owner' },
  { key: 'accountType', label: 'Account Type', required: true, type: 'string', description: 'Type of account (IRA, 401k, etc.)' },
  { key: 'accountNumber', label: 'Account Number', required: true, type: 'string', description: 'Account number' },
  { key: 'accountValue', label: 'Account Value', required: true, type: 'currency', description: 'Current account value' },
  { key: 'beneficiaryName', label: 'Beneficiary Name', required: true, type: 'string', description: 'Name of beneficiary' },
  { key: 'beneficiaryPercentage', label: 'Beneficiary %', required: true, type: 'percentage', description: 'Percentage allocation' },
  { key: 'beneficiaryType', label: 'Beneficiary Type', required: false, type: 'string', description: 'Primary or Contingent' },
  { key: 'perStirpes', label: 'Per Stirpes', required: false, type: 'boolean', description: 'Whether per stirpes applies' },
];

export const FIELD_DEFINITIONS_RMD: FieldDefinition[] = [
  { key: 'accountOwner', label: 'Account Owner', required: true, type: 'string', description: 'Name of account owner' },
  { key: 'accountName', label: 'Account Name', required: true, type: 'string', description: 'Name/title of the account' },
  { key: 'accountNumber', label: 'Account Number', required: true, type: 'string', description: 'Account number' },
  { key: 'amountRequired', label: 'RMD Amount Required', required: true, type: 'currency', description: 'Required minimum distribution amount' },
  { key: 'hasSystematic', label: 'Has Systematic', required: false, type: 'boolean', description: 'Whether systematic withdrawals are set up' },
  { key: 'yearToDateWithdrawals', label: 'YTD Withdrawals', required: false, type: 'currency', description: 'Year-to-date withdrawals already taken' },
  { key: 'suggestedWithdrawal', label: 'Suggested Withdrawal', required: false, type: 'currency', description: 'Recommended withdrawal amount' },
  { key: 'depositLocation', label: 'Deposit Location', required: false, type: 'string', description: 'Where to deposit the withdrawal' },
  { key: 'federalTax', label: 'Federal Tax Withholding', required: false, type: 'percentage', description: 'Federal tax withholding percentage' },
  { key: 'stateTax', label: 'State Tax Withholding', required: false, type: 'percentage', description: 'State tax withholding percentage' },
];

export const FIELD_DEFINITIONS_TAX_STRATEGIES: FieldDefinition[] = [
  { key: 'clientName', label: 'Client Name', required: true, type: 'string', description: 'Full name of the client' },
  { key: 'taxYear', label: 'Tax Year', required: true, type: 'number', description: 'Current tax year' },
  { key: 'priorYearDeduction', label: 'Prior Year Deduction', required: false, type: 'currency', description: 'Prior year deduction amount' },
  { key: 'priorYearDeductionType', label: 'Prior Year Deduction Type', required: false, type: 'string', description: 'Standard or Itemized' },
  { key: 'priorYearTaxableIncome', label: 'Prior Year Taxable Income', required: true, type: 'currency', description: 'Prior year taxable income' },
  { key: 'priorYearTaxBill', label: 'Prior Year Tax Bill', required: true, type: 'currency', description: 'Prior year total tax' },
  { key: 'priorYearBracket', label: 'Prior Year Tax Bracket', required: false, type: 'percentage', description: 'Prior year marginal tax bracket' },
  { key: 'currentYearDeduction', label: 'Current Year Deduction', required: false, type: 'currency', description: 'Current year deduction amount' },
  { key: 'currentYearTaxableIncome', label: 'Current Year Taxable Income', required: true, type: 'currency', description: 'Current year taxable income' },
  { key: 'currentYearTaxBill', label: 'Current Year Tax Bill', required: false, type: 'currency', description: 'Current year estimated tax' },
  { key: 'currentYearBracket', label: 'Current Year Tax Bracket', required: false, type: 'percentage', description: 'Current year marginal tax bracket' },
  { key: 'primaryStrategy', label: 'Primary Strategy', required: false, type: 'string', description: 'Main tax strategy recommendation' },
  { key: 'strategyDescription', label: 'Strategy Description', required: false, type: 'string', description: 'Detailed strategy explanation' },
];

// Batch Processing Status
export type BatchItemStatus = 'pending' | 'processing' | 'success' | 'error' | 'skipped';

export interface BatchItem {
  id: string;
  rowNumber: number;
  data: Record<string, unknown>;
  status: BatchItemStatus;
  errorMessage?: string;
  outputPath?: string;
}

export interface BatchJob {
  id: string;
  letterType: Exclude<LetterType, 'engagement'>;
  fileName: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  items: BatchItem[];
  settings: BatchSettings;
  mappingConfig: ColumnMappingConfig;
}

// Batch Processing Results
export interface BatchResult {
  jobId: string;
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  outputDirectory: string;
  errors: BatchError[];
  duration: number; // milliseconds
}

export interface BatchError {
  rowNumber: number;
  clientName?: string;
  field?: string;
  message: string;
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
