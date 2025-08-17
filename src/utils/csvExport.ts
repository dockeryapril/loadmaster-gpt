import { Load } from '@/types/load';

export const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

export const exportLoadsToCSV = (loads: Load[]): void => {
  if (loads.length === 0) {
    return;
  }

  const headers = [
    'Origin',
    'Destination', 
    'Miles',
    'Rate',
    'RPM',
    'Profit',
    'FSC',
    'Tolls',
    'Weight',
    'Deadhead Miles',
    'Fuel Cost',
    'Quality',
    'Tags',
    'Notes',
    'Created At'
  ];

  const csvContent = [
    headers.join(','),
    ...loads.map(load => [
      `"${load.origin}"`,
      `"${load.destination}"`,
      load.miles,
      load.rate,
      load.rpm.toFixed(2),
      load.profit.toFixed(2),
      load.fsc || 0,
      load.tolls || 0,
      load.weight || '',
      load.deadheadMiles || 0,
      load.fuelCost || 0,
      load.quality,
      `"${(load.tags || []).join(', ')}"`,
      `"${load.notes || ''}"`,
      `"${load.createdAt.toISOString()}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loads_export_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};