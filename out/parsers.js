"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const hashes = [
    "RSA-MD4",
    "RSA-MD5",
    "RSA-MDC2",
    "RSA-RIPEMD160",
    "RSA-SHA1",
    "RSA-SHA1-2",
    "RSA-SHA224",
    "RSA-SHA256",
    "RSA-SHA384",
    "RSA-SHA512",
    "blake2b512",
    "blake2s256",
    "md4",
    "md4WithRSAEncryption",
    "md5",
    "md5-sha1",
    "md5WithRSAEncryption",
    "mdc2",
    "mdc2WithRSA",
    "ripemd",
    "ripemd160",
    "ripemd160WithRSA",
    "rmd160",
    "sha1",
    "sha1WithRSAEncryption",
    "sha224",
    "sha224WithRSAEncryption",
    "sha256",
    "sha256WithRSAEncryption",
    "sha384",
    "sha384WithRSAEncryption",
    "sha512",
    "sha512WithRSAEncryption",
    "ssl3-md5",
    "ssl3-sha1",
    "whirlpool"
];
const parsers = {
    raw: (message) => message,
    json: (message) => {
        let output;
        try {
            output = JSON.parse(message);
        }
        catch (_) {
            output = message;
        }
        return output;
    },
    buffer: (message) => Buffer.from(message),
    b64encode: (message) => Buffer.from(message).toString("base64"),
    b64decode: (message) => Buffer.from(message, "base64").toString("utf8")
};
for (const hash of hashes) {
    Object.defineProperty(parsers.constructor.prototype, hash, {
        value: (message) => crypto_1.createHash(hash).update(message).digest("hex")
    });
}
exports.default = Object.freeze(parsers);
