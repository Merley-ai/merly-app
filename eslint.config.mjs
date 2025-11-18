import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y';

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    prettier,
    {
        rules: {
            // Code quality
            'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
            'no-unused-vars': 'off', // TypeScript handles this
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            // 'complexity': ['warn', 10],
            // 'max-depth': ['warn', 4],
            // 'max-lines-per-function': ['warn', 80],
            // 'eqeqeq': ['error', 'always'],
            // 'no-implied-eval': 'error',
            // 'no-return-await': 'error',
        },
    },
    {
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'jsx-a11y/alt-text': 'warn',
            'jsx-a11y/anchor-is-valid': 'warn',
            'jsx-a11y/no-autofocus': 'warn',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
        },
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
    ]),
])

export default eslintConfig