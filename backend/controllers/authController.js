const { signup, confirmUser, login } = require("../service/authService");

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
    try {
        const { email, code } = req.body;
        await confirmUser(email, code);
        res.json({ message: "User verified successfully!" });
    } catch (err) {
        console.error("Confirm Error:", err);
        res.status(400).json({ error: mapCognitoError(err) });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await login(email, password);
        res.json(token);
    } catch (err) {
        console.error("Login Error:", err);
        res.status(401).json({ error: mapCognitoError(err) });
    }
};
