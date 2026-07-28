import type { ToolResult } from './types.js';

export interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    lineNumber: number;
}

export function computeDiff(textA: string, textB: string): ToolResult & { lines?: DiffLine[] } {
    if (!textA.trim() && !textB.trim()) {
        return { success: false, output: '', error: 'Please enter text in at least one panel.' };
    }

    const linesA = textA.split('\n');
    const linesB = textB.split('\n');

    // LCS-based diff
    const m = linesA.length;
    const n = linesB.length;

    // Build LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (linesA[i - 1] === linesB[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to produce diff
    const diffLines: DiffLine[] = [];
    let i = m, j = n;
    const result: DiffLine[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
            result.push({ type: 'unchanged', content: linesA[i - 1], lineNumber: i });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.push({ type: 'added', content: linesB[j - 1], lineNumber: j });
            j--;
        } else if (i > 0) {
            result.push({ type: 'removed', content: linesA[i - 1], lineNumber: i });
            i--;
        }
    }

    result.reverse();

    let lineNum = 0;
    for (const line of result) {
        lineNum++;
        diffLines.push({ ...line, lineNumber: lineNum });
    }

    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    const unchanged = diffLines.filter(l => l.type === 'unchanged').length;

    const summary = `${added} added, ${removed} removed, ${unchanged} unchanged`;
    const output = diffLines.map(l => {
        const prefix = l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' ';
        return `${prefix} ${l.content}`;
    }).join('\n');

    return { success: true, output: `${summary}\n\n${output}`, lines: diffLines };
}
