#!/usr/bin/env node

const util = require('util');
const chalk = require('chalk');
const exec = util.promisify(require('child_process').exec);
const paths = require('../config/paths');
const {
	getBucketName,
	checkBucketExists
} = require('../config/utils');

const { BUILDED_CFN_STACK_TEMPLATE_PATH, CFN_PACKAGE_STACK_PATH } = paths;

// Main function
(async function() {
	try {
		console.log(chalk.yellow('\nCreating the bucket ...'.toUpperCase()));
		const bucketName = await getBucketName();
		const bucketExists = await checkBucketExists(bucketName);
		if (bucketExists)
			throw new Error(
				`Bucket ${bucketName} already exists. You must remove it before create the package`
			);
		await exec(`aws s3 mb s3://${bucketName}`);

		console.log(chalk.yellow('\nPacking the stack ...'.toUpperCase()));
		const { stdout } = await exec(
			`sam package --s3-bucket ${bucketName} --template-file ${BUILDED_CFN_STACK_TEMPLATE_PATH} --output-template-file ${CFN_PACKAGE_STACK_PATH}`
		);
		console.log(chalk.green(stdout));
	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();
