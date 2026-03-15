// ESLint v9+ flat config (compatible with global ESLint v10)
// This replaces .eslintrc.js for the global ESLint v10 runner used in CI
const tsParser = require('/opt/node22/lib/node_modules/@typescript-eslint/parser/dist/index.js');
const tsPlugin = require('/opt/node22/lib/node_modules/@typescript-eslint/eslint-plugin/dist/index.js');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'migrations/**', 'seeders/**']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_|^e$|^err$|^error$'
        }
      ]
    }
  }
];
