import type { ToolResult } from './types.js';

/**
 * Minimal JSONPath engine — covers the most common operators:
 * $            root
 * .key         child
 * ['key']      bracket child
 * [n]          array index
 * [start:end]  array slice
 * [*]          wildcard index
 * .*           wildcard child
 * ..key        recursive descent
 * ?(@...)      filter expression (==, !=, <, >, <=, >=)
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

/* ── Tokeniser ─────────────────────────────────── */

interface Token {
    type: 'root' | 'child' | 'index' | 'slice' | 'wildcard' | 'recursive' | 'filter';
    value: string;
    start?: number;
    end?: number;
}

function tokenise(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    if (expr[i] !== '$') throw new Error('JSONPath must start with $');
    tokens.push({ type: 'root', value: '$' });
    i++;

    while (i < expr.length) {
        if (expr[i] === '.') {
            i++;
            if (expr[i] === '.') {
                // recursive descent
                i++;
                let key = '';
                if (expr[i] === '*') { key = '*'; i++; }
                else { while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; } }
                tokens.push({ type: 'recursive', value: key });
            } else if (expr[i] === '*') {
                tokens.push({ type: 'wildcard', value: '*' });
                i++;
            } else {
                let key = '';
                while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') { key += expr[i]; i++; }
                if (key) tokens.push({ type: 'child', value: key });
            }
        } else if (expr[i] === '[') {
            i++;
            // Determine bracket content
            let content = '';
            let depth = 1;
            while (i < expr.length && depth > 0) {
                if (expr[i] === '[') depth++;
                if (expr[i] === ']') { depth--; if (depth === 0) break; }
                content += expr[i];
                i++;
            }
            i++; // skip ]

            content = content.trim();

            if (content === '*') {
                tokens.push({ type: 'wildcard', value: '*' });
            } else if (content.startsWith('?')) {
                tokens.push({ type: 'filter', value: content });
            } else if (content.includes(':')) {
                const parts = content.split(':');
                tokens.push({ type: 'slice', value: content, start: parts[0] ? parseInt(parts[0]) : undefined, end: parts[1] ? parseInt(parts[1]) : undefined } as any);
            } else if (/^-?\d+$/.test(content)) {
                tokens.push({ type: 'index', value: content });
            } else {
                // String key like ['key']
                const key = content.replace(/^['"]/,'').replace(/['"]$/,'');
                tokens.push({ type: 'child', value: key });
            }
        } else {
            i++;
        }
    }
    return tokens;
}

/* ── Evaluator ─────────────────────────────────── */

function resolve(data: JsonValue, tokens: Token[]): JsonValue[] {
    let current: JsonValue[] = [data];

    for (let t = 0; t < tokens.length; t++) {
        const tok = tokens[t];
        let next: JsonValue[] = [];

        for (const node of current) {
            switch (tok.type) {
                case 'root':
                    next.push(node);
                    break;

                case 'child':
                    if (node && typeof node === 'object' && !Array.isArray(node)) {
                        if (tok.value in node) next.push(node[tok.value]);
                    }
                    break;

                case 'index': {
                    if (Array.isArray(node)) {
                        let idx = parseInt(tok.value);
                        if (idx < 0) idx = node.length + idx;
                        if (idx >= 0 && idx < node.length) next.push(node[idx]);
                    }
                    break;
                }

                case 'slice': {
                    if (Array.isArray(node)) {
                        const parts = tok.value.split(':');
                        const start = parts[0] ? parseInt(parts[0]) : 0;
                        const end = parts[1] ? parseInt(parts[1]) : node.length;
                        next.push(...node.slice(start < 0 ? node.length + start : start, end < 0 ? node.length + end : end));
                    }
                    break;
                }

                case 'wildcard':
                    if (Array.isArray(node)) {
                        next.push(...node);
                    } else if (node && typeof node === 'object') {
                        next.push(...Object.values(node));
                    }
                    break;

                case 'recursive': {
                    const key = tok.value;
                    const collect = (v: JsonValue) => {
                        if (v && typeof v === 'object') {
                            if (Array.isArray(v)) {
                                if (key === '*') next.push(...v);
                                v.forEach(collect);
                            } else {
                                if (key === '*') next.push(...Object.values(v));
                                else if (key in v) next.push(v[key]);
                                Object.values(v).forEach(collect);
                            }
                        }
                    };
                    collect(node);
                    break;
                }

                case 'filter': {
                    // ?(@.prop op value)
                    if (Array.isArray(node)) {
                        const filterContent = tok.value.slice(2, -1).trim(); // remove ?( and )
                        const match = filterContent.match(/^@\.(\w+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
                        if (match) {
                            const [, prop, op, rawVal] = match;
                            const val = rawVal.replace(/^['"]/,'').replace(/['"]$/,'');
                            const numVal = Number(val);
                            const isNum = !isNaN(numVal) && val.trim() !== '';

                            node.forEach(item => {
                                if (item && typeof item === 'object' && !Array.isArray(item) && prop in item) {
                                    const itemVal = (item as any)[prop];
                                    let result = false;
                                    const a = isNum ? Number(itemVal) : String(itemVal);
                                    const b = isNum ? numVal : val;
                                    switch (op) {
                                        case '==': result = a == b; break;
                                        case '!=': result = a != b; break;
                                        case '<':  result = a < b; break;
                                        case '>':  result = a > b; break;
                                        case '<=': result = a <= b; break;
                                        case '>=': result = a >= b; break;
                                    }
                                    if (result) next.push(item);
                                }
                            });
                        }
                    }
                    break;
                }
            }
        }
        current = next;
    }
    return current;
}

/* ── Public API ─────────────────────────────────── */

export function queryJsonPath(json: string, path: string): ToolResult & { matchCount?: number } {
    if (!json.trim()) return { success: false, output: '', error: 'Please paste JSON data.' };
    if (!path.trim()) return { success: false, output: '', error: 'Please enter a JSONPath expression.' };

    let data: JsonValue;
    try {
        data = JSON.parse(json);
    } catch (e) {
        return { success: false, output: '', error: `Invalid JSON: ${(e as Error).message}` };
    }

    try {
        const tokens = tokenise(path.trim());
        const results = resolve(data, tokens);

        if (results.length === 0) {
            return { success: true, output: 'No matches found.', matchCount: 0 };
        }

        const output = results.length === 1
            ? JSON.stringify(results[0], null, 2)
            : JSON.stringify(results, null, 2);

        return { success: true, output, matchCount: results.length };
    } catch (e) {
        return { success: false, output: '', error: `JSONPath error: ${(e as Error).message}` };
    }
}

export function buildPathTree(json: string): ToolResult {
    if (!json.trim()) return { success: false, output: '', error: 'Please paste JSON data.' };

    let data: JsonValue;
    try {
        data = JSON.parse(json);
    } catch (e) {
        return { success: false, output: '', error: `Invalid JSON: ${(e as Error).message}` };
    }

    const paths: string[] = [];

    function walk(val: JsonValue, prefix: string) {
        if (val && typeof val === 'object') {
            if (Array.isArray(val)) {
                paths.push(`${prefix}  (array[${val.length}])`);
                val.forEach((item, i) => {
                    walk(item, `${prefix}[${i}]`);
                });
            } else {
                for (const [k, v] of Object.entries(val)) {
                    const p = /^[a-zA-Z_]\w*$/.test(k) ? `${prefix}.${k}` : `${prefix}['${k}']`;
                    if (v && typeof v === 'object') {
                        walk(v, p);
                    } else {
                        const type = v === null ? 'null' : typeof v;
                        const display = typeof v === 'string' ? `"${v.length > 40 ? v.slice(0, 40) + '…' : v}"` : String(v);
                        paths.push(`${p}  →  ${display}  (${type})`);
                    }
                }
            }
        }
    }

    walk(data, '$');
    return { success: true, output: paths.join('\n') };
}
