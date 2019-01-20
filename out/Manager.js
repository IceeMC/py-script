"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Script_1 = require("./Script");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const util_1 = require("util");
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const unlinkAsync = util_1.promisify(fs_1.unlink);
class Manager {
    constructor(opts) {
        this.options = {
            basePath: process.cwd(),
            globalArgs: ["-u"],
            parser: "raw"
        };
        this.scriptOptions = {
            basePath: process.cwd(),
            args: [],
            parser: "raw"
        };
        this.scripts = [];
        this.options = opts && typeof opts === "object" ?
            merge(this.options, opts) :
            this.options;
    }
    runFile(path, options) {
        if (!path)
            throw new Error("A script path must be provided.");
        const sOptions = options && typeof options === "object" ?
            merge(this.scriptOptions, options) :
            this.scriptOptions;
        const script = new Script_1.default(path, options || {}, sOptions, this);
        this.scripts.push(script);
        return script;
    }
    runCode(code, options) {
        return new Promise(async (resolve, reject) => {
            const file = await createTempFile(code || "").catch(() => reject("Missing directory access."));
            const sOptions = options && typeof options === "object" ?
                merge(this.scriptOptions, options) :
                this.scriptOptions;
            const results = [];
            const errors = [];
            const script = new Script_1.default(`${process.cwd()}/${file}`, options || {}, sOptions, this, true);
            script.on("message", message => results.push(message));
            script.on("error", error => errors.push(error));
            script.on("exit", async () => {
                await unlinkAsync(`${process.cwd()}/${file}`).catch(() => null);
                resolve({ results, errors });
            });
        });
    }
}
function merge(def, mergeWith) {
    const obj = {};
    for (let key in def) {
        obj[key] = !!mergeWith[key] ? mergeWith[key] : def[key];
    }
    return obj;
}
exports.merge = merge;
async function createTempFile(data) {
    const name = `temp_${crypto_1.randomBytes(3).toString("hex")}.py`;
    await writeFileAsync(name, data, { encoding: "utf-8" });
    return name;
}
exports.default = Manager;
