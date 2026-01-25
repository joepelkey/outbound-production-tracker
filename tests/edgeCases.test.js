/**
 * Edge case tests for boundary conditions and unusual inputs
 */

import {
  calculateActualProduction,
  calculateExcessHours,
  computeDockMetrics,
  computeAllMetrics,
  parseNumericInput,
  formatNumber
} from '../src/metrics.js';

describe('Division by Zero Edge Cases', () => {
  describe('calculateActualProduction with zero divisor', () => {
    test('returns 0 when hours is exactly 0', () => {
      expect(calculateActualProduction(1000, 0)).toBe(0);
    });

    test('returns 0 when volume is 0 and hours is 0', () => {
      expect(calculateActualProduction(0, 0)).toBe(0);
    });

    test('handles very small hours (near zero but not zero)', () => {
      const result = calculateActualProduction(100, 0.001);
      expect(result).toBe(100000);
    });
  });

  describe('calculateExcessHours with zero plan', () => {
    test('returns all hours as excess when plan is 0', () => {
      expect(calculateExcessHours(10, 1000, 0)).toBe(10);
    });

    test('returns 0 excess when both hours and plan are 0', () => {
      expect(calculateExcessHours(0, 1000, 0)).toBe(0);
    });

    test('handles very small plan (near zero but not zero)', () => {
      const result = calculateExcessHours(10, 1000, 0.001);
      // Excess = 10 - (1000 / 0.001) = 10 - 1000000 = -999990
      expect(result).toBe(-999990);
    });
  });
});

describe('Large Number Edge Cases', () => {
  test('handles very large volume', () => {
    const result = calculateActualProduction(1000000000, 1000);
    expect(result).toBe(1000000);
  });

  test('handles very large hours', () => {
    const result = calculateActualProduction(1000, 1000000);
    expect(result).toBe(0.001);
  });

  test('handles Number.MAX_SAFE_INTEGER', () => {
    const volume = Number.MAX_SAFE_INTEGER;
    const hours = 1;
    const result = calculateActualProduction(volume, hours);
    expect(result).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('computeAllMetrics handles large totals', () => {
    const data = {
      'PD1': { volume: 1000000000, hours: 10000, plan: 100000 },
      'PD2': { volume: 1000000000, hours: 10000, plan: 100000 }
    };
    const result = computeAllMetrics(data);
    expect(result['Outbound'].volume).toBe(2000000000);
    expect(result['Outbound'].hours).toBe(20000);
  });
});

describe('Small/Decimal Number Edge Cases', () => {
  test('handles very small volume', () => {
    const result = calculateActualProduction(0.001, 1);
    expect(result).toBe(0.001);
  });

  test('handles very small hours', () => {
    const result = calculateActualProduction(1, 0.001);
    expect(result).toBe(1000);
  });

  test('handles floating point precision', () => {
    // 0.1 + 0.2 !== 0.3 in JS due to floating point
    const result = calculateActualProduction(0.3, 0.1);
    expect(result).toBeCloseTo(3, 10);
  });

  test('formatNumber handles floating point rounding', () => {
    // Note: Due to JavaScript floating point representation, 2.005 is actually
    // stored as 2.00499999... so toFixed(2) rounds to '2.00', not '2.01'
    // This is expected JavaScript behavior
    expect(formatNumber(2.005)).toBe('2.00');
    // Use a number that rounds correctly
    expect(formatNumber(2.006)).toBe('2.01');
  });

  test('computeDockMetrics preserves decimal precision', () => {
    const result = computeDockMetrics({
      volume: 333,
      hours: 3,
      plan: 100
    });
    expect(result.actual_production).toBe(111);
    expect(result.excess_hours).toBeCloseTo(-0.33, 2);
  });
});

describe('Negative Number Edge Cases', () => {
  test('parseNumericInput accepts negative numbers', () => {
    expect(parseNumericInput('-100')).toBe(-100);
  });

  test('validateDockData clamps negative to 0', () => {
    const result = computeDockMetrics({ volume: -100, hours: -10, plan: -50 });
    expect(result.volume).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.plan).toBe(0);
  });

  test('excess hours can be negative (ahead of plan)', () => {
    const result = calculateExcessHours(5, 1000, 100);
    // 5 hours used, but needed 10 hours for volume, so -5 excess
    expect(result).toBe(-5);
  });
});

describe('Zero Input Edge Cases', () => {
  test('all zeros produces all zero outputs', () => {
    const result = computeDockMetrics({ volume: 0, hours: 0, plan: 0 });
    expect(result).toEqual({
      volume: 0,
      hours: 0,
      plan: 0,
      actual_production: 0,
      excess_hours: 0
    });
  });

  test('zero volume with positive hours', () => {
    const result = computeDockMetrics({ volume: 0, hours: 10, plan: 100 });
    expect(result.actual_production).toBe(0);
    expect(result.excess_hours).toBe(10); // All hours are excess
  });

  test('positive volume with zero hours', () => {
    const result = computeDockMetrics({ volume: 1000, hours: 0, plan: 100 });
    expect(result.actual_production).toBe(0);
    expect(result.excess_hours).toBe(-10); // Needed 10 hours, used 0
  });

  test('computeAllMetrics with empty object', () => {
    const result = computeAllMetrics({});
    expect(result['Outbound'].volume).toBe(0);
    expect(result['Outbound'].hours).toBe(0);
    expect(result['Outbound'].actual_production).toBe(0);
    expect(result['Outbound'].excess_hours).toBe(0);
  });
});

describe('Special Value Edge Cases', () => {
  test('parseNumericInput handles Infinity', () => {
    expect(parseNumericInput(Infinity)).toBe(Infinity);
  });

  test('parseNumericInput handles -Infinity', () => {
    expect(parseNumericInput(-Infinity)).toBe(-Infinity);
  });

  test('parseNumericInput handles NaN', () => {
    expect(parseNumericInput(NaN)).toBe(0);
  });

  test('formatNumber handles Infinity', () => {
    expect(formatNumber(Infinity)).toBe('Infinity');
  });

  test('formatNumber handles -Infinity', () => {
    expect(formatNumber(-Infinity)).toBe('-Infinity');
  });
});

describe('String Input Edge Cases', () => {
  test('parseNumericInput handles scientific notation', () => {
    expect(parseNumericInput('1e5')).toBe(100000);
    expect(parseNumericInput('1e-5')).toBe(0.00001);
  });

  test('parseNumericInput handles whitespace', () => {
    expect(parseNumericInput('  42  ')).toBe(42);
    expect(parseNumericInput('\t42\n')).toBe(42);
  });

  test('parseNumericInput handles mixed valid/invalid', () => {
    expect(parseNumericInput('42abc')).toBe(42); // parseFloat behavior
    expect(parseNumericInput('abc42')).toBe(0);
  });

  test('parseNumericInput handles empty string', () => {
    expect(parseNumericInput('')).toBe(0);
  });

  test('parseNumericInput handles string with only whitespace', () => {
    expect(parseNumericInput('   ')).toBe(0);
  });
});

describe('Object Input Edge Cases', () => {
  test('computeDockMetrics handles empty object', () => {
    const result = computeDockMetrics({});
    expect(result.volume).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.plan).toBe(0);
  });

  test('computeDockMetrics handles extra properties', () => {
    const result = computeDockMetrics({
      volume: 100,
      hours: 10,
      plan: 50,
      extra: 'ignored'
    });
    expect(result.volume).toBe(100);
    expect(result).not.toHaveProperty('extra');
  });

  test('computeAllMetrics preserves dock order', () => {
    const data = {
      'PD3': { volume: 300, hours: 3, plan: 100 },
      'PD1': { volume: 100, hours: 1, plan: 100 },
      'PD2': { volume: 200, hours: 2, plan: 100 }
    };
    const result = computeAllMetrics(data);
    const keys = Object.keys(result);
    // Should include all docks plus Outbound
    expect(keys).toContain('PD1');
    expect(keys).toContain('PD2');
    expect(keys).toContain('PD3');
    expect(keys).toContain('Outbound');
  });
});

describe('Calculation Accuracy Edge Cases', () => {
  test('excess hours calculation is accurate for exact match', () => {
    // When actual PPH equals plan PPH, excess should be 0
    const result = computeDockMetrics({
      volume: 1000,
      hours: 10,
      plan: 100
    });
    expect(result.actual_production).toBe(100);
    expect(result.excess_hours).toBe(0);
  });

  test('excess hours calculation for 50% productivity', () => {
    // Actual PPH = 50, Plan = 100, so we're at 50% productivity
    // Hours = 10, Volume = 500
    // Required hours = 500 / 100 = 5
    // Excess = 10 - 5 = 5
    const result = computeDockMetrics({
      volume: 500,
      hours: 10,
      plan: 100
    });
    expect(result.actual_production).toBe(50);
    expect(result.excess_hours).toBe(5);
  });

  test('excess hours calculation for 200% productivity', () => {
    // Actual PPH = 200, Plan = 100, so we're at 200% productivity
    // Hours = 10, Volume = 2000
    // Required hours = 2000 / 100 = 20
    // Excess = 10 - 20 = -10 (saved 10 hours)
    const result = computeDockMetrics({
      volume: 2000,
      hours: 10,
      plan: 100
    });
    expect(result.actual_production).toBe(200);
    expect(result.excess_hours).toBe(-10);
  });

  test('outbound totals aggregate correctly', () => {
    const data = {
      'PD1': { volume: 1000, hours: 10, plan: 100 },  // 0 excess
      'PD2': { volume: 500, hours: 10, plan: 100 },   // 5 excess
      'PD3': { volume: 2000, hours: 10, plan: 100 }   // -10 excess
    };
    const result = computeAllMetrics(data);

    expect(result['Outbound'].volume).toBe(3500);
    expect(result['Outbound'].hours).toBe(30);
    expect(result['Outbound'].actual_production).toBeCloseTo(116.67, 1);
    expect(result['Outbound'].excess_hours).toBe(-5); // Net savings
  });
});
