import { format } from 'date-fns';
import type {
  EngagementLetterData,
  ClientInfo,
  InitialContact,
  FirmDocuments,
  CFPDisclosure,
  ChFCDisclosure,
  RIADisclosure,
  ServicesOffered,
  ClientGoal,
  PlanningProcess,
  Account,
  FeeStructure,
  CompensationDisclosure,
  ConflictOfInterest,
  ConflictMitigations,
  AdditionalSections,
  AdvisorInfo,
  DeliveryMethod,
  DisclaimerSettings,
} from '../types';
import {
  DEFAULT_CFP_LANGUAGE,
  DEFAULT_CHFC_LANGUAGE,
  DEFAULT_RIA_LANGUAGE,
  ENGAGEMENT_SCOPE_LANGUAGE,
  ADVISOR_RESPONSIBILITY_LANGUAGE,
  NO_MONITORING_LANGUAGE,
  DEFAULT_GOAL_TEMPLATES,
} from '../types';

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

export function generateChFCDisclosure(disclosure: ChFCDisclosure): string {
  if (!disclosure.include) return '';

  if (disclosure.useCustomLanguage && disclosure.customLanguage) {
    return disclosure.customLanguage;
  }

  return DEFAULT_CHFC_LANGUAGE;
}

export function generateRIADisclosure(disclosure: RIADisclosure): string {
  if (!disclosure.include) return '';

  if (disclosure.useCustomLanguage && disclosure.customLanguage) {
    return disclosure.customLanguage;
  }

  return DEFAULT_RIA_LANGUAGE;
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

  // Return just the services list - scope language will be added after goals
  const servicesText = servicesList.join('\n');
  return servicesText;
}

export function generateGoalsSection(
  goals: ClientGoal[],
  goalTemplates?: Array<{ category: string; planningLabel: string }>
): string {
  if (goals.length === 0) return 'We will work together to identify your financial goals.';

  // Group goals by category
  const goalsByCategory = new Map<string, string[]>();
  const customGoals: string[] = [];

  goals.forEach((goal) => {
    if (goal.isCustom || goal.category === 'Custom') {
      customGoals.push(goal.description);
    } else {
      const categoryLower = goal.category.toLowerCase();
      if (!goalsByCategory.has(categoryLower)) {
        goalsByCategory.set(categoryLower, []);
      }
      goalsByCategory.get(categoryLower)!.push(goal.description);
    }
  });

  const goalLines: string[] = [];

  // Generate formatted goal lines by category
  goalsByCategory.forEach((subTopics, categoryLower) => {
    // Find matching template for planning label
    const template = goalTemplates?.find(
      (t) => t.category.toLowerCase() === categoryLower
    );

    // Get proper category name (capitalized from template or original)
    const categoryName = template?.category ||
      categoryLower.charAt(0).toUpperCase() + categoryLower.slice(1);
    const planningLabel = template?.planningLabel || 'planning';

    // Format: "**Category planning**, including sub-topic1, sub-topic2, and sub-topic3."
    // The category + planning label are bold (marked with **)
    const subTopicsText = formatListWithAnd(subTopics);
    goalLines.push(`**${categoryName} ${planningLabel}**, including ${subTopicsText}.`);
  });

  // Add custom goals as separate lines
  customGoals.forEach((goal) => {
    goalLines.push(goal);
  });

  return `Based on our discussions, we will focus on the following areas:\n\n${goalLines.join('\n')}`;
}

// Helper to format a list with "and" before the last item
function formatListWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, and ${last}`;
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

  // Build the section with advisor responsibility clarification
  let sectionText = `Here is our approach to financial planning:\n\n${steps.join('\n')}`;

  // Add advisor responsibility clarification
  sectionText += `\n\n${ADVISOR_RESPONSIBILITY_LANGUAGE}`;

  // Add no monitoring disclosure if monitoring is not included
  if (!process.includeMonitoring) {
    sectionText += `\n\n${NO_MONITORING_LANGUAGE}`;
  }

  return sectionText;
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

    if (fp.type === 'hourly' && fp.hourlyRates) {
      const rates = fp.hourlyRates.map((r) => `${r.role}: ${formatCurrency(r.rate)}/hour`).join(', ');
      sections.push(`Financial Planning Fee: Hourly rates (${rates})`);
    } else if (fp.type === 'monthly') {
      // Monthly fee
      let feeText = `The fee for financial planning services is ${formatCurrency(fp.amount)} per month`;

      if (fp.monthlyDuration) {
        feeText += ` for ${fp.monthlyDuration} months`;
      }
      feeText += '.';

      // Add upfront period details if applicable
      if (fp.monthsUpfront && fp.monthsUpfront > 0) {
        const upfrontTotal = fp.amount * fp.monthsUpfront;
        feeText += ` You agree to pay ${fp.monthsUpfront} months upfront (${formatCurrency(upfrontTotal)}) at the start of the engagement.`;
      }

      sections.push(feeText);
    } else {
      // One-time or annual fee
      const feeTypeText = fp.type === 'annual' ? ' per year' : '';
      let feeText = `The total fee for the financial plan is ${formatCurrency(fp.amount)}${feeTypeText}.`;

      // Add installment details if applicable
      if (fp.useInstallments && fp.installments && fp.installments.length > 0) {
        feeText += ` You agree to pay this fee in ${fp.installments.length === 2 ? 'two' : fp.installments.length} installments:`;
        const installmentLines = fp.installments.map(
          (inst) => `• ${formatCurrency(inst.amount)} ${inst.description}`
        );
        feeText += `\n${installmentLines.join('\n')}`;
      }

      sections.push(feeText);
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

  // Additional advisory fee (when charged separately)
  if (fees.includeAdditionalAdvisoryFee && fees.additionalAdvisoryFeePercentage) {
    let advFeeText = `Additional Advisory Fee: ${formatPercentage(fees.additionalAdvisoryFeePercentage)} annual fee`;
    if (fees.additionalAdvisoryFeeDescription) {
      advFeeText += ` ${fees.additionalAdvisoryFeeDescription}`;
    }
    advFeeText += '.';
    sections.push(advFeeText);
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

export function generateConflictsSection(
  conflicts: ConflictOfInterest[],
  mitigations?: ConflictMitigations
): string {
  if (conflicts.length === 0) {
    return 'We are committed to acting in your best interests and will disclose any material conflicts as they arise.';
  }

  // Sort conflicts so "future conflicts" (containing "Additional conflicts may arise") always appears last
  const sortedConflicts = [...conflicts].sort((a, b) => {
    const aIsFuture = a.description.includes('Additional conflicts may arise');
    const bIsFuture = b.description.includes('Additional conflicts may arise');
    if (aIsFuture && !bIsFuture) return 1;
    if (!aIsFuture && bIsFuture) return -1;
    return 0;
  });

  const conflictText = sortedConflicts.map((c) => `• ${c.description}`).join('\n\n');
  let result = `The following are material conflicts of interest that you should be aware of:\n\n${conflictText}`;

  // Add mitigation strategies if enabled and there are strategies
  if (mitigations?.includeMitigations && mitigations.mitigationStrategies.length > 0) {
    const mitigationText = mitigations.mitigationStrategies.map((m) => `• ${m}`).join('\n');
    result += `\n\nTo mitigate these conflicts:\n${mitigationText}`;
  }

  return result;
}

export function generateResponsibilitiesSection(responsibilities: string[]): string {
  if (responsibilities.length === 0) {
    return 'We ask that you provide complete and accurate information to help us serve you effectively.';
  }

  const respText = responsibilities.map((r) => `• ${r}`).join('\n');
  return `To help us serve you effectively, we ask that you:\n\n${respText}`;
}

export function generateTerminationSection(additional: AdditionalSections): string {
  const parts: string[] = [];

  if (additional.engagementTermination === 'fixed_term') {
    // Build the engagement term description
    const startDesc = additional.engagementStartDescription || 'on the date of our first meeting';
    const endDesc = additional.engagementEndDescription || 'upon delivery of the final plan';

    let termDescription = `This engagement begins ${startDesc} and concludes ${endDesc}`;

    // Add follow-up period if included
    if (additional.includeFollowUpPeriod && additional.followUpPeriod) {
      termDescription += `, with limited check-ins available for up to ${additional.followUpPeriod} afterward`;
    }
    termDescription += '.';
    parts.push(termDescription);

    // Add termination clause
    const terminationNotice = additional.terminationNotice || 'written notice';
    parts.push(`Either party may terminate this agreement at any time with ${terminationNotice}.`);

    // Add fee language for early termination
    if (additional.terminationFeeLanguage) {
      parts.push(`In that case, ${additional.terminationFeeLanguage}.`);
    }
  } else {
    // Ongoing engagement
    parts.push('This engagement will continue until terminated by either party.');
    const terminationNotice = additional.terminationNotice || 'written notice';
    parts.push(`Either party may terminate at any time with ${terminationNotice}.`);

    if (additional.terminationFeeLanguage) {
      parts.push(`In that case, ${additional.terminationFeeLanguage}.`);
    }
  }

  return parts.join(' ');
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
  }

  if (additional.hasBankruptcyHistory) {
    parts.push(`Bankruptcy History: ${additional.bankruptcyDescription || 'Please ask for details.'}`);
  }

  // If no disciplinary or bankruptcy history, show clean record statement
  if (!additional.hasDisciplinaryHistory && !additional.hasBankruptcyHistory && additional.includeCleanRecord) {
    parts.push('I do not have public disciplinary or bankruptcy history.');
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

export function generateDisclaimer(disclaimer: DisclaimerSettings | undefined): string {
  if (!disclaimer?.includeDisclaimer || !disclaimer.disclaimerText) {
    return '';
  }
  return disclaimer.disclaimerText;
}

// ==================== FULL LETTER GENERATOR ====================

export interface LetterSection {
  id: string;
  title: string;
  content: string;
  isOptional: boolean;
  isEmpty: boolean;
}

export function generateLetterSections(
  data: EngagementLetterData,
  disclaimer?: DisclaimerSettings
): LetterSection[] {
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

  // RIA Fiduciary Disclosure (first, as it's the general fiduciary standard)
  const riaDisclosure = generateRIADisclosure(data.riaDisclosure);
  if (riaDisclosure) {
    sections.push({
      id: 'ria',
      title: 'RIA Fiduciary Disclosure',
      content: riaDisclosure,
      isOptional: true,
      isEmpty: false,
    });
  }

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

  // ChFC Disclosure
  const chfcDisclosure = generateChFCDisclosure(data.chfcDisclosure);
  if (chfcDisclosure) {
    sections.push({
      id: 'chfc',
      title: 'ChFC Professional Disclosure',
      content: chfcDisclosure,
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
    content: generateGoalsSection(data.goals, DEFAULT_GOAL_TEMPLATES),
    isOptional: false,
    isEmpty: data.goals.length === 0,
  });

  // Scope limitation (appears after services and goals)
  sections.push({
    id: 'scope',
    title: 'Engagement Scope',
    content: ENGAGEMENT_SCOPE_LANGUAGE,
    isOptional: false,
    isEmpty: false,
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
    content: generateConflictsSection(data.conflicts, data.conflictMitigations),
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

  // Timing Section Header
  sections.push({
    id: 'timing_header',
    title: 'Timing Header',
    content: 'TERM OF ENGAGEMENT',
    isOptional: false,
    isEmpty: false,
  });

  // Timing
  sections.push({
    id: 'timing',
    title: 'Timing of the Engagement',
    content: generateTerminationSection(data.additional),
    isOptional: false,
    isEmpty: false,
  });

  // Privacy Section Header
  sections.push({
    id: 'privacy_header',
    title: 'Privacy Header',
    content: 'YOUR PERSONAL INFORMATION',
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
    // Disciplinary Section Header
    sections.push({
      id: 'disciplinary_header',
      title: 'Disciplinary Header',
      content: 'PUBLIC DISCIPLINARY AND BANKRUPTCY HISTORY',
      isOptional: true,
      isEmpty: false,
    });

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

  // Disclaimer (after signature)
  const disclaimerContent = generateDisclaimer(disclaimer);
  if (disclaimerContent) {
    sections.push({
      id: 'disclaimer',
      title: 'Disclaimer',
      content: disclaimerContent,
      isOptional: true,
      isEmpty: false,
    });
  }

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
