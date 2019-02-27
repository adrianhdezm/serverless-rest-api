#!/usr/bin/env node

const util = require('util');
const chalk = require('chalk');
const exec = util.promisify(require('child_process').exec);
const paths = require('../config/paths');
const { getProjectName } = require('../config/utils');

const { CFN_PACKAGE_STACK_PATH } = paths;

// Main function
(async function() {
	try {
		console.log(chalk.yellow('\nDeploying the stack ...'.toUpperCase()));
		const stackName = getProjectName();
		const { stdout } = await exec(
			`sam deploy --template-file ${CFN_PACKAGE_STACK_PATH} --stack-name ${stackName} --capabilities CAPABILITY_NAMED_IAM`
		);
		console.log(chalk.green(stdout));
	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();
