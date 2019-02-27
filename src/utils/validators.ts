const PROJECT_NAME: string = '_PROJECT';
const TASK_NAME: string = '_TASK';

const SCHEMAS = [
	{ type: PROJECT_NAME, className: 'projects', schema: {} },
	{ type: TASK_NAME, className: 'tasks', schema: {} }
];

export function getSchema(className: string) {
	const schema = SCHEMAS.filter(s => s.className === className).shift() || {
		type: '_ANYTYPE'
	};
	return schema.type;
}

export function validClassName(className: string) {
	return SCHEMAS.map(schema => schema.className).includes(className);
}


const objectIdRegexp = new RegExp('^[0-9a-zA-Z]{8}$');

export function validObjectId(objectId: string) {
	return objectIdRegexp.test(objectId);
}
