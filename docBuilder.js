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
        dest: "./docs",
        template: {
            path: "zebra",
            options: {
                title: {
                    label: "PyScript Docs",
                    href: "."
                },
                navbar: {

                }
            },
            sidebar: {
                enabled: true,
                outline: "tree",
                collapsed: false,
                toolbar: true,
                itemsFolded: false,
                itemsOverflow: "crop",
                badges: true,
                search: true,
                animations: true
            },
            navbar: {
                enabled: true,
                fixed: true,
                dark: true,
                menu: [
                   {
                        label: "GitHub",
                        iconClass: "fab fa-github",
                        href: "https://github.com/user/repo",
                        target: "_blank"
                    }
                ]
            }
        },
        clean: true
    })
    .then(() => console.log("Documentation successfully built."))
    .catch(console.error);