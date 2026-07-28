# @usetoolsuite/core

> Zero-dependency developer-tool engines: cron parser, JSONPath, JSON→TypeScript, JSON Schema inference, Base64, diff, subnet calculator and more — in pure TypeScript that runs in Node **and** the browser.

[![CI](https://github.com/usetoolsuite/toolsuite-core/actions/workflows/ci.yml/badge.svg)](https://github.com/usetoolsuite/toolsuite-core/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@usetoolsuite/core)](https://www.npmjs.com/package/@usetoolsuite/core)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

These are the exact engines that power the free tools at **[usetoolsuite.com](https://usetoolsuite.com)** — every tool there runs 100% in your browser, and this package is that logic, extracted and published so you can use it anywhere.

- **Zero runtime dependencies.** Nothing to audit but this repo.
- **Isomorphic.** No DOM, no Node built-ins — works in browsers, Node ≥18, Deno, Bun, edge runtimes.
- **Tree-shakeable.** ESM with `sideEffects: false`, plus per-module subpath imports.
- **Typed.** Written in strict TypeScript, ships `.d.ts`.

## Install

```sh
npm install @usetoolsuite/core
```

## Usage

Import everything namespaced from the root:

```ts
import { cron, base64, jsonpath } from '@usetoolsuite/core';

cron.parseCron('*/15 9-17 * * 1-5');
// → { success: true, output: 'Runs …', nextRuns: ['…', …] }

base64.encode('Hello, World!');            // SGVsbG8sIFdvcmxkIQ==
base64.decode('SGVsbG8sIFdvcmxkIQ==');     // Hello, World!

jsonpath.queryJsonPath(json, '$.store.book[*].price');
```

…or import a single module for the smallest possible bundle:

```ts
import { jsonToTypescript } from '@usetoolsuite/core/json-to-typescript';

jsonToTypescript('{"name":"Ada","age":36}', { rootName: 'User' }).output;
// export interface User {
//     name: string;
//     age: number;
// }
```

Every engine returns a common result shape, so error handling is uniform:

```ts
interface ToolResult {
    success: boolean;
    output: string;
    error?: string;
}
```

Most modules also return richer structured data alongside `output` (e.g. `nextRuns` from the cron parser, `matchCount` from JSONPath, `lines` from the differ).

## Modules

| Module | What it does | Try it online |
|---|---|---|
| `base64` | UTF-8-safe Base64 encode/decode, URL-safe variant, MIME line breaks, raw bytes | [Base64 Tool](https://usetoolsuite.com/tools/base64/) |
| `case-converter` | camelCase / PascalCase / snake_case / kebab-case / Title Case | [Case Converter](https://usetoolsuite.com/tools/case-converter/) |
| `chmod` | Octal ↔ symbolic Unix permissions, `ls -l` rendering, presets | [Chmod Calculator](https://usetoolsuite.com/tools/chmod-calculator/) |
| `cron` | Human-readable cron descriptions + next 5 run times, 5/6-field | [Cron Parser](https://usetoolsuite.com/tools/cron-parser/) |
| `diff` | Line-based LCS diff with added/removed/unchanged classification | [Diff Checker](https://usetoolsuite.com/tools/diff-checker/) |
| `htmlEntity` | Encode/decode named + numeric HTML entities, character info | [HTML Entity Tool](https://usetoolsuite.com/tools/html-entity/) |
| `subnet` | IPv4 CIDR subnet math: netmask, network, broadcast, host range | [IP Subnet Calculator](https://usetoolsuite.com/tools/ip-subnet-calculator/) |
| `jsonCsv` | JSON ↔ CSV with quoting, delimiters, nested-object flattening | [JSON ⇄ CSV](https://usetoolsuite.com/tools/json-csv/) |
| `jsonSchema` | Infer a JSON Schema from sample JSON | [JSON Schema Generator](https://usetoolsuite.com/tools/json-schema-generator/) |
| `jsonToTypescript` | Generate TypeScript interfaces from JSON | [JSON to TypeScript](https://usetoolsuite.com/tools/json-to-typescript/) |
| `jsonXml` | JSON → XML with escaping and indentation | [JSON to XML](https://usetoolsuite.com/tools/json-to-xml/) |
| `jsonpath` | JSONPath queries (`$.a.b[*]`, wildcards, filters) + path tree | [JSON Path Finder](https://usetoolsuite.com/tools/json-path-finder/) |
| `numberBase` | Convert numbers between bases 2–36 | [Number Base Converter](https://usetoolsuite.com/tools/number-base-converter/) |
| `password` | Cryptographically random passwords & passphrases with charset rules | [Password Generator](https://usetoolsuite.com/tools/password-generator/) |
| `slug` | URL slugs with transliteration (Turkish, German, …), stop words | [Slug Generator](https://usetoolsuite.com/tools/slug-generator/) |
| `uuid` | UUID v1/v4/v7 + ULID, formatting options | [UUID Generator](https://usetoolsuite.com/tools/uuid-generator/) |

## Development

```sh
npm install
npm test          # vitest
npm run typecheck
npm run build     # emits ESM + d.ts to dist/
```

## License

[MIT](./LICENSE) © [UseToolSuite](https://usetoolsuite.com)
