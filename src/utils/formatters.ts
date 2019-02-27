// API Gateway's Lambda proxy integration requires a
// Lambda function to return JSON in this format;
// see the Developer Guide for further details
export function createAPIResponse(statusCode: number, data: any) {
	// to restrict the origin for CORS purposes, replace the wildcard
	// origin with a specific domain name

	const body: string =
		Object.prototype.toString.call(data) === '[object String]'
			? JSON.stringify({ message: data, statusCode })
			: JSON.stringify(data);

	return {
		body,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json'
		},
		statusCode
	};
}
