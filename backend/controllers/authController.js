const { signup, confirmUser, login, exchangeCodeForTokens, forgotPassword, confirmForgotPassword, getUserId } = require("../service/authService");
const { mapCognitoError } = require("../utils/common");

exports.signup = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const { email, password } = req.body;
        const result = await signup(email, password);
        if (!result || result.success === false) {
            console.error('signup service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Signup failed' });
        }
        res.json(result);
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(400).json({ error: mapCognitoError(err) });
    }
};

exports.confirmUser = async (req, res) => {
    if (!req.body.email || !req.body.code) {
        return res.status(400).json({ error: "Email and code are required" });
    }
    try {
        const { email, code } = req.body;
        const result = await confirmUser(email, code);
        if (!result || result.success === false) {
            console.error('confirmUser service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'User confirmation failed' });
        }
        res.json(result);
    } catch (err) {
        console.error("Confirm Error:", err);
        res.status(400).json({ error: mapCognitoError(err) });
    }
};

exports.login = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        if (!result || result.success === false) {
            console.error('login service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Login failed' });
        }
        const accessToken = result.data?.AuthenticationResult?.AccessToken;

        if (accessToken) {
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000,
            });
        } else {
            console.warn('Login succeeded but no access token present in authentication result', result);
        }

        res.json(result);
    } catch (err) {
        console.error("Login Error:", err);
        res.status(401).json({ error: mapCognitoError(err) });
    }
};

exports.googleToken = async (req, res) => {
    if (!req.body.code) {
        return res.status(400).json({ error: "Authorization code is required" });
    }
    try {
        const { code } = req.body;
        const result = await exchangeCodeForTokens(code);
        if (!result || result.success === false) {
            console.error('exchangeCodeForTokens service returned error:', result && result.error);
            return res.status(500).json({ error: result?.error || 'Failed to exchange authorization code' });
        }
        res.json(result);
    } catch (err) {
        console.error("Google token exchange error:", err.response?.data || err);
        res.status(500).json({ error: "Failed to exchange authorization code" });
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