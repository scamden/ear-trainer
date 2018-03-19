// This file configures a web server for testing the production build
// on your local machine.

import browserSync from 'browser-sync';
import historyApiFallback from 'connect-history-api-fallback';
import { chalkProcessing } from './chalkConfig';

const isDemo = process.argv[2] === 'demo';

/* eslint-disable no-console */

console.log(chalkProcessing('Opening production build...'));

// Run Browsersync
browserSync({
  port: 8000,
  ui: {
    port: 8001
  },
  server: {
    baseDir: `dist/${isDemo ? 'demo' : 'main'}`
  },

  files: [
    'src/*.html'
  ],

  middleware: [historyApiFallback()]
});
