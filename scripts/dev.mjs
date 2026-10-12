// Runs the API (with restart on change) and the Vite dev server together.
import { spawn } from 'node:child_process';
const run = (command, args) =>
  spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
const children = [
  run(process.execPath, [
    '--experimental-strip-types',
    '--disable-warning=ExperimentalWarning',
    '--watch-path=server',
    '--watch-path=src/domain',
    '--watch-path=src/application',
    'server/index.ts',
  ]),
  run('npx', ['vite']),
];
const stop = () => children.forEach((child) => child.kill('SIGTERM'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);
for (const child of children)
  child.on('exit', (code) => {
    stop();
    process.exitCode = code ?? 0;
  });
