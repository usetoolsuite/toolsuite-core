/**
 * Shared result shape returned by every engine in this package.
 *
 * These are the exact engines that power https://usetoolsuite.com — each
 * function returns a `ToolResult` so UIs can render output and errors
 * uniformly, while most modules also expose richer structured fields
 * alongside it (e.g. `nextRuns` from the cron parser).
 */
export interface ToolResult {
    success: boolean;
    output: string;
    error?: string;
}
