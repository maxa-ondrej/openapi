import type { Duration } from 'effect';

export interface Config {
  /**
   * Plugin name. Must be unique.
   */
  name: 'effect';
  /**
   * Name of the generated file.
   * @default 'effect'
   */
  output?: string;
  /**
   * Base URL of the API.
   */
  baseUrl?: string;
  /**
   * Base URL of the API.
   */
  staleTime?: Duration.DurationInput & string;
  /**
   * Should the effect layers be provided automatically.
   * @default true
   */
  provideLayers?: boolean;
}
