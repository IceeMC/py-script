import Script from "./Script";

/**
 * A extended error object.
 */
class ScriptError extends Error {
    /**
     * The traceback of what happened.
     * @type {string}
     */
    public traceback?: string;
    
    /**
     * The args that were passed when the script was created.
     */
    public args: string[];

    constructor(message: string, script: Script) {
        super(message);
        this.name = "ScriptError";
        this.args = script.options.args;
    }
}

export default ScriptError;