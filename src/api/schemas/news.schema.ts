import { nonEmptyString, successEnvelope, timestampMs } from './common';

export const newsResponseSchema = successEnvelope({
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'revisionTime', 'title', 'story', 'source', 'shortName'],
    properties: {
      id: nonEmptyString,
      revisionTime: timestampMs,
      title: nonEmptyString,
      story: { type: 'string', format: 'uri' },
      source: { type: 'integer' },
      shortName: nonEmptyString,
    },
  },
});
