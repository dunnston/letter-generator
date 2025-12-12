/**
 * File Uploader Component
 * Handles Excel file upload and sheet selection for batch processing
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Select } from '../common/Select';
import type { ExcelFile, ExcelSheet } from '../../types';
import { parseExcelFile } from '../../services/excelParser';

interface FileUploaderProps {
  onFileLoaded: (file: ExcelFile, rawData: ArrayBuffer) => void;
  onSheetSelect: (sheetName: string) => void;
  currentFile: ExcelFile | null;
}

export function FileUploader({
  onFileLoaded,
  onSheetSelect,
  currentFile,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate file type
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];

        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidType && !hasValidExtension) {
          throw new Error('Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)');
        }

        // Read file
        const arrayBuffer = await file.arrayBuffer();

        // Parse Excel file
        const excelFile = parseExcelFile(arrayBuffer, file.name);

        if (excelFile.sheets.length === 0) {
          throw new Error('The file does not contain any sheets');
        }

        onFileLoaded(excelFile, arrayBuffer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read file');
      } finally {
        setIsLoading(false);
      }
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileLoaded(null as unknown as ExcelFile, null as unknown as ArrayBuffer);
  };

  // Get selected sheet info
  const selectedSheet = currentFile?.sheets.find(
    (s) => s.name === currentFile.selectedSheet
  );

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload area or file info */}
      {!currentFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8
            transition-colors duration-200
            ${isDragging
              ? 'border-secondary-500 bg-secondary-50'
              : 'border-primary-300 hover:border-primary-400'
            }
          `}
        >
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="animate-spin h-10 w-10 text-secondary-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-primary-600">Reading file...</p>
              </div>
            ) : (
              <>
                {/* Upload icon */}
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <p className="mt-4 text-primary-700">
                  <span className="font-medium">Drop your Excel file here</span>
                  <br />
                  <span className="text-primary-500">or</span>
                </p>

                <Button
                  variant="outline"
                  onClick={handleBrowseClick}
                  className="mt-3"
                >
                  Browse Files
                </Button>

                <p className="mt-3 text-xs text-primary-500">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* File icon */}
              <div className="p-2 bg-accent-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-accent-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div>
                <h4 className="font-medium text-primary-800">
                  {currentFile.fileName}
                </h4>
                <p className="text-sm text-primary-500">
                  {currentFile.sheets.length} sheet(s) found
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-primary-500 hover:text-error-600"
            >
              Remove
            </Button>
          </div>

          {/* Sheet selector */}
          {currentFile.sheets.length > 1 && (
            <div className="mt-4 pt-4 border-t border-primary-200">
              <Select
                label="Select Sheet"
                options={currentFile.sheets.map((s) => ({
                  value: s.name,
                  label: `${s.name} (${s.rowCount} rows)`,
                }))}
                value={currentFile.selectedSheet}
                onChange={(e) => onSheetSelect(e.target.value)}
              />
            </div>
          )}

          {/* Sheet preview */}
          {selectedSheet && (
            <div className="mt-4 pt-4 border-t border-primary-200">
              <h5 className="text-sm font-medium text-primary-700 mb-2">
                Column Preview
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedSheet.columns.slice(0, 10).map((col) => (
                  <span
                    key={col.index}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
                    title={col.sampleValues.join(', ')}
                  >
                    {col.header}
                  </span>
                ))}
                {selectedSheet.columns.length > 10 && (
                  <span className="px-2 py-1 text-xs text-primary-500">
                    +{selectedSheet.columns.length - 10} more
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-primary-500">
                {selectedSheet.rowCount} data rows found
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-error-600 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-error-800">
                Failed to load file
              </p>
              <p className="text-sm text-error-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
