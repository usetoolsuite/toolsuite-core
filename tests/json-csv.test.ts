import { describe, expect, it } from 'vitest';
import { csvToJson, jsonToCsv } from '../src/json-csv.js';

describe('json <-> csv', () => {
    it('converts an array of objects to CSV', () => {
        const res = jsonToCsv('[{"name":"Ada","age":36},{"name":"Alan","age":41}]');
        expect(res.success).toBe(true);
        expect(res.output).toContain('name');
        expect(res.output).toContain('Ada');
    });

    it('converts CSV back to JSON', () => {
        const res = csvToJson('name,age\nAda,36\nAlan,41');
        expect(res.success).toBe(true);
        const parsed = JSON.parse(res.output);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('Ada');
    });

    it('handles quoted fields containing delimiters', () => {
        const res = csvToJson('name,notes\n"Doe, Jane","said ""hi"""');
        expect(res.success).toBe(true);
        const parsed = JSON.parse(res.output);
        expect(parsed[0].name).toBe('Doe, Jane');
    });

    it('rejects invalid JSON', () => {
        expect(jsonToCsv('{nope').success).toBe(false);
    });
});
