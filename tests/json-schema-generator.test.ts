import { describe, expect, it } from 'vitest';
import { generateJsonSchema } from '../src/json-schema-generator.js';

describe('generateJsonSchema', () => {
    it('infers object properties and types', () => {
        const res = generateJsonSchema('{"name":"Ada","age":36,"tags":["a"]}');
        expect(res.success).toBe(true);
        expect(res.schema).not.toBeNull();
        const schema = res.schema as any;
        expect(schema.properties.name.type).toBe('string');
        expect(schema.properties.age.type).toBe('integer');
        expect(schema.properties.tags.type).toBe('array');
    });

    it('rejects invalid JSON', () => {
        expect(generateJsonSchema('{oops').success).toBe(false);
    });
});
