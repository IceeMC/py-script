import Script from "./Script";

class ScriptError extends Error {
    traceback?: string;
    args: string[];
    constructor(message: string, script: Script) {
        super(message);
        this.name = "ScriptError";
        this.args = script.options.args;
    }
}

export default ScriptError;