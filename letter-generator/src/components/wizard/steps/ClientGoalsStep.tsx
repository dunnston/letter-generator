import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { useTemplateStore } from '../../../store/templateStore';
import { Button, Input } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { ClientGoal } from '../../../types';

// Structure for tracking selected sub-topics per category
interface SelectedGoalCategory {
  categoryId: string;
  categoryName: string;
  planningLabel: string;
  selectedSubTopics: string[]; // Array of sub-topic labels
  customText?: string; // Optional custom additions
}

export function ClientGoalsStep() {
  const { data, updateGoals } = useWizardStore();
  const { settings } = useTemplateStore();
  const goals = data.goals || [];

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customGoalText, setCustomGoalText] = useState('');

  const goalTemplates = settings.goalTemplates || [];

  const generateId = () => `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Parse existing goals to determine selected sub-topics per category
  const getSelectedCategories = (): Map<string, SelectedGoalCategory> => {
    const categoryMap = new Map<string, SelectedGoalCategory>();

    goals.forEach((goal) => {
      // Find matching template category
      const template = goalTemplates.find(
        (t) => t.category.toLowerCase() === goal.category.toLowerCase()
      );

      if (template) {
        const existing = categoryMap.get(template.id);
        if (existing) {
          // Add to existing category's sub-topics
          if (!existing.selectedSubTopics.includes(goal.description)) {
            existing.selectedSubTopics.push(goal.description);
          }
        } else {
          categoryMap.set(template.id, {
            categoryId: template.id,
            categoryName: template.category,
            planningLabel: template.planningLabel,
            selectedSubTopics: [goal.description],
          });
        }
      }
    });

    return categoryMap;
  };

  const selectedCategories = getSelectedCategories();

  // Check if a sub-topic is selected for a category
  const isSubTopicSelected = (categoryId: string, subTopicLabel: string): boolean => {
    const category = selectedCategories.get(categoryId);
    return category?.selectedSubTopics.includes(subTopicLabel) || false;
  };

  // Check if a category has any selections
  const isCategorySelected = (categoryId: string): boolean => {
    return selectedCategories.has(categoryId);
  };

  // Get count of selected sub-topics for a category
  const getSelectedCount = (categoryId: string): number => {
    const category = selectedCategories.get(categoryId);
    return category?.selectedSubTopics.length || 0;
  };

  // Toggle a sub-topic selection
  const handleToggleSubTopic = (categoryId: string, subTopicLabel: string) => {
    const template = goalTemplates.find((t) => t.id === categoryId);
    if (!template) return;

    const isSelected = isSubTopicSelected(categoryId, subTopicLabel);
    let newGoals = [...goals];

    if (isSelected) {
      // Remove this sub-topic
      newGoals = newGoals.filter(
        (g) =>
          !(
            g.category.toLowerCase() === template.category.toLowerCase() &&
            g.description === subTopicLabel
          )
      );
    } else {
      // Add this sub-topic
      newGoals.push({
        id: generateId(),
        category: template.category,
        description: subTopicLabel,
        isCustom: false,
      });
    }

    updateGoals(newGoals);
  };

  // Toggle entire category (select/deselect all default sub-topics)
  const handleToggleCategory = (categoryId: string) => {
    const template = goalTemplates.find((t) => t.id === categoryId);
    if (!template) return;

    const isSelected = isCategorySelected(categoryId);
    let newGoals = [...goals];

    if (isSelected) {
      // Remove all sub-topics for this category
      newGoals = newGoals.filter(
        (g) => g.category.toLowerCase() !== template.category.toLowerCase()
      );
    } else {
      // Add all default sub-topics
      const defaultSubTopics = template.subTopics.filter((st) => st.isDefault);
      defaultSubTopics.forEach((st) => {
        if (!newGoals.some((g) => g.description === st.label)) {
          newGoals.push({
            id: generateId(),
            category: template.category,
            description: st.label,
            isCustom: false,
          });
        }
      });
    }

    updateGoals(newGoals);
  };

  // Add a fully custom goal (not tied to templates)
  const handleAddCustomGoal = () => {
    if (!customGoalText.trim()) return;

    const newGoal: ClientGoal = {
      id: generateId(),
      category: 'Custom',
      description: customGoalText.trim(),
      isCustom: true,
    };

    updateGoals([...goals, newGoal]);
    setCustomGoalText('');
  };

  // Remove a goal
  const handleRemoveGoal = (goalId: string) => {
    updateGoals(goals.filter((g) => g.id !== goalId));
  };

  // Get custom goals (not from templates)
  const customGoals = goals.filter((g) => g.isCustom || g.category === 'Custom');

  // Generate preview text for a category
  const generateCategoryPreview = (categoryId: string): string => {
    const template = goalTemplates.find((t) => t.id === categoryId);
    if (!template) return '';

    const category = selectedCategories.get(categoryId);
    if (!category || category.selectedSubTopics.length === 0) return '';

    const subTopicsText = category.selectedSubTopics.join(', ');
    return `${template.category} ${template.planningLabel}, including ${subTopicsText}.`;
  };

  // Generate full preview
  const generateFullPreview = (): string[] => {
    const previews: string[] = [];

    goalTemplates.forEach((template) => {
      const preview = generateCategoryPreview(template.id);
      if (preview) {
        previews.push(preview);
      }
    });

    // Add custom goals
    customGoals.forEach((goal) => {
      previews.push(goal.description);
    });

    return previews;
  };

  const previewLines = generateFullPreview();

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Category Selection */}
        <WizardStepSection
          title="Planning Areas"
          description="Select the planning areas and specific topics to include in the engagement letter."
        >
          <div className="space-y-2">
            {goalTemplates.map((template) => {
              const isSelected = isCategorySelected(template.id);
              const selectedCount = getSelectedCount(template.id);

              return (
                <div
                  key={template.id}
                  className="border border-primary-200 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-primary-50">
                    {/* Checkbox for entire category */}
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(template.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-secondary-600 bg-secondary-600'
                          : 'border-primary-300 hover:border-primary-400'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Category name and expand button */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === template.id ? null : template.id
                        )
                      }
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="font-medium text-primary-700">{template.category}</span>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-xs text-secondary-600 bg-secondary-100 px-2 py-0.5 rounded">
                            {selectedCount} selected
                          </span>
                        )}
                        <svg
                          className={`w-5 h-5 text-primary-400 transition-transform ${
                            expandedCategory === template.id ? 'rotate-180' : ''
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
                  </div>

                  {/* Expanded Sub-topics */}
                  {expandedCategory === template.id && (
                    <div className="divide-y divide-primary-100">
                      {template.subTopics.map((subTopic) => {
                        const isSubSelected = isSubTopicSelected(template.id, subTopic.label);
                        return (
                          <button
                            key={subTopic.id}
                            type="button"
                            onClick={() => handleToggleSubTopic(template.id, subTopic.label)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              isSubSelected ? 'bg-secondary-50' : 'hover:bg-primary-50'
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSubSelected
                                  ? 'border-secondary-600 bg-secondary-600'
                                  : 'border-primary-300'
                              }`}
                            >
                              {isSubSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                isSubSelected ? 'text-secondary-700' : 'text-primary-700'
                              }`}
                            >
                              {subTopic.label}
                            </span>
                            {subTopic.isDefault && (
                              <span className="text-xs text-primary-400">(default)</span>
                            )}
                          </button>
                        );
                      })}

                      {/* Category preview */}
                      {isSelected && (
                        <div className="px-4 py-3 bg-primary-50">
                          <p className="text-xs text-primary-500 mb-1">
                            Will appear in letter as:
                          </p>
                          <p className="text-sm text-primary-700 italic">
                            {generateCategoryPreview(template.id) || '[Select sub-topics above]'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </WizardStepSection>

        {/* Custom Goals */}
        <WizardStepSection
          title="Additional Goals"
          description="Add custom goals that don't fit the standard categories."
        >
          <div className="space-y-3">
            {/* Existing custom goals */}
            {customGoals.length > 0 && (
              <div className="space-y-2 mb-4">
                {customGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg"
                  >
                    <span className="flex-1 text-sm text-primary-700">{goal.description}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(goal.id)}
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
            )}

            {/* Add new custom goal */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={customGoalText}
                  onChange={(e) => setCustomGoalText(e.target.value)}
                  placeholder="Enter a custom goal..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGoal();
                    }
                  }}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleAddCustomGoal}
                disabled={!customGoalText.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-3">
            Goals Preview (as will appear in letter)
          </h4>
          {previewLines.length === 0 ? (
            <p className="text-sm text-primary-500 italic">[No goals selected]</p>
          ) : (
            <div className="space-y-2">
              {previewLines.map((line, index) => (
                <p key={index} className="text-sm text-primary-600">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5"
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
              <h4 className="text-sm font-medium text-accent-800">Customizing Goal Templates</h4>
              <p className="text-sm text-accent-700 mt-1">
                You can customize the available planning categories and sub-topics in Settings
                &gt; Goal Templates. This allows you to tailor the options to match your
                practice's common planning areas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStepContent>
  );
}
