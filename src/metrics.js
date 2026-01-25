/**
 * Core metrics calculation functions for Outbound Production Tracker
 */

/**
 * List of available docks in the system
 */
export const AVAILABLE_DOCKS = [
  'PD1', 'PD2', 'PD3', 'PD4', 'PD5', 'PD6', 'PD7',
  'PD8', 'PD9', 'PD10', 'PD11', 'PD12', 'PD13',
  'SDs', 'HUB SEC', 'PKG SEC'
];

/**
 * Default docks to display on page load
 */
export const DEFAULT_DOCKS = ['PD10', 'PD11', 'SDs', 'HUB SEC'];

/**
 * Calculates the actual production rate (PPH - packages per hour)
 * @param {number} volume - Total volume/packages processed
 * @param {number} hours - Hours worked
 * @returns {number} Actual production rate (PPH)
 */
export function calculateActualProduction(volume, hours) {
  if (typeof volume !== 'number' || typeof hours !== 'number') {
    throw new TypeError('Volume and hours must be numbers');
  }
  if (hours === 0) {
    return 0;
  }
  return volume / hours;
}

/**
 * Calculates excess hours (hours over/under plan)
 * Positive value = behind plan (used more hours than needed)
 * Negative value = ahead of plan (used fewer hours than needed)
 * @param {number} hours - Hours worked
 * @param {number} volume - Total volume processed
 * @param {number} plan - Planned production rate (PPH)
 * @returns {number} Excess hours
 */
export function calculateExcessHours(hours, volume, plan) {
  if (typeof hours !== 'number' || typeof volume !== 'number' || typeof plan !== 'number') {
    throw new TypeError('Hours, volume, and plan must be numbers');
  }
  if (plan === 0) {
    // When plan is 0, all hours are considered excess
    return hours;
  }
  // Excess = actual hours - required hours
  // Required hours = volume / plan
  return hours - (volume / plan);
}

/**
 * Parses a numeric input value, returning 0 for invalid inputs
 * @param {string|number} value - Input value to parse
 * @returns {number} Parsed number or 0
 */
export function parseNumericInput(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates dock data input
 * @param {object} dockData - Object containing volume, hours, plan
 * @returns {object} Validated data with defaults applied
 */
export function validateDockData(dockData) {
  return {
    volume: Math.max(0, parseNumericInput(dockData?.volume)),
    hours: Math.max(0, parseNumericInput(dockData?.hours)),
    plan: Math.max(0, parseNumericInput(dockData?.plan))
  };
}

/**
 * Computes metrics for a single dock
 * @param {object} dockData - Object with volume, hours, plan properties
 * @returns {object} Computed metrics including actual_production and excess_hours
 */
export function computeDockMetrics(dockData) {
  const validated = validateDockData(dockData);
  const { volume, hours, plan } = validated;

  return {
    volume,
    hours,
    plan,
    actual_production: calculateActualProduction(volume, hours),
    excess_hours: calculateExcessHours(hours, volume, plan)
  };
}

/**
 * Computes metrics for multiple docks and calculates totals
 * @param {Object<string, object>} docksData - Map of dock names to their data
 * @returns {Object<string, object>} Results including individual docks and Outbound totals
 */
export function computeAllMetrics(docksData) {
  if (!docksData || typeof docksData !== 'object') {
    throw new TypeError('docksData must be an object');
  }

  const results = {};
  let totalVolume = 0;
  let totalHours = 0;
  let totalExcess = 0;

  for (const [dockName, dockData] of Object.entries(docksData)) {
    const metrics = computeDockMetrics(dockData);
    results[dockName] = metrics;

    totalVolume += metrics.volume;
    totalHours += metrics.hours;
    totalExcess += metrics.excess_hours;
  }

  // Calculate outbound totals
  const outboundProduction = totalHours !== 0 ? totalVolume / totalHours : 0;
  results['Outbound'] = {
    volume: totalVolume,
    hours: totalHours,
    plan: null,
    actual_production: outboundProduction,
    excess_hours: totalExcess
  };

  return results;
}

/**
 * Formats a number to 2 decimal places
 * @param {number} value - Number to format
 * @returns {string} Formatted string
 */
export function formatNumber(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

/**
 * Checks if a dock name is valid
 * @param {string} dockName - Name to validate
 * @returns {boolean} True if valid dock name
 */
export function isValidDock(dockName) {
  return AVAILABLE_DOCKS.includes(dockName);
}
