import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/modules/**/*'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/modules/*/domain/**/*' },
        { type: 'application', pattern: 'src/modules/*/application/**/*' },
        { type: 'infrastructure', pattern: 'src/modules/*/infrastructure/**/*' },
        { type: 'presentation', pattern: 'src/modules/*/presentation/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
          { from: 'domain', disallow: ['application', 'infrastructure', 'presentation'] },
          { from: 'application', disallow: ['infrastructure', 'presentation'] },
          { from: 'infrastructure', disallow: ['presentation'] },
        ],
      }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
