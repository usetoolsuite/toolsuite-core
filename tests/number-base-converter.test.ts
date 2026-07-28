import { describe, expect, it } from 'vitest';
import { convertBase } from '../src/number-base-converter.js';

describe('convertBase', () => {
    it('converts decimal 255 to other bases', () => {
        const res = convertBase('255', 10);
        expect(res.success).toBe(true);
        expect(res.output.toLowerCase()).toContain('ff');
        expect(res.output).toContain('11111111');
    });

    it('converts from binary', () => {
        const res = convertBase('1010', 2);
        expect(res.success).toBe(true);
        expect(res.output).toContain('10');
    });

    it('rejects digits invalid for the base', () => {
        expect(convertBase('2', 2).success).toBe(false);
        expect(convertBase('zz', 10).success).toBe(false);
    });

    it('rejects empty input', () => {
        expect(convertBase('', 10).success).toBe(false);
    });
});
