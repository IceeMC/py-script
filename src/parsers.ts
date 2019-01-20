import { createHash } from "crypto";

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

type Hashes = "RSA-MD4" | "RSA-MD5" | "RSA-MDC2" | "RSA-RIPEMD160" | "RSA-SHA1" |
    "RSA-SHA1-2" | "RSA-SHA224" | "RSA-SHA256" | "RSA-SHA384" | "RSA-SHA512" | "blake2b512" | "blake2s256" |
    "md4" | "md4WithRSAEncryption" | "md5" | "md5-sha1" | "md5WithRSAEncryption" | "mdc2" | "mdc2WithRSA" | "ripemd" |
    "ripemd160" | "ripemd160WithRSA" | "rmd160" | "sha1" | "sha1WithRSAEncryption" | "sha224" | "sha224WithRSAEncryption" |
    "sha256" | "sha256WithRSAEncryption" | "sha384" | "sha384WithRSAEncryption" | "sha512" | "sha512WithRSAEncryption" | "ssl3-md5" |
    "ssl3-sha1" | "whirlpool";

export type Parser = "raw" | "json" | "buffer" | "b64encode" | "b64decode" | Hashes;

const parsers =  {
    raw: (message: string) => message,
    json: (message: string): any => {
        let output: string;
        try {
            output =  JSON.parse(message);
        } catch (_) {
            output = message;
        }
        return output;
    },
    buffer: (message: string) => Buffer.from(message),
    b64encode: (message: string) => Buffer.from(message).toString("base64"),
    b64decode: (message: string) => Buffer.from(message, "base64").toString("utf8")
};

for (const hash of hashes) {
    Object.defineProperty(parsers.constructor.prototype, hash, {
        value: (message: string) => createHash(hash).update(message).digest("hex")
    });
}

export default Object.freeze(parsers);