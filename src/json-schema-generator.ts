import type { ToolResult } from './types.js';

export interface JsonSchemaResult extends ToolResult {
    schema: object | null;
}

interface SchemaNode {
    type?: string | string[];
    properties?: Record<string, SchemaNode>;
    items?: SchemaNode;
    required?: string[];
    enum?: unknown[];
    format?: string;
    description?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    additionalProperties?: boolean;
    oneOf?: SchemaNode[];
    $schema?: string;
    title?: string;
}

function detectFormat(value: string): string | undefined {
    // Date-time ISO 8601
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date-time';
    // Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
    // Time
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return 'time';
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    // URI
    if (/^https?:\/\//.test(value)) return 'uri';
    // IPv4
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return 'ipv4';
    // IPv6
    if (/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(value)) return 'ipv6';
    // UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
    return undefined;
}

function inferSchema(value: unknown, allRequired: boolean): SchemaNode {
    if (value === null) {
        return { type: 'null' };
    }

    if (typeof value === 'string') {
        const schema: SchemaNode = { type: 'string' };
        const format = detectFormat(value);
        if (format) schema.format = format;
        return schema;
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    }

    if (typeof value === 'boolean') {
        return { type: 'boolean' };
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { type: 'array', items: {} };
        }

        // Check if all items have the same type
        const types = value.map(v => typeof v);
        const allSameType = types.every(t => t === types[0]);

        if (allSameType && types[0] !== 'object') {
            return { type: 'array', items: inferSchema(value[0], allRequired) };
        }

        // If all objects, merge their schemas
        if (value.every(v => v !== null && typeof v === 'object' && !Array.isArray(v))) {
            const merged = mergeObjectSchemas(value as Record<string, unknown>[], allRequired);
            return { type: 'array', items: merged };
        }

        // Mixed types — use oneOf
        const uniqueSchemas: SchemaNode[] = [];
        const seenTypes = new Set<string>();
        for (const item of value) {
            const s = inferSchema(item, allRequired);
            const key = JSON.stringify(s);
            if (!seenTypes.has(key)) {
                seenTypes.add(key);
                uniqueSchemas.push(s);
            }
        }

        if (uniqueSchemas.length === 1) {
            return { type: 'array', items: uniqueSchemas[0] };
        }

        return { type: 'array', items: { oneOf: uniqueSchemas } };
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const properties: Record<string, SchemaNode> = {};
        const required: string[] = [];

        for (const [key, val] of Object.entries(obj)) {
            properties[key] = inferSchema(val, allRequired);
            if (allRequired) {
                required.push(key);
            }
        }

        const schema: SchemaNode = { type: 'object', properties };
        if (required.length > 0) schema.required = required;
        schema.additionalProperties = false;
        return schema;
    }

    return {};
}

function mergeObjectSchemas(objects: Record<string, unknown>[], allRequired: boolean): SchemaNode {
    const allKeys = new Set<string>();
    for (const obj of objects) {
        for (const key of Object.keys(obj)) {
            allKeys.add(key);
        }
    }

    const properties: Record<string, SchemaNode> = {};
    const required: string[] = [];

    for (const key of allKeys) {
        const values = objects.filter(o => key in o).map(o => o[key]);
        const schemas = values.map(v => inferSchema(v, allRequired));

        // Check if all schemas are the same
        const uniqueSchemas: SchemaNode[] = [];
        const seen = new Set<string>();
        for (const s of schemas) {
            const k = JSON.stringify(s);
            if (!seen.has(k)) {
                seen.add(k);
                uniqueSchemas.push(s);
            }
        }

        properties[key] = uniqueSchemas.length === 1 ? uniqueSchemas[0] : { oneOf: uniqueSchemas };

        // Key is required if it appears in all objects
        const appearsInAll = objects.every(o => key in o);
        if (allRequired && appearsInAll) {
            required.push(key);
        }
    }

    const schema: SchemaNode = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    schema.additionalProperties = false;
    return schema;
}

export function generateJsonSchema(
    jsonInput: string,
    options: {
        title?: string;
        allRequired?: boolean;
        schemaVersion?: string;
        additionalProperties?: boolean;
    } = {}
): JsonSchemaResult {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
        return { success: false, output: '', error: 'Please enter JSON data.', schema: null };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid JSON';
        return { success: false, output: '', error: `Invalid JSON: ${msg}`, schema: null };
    }

    const allRequired = options.allRequired !== false;
    const schema = inferSchema(parsed, allRequired);

    // Add $schema and title at root
    const rootSchema: SchemaNode = {
        $schema: options.schemaVersion || 'https://json-schema.org/draft/2020-12/schema',
        ...schema,
    };

    if (options.title) {
        rootSchema.title = options.title;
    }

    if (options.additionalProperties !== undefined && rootSchema.type === 'object') {
        rootSchema.additionalProperties = options.additionalProperties;
    }

    const output = JSON.stringify(rootSchema, null, 2);

    return { success: true, output, schema: rootSchema };
}
