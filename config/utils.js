'use strict';

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const getProjectName = () => {
	const { name } = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'));
	return name;
};

exports.getProjectName = getProjectName;

const getBucketName = async () => {
	const accountId = await exec(`aws sts get-caller-identity --query 'Account' --output=text`);
	const region = await exec(`aws configure get region`);
	const name = getProjectName();

	return `${accountId.stdout.trim()}-${region.stdout.trim()}-${name}-package`;
};
exports.getBucketName = getBucketName;

const checkStackExists = async stackName => {
	const stacksResponce = await exec(`aws cloudformation describe-stacks`);
	const { Stacks } = JSON.parse(stacksResponce.stdout);
	return Stacks.map(stack => stack.StackName).includes(stackName);
};
exports.checkStackExists = checkStackExists;

const getStackBucketName = async (stackName, resourceKey) => {
	const stacksResponce = await exec(`aws cloudformation describe-stacks --stack-name ${stackName}`);

	const [{ Outputs }] = JSON.parse(stacksResponce.stdout).Stacks;

	const [filesBucketOutput] = Outputs.filter(output => output.OutputKey === resourceKey);

	return filesBucketOutput.OutputValue;
};
exports.getStackBucketName = getStackBucketName;

// Check if the bucket already exists
const checkBucketExists = async bucketName => {
	try {
		const bucket = await exec(`aws s3api head-bucket --bucket '${bucketName}'`);
		if (bucket.stdout.length > 0) throw new Error('Something went wrong with the s3api');
		return true;
	} catch (error) {
		if (error.message.includes('Not Found')) return false;
		throw new Error(error);
	}
};
exports.checkBucketExists = checkBucketExists;