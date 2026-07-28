import { describe, expect, it } from 'vitest';
import { calculateSubnet, validateIp } from '../src/ip-subnet-calculator.js';

describe('subnet calculator', () => {
    it('validates IPv4 addresses', () => {
        expect(validateIp('192.168.1.1')).toBe(true);
        expect(validateIp('255.255.255.255')).toBe(true);
        expect(validateIp('256.1.1.1')).toBe(false);
        expect(validateIp('1.2.3')).toBe(false);
        expect(validateIp('a.b.c.d')).toBe(false);
    });

    it('calculates a /24 network', () => {
        const res = calculateSubnet('192.168.1.0/24');
        expect(res.success).toBe(true);
        expect(res.output).toContain('255.255.255.0');
        expect(res.output).toContain('254');
    });

    it('calculates a /30 point-to-point', () => {
        const res = calculateSubnet('10.0.0.0/30');
        expect(res.success).toBe(true);
        expect(res.output).toContain('255.255.255.252');
    });

    it('rejects malformed input', () => {
        expect(calculateSubnet('not-an-ip').success).toBe(false);
        expect(calculateSubnet('192.168.1.0/33').success).toBe(false);
    });
});
