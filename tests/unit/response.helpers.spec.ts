import { createAPIResponse } from '../../src/helpers/response.helpers';

describe('Fn:createAPIResponse', function () {
  it('returns response when string data is provided', async () => {
    const data = 'string value';
    const result = createAPIResponse(data);

    expect(result).toMatchObject({
      body: JSON.stringify({ message: data, statusCode: 200 })
    });
  });

  it('returns response when object data is provided', async () => {
    const data = { example: 'value' };
    const result = createAPIResponse(data);

    expect(result).toMatchObject({
      body: JSON.stringify(data)
    });
  });

  it('returns statusCode when string statusCode is provided', async () => {
    const data = { example: 'value' };
    const result = createAPIResponse(data, 401);

    expect(result).toMatchObject({
      statusCode: 401
    });
  });

  it('returns 200 statusCode when no statusCode is provided', async () => {
    const data = 'string value';
    const result = createAPIResponse(data);

    expect(result).toMatchObject({
      statusCode: 200
    });
  });

  it('returns default headers', async () => {
    const data = 'string value';
    const result = createAPIResponse(data);

    expect(result.headers).toBeDefined();
  });
});
