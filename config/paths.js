// Set the project paths

const SAM_FOLDER_PATH = `${__dirname}/../aws-sam`;

exports.SAM_FOLDER_PATH = SAM_FOLDER_PATH;
exports.PACKAGE_FOLDER_PATH = `${SAM_FOLDER_PATH}/package`;
exports.BUILD_FOLDER_PATH = `${SAM_FOLDER_PATH}/build`;
exports.BUILDED_CFN_STACK_TEMPLATE_PATH = `${SAM_FOLDER_PATH}/build/template.yaml`;
exports.CFN_TEMPLATE_STACK_PATH = `${__dirname}/../serverless-api.cfn.yml`;
exports.CFN_PACKAGE_STACK_PATH = `${SAM_FOLDER_PATH}/serverless-api-xfm.cfn.yml`;
