import { Schema, Stream } from 'effect';
import type { ParseStream } from './index.js';

export const plain: ParseStream = (stream) =>
  stream.pipe(Stream.mapEffect(Schema.decode(Schema.Unknown)));
