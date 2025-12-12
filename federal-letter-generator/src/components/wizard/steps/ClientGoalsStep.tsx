import { useState } from 'react';
import { useWizardStore } from '../../../store/wizardStore';
import { Button, Input, Select } from '../../common';
import { WizardStepContent, WizardStepSection } from '../WizardContainer';
import type { ClientGoal, GoalCategory } from '../../../types';

// Pre-defined goal templates organized by category
const GOAL_TEMPLATES: Array<{ category: GoalCategory; goals: string[] }> = [
  {
    category: 'Cash Flow',
    goals: [
      'Establish an emergency fund of 3-6 months of expenses',
      'Create a household budget and track spending',
      'Optimize cash flow management',
      'Reduce monthly expenses',
      'Build savings for major purchases',
    ],
  },
  {
    category: 'Investment',
    goals: [
      'Develop an investment policy statement',
      'Review and optimize current investment allocation',
      'Consolidate investment accounts for better management',
      'Establish regular investment contributions',
      'Evaluate tax-efficient investment strategies',
    ],
  },
  {
    category: 'Retirement',
    goals: [
      'Determine retirement income needs',
      'Maximize retirement plan contributions',
      'Evaluate Social Security claiming strategies',
      'Plan for healthcare costs in retirement',
      'Create a retirement income distribution strategy',
    ],
  },
  {
    category: 'Estate Planning',
    goals: [
      'Review and update estate planning documents',
      'Evaluate beneficiary designations',
      'Consider trust planning strategies',
      'Plan for incapacity with powers of attorney',
      'Minimize estate taxes where applicable',
    ],
  },
  {
    category: 'Risk Management',
    goals: [
      'Review life insurance coverage adequacy',
      'Evaluate disability income protection',
      'Consider long-term care insurance options',
      'Review property and casualty coverage',
      'Assess umbrella liability needs',
    ],
  },
  {
    category: 'Tax',
    goals: [
      'Optimize tax bracket management',
      'Evaluate Roth conversion opportunities',
      'Maximize tax-advantaged account contributions',
      'Review charitable giving strategies',
      'Plan for capital gains and losses',
    ],
  },
  {
    category: 'Education',
    goals: [
      'Fund college savings for children',
      'Evaluate 529 plan options',
      'Consider education funding alternatives',
      'Review financial aid strategies',
      'Plan for private school costs',
    ],
  },
  {
    category: 'Special Situations',
    goals: [
      'Plan for upcoming major life transition',
      'Navigate inheritance or windfall',
      'Plan for business succession',
      'Address divorce financial planning',
      'Coordinate care for aging parents',
    ],
  },
];

const CATEGORIES: GoalCategory[] = [
  'Cash Flow',
  'Investment',
  'Retirement',
  'Estate Planning',
  'Risk Management',
  'Tax',
  'Education',
  'Special Situations',
];

export function ClientGoalsStep() {
  const { data, addGoal, removeGoal, updateGoals } = useWizardStore();
  const goals = data.goals || [];
  const [expandedCategory, setExpandedCategory] = useState<GoalCategory | null>(null);
  const [customGoalText, setCustomGoalText] = useState('');
  const [customGoalCategory, setCustomGoalCategory] = useState<GoalCategory>('Cash Flow');

  const generateId = () => `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSelectTemplateGoal = (category: GoalCategory, description: string) => {
    // Check if goal already exists
    if (goals.some((g) => g.description === description)) {
      return;
    }

    const newGoal: ClientGoal = {
      id: generateId(),
      category,
      description,
      isCustom: false,
    };
    addGoal(newGoal);
  };

  const handleAddCustomGoal = () => {
    if (!customGoalText.trim()) return;

    const newGoal: ClientGoal = {
      id: generateId(),
      category: customGoalCategory,
      description: customGoalText.trim(),
      isCustom: true,
    };
    addGoal(newGoal);
    setCustomGoalText('');
  };

  const handleRemoveGoal = (goalId: string) => {
    removeGoal(goalId);
  };

  const handleMoveGoal = (index: number, direction: 'up' | 'down') => {
    const newGoals = [...goals];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newGoals.length) return;

    [newGoals[index], newGoals[targetIndex]] = [newGoals[targetIndex], newGoals[index]];
    updateGoals(newGoals);
  };

  const isGoalSelected = (description: string) => {
    return goals.some((g) => g.description === description);
  };

  const getCategoryCount = (category: GoalCategory) => {
    return goals.filter((g) => g.category === category).length;
  };

  return (
    <WizardStepContent>
      <div className="space-y-8">
        {/* Selected Goals */}
        <WizardStepSection
          title="Selected Goals"
          description="These goals will appear in the engagement letter. Drag to reorder."
        >
          {goals.length === 0 ? (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 mx-auto text-primary-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm text-primary-500">
                No goals selected yet. Choose from the templates below or add custom goals.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 bg-white border border-primary-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveGoal(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 text-primary-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveGoal(index, 'down')}
                      disabled={index === goals.length - 1}
                      className="p-0.5 text-primary-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Goal content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded">
                        {goal.category}
                      </span>
                      {goal.isCustom && (
                        <span className="text-xs text-primary-400">(Custom)</span>
                      )}
                    </div>
                    <p className="text-sm text-primary-700">{goal.description}</p>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="p-1 text-primary-400 hover:text-error-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </WizardStepSection>

        {/* Goal Templates */}
        <WizardStepSection
          title="Goal Templates"
          description="Click to expand a category and select pre-written goals."
        >
          <div className="space-y-2">
            {GOAL_TEMPLATES.map((template) => (
              <div
                key={template.category}
                className="border border-primary-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === template.category ? null : template.category
                    )
                  }
                  className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <span className="font-medium text-primary-700">{template.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary-500">
                      {getCategoryCount(template.category)} selected
                    </span>
                    <svg
                      className={`w-5 h-5 text-primary-400 transition-transform ${
                        expandedCategory === template.category ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedCategory === template.category && (
                  <div className="divide-y divide-primary-100">
                    {template.goals.map((goalDesc) => {
                      const selected = isGoalSelected(goalDesc);
                      return (
                        <button
                          key={goalDesc}
                          type="button"
                          onClick={() => handleSelectTemplateGoal(template.category, goalDesc)}
                          disabled={selected}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                            selected
                              ? 'bg-secondary-50 cursor-default'
                              : 'hover:bg-primary-50'
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selected
                                ? 'border-secondary-600 bg-secondary-600'
                                : 'border-primary-300'
                            }`}
                          >
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${selected ? 'text-secondary-700' : 'text-primary-700'}`}>
                            {goalDesc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </WizardStepSection>

        {/* Custom Goal Input */}
        <WizardStepSection
          title="Add Custom Goal"
          description="Create a custom goal specific to this client."
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-48">
                <Select
                  label="Category"
                  value={customGoalCategory}
                  onChange={(e) => setCustomGoalCategory(e.target.value as GoalCategory)}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Goal Description"
                  value={customGoalText}
                  onChange={(e) => setCustomGoalText(e.target.value)}
                  placeholder="Enter a custom goal for this client..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGoal();
                    }
                  }}
                />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddCustomGoal}
              disabled={!customGoalText.trim()}
            >
              Add Custom Goal
            </Button>
          </div>
        </WizardStepSection>

        {/* Preview */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-medium text-primary-700 mb-2">
            Goals Preview (as will appear in letter)
          </h4>
          {goals.length === 0 ? (
            <p className="text-sm text-primary-500 italic">[No goals selected]</p>
          ) : (
            <ul className="text-sm text-primary-600 space-y-1">
              {goals.map((goal) => (
                <li key={goal.id} className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  <span>{goal.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WizardStepContent>
  );
}
