import * as path from 'node:path';
import type { ViteUserConfig } from 'vitest/config';

const alias = (name: string) => {
  const target = process.env.TEST_DIST !== undefined ? 'dist/dist/esm' : 'src';
  return {
    [`@majksa-openapi/${name}/test`]: path.join(
      __dirname,
      'packages',
      name,
      'test',
    ),
    [`@majksa-openapi/${name}`]: path.join(__dirname, 'packages', name, target),
  };
};

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    exclude: ['bun:sqlite'],
  },
  test: {
    setupFiles: [path.join(__dirname, 'setup-tests.ts')],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: true,
    },
    include: ['test/**/*.test.ts'],
    alias: {
      ...alias('effect'),
      ...alias('effect-heyapi-plugin'),
    },
  },
};

export default config;
