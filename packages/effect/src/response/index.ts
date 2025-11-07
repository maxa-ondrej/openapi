import { Schema } from 'effect';

export {
  ApiError,
  type ExtractError,
  handleStatus,
} from './errors.js';
export { createPaginator, paginate } from './pagination.js';
export { parseStream } from './stream/index.js';
export { parseSync } from './sync/index.js';

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

export const ignoreTime = (schema: Schema.Schema<Date, string>) =>
  Schema.transform(Schema.String, schema, {
    strict: true,
    encode: (_, input) => input.toISOString().split('T')[0],
    decode: (date) => `${date}T00:00:00.000Z`,
  }).pipe(Schema.asSchema);
