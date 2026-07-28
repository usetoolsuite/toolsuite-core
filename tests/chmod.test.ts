import { describe, expect, it } from 'vitest';
import {
    octalToPermissions,
    permissionsToLsOutput,
    permissionsToOctal,
    permissionsToSymbolic,
    type ChmodPermissions,
} from '../src/chmod.js';

const perm755: ChmodPermissions = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    others: { read: true, write: false, execute: true },
    special: { setuid: false, setgid: false, sticky: false },
};

describe('chmod', () => {
    it('converts permissions to octal', () => {
        expect(permissionsToOctal(perm755)).toBe('755');
    });

    it('converts permissions to symbolic', () => {
        expect(permissionsToSymbolic(perm755)).toBe('rwxr-xr-x');
    });

    it('parses octal back to permissions', () => {
        expect(octalToPermissions('644')).toEqual({
            owner: { read: true, write: true, execute: false },
            group: { read: true, write: false, execute: false },
            others: { read: true, write: false, execute: false },
            special: { setuid: false, setgid: false, sticky: false },
        });
    });

    it('round-trips every mode 000-777', () => {
        for (let o = 0; o <= 7; o++)
            for (let g = 0; g <= 7; g++)
                for (let x = 0; x <= 7; x++) {
                    const oct = `${o}${g}${x}`;
                    const p = octalToPermissions(oct);
                    expect(p).not.toBeNull();
                    expect(permissionsToOctal(p!)).toBe(oct);
                }
    });

    it('renders ls-style output for directories', () => {
        expect(permissionsToLsOutput(perm755, true)).toBe('drwxr-xr-x');
    });

    it('rejects invalid octal', () => {
        expect(octalToPermissions('9')).toBeNull();
        expect(octalToPermissions('abc')).toBeNull();
    });
});
