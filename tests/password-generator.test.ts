import { describe, expect, it } from 'vitest';
import { generatePassword, type PasswordOptions } from '../src/password-generator.js';

const baseOptions: PasswordOptions = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    excludeAmbiguous: false,
    excludeSimilar: false,
    customExclude: '',
    count: 1,
};

describe('generatePassword', () => {
    it('generates a password of the requested length', () => {
        const res = generatePassword(baseOptions);
        expect(res.success).toBe(true);
        expect(res.output.trim()).toHaveLength(16);
    });

    it('respects character-set options', () => {
        const res = generatePassword({ ...baseOptions, uppercase: false, numbers: false, length: 32 });
        expect(res.output.trim()).toMatch(/^[a-z]+$/);
    });

    it('generates distinct passwords', () => {
        const a = generatePassword(baseOptions).output;
        const b = generatePassword(baseOptions).output;
        expect(a).not.toBe(b);
    });

    it('rejects out-of-range lengths', () => {
        expect(generatePassword({ ...baseOptions, length: 2 }).success).toBe(false);
        expect(generatePassword({ ...baseOptions, length: 500 }).success).toBe(false);
    });
});
