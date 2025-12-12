import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button, Input, Toggle, TextArea } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { CompensationDisclosure } from '../../../types';

const REVENUE_SHARING_PRODUCTS = [
  { id: 'mutual_funds', label: 'Mutual Funds', description: 'Revenue sharing from mutual fund companies' },
  { id: 'etfs', label: 'ETFs', description: 'Revenue sharing from ETF sponsors' },
  { id: 'annuities', label: 'Annuities', description: 'Revenue sharing from insurance companies' },
  { id: 'alternatives', label: 'Alternative Investments', description: 'Revenue sharing from alternative product sponsors' },
  { id: 'money_market', label: 'Money Market Funds', description: 'Revenue sharing from money market sweep programs' },
];

export function CompensationStep() {
  const { data, updateCompensation } = useWizardStore();
  const compensation = data.compensation || {} as CompensationDisclosure;
  const services = data.services;
  const fees = data.fees;

  const [customProduct, setCustomProduct] = useState('');

  const handleToggle = (
    key: keyof Pick<
      CompensationDisclosure,
      | 'paidFromPlanningFees'
      | 'paidFromAdvisoryFees'
      | 'paidFromCommissions'
      | 'paidFromInsuranceCommissions'
      | 'revenueSharing'
      | 'referralFees'
      | 'salesIncentives'
    >
  ) => {
    updateCompensation({ [key]: !compensation[key] });
  };

  const handleProductToggle = (productId: string) => {
    const currentProducts = compensation.revenueSharingProducts || [];
    if (currentProducts.includes(productId)) {
      updateCompensation({
        revenueSharingProducts: currentProducts.filter((p) => p !== productId),
      });
    } else {
      updateCompensation({
        revenueSharingProducts: [...currentProducts, productId],
      });
    }
  };

  const handleAddCustomProduct = () => {
    if (!customProduct.trim()) return;
    const currentProducts = compensation.revenueSharingProducts || [];
    updateCompensation({
      revenueSharingProducts: [...currentProducts, customProduct.trim()],
    });
    setCustomProduct('');
  };

  const handleRemoveCustomProduct = (product: string) => {
    const currentProducts = compensation.revenueSharingProducts || [];
    updateCompensation({
      revenueSharingProducts: currentProducts.filter((p) => p !== product),
    });
  };

  const isStandardProduct = (id: string) => REVENUE_SHARING_PRODUCTS.some((p) => p.id === id);

  const getCompensationPreview = () => {
    const sources: string[] = [];

    if (compensation.paidFromPlanningFees) {
      sources.push('Financial planning fees paid directly by client');
    }
    if (compensation.paidFromAdvisoryFees) {
      sources.push('Advisory fees deducted from client accounts');
    }
    if (compensation.paidFromCommissions) {
      sources.push('Commissions on securities transactions');
    }
    if (compensation.paidFromInsuranceCommissions) {
      sources.push('Commissions on insurance products');
    }

    if (compensation.revenueSharing && compensation.revenueSharingProducts?.length) {
      const products = compensation.revenueSharingProducts
        .map((id) => REVENUE_SHARING_PRODUCTS.find((p) => p.id === id)?.label || id)
        .join(', ');
      sources.push(`Revenue sharing from: ${products}`);
    }

    if (compensation.referralFees) {
      sources.push(`Referral fees: ${compensation.referralFeeDescription || 'Yes'}`);
    }

    if (compensation.salesIncentives) {
      sources.push(`Sales incentives: ${compensation.salesIncentiveDescription || 'Yes'}`);
    }

    if (sources.length === 0) {
      return 'No compensation sources selected';
    }

    return 'Compensation Sources:\n' + sources.map((s) => `• ${s}`).join('\n');
  };

  // Check for potential conflicts
  const hasFeeOnlyConflict =
    (compensation.paidFromCommissions || compensation.paidFromInsuranceCommissions) &&
    (compensation.paidFromPlanningFees || compensation.paidFromAdvisoryFees);

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Primary Compensation Sources */}
        <WizardStepSection
          title="Primary Compensation Sources"
          description="How will you and your firm be compensated for services provided?"
        >
          <div className="space-y-4">
            {services?.financialPlanning && fees?.financialPlanningFee && (
              <Toggle
                label="Financial Planning Fees"
                description="You will receive compensation from financial planning fees paid by the client"
                checked={compensation.paidFromPlanningFees}
                onChange={() => handleToggle('paidFromPlanningFees')}
              />
            )}

            {services?.investmentAdvisory && fees?.advisoryFee && (
              <Toggle
                label="Investment Advisory Fees"
                description="You will receive compensation from asset-based advisory fees"
                checked={compensation.paidFromAdvisoryFees}
                onChange={() => handleToggle('paidFromAdvisoryFees')}
              />
            )}

            {services?.brokerageServices && fees?.brokerageCommissions && (
              <Toggle
                label="Brokerage Commissions"
                description="You will receive commissions on securities transactions"
                checked={compensation.paidFromCommissions}
                onChange={() => handleToggle('paidFromCommissions')}
              />
            )}

            {services?.riskManagement && (
              <Toggle
                label="Insurance Commissions"
                description="You will receive commissions on insurance products sold"
                checked={compensation.paidFromInsuranceCommissions}
                onChange={() => handleToggle('paidFromInsuranceCommissions')}
              />
            )}
          </div>

          {hasFeeOnlyConflict && (
            <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-warning-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-warning-800">
                  You've selected both fee-based and commission-based compensation. This creates a potential
                  conflict of interest that should be disclosed in the conflicts section.
                </p>
              </div>
            </div>
          )}
        </WizardStepSection>

        {/* Revenue Sharing */}
        <WizardStepSection
          title="Revenue Sharing"
          description="Does your firm receive revenue sharing payments from product sponsors?"
        >
          <div className="space-y-4">
            <Toggle
              label="Receive Revenue Sharing"
              description="Your firm receives payments from investment product sponsors"
              checked={compensation.revenueSharing}
              onChange={() => handleToggle('revenueSharing')}
            />

            {compensation.revenueSharing && (
              <div className="ml-4 pl-4 border-l-2 border-secondary-200 space-y-3">
                <p className="text-sm text-primary-600">Select products with revenue sharing arrangements:</p>

                {REVENUE_SHARING_PRODUCTS.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-primary-200 hover:bg-primary-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={compensation.revenueSharingProducts?.includes(product.id) || false}
                      onChange={() => handleProductToggle(product.id)}
                      className="mt-1 h-4 w-4 rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary-800">{product.label}</span>
                      <p className="text-xs text-primary-500">{product.description}</p>
                    </div>
                  </label>
                ))}

                {/* Custom products */}
                {compensation.revenueSharingProducts?.filter((p) => !isStandardProduct(p)).map((product) => (
                  <div
                    key={product}
                    className="flex items-center justify-between p-3 rounded-lg border border-primary-200 bg-primary-50"
                  >
                    <span className="text-sm text-primary-800">{product}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomProduct(product)}
                    >
                      <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom product type..."
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddCustomProduct} disabled={!customProduct.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Referral Fees */}
        <WizardStepSection
          title="Referral Fees"
          description="Do you pay or receive referral fees for client introductions?"
        >
          <div className="space-y-4">
            <Toggle
              label="Referral Fee Arrangements"
              description="You pay or receive fees for client referrals"
              checked={compensation.referralFees}
              onChange={() => handleToggle('referralFees')}
            />

            {compensation.referralFees && (
              <div className="ml-4 pl-4 border-l-2 border-secondary-200">
                <TextArea
                  label="Referral Fee Description"
                  value={compensation.referralFeeDescription || ''}
                  onChange={(e) => updateCompensation({ referralFeeDescription: e.target.value })}
                  placeholder="Describe your referral fee arrangements, including who you pay or receive from, and the fee structure..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Sales Incentives */}
        <WizardStepSection
          title="Sales Incentives"
          description="Do you receive any sales incentives or bonuses from product sponsors?"
        >
          <div className="space-y-4">
            <Toggle
              label="Sales Incentives or Bonuses"
              description="You receive non-cash compensation, trips, prizes, or bonuses for product sales"
              checked={compensation.salesIncentives}
              onChange={() => handleToggle('salesIncentives')}
            />

            {compensation.salesIncentives && (
              <div className="ml-4 pl-4 border-l-2 border-secondary-200">
                <TextArea
                  label="Sales Incentive Description"
                  value={compensation.salesIncentiveDescription || ''}
                  onChange={(e) => updateCompensation({ salesIncentiveDescription: e.target.value })}
                  placeholder="Describe any sales contests, trips, or other incentives you may receive..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Compensation Preview</h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getCompensationPreview()}
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
              <h4 className="text-sm font-medium text-secondary-800">Compensation Disclosure Requirements</h4>
              <p className="text-sm text-secondary-700 mt-1">
                Full disclosure of all compensation arrangements is required under SEC regulations,
                FINRA rules, and CFP Board standards. Any source of compensation that could create
                a conflict of interest must be clearly disclosed to clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}
