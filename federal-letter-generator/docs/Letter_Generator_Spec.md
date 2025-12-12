# Federal Letter Generator - Project Specification

## Project Overview

A desktop application for financial planning professionals to generate client letters. The app will feature a wizard-based engagement letter builder and batch letter generation from Excel data imports.

### Tech Stack
- **Framework**: Tauri 2.x (Rust backend + web frontend)
- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Document Generation**: docx (npm package) for Word documents, pdf-lib or similar for PDFs
- **Data Import**: xlsx or sheetjs for Excel parsing

### Core Capabilities
1. **Engagement Letter Wizard** - Step-by-step customization with modular templates
2. **Batch Letter Generation** - Import Excel data to generate multiple letters
3. **Template Library** - Pre-built content blocks for services, fees, disclosures
4. **Dual Output** - Generate both .docx and .pdf formats

---

## Application Architecture

### Project Structure
```
federal-letter-generator/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   └── main.rs
│   └── Cargo.toml
├── src/                 # React frontend
│   ├── components/
│   │   ├── common/           # Shared UI components
│   │   ├── wizard/           # Wizard step components
│   │   ├── batch/            # Batch processing components
│   │   └── templates/        # Template selection components
│   ├── hooks/
│   ├── services/
│   │   ├── documentGenerator.ts   # Word/PDF generation
│   │   ├── excelParser.ts         # Excel import logic
│   │   └── templateEngine.ts      # Template interpolation
│   ├── templates/
│   │   ├── engagement/       # Engagement letter templates
│   │   ├── 1099/             # 1099 report templates
│   │   ├── beneficiary/      # Beneficiary review templates
│   │   ├── rmd/              # RMD strategy templates
│   │   └── tax-strategies/   # Tax strategy templates
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── store/                # State management (Zustand recommended)
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tailwind.config.js
```

### State Management
Use Zustand for lightweight state management:
- `useWizardStore` - Tracks wizard progress and collected data
- `useBatchStore` - Manages imported Excel data and batch processing
- `useTemplateStore` - Stores custom templates and preferences

---

## Letter Types Overview

| Letter Type | Generation Mode | Data Source | Priority |
|-------------|-----------------|-------------|----------|
| Engagement Letter | Wizard (single) | Manual input | 1st (MVP) |
| 1099 Report | Batch | Excel import | 2nd |
| Beneficiary Review | Batch | Excel import | 3rd |
| RMD Strategy | Batch | Excel import | 4th |
| Tax Strategies | Batch | Excel import | 5th |

---

## Part 1: Engagement Letter Wizard (MVP)

### Wizard Flow Overview

The wizard should guide the user through 10-12 steps, collecting information to generate a fully customized engagement letter. Each step should:
- Show clear progress indication
- Allow navigation back to previous steps
- Auto-save progress locally
- Validate required fields before proceeding

### Wizard Steps

#### Step 1: Client Information
```typescript
interface ClientInfo {
  firstName: string;
  lastName: string;
  salutation: string;        // "Dear Pat:" format
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  letterDate: Date;
}
```
**UI**: Simple form with text inputs and date picker

#### Step 2: Initial Contact Type
```typescript
interface InitialContact {
  type: 'conversation' | 'email' | 'meeting' | 'phone' | 'referral';
  customDescription?: string;
}
```
**UI**: Radio button selection with optional custom text
**Affects**: Opening paragraph language ("I enjoyed our conversation" vs "Following up on your email")

#### Step 3: Firm Documents Provided
```typescript
interface FirmDocuments {
  formCRS: boolean;
  formADV: boolean;
  regBIDisclosure: boolean;
  brokerageAgreement: boolean;
  investmentAdvisoryAgreement: boolean;
  customDocuments: string[];    // Additional document names
  deliveryMethod: 'handed' | 'enclosed' | 'attached' | 'separate_correspondence';
}
```
**UI**: Checklist with toggle switches, text input for custom docs, radio for delivery method

#### Step 4: CFP Fiduciary Disclosure (Optional)
```typescript
interface CFPDisclosure {
  includeCFPFiduciary: boolean;
  customLanguage?: string;
}
```
**UI**: Toggle with preview of standard CFP Board language, option to customize
**Standard Text**: "As we discussed, I am a CFP® professional and have agreed to comply with CFP Board's Code of Ethics and Standards of Conduct. The Code and Standards includes a fiduciary duty, which provides that 'At all times when providing financial advice to a client, a CFP® professional must act as a fiduciary, and therefore, act in the best interests of the client.'"

#### Step 5: Services Offered
```typescript
interface ServicesOffered {
  financialPlanning: boolean;
  investmentAdvisory: boolean;
  brokerageServices: boolean;
  riskManagement: boolean;
  insuranceLines?: string[];    // If risk management, which lines
}
```
**UI**: Multi-select checkboxes with conditional insurance line selection
**Insurance Options**: Life, Long-term care, Disability, Health, Property & Casualty, All lines

#### Step 6: Client Goals/Focus Areas
```typescript
interface ClientGoal {
  id: string;
  category: string;
  description: string;
  isCustom: boolean;
}

interface ClientGoals {
  selectedGoals: ClientGoal[];
}
```

**Template Library for Goals** (user selects from these or writes custom):
```typescript
const GOAL_TEMPLATES = [
  // Cash Flow
  { category: 'Cash Flow', description: 'Cash flow planning, including preparing a cash flow summary and planning for an emergency fund' },
  { category: 'Cash Flow', description: 'Debt reduction planning and strategy' },
  { category: 'Cash Flow', description: 'Budgeting and expense management' },
  
  // Investment
  { category: 'Investment', description: 'Investment planning, including reviewing your current investment portfolio and developing and implementing an asset management strategy' },
  { category: 'Investment', description: 'Portfolio rebalancing and optimization' },
  { category: 'Investment', description: 'Tax-efficient investment strategies' },
  
  // Retirement
  { category: 'Retirement', description: 'Retirement planning, including analyzing how likely you are to meet your target goals by your retirement date' },
  { category: 'Retirement', description: 'Social Security optimization and claiming strategy' },
  { category: 'Retirement', description: 'Pension analysis and election decisions' },
  { category: 'Retirement', description: 'Required Minimum Distribution (RMD) planning' },
  
  // Estate Planning
  { category: 'Estate Planning', description: 'Estate, gift, and wealth transfer planning, including assessing your estate net worth and liquidity' },
  { category: 'Estate Planning', description: 'Trust planning considerations' },
  { category: 'Estate Planning', description: 'Beneficiary designation review' },
  { category: 'Estate Planning', description: 'Charitable giving strategies' },
  
  // Risk Management
  { category: 'Risk Management', description: 'Risk management planning, including assessing your need for life insurance and your current insurance coverage' },
  { category: 'Risk Management', description: 'Long-term care planning' },
  { category: 'Risk Management', description: 'Disability income protection analysis' },
  
  // Tax
  { category: 'Tax', description: 'Tax planning strategies and optimization' },
  { category: 'Tax', description: 'Roth conversion analysis' },
  { category: 'Tax', description: 'Tax-loss harvesting strategies' },
  
  // Education
  { category: 'Education', description: 'Education funding planning, including 529 plan analysis' },
  
  // Special Situations
  { category: 'Special Situations', description: 'Stock option and equity compensation planning' },
  { category: 'Special Situations', description: 'Business succession planning' },
  { category: 'Special Situations', description: 'Divorce financial planning' },
];
```

**UI**: 
- Categorized accordion/tabs showing template options
- Click to add template to selected list
- Drag to reorder selected goals
- "Add Custom Goal" button opens text input
- Preview pane shows how goals will appear in letter

#### Step 7: Financial Planning Process Customization
```typescript
interface FinancialPlanningProcess {
  includeImplementation: boolean;
  includeMonitoring: boolean;
  includeUpdating: boolean;
  monitoringFrequency: 'annually' | 'semi-annually' | 'quarterly';
}
```
**UI**: Toggles for each service component, frequency dropdown
**Note**: The 7-step CFP process is standard, but implementation/monitoring/updating can be excluded

#### Step 8: Account Configuration
```typescript
interface Account {
  id: string;
  nickname: string;                    // e.g., "Investment Advisory Account"
  type: 'investment_advisory' | 'brokerage' | 'retirement_brokerage';
  custodian: 'firm' | 'third_party';
  custodianName?: string;              // If third party
  discretionary?: boolean;             // For advisory accounts
  willMonitor: boolean;
  willProvideRecommendations: boolean;
  reportFrequency: 'monthly' | 'quarterly' | 'annually';
  onlineAccess: boolean;
}

interface AccountConfiguration {
  accounts: Account[];
}
```
**UI**: 
- "Add Account" button creates new account card
- Each card has form fields for account details
- Visual indicator showing monitor vs. no-monitor accounts

#### Step 9: Fee Structure
```typescript
interface FeeStructure {
  // Financial Planning Fee
  financialPlanningFee?: {
    type: 'one_time' | 'annual' | 'hourly';
    amount: number;
    hourlyRates?: { role: string; rate: number }[];  // If hourly
  };
  
  // Advisory Fee
  advisoryFee?: {
    calculationMethod: 'quarter_end' | 'average_daily' | 'average_monthly';
    tiers: { upTo: number | null; percentage: number }[];  // null = unlimited
    paymentSchedule: 'monthly' | 'quarterly' | 'annually';
    deductedFrom: string;  // Account name
  };
  
  // Brokerage
  brokerageCommissions: boolean;
  
  // Risk Management
  riskManagementFee?: {
    type: 'included_in_planning' | 'separate_commission' | 'fee_based';
    thirdPartyAgent: boolean;
  };
  
  // Additional Fees
  mutualFundETFFees: boolean;
  custodyFees: boolean;
  custodyFeeDescription?: string;
}
```
**UI**: Multi-section form with conditional fields, tier builder for advisory fees

#### Step 10: Compensation Disclosure
```typescript
interface CompensationDisclosure {
  // How firm/advisor are paid
  paidFromPlanningFees: boolean;
  paidFromAdvisoryFees: boolean;
  paidFromCommissions: boolean;
  paidFromInsuranceCommissions: boolean;
  
  // Third-party payments
  revenueSharing: boolean;
  revenueSharingProducts: string[];  // mutual funds, ETFs, annuities
  referralFees: boolean;
  referralFeeDescription?: string;
  salesIncentives: boolean;
  salesIncentiveDescription?: string;
  
  // Fee-only designation
  isFeeOnly: boolean;  // If any sales compensation, this must be false
}
```
**UI**: Checklist with conditional text fields, warning if fee-only is selected but commissions exist

#### Step 11: Conflicts of Interest
```typescript
interface ConflictOfInterest {
  id: string;
  description: string;
  isStandard: boolean;
}

interface ConflictsDisclosure {
  selectedConflicts: ConflictOfInterest[];
}
```

**Standard Conflict Templates**:
```typescript
const CONFLICT_TEMPLATES = [
  {
    id: 'aum_conflict',
    description: 'The ways you pay us create conflicts of interest. The amount we earn from working with you depends, in part, on the amount of assets we manage for you. We have a financial incentive to recommend that you make financial decisions that would result in more assets under our management.'
  },
  {
    id: 'commission_conflict',
    description: 'We have a conflict because the amount we earn from working with you depends, in part, on the fees, commissions, sales charges, and markups we receive when you buy and sell investments and insurance through my firm. We earn more on some products than others. We have a financial incentive to recommend that you buy the products that pay us more. We also have a financial incentive to recommend that you buy and sell more products.'
  },
  {
    id: 'third_party_conflict',
    description: 'We also have a conflict when we receive other payments and incentives from firms that are not related to us. These include payments to make mutual funds, ETFs, and annuities available to you, product-related service fees, referral fees, and incentives. We have a financial incentive to recommend the services and products that pay us more money.'
  },
  {
    id: 'future_conflict',
    description: 'If we provide other services to you in the future, there may be different conflicts. When we have a conflict of interest, we will tell you about it.'
  }
];
```
**UI**: Checklist of standard conflicts plus "Add Custom Conflict" option

#### Step 12: Additional Sections
```typescript
interface AdditionalSections {
  // Client Responsibilities
  clientResponsibilities: string[];  // Template or custom
  
  // Engagement Timing
  engagementTermination: 'ongoing_until_terminated' | 'fixed_term';
  terminationNotice?: string;
  
  // Privacy Policy
  privacyPolicyDelivery: 'included' | 'enclosed' | 'separate' | 'previously_provided';
  
  // Disciplinary History
  hasDisciplinaryHistory: boolean;
  disciplinaryDescription?: string;
  hasBankruptcyHistory: boolean;
  bankruptcyDescription?: string;
  includeCleanRecord: boolean;  // Option to include "no history" statement
  
  // Advisor Contact Info
  advisorName: string;
  advisorCredentials: string;  // e.g., "CFP®"
  advisorEmail: string;
  advisorPhone: string;
}
```
**UI**: Final catch-all step with remaining customizations

#### Step 13: Review & Generate
**UI**: 
- Full preview of the generated letter with all customizations
- Highlight/callout any sections that need attention
- "Edit Section" buttons to jump back to relevant steps
- Generate buttons for .docx and .pdf
- Save as template option for future clients

---

## Part 2: Batch Letter Generation

### Excel Import Structure

The batch system should accept Excel files with standardized column headers. Each letter type has its own expected schema.

#### 1099 Report Excel Schema
```typescript
interface TaxReportRow {
  // Client Info
  clientName: string;           // "Sample, Jane"
  clientEmail?: string;
  
  // Account Info (one row per account)
  accountName: string;          // "Fidelity -- Individual, Jane"
  accountNumber: string;        // "555-666777"
  taxForm: string;              // "1099", "Tax Report/1099", "NONE"
  specialNotes: string;         // "RMD to Charity/QCD", "NONE"
}
```

**Grouping Logic**: Group rows by `clientName` to create one letter per client with multiple account rows.

**Generated Letter Structure**:
```
[Client Name]

The following is a list of your accounts held through [Firm Name] and the respective tax forms...

[Table of accounts]

Please remember the following:
- [Standard reminders about 1099 deadlines, online access, 5498 forms]

[Contact information and disclaimer]
```

#### Beneficiary Review Excel Schema
```typescript
interface BeneficiaryRow {
  // Account Owner
  accountOwner: string;         // "Sam Smith"
  
  // Account Info
  accountType: string;          // "Traditional IRA (IRA)"
  accountNumber: string;        // "555-55555"
  accountValue: number;         // 451000
  
  // Beneficiary Info
  beneficiaryType: 'primary' | 'contingent';
  beneficiaryName: string;
  beneficiaryPercentage: number;
  perStirpes: boolean;
}
```

**Grouping Logic**: Group by `accountOwner` + `accountNumber`, then separate primary vs contingent beneficiaries.

#### RMD Strategy Excel Schema
```typescript
interface RMDRow {
  // Account Owner
  accountOwner: string;
  
  // Account Info
  accountName: string;          // "CLS", "Pershing", etc.
  accountNumber: string;
  hasSystematic: boolean;       // Automatic withdrawals set up
  amountRequired: number;       // RMD amount for this account
  yearToDateWithdrawals: number;
  
  // Recommendation (optional - can be added in app)
  suggestedWithdrawal?: number;
  depositLocation?: string;
  federalWithholding?: number;  // Percentage
  stateWithholding?: number;
}
```

**Calculated Fields**:
- Total RMD Due = Sum of `amountRequired`
- Total Withdrawals = Sum of `yearToDateWithdrawals`  
- Remaining RMD = Total RMD Due - Total Withdrawals

#### Tax Strategies Excel Schema
```typescript
interface TaxStrategyRow {
  // Client Info
  clientName: string;
  
  // Prior Year Data
  priorYearDeduction: number;
  priorYearDeductionType: 'standard' | 'itemized';
  priorYearTaxableIncome: number;
  priorYearTaxBill: number;
  priorYearBracket: number;     // Percentage
  
  // Current Year Estimates
  currentYearDeduction: number;
  currentYearTaxableIncome: number;
  currentYearTaxBill: number;
  currentYearBracket: number;
  
  // Strategy
  primaryStrategy: string;      // "ROTH Conversion", "Tax Loss Harvesting", etc.
  strategyDescription?: string;
}
```

### Batch Processing UI

```
┌─────────────────────────────────────────────────────────────┐
│  Batch Letter Generator                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Select Letter Type                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 1099 Report  │ │ Beneficiary  │ │ RMD Strategy │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌──────────────┐                                            │
│  │Tax Strategies│                                            │
│  └──────────────┘                                            │
│                                                              │
│  Step 2: Import Data                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📁 Drop Excel file here or click to browse         │    │
│  │     Expected columns: [dynamic based on type]       │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Download Template]                                         │
│                                                              │
│  Step 3: Review & Customize                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Client         │ Accounts │ Status    │ Actions     │    │
│  │ Sample, Jane   │ 7        │ ✓ Ready   │ [Preview]   │    │
│  │ Smith, John    │ 4        │ ⚠ Review  │ [Preview]   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 4: Generate                                            │
│  [Generate All as DOCX] [Generate All as PDF]               │
│  [Generate Selected]                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Batch Settings
```typescript
interface BatchSettings {
  letterType: '1099' | 'beneficiary' | 'rmd' | 'tax_strategies';
  outputFormat: 'docx' | 'pdf' | 'both';
  outputDirectory: string;
  fileNamingPattern: string;  // e.g., "{lastName}_{firstName}_{letterType}_{date}"
  
  // Letter-specific settings
  firmName: string;
  assistantName: string;
  contactEmail: string;
  taxYear: number;
  
  // Include/exclude sections
  includeDisclaimer: boolean;
  customDisclaimerText?: string;
}
```

---

## Part 3: Document Generation

### Word Document Generation (docx library)

Use the `docx` npm package for Word document generation. Key implementation notes:

```typescript
// Core imports needed
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, Header, Footer, PageNumber,
  HeadingLevel, LevelFormat
} from 'docx';

// Standard document settings
const createDocument = (content: Paragraph[]) => {
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24 }  // 12pt default
        }
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          run: { size: 28, bold: true },
          paragraph: { spacing: { before: 240, after: 120 } }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: content
    }]
  });
};
```

**Critical Rules from docx library**:
1. Never use `\n` for line breaks - always use separate Paragraph elements
2. Always use proper numbering config for bullets, never Unicode symbols
3. Set column widths at both table level AND cell level
4. Use `ShadingType.CLEAR` for table cell backgrounds, never `SOLID`
5. PageBreak must always be inside a Paragraph
6. Images require the `type` parameter

### PDF Generation

Options for PDF generation:
1. **pdf-lib** - Pure JavaScript, good for simple documents
2. **jsPDF** - More features, good documentation
3. **Convert from DOCX** - Generate DOCX first, then convert (may require external tool)

Recommended approach: Generate DOCX as primary, offer PDF as secondary option using jsPDF for simpler layouts or a conversion service.

---

## Part 4: Template System

### Template Storage Structure

```typescript
interface LetterTemplate {
  id: string;
  name: string;
  type: 'engagement' | '1099' | 'beneficiary' | 'rmd' | 'tax_strategies';
  createdAt: Date;
  updatedAt: Date;
  
  // For Engagement Letters - saved wizard state
  wizardData?: EngagementLetterData;
  
  // For Batch Letters - settings and customizations  
  batchSettings?: BatchSettings;
  
  // User preferences
  isDefault: boolean;
  isFavorite: boolean;
}
```

### Content Block Templates

Pre-built content blocks that can be inserted into letters:

```typescript
interface ContentBlock {
  id: string;
  category: string;
  title: string;
  content: string;        // May include {{placeholders}}
  placeholders: string[]; // List of placeholders in content
}

// Example blocks for engagement letters
const CONTENT_BLOCKS: ContentBlock[] = [
  {
    id: 'approach_financial_planning',
    category: 'Financial Planning',
    title: 'Standard 7-Step Process',
    content: `Here is our approach to financial planning:

1. At first, we will ask you for information, so we can understand your personal and financial circumstances.
2. Then we will work with you to identify and select goals.
3. After you have chosen goals, we will analyze your current course of action and other approaches you might take.
4. Next, we will develop the financial planning recommendations.
5. Then we will present the financial planning recommendations to you, along with the information we considered to develop them.
6. After that, we will analyze and recommend actions, products, and services to implement the financial planning recommendations.
7. At least {{monitoringFrequency}}, we will monitor your financial plan.`,
    placeholders: ['monitoringFrequency']
  },
  // ... more blocks
];
```

---

## Part 5: UI/UX Guidelines

### Design Principles
1. **Progressive Disclosure** - Show only relevant options based on previous selections
2. **Clear Progress** - Always show where user is in the wizard/process
3. **Inline Help** - Tooltips and help text explaining financial/regulatory context
4. **Preview-Driven** - Show real-time preview of how selections affect the letter
5. **Error Prevention** - Validate inputs, warn about conflicts (e.g., fee-only + commissions)

### Color Palette (Tailwind)
```css
/* Professional financial services palette */
--primary: slate-700      /* Headers, primary actions */
--secondary: blue-600     /* Links, secondary actions */
--accent: emerald-600     /* Success states, confirmations */
--warning: amber-500      /* Warnings, attention needed */
--error: red-600          /* Errors, critical issues */
--background: slate-50    /* Page background */
--surface: white          /* Cards, panels */
```

### Component Patterns

**Wizard Step**:
```tsx
<div className="flex flex-col h-full">
  {/* Progress bar */}
  <div className="h-2 bg-slate-200 rounded-full">
    <div className="h-2 bg-blue-600 rounded-full" style={{width: `${progress}%`}} />
  </div>
  
  {/* Step content */}
  <div className="flex-1 overflow-auto p-6">
    <h2 className="text-xl font-semibold text-slate-800 mb-4">{stepTitle}</h2>
    {children}
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between p-4 border-t">
    <Button variant="outline" onClick={onBack}>Back</Button>
    <Button onClick={onNext}>Continue</Button>
  </div>
</div>
```

**Template Selector**:
```tsx
<div className="grid grid-cols-1 gap-2">
  {templates.map(template => (
    <div 
      key={template.id}
      className={`p-3 border rounded-lg cursor-pointer transition
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
      onClick={() => onSelect(template)}
    >
      <div className="font-medium text-slate-800">{template.title}</div>
      <div className="text-sm text-slate-500 line-clamp-2">{template.preview}</div>
    </div>
  ))}
</div>
```

---

## Part 6: Data Models (Complete TypeScript Interfaces)

```typescript
// ==================== ENGAGEMENT LETTER ====================

interface EngagementLetterData {
  // Step 1: Client Info
  client: {
    firstName: string;
    lastName: string;
    salutation: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    letterDate: string;  // ISO date string
  };
  
  // Step 2: Initial Contact
  initialContact: {
    type: 'conversation' | 'email' | 'meeting' | 'phone' | 'referral';
    customDescription?: string;
  };
  
  // Step 3: Firm Documents
  firmDocuments: {
    provided: string[];           // Document names
    customDocuments: string[];
    deliveryMethod: 'handed' | 'enclosed' | 'attached' | 'separate';
  };
  
  // Step 4: CFP Disclosure
  cfpDisclosure: {
    include: boolean;
    useCustomLanguage: boolean;
    customLanguage?: string;
  };
  
  // Step 5: Services
  services: {
    financialPlanning: boolean;
    investmentAdvisory: boolean;
    brokerageServices: boolean;
    riskManagement: boolean;
    insuranceLines: string[];
  };
  
  // Step 6: Goals
  goals: Array<{
    id: string;
    category: string;
    description: string;
    isCustom: boolean;
  }>;
  
  // Step 7: Financial Planning Process
  planningProcess: {
    includeImplementation: boolean;
    includeMonitoring: boolean;
    includeUpdating: boolean;
    monitoringFrequency: 'annually' | 'semi-annually' | 'quarterly';
  };
  
  // Step 8: Accounts
  accounts: Array<{
    id: string;
    nickname: string;
    type: 'investment_advisory' | 'brokerage' | 'retirement_brokerage';
    custodian: 'firm' | 'third_party';
    custodianName?: string;
    discretionary: boolean;
    willMonitor: boolean;
    willProvideRecommendations: boolean;
    reportFrequency: 'monthly' | 'quarterly' | 'annually';
    onlineAccess: boolean;
  }>;
  
  // Step 9: Fees
  fees: {
    financialPlanningFee?: {
      type: 'one_time' | 'annual' | 'hourly';
      amount: number;
      hourlyRates?: Array<{ role: string; rate: number }>;
    };
    advisoryFee?: {
      calculationMethod: 'quarter_end' | 'average_daily' | 'average_monthly';
      tiers: Array<{ upTo: number | null; percentage: number }>;
      paymentSchedule: 'monthly' | 'quarterly' | 'annually';
      deductedFrom: string;
    };
    brokerageCommissions: boolean;
    riskManagementFee?: {
      type: 'included_in_planning' | 'separate_commission' | 'fee_based';
      thirdPartyAgent: boolean;
    };
    mutualFundETFFees: boolean;
    custodyFees: boolean;
    custodyFeeDescription?: string;
  };
  
  // Step 10: Compensation
  compensation: {
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
  };
  
  // Step 11: Conflicts
  conflicts: Array<{
    id: string;
    description: string;
    isStandard: boolean;
  }>;
  
  // Step 12: Additional
  additional: {
    clientResponsibilities: string[];
    engagementTermination: 'ongoing' | 'fixed_term';
    terminationNotice?: string;
    privacyPolicyDelivery: 'included' | 'enclosed' | 'separate' | 'previously_provided';
    hasDisciplinaryHistory: boolean;
    disciplinaryDescription?: string;
    hasBankruptcyHistory: boolean;
    bankruptcyDescription?: string;
    includeCleanRecord: boolean;
  };
  
  // Advisor Info
  advisor: {
    name: string;
    credentials: string;
    email: string;
    phone: string;
    firmName: string;
  };
}

// ==================== BATCH LETTERS ====================

interface Report1099Data {
  client: {
    name: string;
    email?: string;
  };
  accounts: Array<{
    accountName: string;
    accountNumber: string;
    taxForm: string;
    specialNotes: string;
  }>;
  taxYear: number;
  firmName: string;
  assistantName: string;
  contactEmail: string;
}

interface BeneficiaryReviewData {
  accountOwner: string;
  accountType: string;
  accountNumber: string;
  accountValue: number;
  primaryBeneficiaries: Array<{
    name: string;
    percentage: number;
    dollarAmount: number;
  }>;
  primaryPerStirpes: boolean;
  contingentBeneficiaries: Array<{
    name: string;
    percentage: number;
    dollarAmount: number;
  }>;
  contingentPerStirpes: boolean;
}

interface RMDStrategyData {
  accountOwner: string;
  taxYear: number;
  accounts: Array<{
    accountName: string;
    accountNumber: string;
    hasSystematic: boolean;
    amountRequired: number;
    yearToDateWithdrawals: number;
  }>;
  totalRMDDue: number;
  totalWithdrawals: number;
  remainingRMD: number;
  recommendations: Array<{
    accountName: string;
    suggestedWithdrawal: number;
    depositLocation: string;
    federalTax: number;
    stateTax: number;
  }>;
  assistantName: string;
}

interface TaxStrategyData {
  clientName: string;
  taxYear: number;
  priorYear: {
    deduction: number;
    deductionType: 'standard' | 'itemized';
    taxableIncome: number;
    taxBill: number;
    bracket: number;
  };
  currentYear: {
    deduction: number;
    taxableIncome: number;
    taxBill: number;
    bracket: number;
  };
  primaryStrategy: string;
  strategyDescription: string;
}
```

---

## Part 7: Implementation Priorities

### Phase 1: Foundation (Week 1-2)
- [ ] Tauri + React + Tailwind project setup
- [ ] Basic routing and navigation structure
- [ ] Document generation service (docx)
- [ ] Local storage for templates/settings

### Phase 2: Engagement Letter MVP (Week 3-5)
- [ ] Wizard framework component
- [ ] All 13 wizard steps
- [ ] Template library for goals, conflicts, content blocks
- [ ] Letter preview component
- [ ] DOCX generation for engagement letter
- [ ] PDF generation

### Phase 3: Batch Foundation (Week 6-7)
- [ ] Excel import service
- [ ] Batch processing framework
- [ ] 1099 Report letter generation
- [ ] File output management

### Phase 4: Additional Letters (Week 8-10)
- [ ] Beneficiary Review letter
- [ ] RMD Strategy letter
- [ ] Tax Strategies letter

### Phase 5: Polish (Week 11-12)
- [ ] Template save/load functionality
- [ ] Settings management
- [ ] Error handling and validation
- [ ] Performance optimization

---

## Appendix A: Sample Letter Content

### Engagement Letter Opening Variations

**Conversation**:
"I enjoyed our conversation and I am pleased to be working with you."

**Email**:
"Thank you for your email. I am pleased to be working with you."

**Meeting**:
"It was a pleasure meeting with you. I am pleased to be working with you."

**Referral**:
"Thank you for reaching out. [Referrer Name] spoke highly of you, and I am pleased to be working with you."

### Standard Disclaimer Text (1099 Report)

"Our attorneys would like us to remind you that this report is provided as a courtesy and is for informational purposes only. Only the tax information you receive directly from your investment companies should be considered official. This guide is not a replacement for having a licensed professional complete your tax return."

### Standard Beneficiary Review Closing

"Making sure your wishes are honored after your passing is just one of the many services we provide for your family. During our next meeting together, we will review your beneficiaries including the appropriate use of 'per stirpes' designations."

---

## Appendix B: File Naming Conventions

```typescript
const generateFileName = (
  pattern: string,
  data: {
    firstName: string;
    lastName: string;
    letterType: string;
    date: Date;
  }
): string => {
  return pattern
    .replace('{firstName}', data.firstName)
    .replace('{lastName}', data.lastName)
    .replace('{letterType}', data.letterType)
    .replace('{date}', format(data.date, 'yyyy-MM-dd'))
    .replace('{year}', format(data.date, 'yyyy'));
};

// Example patterns:
// "{lastName}_{firstName}_{letterType}_{date}" → "Smith_John_Engagement_2024-01-15"
// "{lastName}_{letterType}_{year}" → "Smith_1099Report_2024"
```

---

## Appendix C: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current progress |
| `Ctrl+P` | Preview letter |
| `Ctrl+G` | Generate document |
| `Ctrl+N` | New letter |
| `Escape` | Cancel/Close modal |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Ctrl+Enter` | Continue to next step (in wizard) |

---

## Notes for Claude Code

1. **Start with the wizard framework** - Build a reusable wizard component that can handle any number of steps with validation, navigation, and state persistence.

2. **Template-first approach** - Build the template/content block system early so it can be used across all letter types.

3. **Type safety** - Use the TypeScript interfaces defined above strictly. They represent the data contracts between components.

4. **Modular document generation** - Create composable functions for document sections so they can be mixed and matched.

5. **Local-first storage** - Use Tauri's file system APIs for saving templates and settings. Consider SQLite for more complex data needs.

6. **Test with real content** - Use the sample letters provided to validate that generated output matches expected formatting.
