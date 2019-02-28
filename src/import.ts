import { createObject } from './adapters/dynamoDBAdapter';
import { createAPIResponse } from './utils/formatters';
import { validClassName } from './utils/validators';

const bulkOperation = async (className: string, objects: [any]) => {
	for (const attrs of objects) await createObject(className, attrs);
};

export async function handleBulkWrite(event: AWSLambda.APIGatewayProxyEvent) {
	const className: string = event.pathParameters!.className || '';
	const objects = JSON.parse(event.body as string);

	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');

		switch (event.httpMethod) {
			case 'POST':
				if (!event.body) throw new Error('INVALID INPUT');
				if (!objects.length) throw new Error('INVALID INPUT');

				await bulkOperation(className, objects);
				return createAPIResponse(201, 'OK');
			default:
				throw new Error(`UNSUPPORTED METHOD: ${event.httpMethod}`);
		}
	} catch (error) {
		return createAPIResponse(500, error.toString());
	}
}
