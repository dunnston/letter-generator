import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button, Input, Select, Toggle } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type {
  FeeStructure,
  FinancialPlanningFee,
  AdvisoryFee,
  RiskManagementFee,
  FeeTier,
  HourlyRate,
  FeeInstallment,
  PlanningFeeType,
  AdvisoryCalculationMethod,
  PaymentSchedule,
  RiskManagementFeeType,
} from '../../../types';

const PLANNING_FEE_TYPES = [
  { value: 'one_time', label: 'One-Time Fee' },
  { value: 'monthly', label: 'Monthly Fee' },
  { value: 'annual', label: 'Annual Fee' },
  { value: 'hourly', label: 'Hourly Rate' },
];

const CALCULATION_METHODS = [
  { value: 'quarter_end', label: 'Quarter-End Balance' },
  { value: 'average_daily', label: 'Average Daily Balance' },
  { value: 'average_monthly', label: 'Average Monthly Balance' },
];

const PAYMENT_SCHEDULES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (in arrears)' },
  { value: 'annually', label: 'Annually' },
];

const RISK_MANAGEMENT_FEE_TYPES = [
  { value: 'included_in_planning', label: 'Included in Financial Planning Fee' },
  { value: 'separate_commission', label: 'Separate Commission-Based' },
  { value: 'fee_based', label: 'Separate Fee-Based' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function FeeStructureStep() {
  const { data, updateFees } = useWizardStore();
  const fees: Partial<FeeStructure> = data.fees || {};
  const services = data.services;
  const accounts = data.accounts || [];

  // Local state for managing fee tier editing
  const [newTierUpTo, setNewTierUpTo] = useState('');
  const [newTierPercentage, setNewTierPercentage] = useState('');

  // Local state for hourly rates
  const [newRole, setNewRole] = useState('');
  const [newRate, setNewRate] = useState('');

  // Financial Planning Fee Handlers
  const handlePlanningFeeTypeChange = (type: PlanningFeeType) => {
    const planningFee: FinancialPlanningFee = {
      type,
      amount: fees.financialPlanningFee?.amount || 0,
      hourlyRates: type === 'hourly' ? fees.financialPlanningFee?.hourlyRates || [] : undefined,
      useInstallments: fees.financialPlanningFee?.useInstallments || false,
      installments: fees.financialPlanningFee?.installments,
    };
    updateFees({ financialPlanningFee: planningFee });
  };

  const handlePlanningFeeAmountChange = (amount: number) => {
    if (fees.financialPlanningFee) {
      updateFees({
        financialPlanningFee: { ...fees.financialPlanningFee, amount },
      });
    }
  };

  const handleAddHourlyRate = () => {
    if (!newRole || !newRate) return;
    const rate: HourlyRate = { role: newRole, rate: parseFloat(newRate) };
    const currentRates = fees.financialPlanningFee?.hourlyRates || [];
    updateFees({
      financialPlanningFee: {
        ...fees.financialPlanningFee!,
        hourlyRates: [...currentRates, rate],
      },
    });
    setNewRole('');
    setNewRate('');
  };

  const handleRemoveHourlyRate = (index: number) => {
    const currentRates = fees.financialPlanningFee?.hourlyRates || [];
    updateFees({
      financialPlanningFee: {
        ...fees.financialPlanningFee!,
        hourlyRates: currentRates.filter((_, i) => i !== index),
      },
    });
  };

  // Installment handlers
  const handleToggleInstallments = (useInstallments: boolean) => {
    if (fees.financialPlanningFee) {
      const totalAmount = fees.financialPlanningFee.amount || 0;
      const defaultInstallments: FeeInstallment[] = useInstallments
        ? [
            { amount: totalAmount / 2, description: 'due at the start of the engagement' },
            { amount: totalAmount / 2, description: 'due upon delivery of the final plan' },
          ]
        : [];
      updateFees({
        financialPlanningFee: {
          ...fees.financialPlanningFee,
          useInstallments,
          installments: defaultInstallments,
        },
      });
    }
  };

  const handleInstallmentChange = (index: number, field: keyof FeeInstallment, value: string | number) => {
    if (fees.financialPlanningFee?.installments) {
      const updatedInstallments = [...fees.financialPlanningFee.installments];
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        [field]: field === 'amount' ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value,
      };
      updateFees({
        financialPlanningFee: {
          ...fees.financialPlanningFee,
          installments: updatedInstallments,
        },
      });
    }
  };

  const handleAddInstallment = () => {
    if (fees.financialPlanningFee) {
      const currentInstallments = fees.financialPlanningFee.installments || [];
      updateFees({
        financialPlanningFee: {
          ...fees.financialPlanningFee,
          installments: [...currentInstallments, { amount: 0, description: '' }],
        },
      });
    }
  };

  const handleRemoveInstallment = (index: number) => {
    if (fees.financialPlanningFee?.installments) {
      updateFees({
        financialPlanningFee: {
          ...fees.financialPlanningFee,
          installments: fees.financialPlanningFee.installments.filter((_, i) => i !== index),
        },
      });
    }
  };

  // Advisory Fee Handlers
  const initializeAdvisoryFee = () => {
    const advisoryFee: AdvisoryFee = {
      calculationMethod: 'quarter_end',
      tiers: [{ upTo: null, percentage: 1.0 }],
      paymentSchedule: 'quarterly',
      deductedFrom: accounts[0]?.nickname || '',
    };
    updateFees({ advisoryFee });
  };

  const handleCalculationMethodChange = (method: AdvisoryCalculationMethod) => {
    if (fees.advisoryFee) {
      updateFees({ advisoryFee: { ...fees.advisoryFee, calculationMethod: method } });
    }
  };

  const handlePaymentScheduleChange = (schedule: PaymentSchedule) => {
    if (fees.advisoryFee) {
      updateFees({ advisoryFee: { ...fees.advisoryFee, paymentSchedule: schedule } });
    }
  };

  const handleDeductedFromChange = (accountName: string) => {
    if (fees.advisoryFee) {
      updateFees({ advisoryFee: { ...fees.advisoryFee, deductedFrom: accountName } });
    }
  };

  const handleAddTier = () => {
    if (!newTierPercentage) return;
    const upTo = newTierUpTo ? parseInt(newTierUpTo) : null;
    const percentage = parseFloat(newTierPercentage);
    const currentTiers = fees.advisoryFee?.tiers || [];

    // Insert the new tier in the correct position (sorted by upTo)
    const newTier: FeeTier = { upTo, percentage };
    let updatedTiers: FeeTier[];

    if (upTo === null) {
      // If unlimited, replace any existing unlimited tier or add at end
      updatedTiers = currentTiers.filter(t => t.upTo !== null);
      updatedTiers.push(newTier);
    } else {
      // Insert in sorted order
      updatedTiers = [...currentTiers.filter(t => t.upTo !== null), newTier]
        .sort((a, b) => (a.upTo || Infinity) - (b.upTo || Infinity));
      // Add back unlimited tier if it exists
      const unlimitedTier = currentTiers.find(t => t.upTo === null);
      if (unlimitedTier) updatedTiers.push(unlimitedTier);
    }

    updateFees({
      advisoryFee: { ...fees.advisoryFee!, tiers: updatedTiers },
    });
    setNewTierUpTo('');
    setNewTierPercentage('');
  };

  const handleRemoveTier = (index: number) => {
    const currentTiers = fees.advisoryFee?.tiers || [];
    updateFees({
      advisoryFee: {
        ...fees.advisoryFee!,
        tiers: currentTiers.filter((_, i) => i !== index),
      },
    });
  };

  // Risk Management Fee Handlers
  const handleRiskFeeTypeChange = (type: RiskManagementFeeType) => {
    const riskFee: RiskManagementFee = {
      type,
      thirdPartyAgent: fees.riskManagementFee?.thirdPartyAgent || false,
    };
    updateFees({ riskManagementFee: riskFee });
  };

  // Preview
  const getFeesPreview = () => {
    const parts: string[] = [];

    if (services?.financialPlanning && fees.financialPlanningFee) {
      const fp = fees.financialPlanningFee;
      if (fp.type === 'one_time') {
        parts.push(`Financial Planning: ${formatCurrency(fp.amount)} (one-time)`);
      } else if (fp.type === 'annual') {
        parts.push(`Financial Planning: ${formatCurrency(fp.amount)}/year`);
      } else if (fp.type === 'monthly') {
        let monthlyText = `Financial Planning: ${formatCurrency(fp.amount)}/month`;
        if (fp.monthsUpfront && fp.monthsUpfront > 0) {
          monthlyText += ` (${fp.monthsUpfront} months upfront: ${formatCurrency(fp.amount * fp.monthsUpfront)})`;
        }
        if (fp.monthlyDuration) {
          monthlyText += ` for ${fp.monthlyDuration} months`;
        }
        parts.push(monthlyText);
      } else if (fp.type === 'hourly' && fp.hourlyRates?.length) {
        const rates = fp.hourlyRates.map(r => `${r.role}: ${formatCurrency(r.rate)}/hr`).join(', ');
        parts.push(`Financial Planning: Hourly (${rates})`);
      }
    }

    if (services?.investmentAdvisory && fees.advisoryFee) {
      const adv = fees.advisoryFee;
      const tierDesc = adv.tiers.map(t =>
        t.upTo === null
          ? `Above: ${formatPercentage(t.percentage)}`
          : `Up to ${formatCurrency(t.upTo)}: ${formatPercentage(t.percentage)}`
      ).join('; ');
      parts.push(`Advisory Fee: ${tierDesc}`);
      parts.push(`  Calculated: ${CALCULATION_METHODS.find(m => m.value === adv.calculationMethod)?.label}`);
      parts.push(`  Paid: ${PAYMENT_SCHEDULES.find(s => s.value === adv.paymentSchedule)?.label}`);
    }

    if (fees.brokerageCommissions) {
      parts.push('Brokerage: Commission-based');
    }

    if (services?.riskManagement && fees.riskManagementFee) {
      const rf = fees.riskManagementFee;
      parts.push(`Risk Management: ${RISK_MANAGEMENT_FEE_TYPES.find(t => t.value === rf.type)?.label}`);
    }

    if (fees.mutualFundETFFees) {
      parts.push('Note: Mutual fund/ETF fees apply');
    }

    if (fees.custodyFees) {
      parts.push(`Custody fees: ${fees.custodyFeeDescription || 'Apply'}`);
    }

    if (fees.includeAdditionalAdvisoryFee && fees.additionalAdvisoryFeePercentage) {
      let advFeeText = `Additional Advisory Fee: ${formatPercentage(fees.additionalAdvisoryFeePercentage)}`;
      if (fees.additionalAdvisoryFeeDescription) {
        advFeeText += ` ${fees.additionalAdvisoryFeeDescription}`;
      }
      parts.push(advFeeText);
    }

    return parts.length > 0 ? parts.join('\n') : 'No fees configured';
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Financial Planning Fee */}
        {services?.financialPlanning && (
          <WizardStepSection
            title="Financial Planning Fee"
            description="How the client will pay for financial planning services."
          >
            <div className="space-y-4">
              <Select
                label="Fee Type"
                options={PLANNING_FEE_TYPES}
                value={fees.financialPlanningFee?.type || ''}
                onChange={(e) => handlePlanningFeeTypeChange(e.target.value as PlanningFeeType)}
                placeholder="Select fee type"
              />

              {fees.financialPlanningFee?.type === 'one_time' && (
                <div className="space-y-4">
                  <Input
                    label="Total Fee Amount"
                    type="number"
                    value={fees.financialPlanningFee.amount || ''}
                    onChange={(e) => handlePlanningFeeAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 2400"
                    hint="Total fee for the financial plan"
                  />

                  <Toggle
                    label="Split into installments"
                    description="Allow the client to pay in multiple installments"
                    checked={fees.financialPlanningFee.useInstallments || false}
                    onChange={(e) => handleToggleInstallments(e.target.checked)}
                  />

                  {fees.financialPlanningFee.useInstallments && (
                    <div className="border border-primary-200 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-medium text-primary-700">Payment Installments</h4>

                      {(fees.financialPlanningFee.installments || []).map((installment, index) => (
                        <div key={index} className="flex items-start gap-3 bg-primary-50 p-3 rounded">
                          <div className="flex-shrink-0 w-28">
                            <Input
                              type="number"
                              value={installment.amount || ''}
                              onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                              placeholder="Amount"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              value={installment.description || ''}
                              onChange={(e) => handleInstallmentChange(index, 'description', e.target.value)}
                              placeholder="e.g., due at the start of the engagement"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInstallment(index)}
                          >
                            <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      ))}

                      <Button variant="secondary" size="sm" onClick={handleAddInstallment}>
                        Add Installment
                      </Button>

                      {fees.financialPlanningFee.installments && fees.financialPlanningFee.installments.length > 0 && (
                        <p className="text-xs text-primary-500">
                          Total installments: {formatCurrency(
                            fees.financialPlanningFee.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0)
                          )}
                          {fees.financialPlanningFee.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0) !==
                            fees.financialPlanningFee.amount && (
                            <span className="text-warning-600 ml-2">
                              (does not match total fee of {formatCurrency(fees.financialPlanningFee.amount)})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {fees.financialPlanningFee?.type === 'annual' && (
                <Input
                  label="Annual Fee Amount"
                  type="number"
                  value={fees.financialPlanningFee.amount || ''}
                  onChange={(e) => handlePlanningFeeAmountChange(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 1500"
                  hint="Annual fee for ongoing planning services"
                />
              )}

              {fees.financialPlanningFee?.type === 'monthly' && (
                <div className="space-y-4">
                  <Input
                    label="Monthly Fee Amount"
                    type="number"
                    value={fees.financialPlanningFee.amount || ''}
                    onChange={(e) => handlePlanningFeeAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 200"
                    hint="Monthly fee amount"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Months Upfront"
                      type="number"
                      value={fees.financialPlanningFee.monthsUpfront || ''}
                      onChange={(e) =>
                        updateFees({
                          financialPlanningFee: {
                            ...fees.financialPlanningFee!,
                            monthsUpfront: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder="e.g., 6"
                      hint="Number of months to pay upfront (optional)"
                    />
                    <Input
                      label="Total Duration (months)"
                      type="number"
                      value={fees.financialPlanningFee.monthlyDuration || ''}
                      onChange={(e) =>
                        updateFees({
                          financialPlanningFee: {
                            ...fees.financialPlanningFee!,
                            monthlyDuration: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder="e.g., 12"
                      hint="Total engagement duration in months (optional)"
                    />
                  </div>

                  {fees.financialPlanningFee.monthsUpfront && fees.financialPlanningFee.monthsUpfront > 0 && (
                    <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                      <p className="text-sm text-primary-600">
                        <strong>Upfront payment:</strong> {formatCurrency(fees.financialPlanningFee.amount * fees.financialPlanningFee.monthsUpfront)} ({fees.financialPlanningFee.monthsUpfront} months × {formatCurrency(fees.financialPlanningFee.amount)}/month)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {fees.financialPlanningFee?.type === 'hourly' && (
                <div className="space-y-4">
                  <div className="border border-primary-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-primary-700">Hourly Rates by Role</h4>

                    {(fees.financialPlanningFee.hourlyRates || []).map((rate, index) => (
                      <div key={index} className="flex items-center gap-3 bg-primary-50 p-2 rounded">
                        <span className="flex-1 text-sm text-primary-800">{rate.role}</span>
                        <span className="text-sm font-medium text-primary-700">
                          {formatCurrency(rate.rate)}/hr
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHourlyRate(index)}
                        >
                          <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Role (e.g., Advisor, Associate)"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        className="w-24"
                      />
                      <Button onClick={handleAddHourlyRate} disabled={!newRole || !newRate}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WizardStepSection>
        )}

        {/* Investment Advisory Fee */}
        {services?.investmentAdvisory && (
          <WizardStepSection
            title="Investment Advisory Fee"
            description="Asset-based fee for investment management services."
          >
            {!fees.advisoryFee ? (
              <Button onClick={initializeAdvisoryFee}>Configure Advisory Fee</Button>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Calculation Method"
                  options={CALCULATION_METHODS}
                  value={fees.advisoryFee.calculationMethod}
                  onChange={(e) => handleCalculationMethodChange(e.target.value as AdvisoryCalculationMethod)}
                />

                {/* Fee Tiers */}
                <div className="border border-primary-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-primary-700">Fee Tiers</h4>
                  <p className="text-xs text-primary-500">Add tiered rates based on assets under management</p>

                  {fees.advisoryFee.tiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-3 bg-primary-50 p-2 rounded">
                      <span className="flex-1 text-sm text-primary-800">
                        {tier.upTo === null
                          ? 'All remaining assets'
                          : `Up to ${formatCurrency(tier.upTo)}`}
                      </span>
                      <span className="text-sm font-medium text-primary-700">
                        {formatPercentage(tier.percentage)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTier(index)}
                        disabled={fees.advisoryFee!.tiers.length <= 1}
                      >
                        <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2 items-end">
                    <Input
                      label="Up to ($)"
                      type="number"
                      placeholder="Leave empty for 'all above'"
                      value={newTierUpTo}
                      onChange={(e) => setNewTierUpTo(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      label="Rate (%)"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.00"
                      value={newTierPercentage}
                      onChange={(e) => setNewTierPercentage(e.target.value)}
                      className="w-28"
                    />
                    <Button onClick={handleAddTier} disabled={!newTierPercentage}>
                      Add Tier
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Payment Schedule"
                    options={PAYMENT_SCHEDULES}
                    value={fees.advisoryFee.paymentSchedule}
                    onChange={(e) => handlePaymentScheduleChange(e.target.value as PaymentSchedule)}
                  />

                  {accounts.length > 0 && (
                    <Select
                      label="Deducted From Account"
                      options={accounts.map((a) => ({ value: a.nickname || a.id, label: a.nickname || `Account ${a.id}` }))}
                      value={fees.advisoryFee.deductedFrom}
                      onChange={(e) => handleDeductedFromChange(e.target.value)}
                      hint="Which account will fees be deducted from?"
                    />
                  )}
                </div>
              </div>
            )}
          </WizardStepSection>
        )}

        {/* Brokerage Commissions */}
        {services?.brokerageServices && (
          <WizardStepSection
            title="Brokerage Commissions"
            description="Transaction-based fees for securities trades."
          >
            <Toggle
              label="Commission-Based Transactions"
              description="Client will pay commissions on securities transactions in brokerage accounts"
              checked={fees.brokerageCommissions || false}
              onChange={() => updateFees({ brokerageCommissions: !fees.brokerageCommissions })}
            />
          </WizardStepSection>
        )}

        {/* Risk Management Fee */}
        {services?.riskManagement && (
          <WizardStepSection
            title="Risk Management / Insurance Fee"
            description="How insurance and risk management services are compensated."
          >
            <div className="space-y-4">
              <Select
                label="Fee Structure"
                options={RISK_MANAGEMENT_FEE_TYPES}
                value={fees.riskManagementFee?.type || ''}
                onChange={(e) => handleRiskFeeTypeChange(e.target.value as RiskManagementFeeType)}
                placeholder="Select fee structure"
              />

              {fees.riskManagementFee?.type === 'separate_commission' && (
                <Toggle
                  label="Third-Party Insurance Agent"
                  description="Insurance products are placed through a third-party agent who receives commissions"
                  checked={fees.riskManagementFee.thirdPartyAgent}
                  onChange={() =>
                    updateFees({
                      riskManagementFee: {
                        ...fees.riskManagementFee!,
                        thirdPartyAgent: !fees.riskManagementFee!.thirdPartyAgent,
                      },
                    })
                  }
                />
              )}
            </div>
          </WizardStepSection>
        )}

        {/* Additional Fee Disclosures */}
        <WizardStepSection
          title="Additional Fee Disclosures"
          description="Other fees the client should be aware of."
        >
          <div className="space-y-3">
            <Toggle
              label="Mutual Fund / ETF Fees"
              description="Mutual funds and ETFs have internal fees (expense ratios) that are separate from your advisory fees"
              checked={fees.mutualFundETFFees ?? true}
              onChange={() => updateFees({ mutualFundETFFees: !fees.mutualFundETFFees })}
            />

            <Toggle
              label="Custody Fees"
              description="The custodian charges additional fees for account maintenance"
              checked={fees.custodyFees || false}
              onChange={() => updateFees({ custodyFees: !fees.custodyFees })}
            />

            {fees.custodyFees && (
              <div className="ml-4 pl-4 border-l-2 border-primary-200">
                <Input
                  label="Custody Fee Description"
                  value={fees.custodyFeeDescription || ''}
                  onChange={(e) => updateFees({ custodyFeeDescription: e.target.value })}
                  placeholder="e.g., $50/year per account"
                />
              </div>
            )}

            <Toggle
              label="Additional Advisory Fee"
              description="If you also charge an advisory fee on managed assets (in addition to planning fees)"
              checked={fees.includeAdditionalAdvisoryFee || false}
              onChange={() => updateFees({ includeAdditionalAdvisoryFee: !fees.includeAdditionalAdvisoryFee })}
            />

            {fees.includeAdditionalAdvisoryFee && (
              <div className="ml-4 pl-4 border-l-2 border-primary-200 space-y-3">
                <Input
                  label="Advisory Fee Percentage"
                  type="number"
                  step="0.01"
                  value={fees.additionalAdvisoryFeePercentage || ''}
                  onChange={(e) => updateFees({ additionalAdvisoryFeePercentage: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 1.0"
                  hint="Annual percentage charged on managed assets"
                />
                <Input
                  label="Description (optional)"
                  value={fees.additionalAdvisoryFeeDescription || ''}
                  onChange={(e) => updateFees({ additionalAdvisoryFeeDescription: e.target.value })}
                  placeholder="e.g., on assets under management at custodian"
                  hint="Additional context about when/how this fee applies"
                />
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Fee Structure Preview</h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getFeesPreview()}
          </pre>
        </div>

        {/* Info Box */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-secondary-800">Fee Disclosure Requirements</h4>
              <p className="text-sm text-secondary-700 mt-1">
                Clear fee disclosure is required under SEC regulations and fiduciary standards.
                All material fees should be disclosed in writing before the engagement begins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}
