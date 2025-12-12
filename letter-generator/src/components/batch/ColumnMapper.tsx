/**
 * Column Mapping Component
 * Maps Excel columns to target fields for batch letter generation
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Card } from '../common/Card';
import type {
  ExcelColumn,
  ColumnMapping,
  ColumnMappingConfig,
  ColumnTransform,
  LetterType,
  FieldDefinition,
} from '../../types';
import { getFieldDefinitions, suggestMappings } from '../../services/excelParser';

interface ColumnMapperProps {
  columns: ExcelColumn[];
  letterType: Exclude<LetterType, 'engagement'>;
  initialMappings?: ColumnMapping[];
  onMappingsChange: (config: ColumnMappingConfig) => void;
  hasHeaderRow?: boolean;
  startRow?: number;
}

const transformOptions: { value: ColumnTransform; label: string }[] = [
  { value: 'none', label: 'No Transform' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'currency', label: 'Parse Currency ($1,234.56)' },
  { value: 'percentage', label: 'Parse Percentage (12.5%)' },
  { value: 'date', label: 'Parse Date' },
  { value: 'boolean', label: 'Parse Yes/No' },
];

export function ColumnMapper({
  columns,
  letterType,
  initialMappings,
  onMappingsChange,
  hasHeaderRow = true,
  startRow = 0,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings || []);
  const [configHasHeaderRow, setConfigHasHeaderRow] = useState(hasHeaderRow);
  const [configStartRow, setConfigStartRow] = useState(startRow);

  // Get field definitions for this letter type
  const fieldDefinitions = useMemo(
    () => getFieldDefinitions(letterType),
    [letterType]
  );

  // Build config and notify parent when mappings change
  useEffect(() => {
    const config: ColumnMappingConfig = {
      letterType,
      mappings,
      hasHeaderRow: configHasHeaderRow,
      startRow: configStartRow,
    };
    onMappingsChange(config);
  }, [mappings, letterType, configHasHeaderRow, configStartRow, onMappingsChange]);

  // Auto-suggest mappings when columns change
  const handleAutoMap = () => {
    const suggested = suggestMappings(columns, letterType);
    setMappings(suggested);
  };

  // Add a new mapping
  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      {
        sourceColumn: columns[0]?.header || '',
        targetField: '',
        transform: 'trim',
      },
    ]);
  };

  // Update a mapping
  const handleUpdateMapping = (
    index: number,
    field: keyof ColumnMapping,
    value: string
  ) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };

    // Auto-set transform based on field type
    if (field === 'targetField') {
      const fieldDef = fieldDefinitions.find((f) => f.key === value);
      if (fieldDef) {
        newMappings[index].transform = getDefaultTransformForType(fieldDef.type);
      }
    }

    setMappings(newMappings);
  };

  // Remove a mapping
  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  // Clear all mappings
  const handleClearMappings = () => {
    setMappings([]);
  };

  // Get unmapped required fields
  const unmappedRequiredFields = useMemo(() => {
    const mappedFields = new Set(mappings.map((m) => m.targetField));
    return fieldDefinitions.filter(
      (f) => f.required && !mappedFields.has(f.key)
    );
  }, [mappings, fieldDefinitions]);

  // Get unmapped optional fields
  const unmappedOptionalFields = useMemo(() => {
    const mappedFields = new Set(mappings.map((m) => m.targetField));
    return fieldDefinitions.filter(
      (f) => !f.required && !mappedFields.has(f.key)
    );
  }, [mappings, fieldDefinitions]);

  // Build column options for dropdown
  const columnOptions = useMemo(
    () =>
      columns.map((col) => ({
        value: col.header,
        label: `${col.header}${col.sampleValues.length > 0 ? ` (e.g., "${col.sampleValues[0]}")` : ''}`,
      })),
    [columns]
  );

  // Build field options for dropdown, grouped by required/optional
  const fieldOptions = useMemo(() => {
    const required = fieldDefinitions
      .filter((f) => f.required)
      .map((f) => ({
        value: f.key,
        label: `${f.label} *`,
      }));

    const optional = fieldDefinitions
      .filter((f) => !f.required)
      .map((f) => ({
        value: f.key,
        label: f.label,
      }));

    return [...required, ...optional];
  }, [fieldDefinitions]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary-800">
            Column Mapping
          </h3>
          <p className="text-sm text-primary-600">
            Map your Excel columns to the required fields
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoMap}>
            Auto-Map Columns
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearMappings}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Import options */}
      <Card className="p-4 bg-primary-50">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={configHasHeaderRow}
              onChange={(e) => setConfigHasHeaderRow(e.target.checked)}
              className="rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
            />
            <span className="text-sm text-primary-700">First row contains headers</span>
          </label>

          {!configHasHeaderRow && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-primary-700">Start at row:</label>
              <input
                type="number"
                min={0}
                value={configStartRow}
                onChange={(e) => setConfigStartRow(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-primary-300 rounded focus:ring-secondary-500 focus:border-secondary-500"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Validation status */}
      {unmappedRequiredFields.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <p className="text-sm font-medium text-warning-800">
            Required fields not mapped:
          </p>
          <ul className="mt-1 text-sm text-warning-700 list-disc list-inside">
            {unmappedRequiredFields.map((f) => (
              <li key={f.key}>{f.label}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mappings list */}
      <div className="space-y-3">
        {mappings.map((mapping, index) => (
          <MappingRow
            key={index}
            mapping={mapping}
            columnOptions={columnOptions}
            fieldOptions={fieldOptions}
            fieldDefinitions={fieldDefinitions}
            onUpdate={(field, value) => handleUpdateMapping(index, field, value)}
            onRemove={() => handleRemoveMapping(index)}
          />
        ))}

        {mappings.length === 0 && (
          <div className="text-center py-8 text-primary-500">
            <p>No mappings configured.</p>
            <p className="text-sm mt-1">
              Click "Auto-Map Columns" to automatically detect mappings, or add them manually.
            </p>
          </div>
        )}
      </div>

      {/* Add mapping button */}
      <Button variant="outline" onClick={handleAddMapping} className="w-full">
        + Add Column Mapping
      </Button>

      {/* Unmapped optional fields hint */}
      {unmappedOptionalFields.length > 0 && mappings.length > 0 && (
        <details className="text-sm text-primary-600">
          <summary className="cursor-pointer hover:text-primary-800">
            {unmappedOptionalFields.length} optional field(s) not mapped
          </summary>
          <ul className="mt-2 ml-4 space-y-1">
            {unmappedOptionalFields.map((f) => (
              <li key={f.key} className="text-primary-500">
                {f.label}: {f.description}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// Individual mapping row component
interface MappingRowProps {
  mapping: ColumnMapping;
  columnOptions: { value: string; label: string }[];
  fieldOptions: { value: string; label: string }[];
  fieldDefinitions: FieldDefinition[];
  onUpdate: (field: keyof ColumnMapping, value: string) => void;
  onRemove: () => void;
}

function MappingRow({
  mapping,
  columnOptions,
  fieldOptions,
  fieldDefinitions,
  onUpdate,
  onRemove,
}: MappingRowProps) {
  const fieldDef = fieldDefinitions.find((f) => f.key === mapping.targetField);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Source column */}
        <div className="flex-1">
          <Select
            label="Excel Column"
            options={columnOptions}
            value={mapping.sourceColumn}
            onChange={(e) => onUpdate('sourceColumn', e.target.value)}
            placeholder="Select column..."
          />
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center pt-8 text-primary-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Target field */}
        <div className="flex-1">
          <Select
            label="Target Field"
            options={fieldOptions}
            value={mapping.targetField}
            onChange={(e) => onUpdate('targetField', e.target.value)}
            placeholder="Select field..."
          />
          {fieldDef?.description && (
            <p className="mt-1 text-xs text-primary-500">{fieldDef.description}</p>
          )}
        </div>

        {/* Transform */}
        <div className="w-48">
          <Select
            label="Transform"
            options={transformOptions}
            value={mapping.transform || 'none'}
            onChange={(e) => onUpdate('transform', e.target.value)}
          />
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="mt-7 p-2 text-primary-400 hover:text-error-600 hover:bg-error-50 rounded transition-colors"
          title="Remove mapping"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  );
}

// Helper function to get default transform for field type
function getDefaultTransformForType(
  fieldType: FieldDefinition['type']
): ColumnTransform {
  switch (fieldType) {
    case 'currency':
      return 'currency';
    case 'percentage':
      return 'percentage';
    case 'date':
      return 'date';
    case 'boolean':
      return 'boolean';
    default:
      return 'trim';
  }
}
