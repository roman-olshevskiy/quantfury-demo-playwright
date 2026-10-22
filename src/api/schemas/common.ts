import type { SchemaObject } from 'ajv';

// Schemas are plain JSON Schema (draft-07) objects compiled by Ajv. They deliberately do not set
// `additionalProperties: false`: the API adds fields over time and that is not a contract break
// for the demo client (requirements §12). Ajv's `JSONSchemaType<T>` is not used because it forces
// `nullable: true` on optional properties, which would accept nulls the API never sends.

export const timestampMs = { type: 'integer', minimum: 0 } as const;
export const nonEmptyString = { type: 'string', minLength: 1 } as const;

export function successEnvelope(data: SchemaObject): SchemaObject {
  return {
    type: 'object',
    required: ['code', 'isSuccess', 'data'],
    properties: {
      code: { type: 'string', const: 'Success' },
      isSuccess: { type: 'boolean', const: true },
      data,
    },
  };
}

export const errorEnvelopeSchema: SchemaObject = {
  type: 'object',
  required: ['code', 'isSuccess', 'error'],
  properties: {
    code: nonEmptyString,
    isSuccess: { type: 'boolean', const: false },
    error: nonEmptyString,
  },
};

export const problemDetailsSchema: SchemaObject = {
  type: 'object',
  required: ['type', 'title', 'status'],
  properties: {
    type: { type: 'string', format: 'uri' },
    title: nonEmptyString,
    status: { type: 'integer', minimum: 400, maximum: 599 },
    errors: {
      type: 'object',
      additionalProperties: { type: 'array', minItems: 1, items: nonEmptyString },
    },
    extensions: {
      type: 'object',
      properties: { traceId: nonEmptyString },
    },
  },
};
