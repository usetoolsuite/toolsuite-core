import { describe, expect, it } from 'vitest';
import { computeDiff } from '../src/diff-checker.js';

describe('computeDiff', () => {
    it('reports identical texts', () => {
        const res = computeDiff('a\nb', 'a\nb');
        expect(res.success).toBe(true);
        expect(res.lines?.every(l => l.type === 'unchanged')).toBe(true);
    });

    it('detects added and removed lines', () => {
        const res = computeDiff('one\ntwo\nthree', 'one\nthree\nfour');
        expect(res.success).toBe(true);
        const types = new Set(res.lines?.map(l => l.type));
        expect(types.size).toBeGreaterThan(1);
    });

    it('rejects two empty inputs', () => {
        expect(computeDiff('', '').success).toBe(false);
    });
});
