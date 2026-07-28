import { describe, expect, it } from 'vitest';
import { convertCase } from '../src/case-converter.js';

describe('convertCase', () => {
    it('converts between cases', () => {
        expect(convertCase('hello world example', 'camelCase').output).toBe('helloWorldExample');
        expect(convertCase('hello world example', 'PascalCase').output).toBe('HelloWorldExample');
        expect(convertCase('hello world example', 'snake_case').output).toBe('hello_world_example');
        expect(convertCase('hello world example', 'kebab-case').output).toBe('hello-world-example');
        expect(convertCase('hello world', 'UPPERCASE').output).toBe('HELLO WORLD');
    });

    it('splits existing camelCase input', () => {
        expect(convertCase('someVariableName', 'snake_case').output).toBe('some_variable_name');
    });

    it('rejects empty input', () => {
        expect(convertCase('', 'camelCase').success).toBe(false);
    });
});
