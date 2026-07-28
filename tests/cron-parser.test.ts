import { describe, expect, it } from 'vitest';
import { parseCron } from '../src/cron-parser.js';

describe('parseCron', () => {
    it('describes a simple daily schedule', () => {
        const res = parseCron('30 2 * * *');
        expect(res.success).toBe(true);
        expect(res.output).toContain('02:30');
    });

    it('describes step values', () => {
        const res = parseCron('*/5 * * * *');
        expect(res.success).toBe(true);
        expect(res.output.toLowerCase()).toContain('every 5');
    });

    it('computes upcoming runs', () => {
        const res = parseCron('* * * * *');
        expect(res.nextRuns).toHaveLength(5);
    });

    it('handles 6-field (seconds) expressions', () => {
        expect(parseCron('0 0 12 * * 1').success).toBe(true);
    });

    it('rejects garbage', () => {
        expect(parseCron('').success).toBe(false);
        expect(parseCron('* *').success).toBe(false);
        expect(parseCron('a b c d e f g').success).toBe(false);
    });
});
