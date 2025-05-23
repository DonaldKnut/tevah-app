import jwksClient from "jwks-rsa";
import jwt, { JwtHeader } from "jsonwebtoken";

const client = jwksClient({
  jwksUri: "https://clerk.dev/.well-known/jwks.json",
});

export const verifyClerkToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      return reject(new Error("Invalid token header"));
    }

    const kid = (decoded.header as JwtHeader).kid;

    client.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error("Signing key not found"));

      const signingKey =
        "getPublicKey" in key ? key.getPublicKey() : (key as any).publicKey;

      jwt.verify(
        token,
        signingKey,
        { algorithms: ["RS256"] },
        (err, verified) => {
          if (err) return reject(err);
          resolve(verified);
        }
      );
    });
  });
};
