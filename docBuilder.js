const Docma = require("docma");

Docma
    .create()
    .build({
        src: [
            "./out/Manager.js",
            "./out/Script.js",
            "./out/ScriptError.js"
        ],
        app: {
            title: "py-script documentation",
            base: "/"
        },
        dest: "./docs"
    })
    .catch(console.error);