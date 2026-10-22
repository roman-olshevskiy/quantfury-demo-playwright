import { NEWS_INSTRUMENT_TYPES } from '../../src/api/models/news';
import { validators } from '../../src/api/schemas/validators';
import { expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { expect, test } from '../../src/fixtures';

test.describe('News API', { tag: ['@api', '@live', '@regression'] }, () => {
  test('API-10 news are limited to the requested amount and newest first', async ({ api }) => {
    const newsAmount = 5;

    const response = await api.news.getNewsByInstrumentType(
      NEWS_INSTRUMENT_TYPES.crypto,
      newsAmount,
    );

    const body = await expectJsonResponse(response, 200);
    expectToMatchSchema(body, validators.newsResponse, 'GET /v13/news');
    expect(body.data.length, 'news count').toBeGreaterThan(0);
    expect(body.data.length, 'news count').toBeLessThanOrEqual(newsAmount);
    const ids = body.data.map((item) => item.id);
    expect(new Set(ids).size, 'news ids are unique').toBe(ids.length);
    const times = body.data.map((item) => item.revisionTime);
    expect(times, 'news are ordered newest first').toEqual([...times].sort((a, b) => b - a));
  });

  test('API-10 an unsupported instrument type is rejected with problem details', async ({
    api,
  }) => {
    const response = await api.news.getNews({ newsAmount: 5, instrumentType: 999 });

    const body = await expectJsonResponse(response, 400);
    expectToMatchSchema(body, validators.problemDetails, 'problem details');
    expect(Object.keys(body.errors ?? {}), 'rejected parameters').toEqual(['instrumentType']);
  });

  test('API-10 a non-numeric amount is rejected with problem details', async ({ api }) => {
    const response = await api.news.getNews({
      newsAmount: 'abc',
      instrumentType: NEWS_INSTRUMENT_TYPES.stocks,
    });

    const body = await expectJsonResponse(response, 400);
    expectToMatchSchema(body, validators.problemDetails, 'problem details');
    expect(Object.keys(body.errors ?? {}), 'rejected parameters').toEqual(['newsAmount']);
  });
});
