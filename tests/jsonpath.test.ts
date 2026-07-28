import { describe, expect, it } from 'vitest';
import { queryJsonPath } from '../src/jsonpath.js';

const doc = JSON.stringify({
    store: {
        book: [
            { title: 'Sayings of the Century', price: 8.95 },
            { title: 'Moby Dick', price: 8.99 },
        ],
    },
});

describe('queryJsonPath', () => {
    it('queries a nested property', () => {
        const res = queryJsonPath(doc, '$.store.book[0].title');
        expect(res.success).toBe(true);
        expect(res.output).toContain('Sayings of the Century');
    });

    it('supports wildcards', () => {
        const res = queryJsonPath(doc, '$.store.book[*].price');
        expect(res.success).toBe(true);
        expect(res.matchCount).toBe(2);
    });

    it('rejects invalid JSON', () => {
        expect(queryJsonPath('{oops', '$.a').success).toBe(false);
    });

    it('rejects empty path', () => {
        expect(queryJsonPath(doc, '').success).toBe(false);
    });
});
