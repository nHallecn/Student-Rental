import { describe, expect, it } from 'vitest';
import { availabilityColor, formatMoney, titleCase } from './format';

describe('mobile presentation helpers', () => {
  it('formats local rental prices and domain labels', () => {
    expect(formatMoney(50000)).toContain('50');
    expect(formatMoney(50000)).toContain('FCFA');
    expect(titleCase('AVAILABLE_SOON')).toBe('Available Soon');
  });

  it('uses distinct availability colors', () => {
    expect(availabilityColor('AVAILABLE')).not.toBe(availabilityColor('OCCUPIED'));
    expect(availabilityColor('UNCONFIRMED')).not.toBe(availabilityColor('AVAILABLE_SOON'));
  });
});

