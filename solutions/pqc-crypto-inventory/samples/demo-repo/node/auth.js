const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });

function issue(user) {
  return jwt.sign({ sub: user }, privateKey, { algorithm: "RS256", expiresIn: "15m" });
}

function verify(token) {
  return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
}

const kem = crypto.generateKeyPairSync("ml-kem-768"); // pilot: post-quantum key exchange
module.exports = { issue, verify, kem };
