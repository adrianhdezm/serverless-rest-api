export async function lambdaHandler(event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.Context) {
  console.log(`Function name: ${context.functionName}`);
  const name: string = event.queryStringParameters?.name || 'World';

  try {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello ${name}!` })
    };
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
}
