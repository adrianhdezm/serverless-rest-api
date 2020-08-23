import { lambdaHandler } from '../../src/app';
import { apiGatewayEvent } from '../fixtures/events/api-gateway.event';

describe('Fn:lambdaHandler', function () {
  const context = ({
    functionName: 'HelloWorldFunction'
  } as unknown) as AWSLambda.Context;

  it('returns message when no query parameter is provided', async () => {
    const event = ({
      ...apiGatewayEvent
    } as unknown) as AWSLambda.APIGatewayProxyEvent;

    const result = await lambdaHandler(event, context);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.message).toBe('Hello World!');
  });

  it('returns message when a query parameter is provided', async () => {
    const event = ({
      ...apiGatewayEvent,
      queryStringParameters: { name: 'Tom' }
    } as unknown) as AWSLambda.APIGatewayProxyEvent;

    const result = await lambdaHandler(event, context);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.message).toBe('Hello Tom!');
  });
});
