#!/usr/bin/env node

const util = require('util');
const chalk = require('chalk');
const { exec } = require('child_process');
const asyncExec = util.promisify(exec);
const paths = require('../config/paths');

const { BUILDED_CFN_STACK_TEMPLATE_PATH } = paths;

const LAMBDA_NETWORK_NAME = 'lambda-local';
const LOCAL_DYNAMODB_TABLE_NAME = 'serverless-api-db';

// Main function
(async function() {
	try {
		console.log(chalk.yellow('\nSetting up the docker network ...'.toUpperCase()));
		const netLs = await asyncExec(`docker network ls | grep ${LAMBDA_NETWORK_NAME}`);
		if (!netLs.stdout.includes(LAMBDA_NETWORK_NAME)) {
			const netCreate = await asyncExec(`docker network create ${LAMBDA_NETWORK_NAME}`);
			console.log(chalk.green(`Docker network ${netCreate.stdout} was created successfully`));
		}
		console.log(chalk.yellow('\nRunning DynamoDB locally ...'.toUpperCase()));
		const containerExist = await asyncExec(`docker ps --filter "name=dynamodb"`);
		if (containerExist.stdout.includes('dynamodb')) {
			await asyncExec(`docker stop dynamodb && docker rm dynamodb`);
		}
		await asyncExec(`docker run -d -p 8000:8000 --name=dynamodb --network=${LAMBDA_NETWORK_NAME} amazon/dynamodb-local`);

		console.log(chalk.yellow('\nCreating the testing table ...'.toUpperCase()));
		await asyncExec(
			`aws dynamodb create-table --table-name ${LOCAL_DYNAMODB_TABLE_NAME} --key-schema AttributeName=objectId,KeyType=HASH --attribute-definitions AttributeName=objectId,AttributeType=S --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --endpoint-url http://localhost:8000`
		);

		const tablesList = await asyncExec(`aws dynamodb list-tables --endpoint-url http://localhost:8000`);
		if (!tablesList.stdout.includes(LOCAL_DYNAMODB_TABLE_NAME))
			throw new Error(`Error creating the table ${LOCAL_DYNAMODB_TABLE_NAME}`);

		console.log(chalk.green(`Docker table ${LOCAL_DYNAMODB_TABLE_NAME} was created successfully`));

		console.log(chalk.yellow('\nStarting the API locally ...'.toUpperCase()));
		process.env['TABLE_NAME'] = LOCAL_DYNAMODB_TABLE_NAME;
		
		const startApiCmd = exec(`sam local start-api -t ${BUILDED_CFN_STACK_TEMPLATE_PATH} --docker-network ${LAMBDA_NETWORK_NAME}`);
		startApiCmd.stdout.pipe(process.stdout);
		startApiCmd.stderr.pipe(process.stdout);

	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();

['SIGINT', 'SIGTERM'].forEach(function(sig) {
	process.on(sig, function() {
		asyncExec(`docker stop dynamodb && docker rm dynamodb`).then(() => {
			process.exit();
		});
	});
});
