#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const paths = require('../config/paths');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { SAM_FOLDER_PATH, PACKAGE_FOLDER_PATH } = paths;

const PACKAGE_JSON_DEST_PATH = `${PACKAGE_FOLDER_PATH}/package.json`;
const PACKAGE_JSON_SOURCE_PATH = `${__dirname}/../package.json`;

// Delete a directory recursively
const deleteFolder = path => {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(file => {
			const curPath = `${path}/${file}`;
			if (fs.lstatSync(curPath).isDirectory()) {
				// recurse
				deleteFolder(curPath);
			} else {
				// delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

const cleanPackageFolder = () => {
	// Remove existing package folder
	deleteFolder(PACKAGE_FOLDER_PATH);

	// Create new package folder
	if (!fs.existsSync(SAM_FOLDER_PATH)) fs.mkdirSync(SAM_FOLDER_PATH);
	fs.mkdirSync(PACKAGE_FOLDER_PATH);
};

// Compile the code using the TypeScript compiler
const compileFunctionCode = () => exec(`tsc --outDir ${PACKAGE_FOLDER_PATH}`);

// Create the new manifest
const createManifest = () => {
	const packageJSONSrc = JSON.parse(
		fs.readFileSync(PACKAGE_JSON_SOURCE_PATH, 'utf8')
	);

	const ALLOWED_PROPERTIES = ['name', 'version', 'author', 'dependencies'];

	const packageJSONDest = Object.keys(packageJSONSrc).reduce(
		(json, key) => {
			if (ALLOWED_PROPERTIES.includes(key)) json[key] = packageJSONSrc[key];
			return json;
		},
		{ private: true }
	);

	fs.writeFileSync(
		PACKAGE_JSON_DEST_PATH,
		JSON.stringify(packageJSONDest, undefined, 4)
	);
};

// Main function
(async function() {
	try {
		console.log(
			chalk.yellow('\nCreating the project package ...'.toUpperCase())
		);
		cleanPackageFolder();
		createManifest();
		console.log(chalk.yellow('\nCompiling functions code...'.toUpperCase()));
		await compileFunctionCode();
	} catch (error) {
		console.log(chalk.red(error));
		process.exit(1);
	}
})();
