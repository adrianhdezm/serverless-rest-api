import * as _ from 'lodash';

export function createAPIResponse(data: string | Record<string, unknown>, statusCode = 200) {
  const body = _.isString(data) ? { message: data, statusCode } : data;

  return {
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    statusCode
  };
}
