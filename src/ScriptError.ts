import Script from "./Script";

/**
 * A extended error object.
 */
class ScriptError extends Error {
    /**
     * The python traceback.
     * @type {string}
     */
    public traceback?: string = null;

    /**
     * The args that were passed when the script was created.
     */
    public args: string[] = null;

    constructor(message: string, script: Script) {
        super(message);
        this.name = "ScriptError";
        this.args = script.options.args;
    }
}

export default ScriptError;