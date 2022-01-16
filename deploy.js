const inquirer = require('inquirer');
const shell = require('shelljs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const YAML = require('js-yaml');
const dotenv = require('dotenv');

/**
 * These are the env vars that are required for deployment. Deploy script will make
 * sure these are set to prevent deploying with missing or incomplete .env file
 */ 
const requiredEnvVariables = [
    'APP_NAME',
    'IAM_PROFILE',
    'DOMAIN',
    'DEV_DOMAIN',
];


/**
 * Wrapper for list input inquirer.prompt()
 * @param {string} message
 * @param {string[]} choices
 */
async function listInput(message, choices) {
    const question = await inquirer.prompt({
        name: 'result',
        type: 'list',
        message,
        choices,
    });
    return question.result;
}


/**
 * Wrapper for input inquirer.prompt()
 * @param {string} message 
 * @param {'input' | 'password' | 'number'}
 */
async function input(message, type='input') {
    const question = await inquirer.prompt({
        name: 'result',
        type,
        message,
    });
    return question.result;
}


/**
 * Ask the user if they want to deploy to dev or prod
 * @returns {Promise<'dev' | 'prod'>} stage
 */
async function getStage() {
    const stage = await listInput('Specify deployment stage', ['dev', 'prod']);
    console.log(`Deploying to ${stage}`);
    if (stage === 'prod') {
        const prodVerificationAnswer = 'deploy to prod';
        console.warn('Warning! You are deploying to prod');
        const prodVerificationInput = await input(`Type \'${prodVerificationAnswer}\' to continue`);
        if (prodVerificationInput !== prodVerificationAnswer) {
            process.exit(1);
        }
    }
    return stage;
}


/**
 * Makes sure the user has created a .env file,
 * and creates generated.env if necessary
 */
async function loadEnvironmentVariables(filePath) {
    // Make sure we have all of the basic variables in .env
    dotenv.config({ path: '.env' });
    if (requiredEnvVariables.some(env => !process.env[env])) {
        console.error(`Missing environment variable ${env}. See Readme for required .env file format`);
        process.exit(1);
    }
    console.log(process.env.APP_NAME);

    // Make sure a 'generated.env' file has been created
    dotenv.config({ path: 'generated.env' });
    if (!process.env.HASHED_PASSWORD || !process.env.JWT_SECRET) {
        // Ask user to create an admin password and hash/salt it
        const newPassword = await input('Create a password for accessing api and dashboard', 'password');
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Create a new random key for JWT signing
        const jwtSecret = crypto.randomBytes(32).toString('hex');

        const generatedEnvVars = [
            `HASHED_PASSWORD=${hashedPassword}`,
            `JWT_SECRET=${jwtSecret}`,
        ];
        fs.writeFileSync('generated.env', generatedEnvVars.join('\n'));
        dotenv.config({ path: 'generated.env' });
    }
}


/**
 * Ask the user which serverless function they want to deploy
 * @returns {string} name of function (or 'All')
 */
async function getFunctionName() {
    try {
        const serverlessYmlContents = fs.readFileSync('serverless.yml');
        const serverlessYml = YAML.load(serverlessYmlContents);
        const functionList = Object.keys(serverlessYml.functions);
        const functionName = await listInput('Deploy which function?', ['All', ...functionList])
        return functionName;
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}


/**
 * Deletes the build folder
 */
function clearPreviousBuilds() {
    console.log('Clearing previous build');
    shell.rm('-r', 'build');
}


/**
 * Transpile the project
 */
function build() {
    console.log('Building');
    shell.exec('npm run build');
}


/**
 * Use serverless CLI to deploy to AWS
 */
function deploy(stage, functionName) {
    console.log('Deploying');
    shell.exec(`serverless deploy ${functionName === 'All' ? '' : 'function -f ' + functionName} --stage ${stage} --verbose`);
}


/**
 * Main entry point for the deployment script
 */
async function main() {
    const functionName = await getFunctionName();
    const stage = await getStage();
    await loadEnvironmentVariables();
    clearPreviousBuilds();
    build();
    deploy(stage, functionName);
}


main().then(() => process.exit(0));
