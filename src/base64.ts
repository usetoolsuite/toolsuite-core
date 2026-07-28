import type { ToolResult } from './types.js';

export type Base64Variant = 'standard' | 'url-safe';

export interface Base64Options {
    variant: Base64Variant;
    lineBreaks: boolean; // MIME-style 76-char lines
}

const defaultOptions: Base64Options = {
    variant: 'standard',
    lineBreaks: false,
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const REVERSE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) REVERSE[ALPHABET[i]] = i;

/** Encode raw bytes to standard Base64. Works in Node and browsers alike. */
export function bytesToBase64(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
        out += ALPHABET[b0 >> 2];
        out += ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
        out += b1 === undefined ? '=' : ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
        out += b2 === undefined ? '=' : ALPHABET[b2 & 0x3f];
    }
    return out;
}

/** Decode standard Base64 to raw bytes. Throws on malformed input. */
export function base64ToBytes(b64: string): Uint8Array {
    const clean = b64.replace(/=+$/, '');
    if (!/^[A-Za-z0-9+/]*$/.test(clean)) throw new Error('Invalid Base64 character.');
    if (clean.length % 4 === 1) throw new Error('Invalid Base64 length.');
    const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
    let o = 0;
    for (let i = 0; i < clean.length; i += 4) {
        const n =
            (REVERSE[clean[i]] << 18) |
            ((REVERSE[clean[i + 1]] ?? 0) << 12) |
            ((REVERSE[clean[i + 2]] ?? 0) << 6) |
            (REVERSE[clean[i + 3]] ?? 0);
        out[o++] = (n >> 16) & 0xff;
        if (i + 2 < clean.length) out[o++] = (n >> 8) & 0xff;
        if (i + 3 < clean.length) out[o++] = n & 0xff;
    }
    return out;
}

function toUrlSafe(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafe(b64: string): string {
    let s = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return s;
}

function addLineBreaks(str: string): string {
    return str.replace(/.{76}/g, '$&\n').trim();
}

/** Encode a UTF-8 string to Base64. */
export function encode(input: string, options: Partial<Base64Options> = {}): ToolResult {
    const opts = { ...defaultOptions, ...options };
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }
    try {
        let result = bytesToBase64(new TextEncoder().encode(input));
        if (opts.variant === 'url-safe') {
            result = toUrlSafe(result);
        }
        if (opts.lineBreaks && opts.variant === 'standard') {
            result = addLineBreaks(result);
        }
        return { success: true, output: result };
    } catch {
        return { success: false, output: '', error: 'Encoding failed. Check your input.' };
    }
}

/** Decode Base64 to a UTF-8 string. */
export function decode(input: string, options: Partial<Base64Options> = {}): ToolResult {
    const opts = { ...defaultOptions, ...options };
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }
    try {
        let cleaned = input.trim().replace(/\s/g, '');
        if (opts.variant === 'url-safe') {
            cleaned = fromUrlSafe(cleaned);
        }
        return { success: true, output: new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(cleaned)) };
    } catch {
        return { success: false, output: '', error: 'Invalid Base64 string.' };
    }
}

/** Encode arbitrary binary data (e.g. file contents) to Base64. */
export function encodeBytes(data: ArrayBuffer | Uint8Array, options: Partial<Base64Options> = {}): ToolResult {
    const opts = { ...defaultOptions, ...options };
    try {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        let result = bytesToBase64(bytes);
        if (opts.variant === 'url-safe') {
            result = toUrlSafe(result);
        }
        if (opts.lineBreaks && opts.variant === 'standard') {
            result = addLineBreaks(result);
        }
        return { success: true, output: result };
    } catch {
        return { success: false, output: '', error: 'Failed to encode data.' };
    }
}

/** UTF-8 byte length of a string. */
export function getByteSize(str: string): number {
    return new TextEncoder().encode(str).length;
}
