import type { ToolResult } from './types.js';

export type EncodeMode = 'minimal' | 'all-named' | 'decimal' | 'hex';

const ENCODE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

// Extended named entities for common non-ASCII
const NAMED_ENTITIES: Record<string, string> = {
    '\u00A0': '&nbsp;', '\u00A9': '&copy;', '\u00AE': '&reg;',
    '\u2122': '&trade;', '\u00AB': '&laquo;', '\u00BB': '&raquo;',
    '\u2013': '&ndash;', '\u2014': '&mdash;', '\u2018': '&lsquo;',
    '\u2019': '&rsquo;', '\u201C': '&ldquo;', '\u201D': '&rdquo;',
    '\u2026': '&hellip;', '\u00D7': '&times;', '\u00F7': '&divide;',
    '\u00B0': '&deg;', '\u00B1': '&plusmn;', '\u00BC': '&frac14;',
    '\u00BD': '&frac12;', '\u00BE': '&frac34;', '\u00BF': '&iquest;',
    '\u00C0': '&Agrave;', '\u00C1': '&Aacute;', '\u00C9': '&Eacute;',
    '\u00D1': '&Ntilde;', '\u00DC': '&Uuml;', '\u00E0': '&agrave;',
    '\u00E1': '&aacute;', '\u00E8': '&egrave;', '\u00E9': '&eacute;',
    '\u00F1': '&ntilde;', '\u00FC': '&uuml;', '\u20AC': '&euro;',
    '\u00A3': '&pound;', '\u00A5': '&yen;', '\u00A2': '&cent;',
};

const DECODE_MAP: Record<string, string> = {};
for (const [char, entity] of Object.entries(ENCODE_MAP)) {
    DECODE_MAP[entity] = char;
}
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
    DECODE_MAP[entity] = char;
}

export function encodeHtmlEntities(input: string, mode: EncodeMode = 'minimal'): ToolResult {
    if (!input) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    let encoded = '';

    if (mode === 'minimal') {
        encoded = input.replace(/[&<>"'`=/]/g, (char) => ENCODE_MAP[char] || char);
    } else if (mode === 'all-named') {
        // Encode special HTML chars + use named entities for known non-ASCII
        encoded = input.replace(/[&<>"'`=/]/g, (char) => ENCODE_MAP[char] || char);
        encoded = Array.from(encoded).map(char => {
            if (NAMED_ENTITIES[char]) return NAMED_ENTITIES[char];
            const code = char.charCodeAt(0);
            if (code > 127) return `&#${code};`;
            return char;
        }).join('');
    } else if (mode === 'decimal') {
        encoded = Array.from(input).map(char => {
            const code = char.charCodeAt(0);
            if (code > 127 || /[&<>"'`=/]/.test(char)) return `&#${code};`;
            return char;
        }).join('');
    } else if (mode === 'hex') {
        encoded = Array.from(input).map(char => {
            const code = char.charCodeAt(0);
            if (code > 127 || /[&<>"'`=/]/.test(char)) return `&#x${code.toString(16).toUpperCase()};`;
            return char;
        }).join('');
    }

    return { success: true, output: encoded };
}

export function decodeHtmlEntities(input: string): ToolResult {
    if (!input) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    let decoded = input;

    // Decode named entities from our map
    for (const [entity, char] of Object.entries(DECODE_MAP)) {
        decoded = decoded.split(entity).join(char);
    }

    // Decode decimal numeric entities like &#60;
    decoded = decoded.replace(/&#(\d+);/g, (_, code) => {
        return String.fromCharCode(parseInt(code, 10));
    });

    // Decode hex numeric entities like &#x3C;
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
        return String.fromCharCode(parseInt(code, 16));
    });

    return { success: true, output: decoded };
}

export function getCharacterInfo(input: string): ToolResult {
    if (!input) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    const chars = Array.from(input);
    const lines = chars.slice(0, 100).map(char => {
        const code = char.codePointAt(0) || 0;
        const hex = code.toString(16).toUpperCase().padStart(4, '0');
        const dec = `&#${code};`;
        const hexEntity = `&#x${hex};`;
        const named = NAMED_ENTITIES[char] || ENCODE_MAP[char] || '-';
        return `${char}\tU+${hex}\t${dec}\t${hexEntity}\t${named}`;
    });

    const header = 'Char\tUnicode\tDecimal\tHex\tNamed';
    return { success: true, output: [header, ...lines].join('\n') };
}
