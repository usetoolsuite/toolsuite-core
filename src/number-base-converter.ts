import type { ToolResult } from './types.js';

export interface BaseConversion {
    binary: string;
    octal: string;
    decimal: string;
    hexadecimal: string;
    custom?: string;
    ascii?: string;
}

export function convertBase(value: string, fromBase: number, customBase?: number): ToolResult & { conversion?: BaseConversion } {
    const trimmed = value.trim();
    if (!trimmed) {
        return { success: false, output: '', error: 'Please enter a number.' };
    }

    try {
        const decimalValue = parseInt(trimmed, fromBase);

        if (isNaN(decimalValue)) {
            return { success: false, output: '', error: `Invalid number for base ${fromBase}.` };
        }

        const conversion: BaseConversion = {
            binary: decimalValue.toString(2),
            octal: decimalValue.toString(8),
            decimal: decimalValue.toString(10),
            hexadecimal: decimalValue.toString(16).toUpperCase(),
        };

        // Custom base conversion
        if (customBase && customBase >= 2 && customBase <= 36) {
            conversion.custom = decimalValue.toString(customBase).toUpperCase();
        }

        // ASCII conversion (if value is in valid ASCII range)
        if (decimalValue >= 0 && decimalValue <= 127) {
            if (decimalValue >= 32 && decimalValue <= 126) {
                conversion.ascii = String.fromCharCode(decimalValue);
            } else if (decimalValue === 0) {
                conversion.ascii = 'NUL';
            } else if (decimalValue === 9) {
                conversion.ascii = 'TAB';
            } else if (decimalValue === 10) {
                conversion.ascii = 'LF';
            } else if (decimalValue === 13) {
                conversion.ascii = 'CR';
            } else if (decimalValue === 32) {
                conversion.ascii = 'SPACE';
            } else {
                conversion.ascii = `CTRL+${String.fromCharCode(64 + decimalValue)}`;
            }
        }

        let output = `Binary (base 2):       ${conversion.binary}\nOctal (base 8):        ${conversion.octal}\nDecimal (base 10):     ${conversion.decimal}\nHexadecimal (base 16): ${conversion.hexadecimal}`;

        if (conversion.custom !== undefined && customBase) {
            output += `\nBase ${customBase}:${' '.repeat(Math.max(1, 23 - `Base ${customBase}:`.length))}${conversion.custom}`;
        }
        if (conversion.ascii !== undefined) {
            output += `\nASCII:                 ${conversion.ascii}`;
        }

        return { success: true, output, conversion };
    } catch {
        return { success: false, output: '', error: 'Conversion failed. Please check your input.' };
    }
}

export function asciiToDecimal(char: string): number | null {
    if (char.length !== 1) return null;
    return char.charCodeAt(0);
}
