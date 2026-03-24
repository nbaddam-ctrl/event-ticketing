import { execSync } from 'node:child_process';

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

try {
  run('npm run lint --workspace backend');
  run('npm run lint --workspace frontend');
} catch {
  process.exit(1);
}
