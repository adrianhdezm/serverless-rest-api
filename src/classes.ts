import {
	createObject,
	deleteObject,
	getAllObjects,
	getObject,
	updateObject
} from './adapters/dynamoDBAdapter';
import { createAPIResponse } from './utils/formatters';
import { validClassName, validObjectId } from './utils/validators';

export async function handleQuery(event: AWSLambda.APIGatewayProxyEvent) {
	const className: string = event.pathParameters!.className || '';
	const objectId: string = event.pathParameters!.objectId || '';

	try {
		if (!validClassName(className)) throw new Error('INVALID INPUT');

		if (validObjectId(objectId)) {
			const data = await getObject(objectId);
			return createAPIResponse(200, data);
		} else if (objectId === '') {
			const data = await getAllObjects(className);
			return createAPIResponse(200, data);
		} else throw new Error('INVALID INPUT');
	} catch (error) {
		return createAPIResponse(500, error.toString());
	}
}

export async function handleWrite(event: AWSLambda.APIGatewayProxyEvent) {
	const className: string = event.pathParameters!.className || '';
	const objectId: string = event.pathParameters!.objectId || '';
	const attrs = JSON.parse(event.body as string);

	try {
		let data = null;
		if (!validClassName(className)) throw new Error('INVALID INPUT');

		switch (event.httpMethod) {
			case 'PUT':
				if (!validObjectId(objectId) || !event.body)
					throw new Error('INVALID INPUT');

				data = await updateObject(objectId, attrs);
				return createAPIResponse(200, data);

			case 'POST':
				if (!event.body) throw new Error('INVALID INPUT');

				data = await createObject(className, attrs);
				return createAPIResponse(201, data);
			case 'DELETE':
				if (!validObjectId(objectId)) throw new Error('INVALID INPUT');

				data = await deleteObject(objectId);
				return createAPIResponse(200, data);

			default:
				throw new Error(`UNSUPPORTED METHOD: ${event.httpMethod}`);
		}
	} catch (error) {
		return createAPIResponse(500, error.toString());
	}
}
