import { EventEmitter } from "events";
import { ChildProcess, spawn } from "child_process";
import Manager, { ScriptOptions } from "./Manager";
import { EOL } from "os";
import parsers from "./parsers";
import ScriptError from "./ScriptError";

const splitter = new RegExp(EOL, "g");

class Script extends EventEmitter {

    private manager: Manager;
    public rawOptions: ScriptOptions;
    public options: ScriptOptions;
    public path: string;
    public basePath: string;
    public cProc: ChildProcess;
    public running: boolean = true;
    public tempScript: boolean = false;
    private _data: string = "";
    public parser: (message: string) => any;

    public constructor(path: string, rawOptions: ScriptOptions, options: ScriptOptions, manager: Manager, tempScript: boolean = false) {
        super();
        if (!parsers[rawOptions.parser || options.parser] || !parsers[rawOptions.parser || manager.options.parser])
            throw new Error(`Unknown parser: ${options.parser}`);
        if (rawOptions.parser) { // Overwritten
            this.parser = parsers[rawOptions.parser];
        } else if (!rawOptions.parser) { // Not overwritten
            this.parser = parsers[manager.options.parser];
        }
        this.manager = manager;
        this.options = options;
        if (rawOptions.basePath) { // Base path overwritten
            this.basePath = rawOptions.basePath;
        } else { // Not overwritten
            this.basePath = process.cwd();
        }
        this.path = path;
        this.options = options;
        this.cProc = spawn(this.command, this.args);
        this.cProc.stdout.on("data", this.handleMessage.bind(this));
        this.cProc.stderr.on("data", this.handleError.bind(this));
        this.cProc.on("exit", (code, signal) => {
            this.running = false;
            this.emit("exit", code, signal);
        });
    }

    public get command() {
        return process.platform !== "win32" ? "python3" : "python";
    }

    public get args() {
        const bp = this.tempScript ?
            this.basePath.endsWith("/") ? this.basePath : `${this.basePath}/` :
            "";
        return [`${bp}${this.path}`, ...this.manager.options.globalArgs, ...this.options.args];
    }

    public handleMessage(data: string | Buffer) {
        let splits = data.toString().split(splitter);
        if (splits.length === 1) { // Incomplete data
            this._data += splits[0];
            return;
        }
        let last = splits.pop();
        splits[0] = this._data + splits[0];
        this._data = last;
        for (const split of splits) {
            this.emit("message", this.parser(split));
        }
    }

    public handleError(data: string | Buffer) {
        let splits = data.toString().split(splitter);
        if (splits.length === 1) { // Incomplete data
            this._data += splits[0];
            return;
        }
        let last = splits.pop();
        splits[0] = this._data + splits[0];
        this._data = last;
        let error: ScriptError;
        if (/^Traceback/.test(splits[0])) { // Handle a traceback
            error = new ScriptError(splits.pop(), this);
            error.traceback = splits.join(EOL);
            error.stack += `${EOL}    ---- Traceback ----    ${EOL}  `;
            error.stack += splits.slice(1).join(`${EOL}  `);
        } else {
            const err = splits.pop();
            error = new ScriptError(err, this);
            error.stack += `${EOL}    ---- ${err ? err.split(":")[0] : "Error"} ----    ${EOL}  `;
            error.stack += splits.join(`${EOL}  `);
        }
        this.emit("error", error);
    }

    public exit(): Script {
        this.cProc.kill("SIGTERM");
        this.running = false;
        this._data = "";
        const { scripts } = this.manager;
        const index = scripts.indexOf(this);
        if (index > -1) scripts.slice(index, 1);
        return this;
    }

}

export default Script;