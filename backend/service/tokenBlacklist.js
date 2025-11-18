const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const filePath = path.join(__dirname, "..", "json", "blacklist.json");

let blacklist = {};
if (fs.existsSync(filePath)) {
    try {
        blacklist = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        console.error("⚠️ Could not read blacklist.json, starting fresh:", err.message);
        blacklist = {};
    }
}

function saveToFile() {
    fs.writeFileSync(filePath, JSON.stringify(blacklist, null, 2));
}

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

    const key = hashToken(token);
    blacklist[key] = expiry;

    saveToFile();
}

async function isBlacklisted(token) {
    if (!token) return false;

    const key = hashToken(token);
    const expiry = blacklist[key];
    if (!expiry) return false;

    const now = Math.floor(Date.now() / 1000);

    if (expiry <= now) {
        delete blacklist[key];
        saveToFile();
        return false;
    }

    return true;
}

module.exports = { addToken, isBlacklisted };
