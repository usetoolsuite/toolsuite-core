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

    // The previous version of this test compared the first 8 hex characters of
    // two ids with <=. Two ids generated in the same millisecond share those
    // characters exactly, so the assertion passed no matter what the generator
    // did — including when it was not monotonic at all. This generates enough
    // to land inside one millisecond and requires STRICT ordering of the whole
    // id, which is the property v7 exists to provide.
    it('generates v7 UUIDs that sort strictly by creation order', () => {
        // 100 is this engine's per-call maximum, and far more than fits in a
        // single millisecond — which is exactly the condition that exposes a
        // non-monotonic v7.
        const res = generateUuids({ ...baseOptions, version: 'v7', count: 100 });
        expect(res.success).toBe(true);
        const ids = res.output.trim().split('\n');
        expect(ids).toHaveLength(100);
        for (let i = 1; i < ids.length; i++) {
            expect(ids[i] > ids[i - 1]).toBe(true);
        }
    });

    it('keeps the v7 version and variant nibbles intact while counting', () => {
        const res = generateUuids({ ...baseOptions, version: 'v7', count: 100 });
        for (const id of res.output.trim().split('\n')) {
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        }
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
