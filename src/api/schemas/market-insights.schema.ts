import { nonEmptyString, successEnvelope } from './common';

export const tradeHoldedResponseSchema = successEnvelope({
  type: 'array',
  items: {
    type: 'object',
    required: ['shortName'],
    properties: {
      shortName: nonEmptyString,
      showForAllShortcut: { type: 'boolean' },
    },
  },
});
