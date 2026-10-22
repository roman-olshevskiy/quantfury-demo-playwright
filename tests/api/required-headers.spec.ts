import { validators } from '../../src/api/schemas/validators';
import { expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { expect, test } from '../../src/fixtures';

test.describe('Demo identity headers', { tag: ['@api', '@live', '@regression'] }, () => {
  test('API-11 bootstrap rejects a request without the demo headers', async ({
    apiWithoutDemoHeaders,
  }) => {
    const response = await apiWithoutDemoHeaders.bootstrap.getDemoApi();

    const body = await expectJsonResponse(response, 400);
    expectToMatchSchema(body, validators.problemDetails, 'problem details');
    expect(body.status).toBe(400);
    expect(body.title).toBe('Bad Request');
  });

  test('API-11 demo API rejects a request without the demo headers', async ({
    apiWithoutDemoHeaders,
  }) => {
    const response = await apiWithoutDemoHeaders.instruments.getSearchCategories();

    const body = await expectJsonResponse(response, 400);
    expectToMatchSchema(body, validators.problemDetails, 'problem details');
    expect(body.status).toBe(400);
    expect(body.title).toBe('Bad Request');
  });
});
