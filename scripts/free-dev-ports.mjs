import { execFileSync } from 'node:child_process';

const ports = process.argv.slice(2).length ? process.argv.slice(2) : ['4000', '4100'];

for (const port of ports) {
  const pids = findListeningPids(port);
  if (!pids.length) {
    console.log(`[ports] ${port} is free`);
    continue;
  }

  for (const pid of pids) {
    if (pid === process.pid) continue;
    stopProcess(pid, port);
  }
}

function findListeningPids(port) {
  try {
    const output = execFileSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return output
      .split('\n')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

function stopProcess(pid, port) {
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`[ports] stopped pid ${pid} on port ${port}`);
  } catch (error) {
    console.warn(`[ports] could not stop pid ${pid} on port ${port}: ${error.message}`);
    return;
  }

  wait(350);

  try {
    process.kill(pid, 0);
    process.kill(pid, 'SIGKILL');
    console.log(`[ports] force stopped pid ${pid} on port ${port}`);
  } catch {
    // Process already exited after SIGTERM.
  }
}

function wait(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
