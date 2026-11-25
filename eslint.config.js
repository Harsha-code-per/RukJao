/**
 * Lint rules every source file must pass with zero warnings: strict type-checked rules,
 * plus limits on complexity, nesting, parameters and function length.
 *
 * @see CODE_QUALITY.md › Enforced by tooling (`eslint.config.js`, `tsconfig.json`)
 */

import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-server', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-lines': ['error', { max: 220, skipBlankLines: true, skipComments: true }],
      eqeqeq: 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['server/**/*.ts', 'shared/**/*.ts', 'src/**/*.ts'],
    ignores: ['server/engine/rules.ts', 'server/engine/plan.ts'],
    rules: { 'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }] },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['tests/**', 'e2e/**', '*.config.*'],
    ...tseslint.configs.disableTypeChecked,
    rules: { ...tseslint.configs.disableTypeChecked.rules, 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },
);
