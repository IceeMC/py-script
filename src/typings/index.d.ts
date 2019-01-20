import { Parser } from "../parsers";
import { ManagerOptions, ScriptOptions, ScriptResult } from "../Manager";
import { EventEmitter } from "events";
import { ChildProcess } from "child_process";

declare module "py-script" {

    export function merge(def: any, mergeWith: any): any;

    export class Manager {
        public constructor(opts: ScriptOptions);
        
        public options: ManagerOptions;
        public rawOptions: ManagerOptions;
        public scriptOptions: ScriptOptions;
        public scripts: Script[];

        public runFile(path: string, options?: ScriptOptions): Script;
        public runCode(code: string, options?: ScriptOptions): Promise<ScriptResult>;
    }

    export class Script extends EventEmitter {
        public constructor(path: string, options: ScriptOptions, manager: Manager);
        
        private manager: Manager;
        public options: ScriptOptions;
        public path: string;
        public cProc: ChildProcess;
        public running: boolean;
        public tempScript: boolean;
        private _data: string;
        public parser: (message: string) => any;

        public on(event: string, listener: Function): this;
        public on(event: "nessage", listener: (message) => void): this;
        public on(event: "error", listener: (error: ScriptError) => void): this;

        public once(event: string, listener: Function): this;
        public once(event: "nessage", listener: (message) => void): this;
        public once(event: "error", listener: (error: ScriptError) => void): this;

        public command: string;
        public args: string;

        public handleMessage(data: string | Buffer): void;
        public handleError(data: string | Buffer): void;
        public exit(): this;
    }

    export class ScriptError extends Error {
        public constructor(message: string, script: Script);
        public traceback?: string;
        public args: string;
    }

    export {
        ManagerOptions,
        ScriptOptions,
        ScriptResult
    }

}