import * as esbuild from 'esbuild';
import { writeFile, rm, readFile } from 'node:fs/promises';
import { basename } from 'node:path';

// MIDI.js shims are classic scripts that leak a top-level `var` as a browser global.
// esbuild scopes each module, so re-export that var as the CommonJS export — this is
// what the old webpack build's exports-loader did. Without it, MIDI.js's webaudio
// decoder gets an empty Base64Binary and soundfonts never finish loading.
const exposeMidiGlobal = {
  name: 'expose-midi-global',
  setup(build) {
    build.onLoad({ filter: /midi[\\/]inc[\\/]shim[\\/]Base64binary\.js$/ }, async (args) => {
      const src = await readFile(args.path, 'utf8');
      return { contents: `${src}\nmodule.exports = Base64Binary;\n`, loader: 'js' };
    });
  },
};

const serve = process.argv.includes('--serve');

await rm('dist', { recursive: true, force: true });

/** Inline SVG favicon: an eighth note on the app's indigo→violet gradient. */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
  </linearGradient></defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path fill="#fff" d="M20 7v11.2a3.5 3.5 0 1 1-2-3.16V10.5l-7 1.6v8.1a3.5 3.5 0 1 1-2-3.16V9.3l11-2.5z"/>
</svg>`;

/** Single source of truth for the HTML shell. Asset tags are injected after bundling. */
const html = ({ js, css }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
  <title>Ear Trainer</title>
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}" />
  <meta name="theme-color" content="#6366f1" />
  <meta name="color-scheme" content="light dark" />
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,700,800" rel="stylesheet">
  <link rel="stylesheet" href="./${css}">
</head>
<body>
  <div id="app"></div>
  <script src="./${js}"></script>
</body>
</html>
`;

const options = {
  entryPoints: ['src/app/index.tsx'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: ['es2018'],
  jsx: 'transform',
  loader: { '.png': 'file', '.gif': 'file', '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file', '.eot': 'file' },
  sourcemap: true,
  minify: !serve,
  metafile: true,
  entryNames: serve ? '[name]' : '[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  plugins: [exposeMidiGlobal],
};

// Write dist/index.html pointing at the freshly built (possibly hashed) entry assets.
const writeHtml = async (result) => {
  const outputs = Object.keys(result.metafile.outputs);
  const js = basename(outputs.find((f) => f.endsWith('.js')));
  const css = basename(outputs.find((f) => f.endsWith('.css')));
  await writeFile('dist/index.html', html({ js, css }));
};

if (serve) {
  const ctx = await esbuild.context({ ...options, plugins: [exposeMidiGlobal, {
    name: 'html', setup(b) { b.onEnd((r) => r.metafile && writeHtml(r)); },
  }] });
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: 'dist' });
  console.log(`ear-trainer dev server: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
} else {
  const result = await esbuild.build(options);
  await writeHtml(result);
  console.log('built to dist/');
}
