import { useState, useEffect } from 'react';
import { useTemplateStore } from '../store/templateStore';
import { Button, Input, Toggle, Select } from './common';
import type { GoalCategoryTemplate, GoalSubTopic, EngagementTermination, PrivacyPolicyDelivery } from '../types';
import { DEFAULT_DISCLAIMER_TEXT } from '../types';
import { STANDARD_CONFLICTS } from '../templates/engagement/conflictTemplates';

const OUTPUT_FORMAT_OPTIONS = [
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'pdf', label: 'PDF Document (.pdf)' },
  { value: 'both', label: 'Both Formats' },
];

const TERMINATION_OPTIONS = [
  { value: 'ongoing_until_terminated', label: 'Ongoing until terminated by either party' },
  { value: 'fixed_term', label: 'Fixed term engagement' },
];

const PRIVACY_POLICY_OPTIONS = [
  { value: 'included', label: 'Included with this letter' },
  { value: 'enclosed', label: 'Enclosed with this letter' },
  { value: 'separate', label: 'Provided separately' },
  { value: 'previously_provided', label: 'Previously provided' },
  { value: 'link', label: 'Available at a link' },
];

export function Settings() {
  const {
    settings,
    updateSettings,
    updateDefaultAdvisor,
    updateDisclaimer,
    updateEngagementDefaults,
    updateGoalCategory,
    addGoalCategory,
    deleteGoalCategory,
    resetGoalTemplates,
  } = useTemplateStore();

  const [activeTab, setActiveTab] = useState<'advisor' | 'defaults' | 'documents' | 'output' | 'goals' | 'disclaimer'>(
    'advisor'
  );
  const [expandedGoalCategory, setExpandedGoalCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubTopicText, setNewSubTopicText] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Local form state for advisor
  const [advisorForm, setAdvisorForm] = useState({
    name: settings.defaultAdvisor.name || '',
    credentials: settings.defaultAdvisor.credentials || '',
    email: settings.defaultAdvisor.email || '',
    phone: settings.defaultAdvisor.phone || '',
    firmName: settings.defaultAdvisor.firmName || '',
  });

  // Update local state when settings change
  useEffect(() => {
    setAdvisorForm({
      name: settings.defaultAdvisor.name || '',
      credentials: settings.defaultAdvisor.credentials || '',
      email: settings.defaultAdvisor.email || '',
      phone: settings.defaultAdvisor.phone || '',
      firmName: settings.defaultAdvisor.firmName || '',
    });
  }, [settings.defaultAdvisor]);

  const handleAdvisorChange = (field: keyof typeof advisorForm, value: string) => {
    setAdvisorForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    updateDefaultAdvisor(advisorForm);
    setHasChanges(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Goal template handlers
  const handleAddSubTopic = (categoryId: string) => {
    const text = newSubTopicText[categoryId]?.trim();
    if (!text) return;

    const category = settings.goalTemplates.find((c) => c.id === categoryId);
    if (!category) return;

    const newSubTopic: GoalSubTopic = {
      id: `subtopic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: text,
      isDefault: false,
    };

    updateGoalCategory(categoryId, {
      subTopics: [...category.subTopics, newSubTopic],
    });

    setNewSubTopicText((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveSubTopic = (categoryId: string, subTopicId: string) => {
    const category = settings.goalTemplates.find((c) => c.id === categoryId);
    if (!category) return;

    updateGoalCategory(categoryId, {
      subTopics: category.subTopics.filter((st) => st.id !== subTopicId),
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: GoalCategoryTemplate = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: newCategoryName.trim(),
      planningLabel: 'planning',
      subTopics: [],
      isDefault: false,
    };

    addGoalCategory(newCategory);
    setNewCategoryName('');
    setExpandedGoalCategory(newCategory.id);
  };

  const handleUpdateCategoryName = (categoryId: string, newName: string) => {
    updateGoalCategory(categoryId, { category: newName });
  };

  const handleUpdatePlanningLabel = (categoryId: string, newLabel: string) => {
    updateGoalCategory(categoryId, { planningLabel: newLabel });
  };

  const tabs = [
    { id: 'advisor' as const, label: 'Advisor Info' },
    { id: 'defaults' as const, label: 'Wizard Defaults' },
    { id: 'goals' as const, label: 'Goal Templates' },
    { id: 'documents' as const, label: 'Document Defaults' },
    { id: 'output' as const, label: 'Output Settings' },
    { id: 'disclaimer' as const, label: 'Disclaimer' },
  ];

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-800">Settings</h1>
          <p className="text-primary-600 mt-1">Configure defaults and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-primary-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-primary-500 hover:text-primary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
          {activeTab === 'advisor' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">
                  Default Advisor Information
                </h3>
                <p className="text-sm text-primary-500 mb-6">
                  These values will be pre-filled when creating new engagement letters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Advisor Name"
                  value={advisorForm.name}
                  onChange={(e) => handleAdvisorChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
                <Input
                  label="Credentials"
                  value={advisorForm.credentials}
                  onChange={(e) => handleAdvisorChange('credentials', e.target.value)}
                  placeholder="e.g., CFP, ChFC, CLU"
                />
                <Input
                  label="Email"
                  type="email"
                  value={advisorForm.email}
                  onChange={(e) => handleAdvisorChange('email', e.target.value)}
                  placeholder="advisor@example.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={advisorForm.phone}
                  onChange={(e) => handleAdvisorChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
                <Input
                  label="Firm Name"
                  value={advisorForm.firmName}
                  onChange={(e) => handleAdvisorChange('firmName', e.target.value)}
                  placeholder="Your firm name"
                  className="md:col-span-2"
                />
              </div>
            </div>
          )}

          {activeTab === 'defaults' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">
                  Wizard Defaults
                </h3>
                <p className="text-sm text-primary-500 mb-6">
                  Pre-select options that are commonly used when creating engagement letters.
                  These defaults will be applied when starting a new letter.
                </p>
              </div>

              {/* Professional Disclosure Toggles */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-2">
                  Professional Disclosures
                </h4>
                <Toggle
                  label="RIA Fiduciary Disclosure"
                  description="Include RIA fiduciary standard language by default"
                  checked={settings.engagementDefaults?.includeRIADisclosure ?? false}
                  onChange={(e) => updateEngagementDefaults({ includeRIADisclosure: e.target.checked })}
                />
                <Toggle
                  label="CFP® Fiduciary Disclosure"
                  description="Include CFP Board fiduciary language by default"
                  checked={settings.engagementDefaults?.includeCFPDisclosure ?? false}
                  onChange={(e) => updateEngagementDefaults({ includeCFPDisclosure: e.target.checked })}
                />
                <Toggle
                  label="ChFC® Professional Disclosure"
                  description="Include ChFC professional language by default"
                  checked={settings.engagementDefaults?.includeChFCDisclosure ?? false}
                  onChange={(e) => updateEngagementDefaults({ includeChFCDisclosure: e.target.checked })}
                />
              </div>

              {/* Primary Compensation Sources */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-2">
                  Primary Compensation Sources
                </h4>
                <Toggle
                  label="Financial Planning Fees"
                  description="Compensation from financial planning fees paid by client"
                  checked={settings.engagementDefaults?.paidFromPlanningFees ?? true}
                  onChange={(e) => updateEngagementDefaults({ paidFromPlanningFees: e.target.checked })}
                />
                <Toggle
                  label="Investment Advisory Fees"
                  description="Compensation from asset-based advisory fees"
                  checked={settings.engagementDefaults?.paidFromAdvisoryFees ?? false}
                  onChange={(e) => updateEngagementDefaults({ paidFromAdvisoryFees: e.target.checked })}
                />
                <Toggle
                  label="Brokerage Commissions"
                  description="Commissions on securities transactions"
                  checked={settings.engagementDefaults?.paidFromCommissions ?? false}
                  onChange={(e) => updateEngagementDefaults({ paidFromCommissions: e.target.checked })}
                />
                <Toggle
                  label="Insurance Commissions"
                  description="Commissions on insurance products sold"
                  checked={settings.engagementDefaults?.paidFromInsuranceCommissions ?? false}
                  onChange={(e) => updateEngagementDefaults({ paidFromInsuranceCommissions: e.target.checked })}
                />
              </div>

              {/* Default Conflicts */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-2">
                  Default Conflicts to Include
                </h4>
                <p className="text-xs text-primary-500 mb-2">
                  Select conflicts that should be automatically added when creating a new engagement letter.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-primary-200 rounded-lg p-3">
                  {STANDARD_CONFLICTS.map((conflict) => (
                    <label
                      key={conflict.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-primary-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.engagementDefaults?.defaultConflictIds?.includes(conflict.id) ?? false}
                        onChange={(e) => {
                          const currentIds = settings.engagementDefaults?.defaultConflictIds ?? [];
                          if (e.target.checked) {
                            updateEngagementDefaults({
                              defaultConflictIds: [...currentIds, conflict.id],
                            });
                          } else {
                            updateEngagementDefaults({
                              defaultConflictIds: currentIds.filter((id) => id !== conflict.id),
                            });
                          }
                        }}
                        className="mt-1 h-4 w-4 rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-primary-800">{conflict.title}</span>
                        <p className="text-xs text-primary-500">{conflict.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <Toggle
                  label="Include Mitigation Strategies"
                  description="Add mitigation language after listing conflicts"
                  checked={settings.engagementDefaults?.includeMitigations ?? true}
                  onChange={(e) => updateEngagementDefaults({ includeMitigations: e.target.checked })}
                />
              </div>

              {/* Engagement & Termination */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-2">
                  Engagement & Additional Sections
                </h4>
                <Select
                  label="Default Engagement Termination"
                  options={TERMINATION_OPTIONS}
                  value={settings.engagementDefaults?.engagementTermination ?? 'fixed_term'}
                  onChange={(e) =>
                    updateEngagementDefaults({
                      engagementTermination: e.target.value as EngagementTermination,
                    })
                  }
                />
                <Toggle
                  label="Always Add Standard Responsibilities"
                  description="Pre-populate the 6 standard client responsibilities when starting a new letter"
                  checked={settings.engagementDefaults?.includeClientResponsibilities ?? true}
                  onChange={(e) => updateEngagementDefaults({ includeClientResponsibilities: e.target.checked })}
                />
                <Toggle
                  label="Include Clean Record Statement"
                  description="Add statement about no material disciplinary events"
                  checked={settings.engagementDefaults?.includeCleanRecord ?? true}
                  onChange={(e) => updateEngagementDefaults({ includeCleanRecord: e.target.checked })}
                />
              </div>

              {/* Privacy Policy */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary-700 border-b border-primary-200 pb-2">
                  Privacy Policy
                </h4>
                <Select
                  label="Default Privacy Policy Delivery"
                  options={PRIVACY_POLICY_OPTIONS}
                  value={settings.engagementDefaults?.defaultPrivacyPolicyDelivery ?? 'included'}
                  onChange={(e) =>
                    updateEngagementDefaults({
                      defaultPrivacyPolicyDelivery: e.target.value as PrivacyPolicyDelivery,
                    })
                  }
                />
                {settings.engagementDefaults?.defaultPrivacyPolicyDelivery === 'link' && (
                  <Input
                    label="Privacy Policy URL"
                    type="url"
                    value={settings.engagementDefaults?.defaultPrivacyPolicyLink ?? ''}
                    onChange={(e) => updateEngagementDefaults({ defaultPrivacyPolicyLink: e.target.value })}
                    placeholder="https://yourfirm.com/privacy-policy"
                  />
                )}
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
                    <h4 className="text-sm font-medium text-secondary-800">About Wizard Defaults</h4>
                    <p className="text-sm text-secondary-700 mt-1">
                      These defaults will be applied when you start a new engagement letter or reset the wizard.
                      You can always change them during the wizard process for each individual letter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">
                  Default Document Selection
                </h3>
                <p className="text-sm text-primary-500 mb-6">
                  Select which documents are included by default in new engagement letters.
                </p>
              </div>

              <div className="space-y-3">
                <Toggle
                  label="Form CRS (Client Relationship Summary)"
                  description="Required for new and prospective clients"
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
                <Toggle
                  label="Form ADV Part 2A (Brochure)"
                  description="Investment advisory disclosure document"
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
                <Toggle
                  label="Regulation Best Interest Disclosure"
                  description="Required for brokerage services"
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
                <Toggle
                  label="Brokerage Account Agreement"
                  description="For brokerage account opening"
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
                <Toggle
                  label="Investment Advisory Agreement"
                  description="Advisory services agreement"
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
              </div>

              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">
                  <strong>Note:</strong> Document defaults can be configured per-letter in the
                  wizard. This feature will be fully configurable in a future update.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Output Preferences</h3>
                <p className="text-sm text-primary-500 mb-6">
                  Configure how generated documents are saved.
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  label="Default Output Format"
                  value={settings.defaultOutputFormat}
                  onChange={(e) =>
                    updateSettings({
                      defaultOutputFormat: e.target.value as 'docx' | 'pdf' | 'both',
                    })
                  }
                  options={OUTPUT_FORMAT_OPTIONS}
                />

                <Input
                  label="File Naming Pattern"
                  value={settings.defaultFileNamingPattern}
                  onChange={(e) => updateSettings({ defaultFileNamingPattern: e.target.value })}
                  hint="Available: {lastName}, {firstName}, {date}, {letterType}"
                />

                <Toggle
                  label="Auto-save wizard progress"
                  description="Automatically save your progress as you work through the wizard"
                  checked={settings.autoSaveEnabled}
                  onChange={(e) => updateSettings({ autoSaveEnabled: e.target.checked })}
                />

                <Toggle
                  label="Show preview pane"
                  description="Display letter preview alongside the wizard"
                  checked={settings.showPreviewPane}
                  onChange={(e) => updateSettings({ showPreviewPane: e.target.checked })}
                />
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">
                  Goal Category Templates
                </h3>
                <p className="text-sm text-primary-500 mb-6">
                  Customize the goal categories and sub-topics available in the wizard. Goals will
                  appear in the letter as: "[Category] planning, including [selected sub-topics]."
                </p>
              </div>

              {/* Goal Categories */}
              <div className="space-y-2">
                {settings.goalTemplates.map((category) => (
                  <div
                    key={category.id}
                    className="border border-primary-200 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGoalCategory(
                          expandedGoalCategory === category.id ? null : category.id
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary-700">{category.category}</span>
                        {category.isDefault && (
                          <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary-500">
                          {category.subTopics.length} sub-topics
                        </span>
                        <svg
                          className={`w-5 h-5 text-primary-400 transition-transform ${
                            expandedGoalCategory === category.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {expandedGoalCategory === category.id && (
                      <div className="p-4 space-y-4 bg-white">
                        {/* Category Name Edit */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Category Name"
                            value={category.category}
                            onChange={(e) =>
                              handleUpdateCategoryName(category.id, e.target.value)
                            }
                            placeholder="e.g., Cash flow"
                          />
                          <Input
                            label="Planning Label"
                            value={category.planningLabel}
                            onChange={(e) =>
                              handleUpdatePlanningLabel(category.id, e.target.value)
                            }
                            placeholder="e.g., planning"
                            hint="Text that follows the category name"
                          />
                        </div>

                        {/* Sub-topics */}
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-2">
                            Sub-topics (selectable in wizard)
                          </label>
                          <div className="space-y-2">
                            {category.subTopics.map((subTopic) => (
                              <div
                                key={subTopic.id}
                                className="flex items-center gap-2 p-2 bg-primary-50 rounded"
                              >
                                <span className="flex-1 text-sm text-primary-700">
                                  {subTopic.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSubTopic(category.id, subTopic.id)
                                  }
                                  className="p-1 text-primary-400 hover:text-error-500"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add new sub-topic */}
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1">
                              <Input
                                value={newSubTopicText[category.id] || ''}
                                onChange={(e) =>
                                  setNewSubTopicText((prev) => ({
                                    ...prev,
                                    [category.id]: e.target.value,
                                  }))
                                }
                                placeholder="Add a new sub-topic..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSubTopic(category.id);
                                  }
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddSubTopic(category.id)}
                              disabled={!newSubTopicText[category.id]?.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Delete category button */}
                        {!category.isDefault && (
                          <div className="pt-3 border-t border-primary-100">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete the "${category.category}" category?`
                                  )
                                ) {
                                  deleteGoalCategory(category.id);
                                  setExpandedGoalCategory(null);
                                }
                              }}
                              className="text-error-600 hover:bg-error-50"
                            >
                              Delete Category
                            </Button>
                          </div>
                        )}

                        {/* Preview */}
                        <div className="pt-3 border-t border-primary-100">
                          <p className="text-xs text-primary-500 mb-1">Preview in letter:</p>
                          <p className="text-sm text-primary-700 italic">
                            {category.category} {category.planningLabel}
                            {category.subTopics.length > 0 &&
                              `, including ${category.subTopics.map((st) => st.label).join(', ')}.`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new category */}
              <div className="pt-4 border-t border-primary-200">
                <h4 className="text-sm font-medium text-primary-700 mb-3">Add New Category</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    Add Category
                  </Button>
                </div>
              </div>

              {/* Reset to defaults */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Reset all goal templates to defaults? This will remove any custom categories.'
                      )
                    ) {
                      resetGoalTemplates();
                    }
                  }}
                  className="text-sm text-secondary-600 hover:text-secondary-700"
                >
                  Reset to default templates
                </button>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">
                  Letter Disclaimer
                </h3>
                <p className="text-sm text-primary-500 mb-6">
                  Configure an optional disclaimer that will appear at the bottom of all engagement letters, after the signature block.
                </p>
              </div>

              <div className="space-y-4">
                <Toggle
                  label="Include disclaimer in letters"
                  description="When enabled, the disclaimer text below will be added to the end of all generated letters"
                  checked={settings.disclaimer?.includeDisclaimer ?? false}
                  onChange={(e) => updateDisclaimer({ includeDisclaimer: e.target.checked })}
                />

                <div className={settings.disclaimer?.includeDisclaimer ? '' : 'opacity-50'}>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Disclaimer Text
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-y min-h-[120px] text-sm"
                    value={settings.disclaimer?.disclaimerText ?? DEFAULT_DISCLAIMER_TEXT}
                    onChange={(e) => updateDisclaimer({ disclaimerText: e.target.value })}
                    placeholder="Enter disclaimer text..."
                    disabled={!settings.disclaimer?.includeDisclaimer}
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    This text will appear in a smaller font at the bottom of the letter.
                  </p>
                </div>

                <div className="pt-4 border-t border-primary-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Reset disclaimer to default text?'
                        )
                      ) {
                        updateDisclaimer({ disclaimerText: DEFAULT_DISCLAIMER_TEXT });
                      }
                    }}
                    className="text-sm text-secondary-600 hover:text-secondary-700"
                    disabled={!settings.disclaimer?.includeDisclaimer}
                  >
                    Reset to default text
                  </button>
                </div>

                {settings.disclaimer?.includeDisclaimer && (
                  <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                    <p className="text-xs text-primary-500 mb-2 font-medium">Preview:</p>
                    <p className="text-xs text-primary-600 italic">
                      {settings.disclaimer?.disclaimerText || DEFAULT_DISCLAIMER_TEXT}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save button for advisor tab */}
        {activeTab === 'advisor' && (
          <div className="mt-6 flex items-center justify-between">
            <div>
              {saveMessage && <span className="text-accent-600 text-sm">{saveMessage}</span>}
            </div>
            <Button onClick={handleSaveSettings} disabled={!hasChanges}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
