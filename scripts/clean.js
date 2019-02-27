#!/usr/bin/env node

const util = require('util');
const chalk = require('chalk');
const exec = util.promisify(require('child_process').exec);
const {
	getProjectName,
	getBucketName,
	checkBucketExists,
	checkStackExists
} = require('../config/utils');

// Main function
(async function() {
	try {
		const bucketName = await getBucketName();
		const bucketExists = await checkBucketExists(bucketName);
		if (bucketExists) {
			console.log(
				chalk.yellow('\nDeleting the package bucket ...'.toUpperCase())
			);
			await exec(`aws s3 rb s3://${bucketName} --force`);
		}

		const stackName = getProjectName();
		const stackExists = await checkStackExists(stackName);

		if (stackExists) {
			console.log(chalk.yellow('\nDeleting the stack ...'.toUpperCase()));
			await exec(`aws cloudformation delete-stack --stack-name ${stackName}`);
		}
	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();
