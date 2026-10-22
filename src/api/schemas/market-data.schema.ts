import type { SchemaObject } from 'ajv';

import { nonEmptyString, successEnvelope, timestampMs } from './common';

const orderBookSide: SchemaObject = {
  type: 'object',
  additionalProperties: { type: 'number', minimum: 0 },
};

export const quotesResponseSchema = successEnvelope({
  type: 'array',
  items: {
    type: 'object',
    required: [
      'i',
      'n',
      'p',
      'b',
      'a',
      'c',
      'd',
      'pd',
      'r',
      's',
      'o',
      'h',
      'l',
      'v',
      'o1',
      'h1',
      'l1',
      'v1',
      // bb, ab and db are optional: no order book for forex (see Quote model).
    ],
    properties: {
      i: nonEmptyString,
      n: nonEmptyString,
      p: { type: 'number' },
      b: { type: 'number' },
      a: { type: 'number' },
      c: { type: 'number' },
      d: timestampMs,
      pd: timestampMs,
      r: { type: 'number' },
      s: { type: 'string' },
      o: { type: 'number' },
      h: { type: 'number' },
      l: { type: 'number' },
      v: { type: 'number', minimum: 0 },
      o1: { type: 'number' },
      h1: { type: 'number' },
      l1: { type: 'number' },
      v1: { type: 'number', minimum: 0 },
      bb: orderBookSide,
      ab: orderBookSide,
      db: timestampMs,
    },
  },
});

export const chartResponseSchema = successEnvelope({
  type: 'object',
  required: ['s', 'p', 'b'],
  properties: {
    s: nonEmptyString,
    p: { type: 'integer' },
    b: {
      type: 'array',
      items: {
        type: 'object',
        required: ['s', 'e', 'o', 'h', 'l', 'c', 'v', 'p'],
        properties: {
          s: timestampMs,
          e: timestampMs,
          o: { type: 'number' },
          h: { type: 'number' },
          l: { type: 'number' },
          c: { type: 'number' },
          v: { type: 'number', minimum: 0 },
          p: { type: 'number' },
          t: { type: 'boolean' },
        },
      },
    },
    l: timestampMs,
    c: { type: 'integer', minimum: 0 },
  },
});

const sessionTimestamps = [
  'previousSessionStartWork',
  'previousSessionEndWork',
  'startWork',
  'endWork',
  'nextSessionStartWork',
  'nextSessionEndWork',
] as const;

const optionalSessionTimestamps = [
  'previousSessionPreMarketStart',
  'previousSessionAfterMarketEnd',
  'preMarketStart',
  'afterMarketEnd',
  'nextSessionPreMarketStart',
  'nextSessionAfterMarketEnd',
  'previousSessionBreakStart',
  'previousSessionBreakEnd',
  'breakStart',
  'breakEnd',
  'nextSessionBreakStart',
  'nextSessionBreakEnd',
] as const;

const duration = { type: 'integer', minimum: 0 } as const;

export const marketsResponseSchema = successEnvelope({
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: [
      'exchangeMic',
      'timezoneOffset',
      'timezoneCode',
      ...sessionTimestamps,
      'previousSessionWorkingInterval',
      'workingInterval',
      'nextSessionWorkingInterval',
      'standardSessionDuration',
      'offMarketEnabled',
      'dataDisplayMode',
    ],
    properties: {
      exchangeMic: nonEmptyString,
      timezoneOffset: { type: 'integer' },
      timezoneCode: { type: 'string' },
      ...Object.fromEntries(sessionTimestamps.map((name) => [name, timestampMs])),
      ...Object.fromEntries(optionalSessionTimestamps.map((name) => [name, timestampMs])),
      previousSessionWorkingInterval: duration,
      workingInterval: duration,
      nextSessionWorkingInterval: duration,
      standardSessionDuration: duration,
      offMarketEnabled: { type: 'boolean' },
      dataDisplayMode: { type: 'integer' },
    },
  },
});
