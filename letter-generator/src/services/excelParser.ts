/**
 * Excel Parser Service
 * Handles importing and parsing Excel files for batch letter generation
 */

import * as XLSX from 'xlsx';
import type {
  ExcelFile,
  ExcelSheet,
  ExcelColumn,
  ColumnMapping,
  ColumnMappingConfig,
  ColumnTransform,
  BatchItem,
  LetterType,
  FieldDefinition,
} from '../types';

// Re-import field definitions for use in this file
import {
  FIELD_DEFINITIONS_1099 as FIELDS_1099,
  FIELD_DEFINITIONS_BENEFICIARY as FIELDS_BENEFICIARY,
  FIELD_DEFINITIONS_RMD as FIELDS_RMD,
  FIELD_DEFINITIONS_TAX_STRATEGIES as FIELDS_TAX,
} from '../types';

const SAMPLE_VALUE_COUNT = 3; // Number of sample values to show in preview

/**
 * Parse an Excel file from an ArrayBuffer
 */
export function parseExcelFile(data: ArrayBuffer, fileName: string): ExcelFile {
  const workbook = XLSX.read(data, { type: 'array' });

  const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    return parseSheet(worksheet, sheetName);
  });

  return {
    fileName,
    sheets,
    selectedSheet: sheets.length > 0 ? sheets[0].name : '',
  };
}

/**
 * Parse a single worksheet
 */
function parseSheet(worksheet: XLSX.WorkSheet, name: string): ExcelSheet {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const rowCount = range.e.r - range.s.r; // Exclude header row from count

  const columns: ExcelColumn[] = [];

  // Read header row (first row)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
    const header = headerCell ? String(headerCell.v).trim() : `Column ${col + 1}`;

    // Get sample values from subsequent rows
    const sampleValues: string[] = [];
    for (let row = range.s.r + 1; row <= Math.min(range.s.r + SAMPLE_VALUE_COUNT, range.e.r); row++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v !== undefined && cell.v !== null) {
        sampleValues.push(String(cell.v).trim());
      }
    }

    columns.push({
      index: col,
      header,
      sampleValues,
    });
  }

  return {
    name,
    columns,
    rowCount,
  };
}

/**
 * Read all data rows from a specific sheet
 */
export function readSheetData(
  data: ArrayBuffer,
  sheetName: string,
  hasHeaderRow: boolean = true,
  startRow: number = 0
): Record<string, unknown>[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: hasHeaderRow ? undefined : 1, // Use first row as headers if hasHeaderRow is true
    defval: '', // Default value for empty cells
    raw: false, // Convert all values to strings for consistent handling
  });

  // Skip rows if startRow is specified
  return jsonData.slice(startRow) as Record<string, unknown>[];
}

/**
 * Apply column mappings to raw data
 */
export function applyMappings(
  rawData: Record<string, unknown>[],
  mappingConfig: ColumnMappingConfig
): BatchItem[] {
  return rawData.map((row, index) => {
    const mappedData: Record<string, unknown> = {};
    let hasError = false;
    let errorMessage = '';

    for (const mapping of mappingConfig.mappings) {
      const rawValue = row[mapping.sourceColumn];

      try {
        mappedData[mapping.targetField] = transformValue(
          rawValue,
          mapping.transform || 'none'
        );
      } catch (error) {
        hasError = true;
        errorMessage = `Error transforming field "${mapping.targetField}": ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    return {
      id: `row-${index + 1}`,
      rowNumber: index + 1 + (mappingConfig.hasHeaderRow ? 1 : 0) + mappingConfig.startRow,
      data: mappedData,
      status: hasError ? 'error' : 'pending',
      errorMessage: hasError ? errorMessage : undefined,
    } as BatchItem;
  });
}

/**
 * Transform a value based on the specified transform type
 */
export function transformValue(
  value: unknown,
  transform: ColumnTransform
): unknown {
  if (value === undefined || value === null || value === '') {
    return transform === 'boolean' ? false : value;
  }

  const stringValue = String(value).trim();

  switch (transform) {
    case 'none':
      return stringValue;

    case 'uppercase':
      return stringValue.toUpperCase();

    case 'lowercase':
      return stringValue.toLowerCase();

    case 'trim':
      return stringValue;

    case 'currency':
      return parseCurrency(stringValue);

    case 'percentage':
      return parsePercentage(stringValue);

    case 'date':
      return parseDate(stringValue);

    case 'boolean':
      return parseBoolean(stringValue);

    default:
      return stringValue;
  }
}

/**
 * Parse a currency string to a number
 */
function parseCurrency(value: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error(`Invalid currency value: "${value}"`);
  }

  return num;
}

/**
 * Parse a percentage string to a number (0-100 scale)
 */
function parsePercentage(value: string): number {
  // Remove percentage sign and spaces
  const cleaned = value.replace(/[%\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error(`Invalid percentage value: "${value}"`);
  }

  // If the value is greater than 1 but less than or equal to 100, assume it's already a percentage
  // If it's less than or equal to 1, assume it's a decimal and convert
  if (num <= 1 && !value.includes('%')) {
    return num * 100;
  }

  return num;
}

/**
 * Parse a date string to ISO format
 */
function parseDate(value: string): string {
  // Try parsing as a date
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    // Try parsing Excel serial date number
    const serialNum = parseFloat(value);
    if (!isNaN(serialNum)) {
      // Excel dates are days since 1900-01-01 (with a leap year bug)
      const excelDate = new Date((serialNum - 25569) * 86400 * 1000);
      if (!isNaN(excelDate.getTime())) {
        return excelDate.toISOString().split('T')[0];
      }
    }
    throw new Error(`Invalid date value: "${value}"`);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Parse a boolean string
 */
function parseBoolean(value: string): boolean {
  const lowered = value.toLowerCase();
  const trueValues = ['true', 'yes', 'y', '1', 'x', 'checked'];
  const falseValues = ['false', 'no', 'n', '0', '', 'unchecked'];

  if (trueValues.includes(lowered)) {
    return true;
  }

  if (falseValues.includes(lowered)) {
    return false;
  }

  throw new Error(`Invalid boolean value: "${value}"`);
}

/**
 * Validate that all required fields are mapped
 */
export function validateMappings(
  mappingConfig: ColumnMappingConfig,
  letterType: Exclude<LetterType, 'engagement'>
): { valid: boolean; missingFields: string[] } {
  const fieldDefs = getFieldDefinitions(letterType);
  const requiredFields = fieldDefs.filter(f => f.required).map(f => f.key);
  const mappedFields = mappingConfig.mappings.map(m => m.targetField);

  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get field definitions for a letter type
 */
export function getFieldDefinitions(
  letterType: Exclude<LetterType, 'engagement'>
): FieldDefinition[] {
  switch (letterType) {
    case '1099':
      return FIELDS_1099;
    case 'beneficiary':
      return FIELDS_BENEFICIARY;
    case 'rmd':
      return FIELDS_RMD;
    case 'tax_strategies':
      return FIELDS_TAX;
    default:
      return [];
  }
}

/**
 * Auto-suggest column mappings based on header names
 */
export function suggestMappings(
  columns: ExcelColumn[],
  letterType: Exclude<LetterType, 'engagement'>
): ColumnMapping[] {
  const fieldDefs = getFieldDefinitions(letterType);
  const mappings: ColumnMapping[] = [];

  for (const field of fieldDefs) {
    const matchingColumn = findMatchingColumn(columns, field);

    if (matchingColumn) {
      mappings.push({
        sourceColumn: matchingColumn.header,
        targetField: field.key,
        transform: getDefaultTransform(field.type),
      });
    }
  }

  return mappings;
}

/**
 * Find a column that matches a field definition
 */
function findMatchingColumn(
  columns: ExcelColumn[],
  field: FieldDefinition
): ExcelColumn | undefined {
  // Normalize field key and label for comparison
  const normalizedKey = normalizeString(field.key);
  const normalizedLabel = normalizeString(field.label);

  // Try exact match first
  for (const column of columns) {
    const normalizedHeader = normalizeString(column.header);

    if (normalizedHeader === normalizedKey || normalizedHeader === normalizedLabel) {
      return column;
    }
  }

  // Try partial match
  for (const column of columns) {
    const normalizedHeader = normalizeString(column.header);

    // Check if header contains key or label
    if (normalizedHeader.includes(normalizedKey) || normalizedKey.includes(normalizedHeader)) {
      return column;
    }

    if (normalizedHeader.includes(normalizedLabel) || normalizedLabel.includes(normalizedHeader)) {
      return column;
    }
  }

  // Try word-based matching for common variations
  const keyWords = normalizedKey.split(/[^a-z0-9]+/).filter(w => w.length > 2);

  for (const column of columns) {
    const normalizedHeader = normalizeString(column.header);
    const matchCount = keyWords.filter(word => normalizedHeader.includes(word)).length;

    if (matchCount >= Math.ceil(keyWords.length * 0.6)) {
      return column;
    }
  }

  return undefined;
}

/**
 * Normalize a string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Get the default transform for a field type
 */
function getDefaultTransform(
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

/**
 * Export mapping configuration for reuse
 */
export function exportMappingConfig(
  mappingConfig: ColumnMappingConfig
): string {
  return JSON.stringify(mappingConfig, null, 2);
}

/**
 * Import a saved mapping configuration
 */
export function importMappingConfig(json: string): ColumnMappingConfig {
  try {
    const config = JSON.parse(json) as ColumnMappingConfig;

    // Validate the structure
    if (!config.letterType || !Array.isArray(config.mappings)) {
      throw new Error('Invalid mapping configuration format');
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to parse mapping configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Group batch items by a specific field (useful for beneficiary letters)
 */
export function groupItemsByField(
  items: BatchItem[],
  fieldKey: string
): Map<string, BatchItem[]> {
  const groups = new Map<string, BatchItem[]>();

  for (const item of items) {
    const value = String(item.data[fieldKey] || 'Unknown');

    if (!groups.has(value)) {
      groups.set(value, []);
    }

    groups.get(value)!.push(item);
  }

  return groups;
}

/**
 * Validate batch item data
 */
export function validateBatchItem(
  item: BatchItem,
  letterType: Exclude<LetterType, 'engagement'>
): { valid: boolean; errors: string[] } {
  const fieldDefs = getFieldDefinitions(letterType);
  const errors: string[] = [];

  for (const field of fieldDefs) {
    if (field.required) {
      const value = item.data[field.key];

      if (value === undefined || value === null || value === '') {
        errors.push(`Missing required field: ${field.label}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
