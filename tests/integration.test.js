/**
 * Integration tests for full workflow scenarios
 */

import {
  computeAllMetrics,
  computeDockMetrics,
  formatNumber,
  DEFAULT_DOCKS,
  AVAILABLE_DOCKS
} from '../src/metrics.js';

import {
  createDockManager,
  getDockElementId
} from '../src/dockManager.js';

describe('Full Workflow Integration', () => {
  describe('Typical production tracking scenario', () => {
    test('single shift with multiple docks', () => {
      // Simulate a typical shift scenario
      const shiftData = {
        'PD10': { volume: 1200, hours: 10, plan: 100 },
        'PD11': { volume: 800, hours: 8, plan: 120 },
        'SDs': { volume: 500, hours: 5, plan: 90 },
        'HUB SEC': { volume: 300, hours: 4, plan: 80 }
      };

      const results = computeAllMetrics(shiftData);

      // Verify individual dock calculations
      expect(results['PD10'].actual_production).toBe(120);
      expect(results['PD10'].excess_hours).toBe(-2); // Ahead of plan

      expect(results['PD11'].actual_production).toBe(100);
      expect(results['PD11'].excess_hours).toBeCloseTo(1.33, 2); // Behind plan

      expect(results['SDs'].actual_production).toBe(100);
      expect(results['SDs'].excess_hours).toBeCloseTo(-0.56, 2); // Ahead of plan

      expect(results['HUB SEC'].actual_production).toBe(75);
      expect(results['HUB SEC'].excess_hours).toBe(0.25); // Slightly behind

      // Verify outbound totals
      expect(results['Outbound'].volume).toBe(2800);
      expect(results['Outbound'].hours).toBe(27);
      expect(results['Outbound'].actual_production).toBeCloseTo(103.7, 1);
    });

    test('high performance shift (all docks ahead of plan)', () => {
      const shiftData = {
        'PD10': { volume: 1500, hours: 10, plan: 100 }, // 150 PPH actual
        'PD11': { volume: 1200, hours: 8, plan: 100 },  // 150 PPH actual
        'SDs': { volume: 750, hours: 5, plan: 100 }     // 150 PPH actual
      };

      const results = computeAllMetrics(shiftData);

      // All docks should have negative excess (saved time)
      expect(results['PD10'].excess_hours).toBe(-5);
      expect(results['PD11'].excess_hours).toBe(-4);
      expect(results['SDs'].excess_hours).toBe(-2.5);

      // Total savings
      expect(results['Outbound'].excess_hours).toBe(-11.5);
    });

    test('low performance shift (all docks behind plan)', () => {
      const shiftData = {
        'PD10': { volume: 500, hours: 10, plan: 100 },  // 50 PPH actual
        'PD11': { volume: 400, hours: 8, plan: 100 },   // 50 PPH actual
        'SDs': { volume: 250, hours: 5, plan: 100 }     // 50 PPH actual
      };

      const results = computeAllMetrics(shiftData);

      // All docks should have positive excess (wasted time)
      expect(results['PD10'].excess_hours).toBe(5);
      expect(results['PD11'].excess_hours).toBe(4);
      expect(results['SDs'].excess_hours).toBe(2.5);

      // Total excess
      expect(results['Outbound'].excess_hours).toBe(11.5);
    });
  });

  describe('Dock Manager workflow', () => {
    test('setup default docks workflow', () => {
      const manager = createDockManager();

      // Add default docks
      DEFAULT_DOCKS.forEach(dock => {
        const result = manager.add(dock);
        expect(result.success).toBe(true);
      });

      expect(manager.count()).toBe(DEFAULT_DOCKS.length);
      expect(manager.getAll()).toEqual(expect.arrayContaining(DEFAULT_DOCKS));
    });

    test('add, compute, remove, re-add workflow', () => {
      const manager = createDockManager();

      // Add initial dock
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);

      // Simulate computation
      const data1 = { 'PD1': { volume: 1000, hours: 10, plan: 100 } };
      const results1 = computeAllMetrics(data1);
      expect(results1['PD1'].actual_production).toBe(100);

      // Remove dock
      manager.remove('PD1');
      expect(manager.has('PD1')).toBe(false);

      // Add different dock
      manager.add('PD2');

      // Compute with new dock
      const data2 = { 'PD2': { volume: 500, hours: 5, plan: 100 } };
      const results2 = computeAllMetrics(data2);
      expect(results2['PD2'].actual_production).toBe(100);

      // Re-add original dock
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);
      expect(manager.has('PD2')).toBe(true);
    });

    test('full cycle: add all docks then clear', () => {
      const manager = createDockManager();

      // Add all available docks
      AVAILABLE_DOCKS.forEach(dock => {
        manager.add(dock);
      });

      expect(manager.count()).toBe(AVAILABLE_DOCKS.length);
      expect(manager.getAvailable()).toHaveLength(0);

      // Clear all
      manager.clear();
      expect(manager.count()).toBe(0);
      expect(manager.getAvailable()).toHaveLength(AVAILABLE_DOCKS.length);
    });
  });

  describe('Data collection and display workflow', () => {
    test('collect data from multiple docks and format for display', () => {
      const dockData = {
        'PD10': { volume: 1000, hours: 10, plan: 100 },
        'PD11': { volume: 800, hours: 10, plan: 100 }
      };

      const results = computeAllMetrics(dockData);

      // Format for display
      const displayData = Object.entries(results).map(([name, data]) => ({
        dock: name,
        volume: formatNumber(data.volume),
        hours: formatNumber(data.hours),
        plan: data.plan !== null ? formatNumber(data.plan) : '-',
        actual: formatNumber(data.actual_production),
        excess: formatNumber(data.excess_hours)
      }));

      expect(displayData).toHaveLength(3); // 2 docks + Outbound

      // Check PD10 formatting
      const pd10 = displayData.find(d => d.dock === 'PD10');
      expect(pd10.volume).toBe('1000.00');
      expect(pd10.hours).toBe('10.00');
      expect(pd10.plan).toBe('100.00');
      expect(pd10.actual).toBe('100.00');
      expect(pd10.excess).toBe('0.00');

      // Check Outbound formatting
      const outbound = displayData.find(d => d.dock === 'Outbound');
      expect(outbound.plan).toBe('-');
      expect(outbound.volume).toBe('1800.00');
    });

    test('element IDs are correctly generated for all dock types', () => {
      AVAILABLE_DOCKS.forEach(dock => {
        const id = getDockElementId(dock);
        // Regex allows uppercase, lowercase, and numbers (for docks like "SDs")
        expect(id).toMatch(/^dock-[A-Za-z0-9-]+$/);
        expect(id).not.toContain(' ');
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('partial shift data (some docks with zero activity)', () => {
      const shiftData = {
        'PD10': { volume: 1000, hours: 10, plan: 100 },
        'PD11': { volume: 0, hours: 0, plan: 100 },     // Dock not used
        'SDs': { volume: 500, hours: 5, plan: 100 }
      };

      const results = computeAllMetrics(shiftData);

      // Inactive dock should have zero outputs
      expect(results['PD11'].actual_production).toBe(0);
      expect(results['PD11'].excess_hours).toBe(0);

      // Outbound should only reflect active docks
      expect(results['Outbound'].volume).toBe(1500);
      expect(results['Outbound'].hours).toBe(15);
    });

    test('varying plan PPH across docks', () => {
      const shiftData = {
        'PD10': { volume: 1000, hours: 10, plan: 100 },  // Meeting plan
        'PD11': { volume: 500, hours: 10, plan: 50 },    // Meeting different plan
        'SDs': { volume: 600, hours: 10, plan: 80 }      // Exceeding plan
      };

      const results = computeAllMetrics(shiftData);

      // PD10: actual 100, plan 100 = 0 excess
      expect(results['PD10'].excess_hours).toBe(0);

      // PD11: actual 50, plan 50 = 0 excess
      expect(results['PD11'].excess_hours).toBe(0);

      // SDs: actual 60, plan 80 = behind (needed 7.5 hours, used 10)
      expect(results['SDs'].excess_hours).toBe(2.5);
    });

    test('overtime scenario (high hours, high volume)', () => {
      const shiftData = {
        'PD10': { volume: 2000, hours: 16, plan: 100 },
        'PD11': { volume: 1600, hours: 16, plan: 100 }
      };

      const results = computeAllMetrics(shiftData);

      // Both docks at 125 PPH, exceeding 100 PPH plan
      expect(results['PD10'].actual_production).toBe(125);
      expect(results['PD11'].actual_production).toBe(100);

      // Outbound total
      expect(results['Outbound'].volume).toBe(3600);
      expect(results['Outbound'].hours).toBe(32);
    });

    test('minimal staffing scenario (single dock)', () => {
      const shiftData = {
        'PD10': { volume: 500, hours: 5, plan: 100 }
      };

      const results = computeAllMetrics(shiftData);

      // Results should include both the single dock and Outbound
      expect(Object.keys(results)).toHaveLength(2);
      expect(results['Outbound'].volume).toBe(results['PD10'].volume);
      expect(results['Outbound'].hours).toBe(results['PD10'].hours);
    });
  });

  describe('Edge case workflows', () => {
    test('compute with no docks returns only Outbound', () => {
      const results = computeAllMetrics({});

      expect(Object.keys(results)).toEqual(['Outbound']);
      expect(results['Outbound'].volume).toBe(0);
      expect(results['Outbound'].hours).toBe(0);
      expect(results['Outbound'].actual_production).toBe(0);
      expect(results['Outbound'].excess_hours).toBe(0);
    });

    test('rapid add/remove cycles maintain consistency', () => {
      const manager = createDockManager();

      for (let i = 0; i < 10; i++) {
        manager.add('PD1');
        manager.add('PD2');
        manager.remove('PD1');
        manager.remove('PD2');
      }

      expect(manager.count()).toBe(0);

      // Should still work correctly after cycles
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);
      expect(manager.count()).toBe(1);
    });

    test('all 16 docks simultaneously', () => {
      const manager = createDockManager();
      const allDocksData = {};

      AVAILABLE_DOCKS.forEach((dock, i) => {
        manager.add(dock);
        allDocksData[dock] = {
          volume: (i + 1) * 100,
          hours: (i + 1),
          plan: 100
        };
      });

      expect(manager.count()).toBe(16);

      const results = computeAllMetrics(allDocksData);

      // Should have 16 docks + Outbound
      expect(Object.keys(results)).toHaveLength(17);

      // Verify totals
      const expectedVolume = AVAILABLE_DOCKS.reduce((sum, _, i) => sum + (i + 1) * 100, 0);
      const expectedHours = AVAILABLE_DOCKS.reduce((sum, _, i) => sum + (i + 1), 0);

      expect(results['Outbound'].volume).toBe(expectedVolume);
      expect(results['Outbound'].hours).toBe(expectedHours);
    });
  });
});
