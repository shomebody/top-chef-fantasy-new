module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended' // Added for TypeScript
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser', // Use TS parser for JS/JSX
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    project: './tsconfig.json' // Link to your TS config
  },
  settings: { react: { version: '19.0' } },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    'react/prop-types': 'off',
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': ['warn'], // Use TS version
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'off' // Relax TS strictness
  }
};