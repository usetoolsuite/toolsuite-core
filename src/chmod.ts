import type { ToolResult } from './types.js';

export interface ChmodPermissions {
    owner: { read: boolean; write: boolean; execute: boolean };
    group: { read: boolean; write: boolean; execute: boolean };
    others: { read: boolean; write: boolean; execute: boolean };
    special: { setuid: boolean; setgid: boolean; sticky: boolean };
}

function permBits(p: { read: boolean; write: boolean; execute: boolean }): number {
    return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
}

function bitsToPerms(n: number): { read: boolean; write: boolean; execute: boolean } {
    return {
        read: (n & 4) !== 0,
        write: (n & 2) !== 0,
        execute: (n & 1) !== 0,
    };
}

export function permissionsToOctal(p: ChmodPermissions): string {
    const special = (p.special.setuid ? 4 : 0) + (p.special.setgid ? 2 : 0) + (p.special.sticky ? 1 : 0);
    const octal = `${permBits(p.owner)}${permBits(p.group)}${permBits(p.others)}`;
    return special > 0 ? `${special}${octal}` : octal;
}

export function permissionsToSymbolic(p: ChmodPermissions): string {
    const sym = (perm: { read: boolean; write: boolean; execute: boolean }, specialBit: boolean, specialChar: string) => {
        const r = perm.read ? 'r' : '-';
        const w = perm.write ? 'w' : '-';
        let x: string;
        if (specialBit) {
            x = perm.execute ? specialChar.toLowerCase() : specialChar.toUpperCase();
        } else {
            x = perm.execute ? 'x' : '-';
        }
        return r + w + x;
    };

    return sym(p.owner, p.special.setuid, 's') +
           sym(p.group, p.special.setgid, 's') +
           sym(p.others, p.special.sticky, 't');
}

export function octalToPermissions(octal: string): ChmodPermissions | null {
    const clean = octal.replace(/^0+/, '') || '0';
    if (!/^\d{1,4}$/.test(clean)) return null;
    const digits = clean.padStart(3, '0');

    let special = { setuid: false, setgid: false, sticky: false };
    let ownerDigit: number, groupDigit: number, othersDigit: number;

    if (digits.length === 4) {
        const sp = parseInt(digits[0]);
        special = { setuid: (sp & 4) !== 0, setgid: (sp & 2) !== 0, sticky: (sp & 1) !== 0 };
        ownerDigit = parseInt(digits[1]);
        groupDigit = parseInt(digits[2]);
        othersDigit = parseInt(digits[3]);
    } else {
        ownerDigit = parseInt(digits[digits.length - 3]);
        groupDigit = parseInt(digits[digits.length - 2]);
        othersDigit = parseInt(digits[digits.length - 1]);
    }

    if ([ownerDigit, groupDigit, othersDigit].some(d => d > 7)) return null;

    return {
        owner: bitsToPerms(ownerDigit),
        group: bitsToPerms(groupDigit),
        others: bitsToPerms(othersDigit),
        special,
    };
}

export function permissionsToCommand(p: ChmodPermissions): string {
    return `chmod ${permissionsToOctal(p)} filename`;
}

export function permissionsToLsOutput(p: ChmodPermissions, isDir: boolean): string {
    return (isDir ? 'd' : '-') + permissionsToSymbolic(p);
}

export function getCommonPresets(): { label: string; octal: string; description: string }[] {
    return [
        { label: '644', octal: '644', description: 'Standard file — owner rw, others read' },
        { label: '755', octal: '755', description: 'Standard dir/script — owner rwx, others rx' },
        { label: '600', octal: '600', description: 'Private file — owner rw only (SSH keys)' },
        { label: '700', octal: '700', description: 'Private dir — owner rwx only' },
        { label: '666', octal: '666', description: 'World-writable file (insecure)' },
        { label: '777', octal: '777', description: 'Full access for all (insecure)' },
        { label: '1755', octal: '1755', description: 'Sticky dir — like /tmp' },
        { label: '4755', octal: '4755', description: 'Setuid executable — runs as owner' },
    ];
}
