const { signup, confirmUser, login, exchangeCodeForTokens, forgotPassword, confirmForgotPassword } = require("../service/authService");

const mapCognitoError = (err) => {
    if (!err || !err.code) return "Something went wrong. Please try again.";

    switch (err.code) {
        case "UsernameExistsException":
            return "Email already registered. Please login instead.";
        case "InvalidPasswordException":
            return "Password does not meet security requirements.";
        case "InvalidParameterException":
            return "Invalid input. Please check your details.";
        case "CodeMismatchException":
            return "Incorrect verification code. Please try again.";
        case "ExpiredCodeException":
            return "Verification code expired. Request a new one.";
        case "UserNotFoundException":
            return "User not found. Please signup first.";
        case "NotAuthorizedException":
            return "Invalid email or password.";
        case "UserNotConfirmedException":
            return "Please verify your email before login.";
        case "TooManyFailedAttemptsException":
            return "Too many failed attempts. Please try later.";
        default:
            return err.message || "Unexpected error occurred.";
    }
};

exports.signup = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    try {
        const { email, password } = req.body;
        await signup(email, password);
        res.json({ message: "Signup success! Check Email for OTP." });
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
        const token = await login(email, password);
        res.json(token);
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
        const tokens = await exchangeCodeForTokens(code);
        res.json(tokens);
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
        res.json(result);
    } catch (err) {
        console.error("Confirm Forgot Password Error:", err);
        res.status(500).json({ error: mapCognitoError(err) });
    }
};