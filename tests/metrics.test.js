/**
 * Unit tests for core metrics calculations
 */

import {
  calculateActualProduction,
  calculateExcessHours,
  parseNumericInput,
  validateDockData,
  computeDockMetrics,
  computeAllMetrics,
  formatNumber,
  isValidDock,
  AVAILABLE_DOCKS,
  DEFAULT_DOCKS
} from '../src/metrics.js';

describe('calculateActualProduction', () => {
  test('calculates correct PPH for normal inputs', () => {
    expect(calculateActualProduction(1000, 10)).toBe(100);
  });

  test('calculates correct PPH for decimal inputs', () => {
    expect(calculateActualProduction(150, 2.5)).toBe(60);
  });

  test('returns 0 when hours is 0 (avoids division by zero)', () => {
    expect(calculateActualProduction(1000, 0)).toBe(0);
  });

  test('returns 0 when both volume and hours are 0', () => {
    expect(calculateActualProduction(0, 0)).toBe(0);
  });

  test('handles large numbers correctly', () => {
    expect(calculateActualProduction(1000000, 100)).toBe(10000);
  });

  test('handles small decimal results', () => {
    const result = calculateActualProduction(1, 3);
    expect(result).toBeCloseTo(0.333, 2);
  });

  test('throws TypeError for non-numeric volume', () => {
    expect(() => calculateActualProduction('abc', 10)).toThrow(TypeError);
  });

  test('throws TypeError for non-numeric hours', () => {
    expect(() => calculateActualProduction(100, 'abc')).toThrow(TypeError);
  });

  test('throws TypeError for null inputs', () => {
    expect(() => calculateActualProduction(null, 10)).toThrow(TypeError);
  });

  test('throws TypeError for undefined inputs', () => {
    expect(() => calculateActualProduction(undefined, 10)).toThrow(TypeError);
  });
});

describe('calculateExcessHours', () => {
  test('returns 0 when exactly on plan', () => {
    // 10 hours, 1000 volume, 100 PPH plan = 10 hours needed = 0 excess
    expect(calculateExcessHours(10, 1000, 100)).toBe(0);
  });

  test('returns positive when behind plan (used more hours)', () => {
    // 10 hours, 500 volume, 100 PPH plan = 5 hours needed = 5 excess
    expect(calculateExcessHours(10, 500, 100)).toBe(5);
  });

  test('returns negative when ahead of plan (used fewer hours)', () => {
    // 10 hours, 1500 volume, 100 PPH plan = 15 hours needed = -5 excess
    expect(calculateExcessHours(10, 1500, 100)).toBe(-5);
  });

  test('returns all hours as excess when plan is 0', () => {
    expect(calculateExcessHours(10, 1000, 0)).toBe(10);
  });

  test('handles decimal values correctly', () => {
    // 8.5 hours, 850 volume, 100 PPH = 0 excess
    expect(calculateExcessHours(8.5, 850, 100)).toBe(0);
  });

  test('handles zero volume', () => {
    // 10 hours, 0 volume, 100 PPH = 10 excess (all hours are excess)
    expect(calculateExcessHours(10, 0, 100)).toBe(10);
  });

  test('handles zero hours', () => {
    // 0 hours, 100 volume, 100 PPH = -1 excess (ahead by 1 hour)
    expect(calculateExcessHours(0, 100, 100)).toBe(-1);
  });

  test('throws TypeError for non-numeric inputs', () => {
    expect(() => calculateExcessHours('abc', 100, 100)).toThrow(TypeError);
    expect(() => calculateExcessHours(10, 'abc', 100)).toThrow(TypeError);
    expect(() => calculateExcessHours(10, 100, 'abc')).toThrow(TypeError);
  });
});

describe('parseNumericInput', () => {
  test('parses valid integer string', () => {
    expect(parseNumericInput('100')).toBe(100);
  });

  test('parses valid float string', () => {
    expect(parseNumericInput('10.5')).toBe(10.5);
  });

  test('parses number type directly', () => {
    expect(parseNumericInput(42)).toBe(42);
  });

  test('returns 0 for empty string', () => {
    expect(parseNumericInput('')).toBe(0);
  });

  test('returns 0 for non-numeric string', () => {
    expect(parseNumericInput('abc')).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(parseNumericInput(null)).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(parseNumericInput(undefined)).toBe(0);
  });

  test('returns 0 for NaN', () => {
    expect(parseNumericInput(NaN)).toBe(0);
  });

  test('parses string with leading/trailing spaces', () => {
    expect(parseNumericInput('  42  ')).toBe(42);
  });

  test('parses negative numbers', () => {
    expect(parseNumericInput('-10')).toBe(-10);
  });
});

describe('validateDockData', () => {
  test('validates complete valid data', () => {
    const result = validateDockData({ volume: 100, hours: 10, plan: 50 });
    expect(result).toEqual({ volume: 100, hours: 10, plan: 50 });
  });

  test('converts string values to numbers', () => {
    const result = validateDockData({ volume: '100', hours: '10', plan: '50' });
    expect(result).toEqual({ volume: 100, hours: 10, plan: 50 });
  });

  test('defaults missing properties to 0', () => {
    const result = validateDockData({});
    expect(result).toEqual({ volume: 0, hours: 0, plan: 0 });
  });

  test('handles null input', () => {
    const result = validateDockData(null);
    expect(result).toEqual({ volume: 0, hours: 0, plan: 0 });
  });

  test('handles undefined input', () => {
    const result = validateDockData(undefined);
    expect(result).toEqual({ volume: 0, hours: 0, plan: 0 });
  });

  test('clamps negative values to 0', () => {
    const result = validateDockData({ volume: -100, hours: -10, plan: -50 });
    expect(result).toEqual({ volume: 0, hours: 0, plan: 0 });
  });

  test('handles partial data', () => {
    const result = validateDockData({ volume: 100 });
    expect(result).toEqual({ volume: 100, hours: 0, plan: 0 });
  });
});

describe('computeDockMetrics', () => {
  test('computes metrics for valid dock data', () => {
    const result = computeDockMetrics({ volume: 1000, hours: 10, plan: 100 });
    expect(result).toEqual({
      volume: 1000,
      hours: 10,
      plan: 100,
      actual_production: 100,
      excess_hours: 0
    });
  });

  test('computes metrics when behind plan', () => {
    const result = computeDockMetrics({ volume: 500, hours: 10, plan: 100 });
    expect(result.actual_production).toBe(50);
    expect(result.excess_hours).toBe(5);
  });

  test('computes metrics when ahead of plan', () => {
    const result = computeDockMetrics({ volume: 1500, hours: 10, plan: 100 });
    expect(result.actual_production).toBe(150);
    expect(result.excess_hours).toBe(-5);
  });

  test('handles zero hours', () => {
    const result = computeDockMetrics({ volume: 1000, hours: 0, plan: 100 });
    expect(result.actual_production).toBe(0);
  });

  test('handles zero plan', () => {
    const result = computeDockMetrics({ volume: 1000, hours: 10, plan: 0 });
    expect(result.excess_hours).toBe(10);
  });

  test('handles all zeros', () => {
    const result = computeDockMetrics({ volume: 0, hours: 0, plan: 0 });
    expect(result).toEqual({
      volume: 0,
      hours: 0,
      plan: 0,
      actual_production: 0,
      excess_hours: 0
    });
  });
});

describe('computeAllMetrics', () => {
  test('computes metrics for multiple docks', () => {
    const data = {
      'PD1': { volume: 1000, hours: 10, plan: 100 },
      'PD2': { volume: 500, hours: 5, plan: 100 }
    };
    const result = computeAllMetrics(data);

    expect(result['PD1'].actual_production).toBe(100);
    expect(result['PD2'].actual_production).toBe(100);
  });

  test('calculates correct Outbound totals', () => {
    const data = {
      'PD1': { volume: 1000, hours: 10, plan: 100 },
      'PD2': { volume: 500, hours: 5, plan: 100 }
    };
    const result = computeAllMetrics(data);

    expect(result['Outbound'].volume).toBe(1500);
    expect(result['Outbound'].hours).toBe(15);
    expect(result['Outbound'].actual_production).toBe(100);
    expect(result['Outbound'].plan).toBeNull();
  });

  test('calculates correct excess hours total', () => {
    const data = {
      'PD1': { volume: 1000, hours: 10, plan: 100 }, // 0 excess
      'PD2': { volume: 400, hours: 10, plan: 100 }  // 6 excess
    };
    const result = computeAllMetrics(data);

    expect(result['Outbound'].excess_hours).toBe(6);
  });

  test('handles empty input', () => {
    const result = computeAllMetrics({});

    expect(result['Outbound'].volume).toBe(0);
    expect(result['Outbound'].hours).toBe(0);
    expect(result['Outbound'].actual_production).toBe(0);
    expect(result['Outbound'].excess_hours).toBe(0);
  });

  test('handles single dock', () => {
    const data = {
      'PD1': { volume: 1000, hours: 10, plan: 100 }
    };
    const result = computeAllMetrics(data);

    expect(Object.keys(result)).toHaveLength(2); // PD1 + Outbound
    expect(result['Outbound'].volume).toBe(1000);
  });

  test('throws TypeError for non-object input', () => {
    expect(() => computeAllMetrics(null)).toThrow(TypeError);
    expect(() => computeAllMetrics('invalid')).toThrow(TypeError);
    expect(() => computeAllMetrics(123)).toThrow(TypeError);
  });

  test('handles negative excess hours (ahead of plan)', () => {
    const data = {
      'PD1': { volume: 1500, hours: 10, plan: 100 }, // -5 excess
      'PD2': { volume: 2000, hours: 10, plan: 100 }  // -10 excess
    };
    const result = computeAllMetrics(data);

    expect(result['Outbound'].excess_hours).toBe(-15);
  });
});

describe('formatNumber', () => {
  test('formats integer to 2 decimal places', () => {
    expect(formatNumber(100)).toBe('100.00');
  });

  test('formats float to 2 decimal places', () => {
    expect(formatNumber(100.5)).toBe('100.50');
  });

  test('rounds to 2 decimal places', () => {
    expect(formatNumber(100.555)).toBe('100.56');
    expect(formatNumber(100.554)).toBe('100.55');
  });

  test('handles negative numbers', () => {
    expect(formatNumber(-5.5)).toBe('-5.50');
  });

  test('returns 0.00 for NaN', () => {
    expect(formatNumber(NaN)).toBe('0.00');
  });

  test('returns 0.00 for non-number inputs', () => {
    expect(formatNumber('abc')).toBe('0.00');
    expect(formatNumber(null)).toBe('0.00');
    expect(formatNumber(undefined)).toBe('0.00');
  });

  test('handles very small numbers', () => {
    expect(formatNumber(0.001)).toBe('0.00');
    expect(formatNumber(0.005)).toBe('0.01');
  });

  test('handles very large numbers', () => {
    expect(formatNumber(1000000.99)).toBe('1000000.99');
  });
});

describe('isValidDock', () => {
  test('returns true for valid dock names', () => {
    expect(isValidDock('PD1')).toBe(true);
    expect(isValidDock('PD10')).toBe(true);
    expect(isValidDock('SDs')).toBe(true);
    expect(isValidDock('HUB SEC')).toBe(true);
    expect(isValidDock('PKG SEC')).toBe(true);
  });

  test('returns false for invalid dock names', () => {
    expect(isValidDock('PD99')).toBe(false);
    expect(isValidDock('INVALID')).toBe(false);
    expect(isValidDock('')).toBe(false);
  });

  test('is case sensitive', () => {
    expect(isValidDock('pd1')).toBe(false);
    expect(isValidDock('Pd1')).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(isValidDock(null)).toBe(false);
    expect(isValidDock(undefined)).toBe(false);
    expect(isValidDock(123)).toBe(false);
  });
});

describe('AVAILABLE_DOCKS constant', () => {
  test('contains all expected docks', () => {
    expect(AVAILABLE_DOCKS).toContain('PD1');
    expect(AVAILABLE_DOCKS).toContain('PD13');
    expect(AVAILABLE_DOCKS).toContain('SDs');
    expect(AVAILABLE_DOCKS).toContain('HUB SEC');
    expect(AVAILABLE_DOCKS).toContain('PKG SEC');
  });

  test('has correct length', () => {
    expect(AVAILABLE_DOCKS).toHaveLength(16);
  });
});

describe('DEFAULT_DOCKS constant', () => {
  test('contains expected default docks', () => {
    expect(DEFAULT_DOCKS).toEqual(['PD10', 'PD11', 'SDs', 'HUB SEC']);
  });

  test('all defaults are valid docks', () => {
    DEFAULT_DOCKS.forEach(dock => {
      expect(isValidDock(dock)).toBe(true);
    });
  });
});
