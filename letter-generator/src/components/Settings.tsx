import { useState, useEffect } from 'react';
import { useTemplateStore } from '../store/templateStore';
import { Button, Input, Toggle, Select } from './common';
import type { GoalCategoryTemplate, GoalSubTopic } from '../types';

const OUTPUT_FORMAT_OPTIONS = [
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'pdf', label: 'PDF Document (.pdf)' },
  { value: 'both', label: 'Both Formats' },
];

export function Settings() {
  const {
    settings,
    updateSettings,
    updateDefaultAdvisor,
    templates,
    deleteTemplate,
    updateGoalCategory,
    addGoalCategory,
    deleteGoalCategory,
    resetGoalTemplates,
  } = useTemplateStore();

  const [activeTab, setActiveTab] = useState<'advisor' | 'documents' | 'output' | 'templates' | 'goals'>(
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

  const handleDeleteTemplate = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the template "${name}"?`)) {
      deleteTemplate(id);
    }
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
    { id: 'goals' as const, label: 'Goal Templates' },
    { id: 'documents' as const, label: 'Document Defaults' },
    { id: 'output' as const, label: 'Output Settings' },
    { id: 'templates' as const, label: 'Saved Templates' },
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

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Saved Templates</h3>
                <p className="text-sm text-primary-500 mb-6">
                  Manage your saved letter templates.
                </p>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 bg-primary-50 rounded-lg">
                  <svg
                    className="w-12 h-12 mx-auto text-primary-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-primary-600 font-medium">No saved templates yet</p>
                  <p className="text-sm text-primary-500 mt-1">
                    Templates you save from the wizard will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary-800">{template.name}</span>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                              Default
                            </span>
                          )}
                          {template.isFavorite && (
                            <svg
                              className="w-4 h-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-primary-500 mt-1">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary">
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          className="text-error-600 hover:bg-error-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
