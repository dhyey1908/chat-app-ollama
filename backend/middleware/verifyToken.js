const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");
require("dotenv").config();

const poolRegion = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;

let pems;

async function getPems() {
    const url = `https://cognito-idp.${poolRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const { data } = await axios.get(url);
    const keys = data.keys;
    const p = {};
    keys.forEach((key) => {
        p[key.kid] = jwkToPem(key);
    });
    pems = p;
}

async function verifyToken(req, res, next) {
    if (!pems) await getPems();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Missing token" });
    }

    try {
        const decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
            throw new Error("Invalid JWT token");
        }

        const pem = pems[decodedJwt.header.kid];
        if (!pem) {
            throw new Error("Invalid token key");
        }

        jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: "Token verification failed" });
            }
            req.user = decoded;
            next();
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: err.message });
    }
}

module.exports = { verifyToken };
