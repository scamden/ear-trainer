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

/** Single source of truth for the HTML shell. Asset tags are injected after bundling. */
const html = ({ js, css }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
  <title>Ear Trainer</title>
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
