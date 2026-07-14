import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ENTRY = path.resolve(__dirname, "../../server/index.ts");

export function serverCommand(): void {
  // Delegate to the server entry point via tsx so it works both from source
  // and after build (where dist/server/index.js is available instead).
  const tsx = path.resolve(__dirname, "../../node_modules/.bin/tsx");
  const child = spawn(tsx, [SERVER_ENTRY], { stdio: "inherit" });
  child.on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exitCode = 1;
  });
}
