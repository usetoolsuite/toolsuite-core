import type { ToolResult } from './types.js';

export type CaseType = 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'UPPERCASE' | 'lowercase' | 'Title Case';

export function convertCase(input: string, targetCase: CaseType): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    try {
        const words = splitIntoWords(input);

        let output: string;
        switch (targetCase) {
            case 'camelCase':
                output = words.map((w, i) => i === 0 ? w.toLowerCase() : capitalize(w)).join('');
                break;
            case 'PascalCase':
                output = words.map(w => capitalize(w)).join('');
                break;
            case 'snake_case':
                output = words.map(w => w.toLowerCase()).join('_');
                break;
            case 'kebab-case':
                output = words.map(w => w.toLowerCase()).join('-');
                break;
            case 'UPPERCASE':
                output = input.toUpperCase();
                break;
            case 'lowercase':
                output = input.toLowerCase();
                break;
            case 'Title Case':
                output = words.map(w => capitalize(w)).join(' ');
                break;
            default:
                output = input;
        }

        return { success: true, output };
    } catch {
        return { success: false, output: '', error: 'Conversion failed.' };
    }
}

function splitIntoWords(str: string): string[] {
    return str
        // Insert space before uppercase letters in camelCase/PascalCase
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Replace separators with spaces
        .replace(/[-_./\\]+/g, ' ')
        // Split by spaces
        .split(/\s+/)
        .filter(w => w.length > 0);
}

function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
