import type { SuccessEnvelope } from '../../api/models/envelope';
import type { Instrument, InstrumentsData } from '../../api/models/instrument';
import { validators } from '../../api/schemas/validators';
import { expectToMatchSchema } from '../../assertions/schema';

/** The instrument with every optional field removed (the minimum the schema allows). */
export function withoutOptionalFields(instrument: Instrument): Instrument {
  const { sy, ed, tn, ig, ...required } = instrument;
  return required;
}

/**
 * Takes a real `/v13/instruments` response and strips the optional fields of one instrument.
 * Delta responses (`afterDate`) that do not contain the instrument pass through unchanged; tests
 * verify on the payload the page received that the full list was modified.
 */
export function stripOptionalFieldsOf(
  realBody: unknown,
  shortName: string,
): SuccessEnvelope<InstrumentsData> {
  expectToMatchSchema(realBody, validators.instrumentsResponse, 'live /v13/instruments response');
  const { updated } = realBody.data;
  const body: SuccessEnvelope<InstrumentsData> = {
    ...realBody,
    data: {
      ...realBody.data,
      updated: updated.map((instrument) =>
        instrument.sn === shortName ? withoutOptionalFields(instrument) : instrument,
      ),
    },
  };
  expectToMatchSchema(body, validators.instrumentsResponse, 'mocked /v13/instruments response');
  return body;
}
