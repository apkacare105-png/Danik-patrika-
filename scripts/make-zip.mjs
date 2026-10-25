// उपयोग: npm run zip   ->  ../daily-insights.zip (node_modules, .next, .env को छोड़कर)
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { resolve, basename } from 'node:path';

const root = process.cwd();
const out = resolve(root, '..', `${basename(root)}.zip`);
const output = createWriteStream(out);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => console.log(`✔ ${out} (${(archive.pointer() / 1024).toFixed(0)} KB)`));
archive.on('error', (e) => { throw e; });
archive.pipe(output);
archive.glob('**/*', {
  cwd: root,
  dot: true,
  ignore: ['node_modules/**', '.next/**', '.env', '.env.local', '*.zip', '*.tsbuildinfo', 'next-env.d.ts', '.git/**'],
}, { prefix: basename(root) });
await archive.finalize();
// c