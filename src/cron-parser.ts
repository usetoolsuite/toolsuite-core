import type { ToolResult } from './types.js';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function describeField(field: string, unit: string, names?: string[]): string {
    if (field === '*') return `every ${unit}`;
    if (field.includes('/')) {
        const [, step] = field.split('/');
        return `every ${step} ${unit}(s)`;
    }
    if (field.includes('-')) {
        const [start, end] = field.split('-');
        const s = names ? names[parseInt(start)] || start : start;
        const e = names ? names[parseInt(end)] || end : end;
        return `${s} through ${e}`;
    }
    if (field.includes(',')) {
        const vals = field.split(',').map(v => (names ? names[parseInt(v)] || v : v));
        return vals.join(', ');
    }
    return names ? names[parseInt(field)] || field : field;
}

export function parseCron(expression: string): ToolResult & { nextRuns?: string[] } {
    const trimmed = expression.trim();
    if (!trimmed) {
        return { success: false, output: '', error: 'Please enter a cron expression.' };
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
        return { success: false, output: '', error: 'Invalid cron expression. Expected 5 or 6 fields (second minute hour day month weekday).' };
    }

    try {
        const hasSeconds = parts.length === 6;
        const offset = hasSeconds ? 1 : 0;
        const second = hasSeconds ? parts[0] : undefined;
        const minute = parts[offset];
        const hour = parts[offset + 1];
        const dayOfMonth = parts[offset + 2];
        const month = parts[offset + 3];
        const dayOfWeek = parts[offset + 4];

        const descriptions: string[] = [];
        if (hasSeconds && second) descriptions.push(`Second: ${describeField(second, 'second')}`);
        descriptions.push(`Minute: ${describeField(minute, 'minute')}`);
        descriptions.push(`Hour: ${describeField(hour, 'hour')}`);
        descriptions.push(`Day of month: ${describeField(dayOfMonth, 'day')}`);
        descriptions.push(`Month: ${describeField(month, 'month', MONTH_NAMES)}`);
        descriptions.push(`Day of week: ${describeField(dayOfWeek, 'day', DAY_NAMES)}`);

        // Build human-readable summary
        let summary = 'Runs ';
        if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            summary += 'every minute';
        } else if (minute !== '*' && hour === '*') {
            summary += `at minute ${minute} of every hour`;
        } else if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            summary += `at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} every day`;
        } else {
            summary += descriptions.join(', ');
        }

        // Calculate next 5 runs (simple approximation)
        const nextRuns: string[] = [];
        const now = new Date();
        const current = new Date(now);

        for (let i = 0; i < 5 && nextRuns.length < 5; i++) {
            current.setMinutes(current.getMinutes() + 1);
            current.setSeconds(0, 0);

            const matchMinute = minute === '*' || matchField(minute, current.getMinutes());
            const matchHour = hour === '*' || matchField(hour, current.getHours());
            const matchDay = dayOfMonth === '*' || matchField(dayOfMonth, current.getDate());
            const matchMonth = month === '*' || matchField(month, current.getMonth() + 1);
            const matchDow = dayOfWeek === '*' || matchField(dayOfWeek, current.getDay());

            if (matchMinute && matchHour && matchDay && matchMonth && matchDow) {
                nextRuns.push(current.toLocaleString());
            }

            // If after 500 iterations we still don't have 5 results, break
            if (i > 500) break;
        }

        // If simple walk didn't find enough, do a wider search
        if (nextRuns.length < 5) {
            const wide = new Date(now);
            for (let i = 0; i < 525600 && nextRuns.length < 5; i++) {
                wide.setMinutes(wide.getMinutes() + 1);
                wide.setSeconds(0, 0);

                const matchMinute = minute === '*' || matchField(minute, wide.getMinutes());
                const matchHour = hour === '*' || matchField(hour, wide.getHours());
                const matchDay = dayOfMonth === '*' || matchField(dayOfMonth, wide.getDate());
                const matchMonth = month === '*' || matchField(month, wide.getMonth() + 1);
                const matchDow = dayOfWeek === '*' || matchField(dayOfWeek, wide.getDay());

                if (matchMinute && matchHour && matchDay && matchMonth && matchDow) {
                    const str = wide.toLocaleString();
                    if (!nextRuns.includes(str)) {
                        nextRuns.push(str);
                    }
                }
            }
        }

        const output = `${summary}\n\nField breakdown:\n${descriptions.join('\n')}\n\nNext 5 execution times:\n${nextRuns.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

        return { success: true, output, nextRuns };
    } catch {
        return { success: false, output: '', error: 'Failed to parse cron expression.' };
    }
}

function matchField(field: string, value: number): boolean {
    if (field === '*') return true;
    if (field.includes('/')) {
        const [base, step] = field.split('/');
        const stepNum = parseInt(step);
        const baseNum = base === '*' ? 0 : parseInt(base);
        return (value - baseNum) % stepNum === 0 && value >= baseNum;
    }
    if (field.includes(',')) {
        return field.split(',').some(v => parseInt(v) === value);
    }
    if (field.includes('-')) {
        const [start, end] = field.split('-').map(Number);
        return value >= start && value <= end;
    }
    return parseInt(field) === value;
}
