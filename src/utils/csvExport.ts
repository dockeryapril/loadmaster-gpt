import { Load } from '@/types/load';

export function exportLoadsToCSV(loads: Load[], filename?: string): void {
  if (loads.length === 0) {
    console.warn('No loads to export');
    return;
  }

  const headers = [
    'Origin',
    'Destination', 
    'Miles',
    'Rate ($)',
    'FSC ($)',
    'Tolls ($)',
    'Weight (lbs)',
    'Deadhead Miles',
    'Fuel Cost ($)',
    'RPM ($)',
    'Profit ($)',
    'Quality',
    'Tags',
    'Notes',
    'Created Date'
  ];

  const csvContent = [
    headers.join(','),
    ...loads.map(load => [
      `"${load.origin}"`,
      `"${load.destination}"`,
      load.miles,
      load.rate,
      load.fsc || 0,
      load.tolls || 0,
      load.weight || '',
      load.deadheadMiles || 0,
      load.fuelCost || 0,
      load.rpm,
      load.profit,
      `"${load.quality}"`,
      `"${load.tags ? load.tags.join('; ') : ''}"`,
      `"${load.notes || ''}"`,
      `"${load.createdAt.toLocaleDateString()}"`,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const defaultFilename = `loads-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename || defaultFilename);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}