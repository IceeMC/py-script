"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A extended error object.
 */
class ScriptError extends Error {
    constructor(message, script) {
        super(message);
        /**
         * The python traceback.
         * @type {string}
         */
        this.traceback = null;
        /**
         * The args that were passed when the script was created.
         */
        this.args = null;
        this.name = "ScriptError";
        this.args = script.options.args;
    }
}
exports.default = ScriptError;
