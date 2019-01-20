"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const child_process_1 = require("child_process");
const os_1 = require("os");
const parsers_1 = require("./parsers");
const ScriptError_1 = require("./ScriptError");
const splitter = new RegExp(os_1.EOL, "g");
class Script extends events_1.EventEmitter {
    constructor(path, rawOptions, options, manager, tempScript = false) {
        super();
        this.running = true;
        this.tempScript = false;
        this._data = "";
        if (!parsers_1.default[rawOptions.parser || options.parser] || !parsers_1.default[rawOptions.parser || manager.options.parser])
            throw new Error(`Unknown parser: ${options.parser}`);
        if (rawOptions.parser) {
            this.parser = parsers_1.default[rawOptions.parser];
        }
        else if (!rawOptions.parser) {
            this.parser = parsers_1.default[manager.options.parser];
        }
        this.manager = manager;
        this.options = options;
        if (rawOptions.basePath) {
            this.basePath = rawOptions.basePath;
        }
        else {
            this.basePath = process.cwd();
        }
        this.path = path;
        this.options = options;
        this.cProc = child_process_1.spawn(this.command, this.args);
        this.cProc.stdout.on("data", this.handleMessage.bind(this));
        this.cProc.stderr.on("data", this.handleError.bind(this));
        this.cProc.on("exit", (code, signal) => {
            this.running = false;
            this.emit("exit", code, signal);
        });
    }
    get command() {
        return process.platform !== "win32" ? "python3" : "python";
    }
    get args() {
        const bp = this.tempScript ?
            this.basePath.endsWith("/") ? this.basePath : `${this.basePath}/` :
            "";
        return [`${bp}${this.path}`, ...this.manager.options.globalArgs, ...this.options.args];
    }
    handleMessage(data) {
        let splits = data.toString().split(splitter);
        if (splits.length === 1) {
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
    handleError(data) {
        let splits = data.toString().split(splitter);
        if (splits.length === 1) {
            this._data += splits[0];
            return;
        }
        let last = splits.pop();
        splits[0] = this._data + splits[0];
        this._data = last;
        let error;
        if (/^Traceback/.test(splits[0])) {
            error = new ScriptError_1.default(splits.pop(), this);
            error.traceback = splits.join(os_1.EOL);
            error.stack += `${os_1.EOL}    ---- Traceback ----    ${os_1.EOL}  `;
            error.stack += splits.slice(1).join(`${os_1.EOL}  `);
        }
        else {
            const err = splits.pop();
            error = new ScriptError_1.default(err, this);
            error.stack += `${os_1.EOL}    ---- ${err ? err.split(":")[0] : "Error"} ----    ${os_1.EOL}  `;
            error.stack += splits.join(`${os_1.EOL}  `);
        }
        this.emit("error", error);
    }
    exit() {
        this.cProc.kill("SIGTERM");
        this.running = false;
        this._data = "";
        const { scripts } = this.manager;
        const index = scripts.indexOf(this);
        if (index > -1)
            scripts.slice(index, 1);
        return this;
    }
}
exports.default = Script;
