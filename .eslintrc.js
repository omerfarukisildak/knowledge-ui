module.exports = {
  root: true,
  env: {
    browser: true,
    amd: true,
    node: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'next/core-web-vitals',
    'prettier'
  ],
  plugins: ['react', '@typescript-eslint', 'prettier', 'jsx-a11y', 'import', 'unused-imports'],
  rules: {
    '@next/next/no-img-element': 'off',
    'react/jsx-max-props-per-line': [
      'error',
      {
        maximum: 1
      }
    ],
    'import/newline-after-import': 'error',
    'jsx-a11y/alt-text': 'off',
    'no-unused-vars': 'off',
    'react/react-in-jsx-scope': 'off',
    'unused-imports/no-unused-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'react/display-name': 'off'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      env: {
        jest: true
      }
    },
    {
      /**
       * Bilgi Bankası mimari kuralı: tohum veriye YALNIZCA mock adaptörü erişir.
       * Prototipte bunu `denetim.sh` denetliyordu; burada lint yakalıyor.
       */
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      excludedFiles: ['src/modules/knowledge/api/adapters/mock/**', 'src/modules/knowledge/mocks/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/knowledge/mocks/**', 'src/modules/knowledge/mocks/**'],
                message:
                  'Tohum veriye yalnızca src/modules/knowledge/api/adapters/mock erişebilir. Veriye src/modules/knowledge/api üzerinden ulaşın.'
              }
            ]
          }
        ]
      }
    }
  ]
};
