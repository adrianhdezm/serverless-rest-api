import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { createAPIResponse } from './helpers/response.helpers';

export async function lambdaHandler(event: APIGatewayProxyEvent, context: Context) {
  console.log(`Function name: ${context.functionName}`);
  const name: string = event.queryStringParameters?.name || 'World';

  try {
    const response = createAPIResponse(`Hello ${name}!`);
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
}
