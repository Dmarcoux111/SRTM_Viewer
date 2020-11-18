module.exports = {
  extends: [
    'eslint:recommended',
    'eslint-config-google',
  ],
  parserOptions: {
    'ecmaVersion': 2018,
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  rules: {
    'linebreak-style': 'off',
    'space-in-parens': [ 'error', 'always' ],
    'object-curly-spacing': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'computed-property-spacing': [ 'error', 'always' ],
    'quotes': [ 'error', 'single', { 'avoidEscape': true } ],
    'semi': [ 'error', 'never' ],
    'require-jsdoc': 'off',
    'max-len': 'off',
    'camelcase': 'off',
    'new-cap': [
      'error', { properties: false },
    ],
    'guard-for-in': 'off',
  },
  globals: {
    store: true,
    types: true,
    actions: true,
  },
}
