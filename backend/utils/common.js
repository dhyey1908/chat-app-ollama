exports.mapCognitoError = (err) => {
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