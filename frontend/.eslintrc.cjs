module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, es2022: true },
  rules: {
    'import/no-cycle': 'error',
    'react-hooks/rules-of-hooks': 'error'
  },
  ignorePatterns: ['dist/', 'node_modules/']
};
