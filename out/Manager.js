"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Script_1 = require("./Script");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const util_1 = require("util");
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const unlinkAsync = util_1.promisify(fs_1.unlink);
/**
 * @typedef {object} ManagerOptions
 * @property {string} [basePath] The path where scripts are executed from.
 * @property {string[]} [globalArgs] Global python command-line argument.
 * @property {string} [parser] The parser used to parse incoming messages.
 */
/**
 * @typedef {object} ScriptOptions
 * @property {string} [basePath] The path where the script will be executed from.
 * @property {string[]} [args] Optional command line arguments.
 * @property {string} [parser] The optional parser used to parse incoming messages (this overwrites the default parser, if set.)
 */
/**
 * @typedef {object} ScriptResult
 * @property {any[]} results An array of parsed messages.
 * @property {ScriptError[]} errors An array of errors that occurred when executing the script.
 */
/**
 * A class for running scripts, running code, etc.
 * @example
 * const { Manager } = require("py-script");
 * const manager = new Manager();
 * // Do something with the manager instance below.
 */
class Manager {
    /**
     * @param {ManagerOptions} opts Options for the manager
     */
    constructor(opts) {
        /**
         * A current array of scripts (so you can keep track of them.)
         * @type {Array<Script>}
         */
        this.options = {
            basePath: process.cwd(),
            globalArgs: ["-u"],
            parser: "raw"
        };
        /**
         * The default options for Script instances.
         * @type {ScriptOptions}
         */
        this.scriptOptions = {
            basePath: process.cwd(),
            args: [],
            parser: "raw"
        };
        /**
         * A current array of scripts (so you can keep track of them.)
         * @type {Array<Script>}
         */
        this.scripts = null;
        this.scripts = [];
        this.options = opts && typeof opts === "object" ?
            merge(this.options, opts) :
            this.options;
    }
    /**
     * Runs a file with the provided path and options.
     * @param {string} path The path of the script (joined with the base path.)
     * @param {ScriptOptions} options Options for the script.
     * @returns {Script}
     */
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
    /**
     * Runs code with the optional options.
     * @param {string} code The code to run.
     * @param {ScriptOptions} [options] The options for the script.
     * @example
     * // This example assumes you have already defined the manager.
     * const { results } = await manager.runCode("print(1)");
     * console.log(results[0]);
     * @returns {Promise<ScriptResult>}
     */
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
                await unlinkAsync(`${process.cwd()}/file`).catch(() => null);
                resolve({ results, errors });
            });
        });
    }
}
/**
 * Merges an object with another object.
 * @param {any} def The default object.
 * @param {any} mergeWith The object to merge with.
 * @returns {any}
 */
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
