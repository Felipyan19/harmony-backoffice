import { describe, expect, it } from 'vitest';
import { normalizePhoneNumber } from './formatters';

describe('normalizePhoneNumber', () => {
  it('normalizes a Colombian mobile phone to E.164', () => {
    const result = normalizePhoneNumber('300 482 1198');

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe('+573004821198');
  });

  it('keeps invalid values without inventing a phone number', () => {
    const result = normalizePhoneNumber('123');

    expect(result.isValid).toBe(false);
    expect(result.e164).toBe('123');
  });
});
