import { effectHandler } from '../adapter/index.js';
import { after } from './after.js';
import { before } from './before.js';
import { operation } from './operation.js';
import { schema } from './schema.js';

export const handler = effectHandler({
  before,
  schema,
  operation,
  after,
});
