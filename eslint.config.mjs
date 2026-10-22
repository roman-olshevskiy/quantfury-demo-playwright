import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'blob-report/',
      'reports/',
      '.features-gen/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Explicit even though strictTypeChecked enables them: these are project-level requirements.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // `const { omitted, ...rest } = value` is the idiomatic way to drop fields from a copy.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['tests/**/*.ts', 'bdd/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-focused-test': 'error',
      // Project assertion helpers (src/assertions) count as assertions.
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expectToMatchSchema',
            'expectJsonResponse',
            'expectDemoApiHeaders',
            'expectNoNewAccessibilityViolations',
          ],
        },
      ],
    },
  },
  {
    // Step bodies run inside the tests that bddgen generates from the feature files, so their
    // assertions are not "standalone" even though the plugin cannot see the enclosing test.
    files: ['bdd/steps/**/*.ts'],
    rules: { 'playwright/no-standalone-expect': 'off' },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    // Plain Node scripts (CI helpers, config).
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  prettier,
);
