import type { ToolResult } from './types.js';

export interface SlugOptions {
    separator: '-' | '_';
    removeStopWords: boolean;
    maxLength: number;
    bulk: boolean;
}

const CHAR_MAP: Record<string, string> = {
    // Turkish
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    // German
    'ä': 'ae', 'Ä': 'Ae', 'ß': 'ss',
    // French
    'à': 'a', 'â': 'a', 'æ': 'ae', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i', 'ô': 'o', 'œ': 'oe', 'ù': 'u', 'û': 'u',
    'À': 'A', 'Â': 'A', 'Æ': 'Ae', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Î': 'I', 'Ï': 'I', 'Ô': 'O', 'Œ': 'Oe', 'Ù': 'U', 'Û': 'U',
    // Spanish
    'ñ': 'n', 'Ñ': 'N', 'á': 'a', 'Á': 'A', 'í': 'i', 'Í': 'I',
    'ó': 'o', 'Ó': 'O', 'ú': 'u', 'Ú': 'U',
    // Polish
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ś': 's',
    'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ś': 'S',
    'Ź': 'Z', 'Ż': 'Z',
    // Czech / Slovak
    'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's',
    'ť': 't', 'ů': 'u', 'ž': 'z',
    'Č': 'C', 'Ď': 'D', 'Ě': 'E', 'Ň': 'N', 'Ř': 'R', 'Š': 'S',
    'Ť': 'T', 'Ů': 'U', 'Ž': 'Z',
    // Romanian
    'ă': 'a', 'Ă': 'A', 'ț': 't', 'Ț': 'T', 'ș': 's', 'Ș': 'S',
    // Scandinavian
    'å': 'a', 'Å': 'A', 'ø': 'o', 'Ø': 'O',
    // Portuguese
    'ã': 'a', 'Ã': 'A', 'õ': 'o', 'Õ': 'O',
    // Croatian / Serbian
    'đ': 'dj', 'Đ': 'Dj',
    // Greek (basic)
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
    'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
    'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
    'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
    // Russian (basic)
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
    'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k',
    'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Misc symbols
    '&': 'and', '@': 'at', '©': 'c', '®': 'r', '™': 'tm',
    '€': 'euro', '£': 'pound', '¥': 'yen', '¢': 'cent',
};

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'because', 'about', 'this', 'that',
    'these', 'those', 'it', 'its', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would',
    'shall', 'should', 'may', 'might', 'must', 'can', 'could',
]);

function transliterate(str: string): string {
    let result = '';
    for (const char of str) {
        result += CHAR_MAP[char] ?? char;
    }
    // After mapping, apply NFD normalization to catch remaining accented chars,
    // then strip combining diacritical marks
    return result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugifySingle(input: string, opts: SlugOptions): string {
    let str = input.trim();
    if (!str) return '';

    // Transliterate Unicode characters to ASCII equivalents
    str = transliterate(str);

    // Lowercase
    str = str.toLowerCase();

    // Remove stop words if enabled
    if (opts.removeStopWords) {
        str = str
            .split(/\s+/)
            .filter(word => !STOP_WORDS.has(word))
            .join(' ');
    }

    // Replace any non-alphanumeric characters (except separator) with separator
    const sep = opts.separator;
    const sepRegex = sep === '-' ? /[^a-z0-9-]+/g : /[^a-z0-9_]+/g;
    str = str.replace(sepRegex, sep);

    // Collapse multiple consecutive separators
    const collapseRegex = sep === '-' ? /-{2,}/g : /_{2,}/g;
    str = str.replace(collapseRegex, sep);

    // Strip leading and trailing separators
    str = str.replace(new RegExp(`^${sep === '-' ? '-' : '_'}+|${sep === '-' ? '-' : '_'}+$`, 'g'), '');

    // Enforce max length (cut at word boundary)
    if (opts.maxLength > 0 && str.length > opts.maxLength) {
        str = str.substring(0, opts.maxLength);
        // Don't end on a separator — trim to last complete word
        const lastSep = str.lastIndexOf(sep);
        if (lastSep > 0 && str.length === opts.maxLength) {
            str = str.substring(0, lastSep);
        }
        // Final trim of trailing separator
        str = str.replace(new RegExp(`${sep === '-' ? '-' : '_'}+$`), '');
    }

    return str;
}

export function generateSlug(input: string, options: SlugOptions): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    try {
        if (options.bulk) {
            const lines = input.split('\n').filter(l => l.trim());
            const slugs = lines.map(line => slugifySingle(line, options));
            return { success: true, output: slugs.join('\n') };
        }

        const slug = slugifySingle(input, options);
        return { success: true, output: slug };
    } catch {
        return { success: false, output: '', error: 'Slug generation failed.' };
    }
}
