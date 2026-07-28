import type { ToolResult } from './types.js';

export type Delimiter = ',' | ';' | '\t' | '|';

export interface CsvOptions {
    delimiter: Delimiter;
    includeHeaders: boolean;
    flattenNested: boolean;
}

export const defaultCsvOptions: CsvOptions = {
    delimiter: ',',
    includeHeaders: true,
    flattenNested: false,
};

function flattenObject(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
        } else {
            result[newKey] = value;
        }
    }
    return result;
}

export function jsonToCsv(input: string, options: Partial<CsvOptions> = {}): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input is empty.' };
    }

    const opts = { ...defaultCsvOptions, ...options };

    let data: unknown;
    try {
        data = JSON.parse(input);
    } catch (e) {
        return { success: false, output: '', error: 'Invalid JSON: ' + (e instanceof Error ? e.message : String(e)) };
    }

    if (!Array.isArray(data)) {
        return { success: false, output: '', error: 'Input must be a JSON array.' };
    }

    if (data.length === 0) {
        return { success: false, output: '', error: 'Array is empty.' };
    }

    // Optionally flatten nested objects
    const processedData = opts.flattenNested
        ? data.map(item => flattenObject(item as Record<string, unknown>))
        : data;

    // Collect all headers from all objects (not just the first one)
    const headerSet = new Set<string>();
    for (const item of processedData) {
        for (const key of Object.keys(item as Record<string, unknown>)) {
            headerSet.add(key);
        }
    }
    const headers = Array.from(headerSet);

    function escapeCsvValue(val: unknown, delim: string): string {
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (str.includes(delim) || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    const rows: string[] = [];
    if (opts.includeHeaders) {
        rows.push(headers.map(h => escapeCsvValue(h, opts.delimiter)).join(opts.delimiter));
    }
    for (const item of processedData) {
        const obj = item as Record<string, unknown>;
        const row = headers.map(h => escapeCsvValue(obj[h], opts.delimiter));
        rows.push(row.join(opts.delimiter));
    }

    return { success: true, output: rows.join('\n') };
}

export function csvToJson(input: string, delimiter: Delimiter = ','): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input is empty.' };
    }

    const lines = input.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) {
        return { success: false, output: '', error: 'CSV must have a header row and at least one data row.' };
    }

    function parseCsvLine(line: string, delim: string): string[] {
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === delim) {
                    fields.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        fields.push(current);
        return fields;
    }

    const headers = parseCsvLine(lines[0], delimiter);
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i], delimiter);
        const obj: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j] ?? '';
        }
        result.push(obj);
    }

    return { success: true, output: JSON.stringify(result, null, 2) };
}
