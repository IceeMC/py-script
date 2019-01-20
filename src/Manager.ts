import Script from "./Script";
import ScriptError from "./ScriptError";
import { Parser } from "./parsers";
import { writeFile, unlink } from "fs";
import { randomBytes } from "crypto";
import { promisify } from "util";
import { rejects } from "assert";

const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

/**
 * A class for running scripts, running code, etc.
 * @example
 * const { Manager } = require("py-script");
 * const manager = new Manager();
 * ...
 */
class Manager {

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
     * A current array of scripts (so you can keep track of them.)
     * @type {Array<Script>}
     */
    public options: ManagerOptions = {
        basePath: process.cwd(),
        globalArgs: ["-u"],
        parser: "raw"
    };

    /**
     * The default options for Script instances.
     * @type {ScriptOptions}
     */
    public scriptOptions: ScriptOptions = {
        basePath: process.cwd(),
        args: [],
        parser: "raw"
    };

    /**
     * A current array of scripts (so you can keep track of them.)
     * @type {Array<Script>}
     */
    public scripts: Script[] = null;

    /**
     * @param {ManagerOptions} opts Options for the manager
     */
    public constructor(opts?: ManagerOptions) {
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
    public runFile(path: string, options?: ScriptOptions): Script {
        if (!path) throw new Error("A script path must be provided.");
        const sOptions: ScriptOptions = options && typeof options === "object" ?
            merge(this.scriptOptions, options) :
            this.scriptOptions;
        const script = new Script(path, options || {}, sOptions, this);
        this.scripts.push(script);
        return script;
    }

    /**
     * Runs code with the optional options.
     * @param {string} code The code to run.
     * @param {ScriptOptions} [options] The options for the script.
     * @example
     * // I'm assuming you have already defined the manager
     * const { results } = await manager.runCode("print(1)");
     * console.log(results[0]);
     * @returns {Promise<ScriptResult>}
     */
    public runCode(code: string, options?: ScriptOptions): Promise<ScriptResult> {
        return new Promise(async (resolve, reject) => {
            const file = await createTempFile(code || "").catch(() => reject("Missing directory access."));
            const sOptions: ScriptOptions = options && typeof options === "object" ?
                merge(this.scriptOptions, options) :
                this.scriptOptions;
            const results = [];
            const errors: ScriptError[] = [];
            const script = new Script(`${process.cwd()}/${file}`, options || {}, sOptions, this, true);
            script.on("message", message => results.push(message));
            script.on("error", error => errors.push(error));
            script.on("exit", async () => {
                await unlinkAsync(`${process.cwd()}/file`).catch(() => null);
                resolve(<ScriptResult> { results, errors });
            });
        });
    }

}

/**
 * Merges an object with another object.
 * @param {any} def The default object.
 * @param {any} mergeWith The object to merge with.
 */
export function merge(def, mergeWith) {
    const obj = {};
    for (let key in def) {
        obj[key] = !!mergeWith[key] ? mergeWith[key] : def[key];
    }
    return obj;
}

async function createTempFile(data: any): Promise<string> {
    const name = `temp_${randomBytes(3).toString("hex")}.py`;
    await writeFileAsync(name, data, { encoding: "utf-8" });
    return name;
}

export type ManagerOptions = {
    basePath?: string,
    globalArgs?: string[],
    parser?: Parser
}

export type ScriptOptions = {
    basePath?: string,
    args?: string[],
    parser?: Parser
}

export type ScriptResult = {
    results: any[],
    errors: ScriptError[]
}

export default Manager