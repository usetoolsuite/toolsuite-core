import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, encodeHtmlEntities } from '../src/html-entity.js';

describe('html entities', () => {
    it('encodes the minimal set', () => {
        expect(encodeHtmlEntities('<div class="a" & \'b\'>').output).toContain('&lt;div');
        expect(encodeHtmlEntities('a & b').output).toBe('a &amp; b');
    });

    it('decodes named and numeric entities', () => {
        expect(decodeHtmlEntities('&lt;p&gt; &amp; &#65; &#x42;').output).toBe('<p> & A B');
    });

    it('round-trips', () => {
        const original = '<a href="x">Tom & Jerry</a>';
        expect(decodeHtmlEntities(encodeHtmlEntities(original).output).output).toBe(original);
    });
});
