import { reservedJavaScriptKeywordsRegExp } from './regexp.js';
import type { IROperationObject } from './types.js';

export const serviceFunctionIdentifier = ({
  config,
  handleIllegal,
  id,
  operation,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: too lazy to type
  config: any;
  handleIllegal?: boolean;
  id: string;
  operation: IROperationObject;
}) => {
  if (config.plugins['@hey-api/sdk']?.methodNameBuilder) {
    return config.plugins['@hey-api/sdk'].methodNameBuilder(operation);
  }

  if (handleIllegal && RegExp(reservedJavaScriptKeywordsRegExp).exec(id)) {
    return `${id}_`;
  }

  return id;
};
