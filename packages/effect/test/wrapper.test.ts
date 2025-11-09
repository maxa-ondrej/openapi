import { expect, it } from '@effect/vitest';
import { createPathFromTemplate } from '@majksa-openapi/effect/wrapper';

it('extract callable', () => {
  expect(createPathFromTemplate('/hello', {})).toBe('/hello');
  expect(
    createPathFromTemplate('/hello/{abc}', {
      abc: '123',
    }),
  ).toBe('/hello/123');
  expect(
    createPathFromTemplate('/hello/{abc}/{def}', {
      abc: '123',
      def: '456',
    }),
  ).toBe('/hello/123/456');
  expect(
    createPathFromTemplate('/hello/{abc}/{abc}', {
      abc: '123',
    }),
  ).toBe('/hello/123/123');
  expect(
    createPathFromTemplate('/hello/{abc}/{def}', {
      abc: '123',
    }),
  ).toBe('/hello/123/{def}');
  expect(
    createPathFromTemplate('/hello/{abc}', {
      def: '123',
    }),
  ).toBe('/hello/{abc}');
});
