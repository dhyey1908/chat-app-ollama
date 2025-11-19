const { signup, confirmUser, login, exchangeCodeForTokens, forgotPassword, confirmForgotPassword, getUserId } = require("../service/authService");
const { mapCognitoError } = require("../utils/common");
const { addToken } = require('../service/tokenBlacklist');
const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

exports.signup = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
    }
    try {
        const { email, password } = req.body;
        const result = await signup(email, password);
        if (!result || result.success === false) {
            console.error('signup service returned error:', result && result.error);
            return res.status(500).json({ success: false, error: result?.error || 'Signup failed' });
        }
        res.json({ success: true, message: "Signup was successful." });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(400).json({ success: false, error: mapCognitoError(err) });
    }
};

exports.confirmUser = async (req, res) => {
    if (!req.body.email || !req.body.code) {
        return res.status(400).json({ success: false, error: "Email and code are required" });
    }
    try {
        const { email, code } = req.body;
        const result = await confirmUser(email, code);
        if (!result || result.success === false) {
            console.error('confirmUser service returned error:', result && result.error);
            return res.status(500).json({ success: false, error: result?.error || 'User confirmation failed' });
        }
        res.json({ success: true, data: result.data, message: result.message });
    } catch (err) {
        console.error("Confirm Error:", err);
        res.status(400).json({ success: false, error: mapCognitoError(err) });
    }
};

exports.login = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
    }
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        if (!result || result.success === false) {
            console.error('login service returned error:', result && result.error);
            return res.status(500).json({ success: false, error: result?.error || 'Login failed' });
        }
        const accessToken = result.data?.AuthenticationResult?.AccessToken;

        if (accessToken) {
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000,
            });
        } else {
            console.warn('Login succeeded but no access token present in authentication result', result);
        }

        res.json({ success: true, message: 'Login successful' });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(401).json({ success: false, error: mapCognitoError(err) });
    }
};

exports.googleToken = async (req, res) => {
    if (!req.body.code) {
        return res.status(400).json({ success: false, error: "Authorization code is required" });
    }
    try {
        const { code } = req.body;
        const result = await exchangeCodeForTokens(code);
        if (!result || result.success === false) {
            console.error('exchangeCodeForTokens service returned error:', result && result.error);
            return res.status(500).json({ success: false, error: result?.error || 'Failed to exchange authorization code' });
        }
        const accessToken = result?.data?.tokens?.access_token;
        if (accessToken) {
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000,
            });
        } else {
            console.warn('Login succeeded but no access token present in authentication result', result);
        }

        res.json({ success: true, data: { email: result.data.email }, message: 'Login successful' });
    } catch (err) {
        console.error("Google token exchange error:", err.response?.data || err);
        res.status(500).json({ success: false, error: "Failed to exchange authorization code" });
    }
};

exports.logout = async (req, res) => {
    try {
        let token = req.cookies?.access_token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            token = authHeader.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.decode(token);
                const exp = decoded?.exp;
                await addToken(token, exp);
            } catch (err) {
                console.error('Failed to decode token during logout:', err);
                await addToken(token);
            }
        }

        res.clearCookie('access_token', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
        });

        return res.json({ success: true, message: 'Logged out' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

exports.forgotPassword = async (req, res) => {
    if (!req.body.email) {
        return res.status(400).json({ error: "Email is required" });
    }
    try {
        const { email } = req.body;
        const result = await forgotPassword(email);
        if (!result || result.success === false) {
            console.error('forgotPassword service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Failed to initiate forgot password' });
        }
        res.json(result);
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: mapCognitoError(err) });
    }
};

exports.confirmForgotPassword = async (req, res) => {
    if (!req.body.email || !req.body.code || !req.body.newPassword) {
        return res.status(400).json({ error: "Email, code, and new password are required" });
    }
    try {
        const { email, code, newPassword } = req.body;
        const result = await confirmForgotPassword(email, code, newPassword);
        if (!result || result.success === false) {
            console.error('confirmForgotPassword service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Failed to confirm password reset' });
        }
        res.json(result);
    } catch (err) {
        console.error("Confirm Forgot Password Error:", err);
        res.status(500).json({ error: mapCognitoError(err) });
    }
};

exports.getUserId = async (req, res) => {
    try {
        const { email } = req.query;
        const result = await getUserId(email);
        if (!result || !result.success) {
            console.error('getUserId service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Failed to get user ID' });
        }
        res.json({ userId: result.data });
    } catch (err) {
        console.error('getUserId error:', err);
        res.status(500).json({ error: 'Failed to get user ID' });
    }
};
