const path = require('path')
const rails = require('esbuild-rails')
const watch = process.argv.includes("--watch")
const production = process.argv.includes("production")
const esbuild = require("esbuild");

const buildOptions = {
  entryPoints: ["application.js"],
  bundle: true,
  outdir: path.join(process.cwd(), "app/assets/builds"),
  absWorkingDir: path.join(process.cwd(), "app/javascript"),
  plugins: [rails()],
  minify: production || process.env.RAILS_ENV !== "development",
  sourcemap: !production && process.env.RAILS_ENV === "development",
  loader: {
    '.css': 'css',
    '.scss': 'css',
    '.sass': 'css'
  },
  resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass'],
  nodePaths: [
    path.join(process.cwd(), "node_modules"),
    path.join(process.cwd(), "app/assets/stylesheets")
  ]
};

if (watch) {
  esbuild.context(buildOptions).then(ctx => ctx.watch());
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}