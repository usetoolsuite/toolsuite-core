import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, decode, encode, encodeBytes, getByteSize } from '../src/base64.js';

describe('base64', () => {
    it('round-trips ASCII', () => {
        const enc = encode('Hello, World!');
        expect(enc.success).toBe(true);
        expect(enc.output).toBe('SGVsbG8sIFdvcmxkIQ==');
        expect(decode(enc.output).output).toBe('Hello, World!');
    });

    it('round-trips UTF-8 (Turkish, emoji)', () => {
        for (const s of ['Merhaba Dünya — ğüşiöç', '🎉 ünïcødé']) {
            expect(decode(encode(s).output).output).toBe(s);
        }
    });

    it('matches Node Buffer output on binary data', () => {
        const bytes = new Uint8Array(256).map((_, i) => i);
        expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
        expect(Array.from(base64ToBytes(Buffer.from(bytes).toString('base64')))).toEqual(Array.from(bytes));
    });

    it('supports url-safe variant', () => {
        const enc = encode('subjects?_d=1', { variant: 'url-safe' });
        expect(enc.output).not.toMatch(/[+/=]/);
        expect(decode(enc.output, { variant: 'url-safe' }).output).toBe('subjects?_d=1');
    });

    it('adds MIME line breaks at 76 chars', () => {
        const enc = encode('a'.repeat(200), { lineBreaks: true });
        const lines = enc.output.split('\n');
        expect(lines[0]).toHaveLength(76);
    });

    it('rejects invalid input', () => {
        expect(decode('not base64!!!').success).toBe(false);
        expect(decode('').success).toBe(false);
        expect(encode('').success).toBe(false);
    });

    it('encodes raw bytes', () => {
        expect(encodeBytes(new Uint8Array([0xff, 0x00, 0xab]).buffer).output).toBe(
            Buffer.from([0xff, 0x00, 0xab]).toString('base64'),
        );
    });

    it('computes UTF-8 byte size', () => {
        expect(getByteSize('abc')).toBe(3);
        expect(getByteSize('ü')).toBe(2);
    });
});
