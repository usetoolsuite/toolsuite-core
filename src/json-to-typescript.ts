import type { ToolResult } from './types.js';

interface ConvertOptions {
    rootName?: string;
    useInterface?: boolean;
    allOptional?: boolean;
    allReadonly?: boolean;
    useExport?: boolean;
}

interface TypeInfo {
    typeName: string;
    isInline: boolean;
}

let interfaces: string[] = [];
let interfaceNames: Map<string, number> = new Map();

function getUniqueName(base: string): string {
    const count = interfaceNames.get(base) ?? 0;
    interfaceNames.set(base, count + 1);
    return count === 0 ? base : `${base}${count}`;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function toInterfaceName(key: string): string {
    // Convert snake_case, kebab-case, etc. to PascalCase
    return key
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function inferType(value: unknown, name: string, useInterface: boolean): TypeInfo {
    if (value === null) {
        return { typeName: 'null', isInline: true };
    }

    if (Array.isArray(value)) {
        return inferArrayType(value, name, useInterface);
    }

    switch (typeof value) {
        case 'string':
            return { typeName: 'string', isInline: true };
        case 'number':
            return { typeName: 'number', isInline: true };
        case 'boolean':
            return { typeName: 'boolean', isInline: true };
        case 'object':
            return inferObjectType(value as Record<string, unknown>, name, useInterface);
        default:
            return { typeName: 'unknown', isInline: true };
    }
}

function inferArrayType(arr: unknown[], name: string, useInterface: boolean): TypeInfo {
    if (arr.length === 0) {
        return { typeName: 'unknown[]', isInline: true };
    }

    // Collect unique types from all elements
    const elementTypes = new Set<string>();
    let objectTypeRef: string | null = null;

    for (const item of arr) {
        if (item === null) {
            elementTypes.add('null');
        } else if (Array.isArray(item)) {
            const inner = inferArrayType(item, name, useInterface);
            elementTypes.add(inner.typeName);
        } else if (typeof item === 'object') {
            // For objects in arrays, generate a single merged interface
            if (!objectTypeRef) {
                const singularName = name.endsWith('s') ? name.slice(0, -1) : name;
                const info = inferObjectType(item as Record<string, unknown>, singularName, useInterface);
                objectTypeRef = info.typeName;
            }
            elementTypes.add(objectTypeRef);
        } else {
            elementTypes.add(typeof item);
        }
    }

    const types = Array.from(elementTypes);
    if (types.length === 1) {
        return { typeName: `${types[0]}[]`, isInline: true };
    }
    return { typeName: `(${types.join(' | ')})[]`, isInline: true };
}

// Module-level options set before each conversion run
let _allOptional = false;
let _allReadonly = false;
let _useExport = true;

function inferObjectType(
    obj: Record<string, unknown>,
    name: string,
    useInterface: boolean
): TypeInfo {
    const interfaceName = getUniqueName(toInterfaceName(name));
    const keys = Object.keys(obj);

    const lines: string[] = [];
    for (const key of keys) {
        const value = obj[key];
        const childName = capitalize(toInterfaceName(key));
        const typeInfo = inferType(value, childName, useInterface);

        // Make the property nullable if the value is null
        let finalType = typeInfo.typeName;
        if (value === null) {
            finalType = 'unknown | null';
        }

        // Use safe property key format
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        const optionalMark = _allOptional ? '?' : '';
        const readonlyPrefix = _allReadonly ? 'readonly ' : '';
        lines.push(`  ${readonlyPrefix}${safeKey}${optionalMark}: ${finalType};`);
    }

    const exportPrefix = _useExport ? 'export ' : '';
    if (useInterface) {
        interfaces.push(`${exportPrefix}interface ${interfaceName} {\n${lines.join('\n')}\n}`);
    } else {
        interfaces.push(`${exportPrefix}type ${interfaceName} = {\n${lines.join('\n')}\n};`);
    }

    return { typeName: interfaceName, isInline: false };
}

export function jsonToTypescript(
    input: string,
    options: ConvertOptions = {}
): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    const { rootName = 'RootObject', useInterface = true, allOptional = false, allReadonly = false, useExport = true } = options;

    // Reset state
    interfaces = [];
    interfaceNames = new Map();
    _allOptional = allOptional;
    _allReadonly = allReadonly;
    _useExport = useExport;

    let parsed: unknown;
    try {
        parsed = JSON.parse(input);
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid JSON';
        return {
            success: false,
            output: '',
            error: `Invalid JSON: ${msg}`,
        };
    }

    const exp = _useExport ? 'export ' : '';

    // Handle different root types
    if (parsed === null) {
        return { success: true, output: `${exp}type ${rootName} = null;\n` };
    }

    if (typeof parsed !== 'object') {
        const primitiveType = typeof parsed;
        return {
            success: true,
            output: `${exp}type ${rootName} = ${primitiveType};\n`,
        };
    }

    if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            return {
                success: true,
                output: `${exp}type ${rootName} = unknown[];\n`,
            };
        }

        const firstItem = parsed[0];
        if (firstItem !== null && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
            const itemName = rootName.endsWith('s')
                ? rootName.slice(0, -1)
                : `${rootName}Item`;
            inferObjectType(firstItem as Record<string, unknown>, itemName, useInterface);
            const itemTypeName = interfaces.length > 0
                ? interfaces[interfaces.length - 1].match(/(?:interface|type)\s+(\w+)/)?.[1] ?? itemName
                : itemName;
            const result = interfaces.join('\n\n') + `\n\n${exp}type ${rootName} = ${itemTypeName}[];\n`;
            return { success: true, output: result };
        }

        const typeInfo = inferArrayType(parsed, rootName, useInterface);
        return {
            success: true,
            output: `${exp}type ${rootName} = ${typeInfo.typeName};\n`,
        };
    }

    // Root is an object
    inferObjectType(parsed as Record<string, unknown>, rootName, useInterface);
    return {
        success: true,
        output: interfaces.join('\n\n') + '\n',
    };
}
