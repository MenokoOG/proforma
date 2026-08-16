import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', '*.tsbuildinfo'],
  },

  // Application source.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // The codebase is strictly typed on purpose — `any` is not an escape
      // hatch here. See CONTRIBUTING.md.
      '@typescript-eslint/no-explicit-any': 'error',

      // `void x` is used deliberately in a couple of places to mark a value
      // as intentionally discarded. Allow it, but only in that form.
      'no-void': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],

      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // `ui.tsx` and `store.tsx` deliberately export the Icon map, the shared
  // hooks and the store alongside their components — one primitives module
  // rather than five files. That costs nothing but fast-refresh granularity
  // in dev, so the rule is switched off here rather than left to warn
  // permanently at something we have chosen on purpose.
  {
    files: ['src/components/ui.tsx', 'src/state/store.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Tests run in Node and may reach for its globals.
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // The optional assist server is plain Node ESM, not browser code.
  {
    files: ['server/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Config files at the repo root.
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
