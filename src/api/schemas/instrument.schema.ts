import type { SchemaObject } from 'ajv';

import { POPULAR_CATEGORIES } from '../models/instrument';
import { nonEmptyString, successEnvelope, timestampMs } from './common';

const instrumentSchema: SchemaObject = {
  type: 'object',
  required: [
    't',
    'n',
    'sn',
    'snd',
    'hn',
    'en',
    'eci',
    'em',
    'ic',
    's',
    'r',
    'sc',
    'aot',
    'los',
    'sos',
    'tos',
    'lopgp',
    'f',
    'auss',
  ],
  properties: {
    t: { type: 'integer' },
    n: nonEmptyString,
    sn: nonEmptyString,
    snd: nonEmptyString,
    hn: { type: 'string' },
    en: { type: 'string' },
    eci: { type: 'string' },
    em: nonEmptyString,
    ic: nonEmptyString,
    s: { type: 'string' },
    r: { type: 'integer', minimum: 0 },
    sc: { type: 'array', items: { type: 'integer' } },
    aot: { type: 'number' },
    los: { type: 'number' },
    sos: { type: 'number' },
    tos: { type: 'number' },
    lopgp: { type: 'number' },
    f: { type: 'boolean' },
    auss: { type: 'boolean' },
    sy: { type: 'string' },
    ed: { type: 'number' },
    tn: { type: 'string' },
    ig: { type: 'string' },
  },
};

export const instrumentsResponseSchema = successEnvelope({
  type: 'object',
  required: ['updated', 'deleted', 'reseted', 'afterDate', 'popularBySearchCategory'],
  properties: {
    updated: { type: 'array', items: instrumentSchema },
    deleted: { type: 'array' },
    reseted: { type: 'array' },
    afterDate: timestampMs,
    popularBySearchCategory: {
      type: 'object',
      required: [...POPULAR_CATEGORIES],
      properties: Object.fromEntries(
        POPULAR_CATEGORIES.map((category) => [category, { type: 'array', items: nonEmptyString }]),
      ),
    },
  },
});

export const searchCategoriesResponseSchema = successEnvelope({
  type: 'object',
  required: ['searchCategories'],
  properties: {
    searchCategories: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'value'],
        properties: { id: { type: 'integer' }, value: nonEmptyString },
      },
    },
  },
});

export const instrumentDetailsResponseSchema = successEnvelope({
  type: 'object',
  required: ['shortName', 'description'],
  properties: {
    shortName: nonEmptyString,
    description: nonEmptyString,
    industry: { type: 'string' },
    website: { type: 'string' },
  },
});
