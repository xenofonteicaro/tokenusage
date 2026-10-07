import { build } from "esbuild";

// Ink only loads react-devtools-core when DEV=true; the stub keeps the bundle
// self-contained so it runs without node_modules next to it.
const stubDevtools = {
  name: "stub-react-devtools",
  setup(builder) {
    builder.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: "react-devtools-core",
      namespace: "stub",
    }));
    builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: "export default { connectToDevTools() {} };",
      loader: "js",
    }));
  },
};

await build({
  entryPoints: ["src/tui/main.tsx"],
  outfile: "dist/tui.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [stubDevtools],
  // Some bundled CommonJS dependencies still call require().
  banner: {
    js: 'import { createRequire as __tokenusageRequire } from "node:module"; const require = __tokenusageRequire(import.meta.url);',
  },
  logLevel: "info",
});
