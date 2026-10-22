import { API_VERSION } from '../../src/api/paths';
import { validators } from '../../src/api/schemas/validators';
import { expectDemoApiHeaders, expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { env } from '../../src/config/env';
import { expect, test } from '../../src/fixtures';

test.describe('Demo bootstrap API', { tag: ['@api', '@live'] }, () => {
  test(
    'API-01 points the web app to the configured demo API host',
    { tag: '@smoke' },
    async ({ api }) => {
      const response = await api.bootstrap.getDemoApi();

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.demoApiResponse, 'GET /v13/users/demoapi');
      expect(new URL(body.data.demoApiUrl).origin, 'demo API origin').toBe(
        new URL(env.API_BASE_URL).origin,
      );
      expectDemoApiHeaders(response, env.BASE_URL, API_VERSION);
    },
  );
});
