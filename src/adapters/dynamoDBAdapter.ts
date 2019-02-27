import { DynamoDB } from 'aws-sdk';
import { randomBytes } from 'crypto';
import { getSchema } from '../utils/validators';

const options: { [key: string]: string } = {};
if (process.env.AWS_SAM_LOCAL) options.endpoint = 'http://dynamodb:8000';

const dynamo = new DynamoDB.DocumentClient(options);
const tableName = process.env.TABLE_NAME || '';

export async function getAllObjects(className: string) {
	const params: DynamoDB.DocumentClient.ScanInput = {
		ExpressionAttributeNames: {
			'#type': 'type'
		},
		ExpressionAttributeValues: {
			':type': getSchema(className)
		},
		FilterExpression: '#type = :type',
		TableName: tableName
	};

	try {
		const data: DynamoDB.DocumentClient.ScanOutput = await dynamo
			.scan(params)
			.promise();

		if (!data.hasOwnProperty('Items')) throw new Error('INTERNAL SYSTEM ERROR');
		return data.Items as DynamoDB.DocumentClient.ItemList;
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function createObject(
	className: string,
	attrs: DynamoDB.DocumentClient.AttributeMap
) {
	const createDate = new Date();

	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';

	const objectId = randomBytes(8).reduce((id, byte) => {
		id += chars[byte % chars.length];
		return id;
	}, '');

	const item: DynamoDB.DocumentClient.AttributeMap = {
		...attrs,
		...{
			createdAt: createDate.toISOString(),
			objectId,
			type: getSchema(className),
			updatedAt: createDate.toISOString()
		}
	};

	const params: DynamoDB.DocumentClient.PutItemInput = {
		Item: item,
		TableName: tableName
	};

	try {
		await dynamo.put(params).promise();
		return params.Item as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function getObject(objectId: string) {
	const params: DynamoDB.DocumentClient.GetItemInput = {
		Key: { objectId },
		TableName: tableName
	};

	try {
		const data: DynamoDB.DocumentClient.GetItemOutput = await dynamo
			.get(params)
			.promise();

		if (!data.hasOwnProperty('Item')) throw new Error('INTERNAL SYSTEM ERROR');

		return data.Item as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function deleteObject(objectId: string) {
	const params: DynamoDB.DocumentClient.DeleteItemInput = {
		Key: {
			objectId
		},
		ReturnValues: 'ALL_OLD',
		TableName: tableName
	};

	try {
		const data: DynamoDB.DocumentClient.DeleteItemOutput = await dynamo
			.delete(params)
			.promise();

		if (!data.hasOwnProperty('Attributes'))
			throw new Error('INTERNAL SYSTEM ERROR');
		return data.Attributes as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function updateObject(
	objectId: string,
	attrs: DynamoDB.DocumentClient.AttributeMap
) {
	const updateDate = new Date();

	const notAllowedAttributes = ['objectId', 'type', 'createdAt', 'updatedAt'];

	const filteredAttributes: DynamoDB.DocumentClient.AttributeMap = Object.keys(
		attrs
	).reduce(
		(
			attributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap,
			key: string
		) => {
			if (notAllowedAttributes.includes(key)) return attributeValues;
			attributeValues[key] = attrs[key];
			return attributeValues;
		},
		{}
	);

	const queryExpression = `set ${Object.keys(filteredAttributes)
		.map(key => `#${key} = :${key}`)
		.join(', ')}, #updatedAt = :updatedAt`;

	const expressionAttributeValues = Object.keys(filteredAttributes).reduce(
		(
			attributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap,
			key: string
		) => {
			attributeValues[`:${key}`] = filteredAttributes[key];
			return attributeValues;
		},
		{
			':updatedAt': updateDate.toISOString()
		}
	);

	const expressionAttributeNames = Object.keys(filteredAttributes).reduce(
		(
			attributeNames: DynamoDB.DocumentClient.ExpressionAttributeNameMap,
			key: string
		) => {
			attributeNames[`#${key}`] = key;
			return attributeNames;
		},
		{
			'#updatedAt': 'updatedAt'
		}
	);

	const params: DynamoDB.DocumentClient.UpdateItemInput = {
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		Key: {
			objectId
		},
		ReturnValues: 'ALL_NEW',
		TableName: tableName,
		UpdateExpression: queryExpression
	};

	try {
		const data: DynamoDB.DocumentClient.UpdateItemOutput = await dynamo
			.update(params)
			.promise();

		if (!data.hasOwnProperty('Attributes'))
			throw new Error('INTERNAL SYSTEM ERROR');

		return data.Attributes as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}
