import type { ToolResult } from './types.js';

export interface UuidOptions {
    count: number;
    version: 'v4' | 'v1' | 'v7' | 'ulid';
    uppercase: boolean;
    separator: 'hyphen' | 'none' | 'colon' | 'underscore';
    prefix: string;
}

function generateV4(): string {
    return crypto.randomUUID();
}

function generateV1(): string {
    const now = BigInt(Date.now());
    const greg = BigInt('122192928000000000');
    const ts = now * BigInt(10000) + greg;

    const timeLow = ts & BigInt(0xFFFFFFFF);
    const timeMid = (ts >> BigInt(32)) & BigInt(0xFFFF);
    const timeHi = ((ts >> BigInt(48)) & BigInt(0x0FFF)) | BigInt(0x1000);

    const clockSeq = new Uint8Array(2);
    crypto.getRandomValues(clockSeq);
    clockSeq[0] = (clockSeq[0] & 0x3F) | 0x80;

    const node = new Uint8Array(6);
    crypto.getRandomValues(node);
    node[0] |= 0x01;

    const hex = (n: bigint | number, len: number) => n.toString(16).padStart(len, '0');
    return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi, 4)}-${hex(clockSeq[0], 2)}${hex(clockSeq[1], 2)}-${Array.from(node).map(b => hex(b, 2)).join('')}`;
}

// RFC 9562 §6.2 monotonic counter. Without one, every v7 generated inside the
// same millisecond shares a timestamp and differs only in random bits, so a
// batch does not sort — which defeats the only reason to choose v7 over v4.
// The 12 bits of rand_a hold a counter that increments while the clock stands
// still, reseeded from random data whenever the millisecond advances.
let v7LastMs = -1;
let v7Counter = 0;

function generateV7(): string {
    const now = Date.now();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    if (now === v7LastMs) {
        v7Counter++;
        if (v7Counter > 0xFFF) {
            // Counter exhausted inside one millisecond: wait for the clock so
            // ordering is never violated. 4096 ids/ms is far above real use.
            while (Date.now() === v7LastMs) { /* spin briefly */ }
            return generateV7();
        }
    } else {
        v7LastMs = now;
        // Seed low so a burst has room to count up without overflowing.
        v7Counter = ((bytes[6] & 0x0F) << 4) | (bytes[7] & 0x0F);
    }

    bytes[0] = (now / 2 ** 40) & 0xFF;
    bytes[1] = (now / 2 ** 32) & 0xFF;
    bytes[2] = (now / 2 ** 24) & 0xFF;
    bytes[3] = (now / 2 ** 16) & 0xFF;
    bytes[4] = (now / 2 ** 8) & 0xFF;
    bytes[5] = now & 0xFF;

    // version 7 in the high nibble, then the 12-bit counter
    bytes[6] = 0x70 | ((v7Counter >> 8) & 0x0F);
    bytes[7] = v7Counter & 0xFF;
    bytes[8] = (bytes[8] & 0x3F) | 0x80;   // RFC 4122 variant

    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateUlid(): string {
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const now = Date.now();
    let result = '';

    let t = now;
    for (let i = 9; i >= 0; i--) {
        result = ENCODING[t % 32] + result;
        t = Math.floor(t / 32);
    }

    const rand = new Uint8Array(16);
    crypto.getRandomValues(rand);
    for (let i = 0; i < 16; i++) {
        result += ENCODING[rand[i] % 32];
    }

    return result.slice(0, 26);
}

function applySeparator(uuid: string, sep: 'hyphen' | 'none' | 'colon' | 'underscore'): string {
    const clean = uuid.replace(/-/g, '');
    if (sep === 'none') return clean;
    const char = sep === 'colon' ? ':' : sep === 'underscore' ? '_' : '-';
    return `${clean.slice(0, 8)}${char}${clean.slice(8, 12)}${char}${clean.slice(12, 16)}${char}${clean.slice(16, 20)}${char}${clean.slice(20)}`;
}

export function generateUuids(options: UuidOptions): ToolResult & { timestamp?: string } {
    const { count, version, uppercase, separator, prefix } = options;

    if (count < 1 || count > 100) {
        return { success: false, output: '', error: 'Count must be between 1 and 100.' };
    }

    try {
        const uuids: string[] = [];
        for (let i = 0; i < count; i++) {
            let id: string;
            switch (version) {
                case 'v1': id = generateV1(); break;
                case 'v7': id = generateV7(); break;
                case 'ulid': id = generateUlid(); break;
                default: id = generateV4();
            }

            if (version !== 'ulid') {
                id = applySeparator(id, separator);
            }
            if (uppercase) id = id.toUpperCase();
            if (prefix) id = prefix + id;
            uuids.push(id);
        }

        let timestamp: string | undefined;
        if (version === 'v1' || version === 'v7') {
            timestamp = new Date().toISOString();
        }

        return { success: true, output: uuids.join('\n'), timestamp };
    } catch {
        return { success: false, output: '', error: 'UUID generation failed. Your browser may not support crypto.randomUUID().' };
    }
}
