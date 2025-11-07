require("dotenv").config();
const AWS = require("aws-sdk");
const crypto = require("crypto");

AWS.config.update({ region: process.env.COGNITO_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

function generateSecretHash(username) {
    return crypto
        .createHmac("SHA256", process.env.COGNITO_CLIENT_SECRET)
        .update(username + process.env.COGNITO_CLIENT_ID)
        .digest("base64");
}

exports.signup = async (email, password) => {
    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
        SecretHash: generateSecretHash(email)
    };

    return cognito.signUp(params).promise();
};

exports.confirmUser = async (email, code) => {
    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        SecretHash: generateSecretHash(email)
    };

    return cognito.confirmSignUp(params).promise();
};

exports.login = async (email, password) => {
    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: generateSecretHash(email)
        }
    };

    return cognito.initiateAuth(params).promise();
};
