import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decisionsToCSV, downloadCSV, exportDecisionsToCSV } from './csvExport';
import { LoadEntrySnapshot } from '@/types/mvp';

describe('csvExport', () => {
  describe('decisionsToCSV', () => {
    it('should generate CSV with correct headers', () => {
      const decisions: LoadEntrySnapshot[] = [];
      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('Date,Origin,Destination,Miles,Rate,FSC,Tolls,Fuel Cost,Total Revenue,Net Profit,RPM,Decision,Notes');
    });

    it('should convert single decision to CSV row', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'Chicago',
          destination: 'Detroit',
          miles: 280,
          rate: 700,
          fsc: 50,
          tolls: 30,
          fuelCost: 120,
          profit: 600,
          rpm: 2.14,
          outcome: 'book',
          createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('Chicago');
      expect(lines[1]).toContain('Detroit');
      expect(lines[1]).toContain('280');
      expect(lines[1]).toContain('700.00');
      expect(lines[1]).toContain('50.00');
      expect(lines[1]).toContain('Book');
    });

    it('should calculate total revenue correctly', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 500,
          fsc: 75,
          tolls: 20,
          fuelCost: 80,
          profit: 475,
          rpm: 4.75,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('575.00'); // 500 + 75 = 575 total revenue
    });

    it('should escape values with commas', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'Chicago, IL',
          destination: 'Detroit, MI',
          miles: 280,
          rate: 700,
          fsc: 50,
          tolls: 30,
          fuelCost: 120,
          profit: 600,
          rpm: 2.14,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('"Chicago, IL"');
      expect(csv).toContain('"Detroit, MI"');
    });

    it('should escape values with quotes', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'Test "City"',
          destination: 'Destination',
          miles: 100,
          rate: 200,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 150,
          rpm: 1.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
          notes: 'Broker said "good rate"',
        },
      ];

      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('"Test ""City"""');
      expect(csv).toContain('"Broker said ""good rate"""');
    });

    it('should handle empty notes', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 200,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 150,
          rpm: 1.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      const lines = csv.split('\n');
      
      // Notes should be empty at the end
      expect(lines[1]).toMatch(/Book,$/);
    });

    it('should include notes when present', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 200,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 150,
          rpm: 1.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
          notes: 'Good broker',
        },
      ];

      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('Good broker');
    });

    it('should handle multiple decisions', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 200,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 150,
          rpm: 1.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          origin: 'C',
          destination: 'D',
          miles: 200,
          rate: 400,
          fsc: 50,
          tolls: 30,
          fuelCost: 100,
          profit: 320,
          rpm: 1.6,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(3); // header + 2 data rows
    });

    it('should capitalize decision outcomes', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 200,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 150,
          rpm: 1.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          origin: 'C',
          destination: 'D',
          miles: 100,
          rate: 150,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 100,
          rpm: 1.0,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          origin: 'E',
          destination: 'F',
          miles: 100,
          rate: 180,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 130,
          rpm: 1.3,
          outcome: 'counter',
          createdAt: new Date().toISOString(),
        },
      ];

      const csv = decisionsToCSV(decisions);
      
      expect(csv).toContain('Book');
      expect(csv).toContain('Pass');
      expect(csv).toContain('Counter');
    });
  });

  describe('downloadCSV', () => {
    beforeEach(() => {
      // Mock DOM APIs
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock createElement and appendChild/removeChild
      const mockLink = {
        download: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: { visibility: '' },
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create blob and trigger download', () => {
      const csvContent = 'Date,Origin,Destination\n2024-01-15,Chicago,Detroit';
      
      downloadCSV(csvContent, 'test.csv');
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use default filename if not provided', () => {
      const csvContent = 'Date,Origin,Destination';
      const mockSetAttribute = vi.fn();
      
      const mockLink = {
        download: '',
        setAttribute: mockSetAttribute,
        click: vi.fn(),
        style: { visibility: '' },
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      
      downloadCSV(csvContent);
      
      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'loadmaster-history.csv');
    });
  });

  describe('exportDecisionsToCSV', () => {
    beforeEach(() => {
      // Mock download functionality
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockLink = {
        download: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: { visibility: '' },
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should throw error when no decisions to export', () => {
      expect(() => exportDecisionsToCSV([])).toThrow('No decisions to export');
    });

    it('should export decisions with timestamped filename', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'Chicago',
          destination: 'Detroit',
          miles: 280,
          rate: 700,
          fsc: 50,
          tolls: 30,
          fuelCost: 120,
          profit: 600,
          rpm: 2.14,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockSetAttribute = vi.fn();
      const mockLink = {
        download: '',
        setAttribute: mockSetAttribute,
        click: vi.fn(),
        style: { visibility: '' },
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      
      exportDecisionsToCSV(decisions);
      
      // Check that filename contains timestamp pattern
      const downloadCall = mockSetAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(downloadCall).toBeDefined();
      expect(downloadCall?.[1]).toMatch(/^loadmaster-history-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
    });
  });
});
