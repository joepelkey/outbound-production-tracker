/**
 * Dock management functions for Outbound Production Tracker
 */

import { AVAILABLE_DOCKS, isValidDock } from './metrics.js';

/**
 * Creates a dock manager instance
 * @returns {object} Dock manager with add, remove, has, getAll, clear methods
 */
export function createDockManager() {
  const addedDocks = new Set();

  return {
    /**
     * Adds a dock to the manager
     * @param {string} dockName - Name of the dock to add
     * @returns {object} Result with success status and message
     */
    add(dockName) {
      if (!dockName || typeof dockName !== 'string') {
        return { success: false, message: 'Invalid dock name' };
      }

      if (!isValidDock(dockName)) {
        return { success: false, message: `${dockName} is not a valid dock` };
      }

      if (addedDocks.has(dockName)) {
        return { success: false, message: `${dockName} is already added` };
      }

      addedDocks.add(dockName);
      return { success: true, message: `${dockName} added successfully` };
    },

    /**
     * Removes a dock from the manager
     * @param {string} dockName - Name of the dock to remove
     * @returns {object} Result with success status and message
     */
    remove(dockName) {
      if (!dockName || typeof dockName !== 'string') {
        return { success: false, message: 'Invalid dock name' };
      }

      if (!addedDocks.has(dockName)) {
        return { success: false, message: `${dockName} is not in the list` };
      }

      addedDocks.delete(dockName);
      return { success: true, message: `${dockName} removed successfully` };
    },

    /**
     * Checks if a dock is currently added
     * @param {string} dockName - Name of the dock to check
     * @returns {boolean} True if dock is added
     */
    has(dockName) {
      return addedDocks.has(dockName);
    },

    /**
     * Gets all added docks
     * @returns {string[]} Array of added dock names
     */
    getAll() {
      return Array.from(addedDocks);
    },

    /**
     * Gets the count of added docks
     * @returns {number} Number of added docks
     */
    count() {
      return addedDocks.size;
    },

    /**
     * Clears all docks
     */
    clear() {
      addedDocks.clear();
    },

    /**
     * Gets available docks that haven't been added yet
     * @returns {string[]} Array of available dock names
     */
    getAvailable() {
      return AVAILABLE_DOCKS.filter(dock => !addedDocks.has(dock));
    }
  };
}

/**
 * Generates a DOM-safe ID from a dock name
 * @param {string} dockName - Dock name to convert
 * @returns {string} DOM-safe ID
 */
export function getDockElementId(dockName) {
  if (!dockName || typeof dockName !== 'string') {
    return '';
  }
  return 'dock-' + dockName.replace(/\s/g, '-');
}

/**
 * Parses a dock element ID back to a dock name
 * @param {string} elementId - Element ID to parse
 * @returns {string} Dock name
 */
export function parseDockElementId(elementId) {
  if (!elementId || typeof elementId !== 'string') {
    return '';
  }
  // Remove 'dock-' prefix and convert dashes back to spaces for known docks
  const name = elementId.replace(/^dock-/, '');

  // Check if this matches a known dock (handle space-to-dash conversion)
  for (const dock of AVAILABLE_DOCKS) {
    if (getDockElementId(dock) === elementId) {
      return dock;
    }
  }

  return name;
}
