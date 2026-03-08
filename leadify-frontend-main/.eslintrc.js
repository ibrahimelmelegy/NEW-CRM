module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: ['@nuxtjs/eslint-config-typescript', 'plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['vue'],
  rules: {
    // Prettier integration
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto'
      }
    ],
    // Vue 3 specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'off',
    // 'vue/require-explicit-emits': 'warn', // Disabled below
    'vue/no-multiple-template-root': 'off', // Vue 3 supports multiple roots
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^e$|^err$|^error$'
      }
    ],
    '@typescript-eslint/no-require-imports': 'warn',
    // Import rules
    'import/no-named-as-default': 'off',
    // General rules
    'prefer-const': 'warn',
    'no-var': 'warn',
    camelcase: 'off',
    eqeqeq: ['warn', 'always'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // Vue rules - disabled due to third-party library patterns
    'vue/require-prop-types': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/prop-name-casing': 'off'
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        // Pug templates are opaque to ESLint — it cannot detect variable usage in them
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
};
