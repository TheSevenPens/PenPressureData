// Wrapper: changes cwd to app/ so SvelteKit finds svelte.config.js,
// then runs the vite dev server as if launched from within app/.
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { chdir } from 'process';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, 'app');

chdir(appDir);

process.argv = [
	process.execPath,
	join(appDir, 'node_modules', 'vite', 'bin', 'vite.js'),
	'dev',
	'--port', '5999',
	'--strictPort',
	'--host', '127.0.0.1'
];

await import('./app/node_modules/vite/bin/vite.js');
