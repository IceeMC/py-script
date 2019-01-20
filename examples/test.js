const { Manager } = require("../out/index.js");
const manager = new Manager({ basePath: `${process.cwd()}/tests/scripts/` });
async function main() {
    const code = `
message = "Hello, world!";
for char in message:
    print(char)
    `.trim();
    const result = await manager.runFile(code);
    console.log(result);
}
main();