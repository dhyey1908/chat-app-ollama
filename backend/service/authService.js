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

const db = require("../db/connection");

AWS.config.update({ region: process.env.COGNITO_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION
});

function generateSecretHash(username) {
    try {
        return crypto
            .createHmac("SHA256", process.env.COGNITO_CLIENT_SECRET)
            .update(username + process.env.COGNITO_CLIENT_ID)
            .digest("base64");
    } catch (err) {
        console.error("Secret hash generation failed:", err);
        throw new Error("Internal error generating secret hash");
    }
}

exports.signup = async (email, password) => {
    try {
        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
            SecretHash: generateSecretHash(email),
        };
        const response = await cognito.signUp(params).promise();
        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Signup Service Error:", error);
        return {
            success: false,
            error: error?.message || error || "Signup failed",
        };
    }
};

exports.confirmUser = async (email, code) => {
    try {
        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            SecretHash: generateSecretHash(email),
        };

        await cognito.confirmSignUp(params).promise();

        const [existing] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return {
                success: true,
                message: "User already exists in database.",
                data: existing[0],
            };
        }

        await db.query(
            "INSERT INTO users (id, email, created_at) VALUES (UUID(), ?, NOW())",
            [email]
        );

        const [newUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        return {
            success: true,
            message: "User confirmed and added to database successfully!",
            data: newUser[0],
        };
    } catch (error) {
        console.error("Confirm User Error:", error);
        return {
            success: false,
            error: error.message || "Failed to confirm user",
        };
    }
};

exports.login = async (email, password) => {
    try {
        const params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: generateSecretHash(email),
            },
        };
        const response = await cognito.initiateAuth(params).promise();
        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Login Service Error:", error);
        return {
            success: false,
            error: error?.message || error || "Login failed",
        };
    }
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
            data: {
                tokens: response.data,
                email: email
            }
        };
    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message || "Failed to exchange token",
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
            data: response.data,
        };
    } catch (error) {
        console.error("Token refresh failed:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message || "Failed to refresh token",
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
        console.error("Forgot Password Error:", error);
        return {
            success: false,
            error: error.message || "Failed to initiate forgot password",
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
        console.error("Confirm Forgot Password Error:", error);
        return {
            success: false,
            error: error.message || "Failed to confirm forgot password",
        };
    }
};

exports.getUserId = async (email) => {
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        const id = rows.length > 0 ? rows[0].id : null;
        return { success: true, data: id };
    } catch (error) {
        console.error('getUserId Service Error:', error);
        return { success: false, error: error?.message || 'Failed to get user id' };
    }
};
