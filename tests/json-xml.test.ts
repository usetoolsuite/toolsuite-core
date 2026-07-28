import { describe, expect, it } from 'vitest';
import { jsonToXml } from '../src/json-xml.js';

describe('jsonToXml', () => {
    it('converts a flat object', () => {
        const res = jsonToXml('{"name":"Ada","age":36}');
        expect(res.success).toBe(true);
        expect(res.output).toContain('<name>Ada</name>');
        expect(res.output).toContain('<age>36</age>');
    });

    it('escapes XML special characters', () => {
        const res = jsonToXml('{"note":"a < b & c"}');
        expect(res.success).toBe(true);
        expect(res.output).toContain('&lt;');
        expect(res.output).toContain('&amp;');
    });

    it('rejects invalid JSON', () => {
        expect(jsonToXml('{bad').success).toBe(false);
    });
});
