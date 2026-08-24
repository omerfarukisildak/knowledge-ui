/** @type {import('prettier').Config} */
module.exports = {
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  endOfLine: 'lf',
  semi: true,
  useTabs: false,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 120,
  singleAttributePerLine: true,
  trailingComma: 'none',
  bracketSpacing: true,
  arrowParens: 'avoid',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '^(@mui/material/(.*)$)|^(@mui/material$)|^(@mui/(.*)$)|^(@mui$)',
    '<THIRD_PARTY_MODULES>',
    '^src/(.*)$',
    '^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy']
};
