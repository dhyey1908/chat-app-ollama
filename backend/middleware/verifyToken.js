const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");
require("dotenv").config();

const poolRegion = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;

let pems;

async function getPems() {
    if (pems) return pems;

    const url = `https://cognito-idp.${poolRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const { data } = await axios.get(url);
    const keys = data.keys;

    const tempPems = {};
    keys.forEach((key) => {
        tempPems[key.kid] = jwkToPem(key);
    });

    pems = tempPems;
    return pems;
}

async function verifyToken(req, res, next) {
    try {
        if (!pems) await getPems();

        let token = req.cookies?.access_token;

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Missing authentication token",
            });
        }

        const decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
            return res.status(401).json({
                success: false,
                message: "Invalid JWT token",
            });
        }

        const pem = pems[decodedJwt.header.kid];
        if (!pem) {
            return res.status(401).json({
                success: false,
                message: "Invalid token key",
            });
        }

        jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Token verification failed",
                });
            }

            req.user = decoded;
            next();
        });
    } catch (err) {
        console.error("Token verification error:", err);
        return res.status(401).json({
            success: false,
            message: err.message || "Unauthorized",
        });
    }
}

module.exports = { verifyToken };
