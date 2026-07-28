import { describe, expect, it } from 'vitest';
import { jsonToTypescript } from '../src/json-to-typescript.js';

describe('jsonToTypescript', () => {
    it('generates an interface from an object', () => {
        const res = jsonToTypescript('{"name":"Ada","age":36,"active":true}');
        expect(res.success).toBe(true);
        expect(res.output).toContain('interface RootObject');
        expect(res.output).toContain('name: string');
        expect(res.output).toContain('age: number');
        expect(res.output).toContain('active: boolean');
    });

    it('honours a custom root name', () => {
        const res = jsonToTypescript('{"a":1}', { rootName: 'User' });
        expect(res.output).toContain('User');
    });

    it('handles nested objects and arrays', () => {
        const res = jsonToTypescript('{"user":{"id":1},"tags":["x"]}');
        expect(res.success).toBe(true);
        expect(res.output).toContain('tags: string[]');
    });

    it('rejects invalid JSON', () => {
        expect(jsonToTypescript('nope{').success).toBe(false);
    });
});
