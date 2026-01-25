/**
 * Unit tests for dock management functionality
 */

import {
  createDockManager,
  getDockElementId,
  parseDockElementId
} from '../src/dockManager.js';

describe('createDockManager', () => {
  let manager;

  beforeEach(() => {
    manager = createDockManager();
  });

  describe('add', () => {
    test('successfully adds a valid dock', () => {
      const result = manager.add('PD1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('PD1 added successfully');
    });

    test('dock is present after adding', () => {
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);
    });

    test('prevents adding duplicate dock', () => {
      manager.add('PD1');
      const result = manager.add('PD1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('PD1 is already added');
    });

    test('rejects invalid dock name', () => {
      const result = manager.add('INVALID_DOCK');
      expect(result.success).toBe(false);
      expect(result.message).toBe('INVALID_DOCK is not a valid dock');
    });

    test('rejects empty string', () => {
      const result = manager.add('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('rejects null', () => {
      const result = manager.add(null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('rejects undefined', () => {
      const result = manager.add(undefined);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('rejects non-string types', () => {
      const result = manager.add(123);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('can add multiple different docks', () => {
      manager.add('PD1');
      manager.add('PD2');
      manager.add('SDs');
      expect(manager.count()).toBe(3);
    });

    test('handles docks with spaces in name', () => {
      const result = manager.add('HUB SEC');
      expect(result.success).toBe(true);
      expect(manager.has('HUB SEC')).toBe(true);
    });
  });

  describe('remove', () => {
    test('successfully removes an added dock', () => {
      manager.add('PD1');
      const result = manager.remove('PD1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('PD1 removed successfully');
    });

    test('dock is not present after removing', () => {
      manager.add('PD1');
      manager.remove('PD1');
      expect(manager.has('PD1')).toBe(false);
    });

    test('fails to remove dock that was not added', () => {
      const result = manager.remove('PD1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('PD1 is not in the list');
    });

    test('rejects empty string', () => {
      const result = manager.remove('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('rejects null', () => {
      const result = manager.remove(null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid dock name');
    });

    test('can re-add dock after removing', () => {
      manager.add('PD1');
      manager.remove('PD1');
      const result = manager.add('PD1');
      expect(result.success).toBe(true);
      expect(manager.has('PD1')).toBe(true);
    });

    test('removes only the specified dock', () => {
      manager.add('PD1');
      manager.add('PD2');
      manager.remove('PD1');
      expect(manager.has('PD1')).toBe(false);
      expect(manager.has('PD2')).toBe(true);
    });
  });

  describe('has', () => {
    test('returns true for added dock', () => {
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);
    });

    test('returns false for non-added dock', () => {
      expect(manager.has('PD1')).toBe(false);
    });

    test('returns false after dock is removed', () => {
      manager.add('PD1');
      manager.remove('PD1');
      expect(manager.has('PD1')).toBe(false);
    });

    test('handles non-string inputs gracefully', () => {
      expect(manager.has(null)).toBe(false);
      expect(manager.has(undefined)).toBe(false);
      expect(manager.has(123)).toBe(false);
    });
  });

  describe('getAll', () => {
    test('returns empty array when no docks added', () => {
      expect(manager.getAll()).toEqual([]);
    });

    test('returns array of all added docks', () => {
      manager.add('PD1');
      manager.add('PD2');
      const all = manager.getAll();
      expect(all).toContain('PD1');
      expect(all).toContain('PD2');
      expect(all).toHaveLength(2);
    });

    test('returns a copy, not the internal set', () => {
      manager.add('PD1');
      const all = manager.getAll();
      all.push('fake');
      expect(manager.getAll()).toHaveLength(1);
    });
  });

  describe('count', () => {
    test('returns 0 when no docks added', () => {
      expect(manager.count()).toBe(0);
    });

    test('returns correct count after adding', () => {
      manager.add('PD1');
      manager.add('PD2');
      expect(manager.count()).toBe(2);
    });

    test('decrements after removing', () => {
      manager.add('PD1');
      manager.add('PD2');
      manager.remove('PD1');
      expect(manager.count()).toBe(1);
    });
  });

  describe('clear', () => {
    test('removes all docks', () => {
      manager.add('PD1');
      manager.add('PD2');
      manager.add('SDs');
      manager.clear();
      expect(manager.count()).toBe(0);
      expect(manager.getAll()).toEqual([]);
    });

    test('does nothing on empty manager', () => {
      manager.clear();
      expect(manager.count()).toBe(0);
    });
  });

  describe('getAvailable', () => {
    test('returns all docks when none added', () => {
      const available = manager.getAvailable();
      expect(available).toHaveLength(16);
      expect(available).toContain('PD1');
      expect(available).toContain('PKG SEC');
    });

    test('excludes added docks', () => {
      manager.add('PD1');
      manager.add('PD2');
      const available = manager.getAvailable();
      expect(available).not.toContain('PD1');
      expect(available).not.toContain('PD2');
      expect(available).toHaveLength(14);
    });

    test('includes dock again after removal', () => {
      manager.add('PD1');
      manager.remove('PD1');
      const available = manager.getAvailable();
      expect(available).toContain('PD1');
    });
  });

  describe('isolation', () => {
    test('different managers are independent', () => {
      const manager2 = createDockManager();
      manager.add('PD1');
      expect(manager.has('PD1')).toBe(true);
      expect(manager2.has('PD1')).toBe(false);
    });
  });
});

describe('getDockElementId', () => {
  test('generates correct ID for simple dock name', () => {
    expect(getDockElementId('PD1')).toBe('dock-PD1');
  });

  test('replaces spaces with dashes', () => {
    expect(getDockElementId('HUB SEC')).toBe('dock-HUB-SEC');
    expect(getDockElementId('PKG SEC')).toBe('dock-PKG-SEC');
  });

  test('handles multiple spaces', () => {
    expect(getDockElementId('A B C')).toBe('dock-A-B-C');
  });

  test('returns empty string for empty input', () => {
    expect(getDockElementId('')).toBe('');
  });

  test('returns empty string for null', () => {
    expect(getDockElementId(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(getDockElementId(undefined)).toBe('');
  });

  test('returns empty string for non-string', () => {
    expect(getDockElementId(123)).toBe('');
  });
});

describe('parseDockElementId', () => {
  test('parses simple dock ID', () => {
    expect(parseDockElementId('dock-PD1')).toBe('PD1');
  });

  test('parses ID with spaces converted to dashes', () => {
    expect(parseDockElementId('dock-HUB-SEC')).toBe('HUB SEC');
    expect(parseDockElementId('dock-PKG-SEC')).toBe('PKG SEC');
  });

  test('returns empty string for empty input', () => {
    expect(parseDockElementId('')).toBe('');
  });

  test('returns empty string for null', () => {
    expect(parseDockElementId(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(parseDockElementId(undefined)).toBe('');
  });

  test('roundtrip conversion works for all docks', () => {
    const docks = ['PD1', 'PD10', 'SDs', 'HUB SEC', 'PKG SEC'];
    docks.forEach(dock => {
      const id = getDockElementId(dock);
      const parsed = parseDockElementId(id);
      expect(parsed).toBe(dock);
    });
  });
});
