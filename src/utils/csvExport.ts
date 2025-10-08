import { LoadEntrySnapshot } from '@/types/mvp';
import { format } from 'date-fns';

/**
 * Converts decision history to CSV format
 */
export function decisionsToCSV(decisions: LoadEntrySnapshot[]): string {
  const headers = [
    'Date',
    'Origin',
    'Destination',
    'Miles',
    'Rate',
    'FSC',
    'Tolls',
    'Fuel Cost',
    'Total Revenue',
    'Net Profit',
    'RPM',
    'Decision',
    'Notes',
  ];

  const rows = decisions.map(decision => {
    const totalRevenue = decision.rate + decision.fsc;
    const formattedDate = format(new Date(decision.createdAt), 'yyyy-MM-dd HH:mm:ss');
    
    return [
      formattedDate,
      escapeCSVValue(decision.origin),
      escapeCSVValue(decision.destination),
      decision.miles,
      decision.rate.toFixed(2),
      decision.fsc.toFixed(2),
      decision.tolls.toFixed(2),
      decision.fuelCost.toFixed(2),
      totalRevenue.toFixed(2),
      decision.profit.toFixed(2),
      decision.rpm.toFixed(2),
      capitalizeOutcome(decision.outcome),
      escapeCSVValue(decision.notes || ''),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escapes CSV values that contain commas, quotes, or newlines
 */
function escapeCSVValue(value: string): string {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Capitalizes outcome for display
 */
function capitalizeOutcome(outcome: string): string {
  const outcomeMap: Record<string, string> = {
    book: 'Book',
    pass: 'Pass',
    counter: 'Counter',
  };
  
  return outcomeMap[outcome] || outcome;
}

/**
 * Triggers browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'loadmaster-history.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports decisions to CSV and triggers download
 */
export function exportDecisionsToCSV(decisions: LoadEntrySnapshot[]): void {
  if (decisions.length === 0) {
    throw new Error('No decisions to export');
  }
  
  const csvContent = decisionsToCSV(decisions);
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = `loadmaster-history-${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}
