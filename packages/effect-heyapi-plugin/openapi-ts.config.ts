import { defineConfig } from '@hey-api/openapi-ts';
import * as Effect from './src';

export default defineConfig({
  experimentalParser: true,
  input: './tmp/openapi.json',
  output: {
    path: './tmp/client',
    format: 'biome',
    lint: 'biome',
  },
  plugins: [
    Effect.defineConfig({
      name: 'effect',
      baseUrl: 'https://petstore3.swagger.io/api/v3',
      provideLayers: false,
      staleTime: '1 minute',
    }),
  ],
});
