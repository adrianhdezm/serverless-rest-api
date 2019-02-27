#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const paths = require('../config/paths');
const chalk = require('chalk');

// Checking dependencies ...
const checkDependencies = async () => {
	const awsPath = await exec(`command -v aws`);
	if (!awsPath.stdout.includes('aws'))
		throw new Error('AWS CLI is not installed');
	console.log(chalk.green('AWS CLI is installed'));

	const samPath = await exec(`command -v sam`);
	if (!samPath.stdout.includes('sam'))
		throw new Error('SAM CLI is not installed');
	console.log(chalk.green('SAM CLI is installed'));

	const awsAccountId = await exec(
		'aws sts get-caller-identity --query Account --output=text'
	);
	if (!/^[0-9]+$/.test(awsAccountId.stdout.trim()))
		throw new Error('Invalid AWS Account ID');
};

const {
	BUILD_FOLDER_PATH,
	PACKAGE_FOLDER_PATH,
	CFN_TEMPLATE_STACK_PATH
} = paths;

// Main function
(async function() {
	try {
		console.log(chalk.yellow('\nChecking dependencies ...'.toUpperCase()));
		await checkDependencies();
		console.log(chalk.yellow('\nBuilding template ...'.toUpperCase()));
		const { stdout } = await exec(
			`sam build -b ${BUILD_FOLDER_PATH} -s ${PACKAGE_FOLDER_PATH} -t ${CFN_TEMPLATE_STACK_PATH}`
		);
		console.log(chalk.green(stdout));
	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();
