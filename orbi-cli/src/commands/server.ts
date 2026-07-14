import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ENTRY = path.resolve(__dirname, "../../server/index.ts");

export interface ServerCliOptions {
  port?: string;
}

export function serverCommand(options: ServerCliOptions = {}): void {
  // Delegate to the server entry point via tsx (it runs the .ts source in both
  // dev and after build). The server reads ORBI_PORT, so pass --port through it.
  const port = options.port ?? process.env.ORBI_PORT ?? "3000";
  const tsx = path.resolve(__dirname, "../../node_modules/.bin/tsx");
  const child = spawn(tsx, [SERVER_ENTRY], {
    stdio: "inherit",
    env: { ...process.env, ORBI_PORT: String(port) },
  });
  child.on("error", (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exitCode = 1;
  });
}
