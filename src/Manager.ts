import Script from "./Script";
import ScriptError from "./ScriptError";
import { Parser } from "./parsers";
import { writeFile, unlink } from "fs";
import { randomBytes } from "crypto";
import { promisify } from "util";
import { rejects } from "assert";

const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

class Manager {

    public options: ManagerOptions = {
        basePath: process.cwd(),
        globalArgs: ["-u"],
        parser: "raw"
    };
    public scriptOptions: ScriptOptions = {
        basePath: process.cwd(),
        args: [],
        parser: "raw"
    };
    public scripts: Script[];
    public constructor(opts?: ManagerOptions) {
        this.scripts = [];
        this.options = opts && typeof opts === "object" ?
            merge(this.options, opts) :
            this.options;
    }

    public runFile(path: string, options?: ScriptOptions): Script {
        if (!path) throw new Error("A script path must be provided.");
        const sOptions: ScriptOptions = options && typeof options === "object" ?
            merge(this.scriptOptions, options) :
            this.scriptOptions;
        const script = new Script(path, options || {}, sOptions, this);
        this.scripts.push(script);
        return script;
    }

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