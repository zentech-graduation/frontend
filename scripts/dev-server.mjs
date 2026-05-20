import { execSync, spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEV_PORT = 5173;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const shouldReset = process.argv.includes('--reset');

function run(command) {
  return execSync(`cmd.exe /d /s /c "${command}"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function getListeningPids(port) {
  try {
    const output = run(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`);

    return [...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/\s+/);
          return Number(parts.at(-1));
        })
        .filter((pid) => Number.isFinite(pid) && pid > 0)
    )];
  } catch {
    return [];
  }
}

function getProcessName(pid) {
  try {
    const output = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).trim();

    if (!output || output.startsWith('INFO:')) {
      return null;
    }

    const [imageName] = output.replace(/^"|"$/g, '').split('","');
    return imageName || null;
  } catch {
    return null;
  }
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function killPidTree(pid) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function ensureStablePort(port) {
  let pids = getListeningPids(port);

  if (pids.length === 0) {
    return;
  }

  console.log(`Port ${port} is in use by PID(s): ${pids.join(', ')}. Closing previous dev server(s)...`);

  for (const pid of pids) {
    killPidTree(pid);
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    pids = getListeningPids(port);

    if (pids.length === 0) {
      return;
    }

    for (const pid of pids) {
      killPidTree(pid);
    }

    sleep(200);
  }

  const remaining = getListeningPids(port);

  if (remaining.length > 0) {
    const processLabels = remaining.map((pid) => `${pid}${getProcessName(pid) ? ` (${getProcessName(pid)})` : ''}`);
    console.error(`Unable to free port ${port}. Still in use by: ${processLabels.join(', ')}`);
    process.exit(1);
  }
}

function resetDevArtifacts() {
  const viteCacheDir = path.join(projectRoot, 'node_modules', '.vite');
  const viteTempDir = path.join(projectRoot, '.vite-cache');
  const distDir = path.join(projectRoot, 'dist');

  rmSync(viteCacheDir, { recursive: true, force: true });
  rmSync(viteTempDir, { recursive: true, force: true });
  rmSync(distDir, { recursive: true, force: true });
}

if (shouldReset) {
  console.log('Resetting local dev artifacts...');
  resetDevArtifacts();
}

ensureStablePort(DEV_PORT);

const vite = spawn(
  'cmd.exe',
  ['/c', 'npx', 'vite', '--port', String(DEV_PORT), '--strictPort', '--configLoader', 'native'],
  {
    stdio: 'inherit',
    shell: false,
  }
);

vite.on('exit', (code) => {
  process.exit(code ?? 0);
});
