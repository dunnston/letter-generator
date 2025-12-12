import { format } from 'date-fns';
import type {
  EngagementLetterData,
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
  DeliveryMethod,
} from '../types';
import { DEFAULT_CFP_LANGUAGE } from '../types';

// ==================== HELPER FUNCTIONS ====================

export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ==================== SECTION GENERATORS ====================

export function generateHeader(client: ClientInfo): string {
  const date = formatDate(client.letterDate);
  const addressParts = [
    `${client.firstName} ${client.lastName}`,
    client.address.line1,
    client.address.line2,
    `${client.address.city}, ${client.address.state} ${client.address.zipCode}`,
  ].filter(Boolean);

  return `${date}\n\n${addressParts.join('\n')}\n\n${client.salutation || `Dear ${client.firstName}:`}`;
}

export function generateOpeningParagraph(contact: InitialContact): string {
  const openings: Record<string, string> = {
    conversation: 'I enjoyed our conversation and wanted to follow up with this letter to document our engagement.',
    email: 'Following up on your email, I wanted to provide this letter to document our engagement.',
    meeting: 'It was a pleasure meeting with you. I wanted to follow up with this letter to document our engagement.',
    phone: 'Thank you for taking the time to speak with me. I wanted to follow up with this letter to document our engagement.',
    referral: 'Thank you for reaching out to me. I wanted to provide this letter to document our engagement.',
  };

  let text = openings[contact.type] || openings.conversation;

  if (contact.type === 'referral' && contact.referrerName) {
    text = `Thank you for reaching out to me after speaking with ${contact.referrerName}. I wanted to provide this letter to document our engagement.`;
  }

  if (contact.customDescription) {
    text = contact.customDescription;
  }

  return text;
}

export function generateDocumentDisclosure(docs: FirmDocuments): string {
  const documentList: string[] = [];

  if (docs.formCRS) documentList.push('Form CRS (Client Relationship Summary)');
  if (docs.formADV) documentList.push('Form ADV Part 2A and 2B');
  if (docs.regBIDisclosure) documentList.push('Regulation Best Interest Disclosure');
  if (docs.brokerageAgreement) documentList.push('Brokerage Agreement');
  if (docs.investmentAdvisoryAgreement) documentList.push('Investment Advisory Agreement');
  documentList.push(...docs.customDocuments);

  const deliveryText: Record<DeliveryMethod, string> = {
    handed: 'I have handed you',
    enclosed: 'Enclosed please find',
    attached: 'Attached please find',
    separate_correspondence: 'Under separate correspondence, I am providing you',
  };

  const verb = deliveryText[docs.deliveryMethod] || deliveryText.handed;

  if (documentList.length === 0) {
    return '';
  }

  if (documentList.length === 1) {
    return `${verb} ${documentList[0]}.`;
  }

  const lastDoc = documentList.pop();
  return `${verb} the following documents: ${documentList.join(', ')}, and ${lastDoc}.`;
}

export function generateCFPDisclosure(disclosure: CFPDisclosure): string {
  if (!disclosure.include) return '';

  if (disclosure.useCustomLanguage && disclosure.customLanguage) {
    return disclosure.customLanguage;
  }

  return DEFAULT_CFP_LANGUAGE;
}

export function generateServicesSection(services: ServicesOffered): string {
  const servicesList: string[] = [];

  if (services.financialPlanning) {
    servicesList.push('Financial Planning Services');
  }
  if (services.investmentAdvisory) {
    servicesList.push('Investment Advisory Services');
  }
  if (services.brokerageServices) {
    servicesList.push('Brokerage Services');
  }
  if (services.riskManagement) {
    let riskText = 'Risk Management / Insurance Services';
    if (services.insuranceLines && services.insuranceLines.length > 0) {
      if (services.insuranceLines.includes('all_lines')) {
        riskText += ' (All Lines)';
      } else {
        const lineNames = services.insuranceLines.map((line) => {
          const names: Record<string, string> = {
            life: 'Life',
            long_term_care: 'Long-Term Care',
            disability: 'Disability',
            health: 'Health',
            property_casualty: 'Property & Casualty',
          };
          return names[line] || line;
        });
        riskText += ` (${lineNames.join(', ')})`;
      }
    }
    servicesList.push(riskText);
  }

  return servicesList.join('\n');
}

export function generateGoalsSection(goals: ClientGoal[]): string {
  if (goals.length === 0) return 'We will work together to identify your financial goals.';

  const goalLines = goals.map((goal) => `• ${goal.description}`);
  return `Based on our discussions, we will focus on the following areas:\n\n${goalLines.join('\n')}`;
}

export function generatePlanningProcessSection(process: PlanningProcess): string {
  const steps = [
    '1. At first, we will ask you for information, so we can understand your personal and financial circumstances.',
    '2. Then we will work with you to identify and select goals.',
    '3. After you have chosen goals, we will analyze your current course of action and other approaches you might take.',
    '4. Next, we will develop the financial planning recommendations.',
    '5. Then we will present the financial planning recommendations to you, along with the information we considered to develop them.',
  ];

  if (process.includeImplementation) {
    steps.push(
      '6. After that, we will analyze and recommend actions, products, and services to implement the financial planning recommendations.'
    );
  }

  if (process.includeMonitoring) {
    const frequencyText: Record<string, string> = {
      annually: 'At least annually',
      'semi-annually': 'At least semi-annually',
      quarterly: 'At least quarterly',
    };
    const freq = frequencyText[process.monitoringFrequency] || 'Periodically';
    let monitoringStep = `${steps.length + 1}. ${freq}, we will monitor your financial plan`;

    if (process.includeUpdating) {
      monitoringStep += ' and update it as your circumstances change';
    }
    monitoringStep += '.';
    steps.push(monitoringStep);
  }

  return `Here is our approach to financial planning:\n\n${steps.join('\n')}`;
}

export function generateAccountsSection(accounts: Account[]): string {
  if (accounts.length === 0) {
    return 'We will discuss your account setup during our planning process.';
  }

  const accountDescriptions = accounts.map((account) => {
    const parts = [`• ${account.nickname || 'Account'}`];

    const typeNames: Record<string, string> = {
      investment_advisory: 'Investment Advisory Account',
      brokerage: 'Brokerage Account',
      retirement_brokerage: 'Retirement Brokerage Account',
    };
    parts.push(`  - Type: ${typeNames[account.type] || account.type}`);

    if (account.custodian === 'third_party' && account.custodianName) {
      parts.push(`  - Custodian: ${account.custodianName}`);
    }

    if (account.discretionary) {
      parts.push('  - Discretionary authority granted');
    } else {
      parts.push('  - Non-discretionary (client approval required for trades)');
    }

    if (account.willMonitor) {
      const freqNames: Record<string, string> = {
        monthly: 'monthly',
        quarterly: 'quarterly',
        annually: 'annually',
      };
      parts.push(`  - Reports provided ${freqNames[account.reportFrequency] || 'periodically'}`);
    }

    return parts.join('\n');
  });

  return `Your accounts will be configured as follows:\n\n${accountDescriptions.join('\n\n')}`;
}

export function generateFeesSection(fees: FeeStructure, services: ServicesOffered): string {
  const sections: string[] = [];

  // Financial Planning Fee
  if (services.financialPlanning && fees.financialPlanningFee) {
    const fp = fees.financialPlanningFee;
    if (fp.type === 'one_time') {
      sections.push(`Financial Planning Fee: ${formatCurrency(fp.amount)} (one-time fee)`);
    } else if (fp.type === 'annual') {
      sections.push(`Financial Planning Fee: ${formatCurrency(fp.amount)} per year`);
    } else if (fp.type === 'hourly' && fp.hourlyRates) {
      const rates = fp.hourlyRates.map((r) => `${r.role}: ${formatCurrency(r.rate)}/hour`).join(', ');
      sections.push(`Financial Planning Fee: Hourly rates (${rates})`);
    }
  }

  // Advisory Fee
  if (services.investmentAdvisory && fees.advisoryFee) {
    const adv = fees.advisoryFee;
    let tierText = 'Investment Advisory Fee:\n';
    adv.tiers.forEach((tier) => {
      if (tier.upTo === null) {
        tierText += `  • Assets above previous tiers: ${formatPercentage(tier.percentage)}\n`;
      } else {
        tierText += `  • First ${formatCurrency(tier.upTo)}: ${formatPercentage(tier.percentage)}\n`;
      }
    });

    const calcMethods: Record<string, string> = {
      quarter_end: 'quarter-end balance',
      average_daily: 'average daily balance',
      average_monthly: 'average monthly balance',
    };
    tierText += `\n  Calculated based on ${calcMethods[adv.calculationMethod] || 'account balance'}`;

    const schedules: Record<string, string> = {
      monthly: 'monthly',
      quarterly: 'quarterly in arrears',
      annually: 'annually',
    };
    tierText += `, billed ${schedules[adv.paymentSchedule] || 'periodically'}`;

    if (adv.deductedFrom) {
      tierText += `, deducted from your ${adv.deductedFrom} account`;
    }

    sections.push(tierText);
  }

  // Brokerage Commissions
  if (services.brokerageServices && fees.brokerageCommissions) {
    sections.push(
      'Brokerage Commissions: You will pay commissions on securities transactions in your brokerage accounts. Commission rates vary by product type and will be disclosed at the time of each transaction.'
    );
  }

  // Risk Management
  if (services.riskManagement && fees.riskManagementFee) {
    const rf = fees.riskManagementFee;
    const typeText: Record<string, string> = {
      included_in_planning: 'Risk management services are included in your financial planning fee.',
      separate_commission: 'You will pay commissions on insurance products.',
      fee_based: 'You will pay a separate fee for risk management services.',
    };
    sections.push(typeText[rf.type] || '');
  }

  // Additional fees
  if (fees.mutualFundETFFees) {
    sections.push(
      'Note: Mutual funds and ETFs have internal fees (expense ratios) that are charged by the fund companies. These fees are separate from and in addition to advisory fees.'
    );
  }

  if (fees.custodyFees) {
    sections.push(
      `Custody Fees: ${fees.custodyFeeDescription || 'The custodian may charge additional account maintenance fees.'}`
    );
  }

  return sections.join('\n\n');
}

export function generateCompensationSection(compensation: CompensationDisclosure): string {
  const sources: string[] = [];

  if (compensation.paidFromPlanningFees) {
    sources.push('• Financial planning fees paid directly by you');
  }
  if (compensation.paidFromAdvisoryFees) {
    sources.push('• Investment advisory fees deducted from your account(s)');
  }
  if (compensation.paidFromCommissions) {
    sources.push('• Commissions on securities transactions');
  }
  if (compensation.paidFromInsuranceCommissions) {
    sources.push('• Commissions on insurance products');
  }

  if (compensation.revenueSharing && compensation.revenueSharingProducts?.length) {
    sources.push(`• Revenue sharing from product sponsors (${compensation.revenueSharingProducts.join(', ')})`);
  }

  if (compensation.referralFees) {
    sources.push(
      `• Referral fees: ${compensation.referralFeeDescription || 'We may pay or receive fees for client referrals.'}`
    );
  }

  if (compensation.salesIncentives) {
    sources.push(
      `• Sales incentives: ${compensation.salesIncentiveDescription || 'We may receive non-cash compensation or incentives.'}`
    );
  }

  if (sources.length === 0) {
    return 'Our firm and I are compensated for the services we provide.';
  }

  return `Our firm and I are compensated from the following sources:\n\n${sources.join('\n')}`;
}

export function generateConflictsSection(conflicts: ConflictOfInterest[]): string {
  if (conflicts.length === 0) {
    return 'We are committed to acting in your best interests and will disclose any material conflicts as they arise.';
  }

  const conflictText = conflicts.map((c) => `• ${c.description}`).join('\n\n');
  return `The following are material conflicts of interest that you should be aware of:\n\n${conflictText}`;
}

export function generateResponsibilitiesSection(responsibilities: string[]): string {
  if (responsibilities.length === 0) {
    return 'We ask that you provide complete and accurate information to help us serve you effectively.';
  }

  const respText = responsibilities.map((r) => `• ${r}`).join('\n');
  return `To help us serve you effectively, we ask that you:\n\n${respText}`;
}

export function generateTerminationSection(additional: AdditionalSections): string {
  if (additional.engagementTermination === 'fixed_term') {
    return `This engagement is for a fixed term. ${additional.terminationNotice ? `Either party may terminate with ${additional.terminationNotice}.` : ''}`;
  }

  return `This engagement will continue until terminated by either party. ${additional.terminationNotice ? `Either party may terminate with ${additional.terminationNotice}.` : 'Either party may terminate at any time with written notice.'}`;
}

export function generatePrivacySection(additional: AdditionalSections): string {
  const deliveryText: Record<string, string> = {
    included: 'A copy of our privacy policy is included with this letter.',
    enclosed: 'A copy of our privacy policy is enclosed.',
    separate: 'Our privacy policy will be provided to you separately.',
    previously_provided: 'You have previously received a copy of our privacy policy.',
  };

  return deliveryText[additional.privacyPolicyDelivery] || deliveryText.included;
}

export function generateDisciplinarySection(additional: AdditionalSections): string {
  const parts: string[] = [];

  if (additional.hasDisciplinaryHistory) {
    parts.push(`Disciplinary History: ${additional.disciplinaryDescription || 'Please ask for details.'}`);
  } else if (additional.includeCleanRecord) {
    parts.push(
      'Neither I nor my firm have any material disciplinary or legal events to disclose that would be material to your evaluation of our services.'
    );
  }

  if (additional.hasBankruptcyHistory) {
    parts.push(`Bankruptcy History: ${additional.bankruptcyDescription || 'Please ask for details.'}`);
  }

  return parts.join('\n\n');
}

export function generateSignatureBlock(advisor: AdvisorInfo): string {
  const parts = [
    'Thank you for the opportunity to work with you.',
    '',
    'Sincerely,',
    '',
    '',
    advisor.name + (advisor.credentials ? `, ${advisor.credentials}` : ''),
  ];

  if (advisor.firmName) {
    parts.push(advisor.firmName);
  }
  if (advisor.email) {
    parts.push(advisor.email);
  }
  if (advisor.phone) {
    parts.push(advisor.phone);
  }

  return parts.join('\n');
}

// ==================== FULL LETTER GENERATOR ====================

export interface LetterSection {
  id: string;
  title: string;
  content: string;
  isOptional: boolean;
  isEmpty: boolean;
}

export function generateLetterSections(data: EngagementLetterData): LetterSection[] {
  const sections: LetterSection[] = [];

  // Header
  sections.push({
    id: 'header',
    title: 'Header',
    content: generateHeader(data.client),
    isOptional: false,
    isEmpty: false,
  });

  // Opening
  sections.push({
    id: 'opening',
    title: 'Opening',
    content: generateOpeningParagraph(data.initialContact),
    isOptional: false,
    isEmpty: false,
  });

  // Document Disclosure
  const docDisclosure = generateDocumentDisclosure(data.firmDocuments);
  sections.push({
    id: 'documents',
    title: 'Documents Provided',
    content: docDisclosure,
    isOptional: false,
    isEmpty: !docDisclosure,
  });

  // CFP Disclosure
  const cfpDisclosure = generateCFPDisclosure(data.cfpDisclosure);
  if (cfpDisclosure) {
    sections.push({
      id: 'cfp',
      title: 'CFP Fiduciary Disclosure',
      content: cfpDisclosure,
      isOptional: true,
      isEmpty: false,
    });
  }

  // Services Section Header
  sections.push({
    id: 'services_header',
    title: 'Services Header',
    content: 'WE WILL PROVIDE YOU THE FOLLOWING SERVICES AND PRODUCTS',
    isOptional: false,
    isEmpty: false,
  });

  // Services
  sections.push({
    id: 'services',
    title: 'Services Offered',
    content: generateServicesSection(data.services),
    isOptional: false,
    isEmpty: false,
  });

  // Goals
  sections.push({
    id: 'goals',
    title: 'Client Goals',
    content: generateGoalsSection(data.goals),
    isOptional: false,
    isEmpty: data.goals.length === 0,
  });

  // Planning Process
  if (data.services.financialPlanning) {
    sections.push({
      id: 'planning_process',
      title: 'Financial Planning Process',
      content: generatePlanningProcessSection(data.planningProcess),
      isOptional: false,
      isEmpty: false,
    });
  }

  // Accounts
  if (data.services.investmentAdvisory || data.services.brokerageServices) {
    sections.push({
      id: 'accounts',
      title: 'Account Configuration',
      content: generateAccountsSection(data.accounts),
      isOptional: false,
      isEmpty: data.accounts.length === 0,
    });
  }

  // Fees Section Header
  sections.push({
    id: 'fees_header',
    title: 'Fees Header',
    content: 'HOW YOU WILL PAY FOR PRODUCTS AND SERVICES',
    isOptional: false,
    isEmpty: false,
  });

  // Fees
  sections.push({
    id: 'fees',
    title: 'Fee Structure',
    content: generateFeesSection(data.fees, data.services),
    isOptional: false,
    isEmpty: false,
  });

  // Compensation Section Header
  sections.push({
    id: 'compensation_header',
    title: 'Compensation Header',
    content: 'HOW WE (THE FIRM AND I) WILL BE PAID',
    isOptional: false,
    isEmpty: false,
  });

  // Compensation
  sections.push({
    id: 'compensation',
    title: 'Compensation',
    content: generateCompensationSection(data.compensation),
    isOptional: false,
    isEmpty: false,
  });

  // Conflicts Section Header
  sections.push({
    id: 'conflicts_header',
    title: 'Conflicts Header',
    content: 'MY MATERIAL CONFLICTS OF INTEREST',
    isOptional: false,
    isEmpty: false,
  });

  // Conflicts
  sections.push({
    id: 'conflicts',
    title: 'Conflicts of Interest',
    content: generateConflictsSection(data.conflicts),
    isOptional: false,
    isEmpty: data.conflicts.length === 0,
  });

  // Responsibilities Section Header
  sections.push({
    id: 'responsibilities_header',
    title: 'Responsibilities Header',
    content: 'YOUR RESPONSIBILITIES',
    isOptional: false,
    isEmpty: false,
  });

  // Responsibilities
  sections.push({
    id: 'responsibilities',
    title: 'Client Responsibilities',
    content: generateResponsibilitiesSection(data.additional.clientResponsibilities),
    isOptional: false,
    isEmpty: data.additional.clientResponsibilities.length === 0,
  });

  // Timing
  sections.push({
    id: 'timing',
    title: 'Timing of the Engagement',
    content: generateTerminationSection(data.additional),
    isOptional: false,
    isEmpty: false,
  });

  // Privacy
  sections.push({
    id: 'privacy',
    title: 'Your Personal Information',
    content: generatePrivacySection(data.additional),
    isOptional: false,
    isEmpty: false,
  });

  // Disciplinary
  const disciplinary = generateDisciplinarySection(data.additional);
  if (disciplinary) {
    sections.push({
      id: 'disciplinary',
      title: 'Public Disciplinary and Bankruptcy History',
      content: disciplinary,
      isOptional: true,
      isEmpty: false,
    });
  }

  // Signature
  sections.push({
    id: 'signature',
    title: 'Signature',
    content: generateSignatureBlock(data.advisor),
    isOptional: false,
    isEmpty: false,
  });

  return sections;
}

export function generateFullLetterText(data: EngagementLetterData): string {
  const sections = generateLetterSections(data);
  return sections
    .filter((s) => !s.isEmpty)
    .map((s) => {
      // Headers are styled differently
      if (s.id.endsWith('_header')) {
        return `\n${s.content}\n`;
      }
      return s.content;
    })
    .join('\n\n');
}
