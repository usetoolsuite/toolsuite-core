import type { ToolResult } from './types.js';

export interface PasswordOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    excludeAmbiguous: boolean;
    excludeSimilar: boolean;
    customExclude: string;
    count: number;
}

export interface PassphraseOptions {
    wordCount: number;
    separator: string;
    capitalize: boolean;
    includeNumber: boolean;
}

export interface PasswordResult {
    passwords: string[];
    strength: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
    strengthPercent: number;
    entropy: number;
    charsetSize: number;
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const AMBIGUOUS = 'l1IO0';
const SIMILAR = '`\'"|';

const WORDLIST = [
    'correct', 'horse', 'battery', 'staple', 'apple', 'banana', 'castle', 'dragon',
    'elephant', 'forest', 'garden', 'harbor', 'island', 'jungle', 'kingdom', 'lemon',
    'mountain', 'novel', 'ocean', 'planet', 'queen', 'river', 'sunset', 'tiger',
    'umbrella', 'village', 'window', 'yellow', 'zebra', 'anchor', 'breeze', 'candle',
    'diamond', 'eclipse', 'falcon', 'glacier', 'horizon', 'ignite', 'jasmine', 'kayak',
    'lantern', 'marble', 'nebula', 'oasis', 'phantom', 'quartz', 'rocket', 'silver',
    'thunder', 'voyage', 'walnut', 'xenon', 'blazer', 'copper', 'dagger', 'emerald',
    'flicker', 'goblin', 'hammer', 'indigo', 'joker', 'knight', 'lotus', 'mystic',
    'ninja', 'oracle', 'pirate', 'ranger', 'sphinx', 'trident', 'unicorn', 'vortex',
    'wizard', 'arctic', 'bonfire', 'cipher', 'dynamo', 'ember', 'frost', 'grove',
    'hydra', 'iron', 'jewel', 'karma', 'lunar', 'meteor', 'nexus', 'onyx',
    'prism', 'quest', 'raven', 'storm', 'titan', 'ultra', 'vapor', 'wraith',
    'zenith', 'amber', 'blaze', 'coral', 'drift', 'eagle', 'flame', 'ghost',
    'haze', 'ivory', 'jade', 'kite', 'lynx', 'mango', 'noble', 'omega',
    'pearl', 'quill', 'rebel', 'sage', 'thorn', 'unity', 'vivid', 'whirl',
    'zephyr', 'atlas', 'brave', 'crest', 'delta', 'fable', 'glyph', 'haven',
];

function calcStrength(entropy: number): { strength: PasswordResult['strength']; strengthPercent: number } {
    if (entropy < 28) return { strength: 'Weak', strengthPercent: 15 };
    if (entropy < 36) return { strength: 'Fair', strengthPercent: 35 };
    if (entropy < 60) return { strength: 'Good', strengthPercent: 55 };
    if (entropy < 80) return { strength: 'Strong', strengthPercent: 78 };
    return { strength: 'Very Strong', strengthPercent: 100 };
}

export function generatePassword(options: PasswordOptions): ToolResult & { result?: PasswordResult } {
    const { length, uppercase, lowercase, numbers, symbols, excludeAmbiguous, excludeSimilar, customExclude, count } = options;

    if (length < 4 || length > 128) {
        return { success: false, output: '', error: 'Length must be between 4 and 128.' };
    }

    if (count < 1 || count > 10) {
        return { success: false, output: '', error: 'Count must be between 1 and 10.' };
    }

    if (!uppercase && !lowercase && !numbers && !symbols) {
        return { success: false, output: '', error: 'Select at least one character type.' };
    }

    let charset = '';
    if (uppercase) charset += UPPER;
    if (lowercase) charset += LOWER;
    if (numbers) charset += DIGITS;
    if (symbols) charset += SYMBOLS;

    if (excludeAmbiguous) {
        charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    if (excludeSimilar) {
        charset = charset.split('').filter(c => !SIMILAR.includes(c)).join('');
    }
    if (customExclude) {
        const excludeSet = new Set(customExclude.split(''));
        charset = charset.split('').filter(c => !excludeSet.has(c)).join('');
    }

    if (charset.length === 0) {
        return { success: false, output: '', error: 'No characters available after exclusions.' };
    }

    const passwords: string[] = [];
    for (let p = 0; p < count; p++) {
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }
        passwords.push(password);
    }

    const charsetSize = charset.length;
    const entropy = Math.round(length * Math.log2(charsetSize) * 100) / 100;
    const { strength, strengthPercent } = calcStrength(entropy);

    return {
        success: true,
        output: passwords.join('\n'),
        result: { passwords, strength, strengthPercent, entropy, charsetSize },
    };
}

export function generatePassphrase(options: PassphraseOptions): ToolResult & { result?: PasswordResult } {
    const { wordCount, separator, capitalize, includeNumber } = options;

    if (wordCount < 3 || wordCount > 10) {
        return { success: false, output: '', error: 'Word count must be between 3 and 10.' };
    }

    const array = new Uint32Array(wordCount + 1);
    crypto.getRandomValues(array);

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
        let word = WORDLIST[array[i] % WORDLIST.length];
        if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
        words.push(word);
    }

    if (includeNumber) {
        const num = (array[wordCount] % 99) + 1;
        const pos = array[wordCount] % (words.length + 1);
        words.splice(pos, 0, String(num));
    }

    const passphrase = words.join(separator);
    const poolSize = WORDLIST.length;
    const entropy = Math.round(wordCount * Math.log2(poolSize) * 100) / 100;
    const { strength, strengthPercent } = calcStrength(entropy);

    return {
        success: true,
        output: passphrase,
        result: { passwords: [passphrase], strength, strengthPercent, entropy, charsetSize: poolSize },
    };
}
