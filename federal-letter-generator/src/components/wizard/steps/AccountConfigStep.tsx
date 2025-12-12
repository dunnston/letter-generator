import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button, Input, Select, Toggle } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { Account, AccountType, CustodianType, ReportFrequency } from '../../../types';

const ACCOUNT_TYPES = [
  { value: 'investment_advisory', label: 'Investment Advisory Account' },
  { value: 'brokerage', label: 'Brokerage Account' },
  { value: 'retirement_brokerage', label: 'Retirement Brokerage Account' },
];

const CUSTODIAN_TYPES = [
  { value: 'firm', label: 'Firm Custodian' },
  { value: 'third_party', label: 'Third-Party Custodian' },
];

const REPORT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

function generateId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface AccountCardProps {
  account: Account;
  onUpdate: (updates: Partial<Account>) => void;
  onRemove: () => void;
  index: number;
}

function AccountCard({ account, onUpdate, onRemove, index }: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-primary-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-primary-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-secondary-600 text-white text-xs font-medium flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-medium text-primary-800">
            {account.nickname || `Account ${index + 1}`}
          </span>
          <span className="text-sm text-primary-500">
            {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
          <svg
            className={`w-5 h-5 text-primary-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Nickname"
              value={account.nickname}
              onChange={(e) => onUpdate({ nickname: e.target.value })}
              placeholder="e.g., Primary Brokerage, IRA"
              hint="A friendly name to identify this account"
            />
            <Select
              label="Account Type"
              options={ACCOUNT_TYPES}
              value={account.type}
              onChange={(e) => onUpdate({ type: e.target.value as AccountType })}
            />
          </div>

          {/* Custodian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Custodian"
              options={CUSTODIAN_TYPES}
              value={account.custodian}
              onChange={(e) => onUpdate({ custodian: e.target.value as CustodianType })}
            />
            {account.custodian === 'third_party' && (
              <Input
                label="Custodian Name"
                value={account.custodianName || ''}
                onChange={(e) => onUpdate({ custodianName: e.target.value })}
                placeholder="e.g., Charles Schwab, Fidelity"
              />
            )}
          </div>

          {/* Account Settings */}
          <div className="pt-4 border-t border-primary-100 space-y-3">
            <h4 className="text-sm font-medium text-primary-700">Account Settings</h4>

            <Toggle
              label="Discretionary Authority"
              description="You have authority to make investment decisions without prior client approval"
              checked={account.discretionary}
              onChange={() => onUpdate({ discretionary: !account.discretionary })}
            />

            <Toggle
              label="Will Monitor Account"
              description="You will actively monitor this account's performance and holdings"
              checked={account.willMonitor}
              onChange={() => onUpdate({ willMonitor: !account.willMonitor })}
            />

            <Toggle
              label="Will Provide Recommendations"
              description="You will provide investment recommendations for this account"
              checked={account.willProvideRecommendations}
              onChange={() => onUpdate({ willProvideRecommendations: !account.willProvideRecommendations })}
            />

            <Toggle
              label="Online Account Access"
              description="Client has online access to view account information"
              checked={account.onlineAccess}
              onChange={() => onUpdate({ onlineAccess: !account.onlineAccess })}
            />
          </div>

          {/* Reporting */}
          {account.willMonitor && (
            <div className="pt-4 border-t border-primary-100">
              <Select
                label="Report Frequency"
                options={REPORT_FREQUENCIES}
                value={account.reportFrequency}
                onChange={(e) => onUpdate({ reportFrequency: e.target.value as ReportFrequency })}
                hint="How often you will provide account reports to the client"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountConfigStep() {
  const { data, addAccount, removeAccount, updateAccount } = useWizardStore();
  const accounts = data.accounts || [];
  const services = data.services;

  const handleAddAccount = () => {
    const newAccount: Account = {
      id: generateId(),
      nickname: '',
      type: services?.investmentAdvisory ? 'investment_advisory' : 'brokerage',
      custodian: 'third_party',
      custodianName: '',
      discretionary: false,
      willMonitor: true,
      willProvideRecommendations: true,
      reportFrequency: 'quarterly',
      onlineAccess: true,
    };
    addAccount(newAccount);
  };

  const getAccountsSummary = () => {
    if (accounts.length === 0) {
      return 'No accounts configured';
    }

    const advisory = accounts.filter((a) => a.type === 'investment_advisory').length;
    const brokerage = accounts.filter((a) => a.type === 'brokerage' || a.type === 'retirement_brokerage').length;
    const discretionary = accounts.filter((a) => a.discretionary).length;

    let summary = `${accounts.length} account${accounts.length > 1 ? 's' : ''} configured:\n`;
    if (advisory > 0) summary += `• ${advisory} Investment Advisory\n`;
    if (brokerage > 0) summary += `• ${brokerage} Brokerage\n`;
    if (discretionary > 0) summary += `• ${discretionary} with discretionary authority\n`;

    return summary;
  };

  const showAdvisoryHint = services?.investmentAdvisory && accounts.filter((a) => a.type === 'investment_advisory').length === 0;
  const showBrokerageHint = services?.brokerageServices && accounts.filter((a) => a.type === 'brokerage' || a.type === 'retirement_brokerage').length === 0;

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Account List */}
        <WizardStepSection
          title="Client Accounts"
          description="Configure the accounts that will be part of this engagement."
        >
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-primary-200 rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-primary-800">No accounts</h3>
                <p className="mt-1 text-sm text-primary-500">
                  Add accounts to configure for this engagement.
                </p>
                <div className="mt-4">
                  <Button onClick={handleAddAccount}>Add Account</Button>
                </div>
              </div>
            ) : (
              <>
                {accounts.map((account, index) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    index={index}
                    onUpdate={(updates) => updateAccount(account.id, updates)}
                    onRemove={() => removeAccount(account.id)}
                  />
                ))}
                <Button variant="outline" onClick={handleAddAccount} className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Account
                </Button>
              </>
            )}
          </div>
        </WizardStepSection>

        {/* Warnings for missing account types */}
        {(showAdvisoryHint || showBrokerageHint) && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-warning-800">Service Mismatch</h4>
                <p className="text-sm text-warning-700 mt-1">
                  {showAdvisoryHint && 'You selected Investment Advisory services but have no advisory accounts. '}
                  {showBrokerageHint && 'You selected Brokerage services but have no brokerage accounts. '}
                  Consider adding the appropriate account types.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">Accounts Summary</h4>
          <pre className="text-sm text-primary-600 whitespace-pre-wrap font-sans">
            {getAccountsSummary()}
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
              <h4 className="text-sm font-medium text-secondary-800">Account Configuration Tips</h4>
              <ul className="text-sm text-secondary-700 mt-1 space-y-1">
                <li>• <strong>Discretionary authority</strong> means you can execute trades without prior client approval</li>
                <li>• <strong>Third-party custodians</strong> hold client assets independently from your firm</li>
                <li>• Accounts you <strong>monitor</strong> will be included in reporting requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}
