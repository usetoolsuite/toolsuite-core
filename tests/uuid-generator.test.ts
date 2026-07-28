import { describe, expect, it } from 'vitest';
import { generateUuids, type UuidOptions } from '../src/uuid-generator.js';

const baseOptions: UuidOptions = {
    count: 1,
    version: 'v4',
    uppercase: false,
    separator: 'hyphen',
    prefix: '',
};

describe('generateUuids', () => {
    it('generates valid v4 UUIDs', () => {
        const res = generateUuids({ ...baseOptions, count: 5 });
        expect(res.success).toBe(true);
        const lines = res.output.trim().split('\n');
        expect(lines).toHaveLength(5);
        for (const line of lines) {
            expect(line).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        }
    });

    it('generates v7 UUIDs with monotonic timestamps', () => {
        const res = generateUuids({ ...baseOptions, version: 'v7', count: 2 });
        expect(res.success).toBe(true);
        const [a, b] = res.output.trim().split('\n');
        expect(a.slice(0, 8) <= b.slice(0, 8)).toBe(true);
    });

    it('supports uppercase and no separator', () => {
        const res = generateUuids({ ...baseOptions, uppercase: true, separator: 'none' });
        expect(res.output.trim()).toMatch(/^[0-9A-F]{32}$/);
    });

    it('rejects out-of-range count', () => {
        expect(generateUuids({ ...baseOptions, count: 0 }).success).toBe(false);
        expect(generateUuids({ ...baseOptions, count: 101 }).success).toBe(false);
    });
});
