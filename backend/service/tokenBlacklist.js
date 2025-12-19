const db = require("../db/connection");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function decodeExp(token) {
    const decoded = jwt.decode(token);
    return decoded?.exp || null;
}

async function addToken(token, exp) {
    if (!token) return;

    const expiry =
        typeof exp === "number"
            ? exp
            : decodeExp(token) || Math.floor(Date.now() / 1000) + 3600; // fallback 1 hour

    const tokenHash = hashToken(token);

    try {
        await db.query(
            "INSERT INTO token_blacklist (token_hash, expiry) VALUES (?, ?) ON DUPLICATE KEY UPDATE expiry = VALUES(expiry)",
            [tokenHash, expiry]
        );
    } catch (err) {
        console.error("Error adding token to blacklist:", err.message);
    }
}

async function isBlacklisted(token) {
    if (!token) return false;

    const tokenHash = hashToken(token);
    const now = Math.floor(Date.now() / 1000);

    try {
        const [rows] = await db.query(
            "SELECT expiry FROM token_blacklist WHERE token_hash = ? AND expiry > ?",
            [tokenHash, now]
        );

        if (rows.length > 0) {
            return true;
        }

        // Clean up expired tokens
        await db.query(
            "DELETE FROM token_blacklist WHERE expiry <= ?",
            [now]
        );

        return false;
    } catch (err) {
        console.error("Error checking token blacklist:", err.message);
        return false;
    }
}

module.exports = { addToken, isBlacklisted };
