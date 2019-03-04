import { DynamoDB } from 'aws-sdk';
import { randomBytes } from 'crypto';
import { getSchema } from '../utils/validators';

const options: { [key: string]: string } = {};
if (process.env.AWS_SAM_LOCAL) options.endpoint = 'http://dynamodb:8000';

const dynamo = new DynamoDB.DocumentClient(options);
const tableName = process.env.TABLE_NAME || '';

(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');

async function* scanPaginator(className: string) {
	let exclusiveStartKey = null;

	const defaultParams: DynamoDB.DocumentClient.ScanInput = {
		ExpressionAttributeNames: {
			'#type': 'type'
		},
		ExpressionAttributeValues: {
			':type': getSchema(className)
		},
		FilterExpression: '#type = :type',
		TableName: tableName
	};
	do
		try {
			const params = exclusiveStartKey ? { ...defaultParams, ExclusiveStartKey: exclusiveStartKey } : defaultParams;
			const data: DynamoDB.DocumentClient.ScanOutput = await dynamo.scan(params).promise();
			if (!data.hasOwnProperty('Items')) throw new Error('INTERNAL SYSTEM ERROR');
			exclusiveStartKey = data.LastEvaluatedKey ? data.LastEvaluatedKey : null;
			yield data.Items;
		} catch (error) {
			return Promise.reject(error);
		}
	while (exclusiveStartKey);
}

export async function queryObjects(className: string, skip: number, limit: number, order: string) {
	const start = isNaN(skip) ? 0 : skip;
	const end = start + (isNaN(limit) ? 200 : limit);

	const sortMap: { [name: string]: number } = order.split(',').reduce((fields: { [name: string]: number }, field) => {
		if (field.length > 1)
			if (field[0] === '-') fields[field.slice(1)] = -1;
			else fields[field] = 1;
		return fields;
	}, {});

	try {
		const data: DynamoDB.DocumentClient.AttributeMap[] = [];
		for await (const page of scanPaginator(className)) data.push(...page);

		const results = Object.keys(sortMap).reduce((items, sortKey) => {
			const sortOrder = sortMap[sortKey];
			return items.sort((a, b) => {
				if (a.hasOwnProperty(sortKey) && b.hasOwnProperty(sortKey)) {
					const valueA = a[sortKey];
					const valueB = b[sortKey];
					if (valueA > valueB) return sortOrder;
					if (valueA < valueB) return -sortOrder;
				}
				// values must be equal
				return 0;
			});
		}, data);

		return results.slice(start, end);
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function createObject(className: string, attrs: DynamoDB.DocumentClient.AttributeMap) {
	const createDate = new Date();

	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';

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
		const data: DynamoDB.DocumentClient.GetItemOutput = await dynamo.get(params).promise();

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
		const data: DynamoDB.DocumentClient.DeleteItemOutput = await dynamo.delete(params).promise();

		if (!data.hasOwnProperty('Attributes')) throw new Error('INTERNAL SYSTEM ERROR');
		return data.Attributes as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function updateObject(objectId: string, attrs: DynamoDB.DocumentClient.AttributeMap) {
	const updateDate = new Date();

	const notAllowedAttributes = ['objectId', 'type', 'createdAt', 'updatedAt'];

	const filteredAttributes: DynamoDB.DocumentClient.AttributeMap = Object.keys(attrs).reduce(
		(attributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap, key: string) => {
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
		(attributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap, key: string) => {
			attributeValues[`:${key}`] = filteredAttributes[key];
			return attributeValues;
		},
		{
			':updatedAt': updateDate.toISOString()
		}
	);

	const expressionAttributeNames = Object.keys(filteredAttributes).reduce(
		(attributeNames: DynamoDB.DocumentClient.ExpressionAttributeNameMap, key: string) => {
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
		const data: DynamoDB.DocumentClient.UpdateItemOutput = await dynamo.update(params).promise();

		if (!data.hasOwnProperty('Attributes')) throw new Error('INTERNAL SYSTEM ERROR');

		return data.Attributes as DynamoDB.DocumentClient.AttributeMap;
	} catch (error) {
		return Promise.reject(error);
	}
}
