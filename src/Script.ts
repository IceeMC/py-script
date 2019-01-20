import { EventEmitter } from "events";
import { ChildProcess, spawn } from "child_process";
import Manager, { ScriptOptions } from "./Manager";
import { EOL } from "os";
import parsers from "./parsers";
import ScriptError from "./ScriptError";

const splitter = new RegExp(EOL, "g");

/**
 * Represents a script.
 * @extends {EventEmitter}
 */
class Script extends EventEmitter {

    /**
     * The manager that was used when creating the instance.
     * @private
     * @type {Manager}
     */
    private manager: Manager = null;
    
    /**
     * The options when the script was initialized.
     * @type {ScriptOptions}
     */
    public options: ScriptOptions = null;
    
    /**
     * The path to the file.
     * @type {string}
     */
    public path: string = null;
    
    /**
     * The base path used.
     */
    public basePath: string = null;
    
    /**
     * The ChildProcess instance.
     * @type {ChildProcess}
     * @private
     */
    private cProc: ChildProcess = null;
    
    /**
     * A boolean determining if the script is running.
     * @type {boolean}
     */
    public running: boolean = true;
    
    /**
     * If the script is temporary (invoked by Manager#runCode)
     */
    public tempScript: boolean = false;
    
    /**
     * The received data chunks as a string (resets every so often).
     * @type {string}
     * @private
     */
    private _data: string = "";

    /**
     * The data parser.
     * @type {Function<any>}
     */
    private parser: (message: string) => any;

    public constructor(path: string, rawOptions: ScriptOptions, options: ScriptOptions, manager: Manager, tempScript: boolean = false) {
        super();
        this.tempScript = tempScript;
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
            /**
             * Emitted when the child process exited.
             * @param {number} code The exit code.
             * @param {string?} signal The exit signal.
             */
            this.emit("exit", code, signal);
        });
    }

    /**
     * The command to use.
     * @type {string}
     */
    public get command() {
        return process.platform !== "win32" ? "python3" : "python";
    }

    /**
     * The ChildProcesses spawn args.
     * @type {string[]}
     */
    public get args() {
        const bp = !this.tempScript ?
            this.basePath.endsWith("/") ? this.basePath : `${this.basePath}/` :
            "";
        return [`${bp}${this.path}`, ...this.manager.options.globalArgs, ...this.options.args];
    }

    /**
     * Handles a message internally.
     * @param {string | Buffer} data The data chunk
     */
    private handleMessage(data: string | Buffer) {
        let splits = data.toString().split(splitter);
        if (splits.length === 1) { // Incomplete data
            this._data += splits[0];
            return;
        }
        let last = splits.pop();
        splits[0] = this._data + splits[0];
        this._data = last;
        for (const split of splits) {
            /**
             * Emitted when a message is received.
             * @event Script#message
             * @param {any} message The parsed message.
             */
            this.emit("message", this.parser(split));
        }
    }

    /**
     * Handles a error internally (emitting the message event.)
     * @param {string | Buffer} data The data chunk.
     */
    private handleError(data: string | Buffer) {
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
        /**
         * Emitted when an error occurs.
         * @event Script#error
         * @param {ScriptError} error The error that was encountered.
         */
        this.emit("error", error);
    }

    /**
     * Starts the exit sequence, and returns the script.
     * @returns {Script}
     */
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