import { createObject, deleteObject, getObject, queryObjects, updateObject } from './adapters/dynamoDBAdapter';
import { createAPIResponse } from './utils/formatters';
import { validClassName, validObjectId } from './utils/validators';

export async function handleMultipleObjects(event: AWSLambda.APIGatewayProxyEvent) {
	const className = event.pathParameters!.className || '';

	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');
		switch (event.httpMethod) {
			case 'GET':
				let limit = '';
				let skip = '';
				let order = '';
				if(event.queryStringParameters) {
					if (event.queryStringParameters.hasOwnProperty('limit')) limit = event.queryStringParameters.limit;
					if (event.queryStringParameters.hasOwnProperty('skip')) skip = event.queryStringParameters.skip;
					if (event.queryStringParameters.hasOwnProperty('order')) order = event.queryStringParameters.order;
				}
				return createAPIResponse(200, await queryObjects(className, parseInt(skip, 10), parseInt(limit, 10), order ));
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
	const className = event.pathParameters!.className || '';
	const objectId = event.pathParameters!.objectId || '';
	
	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');
		switch (event.httpMethod) {
			case 'GET':
				if (!validObjectId(objectId)) throw new Error('INVALID INPUT');
				return createAPIResponse(200, await getObject(objectId));

			case 'PUT':
				if (!validObjectId(objectId) || !event.body) throw new Error('INVALID INPUT');
				return createAPIResponse(200, await updateObject(objectId, JSON.parse(event.body)));

			case 'POST':
				if (!event.body) throw new Error('INVALID INPUT');
				return createAPIResponse(201, await createObject(className, JSON.parse(event.body)));

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
