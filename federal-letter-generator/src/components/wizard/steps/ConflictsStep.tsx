import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button, TextArea } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import {
  STANDARD_CONFLICTS,
  CONFLICT_CATEGORIES,
  createConflictFromTemplate,
  createCustomConflict,
  type ConflictTemplate,
} from '../../../templates/engagement/conflictTemplates';
import type { ConflictOfInterest } from '../../../types';

interface ConflictCardProps {
  conflict: ConflictOfInterest;
  onUpdate: (description: string) => void;
  onRemove: () => void;
  templateTitle?: string;
}

function ConflictCard({ conflict, onUpdate, onRemove, templateTitle }: ConflictCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(conflict.description);

  const handleSave = () => {
    onUpdate(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(conflict.description);
    setIsEditing(false);
  };

  return (
    <div className="border border-primary-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary-50">
        <div className="flex items-center gap-2">
          {conflict.isStandard ? (
            <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded">
              Standard
            </span>
          ) : (
            <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded">
              Custom
            </span>
          )}
          {templateTitle && (
            <span className="text-sm font-medium text-primary-800">{templateTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <TextArea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-primary-700">{conflict.description}</p>
        )}
      </div>
    </div>
  );
}

export function ConflictsStep() {
  const { data, updateConflicts, addConflict, removeConflict } = useWizardStore();
  const conflicts = data.conflicts || [];
  const compensation = data.compensation;
  const services = data.services;
  const fees = data.fees;

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customConflictText, setCustomConflictText] = useState('');

  // Get relevant conflict templates based on selections
  const getRelevantConflicts = (): ConflictTemplate[] => {
    const relevant: ConflictTemplate[] = [];

    // Always suggest future conflicts
    relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'future_conflicts')!);

    // AUM conflict if advisory fees selected
    if (services?.investmentAdvisory && fees?.advisoryFee) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'aum_conflict')!);
    }

    // Commission conflict if commissions selected
    if (compensation?.paidFromCommissions) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'commission_conflict')!);
    }

    // Dual registration if both advisory and brokerage
    if (services?.investmentAdvisory && services?.brokerageServices) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'dual_registration')!);
    }

    // Insurance if risk management selected
    if (services?.riskManagement && compensation?.paidFromInsuranceCommissions) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'insurance_license')!);
    }

    // Revenue sharing if selected
    if (compensation?.revenueSharing) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'revenue_sharing')!);
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'third_party_payments')!);
    }

    // Referral if selected
    if (compensation?.referralFees) {
      relevant.push(STANDARD_CONFLICTS.find((c) => c.id === 'referral_arrangements')!);
    }

    return relevant.filter(Boolean);
  };

  const relevantConflicts = getRelevantConflicts();

  const handleAddFromTemplate = (template: ConflictTemplate) => {
    // Check if this template is already added
    const alreadyAdded = conflicts.some(
      (c) => c.isStandard && c.description === template.defaultText
    );
    if (alreadyAdded) return;

    addConflict(createConflictFromTemplate(template));
  };

  const handleAddCustom = () => {
    if (!customConflictText.trim()) return;
    addConflict(createCustomConflict(customConflictText.trim()));
    setCustomConflictText('');
  };

  const handleUpdateConflict = (conflictId: string, description: string) => {
    const updatedConflicts = conflicts.map((c) =>
      c.id === conflictId ? { ...c, description } : c
    );
    updateConflicts(updatedConflicts);
  };

  const getTemplateTitle = (conflict: ConflictOfInterest): string | undefined => {
    if (!conflict.isStandard) return undefined;
    const template = STANDARD_CONFLICTS.find((t) => t.defaultText === conflict.description);
    return template?.title;
  };

  const isTemplateAdded = (templateId: string): boolean => {
    const template = STANDARD_CONFLICTS.find((t) => t.id === templateId);
    if (!template) return false;
    return conflicts.some((c) => c.description === template.defaultText);
  };

  // Group templates by category for the picker
  const templatesByCategory = CONFLICT_CATEGORIES.reduce(
    (acc, category) => {
      const categoryTemplates = STANDARD_CONFLICTS.filter((t) => t.category === category);
      if (categoryTemplates.length > 0) {
        acc[category] = categoryTemplates;
      }
      return acc;
    },
    {} as Record<string, ConflictTemplate[]>
  );

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Suggested Conflicts */}
        {relevantConflicts.length > 0 && (
          <WizardStepSection
            title="Suggested Conflicts"
            description="Based on your selections, these conflicts may apply to your engagement."
          >
            <div className="space-y-3">
              {relevantConflicts.map((template) => (
                <div
                  key={template.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    isTemplateAdded(template.id)
                      ? 'border-accent-200 bg-accent-50'
                      : 'border-primary-200 bg-white hover:bg-primary-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary-800">{template.title}</span>
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-primary-600">{template.description}</p>
                  </div>
                  <Button
                    variant={isTemplateAdded(template.id) ? 'accent' : 'primary'}
                    size="sm"
                    onClick={() => handleAddFromTemplate(template)}
                    disabled={isTemplateAdded(template.id)}
                  >
                    {isTemplateAdded(template.id) ? 'Added' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </WizardStepSection>
        )}

        {/* All Conflict Templates */}
        <WizardStepSection
          title="All Conflict Templates"
          description="Browse all available conflict templates by category."
        >
          <div className="space-y-2">
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} className="border border-primary-200 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors"
                  onClick={() =>
                    setExpandedCategory(expandedCategory === category ? null : category)
                  }
                >
                  <span className="text-sm font-medium text-primary-800">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary-500">{templates.length} templates</span>
                    <svg
                      className={`w-5 h-5 text-primary-500 transition-transform ${
                        expandedCategory === category ? 'rotate-180' : ''
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
                {expandedCategory === category && (
                  <div className="p-4 space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start gap-3 p-3 rounded border border-primary-100 bg-white"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-primary-800">{template.title}</span>
                          <p className="text-xs text-primary-500 mt-0.5">{template.description}</p>
                        </div>
                        <Button
                          variant={isTemplateAdded(template.id) ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleAddFromTemplate(template)}
                          disabled={isTemplateAdded(template.id)}
                        >
                          {isTemplateAdded(template.id) ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </WizardStepSection>

        {/* Custom Conflict */}
        <WizardStepSection
          title="Add Custom Conflict"
          description="Describe any additional conflicts specific to your situation."
        >
          <div className="space-y-3">
            <TextArea
              value={customConflictText}
              onChange={(e) => setCustomConflictText(e.target.value)}
              placeholder="Describe a conflict of interest that is not covered by the standard templates..."
              rows={3}
            />
            <Button onClick={handleAddCustom} disabled={!customConflictText.trim()}>
              Add Custom Conflict
            </Button>
          </div>
        </WizardStepSection>

        {/* Selected Conflicts */}
        <WizardStepSection
          title={`Conflicts to Disclose (${conflicts.length})`}
          description="These conflicts will be included in the engagement letter."
        >
          {conflicts.length === 0 ? (
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-primary-800">No conflicts added</h3>
              <p className="mt-1 text-sm text-primary-500">
                Add conflicts from the templates above or create custom ones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  templateTitle={getTemplateTitle(conflict)}
                  onUpdate={(desc) => handleUpdateConflict(conflict.id, desc)}
                  onRemove={() => removeConflict(conflict.id)}
                />
              ))}
            </div>
          )}
        </WizardStepSection>

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
              <h4 className="text-sm font-medium text-secondary-800">Conflict Disclosure Requirements</h4>
              <p className="text-sm text-secondary-700 mt-1">
                Material conflicts of interest must be disclosed under SEC regulations, FINRA rules,
                and CFP Board standards. Err on the side of disclosure—if something could influence
                your recommendations, it should be disclosed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}
