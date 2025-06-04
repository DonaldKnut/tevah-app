"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyClerkToken = void 0;
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client = (0, jwks_rsa_1.default)({
    jwksUri: "https://clerk.dev/.well-known/jwks.json",
});
const verifyClerkToken = (token) => {
    return new Promise((resolve, reject) => {
        const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
        if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
            return reject(new Error("Invalid token header"));
        }
        const kid = decoded.header.kid;
        client.getSigningKey(kid, (err, key) => {
            if (err || !key)
                return reject(err || new Error("Signing key not found"));
            const signingKey = "getPublicKey" in key ? key.getPublicKey() : key.publicKey;
            jsonwebtoken_1.default.verify(token, signingKey, { algorithms: ["RS256"] }, (err, verified) => {
                if (err)
                    return reject(err);
                resolve(verified);
            });
        });
    });
};
exports.verifyClerkToken = verifyClerkToken;
