/** Minimal leveled logger with agent-scoped prefixes. No external deps. */

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

function paint(color: keyof typeof COLORS, text: string): string {
  return useColor ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

export const logger = {
  info(msg: string): void {
    console.log(msg);
  },
  step(msg: string): void {
    console.log(paint("cyan", `▸ ${msg}`));
  },
  agent(name: string, msg: string): void {
    console.log(`${paint("blue", `[${name}]`)} ${msg}`);
  },
  success(msg: string): void {
    console.log(paint("green", `✓ ${msg}`));
  },
  warn(msg: string): void {
    console.warn(paint("yellow", `! ${msg}`));
  },
  error(msg: string): void {
    console.error(paint("red", `✗ ${msg}`));
  },
  dim(msg: string): void {
    console.log(paint("dim", msg));
  },
};
