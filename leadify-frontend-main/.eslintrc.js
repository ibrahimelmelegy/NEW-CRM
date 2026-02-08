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
    'vue/require-explicit-emits': 'warn',
    'vue/no-multiple-template-root': 'off', // Vue 3 supports multiple roots
    // Console warnings (production should have no console.log)
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'warn', // Legacy code has require()
    // General rules
    'prefer-const': 'warn',
    'no-var': 'warn', // Turn to warning for now (legacy code)
    camelcase: 'warn', // Turn to warning for now (legacy code)
    eqeqeq: ['warn', 'always'] // Prefer === but warn only
  }
};
