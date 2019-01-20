"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A extended error object.
 */
class ScriptError extends Error {
    constructor(message, script) {
        super(message);
        this.name = "ScriptError";
        this.args = script.options.args;
    }
}
exports.default = ScriptError;
