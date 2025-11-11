require("dotenv").config();
const AWS = require("aws-sdk");
const crypto = require("crypto");
const qs = require("qs");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const {
    CognitoIdentityProviderClient,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand
} = require("@aws-sdk/client-cognito-identity-provider");

AWS.config.update({ region: process.env.COGNITO_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION
});

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
        SecretHash: generateSecretHash(email),
    };
    return cognito.signUp(params).promise();
};

exports.confirmUser = async (email, code) => {
    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        SecretHash: generateSecretHash(email),
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
            SECRET_HASH: generateSecretHash(email),
        },
    };
    return cognito.initiateAuth(params).promise();
};

exports.exchangeCodeForTokens = async (code) => {
    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const tokenUrl = `https://${process.env.COGNITO_DOMAIN}/oauth2/token`;

        const requestBody = qs.stringify({
            grant_type: "authorization_code",
            client_id: process.env.COGNITO_CLIENT_ID,
            code,
            redirect_uri: process.env.REDIRECT_URI,
        });

        const basicAuth = Buffer.from(
            `${process.env.COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`
        ).toString("base64");

        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
        };

        const response = await axios.post(tokenUrl, requestBody, config);
        const decodedToken = jwt.decode(response.data.id_token);
        const email = decodedToken?.email;

        return {
            success: true,
            tokens: response.data,
            email: email
        };
    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};

exports.refreshTokens = async (refreshToken) => {
    try {
        const tokenUrl = `https://${process.env.COGNITO_DOMAIN}/oauth2/token`;

        const requestBody = qs.stringify({
            grant_type: "refresh_token",
            client_id: process.env.COGNITO_CLIENT_ID,
            refresh_token: refreshToken,
        });

        const response = await axios.post(tokenUrl, requestBody, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        return {
            success: true,
            tokens: response.data,
        };
    } catch (error) {
        console.error("Token refresh failed:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};

exports.forgotPassword = async (email) => {
    try {
        const command = new ForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            SecretHash: generateSecretHash(email)
        });

        const response = await client.send(command);

        return {
            success: true,
            message: "OTP sent to your email",
            data: response
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || error
        };
    }
};

exports.confirmForgotPassword = async (email, code, newPassword) => {
    try {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
            SecretHash: generateSecretHash(email)
        });

        await client.send(command);

        return {
            success: true,
            message: "Password reset successful"
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || error
        };
    }
};
