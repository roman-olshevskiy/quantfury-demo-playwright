import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import type { DemoApiData } from '../models/bootstrap';
import type { ErrorEnvelope, ProblemDetails, SuccessEnvelope } from '../models/envelope';
import type {
  InstrumentDetails,
  InstrumentsData,
  SearchCategoriesData,
} from '../models/instrument';
import type { ChartData, MarketSession, Quote } from '../models/market-data';
import type { NewsItem } from '../models/news';
import { errorEnvelopeSchema, problemDetailsSchema, successEnvelope } from './common';
import {
  instrumentDetailsResponseSchema,
  instrumentsResponseSchema,
  searchCategoriesResponseSchema,
} from './instrument.schema';
import {
  chartResponseSchema,
  marketsResponseSchema,
  quotesResponseSchema,
} from './market-data.schema';
import { newsResponseSchema } from './news.schema';

// One Ajv instance, compiled once per worker. Validators are immutable after compilation.
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv, ['uri']);

export const validators = {
  demoApiResponse: ajv.compile<SuccessEnvelope<DemoApiData>>(
    successEnvelope({
      type: 'object',
      required: ['demoApiUrl'],
      properties: { demoApiUrl: { type: 'string', format: 'uri' } },
    }),
  ),
  instrumentsResponse: ajv.compile<SuccessEnvelope<InstrumentsData>>(instrumentsResponseSchema),
  searchCategoriesResponse: ajv.compile<SuccessEnvelope<SearchCategoriesData>>(
    searchCategoriesResponseSchema,
  ),
  instrumentDetailsResponse: ajv.compile<SuccessEnvelope<InstrumentDetails>>(
    instrumentDetailsResponseSchema,
  ),
  quotesResponse: ajv.compile<SuccessEnvelope<Quote[]>>(quotesResponseSchema),
  chartResponse: ajv.compile<SuccessEnvelope<ChartData>>(chartResponseSchema),
  marketsResponse: ajv.compile<SuccessEnvelope<MarketSession[]>>(marketsResponseSchema),
  newsResponse: ajv.compile<SuccessEnvelope<NewsItem[]>>(newsResponseSchema),
  errorEnvelope: ajv.compile<ErrorEnvelope>(errorEnvelopeSchema),
  problemDetails: ajv.compile<ProblemDetails>(problemDetailsSchema),
};
