import type { ToolResult } from './types.js';

export interface SubnetResult {
    ipAddress: string;
    cidr: number;
    subnetMask: string;
    wildcardMask: string;
    networkAddress: string;
    broadcastAddress: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHosts: number;
    ipClass: string;
    ipBinary: string;
    isPrivate: boolean;
}

function ipToInt(ip: string): number {
    const parts = ip.split('.').map(Number);
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function intToIp(num: number): string {
    return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
    ].join('.');
}

function intToBinary(num: number): string {
    return [
        ((num >>> 24) & 255).toString(2).padStart(8, '0'),
        ((num >>> 16) & 255).toString(2).padStart(8, '0'),
        ((num >>> 8) & 255).toString(2).padStart(8, '0'),
        (num & 255).toString(2).padStart(8, '0'),
    ].join('.');
}

function getIpClass(firstOctet: number): string {
    if (firstOctet < 128) return 'A';
    if (firstOctet < 192) return 'B';
    if (firstOctet < 224) return 'C';
    if (firstOctet < 240) return 'D (Multicast)';
    return 'E (Reserved)';
}

function isPrivateIp(ip: number): boolean {
    const first = (ip >>> 24) & 255;
    const second = (ip >>> 16) & 255;
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    return false;
}

export function validateIp(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
        const n = Number(p);
        return /^\d{1,3}$/.test(p) && n >= 0 && n <= 255;
    });
}

export function calculateSubnet(input: string): ToolResult & { result?: SubnetResult } {
    const trimmed = input.trim();

    let ip: string;
    let cidr: number;

    if (trimmed.includes('/')) {
        const [ipPart, cidrPart] = trimmed.split('/');
        ip = ipPart;
        cidr = parseInt(cidrPart, 10);
    } else {
        ip = trimmed;
        cidr = 24;
    }

    if (!validateIp(ip)) {
        return { success: false, output: '', error: 'Invalid IPv4 address format. Use format: x.x.x.x (each octet 0-255).' };
    }

    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
        return { success: false, output: '', error: 'CIDR prefix must be between 0 and 32.' };
    }

    const ipInt = ipToInt(ip);
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : totalHosts - 2;

    const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
    const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;

    const firstOctet = (ipInt >>> 24) & 255;

    const result: SubnetResult = {
        ipAddress: ip,
        cidr,
        subnetMask: intToIp(mask),
        wildcardMask: intToIp(wildcard),
        networkAddress: intToIp(network),
        broadcastAddress: intToIp(broadcast),
        firstHost: intToIp(firstHost),
        lastHost: intToIp(lastHost),
        totalHosts,
        usableHosts,
        ipClass: getIpClass(firstOctet),
        ipBinary: intToBinary(ipInt),
        isPrivate: isPrivateIp(ipInt),
    };

    const output = [
        `Network: ${result.networkAddress}/${cidr}`,
        `Subnet Mask: ${result.subnetMask}`,
        `Wildcard: ${result.wildcardMask}`,
        `Broadcast: ${result.broadcastAddress}`,
        `Host Range: ${result.firstHost} - ${result.lastHost}`,
        `Usable Hosts: ${result.usableHosts.toLocaleString()}`,
    ].join('\n');

    return { success: true, output, result };
}
