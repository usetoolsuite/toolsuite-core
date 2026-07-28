import { describe, expect, it } from 'vitest';
import { generateSlug, type SlugOptions } from '../src/slug-generator.js';

const baseOptions: SlugOptions = {
    separator: '-',
    removeStopWords: false,
    maxLength: 0,
    bulk: false,
};

describe('generateSlug', () => {
    it('slugifies a plain title', () => {
        expect(generateSlug('Hello World Example', baseOptions).output).toBe('hello-world-example');
    });

    it('transliterates Turkish characters', () => {
        expect(generateSlug('Çılgın Şöför İzmir\'de', baseOptions).output).toBe('cilgin-sofor-izmir-de');
    });

    it('supports underscore separator', () => {
        expect(generateSlug('a b c', { ...baseOptions, separator: '_' }).output).toBe('a_b_c');
    });

    it('rejects empty input', () => {
        expect(generateSlug('   ', baseOptions).success).toBe(false);
    });
});
