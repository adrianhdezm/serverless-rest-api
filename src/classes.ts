import {
	createObject,
	deleteObject,
	getAllObjects,
	getObject,
	updateObject
} from './adapters/dynamoDBAdapter';
import { createAPIResponse } from './utils/formatters';
import { validClassName, validObjectId } from './utils/validators';

export async function handleMultipleObjects(event: AWSLambda.APIGatewayProxyEvent) {
	const className: string = event.pathParameters!.className || '';

	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');
		switch (event.httpMethod) {
			case 'GET':
				return createAPIResponse(200, await getAllObjects(className));
			case 'PATCH':
				if (!event.body) throw new Error('INVALID INPUT');
				const objects = JSON.parse(event.body);
				if (!objects.length) throw new Error('INVALID INPUT');
				for (const attrs of objects) await createObject(className, attrs);
				return createAPIResponse(204, '');
			default:
				throw new Error(`UNSUPPORTED METHOD: ${event.httpMethod}`);
		}
	} catch (error) {
		return createAPIResponse(500, error.toString());
	}
}

export async function handleSingleObject(event: AWSLambda.APIGatewayProxyEvent) {
	const className: string = event.pathParameters!.className || '';
	const objectId: string = event.pathParameters!.objectId || '';
	const attrs = JSON.parse(event.body as string);

	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');
		switch (event.httpMethod) {
			case 'GET':
				if (!validObjectId(objectId))
					throw new Error('INVALID INPUT');
				return createAPIResponse(200, await getObject(objectId));

			case 'PUT':
				if (!validObjectId(objectId) || !event.body)
					throw new Error('INVALID INPUT');
				return createAPIResponse(200, await updateObject(objectId, attrs));

			case 'POST':
				if (!event.body) throw new Error('INVALID INPUT');
				return createAPIResponse(201, await createObject(className, attrs));

			case 'DELETE':
				if (!validObjectId(objectId)) throw new Error('INVALID INPUT');
				return createAPIResponse(200, await deleteObject(objectId));

			default:
				throw new Error(`UNSUPPORTED METHOD: ${event.httpMethod}`);
		}
	} catch (error) {
		return createAPIResponse(500, error.toString());
	}
}
