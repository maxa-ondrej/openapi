import type { Plugin } from '@hey-api/openapi-ts';

import { handler } from './plugin/index.js';
import type { Config } from './types.js';

export const defaultConfig: Plugin.Config<Config> &
  Required<Pick<Plugin.Config<Config>, 'baseUrl' | 'provideLayers'>> = {
  _dependencies: [],
  _handler: handler,
  _handlerLegacy: () => {},
  name: 'effect',
  output: 'effect',
  baseUrl: 'localhost',
  provideLayers: true,
  exportFromIndex: true,
};

export const defineConfig: Plugin.DefineConfig<Config> = (config) => ({
  ...defaultConfig,
  ...config,
});
