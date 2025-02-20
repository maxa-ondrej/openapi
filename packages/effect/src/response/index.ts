import { Schema } from 'effect';

export { paginate, createPaginator } from './pagination.js';
export { parseSync } from './sync/index.js';
export { parseStream } from './stream/index.js';
export {
  ApiError,
  type ExtractError,
  handleStatus,
} from './errors.js';

export const EmptyStruct = (tag = 'EmptyStruct') =>
  Schema.Struct({
    _tag: Schema.Literal(tag).pipe(
      Schema.optional,
      Schema.withDefaults({
        constructor: () => tag,
        decoding: () => tag,
      }),
    ),
  });

export const empty = () =>
  Schema.transform(Schema.Unknown, Schema.Void, {
    strict: true,
    encode: (input) => input,
    decode: () => undefined,
  }).pipe(Schema.asSchema);
