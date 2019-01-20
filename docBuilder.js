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
            base: "/py-script",
            routing: "query",
            server: Docma.ServerType.GITHUB
        },
        dest: "./docs"
    })
    .then(() => console.log("Documentation successfully built."))
    .catch(console.error);