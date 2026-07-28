import type { ToolResult } from './types.js';

export function jsonToXml(input: string, indent: number = 2): ToolResult {
    if (!input.trim()) {
        return { success: false, output: '', error: 'Input cannot be empty.' };
    }

    try {
        const obj = JSON.parse(input);
        const indentStr = ' '.repeat(indent);

        const buildXml = (data: any, currentIndent: string): string => {
            let xml = '';
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    let val = data[key];

                    // Handle arrays by repeating the key tag
                    if (Array.isArray(val)) {
                        val.forEach((item) => {
                            if (typeof item === 'object' && item !== null) {
                                xml += `${currentIndent}<${key}>\n${buildXml(item, currentIndent + indentStr)}${currentIndent}</${key}>\n`;
                            } else {
                                xml += `${currentIndent}<${key}>${escapeXml(String(item))}</${key}>\n`;
                            }
                        });
                    } else if (typeof val === 'object' && val !== null) {
                        xml += `${currentIndent}<${key}>\n${buildXml(val, currentIndent + indentStr)}${currentIndent}</${key}>\n`;
                    } else {
                        xml += `${currentIndent}<${key}>${escapeXml(String(val))}</${key}>\n`;
                    }
                }
            }
            return xml;
        };

        const xmlResult = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${buildXml(obj, indentStr)}</root>`;
        return { success: true, output: xmlResult.trim() };
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid JSON';
        return { success: false, output: '', error: `Parse error: ${msg}` };
    }
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
