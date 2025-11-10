require("dotenv").config();
const AWS = require("aws-sdk");
const crypto = require("crypto");
const qs = require("qs");
const axios = require("axios");

AWS.config.update({ region: process.env.COGNITO_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider();

function generateSecretHash(username) {
    return crypto
        .createHmac("SHA256", process.env.COGNITO_CLIENT_SECRET)
        .update(username + process.env.COGNITO_CLIENT_ID)
        .digest("base64");
}

// ✅ SIGN UP USER
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

// ✅ CONFIRM USER BY OTP
exports.confirmUser = async (email, code) => {
    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        SecretHash: generateSecretHash(email),
    };
    return cognito.confirmSignUp(params).promise();
};

// ✅ LOGIN WITH EMAIL + PASSWORD
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

// ✅ EXCHANGE GOOGLE CODE FOR TOKENS
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

        console.log('config: ', config);
        const response = await axios.post(tokenUrl, requestBody, config);

        console.log("✅ Token exchange success:", response.data);

        return {
            success: true,
            tokens: response.data,
        };
    } catch (error) {
        console.error("❌ Token exchange failed:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};

// ✅ REFRESH TOKEN WHEN EXPIRED
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
