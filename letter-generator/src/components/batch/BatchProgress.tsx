/**
 * Batch Progress Component
 * Displays batch job progress and allows control (pause/resume/cancel)
 */

import { useMemo } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { BatchJob, BatchItem } from '../../types';

interface BatchProgressProps {
  job: BatchJob;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function BatchProgress({
  job,
  onPause,
  onResume,
  onCancel,
}: BatchProgressProps) {
  const progress = useMemo(() => {
    if (job.totalItems === 0) return 0;
    return Math.round((job.processedItems / job.totalItems) * 100);
  }, [job.processedItems, job.totalItems]);

  const statusColor = useMemo(() => {
    switch (job.status) {
      case 'running':
        return 'text-secondary-600';
      case 'paused':
        return 'text-warning-600';
      case 'completed':
        return 'text-accent-600';
      case 'cancelled':
        return 'text-error-600';
      default:
        return 'text-primary-600';
    }
  }, [job.status]);

  const elapsedTime = useMemo(() => {
    if (!job.startedAt) return null;
    const start = new Date(job.startedAt).getTime();
    const end = job.completedAt
      ? new Date(job.completedAt).getTime()
      : Date.now();
    const seconds = Math.floor((end - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [job.startedAt, job.completedAt]);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary-800">
            Batch Processing
          </h3>
          <p className={`text-sm font-medium ${statusColor}`}>
            {getStatusLabel(job.status)}
          </p>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {job.status === 'running' && (
            <Button variant="outline" size="sm" onClick={onPause}>
              Pause
            </Button>
          )}
          {job.status === 'paused' && (
            <Button variant="primary" size="sm" onClick={onResume}>
              Resume
            </Button>
          )}
          {(job.status === 'running' || job.status === 'paused') && (
            <Button variant="danger" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-primary-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 bg-primary-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              job.status === 'completed'
                ? 'bg-accent-500'
                : job.status === 'cancelled'
                ? 'bg-error-500'
                : 'bg-secondary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Total" value={job.totalItems} />
        <StatBox label="Success" value={job.successCount} color="accent" />
        <StatBox label="Errors" value={job.errorCount} color="error" />
        <StatBox label="Skipped" value={job.skippedCount} color="warning" />
      </div>

      {/* Time info */}
      {elapsedTime && (
        <div className="text-sm text-primary-500 mb-4">
          {job.completedAt ? 'Completed in' : 'Elapsed time'}: {elapsedTime}
        </div>
      )}

      {/* Item list (errors only when completed) */}
      {(job.status === 'completed' || job.status === 'cancelled') && job.errorCount > 0 && (
        <div className="mt-6 pt-6 border-t border-primary-200">
          <h4 className="text-sm font-semibold text-error-700 mb-3">
            Failed Items ({job.errorCount})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {job.items
              .filter((item) => item.status === 'error')
              .map((item) => (
                <ErrorItem key={item.id} item={item} />
              ))}
          </div>
        </div>
      )}

      {/* Currently processing (when running) */}
      {job.status === 'running' && (
        <div className="mt-6 pt-6 border-t border-primary-200">
          <h4 className="text-sm font-semibold text-primary-700 mb-3">
            Currently Processing
          </h4>
          <div className="space-y-2">
            {job.items
              .filter((item) => item.status === 'processing')
              .map((item) => (
                <ProcessingItem key={item.id} item={item} />
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Helper components
interface StatBoxProps {
  label: string;
  value: number;
  color?: 'primary' | 'accent' | 'error' | 'warning';
}

function StatBox({ label, value, color = 'primary' }: StatBoxProps) {
  const colorClasses = {
    primary: 'text-primary-800',
    accent: 'text-accent-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
  };

  return (
    <div className="bg-primary-50 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-primary-500">{label}</div>
    </div>
  );
}

interface ErrorItemProps {
  item: BatchItem;
}

function ErrorItem({ item }: ErrorItemProps) {
  const clientName = item.data.clientName || item.data.accountOwner || 'Unknown';

  return (
    <div className="flex items-start gap-3 p-2 bg-error-50 rounded">
      <svg
        className="w-4 h-4 text-error-500 mt-0.5 flex-shrink-0"
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
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-error-800">
          Row {item.rowNumber}: {String(clientName)}
        </p>
        <p className="text-xs text-error-600 truncate">{item.errorMessage}</p>
      </div>
    </div>
  );
}

interface ProcessingItemProps {
  item: BatchItem;
}

function ProcessingItem({ item }: ProcessingItemProps) {
  const clientName = item.data.clientName || item.data.accountOwner || 'Unknown';

  return (
    <div className="flex items-center gap-3 p-2 bg-secondary-50 rounded">
      <svg
        className="w-4 h-4 text-secondary-500 animate-spin"
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
      <p className="text-sm text-secondary-800">
        Row {item.rowNumber}: {String(clientName)}
      </p>
    </div>
  );
}

function getStatusLabel(status: BatchJob['status']): string {
  switch (status) {
    case 'idle':
      return 'Ready to Start';
    case 'running':
      return 'Processing...';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
