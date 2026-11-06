import { build } from 'esbuild';
await build({ entryPoints: ['src/main.js'], bundle: true, outfile: 'dist/app.js', format: 'iife', target: 'es2020', sourcemap: false, minify: true, logLevel: 'info' });
