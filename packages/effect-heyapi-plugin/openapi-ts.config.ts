import * as Effect from './src';

export default {
  experimentalParser: true,
  input: './tmp/openapi.json',
  output: {
    path: './tmp/client',
    format: 'biome',
    lint: 'biome',
  },
  plugins: [
    Effect.defineConfig({
      baseUrl: 'https://petstore3.swagger.io/api/v3',
      provideLayers: false,
      staleTime: '1 minute',
    }),
  ],
};
