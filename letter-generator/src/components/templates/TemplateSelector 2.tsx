import { useState } from 'react';
import { Button } from '../common';

interface Template {
  id: string;
  category: string;
  title?: string;
  description: string;
}

interface TemplateSelectorProps<T extends Template> {
  templates: T[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onReorder?: (ids: string[]) => void;
  allowCustom?: boolean;
  onAddCustom?: (description: string) => void;
  customPlaceholder?: string;
  groupByCategory?: boolean;
  maxSelections?: number;
}

export function TemplateSelector<T extends Template>({
  templates,
  selectedIds,
  onSelect,
  onDeselect,
  onReorder: _onReorder, // TODO: Implement drag-and-drop reordering
  allowCustom = false,
  onAddCustom,
  customPlaceholder = 'Enter custom item...',
  groupByCategory = true,
  maxSelections,
}: TemplateSelectorProps<T>) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState('');

  // Group templates by category
  const categorizedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, T[]>);

  const categories = Object.keys(categorizedTemplates).sort();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onDeselect(id);
    } else {
      if (maxSelections && selectedIds.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onSelect(id);
    }
  };

  const handleAddCustom = () => {
    if (customInput.trim() && onAddCustom) {
      onAddCustom(customInput.trim());
      setCustomInput('');
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);
  const canSelectMore = !maxSelections || selectedIds.length < maxSelections;

  return (
    <div className="space-y-4">
      {/* Selected items summary */}
      {selectedIds.length > 0 && (
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
          <div className="text-sm font-medium text-secondary-700 mb-2">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
            {maxSelections && ` (max ${maxSelections})`}
          </div>
        </div>
      )}

      {/* Category accordion */}
      {groupByCategory ? (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category}
              className="border border-primary-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <span className="font-medium text-primary-700">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-500">
                    {categorizedTemplates[category].filter((t) => isSelected(t.id)).length} / {categorizedTemplates[category].length}
                  </span>
                  <svg
                    className={`w-5 h-5 text-primary-400 transition-transform ${
                      expandedCategories.has(category) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedCategories.has(category) && (
                <div className="divide-y divide-primary-100">
                  {categorizedTemplates[category].map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={isSelected(template.id)}
                      onToggle={() => handleToggle(template.id)}
                      disabled={!canSelectMore && !isSelected(template.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-primary-200 rounded-lg divide-y divide-primary-100">
          {templates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={isSelected(template.id)}
              onToggle={() => handleToggle(template.id)}
              disabled={!canSelectMore && !isSelected(template.id)}
            />
          ))}
        </div>
      )}

      {/* Custom input */}
      {allowCustom && onAddCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={customPlaceholder}
            className="flex-1 px-3 py-2 border border-primary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddCustom}
            disabled={!customInput.trim() || !canSelectMore}
          >
            Add Custom
          </Button>
        </div>
      )}
    </div>
  );
}

interface TemplateItemProps<T extends Template> {
  template: T;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function TemplateItem<T extends Template>({
  template,
  isSelected,
  onToggle,
  disabled = false,
}: TemplateItemProps<T>) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        w-full px-4 py-3 text-left flex items-start gap-3
        transition-colors
        ${isSelected
          ? 'bg-secondary-50'
          : disabled
          ? 'bg-primary-50 opacity-50 cursor-not-allowed'
          : 'hover:bg-primary-50'
        }
      `}
    >
      <div
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5
          flex items-center justify-center
          transition-colors
          ${isSelected
            ? 'border-secondary-600 bg-secondary-600'
            : 'border-primary-300'
          }
        `}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {template.title && (
          <div className="text-sm font-medium text-primary-700">{template.title}</div>
        )}
        <div className={`text-sm ${template.title ? 'text-primary-500' : 'text-primary-700'}`}>
          {template.description}
        </div>
      </div>
    </button>
  );
}
